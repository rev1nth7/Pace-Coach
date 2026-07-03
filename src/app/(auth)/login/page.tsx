import Link from "next/link";
import { login } from "../actions";
import { AuthForm } from "../AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <AuthForm
      heading="Welcome back"
      subheading="Log in to your PaceCoach dashboard."
      action={login}
      submitLabel="Log in"
      error={error}
      passwordAutoComplete="current-password"
      hiddenFields={
        redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null
      }
      footer={
        <>
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100"
          >
            Sign up
          </Link>
        </>
      }
    />
  );
}
