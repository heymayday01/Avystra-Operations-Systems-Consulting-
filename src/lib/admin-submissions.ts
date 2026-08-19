/**
 * Shared query parsing/building for the admin submissions list — one code
 * path for GET /api/admin/submissions so search/filter/sort/pagination
 * validation never drifts.
 */

import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const SUBMISSION_STATUSES = ["new", "reviewed", "contacted", "archived"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const SORT_FIELDS = ["createdAt", "score", "name"] as const;

export const SubmissionsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(SUBMISSION_STATUSES).optional(),
  band: z.string().trim().max(60).optional(),
  sort: z.enum(SORT_FIELDS).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmissionsQuery = z.infer<typeof SubmissionsQuerySchema>;

export function buildSubmissionsWhere(query: SubmissionsQuery): Prisma.OgiSubmissionWhereInput {
  const where: Prisma.OgiSubmissionWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.band) where.band = query.band;

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { role: { contains: query.q, mode: "insensitive" } },
      { contact: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildSubmissionsOrderBy(
  query: SubmissionsQuery
): Prisma.OgiSubmissionOrderByWithRelationInput {
  return { [query.sort]: query.dir };
}
