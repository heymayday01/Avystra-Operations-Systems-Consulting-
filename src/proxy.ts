import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";

/**
 * Coarse gate for /admin/** and /api/admin/**. This is defense-in-depth
 * layer #1 — every admin API route also re-verifies the session itself
 * (src/lib/admin-auth.ts requireAdminSession), and the protected layout
 * re-checks again server-side, so a gap in this matcher alone can't expose
 * admin data.
 */
const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const isApi = pathname.startsWith("/api/admin");

  const session = await verifySession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
