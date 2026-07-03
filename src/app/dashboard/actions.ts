"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StravaAuthError } from "@/lib/strava/api";
import { deauthorize } from "@/lib/strava/oauth";
import { syncUserActivities } from "@/lib/strava/sync";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }
  return user.id;
}

/** Pull recent Strava runs into `activities`. */
export async function syncStrava() {
  const userId = await requireUserId();

  let synced = 0;
  try {
    ({ synced } = await syncUserActivities(userId));
  } catch (error) {
    if (error instanceof StravaAuthError) {
      redirect("/dashboard?strava=revoked");
    }
    redirect("/dashboard?strava=sync_error");
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?strava=synced&count=${synced}`);
}

/** Disconnect Strava: best-effort deauthorize, then remove stored tokens. */
export async function disconnectStrava() {
  const userId = await requireUserId();
  const admin = createAdminClient();

  const { data: account } = await admin
    .from("strava_accounts")
    .select("access_token")
    .eq("user_id", userId)
    .single();

  if (account?.access_token) {
    try {
      await deauthorize(account.access_token);
    } catch {
      // Best-effort — remove local data regardless.
    }
  }

  // Clean slate: remove synced runs and the connection so the database matches
  // what the UI shows after disconnect (no orphaned activity rows).
  await admin.from("activities").delete().eq("user_id", userId);
  await admin.from("strava_accounts").delete().eq("user_id", userId);

  revalidatePath("/dashboard");
  redirect("/dashboard?strava=disconnected");
}
