import Link from "next/link";
import { loginDemo } from "./(auth)/actions";

const FEATURES = [
  {
    title: "Strava sync",
    body: "Connect your account and pull in your real runs with automatic token refresh.",
  },
  {
    title: "Adaptive plans",
    body: "A deterministic, periodized engine builds your plan — then reshapes upcoming weeks from what you actually ran.",
  },
  {
    title: "AI coach",
    body: "A plain-language note explains each week's adjustments, grounded in your real numbers.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            PaceCoach
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
          Running training, adapted
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-50">
          Training plans that adjust to how you actually run.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-400">
          PaceCoach syncs your Strava runs, builds a periodized plan for your race,
          and adapts each week to your real performance — with an AI coach that
          explains why.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <form action={loginDemo}>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Try the demo →
            </button>
          </form>
          <Link
            href="/signup"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Sign up free
          </Link>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
          No signup needed for the demo — it opens a live, populated account.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {f.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
