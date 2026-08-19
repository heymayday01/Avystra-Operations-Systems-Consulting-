import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { assertSameOrigin, requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { SUBMISSION_STATUSES } from "@/lib/admin-submissions";
import { questions } from "@/lib/ogi-data";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/submissions/[id]
 *
 * Full submission detail, including answersJson parsed and mapped to each
 * question's text/dimension (reusing src/lib/ogi-data.ts — the same source
 * of truth the diagnostic form and email templates use).
 */
export async function GET(request: Request, { params }: RouteParams) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const submission = await db.ogiSubmission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
    }

    let rawAnswers: Record<string, number | string> = {};
    try {
      rawAnswers = JSON.parse(submission.answersJson);
    } catch {
      rawAnswers = {};
    }

    const answers = questions.map((q) => {
      const raw = rawAnswers[String(q.id)];
      const value = typeof raw === "string" ? Number(raw) : raw;
      return {
        questionId: q.id,
        text: q.text,
        dimensionCode: q.dimensionCode,
        dimensionName: q.dimensionName,
        value: typeof value === "number" && Number.isFinite(value) ? value : null,
      };
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        name: submission.name,
        role: submission.role,
        contact: submission.contact,
        email: submission.email,
        score: submission.score,
        band: submission.band,
        status: submission.status,
        adminNotes: submission.adminNotes,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        answers,
      },
    });
  } catch (err) {
    console.error("[admin/submissions/:id] fetch failed:", err);
    return NextResponse.json({ success: false, error: "Failed to load submission." }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  adminNotes: z.string().max(2000).transform((s) => s.replace(/\r\n/g, "\n")).optional(),
});

/**
 * PATCH /api/admin/submissions/[id]
 *
 * Updates only status/adminNotes — never the submission's original answers
 * or identity fields.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Invalid request origin." }, { status: 403 });
  }

  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.status === undefined && parsed.data.adminNotes === undefined) {
    return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
  }

  try {
    const updated = await db.ogiSubmission.update({
      where: { id },
      data: parsed.data,
      select: { id: true, status: true, adminNotes: true, updatedAt: true },
    });
    return NextResponse.json({ success: true, submission: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
    }
    console.error("[admin/submissions/:id] update failed:", err);
    return NextResponse.json({ success: false, error: "Failed to update submission." }, { status: 500 });
  }
}
