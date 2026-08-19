/**
 * Node-only admin auth pieces: Argon2id password verification (hash-wasm)
 * and DB-backed login lockout (Prisma). Import this from route handlers
 * (Node runtime), never from middleware — see src/lib/admin-session.ts for
 * the Edge-safe session verification used there.
 */

import { argon2Verify } from "hash-wasm";
import { db } from "@/lib/db";

export {
  ADMIN_COOKIE,
  signSession,
  verifySession,
  sessionCookieOptions,
  requireAdminSession,
  assertSameOrigin,
} from "@/lib/admin-session";

const MAX_LOGIN_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // failed attempts older than this don't count
const LOCKOUT_MS = 15 * 60 * 1000;

/** Verify a plaintext password against an Argon2id hash. Never throws. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plain, hash });
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

/** Returns whether this IP is currently locked out from logging in. */
export async function isLoginLocked(request: Request): Promise<{ locked: boolean; retryAfter: number }> {
  const ip = getClientIp(request);
  const entry = await db.adminLoginAttempt.findUnique({ where: { ip } });
  if (entry?.lockedUntil && entry.lockedUntil > new Date()) {
    return { locked: true, retryAfter: Math.ceil((entry.lockedUntil.getTime() - Date.now()) / 1000) };
  }
  return { locked: false, retryAfter: 0 };
}

/** Record a failed login attempt for this IP, locking it out past the threshold. */
export async function recordFailedLogin(request: Request): Promise<void> {
  const ip = getClientIp(request);
  const existing = await db.adminLoginAttempt.findUnique({ where: { ip } });

  const windowExpired =
    !existing || Date.now() - existing.updatedAt.getTime() > ATTEMPT_WINDOW_MS;
  const nextAttempts = windowExpired ? 1 : existing.attempts + 1;
  const lockedUntil =
    nextAttempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;

  await db.adminLoginAttempt.upsert({
    where: { ip },
    create: { ip, attempts: nextAttempts, lockedUntil },
    update: { attempts: nextAttempts, lockedUntil },
  });
}

/** Reset the failed-attempt counter for this IP after a successful login. */
export async function resetLoginAttempts(request: Request): Promise<void> {
  const ip = getClientIp(request);
  await db.adminLoginAttempt.deleteMany({ where: { ip } });
}
