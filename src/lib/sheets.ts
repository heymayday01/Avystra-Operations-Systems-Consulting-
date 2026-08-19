/**
 * Google Sheets sink — mirrors each new OGI submission into a Google Sheet via
 * a Google Apps Script Web App (doPost).
 *
 * Why a webhook and not the Sheets API: no service-account/OAuth setup, no
 * extra dependency, and it's a plain outbound HTTPS POST — which works cleanly
 * on Vercel serverless (unlike a direct DB connection). The Apps Script appends
 * a row; see the deployment snippet in the project notes.
 *
 * This is best-effort: it NEVER throws. A Sheets failure must not block the DB
 * write or the emails — the database remains the source of truth.
 *
 * Required env:
 *   SHEETS_WEBHOOK_URL — the Apps Script Web App /exec URL
 *   SHEETS_SECRET      — shared token; must match SHARED_SECRET in the script
 */

export interface SheetSubmission {
  name: string;
  role: string;
  contact: string;
  email?: string;
  score: number;
  band: string;
  answers: Record<string, number | string>;
}

/** Whether the Sheets webhook is configured. */
export const isSheetsConfigured = Boolean(process.env.SHEETS_WEBHOOK_URL?.trim());

/**
 * Append a submission row to the Google Sheet. Returns true on success, false
 * on any failure (unconfigured, network error, or a non-ok response). Never
 * throws — callers can ignore the result.
 *
 * Uses fetch with redirect: "follow" (Apps Script returns a 302 to
 * googleusercontent.com). 10s timeout so a slow Sheet can't hang the request.
 * Retries once on transient network errors (not on auth rejections).
 */
export async function appendSubmissionToSheet(
  data: SheetSubmission
): Promise<boolean> {
  const url = process.env.SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.SHEETS_SECRET?.trim() ?? "";
  if (!url) return false; // not configured — silently skip

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Apps Script follows a 302 to googleusercontent.com; Node's fetch
        // follows redirects by default. 10s cap so a slow Sheet can't hang us.
        body: JSON.stringify({ secret, ...data }),
        signal: AbortSignal.timeout(10_000),
        redirect: "follow",
      });

      // Apps Script always returns HTTP 200; success is signalled by { ok: true }
      // in the body. A blocked/misconfigured web app returns 200 with an HTML
      // error page, so we must require an explicit ok:true — not merely "not
      // false" — to avoid silently thinking a failed post succeeded.
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok !== true) {
        console.error("[sheets] append rejected:", {
          status: res.status,
          error: json.error ?? "non-JSON response (web app likely not public or wrong URL)",
          attempt: attempt + 1,
        });
        // Don't retry on auth errors — they won't fix themselves
        if (json.error === "unauthorized" || res.status === 403) return false;
        continue; // retry on other errors
      }

      if (attempt === 0) {
        console.info("[sheets] row appended:", {
          name: data.name,
          score: data.score,
          band: data.band,
        });
      }
      return true;
    } catch (err) {
      console.error("[sheets] append failed:", {
        attempt: attempt + 1,
        error: err instanceof Error ? err.message : String(err),
      });
      // Retry once for transient network errors (timeout, connection reset)
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }
  }

  return false;
}
