import { updateSession } from "@/lib/supabase/middleware";
import { verifySessionToken } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Skip Supabase session check for passkey and auth API routes
  if (
    request.nextUrl.pathname.startsWith("/api/passkey") ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    return;
  }

  // Accept app cookie session for gating protected routes
  const cookie = request.cookies.get("pm_session")?.value;
  if (cookie) {
    const payload = await verifySessionToken(cookie);
    if (payload?.uid) {
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
