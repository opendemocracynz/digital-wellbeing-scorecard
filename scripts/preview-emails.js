// scripts/preview-emails.js
//
// Renders every lifecycle email to static files so they can be opened in a browser:
//   node scripts/preview-emails.js
// Output goes to email-preview/ (git-ignored). Open email-preview/index.html.
// Sample data only; nothing is sent and no environment variables are needed.

// Show labelled photo placeholders so the layout can be judged before the real images exist.
process.env.PREVIEW_PHOTOS = '1';

const fs = require('fs');
const path = require('path');
const { buildWelcomeEmail } = require('../netlify/functions/lib/welcome-email');
const { buildDripEmail } = require('../netlify/functions/lib/drip-email');

const OUT = path.join(__dirname, '..', 'email-preview');
const TOKEN = '3f2b8c1e-9a4d-4e7b-8c55-0d1f2a3b4c5d';

// Weakest pillar here is Social (2/10 -> 0%), so the quick win and report copy mention it.
const PILLARS_SOCIAL_WEAK = { Physiological: 6, Psychological: 18, Social: 3, Cognitive: 14 };
const PILLARS_PHYSIO_WEAK = { Physiological: 2, Psychological: 20, Social: 7, Cognitive: 16 };

const lead = (over = {}) => ({ email: 'sample@example.com', archetype_segment: 2, current_score: 38, retake_token: TOKEN, has_purchased_report: false, ...over });

const emails = [
    { id: 'welcome', label: 'Welcome (day 0)', note: 'Sent right after signup. Goal: the report sale.', ...buildWelcomeEmail({ totalScore: 38, archetypeLevel: 2, pillarScores: PILLARS_SOCIAL_WEAK, email: 'sample@example.com', retakeToken: TOKEN }) },
    { id: 'day3', label: 'Day 3: story + quick win', note: 'Weakest pillar: Social.', ...buildDripEmail({ stage: 3, lead: lead(), pillarScores: PILLARS_SOCIAL_WEAK }) },
    { id: 'day3-physio', label: 'Day 3, different pillar', note: 'Same email, weakest pillar: Physiological, level 4.', ...buildDripEmail({ stage: 3, lead: lead({ archetype_segment: 4, current_score: 60 }), pillarScores: PILLARS_PHYSIO_WEAK }) },
    { id: 'day3-nopillar', label: 'Day 3, no pillar data', note: 'What an older lead without pillar scores gets (quick-win box omitted).', ...buildDripEmail({ stage: 3, lead: lead(), pillarScores: null }) },
    { id: 'day10', label: 'Day 10: story + report', note: 'Includes the "how it works" teaser.', ...buildDripEmail({ stage: 10, lead: lead(), pillarScores: PILLARS_SOCIAL_WEAK }) },
    { id: 'day30', label: 'Day 30: retake (non-buyer)', note: 'Report link shown because they have not bought.', ...buildDripEmail({ stage: 30, lead: lead() }) },
    { id: 'day90', label: 'Day 90: retake + poster (non-buyer)', note: '', ...buildDripEmail({ stage: 90, lead: lead() }) },
    { id: 'day90-buyer', label: 'Day 90 (already bought)', note: 'No report link for buyers.', ...buildDripEmail({ stage: 90, lead: lead({ has_purchased_report: true }) }) },
];

fs.mkdirSync(OUT, { recursive: true });

const rows = emails.map((e) => {
    fs.writeFileSync(path.join(OUT, `${e.id}.html`), e.html);
    fs.writeFileSync(path.join(OUT, `${e.id}.txt`), e.text);
    return `<li><a href="${e.id}.html"><strong>${e.label}</strong></a> &nbsp;<a href="${e.id}.txt" style="font-size:12px">plain text</a><br>
        <span class="s">Subject: ${e.subject}</span>${e.note ? `<br><span class="n">${e.note}</span>` : ''}</li>`;
}).join('\n');

fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Email preview</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#1e293b}li{margin:0 0 16px}.s{color:#334155}.n{color:#64748b;font-size:13px}a{color:#2563eb}</style></head>
<body><h1>Lifecycle email preview</h1><p>Sample data only. Links point at the live site, so retake and unsubscribe links use a sample token and will show "not valid" until a real one is used.</p><ul>${rows}</ul></body></html>`);

console.log(`Wrote ${emails.length} emails to ${OUT}`);
