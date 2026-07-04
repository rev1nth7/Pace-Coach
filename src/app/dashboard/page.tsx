import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivePlan } from "@/lib/plan/persistence";
import { addDays } from "@/lib/plan/dates";
import { isDemoEmail } from "@/lib/demo/config";
import { signOut } from "../(auth)/actions";
import { disconnectStrava, refreshCoachNote, syncStrava } from "./actions";
import { PlanView } from "./PlanView";

/** Map a `?strava=` status to a friendly banner. */
function stravaBanner(
  status: string | undefined,
  count: string | undefined,
): { tone: "ok" | "warn"; text: string } | null {
  switch (status) {
    case "connected":
      return { tone: "ok", text: "Strava connected." };
    case "synced":
      return { tone: "ok", text: `Synced ${count ?? 0} run(s) from Strava.` };
    case "disconnected":
      return { tone: "ok", text: "Strava disconnected." };
    case "denied":
      return { tone: "warn", text: "Strava authorization was cancelled." };
    case "invalid_state":
      return {
        tone: "warn",
        text: "Could not verify the Strava request. Please try again.",
      };
    case "revoked":
      return {
        tone: "warn",
        text: "Strava access was revoked. Please reconnect.",
      };
    case "sync_error":
    case "error":
      return {
        tone: "warn",
        text: "Something went wrong with Strava. Please try again.",
      };
    default:
      return null;
  }
}

function formatDistance(m: number | null): string {
  if (!m) return "—";
  return `${(m / 1000).toFixed(2)} km`;
}

function formatPace(sPerKm: number | null): string {
  if (!sPerKm) return "—";
  const min = Math.floor(sPerKm / 60);
  const sec = Math.round(sPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    strava?: string;
    count?: string;
    plan?: string;
    demo?: string;
  }>;
}) {
  const { strava, count, plan, demo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const isDemo = isDemoEmail(user.email);

  const activePlan = await getActivePlan(supabase, user.id);

  const todayIso = new Date().toISOString().slice(0, 10);
  const currentWeek = activePlan
    ? (activePlan.weeks.find(
        (w) => w.start_date <= todayIso && todayIso <= addDays(w.start_date, 6),
      ) ??
      activePlan.weeks.find((w) => w.start_date > todayIso) ??
      activePlan.weeks[activePlan.weeks.length - 1])
    : null;

  const { data: connection } = await supabase
    .from("strava_accounts")
    .select("strava_athlete_id, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: activities, count: activityCount } = await supabase
    .from("activities")
    .select("id, name, distance_m, average_pace_s_per_km, start_date", {
      count: "exact",
    })
    .order("start_date", { ascending: false })
    .limit(10);

  const banner = stravaBanner(strava, count);
  const isConnected = Boolean(connection);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            PaceCoach
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:inline dark:text-gray-400">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Welcome back
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Signed in as{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {user.email}
          </span>
          .
        </p>

        {isDemo ? (
          <p className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
            👋 You&apos;re exploring a <strong>read-only demo</strong> — the plan
            and runs are pre-seeded. Try <strong>Regenerate</strong> on the coach
            note to see the AI live.
          </p>
        ) : null}

        {demo === "readonly" ? (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            That action is disabled in the demo. Sign up for a free account to
            create your own plan.
          </p>
        ) : null}

        {banner ? (
          <p
            className={
              banner.tone === "ok"
                ? "mt-6 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
                : "mt-6 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }
          >
            {banner.text}
          </p>
        ) : null}

        {plan === "created" ? (
          <p className="mt-6 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Your training plan is ready.
          </p>
        ) : null}

        {/* Training plan */}
        <div className="mt-8">
          {activePlan ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                  Your plan
                </h2>
                {!isDemo ? (
                  <Link
                    href="/plan/new"
                    className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    New plan
                  </Link>
                ) : null}
              </div>

              {/* AI coach note */}
              <div className="mb-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-white p-5 dark:border-gray-800 dark:from-indigo-950/40 dark:to-gray-900">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <span>🧠 Coach</span>
                    {currentWeek ? (
                      <span className="text-xs font-normal text-gray-400">
                        week {currentWeek.week_number}
                      </span>
                    ) : null}
                  </h3>
                  <form action={refreshCoachNote}>
                    <button
                      type="submit"
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {currentWeek?.coach_note ? "Regenerate" : "Generate note"}
                    </button>
                  </form>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                  {currentWeek?.coach_note ??
                    "Generate an AI coaching note for this week — grounded in your plan and recent runs."}
                </p>
              </div>

              <PlanView data={activePlan} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                No training plan yet
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                Generate a periodized, week-by-week plan for your next race.
              </p>
              <Link
                href="/plan/new"
                className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Create a plan
              </Link>
            </div>
          )}
        </div>

        {/* Strava connection card */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                Strava
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isConnected
                  ? `Connected · ${activityCount ?? 0} activities synced`
                  : "Not connected — link your account to sync your runs."}
              </p>
            </div>

            {isDemo ? null : isConnected ? (
              <div className="flex items-center gap-3">
                <form action={syncStrava}>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#fc4c02] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e34402]"
                  >
                    Sync now
                  </button>
                </form>
                <form action={disconnectStrava}>
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            ) : (
              <a
                href="/api/strava/connect"
                className="rounded-lg bg-[#fc4c02] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e34402]"
              >
                Connect Strava
              </a>
            )}
          </div>
        </div>

        {/* Recent activities */}
        {isConnected ? (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Recent runs
            </h2>
            {activities && activities.length > 0 ? (
              <ul className="mt-4 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                {activities.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {a.name ?? "Run"}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {formatDate(a.start_date)}
                      </p>
                    </div>
                    <div className="text-right text-gray-700 dark:text-gray-300">
                      <p>{formatDistance(a.distance_m)}</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {formatPace(a.average_pace_s_per_km)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                No runs synced yet. Click <strong>Sync now</strong> to pull your
                recent Strava runs.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
