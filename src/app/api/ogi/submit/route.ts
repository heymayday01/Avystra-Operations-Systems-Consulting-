import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  SubmissionSchema,
  findOrCreateSubmission,
} from "@/lib/ogi-submission";
import {
  sendEmail,
  isEmailConfigured,
  FROM_EMAIL,
  AVYSTRA_NOTIFY_EMAIL,
  SMTP_USER,
} from "@/lib/email";
import {
  buildAvystraEmailHtml,
  buildAvystraEmailText,
  buildUserEmailHtml,
  buildUserEmailText,
} from "@/lib/ogi-email-templates";

/**
 * POST /api/ogi/submit
 *
 * Persists the submission (reusing the row created by /api/ogi/save if present)
 * and sends both emails: the user's personalized result and the internal
 * AVYSTRA notification. Score + band are computed server-side so the email and
 * DB always match what the user saw.
 *
 * Email failures never fail the request — the DB record is the source of truth.
 * The response reports what actually happened so the frontend can pick its
 * success message.
 */
export async function POST(request: Request) {
  // 5 submissions per IP per hour — prevents spam without blocking real users.
  const rl = rateLimit(request, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many submissions. Please try again later.",
        retryAfter: rl.retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter), "X-RateLimit-Remaining": "0" },
      }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = SubmissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 1. Save (or reuse the row /api/ogi/save created for this session).
  let submissionId: string;
  let score: number;
  let bandBadge: string;
  try {
    const result = await findOrCreateSubmission(data);
    submissionId = result.submission.id;
    score = result.score;
    bandBadge = result.band.badge;
  } catch (err) {
    console.error("[ogi/submit] DB insert failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save submission" },
      { status: 500 }
    );
  }

  // 2. Send both emails in parallel. Each is independent — one failing never
  //    blocks the other, and neither fails the request.
  const emailData = { ...data, score, band: bandBadge };
  const [ownerResult, userResult] = await Promise.all([
    // Internal AVYSTRA notification.
    sendEmail({
      from: FROM_EMAIL,
      to: AVYSTRA_NOTIFY_EMAIL,
      replyTo: SMTP_USER,
      subject: `New OGI Submission — ${data.name} (${data.role})`,
      text: buildAvystraEmailText(emailData),
      html: buildAvystraEmailHtml(emailData),
      headers: { "X-Priority": "1" },
    }),

    // User result email (only if they gave an address).
    data.email
      ? sendEmail({
          from: FROM_EMAIL,
          to: data.email,
          replyTo: SMTP_USER,
          subject: `Your OGI Score: ${score}/100 — Here's What It Means`,
          text: buildUserEmailText({ name: data.name, role: data.role, score, band: bandBadge }),
          html: buildUserEmailHtml({ name: data.name, role: data.role, score, band: bandBadge }),
          headers: { "X-Priority": "3" },
        })
      : Promise.resolve({ success: false, retriable: false, code: "NOEMAIL" as const }),
  ]);

  console.info("[ogi/submit] outcome:", {
    submissionId,
    smtpConfigured: isEmailConfigured,
    ownerNotified: ownerResult.success,
    userEmailSent: userResult.success,
  });

  return NextResponse.json({
    success: true,
    submissionId,
    emailSent: userResult.success,
    ownerNotified: ownerResult.success,
    smtpConfigured: isEmailConfigured,
  });
}
