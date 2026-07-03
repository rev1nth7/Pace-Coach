import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshToken } from "./oauth";

/** Refresh if the access token expires within this window (ms). */
const REFRESH_SKEW_MS = 60_000;

/**
 * Returns a valid Strava access token for the user, transparently refreshing
 * and rotating the stored refresh token when the current one is near expiry.
 * Throws if the user has no Strava connection.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("strava_accounts")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    throw new Error("No Strava connection for user");
  }

  const expiresAtMs = new Date(account.expires_at).getTime();
  if (expiresAtMs - Date.now() > REFRESH_SKEW_MS) {
    return account.access_token;
  }

  const refreshed = await refreshToken(account.refresh_token);
  await admin
    .from("strava_accounts")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}
