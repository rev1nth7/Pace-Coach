/**
 * Demo-mode configuration. The demo is a single shared account that "Try the
 * demo" signs into (no signup). Credentials live in server-side env only —
 * never import this into a client component (it reads DEMO_PASSWORD).
 */

/** The demo account's email (not a secret; used to identify the demo user). */
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@pacecoach.app";

/** True if the given email is the shared demo account. */
export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === DEMO_EMAIL.toLowerCase();
}

/**
 * The demo credentials, or null if not configured. Server-side only — used by
 * the `loginDemo` action and the seed route.
 */
export function getDemoCredentials(): { email: string; password: string } | null {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return null;
  return { email: DEMO_EMAIL, password };
}
