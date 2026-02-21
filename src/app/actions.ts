"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT =
  "You are a calm narrative pattern detector. Identify recurring emotional themes, repeated words, or subtle tensions across the user's journal entries. Reflect patterns clearly and concisely. Do not give advice. Do not predict outcomes. Do not moralize. Keep tone grounded, observant, and spacious.";

function trimToMaxWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text.trim();
  }
  return words.slice(0, maxWords).join(" ").trim();
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function createEntry(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const answer_1 = String(formData.get("answer_1") || "").trim();
  const answer_2 = String(formData.get("answer_2") || "").trim();
  const answer_3 = String(formData.get("answer_3") || "").trim();

  const today = getTodayDate();

  await supabase.from("entries").upsert(
    {
      user_id: user.id,
      date: today,
      answer_1,
      answer_2,
      answer_3,
    },
    { onConflict: "user_id,date" }
  );

  revalidatePath("/dashboard");
  revalidatePath("/today");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function generateWeeklyReflection() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!process.env.OPENAI_API_KEY) {
    return;
  }

  const { data: entries } = await supabase
    .from("entries")
    .select("date, answer_1, answer_2, answer_3")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(7);

  if (!entries || entries.length === 0) {
    return;
  }

  const ordered = [...entries].reverse();
  const weekStart = ordered[0]?.date ?? getTodayDate();

  const { data: existingReflection } = await supabase
    .from("reflections")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existingReflection) {
    return;
  }

  const entriesText = ordered
    .map((entry, index) => {
      return [
        `Entry ${index + 1} (${entry.date}):`,
        `- What stood out today? ${entry.answer_1 || "(blank)"}`,
        `- What felt subtly meaningful? ${entry.answer_2 || "(blank)"}`,
        `- What decision are you sensing but not acting on? ${
          entry.answer_3 || "(blank)"
        }`,
      ].join("\n");
    })
    .join("\n\n");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Here are the last seven entries. Write a 150-250 word reflection that follows the system instructions.\n\n" +
          entriesText,
      },
    ],
    max_output_tokens: 400,
  });

  const reflection = response.output_text?.trim();

  if (reflection) {
    const trimmed = trimToMaxWords(reflection, 250);

    await supabase.from("reflections").insert({
      user_id: user.id,
      week_start: weekStart,
      content: trimmed,
    });

    revalidatePath("/dashboard");
  }
}
