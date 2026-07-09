import { NextResponse } from "next/server";
import { generateOgiSubmissionsExcel } from "@/lib/excel-export";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/ogi/export
 *
 * Builds an up-to-date Excel export of all OGI submissions in memory and
 * returns it as a download. Also reachable at /ogi-submissions.xlsx (rewritten
 * to this route in next.config.ts).
 *
 * Rate-limited to 10 requests per IP per hour (the DB query + workbook build is
 * moderately expensive).
 */
export async function GET(request: Request) {
  const rl = rateLimit(request, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many export requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const fileBuffer = await generateOgiSubmissionsExcel();
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `ogi-submissions-${timestamp}.xlsx`;

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
