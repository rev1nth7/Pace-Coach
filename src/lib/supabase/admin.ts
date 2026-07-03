import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client. BYPASSES row-level security, so it must only
 * ever be used in trusted server-side code (route handlers / server actions) —
 * never imported into client components. Used for writes the app performs on the
 * user's behalf that RLS intentionally blocks (e.g. storing Strava tokens).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
