import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateWeeklyReflection, signOut } from "@/app/actions";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reflections } = await supabase
    .from("reflections")
    .select("id, content, week_start, created_at")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(12);

  const latestReflection = reflections?.[0];
  const weekStartCandidate = new Date();
  weekStartCandidate.setDate(weekStartCandidate.getDate() - 6);
  const currentWeekStart = weekStartCandidate.toISOString().slice(0, 10);

  const isThisWeek = Boolean(
    latestReflection && latestReflection.week_start >= currentWeekStart
  );

  const pastReflections = reflections
    ? reflections.filter((reflection, index) =>
        isThisWeek ? index !== 0 : true
      )
    : [];

  const { data: entries } = await supabase
    .from("entries")
    .select("id, date, answer_1, answer_2, answer_3")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(7);

  return (
    <div className="min-h-screen px-6 py-12 sm:px-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-muted">
            Noticing
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              A calm place to hold your week.
            </h1>
            <form action={signOut}>
              <button className="rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:border-foreground hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
          <p className="text-base text-muted">
            Signed in as <span className="text-foreground">{user.email}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/today"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black border border-line transition hover:opacity-90"
            >
              Today&apos;s entry
            </Link>
            <form action={generateWeeklyReflection}>
              <button className="rounded-full border border-line px-5 py-2 text-sm text-foreground transition hover:border-foreground">
                Generate Weekly Reflection
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-3xl border border-line bg-panel p-8 shadow-soft">
          <h2 className="text-xl font-semibold">This week&apos;s reflection</h2>
          {isThisWeek && latestReflection ? (
            <div className="mt-5 space-y-2 text-base text-foreground">
              <p className="text-sm text-muted">
                Week of {formatDate(latestReflection.week_start)}
              </p>
              <p className="leading-relaxed">{latestReflection.content}</p>
            </div>
          ) : (
            <p className="mt-4 text-muted">
              No reflection yet this week. Generate one after a few entries.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Past reflections</h2>
          {pastReflections.length > 0 ? (
            <div className="space-y-4">
              {pastReflections.map((reflection) => (
                <article
                  key={reflection.id}
                  className="rounded-2xl border border-line bg-panel p-6"
                >
                  <p className="text-sm text-muted">
                    Week of {formatDate(reflection.week_start)}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {reflection.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted">No past reflections yet.</p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Past entries</h2>
          {entries && entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-line bg-panel p-6"
                >
                  <p className="text-sm text-muted">
                    {formatDate(entry.date)}
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-foreground">
                    <p>
                      <span className="font-semibold">Stood out:</span>{" "}
                      {entry.answer_1 || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Subtly meaningful:</span>{" "}
                      {entry.answer_2 || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Decision sensed:</span>{" "}
                      {entry.answer_3 || "—"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted">No entries yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
