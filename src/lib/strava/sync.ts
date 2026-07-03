import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import { fetchRecentActivities } from "./api";
import { getValidAccessToken } from "./tokens";
import type { StravaActivity } from "./types";

/** Strava sport types we treat as runs. */
const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);

/** Normalize a raw Strava activity into an `activities` insert row. */
function toActivityRow(
  userId: string,
  a: StravaActivity,
): TablesInsert<"activities"> {
  return {
    user_id: userId,
    strava_activity_id: a.id,
    name: a.name,
    sport_type: a.sport_type,
    distance_m: a.distance,
    moving_time_s: a.moving_time,
    elapsed_time_s: a.elapsed_time,
    total_elevation_gain_m: a.total_elevation_gain,
    // Strava gives average_speed in m/s; store pace as seconds per km.
    average_pace_s_per_km:
      a.average_speed > 0 ? Math.round(1000 / a.average_speed) : null,
    average_heartrate: a.average_heartrate ?? null,
    start_date: a.start_date,
  };
}

/**
 * Pull the user's recent Strava runs, normalize them, and upsert into
 * `activities` (idempotent on user_id + strava_activity_id). Returns how many
 * run activities were synced. May throw StravaAuthError if access was revoked.
 */
export async function syncUserActivities(
  userId: string,
): Promise<{ synced: number }> {
  const accessToken = await getValidAccessToken(userId);
  const activities = await fetchRecentActivities(accessToken);
  const rows = activities
    .filter((a) => RUN_TYPES.has(a.sport_type))
    .map((a) => toActivityRow(userId, a));

  if (rows.length === 0) {
    return { synced: 0 };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("activities")
    .upsert(rows, { onConflict: "user_id,strava_activity_id" });
  if (error) throw error;

  return { synced: rows.length };
}
