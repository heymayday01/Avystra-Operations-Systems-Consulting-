/**
 * OGI email template builders — HTML + plain-text versions for both the
 * AVYSTRA internal notification and the user's result email.
 *
 * EXTRACTED FROM submit/route.ts so the route handler is just orchestration
 * (validation → save → send emails → export Excel), not template rendering.
 *
 * Each template has an HTML version (for rich rendering in Gmail/Outlook) and
 * a plain-text version (required by spam filters — a multipart/alternative
 * email with both parts scores significantly better than HTML-only).
 *
 * All user-supplied content is HTML-escaped to prevent injection.
 */

import {
  questions,
  answerLabel,
  dimensionLabels,
  type DimensionCode,
} from "@/lib/ogi-data";

/** Minimal HTML escaper to prevent injection in email bodies. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface OgiSubmissionData {
  name: string;
  role: string;
  contact: string;
  email?: string;
  score: number;
  band: string;
  answers: Record<string, number | string>;
}

/** Map a raw answer value (0–4) to its color for the score badge. */
function scoreColour(score: number): string {
  return score >= 82
    ? "#10B981"
    : score >= 66
    ? "#3B82F6"
    : score >= 45
    ? "#F59E0B"
    : "#EF4444";
}

// ── AVYSTRA notification email (internal) ──────────────────────────────────

export function buildAvystraEmailHtml(data: OgiSubmissionData): string {
  const { name, role, contact, email, score, band, answers } = data;

  const numericAnswers: Record<number, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    numericAnswers[Number(k)] = typeof v === "string" ? Number(v) : v;
  }

  const dimensions: DimensionCode[] = ["L", "M", "T", "E"];
  const rows = dimensions
    .map((code) => {
      const dimQuestions = questions.filter((q) => q.dimensionCode === code);
      const dimRows = dimQuestions
        .map((q) => {
          const ans = numericAnswers[q.id];
          return `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #eef1f5;color:#64748b;font-size:12px;white-space:nowrap;">Q${q.id}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eef1f5;color:#0f172a;font-size:13px;line-height:1.5;">${escapeHtml(q.text)}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eef1f5;color:#b8924e;font-weight:700;font-size:12px;text-align:center;white-space:nowrap;">${answerLabel(ans)} <span style="color:#94a3b8;font-weight:400;">(${ans ?? "—"})</span></td>
            </tr>`;
        })
        .join("");
      return `
          <tr>
            <td colspan="3" style="padding:12px 12px 6px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#334155;">${escapeHtml(dimensionLabels[code])}</span>
            </td>
          </tr>
          ${dimRows}`;
    })
    .join("");

  const colour = scoreColour(score);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#0B1B2E;padding:28px 32px;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B8924E;font-weight:700;margin-bottom:6px;">New OGI Submission</div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">${escapeHtml(name)} <span style="color:#94a3b8;font-weight:400;font-size:16px;">— ${escapeHtml(role)}</span></div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #eef1f5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:600;margin-bottom:4px;">OGI Score</div>
                  <div style="font-size:34px;font-weight:800;color:${colour};line-height:1;">${score}<span style="font-size:16px;color:#94a3b8;font-weight:400;">/100</span></div>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${colour}15;color:${colour};font-size:12px;font-weight:700;letter-spacing:0.04em;">${escapeHtml(band)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #eef1f5;">
            <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:600;margin-bottom:10px;">Contact</div>
            <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#0f172a;line-height:1.7;">
              <tr><td style="color:#64748b;padding-right:12px;width:80px;">Phone:</td><td>${escapeHtml(contact)}</td></tr>
              <tr><td style="color:#64748b;padding-right:12px;">Email:</td><td>${email ? escapeHtml(email) : '<span style="color:#94a3b8;">Not provided</span>'}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 8px;">
            <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:600;margin-bottom:10px;">Full Assessment Responses</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr>
                  <th align="left" style="padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">#</th>
                  <th align="left" style="padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Question</th>
                  <th align="center" style="padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Response</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;">
            <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.6;">This submission was recorded automatically from the AVYSTRA website OGI diagnostic. Reply to this email or contact the lead directly to follow up.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildAvystraEmailText(data: OgiSubmissionData): string {
  const { name, role, contact, email, score, band, answers } = data;
  const numericAnswers: Record<number, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    numericAnswers[Number(k)] = typeof v === "string" ? Number(v) : v;
  }
  const dimensions: DimensionCode[] = ["L", "M", "T", "E"];
  const body = dimensions
    .map((code) => {
      const dimQuestions = questions.filter((q) => q.dimensionCode === code);
      const lines = dimQuestions
        .map((q) => {
          const ans = numericAnswers[q.id];
          return `  Q${q.id}: ${q.text}\n        -> ${answerLabel(ans)} (${ans ?? "—"})`;
        })
        .join("\n");
      return `\n${dimensionLabels[code].toUpperCase()}\n${lines}`;
    })
    .join("\n");

  return `NEW OGI SUBMISSION
${name} — ${role}

OGI SCORE: ${score}/100 (${band})

CONTACT
  Phone: ${contact}
  Email: ${email || "Not provided"}

FULL ASSESSMENT RESPONSES
${body}

---
This submission was recorded automatically from the AVYSTRA website OGI diagnostic. Reply to this email or contact the lead directly to follow up.

AVYSTRA Consulting Pvt. Ltd.
info@avystra.co.in | +91 85960 59607`;
}

