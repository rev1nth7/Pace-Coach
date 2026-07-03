import "server-only";
import {
  DEFAULT_REDIRECT_URI,
  STRAVA_AUTHORIZE_URL,
  STRAVA_DEAUTHORIZE_URL,
  STRAVA_SCOPE,
  STRAVA_TOKEN_URL,
} from "./constants";
import type { StravaTokenResponse } from "./types";

/** Read a required server-side env var, throwing a clear error if missing. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getRedirectUri(): string {
  return process.env.STRAVA_REDIRECT_URI ?? DEFAULT_REDIRECT_URI;
}

/** Build the Strava authorize URL to redirect the user to (with CSRF `state`). */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("STRAVA_CLIENT_ID"),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: STRAVA_SCOPE,
    approval_prompt: "auto",
    state,
  });
  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

/** Exchange an authorization code for access + refresh tokens. */
export async function exchangeCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Strava code exchange failed (${res.status}): ${await res.text()}`,
    );
  }
  return res.json() as Promise<StravaTokenResponse>;
}

/** Refresh an expired access token, rotating the refresh token. */
export async function refreshToken(
  currentRefreshToken: string,
): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: currentRefreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Strava token refresh failed (${res.status}): ${await res.text()}`,
    );
  }
  return res.json() as Promise<StravaTokenResponse>;
}

/** Best-effort revoke of our access on Strava's side (used on disconnect). */
export async function deauthorize(accessToken: string): Promise<void> {
  await fetch(STRAVA_DEAUTHORIZE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
