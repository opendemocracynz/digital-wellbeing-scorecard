// netlify/functions/lib/drip-email.js
//
// Builds the Day 3 / 10 / 30 / 90 follow-up emails. Day 3 and 10 carry the founder
// narrative and are placeholders until that copy is written (see PROJECT_CONTEXT.md) —
// everything else (subject, structure, CTA, unsubscribe link) is real and functional.

const { ARCHETYPES } = require('./archetypes');

const SITE_URL = 'https://digitalwellbeingscore.app';

function wrapEmail({ bodyHtml, unsubscribeUrl }) {
    return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding: 24px 0;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">
    <tr><td style="padding: 0 20px 24px; text-align:center;">
        <span style="color:#60a5fa; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">Digital Wellbeing Score</span>
    </td></tr>

    <tr><td style="background-color:#1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; color:#e2e8f0;">
        ${bodyHtml}
    </td></tr>

    <tr><td style="padding: 24px 20px 0; text-align:center;">
        <p style="font-size: 11px; color:#64748b; margin: 0 0 4px;">Digital Wellbeing Score &middot; digitalwellbeingscore.app</p>
        <p style="font-size: 11px; color:#64748b; margin: 0;">&copy; 2026 Open Democracy NZ &middot; <a href="${unsubscribeUrl}" style="color:#64748b;">Unsubscribe</a></p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function retakeButton(label) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr><td style="background-color:#3b82f6; border-radius: 8px;">
            <a href="${SITE_URL}" style="display:inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color:#fff; text-decoration:none; text-transform: uppercase; letter-spacing: 1px;">${label}</a>
        </td></tr>
    </table>`;
}

function recapBlock(archetype, score) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 20px;">
        <tr>
            <td width="56" style="vertical-align: top;">
                <img src="${SITE_URL}${archetype.img}" width="48" height="48" style="border-radius:50%; border: 2px solid ${archetype.color};" alt="${archetype.name}">
            </td>
            <td style="vertical-align: top; padding-left: 12px;">
                <div style="font-size: 11px; color:#94a3b8;">Last time, you scored <strong style="color:#fff;">${score} / 75</strong></div>
                <div style="font-size: 16px; font-weight: bold; color:#fff;">${archetype.name}</div>
            </td>
        </tr>
    </table>`;
}

function buildStory1(lead) {
    const subject = "I was a Zombie Clickslave too";
    const body = `
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">
            [[PLACEHOLDER — Story Part 1: the rock-bottom moment and the turning point. See PROJECT_CONTEXT.md writing spec. 150-250 words.]]
        </p>
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1; font-style: italic;">Next time: what actually changed.</p>
    `;
    return { subject, body };
}

function buildStory2(lead) {
    const subject = "What actually changed";
    const body = `
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">
            [[PLACEHOLDER — Story Part 2: the concrete habits/systems that worked and where things stand now. Optional callback to the reader's own weakest pillar. See PROJECT_CONTEXT.md writing spec. 150-250 words.]]
        </p>
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">We'll check in with you again in a month, and again in three, to see how you're tracking.</p>
    `;
    return { subject, body };
}

function buildDay30(lead) {
    const archetype = ARCHETYPES[lead.archetype_segment] || ARCHETYPES[3];
    const subject = "It's been a month — how are you doing?";
    const body = `
        ${recapBlock(archetype, lead.current_score)}
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">
            It's been a month since you completed the Digital Wellbeing Score. Habits shift fast — for better or worse — so this is a
            good moment to check in with yourself, not just with us.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">
            Retake the scorecard to see whether your ${archetype.name.toLowerCase()} habits have moved, and get an updated
            4-pillar breakdown.
        </p>
        ${retakeButton('Retake the Scorecard')}
    `;
    return { subject, body };
}

function buildDay90(lead) {
    const archetype = ARCHETYPES[lead.archetype_segment] || ARCHETYPES[3];
    const subject = "3 months in — plus a gift for you";
    const posterUrl = `${SITE_URL}/.netlify/functions/download-poster`;
    const body = `
        ${recapBlock(archetype, lead.current_score)}
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">
            It's been three months since your Digital Wellbeing Score. Whatever's changed since — or hasn't — it's worth
            seeing where you stand now.
        </p>
        ${retakeButton('Retake the Scorecard')}
        <div style="background-color:#0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color:#eab308; margin: 0 0 6px; font-weight: bold;">A small thank-you</p>
            <p style="font-size: 13px; line-height: 1.5; color:#cbd5e1; margin: 0 0 10px;">
                Here's a printable Digital Wellbeing poster for your wall or desk — a reminder of the four pillars, on us.
            </p>
            <a href="${posterUrl}" style="color:#60a5fa; font-size: 13px; font-weight: bold;">Download your poster &rarr;</a>
        </div>
    `;
    return { subject, body };
}

const STAGE_BUILDERS = { 3: buildStory1, 10: buildStory2, 30: buildDay30, 90: buildDay90 };

function buildDripEmail({ stage, lead }) {
    const builder = STAGE_BUILDERS[stage];
    if (!builder) throw new Error(`No email content defined for drip stage ${stage}`);

    const unsubscribeUrl = `${SITE_URL}/.netlify/functions/unsubscribe?email=${encodeURIComponent(lead.email)}`;
    const { subject, body } = builder(lead);
    const html = wrapEmail({ bodyHtml: body, unsubscribeUrl });

    return { subject, html, text: `${subject}\n\nView this email in an HTML-capable client. Unsubscribe: ${unsubscribeUrl}` };
}

module.exports = { buildDripEmail };