// ── User result email (to the person who took the assessment) ──────────────

export function buildUserEmailHtml(data: {
  name: string;
  score: number;
  band: string;
}): string {
  const { name, score, band } = data;
  const colour = scoreColour(score);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#0B1B2E;padding:32px;text-align:center;">
            <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8924E;font-weight:700;margin-bottom:8px;">AVYSTRA Consulting</div>
            <div style="font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">Your OGI Result</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#0f172a;margin:0 0 24px;line-height:1.6;">Hi ${escapeHtml(name)},</p>
            <p style="font-size:14px;color:#475569;margin:0 0 28px;line-height:1.7;">Thank you for completing the Organizational Growth Index assessment. Here is your result:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #eef1f5;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:600;margin-bottom:6px;">Your OGI Score</div>
                  <div style="font-size:44px;font-weight:800;color:${colour};line-height:1;margin-bottom:10px;">${score}<span style="font-size:18px;color:#94a3b8;font-weight:400;">/100</span></div>
                  <span style="display:inline-block;padding:6px 16px;border-radius:999px;background:${colour}15;color:${colour};font-size:12px;font-weight:700;letter-spacing:0.04em;">${escapeHtml(band)}</span>
                </td>
              </tr>
            </table>
            <p style="font-size:14px;color:#475569;margin:0 0 12px;line-height:1.7;">A member of the AVYSTRA team will follow up with you shortly to walk through what these results mean for your organization and discuss potential next steps.</p>
            <p style="font-size:14px;color:#475569;margin:0 0 32px;line-height:1.7;">In the meantime, if you have any questions, simply reply to this email or reach us at <a href="mailto:info@avystra.co.in" style="color:#B8924E;text-decoration:none;">info@avystra.co.in</a>.</p>
            <p style="font-size:14px;color:#0f172a;margin:0;line-height:1.6;">Warm regards,<br><strong style="font-weight:600;">The AVYSTRA Team</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #eef1f5;">
            <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center;line-height:1.6;">AVYSTRA Consulting Pvt. Ltd. — info@avystra.co.in — +91 85960 59607</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildUserEmailText(data: {
  name: string;
  score: number;
  band: string;
}): string {
  const { name, score, band } = data;
  return `Hi ${name},

Thank you for completing the Organizational Growth Index assessment. Here is your result:

YOUR OGI SCORE: ${score}/100 (${band})

A member of the AVYSTRA team will follow up with you shortly to walk through what these results mean for your organization and discuss potential next steps.

In the meantime, if you have any questions, simply reply to this email or reach us at info@avystra.co.in.

Warm regards,
The AVYSTRA Team

---
AVYSTRA Consulting Pvt. Ltd.
info@avystra.co.in | +91 85960 59607`;
}
