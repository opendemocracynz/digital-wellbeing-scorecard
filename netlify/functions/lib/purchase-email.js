// netlify/functions/lib/purchase-email.js
//
// Transactional "your report is ready" email, sent by stripe-webhook.js after a verified
// payment. The archetype is looked up from the level server-side rather than taken from
// Checkout metadata, which the browser supplied and so can't be trusted in email HTML.

const { ARCHETYPES } = require('./archetypes');

const SITE_URL = 'https://digitalwellbeingscore.app';

function buildPurchaseEmail({ level, sessionId }) {
    const archetype = ARCHETYPES[level];
    const downloadUrl = `${SITE_URL}/.netlify/functions/download-report?session_id=${encodeURIComponent(sessionId)}`;
    const subject = `Your ${archetype.name} report is ready`;

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding: 24px 0;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">
    <tr><td style="padding: 0 20px 24px; text-align:center;">
        <span style="color:#60a5fa; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">Digital Wellbeing Score</span>
    </td></tr>

    <tr><td style="background-color:#1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; color:#e2e8f0;">
        <p style="font-size: 16px; margin: 0 0 16px;">Thank you for your purchase!</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 24px;">
            <tr>
                <td width="72" style="vertical-align: top;">
                    <img src="${SITE_URL}${archetype.img}" width="64" height="64" style="border-radius:50%; border: 2px solid ${archetype.color};" alt="${archetype.name}">
                </td>
                <td style="vertical-align: top; padding-left: 14px;">
                    <div style="font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color:${archetype.color}; font-weight: bold;">Level ${level}</div>
                    <div style="font-size: 20px; font-weight: bold; color:#fff;">${archetype.name}</div>
                </td>
            </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">Your full report, with your action plan and resource toolkit, is ready to download.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr><td style="background-color:#eab308; border-radius: 8px;">
                <a href="${downloadUrl}" style="display:inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color:#1e293b; text-decoration:none; text-transform: uppercase; letter-spacing: 1px;">Download Your Report</a>
            </td></tr>
        </table>

        <p style="font-size: 12px; line-height: 1.6; color:#94a3b8;">Keep this email: the button above works whenever you need it. If you have any trouble, just reply to this email.</p>
        <p style="font-size: 14px; color:#cbd5e1; margin-top: 24px;">Good luck!<br>Rakesh Pinao</p>
    </td></tr>

    <tr><td style="padding: 24px 20px 0; text-align:center;">
        <p style="font-size: 11px; color:#64748b; margin: 0 0 4px;">Digital Wellbeing Score &middot; digitalwellbeingscore.app</p>
        <p style="font-size: 11px; color:#64748b; margin: 0;">&copy; 2026 Open Democracy NZ</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const text = `Thank you for your purchase!

Your report: ${archetype.name} (Level ${level})

Your full report, with your action plan and resource toolkit, is ready to download:
${downloadUrl}

Keep this email: the link works whenever you need it. If you have any trouble, just reply to this email.

Good luck!
Rakesh Pinao

Digital Wellbeing Score - digitalwellbeingscore.app
(c) 2026 Open Democracy NZ`;

    return { subject, html, text };
}

module.exports = { buildPurchaseEmail };
