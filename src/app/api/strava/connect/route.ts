import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthorizeUrl } from "@/lib/strava/oauth";

/** Cookie holding the OAuth `state` value for CSRF protection on callback. */
export const STRAVA_STATE_COOKIE = "strava_oauth_state";

/**
 * Kicks off the Strava OAuth flow: requires a logged-in user, stores a random
 * `state` in an httpOnly cookie, and redirects to Strava's authorize page.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?redirectTo=/dashboard", request.url),
    );
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildAuthorizeUrl(state));

  response.cookies.set(STRAVA_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
