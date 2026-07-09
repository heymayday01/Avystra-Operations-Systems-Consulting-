/**
 * Excel export for OGI submissions.
 *
 * Generates a styled .xlsx workbook from all OgiSubmission records entirely in
 * memory and returns it as a Buffer. Nothing is written to disk — the buffer
 * is streamed straight to the client by GET /api/ogi/export (also reachable at
 * the static-looking URL /ogi-submissions.xlsx via a rewrite in next.config).
 *
 * Building on-demand from the DB keeps the export always current and works on
 * read-only serverless filesystems (e.g. Vercel), where writing to /public
 * would fail.
 */

import ExcelJS from "exceljs";
import { db } from "@/lib/db";

/** Column definitions — order here determines column order in the sheet. */
interface ExportColumn {
  header: string;
  key: keyof RowData;
  width: number; // min width, auto-fit expands beyond this
}

interface RowData {
  id: string;
  name: string;
  role: string;
  contact: string;
  email: string;
  score: number;
  band: string;
  createdAt: string;
}

const COLUMNS: ExportColumn[] = [
  { header: "ID", key: "id", width: 26 },
  { header: "Name", key: "name", width: 18 },
  { header: "Role", key: "role", width: 24 },
  { header: "Contact", key: "contact", width: 20 },
  { header: "Email", key: "email", width: 28 },
  { header: "Score", key: "score", width: 10 },
  { header: "Band", key: "band", width: 20 },
  { header: "Submitted At", key: "createdAt", width: 24 },
];

/** Band → fill colour mapping (matches the email template palette). */
function bandFillColour(band: string): string {
  if (band.includes("High Growth")) return "E6F7F0"; // emerald-50
  if (band.includes("Growth Ready")) return "E6F0FF"; // blue-50
  if (band.includes("Execution Gap")) return "FFF7E6"; // amber-50
  return "FFE6E6"; // red-50 (Immediate Attention)
}

/** Format a Date as a readable IST timestamp. */
function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date) + " IST";
}

/**
 * Generate the OGI submissions Excel workbook in memory.
 *
 * @returns The .xlsx file as a Buffer, ready to stream as a download.
 * @throws If the DB query or workbook generation fails.
 */
export async function generateOgiSubmissionsExcel(): Promise<Buffer> {
  // Fetch all submissions, newest first.
  const submissions = await db.ogiSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AVYSTRA Website";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("OGI Submissions", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
  });

  // ── Header row ──
  sheet.columns = COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style the header row: navy background, bold white text, centered, gold bottom border
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B1B2E" }, // navy-deep
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFB8924E" } }, // gold accent
    };
  });

  // ── Data rows ──
  for (const sub of submissions) {
    const row = sheet.addRow({
      id: sub.id,
      name: sub.name,
      role: sub.role,
      contact: sub.contact,
      email: sub.email || "",
      score: sub.score,
      band: sub.band,
      createdAt: formatTimestamp(sub.createdAt),
    } satisfies RowData);

    // Colour-tint the Band cell based on the band value
    const bandCell = row.getCell("band");
    bandCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: bandFillColour(sub.band) },
    };
    bandCell.font = { bold: true };

    // Score cell: bold + centered
    const scoreCell = row.getCell("score");
    scoreCell.font = { bold: true };
    scoreCell.alignment = { horizontal: "center" };

    // Subtle bottom border on every row for readability
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = cell.alignment || { vertical: "middle" };
    });

    row.height = 20;
  }

  // ── Auto-fit column widths ──
  // exceljs has no built-in auto-fit, so we calculate the max content length
  // per column and set width = max(header_len, max_content_len) + 2 padding.
  sheet.columns.forEach((column) => {
    let maxLen = String(column.header ?? "").length;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const val = cell.value;
      const len =
        val === null || val === undefined
          ? 0
          : val instanceof Date
            ? formatTimestamp(val).length
            : String(val).length;
      if (len > maxLen) maxLen = len;
    });
    // cap at 50 to avoid absurdly wide columns
    column.width = Math.min(Math.max(maxLen + 2, 10), 50);
  });

  // If there are no submissions yet, add an empty placeholder row so the
  // file isn't empty (helps the user confirm the file is valid).
  if (submissions.length === 0) {
    sheet.addRow({
      id: "—",
      name: "No submissions yet",
      role: "",
      contact: "",
      email: "",
      score: 0,
      band: "",
      createdAt: "",
    } satisfies RowData);
  }

  // ── Serialize to an in-memory buffer (no disk write) ──
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
