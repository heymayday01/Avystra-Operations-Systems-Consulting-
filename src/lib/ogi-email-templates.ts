/**
 * OGI email templates — premium, personalized, deliverability-optimized.
 *
 * ANTI-SPAM STRATEGY:
 * 1. Multipart/alternative (HTML + plain text) — spam filters penalize
 *    HTML-only emails. The plain-text version is crafted to be genuinely
 *    useful (not just a stripped HTML copy).
 * 2. Preheader text — the preview snippet in inboxes. Empty preheaders
 *    look spammy; we set a compelling 80-char preview.
 * 3. Full company name — "AVYSTRA Consulting Private Limited" appears in
 *    the header, footer, and signature for brand consistency + trust.
 * 4. Personalized greeting — uses the recipient's name, not "Dear User".
 * 5. No spam trigger words — avoided "FREE", "GUARANTEE", "ACT NOW", etc.
 * 6. Clean HTML — table-based layout (email-client compatible), inline
 *    styles (Gmail strips <style> tags), no JavaScript, no forms.
 * 7. Proper From/Reply-To — replies go to a real monitored inbox.
 * 8. Unsubscribe header — List-Unsubscribe + List-Unsubscribe-Post (one-click)
 *    signals to Gmail that this is a legitimate transactional email.
 *
 * TEMPLATE DESIGN (user email):
 * - Premium navy/gold branding matching the website
 * - Personalized greeting with the user's name
 * - Score visualization (large number + colored band)
 * - 3 personalized insights based on their score band
 * - Clear next steps (what happens next)
 * - WhatsApp CTA for immediate conversation
 * - Full company name in footer with contact details
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

/** Get personalized insights based on the score band. */
function getPersonalizedInsights(score: number, band: string): string[] {
  if (score >= 82) {
    return [
      "Your organization has strong foundations — execution systems are working and managers are empowered.",
      "Focus on protecting these systems as you scale. Growth won't break what you've built.",
      "The next step is strategic scaling — you're ready for structural expansion with minimal friction.",
    ];
  } else if (score >= 66) {
    return [
      "Your core systems are mostly aligned, but execution consistency is your gap.",
      "Performance currently depends on specific key players rather than systems.",
      "Standardizing manager authority will unlock scalable growth without strain.",
    ];
  } else if (score >= 45) {
    return [
      "Communication blocks and department silos are slowing your execution every day.",
      "Action depends heavily on crisis control or key managers tracking things manually.",
      "Accountability is tribal rather than systematic — this is costing you momentum.",
    ];
  } else {
    return [
      "Extreme key-person dependency — decisions must route through the founder to stay active.",
      "Underperformance lags and accountability loops are weak across multiple dimensions.",
      "Long-term plans get lost under reactive fire-fighting. This is fixable with the right systems.",
    ];
  }
}

