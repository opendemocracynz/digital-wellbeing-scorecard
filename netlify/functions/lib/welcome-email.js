// netlify/functions/lib/welcome-email.js

const { ARCHETYPES } = require('./archetypes');
const { unsubscribeUrl: buildUnsubscribeUrl } = require('./retake');
const { PILLAR_RANGES, getWeakestPillar } = require('./pillars');
const { links } = require('./email-links');

const SITE_URL = 'https://digitalwellbeingscore.app';

function pillarBarRow(key, score) {
    const { min, max, label } = PILLAR_RANGES[key];
    const percent = Math.max(4, Math.round(((score - min) / (max - min)) * 100));
    return `
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1; width: 110px;">${label}</td>
            <td style="padding: 6px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#334155; border-radius: 6px;">
                    <tr>
                        <td style="background-color:#60a5fa; width:${percent}%; height: 10px; border-radius: 6px; font-size:0; line-height:0;">&nbsp;</td>
                        <td style="font-size:0; line-height:0;">&nbsp;</td>
                    </tr>
                </table>
            </td>
            <td style="padding: 6px 0 6px 10px; font-size: 13px; color: #f8fafc; width: 40px; text-align: right;">${score}</td>
        </tr>`;
}

function buildWelcomeEmail({ totalScore, archetypeLevel, pillarScores, email, retakeToken }) {
    const archetype = ARCHETYPES[archetypeLevel] || ARCHETYPES[3];
    const weakest = getWeakestPillar(pillarScores);
    const archetypeImageUrl = `${SITE_URL}${archetype.img}`;
    const reportUrl = links.report(archetypeLevel, 'welcome', 'report_button');
    const unsubscribeUrl = buildUnsubscribeUrl({ token: retakeToken });

    const subject = `Your Digital Wellbeing Score: ${archetype.name}`;

    const pillarRows = ['Physiological', 'Psychological', 'Social', 'Cognitive']
        .map((key) => pillarBarRow(key, pillarScores[key]))
        .join('');

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#0f172a; font-size:1px; line-height:1px;">You scored ${totalScore} / 75. Here's your four-pillar breakdown and your biggest opportunity.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding: 24px 0;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">
    <tr><td style="padding: 0 20px 24px; text-align:center;">
        <span style="color:#60a5fa; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">Digital Wellbeing Score</span>
    </td></tr>

    <tr><td style="background-color:#1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; color:#e2e8f0;">
        <p style="font-size: 16px; margin: 0 0 4px;">Congratulations on completing the scorecard!</p>
        <p style="font-size: 14px; color:#94a3b8; margin: 0 0 24px;">Your Digital Wellbeing Score is <strong style="color:#fff;">${totalScore} / 75</strong>.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 24px;">
            <tr>
                <td width="72" style="vertical-align: top;">
                    <img src="${archetypeImageUrl}" width="64" height="64" style="border-radius:50%; border: 2px solid ${archetype.color};" alt="${archetype.name}">
                </td>
                <td style="vertical-align: top; padding-left: 14px;">
                    <div style="font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color:${archetype.color}; font-weight: bold;">Level ${archetypeLevel}</div>
                    <div style="font-size: 20px; font-weight: bold; color:#fff;">${archetype.name}</div>
                </td>
            </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">${archetype.desc}</p>
        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1; font-style: italic;">${archetype.cta}</p>

        <div style="height:1px; background-color:#334155; margin: 24px 0;"></div>

        <p style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color:#94a3b8; margin: 0 0 12px;">Your 4-Pillar Breakdown</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pillarRows}</table>

        <div style="background-color:#0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color:#f97316; margin: 0 0 6px; font-weight: bold;">Your Critical Weakness: ${weakest.label} (${weakest.weakness})</p>
            <p style="font-size: 13px; line-height: 1.5; color:#cbd5e1; margin: 0 0 8px;"><strong>What this means:</strong> ${weakest.whatThisMeans}</p>
            <p style="font-size: 13px; line-height: 1.5; color:#cbd5e1; margin: 0;"><strong>The risk:</strong> Left unchecked, this typically leads to ${weakest.risk.toLowerCase()}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1; margin-top: 24px;">
            Now you know, you can act to improve your wellbeing. We'll send a reminder in 1 month and 3 months to suggest a retake, so you can track progress against your Digital Wellbeing Score.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1;">
            Knowing your score is the first step. Your ${archetype.name} report goes deeper: what the research shows, how the four pillars fit together, and a 7-day challenge to start lifting your ${weakest.label} score.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0 8px;">
            <tr><td style="background-color:#eab308; border-radius: 8px;">
                <a href="${reportUrl}" style="display:inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color:#1e293b; text-decoration:none; text-transform: uppercase; letter-spacing: 1px;">Get Your 7-Day Plan</a>
            </td></tr>
        </table>
        <p style="font-size: 12px; color:#94a3b8; margin: 0 0 8px;">One-time purchase, not a subscription. 14-day refund if it isn't useful.</p>

        <p style="font-size: 14px; color:#cbd5e1; margin-top: 24px;">Good luck!<br>Rakesh Pinao</p>
        <p style="font-size: 12px; color:#94a3b8; line-height: 1.6;">Rakesh is the creator of DigitalWellbeingScore.app and a previous digital Zombie Clickslave. In our next email, find out about his journey toward greater digital agency and improved personal wellbeing.</p>
    </td></tr>

    <tr><td style="padding: 24px 20px 0; text-align:center;">
        <p style="font-size: 11px; color:#64748b; margin: 0 0 4px;">Digital Wellbeing Score &middot; digitalwellbeingscore.app</p>
        <p style="font-size: 11px; color:#64748b; margin: 0 0 4px;">You received this email because you completed the Digital Wellbeing Score.</p>
        <p style="font-size: 11px; color:#64748b; margin: 0;">&copy; 2026 Legitimise This Limited &middot; <a href="${unsubscribeUrl}" style="color:#64748b;">Unsubscribe</a></p>
        <p style="font-size: 11px; line-height: 1.5; color:#64748b; margin: 12px 0 0;">This email is automated, but a real person reads the replies. We'd love to hear what you think of digitalwellbeingscore.app. We can't offer personal advice.</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const text = `Congratulations on completing the scorecard!

Your Digital Wellbeing Score is ${totalScore} / 75.

Your Archetype: ${archetype.name} (Level ${archetypeLevel})
${archetype.desc}
${archetype.cta}

Your 4-Pillar Breakdown:
Physiological: ${pillarScores.Physiological}
Psychological: ${pillarScores.Psychological}
Social: ${pillarScores.Social}
Cognitive: ${pillarScores.Cognitive}

Your Critical Weakness: ${weakest.label} (${weakest.weakness})
What this means: ${weakest.whatThisMeans}
The risk: Left unchecked, this typically leads to ${weakest.risk.toLowerCase()}

We'll send a reminder in 1 and 3 months to suggest a retake.

Your ${archetype.name} report goes deeper: what the research shows, how the four pillars fit together, and a 7-day challenge to start lifting your ${weakest.label} score.
Get your 7-day plan: ${reportUrl}
(One-time purchase, not a subscription. 14-day refund if it isn't useful.)

Good luck!
Rakesh Pinao

Digital Wellbeing Score - digitalwellbeingscore.app
You received this email because you completed the Digital Wellbeing Score.
(c) 2026 Legitimise This Limited
Unsubscribe: ${unsubscribeUrl}

This email is automated, but a real person reads the replies. We'd love to hear what you think of digitalwellbeingscore.app. We can't offer personal advice.`;

    return { subject, html, text };
}

module.exports = { buildWelcomeEmail };
