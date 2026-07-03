/** Strava OAuth + API endpoints and the scope we request. */
export const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_DEAUTHORIZE_URL = "https://www.strava.com/oauth/deauthorize";
export const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/**
 * `activity:read` covers public activities. Switch to `activity:read_all` if
 * private activities should sync too (see PLAN.md Step 4 design notes).
 */
export const STRAVA_SCOPE = "activity:read";

/** Default redirect target if STRAVA_REDIRECT_URI is not set. */
export const DEFAULT_REDIRECT_URI = "http://localhost:3000/api/strava/callback";
