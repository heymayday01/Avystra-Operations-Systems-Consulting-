import { NextResponse } from "next/server";
import { getEmailConfigStatus, verifyConnection } from "@/lib/email";
import { db } from "@/lib/db";

/**
 * GET /api/ogi/health
 *
 * Returns the current email configuration status + (optionally) runs a live
 * SMTP connection verification. Used for debugging "why aren't emails sending?"
 *
 * Query params:
 *   ?verify=true — run a live SMTP connection test (transporter.verify()).
 *                  This actually connects to Gmail and checks auth. Slower
 *                  (~1-2s) but catches EAUTH/ECONNECTION errors.
 *   ?db=true     — run a live database check (counts OgiSubmission rows
 *                  through the pooled connection). Catches bad credentials /
 *                  unreachable pooler on Vercel.
 *
 * No query param — just returns the config status (instant, no network call).
 *
 * Example response:
 *   {
 *     "configured": true,
 *     "host": "smtp.gmail.com",
 *     "port": 465,
 *     "user": "info.avystra@gmail.com",
 *     "from": "AVYSTRA <info.avystra@gmail.com>",
 *     "notifyEmail": "info.avystra@gmail.com",
 *     "verified": true   // only when ?verify=true
 *   }
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const shouldVerify = url.searchParams.get("verify") === "true";
  const shouldCheckDb = url.searchParams.get("db") === "true";

  const status: Record<string, unknown> = getEmailConfigStatus();

  if (shouldCheckDb) {
    // Live DB check — round-trips through the pooled connection
    try {
      const submissions = await db.ogiSubmission.count();
      status.db = { ok: true, submissions };
    } catch (error) {
      status.db = {
        ok: false,
        error: error instanceof Error ? error.message.split("\n")[0] : "unknown",
      };
    }
  }

  if (!shouldVerify) {
    return NextResponse.json(status);
  }

  // Live verification — actually connects to Gmail
  const verified = await verifyConnection();
  return NextResponse.json({ ...status, verified });
}
