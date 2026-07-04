/**
 * Centralized email service — single source of truth for SMTP transport.
 *
 * INDUSTRY-STANDARD PRACTICES:
 * 1. Single reusable transport (pooled across requests) — created once per
 *    process, verified on first use.
 * 2. Connection verification via `transporter.verify()` — catches auth errors
 *    (EAUTH), network errors (ECONNECTION), and SSL errors early, before the
 *    first real email is sent.
 * 3. Structured error logging — every send failure is logged with the error
 *    code, response, and command so you can diagnose Gmail rejections.
 * 4. Graceful degradation — when SMTP credentials are missing, the service
 *    reports `isConfigured: false` so callers can return the right status to
 *    the frontend instead of silently failing.
 * 5. Retry for transient failures — network blips get up to 2 retries with
 *    exponential backoff (450ms, 1350ms). Auth errors are NOT retried.
 *
 * EXTRACTED FROM submit/route.ts so both the submit route and any future
 * admin/health endpoints share the same transport + config status.
 */

import nodemailer from "nodemailer";

// ── Config (read once at module load) ──────────────────────────────────────
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS?.trim();
const SMTP_HOST = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT?.trim() || "465");
const FROM_EMAIL =
  process.env.SMTP_FROM?.trim() ||
  (SMTP_USER ? `AVYSTRA <${SMTP_USER}>` : "AVYSTRA <noreply@avystra.co.in>");
const AVYSTRA_NOTIFY_EMAIL =
  process.env.AVYSTRA_NOTIFY_EMAIL?.trim() || "info@avystra.co.in";

/**
 * Whether SMTP credentials are present. When false, the transporter is null
 * and all send calls return a "not configured" result (no throw).
 */
export const isEmailConfigured = Boolean(SMTP_USER && SMTP_PASS);

/**
 * The single reusable nodemailer transport. Created once at module load and
 * pooled across all requests. Null when credentials are missing.
 */
export const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      pool: true, // use pooled connections (industry standard for throughput)
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // max 10 messages/sec — Gmail's limit is higher, be safe
      socketTimeout: 30_000, // 30s — Gmail can be slow on first connect
      connectionTimeout: 15_000,
    })
  : null;

export { FROM_EMAIL, AVYSTRA_NOTIFY_EMAIL, SMTP_USER };

// ── Connection verification (lazy, runs once on first send) ────────────────
let verified = false;
let verifyPromise: Promise<boolean> | null = null;

/**
 * Verify the SMTP connection. Runs once on the first send attempt, then
 * caches the result. Returns true if the connection is valid, false if
 * credentials/network are broken. Subsequent calls return the cached result.
 *
 * This catches:
 * - EAUTH: bad username / App Password (most common — user needs to regen)
 * - ECONNECTION: can't reach smtp.gmail.com (firewall, DNS)
 * - ESOCKET: SSL/TLS handshake failure
 */
export function verifyConnection(): Promise<boolean> {
  if (verified) return Promise.resolve(true);
  if (verifyPromise) return verifyPromise;
  if (!transporter) return Promise.resolve(false);

  verifyPromise = transporter
    .verify()
    .then(() => {
      verified = true;
      console.info(
        "[email] SMTP connection verified — host=%s port=%d user=%s",
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER
      );
      return true;
    })
    .catch((err) => {
      // Log with structured info so the error is diagnosable
      console.error("[email] SMTP verification FAILED:", {
        code: err.code,
        command: err.command,
        response: err.response,
        message: err.message,
      });
      verified = false;
      verifyPromise = null; // allow retry on next send
      return false;
    });

  return verifyPromise;
}

// ── Send helpers ────────────────────────────────────────────────────────────

export interface SendResult {
  success: boolean;
  /** Why it failed, if it did. */
  error?: string;
  /** The error code (EAUTH, ECONNECTION, etc.) for logging/debugging. */
  code?: string;
  /** Whether the failure is worth retrying (network blip vs auth error). */
  retriable: boolean;
}

/**
 * Classify a nodemailer error to decide whether to retry.
 * - EAUTH (bad credentials) → never retry
 * - ECONNECTION / ETIMEDOUT / ESOCKET → retry (transient)
 * - Everything else → don't retry (could be a malformed message)
 */
function classifyError(err: unknown): SendResult {
  const e = err as { code?: string; message?: string; response?: string };
  const code = e?.code || "UNKNOWN";
  const retriable = ["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EENVELOPE"].includes(
    code
  );
  return {
    success: false,
    error: e?.message || "Unknown email error",
    code,
    retriable,
  };
}

/**
 * Send an email with retry for transient failures.
 *
 * @param options — nodemailer sendMail options (from, to, subject, text, html)
 * @param retries — max retry attempts for transient failures (default 2)
 * @returns SendResult with success status + error info
 */
export async function sendEmail(
  options: nodemailer.SendMailOptions,
  retries = 2
): Promise<SendResult> {
  if (!transporter) {
    return {
      success: false,
      error: "SMTP not configured — missing SMTP_USER or SMTP_PASS in .env",
      code: "ENOTCONFIGURED",
      retriable: false,
    };
  }

  // Verify connection on first send (catches auth errors early)
  const ok = await verifyConnection();
  if (!ok) {
    return {
      success: false,
      error: "SMTP connection verification failed — check credentials",
      code: "EVERIFY",
      retriable: false,
    };
  }

  let lastResult: SendResult;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail({
        ...options,
        // Common headers that improve deliverability + signal legitimacy.
        // These tell Gmail/Outlook that this is a legitimate transactional
        // email (not spam) from a real business.
        headers: {
          "X-Mailer": "AVYSTRA Consulting (nodemailer)",
          "X-Priority": "3",
          "X-Auto-Response-Suppress": "All",
          // List-Unsubscribe — required for bulk/transactional email best
          // practices. Gmail shows "Unsubscribe" in the UI when this is set,
          // which IMPROVES deliverability (signals legitimate sender).
          "List-Unsubscribe": `<mailto:${AVYSTRA_NOTIFY_EMAIL}?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          // Organization header — helps email clients categorize the email
          "Organization": "AVYSTRA Consulting Private Limited",
          ...(options.headers || {}),
        },
      });
      console.info("[email] sent:", {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });
      return { success: true, retriable: false };
    } catch (err) {
      lastResult = classifyError(err);
      console.error(`[email] send failed (attempt ${attempt + 1}):`, {
        code: lastResult.code,
        to: options.to,
        subject: options.subject,
        error: lastResult.error,
      });
      if (!lastResult.retriable || attempt === retries) break;
      // Exponential backoff: 450ms, then 1350ms
      await new Promise((r) => setTimeout(r, 450 * Math.pow(3, attempt)));
    }
  }

  return lastResult!;
}

/**
 * Health check — returns the current email configuration status.
 * Used by /api/ogi/health and /api/ogi/submit to report config to the frontend.
 */
export function getEmailConfigStatus(): {
  configured: boolean;
  host: string;
  port: number;
  user: string | undefined;
  from: string;
  notifyEmail: string;
} {
  return {
    configured: isEmailConfigured,
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    from: FROM_EMAIL,
    notifyEmail: AVYSTRA_NOTIFY_EMAIL,
  };
}
