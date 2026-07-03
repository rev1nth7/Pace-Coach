"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Only allow redirects to internal, single-slash paths. Rejects absolute URLs
 * and protocol-relative (`//host`) or backslash tricks to prevent open redirects.
 */
function safeRedirect(target: string): string {
  if (
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.startsWith("/\\")
  ) {
    return target;
  }
  return "/dashboard";
}

/**
 * Create a new account with email + password.
 * Email confirmation is disabled in Supabase for this showcase, so a
 * successful signup yields a session immediately and we can go to /dashboard.
 */
export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Log in with email + password. On success, honor the `redirectTo` the
 * middleware set (defaulting to /dashboard); on failure, bounce back with the
 * error message.
 */
export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(
    String(formData.get("redirectTo") ?? "/dashboard") || "/dashboard",
  );

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (redirectTo !== "/dashboard") params.set("redirectTo", redirectTo);
    redirect(`/login?${params.toString()}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/** Sign the current user out and return them to the login page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
