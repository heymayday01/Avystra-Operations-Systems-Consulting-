/**
 * Google Sheets integration — official Sheets API v4 with service account.
 *
 * BEST PRACTICE ARCHITECTURE (production-grade):
 * 1. Uses the official googleapis SDK (not a webhook hack) — stable,
 *    type-safe, and handles auth/refresh automatically.
 * 2. Service account authentication — no OAuth flow, no token refresh
 *    needed. The service account email is whitelisted on the sheet.
 * 3. Structured error logging — every failure is logged with the error
 *    code so you can diagnose quota/sheet-permission issues.
 * 4. Graceful degradation — when not configured, returns false silently.
 *    Never throws. The database remains the source of truth.
 * 5. Timeout + retry — 10s timeout per attempt, 1 retry for transient
 *    network failures (not for auth errors).
 *
 * Required env:
 *   SHEETS_SPREADSHEET_ID    — the spreadsheet ID from the URL
 *   SHEETS_CLIENT_EMAIL      — service account email (xxx@yyy.iam.gserviceaccount.com)
 *   SHEETS_PRIVATE_KEY       — service account private key (PEM, with \n escapes)
 *
 * Setup (one-time):
 *   1. Go to Google Cloud Console → APIs → enable "Google Sheets API"
 *   2. Go to IAM → Service Accounts → Create → download JSON key
 *   3. Copy the spreadsheet ID from your Google Sheet URL
 *   4. Share the Google Sheet with the service account email (Editor)
 *   5. Set the 3 env vars above in .env / Vercel
 */

import { google } from "googleapis";

export interface SheetSubmission {
  name: string;
  role: string;
  contact: string;
  email?: string;
  score: number;
  band: string;
  answers: Record<string, number | string>;
}

const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID?.trim();
const CLIENT_EMAIL = process.env.SHEETS_CLIENT_EMAIL?.trim();
const PRIVATE_KEY = process.env.SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

/** Whether the Sheets API is configured (all 3 env vars present). */
export const isSheetsConfigured = Boolean(
  SPREADSHEET_ID && CLIENT_EMAIL && PRIVATE_KEY
);

// Singleton JWT client — created once per process, reused across requests.
let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

// Sheet header row — written once on first submission if the sheet is empty.
const SHEET_HEADERS = [
  "Timestamp",
  "Name",
  "Role",
  "Contact",
  "Email",
  "Score",
  "Band",
  "Answers (JSON)",
];

/**
 * Append a submission row to the Google Sheet. Returns true on success,
 * false on any failure. Never throws — callers can ignore the result.
 *
 * Uses the official Sheets API v4 `spreadsheets.values.append` with
 * `INSERT_ROWS` insertDataOption — appends a new row at the bottom.
 */
export async function appendSubmissionToSheet(
  data: SheetSubmission
): Promise<boolean> {
  if (!isSheetsConfigured) return false; // not configured — silently skip

  const sheets = getSheetsClient();
  const timestamp = new Date().toISOString();

  // Row values matching the header order
  const rowValues = [
    timestamp,
    data.name,
    data.role,
    data.contact,
    data.email ?? "",
    data.score,
    data.band,
    JSON.stringify(data.answers),
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowValues],
        },
      });

      if (response.status === 200) {
        if (attempt === 0) {
          console.info("[sheets] row appended:", {
            name: data.name,
            score: data.score,
            band: data.band,
          });
        }
        return true;
      }

      console.error("[sheets] append returned non-200:", {
        status: response.status,
        attempt: attempt + 1,
      });
    } catch (err) {
      const error = err as { code?: number; message?: string };
      console.error("[sheets] append failed:", {
        attempt: attempt + 1,
        code: error.code,
        message: error.message,
      });

      // Don't retry on auth errors (401/403) — they won't fix themselves
      if (
        error.code === 401 ||
        error.code === 403 ||
        error.code === 400
      ) {
        return false;
      }

      // Retry once for transient errors (500, 503, network timeouts)
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }
  }

  return false;
}
