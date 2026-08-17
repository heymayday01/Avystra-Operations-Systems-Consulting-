import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  assertSameOrigin,
  isLoginLocked,
  recordFailedLogin,
  resetLoginAttempts,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "@/lib/admin-auth";

/**
 * A syntactically-valid Argon2id hash with no real matching password, used
 * to keep the password-verify step's cost identical whether or not the
 * submitted email matches ADMIN_EMAIL — so a timing difference never reveals
 * whether the email is right. (See "Do not expose whether a username/email
 * exists separately from whether the password is incorrect".)
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHRzb21lc2FsdA$L0OMYWlKF/f3RgMTHTgBaEQ+SsMzNfIDCbrH+DFmXys";

const LoginSchema = z.object({
  email: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(500),
});

/**
 * POST /api/admin/login
 *
 * Generic "Invalid credentials." on any failure — never reveals whether the
 * email or the password was wrong. Login attempts are rate-limited per IP
 * via a DB-backed lockout (src/lib/admin-auth.ts), not in-memory, since this
 * runs on Vercel serverless.
 */
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Invalid request origin." }, { status: 403 });
  }

  const { locked, retryAfter } = await isLoginLocked(request);
  if (locked) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    await recordFailedLogin(request);
    return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!adminEmail || !adminPasswordHash) {
    console.error("[admin/login] ADMIN_EMAIL / ADMIN_PASSWORD_HASH not configured");
    return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
  }

  const emailMatches = parsed.data.email.toLowerCase() === adminEmail.toLowerCase();
  const passwordOk = await verifyPassword(
    parsed.data.password,
    emailMatches ? adminPasswordHash : DUMMY_HASH
  );

  if (!emailMatches || !passwordOk) {
    await recordFailedLogin(request);
    return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
  }

  await resetLoginAttempts(request);
  const token = await signSession(adminEmail);

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions());
  return res;
}
