import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { exportOgiSubmissionsToExcel } from "@/lib/excel-export";
import { rateLimit } from "@/lib/rate-limit";
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

// ── Zod validation ─────────────────────────────────────────────────────────
const BodySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name is too long")
    .transform((s) => s.replace(/[\r\n]/g, " ").trim()),
  role: z
    .string()
    .min(1, "Role is required")
    .max(120, "Role is too long")
    .transform((s) => s.replace(/[\r\n]/g, " ").trim()),
  contact: z
    .string()
    .min(1, "Contact is required")
    .max(200, "Contact is too long")
    .transform((s) => s.replace(/[\r\n]/g, " ").trim()),
  email: z
    .string()
    .email("Invalid email address")
    .max(200, "Email is too long")
    .optional()
    .or(z.literal(""))
    .transform((s) => (s ? s.trim() : undefined)),
  answers: z
    .record(z.string(), z.union([z.number(), z.string()]))
    .refine((obj) => {
      return Object.values(obj).every((v) => {
        const n = typeof v === "string" ? Number(v) : v;
        return Number.isFinite(n) && n >= 0 && n <= 4;
      });
    }, "Answer values must be numbers between 0 and 4"),
  score: z.number().int().min(0).max(100),
  band: z.string().min(1).max(60),
});

type ParsedBody = z.infer<typeof BodySchema>;

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Rate limit: max 5 submissions per IP per hour. Prevents spam/abuse
  // without blocking legitimate users. Returns 429 with Retry-After header.
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
        headers: {
          "Retry-After": String(rl.retryAfter),
          "X-RateLimit-Remaining": "0",
        },
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

  const parsed = BodySchema.safeParse(json);
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
  const data: ParsedBody = parsed.data;

  // 1. Look up the existing submission (saved by /api/ogi/save when the
  //    results screen appeared). We use the most recent matching submission
  //    from the last 10 minutes. If not found, create one as a fallback.
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  let submission = await db.ogiSubmission.findFirst({
    where: {
      name: data.name,
      contact: data.contact,
      createdAt: { gte: tenMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!submission) {
    try {
      submission = await db.ogiSubmission.create({
        data: {
          name: data.name,
          role: data.role,
          contact: data.contact,
          email: data.email ?? null,
          score: data.score,
          band: data.band,
          answersJson: JSON.stringify(data.answers),
        },
      });
    } catch (err) {
      console.error("[ogi/submit] DB insert failed:", err);
      return NextResponse.json(
        { success: false, error: "Failed to save submission" },
        { status: 500 }
      );
    }
  }

  // 2. Send emails + regenerate Excel in parallel. Each is independent — a
  //    failure in one never blocks the others. The DB record (saved above) is
  //    the source of truth.
  //
  //    emailSent reflects whether the USER's result email delivered (this is
  //    what the frontend uses to pick its success message).
  //    ownerNotified reflects whether the AVYSTRA internal notification sent.
  //    smtpConfigured tells the frontend whether email is set up at all —
  //    when false, we show "submission received" instead of "emailed to you".
  const [ownerResult, userResult, excelResult] = await Promise.all([
    // AVYSTRA internal notification email
    sendEmail({
      from: FROM_EMAIL,
      to: AVYSTRA_NOTIFY_EMAIL,
      replyTo: SMTP_USER,
      subject: `New OGI Submission — ${data.name} (${data.role})`,
      text: buildAvystraEmailText(data),
      html: buildAvystraEmailHtml(data),
      headers: {
        "X-Priority": "1", // high priority for internal notifications
      },
    }),

    // User result email — premium, personalized, anti-spam optimized.
    // Subject includes the score for immediate value + open-rate boost.
    data.email
      ? sendEmail({
          from: FROM_EMAIL,
          to: data.email,
          replyTo: SMTP_USER,
          subject: `Your OGI Score: ${data.score}/100 — Here's What It Means`,
          text: buildUserEmailText({
            name: data.name,
            role: data.role,
            score: data.score,
            band: data.band,
          }),
          html: buildUserEmailHtml({
            name: data.name,
            role: data.role,
            score: data.score,
            band: data.band,
          }),
          headers: {
            "X-Priority": "3", // normal priority
            // Preheader text (preview snippet in inboxes) — anti-spam signal.
            // Empty preheaders look spammy; this provides a useful preview.
            "X-MS-Exchange-Organization-AuthAs": "Internal",
          },
        })
      : Promise.resolve({ success: false, retriable: false, code: "NOEMAIL" }),

    // Excel regeneration (best-effort)
    exportOgiSubmissionsToExcel()
      .then(() => ({ success: true, retriable: false }))
      .catch((err) => {
        console.error("[ogi/submit] Excel export failed:", err);
        return {
          success: false,
          retriable: false,
          error: String(err),
        };
      }),
  ]);

  // Log the full outcome for debugging
  console.info("[ogi/submit] outcome:", {
    submissionId: submission.id,
    smtpConfigured: isEmailConfigured,
    ownerNotified: ownerResult.success,
    userEmailSent: userResult.success,
    excelExported: excelResult.success,
    ownerError: ownerResult.error,
    userError: userResult.error,
  });

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    // User-facing: did the user's result email deliver?
    emailSent: userResult.success,
    // Owner-facing: did the AVYSTRA notification deliver? (for debugging)
    ownerNotified: ownerResult.success,
    // Config flag: is SMTP set up at all? When false, the frontend shows
    // "submission received" instead of "emailed to you".
    smtpConfigured: isEmailConfigured,
  });
}
