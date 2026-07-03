/** Athlete summary embedded in a token response. */
export type StravaAthlete = {
  id: number;
  firstname?: string;
  lastname?: string;
};

/** Response shape from Strava's token endpoint (exchange + refresh). */
export type StravaTokenResponse = {
  token_type: string;
  /** Unix seconds when the access token expires. */
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  /** Present on the initial code exchange, not on refresh. */
  athlete?: StravaAthlete;
};

/** Subset of Strava's activity fields we care about (raw, pre-normalization). */
export type StravaActivity = {
  id: number;
  name: string;
  /** Meters. */
  distance: number;
  /** Seconds. */
  moving_time: number;
  /** Seconds. */
  elapsed_time: number;
  /** Meters. */
  total_elevation_gain: number;
  /** e.g. "Run", "TrailRun", "Ride". */
  sport_type: string;
  /** ISO 8601 UTC. */
  start_date: string;
  /** Meters/second. */
  average_speed: number;
  average_heartrate?: number;
};
