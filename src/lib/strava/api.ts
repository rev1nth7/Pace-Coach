import "server-only";
import { STRAVA_API_BASE } from "./constants";
import type { StravaActivity } from "./types";

/** Thrown when Strava rejects our token (revoked/expired auth) — a 401. */
export class StravaAuthError extends Error {
  constructor(message = "Strava authorization is no longer valid") {
    super(message);
    this.name = "StravaAuthError";
  }
}

/** Fetch the athlete's most recent activities (newest first). */
export async function fetchRecentActivities(
  accessToken: string,
  perPage = 30,
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (res.status === 401) {
    throw new StravaAuthError();
  }
  if (!res.ok) {
    throw new Error(
      `Strava activities fetch failed (${res.status}): ${await res.text()}`,
    );
  }

  return res.json() as Promise<StravaActivity[]>;
}
