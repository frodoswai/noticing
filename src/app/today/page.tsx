import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createEntry } from "@/app/actions";

export default async function TodayPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: entry } = await supabase
    .from("entries")
    .select("answer_1, answer_2, answer_3")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  return (
    <div className="min-h-screen px-6 py-12 sm:px-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="space-y-3">
          <Link href="/dashboard" className="text-sm text-muted">
            Back to dashboard
          </Link>
          <h1 className="text-3xl font-semibold">Today&apos;s noticing</h1>
          <p className="text-muted">
            Three small prompts. No pressure for completeness.
          </p>
        </header>

        <form
          action={createEntry}
          className="space-y-6 rounded-3xl border border-line bg-panel p-8 shadow-soft"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What stood out today?
            </label>
            <textarea
              name="answer_1"
              rows={4}
              defaultValue={entry?.answer_1 ?? ""}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:border-foreground focus:outline-none"
              placeholder="A moment, a detail, a scene..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What felt subtly meaningful?
            </label>
            <textarea
              name="answer_2"
              rows={4}
              defaultValue={entry?.answer_2 ?? ""}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:border-foreground focus:outline-none"
              placeholder="Something quiet but present..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What decision are you sensing but not acting on?
            </label>
            <textarea
              name="answer_3"
              rows={4}
              defaultValue={entry?.answer_3 ?? ""}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:border-foreground focus:outline-none"
              placeholder="A direction, a shift, a choice..."
            />
          </div>

          <button className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-panel transition hover:opacity-90">
            Save entry
          </button>
        </form>
      </div>
    </div>
  );
}
