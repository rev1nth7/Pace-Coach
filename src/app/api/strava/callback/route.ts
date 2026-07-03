import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STRAVA_STATE_COOKIE } from "@/lib/strava/constants";
import { exchangeCode } from "@/lib/strava/oauth";

/**
 * Strava OAuth callback: validates the `state` (CSRF), exchanges the code for
 * tokens, and upserts them into `strava_accounts` via the service-role client
 * (RLS blocks direct client writes). Redirects back to /dashboard with a status.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const grantedScope = url.searchParams.get("scope");

  const dashboard = new URL("/dashboard", request.url);
  const cookieStore = await cookies();
  const storedState = cookieStore.get(STRAVA_STATE_COOKIE)?.value;

  const redirectWith = (status: string) => {
    dashboard.searchParams.set("strava", status);
    const res = NextResponse.redirect(dashboard);
    res.cookies.delete(STRAVA_STATE_COOKIE);
    return res;
  };

  // User denied authorization on Strava.
  if (oauthError) {
    return redirectWith("denied");
  }

  // CSRF: state must be present and match the cookie we set.
  if (!code || !state || !storedState || state !== storedState) {
    return redirectWith("invalid_state");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/login?redirectTo=/dashboard", request.url),
    );
  }

  try {
    const token = await exchangeCode(code);
    const admin = createAdminClient();
    const { error } = await admin.from("strava_accounts").upsert(
      {
        user_id: user.id,
        strava_athlete_id: token.athlete?.id ?? null,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(token.expires_at * 1000).toISOString(),
        scope: grantedScope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  } catch {
    return redirectWith("error");
  }

  return redirectWith("connected");
}