/** Get the next-steps message based on the score band. */
function getNextSteps(score: number): { title: string; desc: string } {
  if (score >= 82) {
    return {
      title: "You're Ready to Scale",
      desc: "We'll reach out within 24 hours to discuss how to protect your systems during rapid growth and identify the 1-2 areas that need hardening before your next phase.",
    };
  } else if (score >= 66) {
    return {
      title: "Let's Close the Execution Gap",
      desc: "Our team will contact you within 24 hours to walk through standardizing manager authority and removing the key-player dependency that's capping your growth.",
    };
  } else if (score >= 45) {
    return {
      title: "Let's Fix the Execution Leaks",
      desc: "We'll reach out within 24 hours to discuss the specific bottlenecks in your accountability and communication systems — and how to close them permanently.",
    };
  } else {
    return {
      title: "Urgent: Let's Rebuild the Foundation",
      desc: "Our team will contact you within 24 hours to discuss breaking the founder-dependency cycle and building the accountability systems your organization needs to function autonomously.",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AVYSTRA INTERNAL NOTIFICATION EMAIL (to the team)
// ═══════════════════════════════════════════════════════════════════════════

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
This submission was recorded automatically from the AVYSTRA website OGI diagnostic.

AVYSTRA Consulting Private Limited
info@avystra.co.in | +91 85960 59607`;
}

// ═══════════════════════════════════════════════════════════════════════════
// USER RESULT EMAIL (premium, personalized, deliverability-optimized)
// ═══════════════════════════════════════════════════════════════════════════

export function buildUserEmailHtml(data: {
  name: string;
  role: string;
  score: number;
  band: string;
}): string {
  const { name, role, score, band } = data;
  const colour = scoreColour(score);
  const insights = getPersonalizedInsights(score, band);
  const nextSteps = getNextSteps(score);
  const firstName = name.split(" ")[0] || name;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden preview text for inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Your OGI Score is ${score}/100. Here's what it means for ${firstName}'s organization — and what happens next.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,27,46,0.08);">

        <!-- Header with full company name -->
        <tr>
          <td style="background:linear-gradient(135deg,#0B1B2E 0%,#16263D 100%);padding:36px 32px;text-align:center;">
            <div style="font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#B8924E;font-weight:700;margin-bottom:10px;">AVYSTRA Consulting Private Limited</div>
            <div style="font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">Your Organizational Growth<br>Index Result</div>
          </td>
        </tr>

        <!-- Personalized greeting -->
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="font-size:16px;color:#0f172a;margin:0 0 16px;line-height:1.6;">Hi ${escapeHtml(firstName)},</p>
            <p style="font-size:14px;color:#475569;margin:0 0 28px;line-height:1.7;">Thank you for taking the Organizational Growth Index assessment. Based on your responses as ${escapeHtml(role || "a business leader")}, here's what we found:</p>
          </td>
        </tr>

        <!-- Score visualization -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:14px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:28px;text-align:center;">
                  <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Your OGI Score</div>
                  <div style="font-size:52px;font-weight:800;color:${colour};line-height:1;margin-bottom:12px;letter-spacing:-0.02em;">${score}<span style="font-size:22px;color:#94a3b8;font-weight:400;">/100</span></div>
                  <span style="display:inline-block;padding:7px 18px;border-radius:999px;background:${colour};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(band)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Personalized insights -->
        <tr>
          <td style="padding:0 32px 28px;">
            <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#0B1B2E;font-weight:700;margin-bottom:16px;">What Your Score Reveals</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${insights
                .map(
                  (insight, idx) => `
              <tr>
                <td style="padding:0 0 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:24px;vertical-align:top;padding-right:12px;">
                        <div style="width:20px;height:20px;border-radius:50%;background:${colour};color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;">${idx + 1}</div>
                      </td>
                      <td style="vertical-align:top;padding-top:1px;">
                        <p style="font-size:13.5px;color:#334155;margin:0;line-height:1.6;">${escapeHtml(insight)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
                )
                .join("")}
            </table>
          </td>
        </tr>

        <!-- Next steps -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1B2E;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:24px;">
                  <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#B8924E;font-weight:700;margin-bottom:8px;">What Happens Next</div>
                  <div style="font-size:15px;font-weight:600;color:#ffffff;margin-bottom:10px;">${escapeHtml(nextSteps.title)}</div>
                  <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">${escapeHtml(nextSteps.desc)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- WhatsApp CTA -->
        <tr>
          <td style="padding:0 32px 28px;text-align:center;">
            <a href="https://wa.me/918596059607?text=${encodeURIComponent(
              `Hi AVYSTRA, I'm ${firstName}. I just completed the OGI assessment (score: ${score}/100). I'd like to discuss what this means for my organization.`
            )}" style="display:inline-block;padding:14px 32px;background:#25D366;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:999px;letter-spacing:0.02em;">
              Discuss on WhatsApp →
            </a>
          </td>
        </tr>

        <!-- Signature -->
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="font-size:14px;color:#0f172a;margin:0 0 4px;line-height:1.6;">Warm regards,</p>
            <p style="font-size:14px;color:#0f172a;margin:0 0 2px;line-height:1.6;"><strong style="font-weight:600;">Kirankumar Pandey</strong></p>
            <p style="font-size:12px;color:#64748b;margin:0;line-height:1.5;">Founder, AVYSTRA Consulting Private Limited</p>
          </td>
        </tr>

        <!-- Footer with full company name + contact -->
        <tr>
          <td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #eef1f5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;">
                  <p style="font-size:11px;color:#64748b;margin:0 0 6px;font-weight:600;">AVYSTRA Consulting Private Limited</p>
                  <p style="font-size:11px;color:#94a3b8;margin:0 0 12px;line-height:1.5;">
                    <a href="mailto:info@avystra.co.in" style="color:#B8924E;text-decoration:none;">info@avystra.co.in</a>
                    &nbsp;•&nbsp;
                    <a href="tel:+918596059607" style="color:#B8924E;text-decoration:none;">+91 85960 59607</a>
                  </p>
                  <p style="font-size:10px;color:#cbd5e1;margin:0;line-height:1.5;">You received this email because you completed the OGI assessment on avystra.co.in.<br>Reply to this email if you have any questions.</p>
                </td>
              </tr>
            </table>
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
  role: string;
  score: number;
  band: string;
}): string {
  const { name, role, score, band } = data;
  const firstName = name.split(" ")[0] || name;
  const insights = getPersonalizedInsights(score, band);
  const nextSteps = getNextSteps(score);

  // Genuine plain-text version — not just stripped HTML. Formatted for
  // readability in any email client, with proper line breaks + spacing.
  return `Hi ${firstName},

Thank you for taking the Organizational Growth Index assessment. Based on your responses as ${role || "a business leader"}, here's what we found.

YOUR OGI SCORE: ${score}/100
Band: ${band}

WHAT YOUR SCORE REVEALS

${insights.map((insight, idx) => `${idx + 1}. ${insight}`).join("\n\n")}

WHAT HAPPENS NEXT

${nextSteps.title}
${nextSteps.desc}

Our team will contact you within 24 hours. If you'd prefer to reach us sooner, reply to this email or message us on WhatsApp: https://wa.me/918596059607

Warm regards,
Kirankumar Pandey
Founder, AVYSTRA Consulting Private Limited

---
AVYSTRA Consulting Private Limited
info@avystra.co.in | +91 85960 59607

You received this email because you completed the OGI assessment on avystra.co.in. Reply to this email if you have any questions.`;
}
