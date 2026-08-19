/**
 * OGI submissions → Google Sheets mirror.
 *
 * Deploy: open the target Google Sheet → Extensions → Apps Script, paste this
 * in as Code.gs, set SHARED_SECRET below to match SHEETS_SECRET in .env, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the /exec URL into SHEETS_WEBHOOK_URL.
 *
 * To rotate the secret later: update SHARED_SECRET here AND .env, then
 * Deploy → Manage deployments → edit the existing deployment → New version →
 * Deploy. Editing the code alone does NOT update the live /exec URL.
 */

const SHARED_SECRET = "ppuzpwNDmFmOTbqhu23H00uv0Dj3FjR";

const HEADERS = [
  "Timestamp",
  "Name",
  "Role",
  "Contact",
  "Email",
  "Score",
  "Band",
  "Answers",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: "invalid secret" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    sheet.appendRow([
      new Date(),
      body.name || "",
      body.role || "",
      body.contact || "",
      body.email || "",
      body.score,
      body.band || "",
      JSON.stringify(body.answers || {}),
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
