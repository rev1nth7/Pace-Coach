import type { ReactNode } from "react";

type AuthFormProps = {
  heading: string;
  subheading: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  error?: string;
  footer: ReactNode;
  /** Optional hidden inputs (e.g. a redirectTo carried into the action). */
  hiddenFields?: ReactNode;
  /** "new-password" on signup, "current-password" on login. */
  passwordAutoComplete?: "new-password" | "current-password";
};

/**
 * Presentational auth card shared by the login and signup pages.
 * Server component — errors are passed in via the page's searchParams.
 */
export function AuthForm({
  heading,
  subheading,
  action,
  submitLabel,
  error,
  footer,
  hiddenFields,
  passwordAutoComplete = "current-password",
}: AuthFormProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          {heading}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subheading}</p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}

        <form action={action} className="mt-6 space-y-4">
          {hiddenFields}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-100 dark:focus:ring-gray-100"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={passwordAutoComplete}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-100 dark:focus:ring-gray-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {submitLabel}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {footer}
        </div>
      </div>
    </main>
  );
}
