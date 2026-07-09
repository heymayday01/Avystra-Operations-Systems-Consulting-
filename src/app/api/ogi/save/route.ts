import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  SubmissionSchema,
  findOrCreateSubmission,
} from "@/lib/ogi-submission";

/**
 * POST /api/ogi/save
 *
 * Auto-saves an OGI submission to the database. Called when the RESULTS screen
 * appears, before the user clicks "GET MY Full Report". Does NOT send emails —
 * that happens via /api/ogi/submit when the user explicitly asks for the report.
 *
 * Score + band are computed server-side from the answers (the client is never
 * trusted). If a matching submission already exists for this session it is
 * reused instead of inserting a duplicate — see findOrCreateSubmission().
 */
export async function POST(request: Request) {
  // 10 saves per IP per hour — more lenient than submit since no emails are sent.
  const rl = rateLimit(request, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
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

  try {
    const { submission, created } = await findOrCreateSubmission(parsed.data);
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      duplicate: !created,
    });
  } catch (err) {
    console.error("[ogi/save] DB insert failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
