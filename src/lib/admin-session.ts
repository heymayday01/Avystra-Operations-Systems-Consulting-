/**
 * Stateless signed-cookie admin sessions — Web Crypto only (no Prisma, no
 * hash-wasm), so this module is safe to import from the Edge middleware
 * runtime as well as Node route handlers. Password hashing and DB-backed
 * login-lockout logic (Node-only) live in src/lib/admin-auth.ts instead.
 *
 * Session tokens are `base64url(payload).base64url(hmac)`, HMAC-SHA256
 * signed with ADMIN_SESSION_SECRET.
 */

export const ADMIN_COOKIE = "avystra_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminSession {
  sub: string;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getSessionSecret());
  return crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Build a signed session token for the given admin email. */
export async function signSession(email: string): Promise<string> {
  const now = Date.now();
  const payload: AdminSession = { sub: email, iat: now, exp: now + SESSION_TTL_MS };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(sig)}`;
}

/** Verify a session token. Returns the session payload, or null if invalid/expired. */
export async function verifySession(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sigB64) as BufferSource,
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64))
    ) as AdminSession;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Cookie options shared by the set/clear call sites. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

/**
 * Verify the admin session cookie on an incoming request. Used independently
 * by every /api/admin/* route handler (defense in depth beyond middleware).
 */
export async function requireAdminSession(request: Request): Promise<AdminSession | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match) return null;
  return verifySession(decodeURIComponent(match[1]));
}

/**
 * CSRF defense for state-changing admin requests: the Origin header (sent by
 * browsers on cross-origin and same-origin fetch/form submissions alike) must
 * match this request's own origin. Complements SameSite=Lax, which alone
 * doesn't block same-site-cookie-bearing fetches issued from another origin
 * open in a tab.
 */
export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin requests may omit Origin (e.g. curl, some browsers)
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
