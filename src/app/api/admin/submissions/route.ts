import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  SubmissionsQuerySchema,
  buildSubmissionsWhere,
  buildSubmissionsOrderBy,
} from "@/lib/admin-submissions";

/**
 * GET /api/admin/submissions
 *
 * Paginated, searchable, filterable, sortable list of OGI submissions.
 * Requires an admin session — rejects unauthenticated/unauthorized requests
 * even if the frontend/middleware is bypassed.
 */
export async function GET(request: Request) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = SubmissionsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid query parameters." }, { status: 400 });
  }
  const query = parsed.data;

  try {
    const where = buildSubmissionsWhere(query);
    const [rows, total] = await Promise.all([
      db.ogiSubmission.findMany({
        where,
        orderBy: buildSubmissionsOrderBy(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          name: true,
          role: true,
          contact: true,
          email: true,
          score: true,
          band: true,
          status: true,
          createdAt: true,
        },
      }),
      db.ogiSubmission.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      submissions: rows,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  } catch (err) {
    console.error("[admin/submissions] list failed:", err);
    return NextResponse.json({ success: false, error: "Failed to load submissions." }, { status: 500 });
  }
}
