import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Paths that require an authenticated user. */
const PROTECTED_PREFIXES = ["/dashboard"];

export async function middleware(request: NextRequest) {
  // Always refresh the session first so cookies stay fresh on every request.
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    // Bounce to login, remembering where they were headed.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    // Carry over the refreshed auth cookies so the session isn't lost.
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return response;
}

export const config = {
  /**
   * Run on all paths except Next.js internals and static assets, so session
   * refresh happens app-wide without wasting work on images/fonts/etc.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
