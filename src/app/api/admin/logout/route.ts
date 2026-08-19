import { NextResponse } from "next/server";
import { ADMIN_COOKIE, assertSameOrigin } from "@/lib/admin-auth";

/** POST /api/admin/logout — clears the admin session cookie. */
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Invalid request origin." }, { status: 403 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
