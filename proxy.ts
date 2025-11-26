import { updateSession } from "@/lib/supabase/middleware";
import { verifySessionToken } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Skip Supabase session check for passkey, auth, and push API routes
  // Push routes are used by cron jobs and don't require user authentication
  // Also skip for public pages like privacy policy, terms, and support
  if (
    request.nextUrl.pathname.startsWith("/api/passkey") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/api/push") ||
    request.nextUrl.pathname === "/privacy" ||
    request.nextUrl.pathname === "/terms" ||
    request.nextUrl.pathname === "/support" ||
    request.nextUrl.pathname === "/onboarding"
  ) {
    return NextResponse.next();
  }

  // Accept app cookie session for gating protected routes
  const cookie = request.cookies.get("pm_session")?.value;
  if (cookie) {
    const payload = await verifySessionToken(cookie);
    if (payload?.uid) {
      // If authenticated user hits landing page, redirect to dashboard
      if (request.nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/todos", request.url));
      }
      // Consider authenticated for routing purposes
      return NextResponse.next({ request });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
