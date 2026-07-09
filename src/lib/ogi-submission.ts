/**
 * Shared OGI submission logic — one code path for /api/ogi/save and
 * /api/ogi/submit so validation, scoring, and de-duplication never drift
 * between the two routes.
 *
 * Design rules:
 *  - score + band are ALWAYS computed server-side from the raw answers via
 *    computeOgiScore(). The client's score/band (if sent) are ignored — the
 *    database is never allowed to trust the browser.
 *  - Both routes share one dedupe window, so `save` (which fires when the
 *    results screen appears) creates the row and `submit` (which fires when
 *    the user asks for the full report) reuses it instead of inserting twice.
 */

import { z } from "zod";
import { db } from "@/lib/db";
import { computeOgiScore, getResultBand } from "@/lib/ogi-data";
import { appendSubmissionToSheet } from "@/lib/sheets";
import type { OgiSubmission } from "@prisma/client";

/** How long after creation a submission counts as "the same session". */
const DEDUPE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Request body accepted by both routes. Identity fields + raw answers only —
 * score/band are derived, never accepted from the client. Unknown keys (e.g. a
 * client-sent `score`) are stripped by Zod's default object parsing.
 */
export const SubmissionSchema = z.object({
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
    .refine(
      (obj) =>
        Object.values(obj).every((v) => {
          const n = typeof v === "string" ? Number(v) : v;
          return Number.isFinite(n) && n >= 0 && n <= 4;
        }),
      "Answer values must be numbers between 0 and 4"
    ),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

/** Compute the 0–100 score + band from raw (string-keyed) answers. */
export function scoreForAnswers(answers: SubmissionInput["answers"]) {
  const numeric = Object.fromEntries(
    Object.entries(answers).map(([k, v]) => [
      Number(k),
      typeof v === "string" ? Number(v) : v,
    ])
  );
  return computeOgiScore(numeric);
}

export interface FindOrCreateResult {
  submission: OgiSubmission;
  score: number;
  band: ReturnType<typeof getResultBand>;
  /** True if a new row was inserted, false if an existing one was reused. */
  created: boolean;
}

/**
 * Return the submission for this session — reusing a matching row from the
 * last {@link DEDUPE_WINDOW_MS} (same name + contact) if one exists, otherwise
 * creating it. Score + band are computed server-side and returned so callers
 * (e.g. the email builder) don't recompute.
 *
 * @throws if the database insert/query fails — callers should map this to 500.
 */
export async function findOrCreateSubmission(
  data: SubmissionInput
): Promise<FindOrCreateResult> {
  const { score, band } = scoreForAnswers(data.answers);

  const windowStart = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const existing = await db.ogiSubmission.findFirst({
    where: {
      name: data.name,
      contact: data.contact,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { submission: existing, score, band, created: false };
  }

  const submission = await db.ogiSubmission.create({
    data: {
      name: data.name,
      role: data.role,
      contact: data.contact,
      email: data.email ?? null,
      score,
      band: band.badge,
      answersJson: JSON.stringify(data.answers),
    },
  });

  // Mirror only NEW rows to Google Sheets — reusing the DB's dedupe means the
  // Sheet never gets duplicates, regardless of which route created the row.
  // Best-effort: appendSubmissionToSheet never throws.
  await appendSubmissionToSheet({
    name: data.name,
    role: data.role,
    contact: data.contact,
    email: data.email,
    score,
    band: band.badge,
    answers: data.answers,
  });

  return { submission, score, band, created: true };
}
