import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPlan } from "../actions";

const FIELD =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-100";
const LABEL =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/plan/new");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Create a training plan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            We&apos;ll build a periodized, week-by-week plan for your race.
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          ) : null}

          <form action={createPlan} className="mt-6 space-y-5">
            <div>
              <label htmlFor="goalType" className={LABEL}>
                Race distance
              </label>
              <select id="goalType" name="goalType" required className={FIELD} defaultValue="half">
                <option value="5k">5K</option>
                <option value="10k">10K</option>
                <option value="half">Half marathon</option>
                <option value="full">Marathon</option>
              </select>
            </div>

            <div>
              <label htmlFor="goalDate" className={LABEL}>
                Race date
              </label>
              <input
                id="goalDate"
                name="goalDate"
                type="date"
                required
                className={FIELD}
              />
              <p className="mt-1 text-xs text-gray-400">
                We&apos;ll align the final week to your race weekend.
              </p>
            </div>

            <div>
              <label htmlFor="daysPerWeek" className={LABEL}>
                Training days per week
              </label>
              <select
                id="daysPerWeek"
                name="daysPerWeek"
                required
                className={FIELD}
                defaultValue="4"
              >
                {[3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} days
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fitness" className={LABEL}>
                Current fitness
              </label>
              <select
                id="fitness"
                name="fitness"
                required
                className={FIELD}
                defaultValue="intermediate"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Generate my plan
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
