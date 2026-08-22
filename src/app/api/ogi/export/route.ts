import { NextResponse } from "next/server";
import { generateOgiSubmissionsExcel } from "@/lib/excel-export";
import { rateLimit } from "@/lib/rate-limit";
import { requireAdminSession } from "@/lib/admin-auth";

/**
 * GET /api/ogi/export
 *
 * Builds an up-to-date Excel export of all OGI submissions in memory and
 * returns it as a download. Also reachable at /ogi-submissions.xlsx (rewritten
 * to this route in next.config.ts).
 *
 * SECURITY: Requires admin session authentication. Without this, anyone could
 * download the full submissions table (PII leak — name, phone, email).
 *
 * Rate-limited to 10 requests per IP per hour (the DB query + workbook build is
 * moderately expensive).
 */
export async function GET(request: Request) {
  // ── Admin auth check — prevents PII leak ──
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin login required." },
      { status: 401 }
    );
  }

  const rl = rateLimit(request, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many export requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const fileBuffer = await generateOgiSubmissionsExcel();
    // Include time (HH-MM) to prevent same-day export filename collisions
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const time = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `ogi-submissions-${date}-${time}.xlsx`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[ogi/export] Failed to generate Excel file:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate Excel export. Please try again." },
      { status: 500 }
    );
  }
}
