// netlify/functions/lib/welcome-email.js

const { ARCHETYPES } = require('./archetypes');

const SITE_URL = 'https://digitalwellbeingscore.app';

// Each pillar rolls up a different number of questions, so raw scores aren't directly
// comparable across pillars — a pillar built from 2 questions (range 2-10) will almost
// always look "lower" than one built from 6 questions (range 6-30) even if the user is
// relatively stronger there. Weakest pillar is picked by normalized percentage instead.
const PILLAR_RANGES = {
    Physiological: { min: 2, max: 10, label: 'Physiological', weakness: 'Digital Fatigue' },
    Psychological: { min: 6, max: 30, label: 'Psychological', weakness: 'Mental Overload' },
    Social: { min: 2, max: 10, label: 'Social', weakness: 'Connection Gap' },
    Cognitive: { min: 5, max: 25, label: 'Cognitive', weakness: 'Information Haze' },
};

const WEAKNESS_COPY = {
    Physiological: {
        whatThisMeans: 'Your habits here are compromising your physical rest and energy.',
        risk: 'Chronic fatigue, disrupted sleep, and a body that never fully switches off.',
    },
    Psychological: {
        whatThisMeans: 'Your habits here are compromising your mental clarity and emotional regulation.',
        risk: 'Heightened anxiety, decision fatigue, and burnout.',
    },
    Social: {
        whatThisMeans: 'Your habits here are compromising your real-world relationships and presence.',
        risk: 'Shallow connections, isolation, and weakened relationships with the people who matter.',
    },
    Cognitive: {
        whatThisMeans: 'Your habits here are compromising your focus and ability to think deeply.',
        risk: 'Shortened attention span, difficulty concentrating, and less capacity for meaningful work.',
    },
};

function getWeakestPillar(pillarScores) {
    let weakestKey = null;
    let weakestPercent = Infinity;

    for (const key of Object.keys(PILLAR_RANGES)) {
        const { min, max } = PILLAR_RANGES[key];
        const percent = ((pillarScores[key] - min) / (max - min)) * 100;
        if (percent < weakestPercent) {
            weakestPercent = percent;
            weakestKey = key;
        }
    }

    return { key: weakestKey, ...PILLAR_RANGES[weakestKey], ...WEAKNESS_COPY[weakestKey] };
}

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

function buildWelcomeEmail({ totalScore, archetypeLevel, pillarScores, email }) {
    const archetype = ARCHETYPES[archetypeLevel] || ARCHETYPES[3];
    const weakest = getWeakestPillar(pillarScores);
    const archetypeImageUrl = `${SITE_URL}${archetype.img}`;
    const reportUrl = `${SITE_URL}/payment.html?level=${archetypeLevel}`;
    const unsubscribeUrl = `${SITE_URL}/.netlify/functions/unsubscribe?email=${encodeURIComponent(email)}`;

    const subject = `Your Digital Wellbeing Score: ${archetype.name}`;

    const pillarRows = ['Physiological', 'Psychological', 'Social', 'Cognitive']
        .map((key) => pillarBarRow(key, pillarScores[key]))
        .join('');

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
            We've identified specific protocols to lift your ${weakest.label} score. If you're serious about improving your digital habits, your targeted action plan is ready.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr><td style="background-color:#eab308; border-radius: 8px;">
                <a href="${reportUrl}" style="display:inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color:#1e293b; text-decoration:none; text-transform: uppercase; letter-spacing: 1px;">Unlock Your Targeted Action Plan</a>
            </td></tr>
        </table>

        <p style="font-size: 14px; color:#cbd5e1; margin-top: 24px;">Good luck!<br>Rakesh Pinao</p>
        <p style="font-size: 12px; color:#94a3b8; line-height: 1.6;">Rakesh is the creator of DigitalWellbeingScore.app and a previous digital Zombie Clickslave. In our next email, find out about his journey toward greater digital agency and improved personal wellbeing.</p>
    </td></tr>

    <tr><td style="padding: 24px 20px 0; text-align:center;">
        <p style="font-size: 11px; color:#64748b; margin: 0 0 4px;">Digital Wellbeing Score &middot; digitalwellbeingscore.app</p>
        <p style="font-size: 11px; color:#64748b; margin: 0 0 4px;">You received this email because you completed the Digital Wellbeing Score.</p>
        <p style="font-size: 11px; color:#64748b; margin: 0;">&copy; 2026 Open Democracy NZ &middot; <a href="${unsubscribeUrl}" style="color:#64748b;">Unsubscribe</a></p>
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

Unlock your targeted action plan: ${reportUrl}

Good luck!
Rakesh Pinao

Digital Wellbeing Score - digitalwellbeingscore.app
You received this email because you completed the Digital Wellbeing Score.
(c) 2026 Open Democracy NZ
Unsubscribe: ${unsubscribeUrl}`;

    return { subject, html, text };
}

module.exports = { buildWelcomeEmail };
