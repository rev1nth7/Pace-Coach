import Link from "next/link";
import { signup } from "../actions";
import { AuthForm } from "../AuthForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthForm
      heading="Create your account"
      subheading="Start building your adaptive training plan."
      action={signup}
      submitLabel="Sign up"
      error={error}
      passwordAutoComplete="new-password"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100"
          >
            Log in
          </Link>
        </>
      }
    />
  );
}
