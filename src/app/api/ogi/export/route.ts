import { NextResponse } from "next/server";
import { exportOgiSubmissionsToExcel } from "@/lib/excel-export";

/**
 * GET /api/ogi/export
 *
 * Regenerates the OGI submissions Excel file on demand and returns it as a
 * download. Useful for ad-hoc exports or if the auto-regenerated file in
 * /public ever falls out of sync.
 *
 * The file is also always available at the static URL /ogi-submissions.xlsx
 * (auto-regenerated on every new submission). This endpoint is for when you
 * want to force a fresh export or download via an API call.
 */
export async function GET() {
  try {
    const filePath = await exportOgiSubmissionsToExcel();

    // Read the freshly-written file and stream it back as a download.
    const { readFile } = await import("fs/promises");
    const fileBuffer = await readFile(filePath);

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `ogi-submissions-${timestamp}.xlsx`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[ogi/export] Failed to generate Excel file:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate Excel export. Please try again.",
      },
      { status: 500 }
    );
  }
}
