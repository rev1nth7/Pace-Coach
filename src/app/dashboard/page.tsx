import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route; this is defense-in-depth.
  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

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

        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your Strava account to sync your runs. Plan generation comes next.
          </p>
          <a
            href="/api/strava/connect"
            className="mt-4 inline-block rounded-lg bg-[#fc4c02] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e34402]"
          >
            Connect Strava
          </a>
        </div>
      </section>
    </main>
  );
}
