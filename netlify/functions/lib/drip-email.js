// netlify/functions/lib/drip-email.js
//
// Builds the Day 3 / 10 / 30 / 90 follow-up emails. Each email has one job:
//   Day 3   story + a free quick win for their weakest pillar (builds trust, shows the value)
//   Day 10  story + the full report (the structured next step)
//   Day 30  retake (reinforce: show the direction of travel) + report for non-buyers
//   Day 90  retake + poster thank-you + report for non-buyers
// Day 10/30/90 tease the "how it works" page, which is reached only from these emails.

const { ARCHETYPES } = require('./archetypes');
const { unsubscribeUrl: buildUnsubscribeUrl } = require('./retake');
const { getWeakestPillar } = require('./pillars');
const { links, SITE_URL } = require('./email-links');

function wrapEmail({ bodyHtml, unsubscribeUrl, preheader }) {
    return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#0f172a; font-size:1px; line-height:1px;">${preheader || ''}</div>
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
        <p style="font-size: 11px; line-height: 1.5; color:#64748b; margin: 12px 0 0;">This email is automated, but a real person reads the replies. We'd love to hear what you think of digitalwellbeingscore.app. We can't offer personal advice.</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const P = 'font-size: 14px; line-height: 1.6; color:#cbd5e1;';

function para(text, extra = '') {
    return `<p style="${P} ${extra}">${text}</p>`;
}

// kind 'report' = yellow (buy), 'retake' = blue (come back)
function button(label, href, kind = 'retake') {
    const bg = kind === 'report' ? '#eab308' : '#3b82f6';
    const fg = kind === 'report' ? '#1e293b' : '#ffffff';
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr><td style="background-color:${bg}; border-radius: 8px;">
            <a href="${href}" style="display:inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color:${fg}; text-decoration:none; text-transform: uppercase; letter-spacing: 1px;">${label}</a>
        </td></tr>
    </table>`;
}

function panel(titleHtml, innerHtml, titleColor = '#eab308') {
    return `<div style="background-color:#0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color:${titleColor}; margin: 0 0 6px; font-weight: bold;">${titleHtml}</p>
        ${innerHtml}
    </div>`;
}

// The teaser for the (unlisted) explainer page. It carries the same token so the page can
// show this reader's own result.
function howItWorksTease(lead, campaign) {
    return `<div style="border-top: 1px solid #334155; margin-top: 24px; padding-top: 16px;">
        <p style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color:#94a3b8; margin: 0 0 6px; font-weight: bold;">How the Digital Wellbeing Score works</p>
        <p style="font-size: 13px; line-height: 1.5; color:#cbd5e1; margin: 0 0 8px;">
            We've designed the scorecard to help anyone, whether they're completely unaware of how modern life affects their wellbeing, or already looking for practical ways to forge improvements.
            <a href="${links.howItWorks(lead.retake_token, campaign, 'how_it_works')}" style="color:#60a5fa; font-weight: bold;">Read more about how it works &rarr;</a>
        </p>
    </div>`;
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

// Founder photos. Leave a path null until the image is uploaded to public/images/, so no email
// ever ships with a broken image. (PREVIEW_PHOTOS=1 swaps in labelled placeholders for the preview.)
const FOUNDER_PHOTOS = {
    dark: null,   // e.g. '/images/founder-dark.jpg'   (display 280px wide, file 560x560)
    happy: '/images/founder-happy.jpg',  // e.g. '/images/founder-happy.jpg'  (display 88px, file 264x264)
};

function placeholder(label, w, h, bg, fg) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" fill="${fg}" font-family="Arial" font-size="${Math.round(w / 14)}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function photoSrc(key) {
    if (process.env.PREVIEW_PHOTOS) {
        return key === 'dark' ? placeholder('PHOTO: lit by screen glow', 560, 560, '#020617', '#64748b') : placeholder('PHOTO', 264, 264, '#fde68a', '#78350f');
    }
    return FOUNDER_PHOTOS[key] ? SITE_URL + FOUNDER_PHOTOS[key] : null;
}

// Small, centred, rounded: reads well on a phone and is deliberately too low-resolution to reuse.
function darkPhoto() {
    const src = photoSrc('dark');
    if (!src) return '';
    return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 8px auto 20px;"><tr><td>
        <img src="${src}" width="280" style="display:block; width:280px; max-width:100%; height:auto; border-radius: 12px; border: 1px solid #334155;" alt="Rakesh, late at night, his face lit only by his phone screen">
    </td></tr></table>`;
}

// Sign-off with a small friendly face, the trust anchor at the end of the email.
function signOff() {
    const src = photoSrc('happy');
    const photo = src
        ? `<td width="100" style="vertical-align: middle;"><img src="${src}" width="88" height="88" style="display:block; width:88px; height:88px; border-radius:50%; border: 2px solid #475569;" alt="Rakesh Pinao, smiling"></td>`
        : '';
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0 4px;"><tr>
        ${photo}
        <td style="vertical-align: middle;">
            <div style="font-size: 15px; font-weight: bold; color:#fff;">Rakesh Pinao</div>
            <div style="font-size: 12px; line-height: 1.5; color:#94a3b8;">Creator of the Digital Wellbeing Score<br>and a former Zombie Clickslave</div>
        </td>
    </tr></table>`;
}

function weakestFor(pillarScores) {
    try {
        return pillarScores ? getWeakestPillar(pillarScores) : null;
    } catch (e) {
        return null;
    }
}

function levelOf(lead) {
    return ARCHETYPES[lead.archetype_segment] ? lead.archetype_segment : 3;
}

// "Hi Ada," when we have a first name, otherwise "Hi,". Escaped: it is user-supplied.
function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function greeting(lead) {
    const name = String(lead.first_name || '').trim().slice(0, 40);
    return para(`Hi${name ? ' ' + escapeHtml(name) : ''},`);
}

function buildStory1(lead, pillarScores) {
    const campaign = 'drip_d3';
    const weakest = weakestFor(pillarScores);
    const level = levelOf(lead);
    const subject = "I was a Zombie Clickslave too";
    const preheader = 'The moment I realised my phone was running my day, and one small thing you can try tonight.';

    const quickWin = weakest
        ? panel(`One quick win for your ${weakest.label} pillar`, `<p style="font-size: 13px; line-height: 1.5; color:#cbd5e1; margin: 0;">${weakest.quickWin}</p>`, '#60a5fa')
        : '';

    const reportLine = para(
        `If you'd like a structured way to work on it, your ${ARCHETYPES[level].name} report has a 7-day challenge to help.
         <a href="${links.report(level, campaign, 'report_link')}" style="color:#60a5fa; font-weight: bold;">See what's in it &rarr;</a>`
    );

    const scoreLine = lead.current_score != null
        ? `A few days ago you scored <strong style="color:#fff;">${lead.current_score} / 75</strong> on the Digital Wellbeing Score. I want to tell you why I built it.`
        : 'I want to tell you why I built the Digital Wellbeing Score.';

    const body = `
        ${greeting(lead)}
        ${para(scoreLine)}
        ${para('I had high expectations of myself and big dreams for what I could achieve, so I was always giving it 110%. I told myself I was getting ahead: clearing a few extra emails from my phone after dinner, or doing a little more research before bed.')}
        ${darkPhoto()}
        ${para("At first I barely noticed the change. Then I hit burnout, and the phone stopped being a tool for work. I started doomscrolling to avoid work instead. Midnight became 2am. I wasn't sleeping, but I wasn't really working either.")}
        ${para('Even when I put the phone down, my mind kept circling the same thoughts. I became angry and moody, and took it out on the people I cared about most.')}
        ${para("Slowly, and later than I wish I had, I realised I was using my screen to avoid the real world. I'd lost countless hours of sleep, quality time and productive time that I would never get back. I felt trapped and alone, and I knew I had to change, even though I didn't yet know how.")}
        ${para('For now, notice one moment when you reach for your phone to avoid something else. Naming the habit is where my journey began.')}
        ${quickWin}
        ${reportLine}
        ${para('Sound familiar? How do you feel about your own journey: have you just started, or are you still struggling through?')}
        ${para('Next time: what actually changed.', 'font-style: italic;')}
        ${signOff()}
    `;
    return { subject, preheader, body };
}

function buildStory2(lead, pillarScores) {
    const campaign = 'drip_d10';
    const level = levelOf(lead);
    const archetype = ARCHETYPES[level];
    const weakest = weakestFor(pillarScores);
    const subject = "What actually changed (and what didn't)";
    const preheader = "Willpower didn't work. Here's what did.";

    const focus = weakest ? ` focused on your ${weakest.label.toLowerCase()} habits` : '';
    const body = `
        ${greeting(lead)}
        ${para("Last time I told you where I was at my lowest. Here's what actually helped.")}
        ${para("Willpower didn't. I thought I could beat the habit by simply putting my phone away, but every phone call or alarm put it back in my hand, and my usage crept up again. I could never stay away long enough for that approach to change anything.")}
        ${para('What helped was making the boundary harder to negotiate. I set strict time limits, turned the phone off, and disabled alarms when I needed real rest.')}
        ${para("I also asked my family for help. I gave my wife and kids permission to interrupt me, demand my attention, and call me back when I disappeared into the screen. They'd tried before, but I'd quietly pushed them away. This time I let them draw me back in. It felt good to feel present, loved, and wanted again.")}
        ${para("Eventually, going cold turkey helped too, but it wasn't permanent. The freedom I felt outdoors and playing with my family helped me put the old habits in context. Today I still use technology every day for work and to stay in touch, but it serves me and I'm more often in control. The breaks matter, but the habits I use while I'm online are what keep things in check.")}
        ${para('Your result is a starting place, not a verdict. Which one boundary could you try this week, in the area you most want to change? Then give it time to become familiar.')}
        ${para(`If you'd like help turning that into a plan, the full ${archetype.name} report gives you a 7-day challenge${focus}, one step at a time.`)}
        ${button('See your 7-day plan', links.report(level, campaign, 'report_button'), 'report')}
        ${para("It's a one-time purchase, not a subscription, and there's a 14-day refund if it isn't useful.", 'font-size: 12px; color:#94a3b8;')}
        ${para("We'll check in again in a month, and again in three, so you can see what has actually shifted.")}
        ${signOff()}
        ${howItWorksTease(lead, campaign)}
    `;
    return { subject, preheader, body };
}

function buildDay30(lead) {
    const campaign = 'drip_d30';
    const level = levelOf(lead);
    const archetype = ARCHETYPES[level];
    const subject = 'A month on: has your score moved?';
    const preheader = `You scored ${lead.current_score} / 75. Retaking takes about three minutes.`;

    const body = `
        ${recapBlock(archetype, lead.current_score)}
        ${para("It's been a month since you completed the Digital Wellbeing Score. A score is a snapshot. What tells you something is the direction it moves, and a month is long enough for small changes to show.")}
        ${para(`Retake the scorecard to see whether your ${archetype.name.toLowerCase()} habits have shifted, and get an updated 4-pillar breakdown. It takes about three minutes, and we'll show you the difference from last time.`)}
        ${button('Retake the Scorecard', links.retake(lead.retake_token, campaign, 'retake_button'))}
        ${lead.has_purchased_report ? '' : para(`Still wondering where to start? The ${archetype.name} report turns your result into a 7-day challenge. <a href="${links.report(level, campaign, 'report_link')}" style="color:#60a5fa; font-weight: bold;">See what's in it &rarr;</a>`)}
        ${howItWorksTease(lead, campaign)}
    `;
    return { subject, preheader, body };
}

function buildDay90(lead) {
    const campaign = 'drip_d90';
    const level = levelOf(lead);
    const archetype = ARCHETYPES[level];
    const subject = 'Three months on, and a small thank-you';
    const preheader = 'See where you stand now, plus a printable poster on us.';

    const body = `
        ${recapBlock(archetype, lead.current_score)}
        ${para("It's been three months since your Digital Wellbeing Score. Whatever has changed since, or hasn't, it's worth seeing where you stand now. Seeing the movement is often what keeps a new habit going.")}
        ${button('Retake the Scorecard', links.retake(lead.retake_token, campaign, 'retake_button'))}
        ${panel('A small thank-you', `<p style="font-size: 13px; line-height: 1.5; color:#cbd5e1; margin: 0 0 10px;">Here's a printable Digital Wellbeing poster for your wall or desk, a reminder of the four pillars, on us.</p>
            <a href="${links.poster(campaign, 'poster')}" style="color:#60a5fa; font-size: 13px; font-weight: bold;">Download your poster &rarr;</a>`)}
        ${lead.has_purchased_report ? '' : para(`If a retake shows you're stuck, the ${archetype.name} report gives you a 7-day challenge to get moving. <a href="${links.report(level, campaign, 'report_link')}" style="color:#60a5fa; font-weight: bold;">See what's in it &rarr;</a>`)}
        ${howItWorksTease(lead, campaign)}
    `;
    return { subject, preheader, body };
}

const STAGE_BUILDERS = { 3: buildStory1, 10: buildStory2, 30: buildDay30, 90: buildDay90 };

// Plain-text alternative generated from the same body, so the two never drift apart.
function htmlToText(html) {
    return html
        .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (m, href, label) => `${label.replace(/<[^>]+>/g, '').trim()} (${href})`)
        .replace(/<\/(p|div|tr|table)>/g, '\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&rarr;/g, '->')
        .replace(/&mdash;/g, '-')
        .replace(/&middot;/g, '-')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function buildDripEmail({ stage, lead, pillarScores = null }) {
    const builder = STAGE_BUILDERS[stage];
    if (!builder) throw new Error(`No email content defined for drip stage ${stage}`);

    const unsubscribeUrl = buildUnsubscribeUrl({ token: lead.retake_token });
    const { subject, preheader, body } = builder(lead, pillarScores);
    const html = wrapEmail({ bodyHtml: body, unsubscribeUrl, preheader });

    const text = `${htmlToText(body)}\n\n--\nDigital Wellbeing Score - digitalwellbeingscore.app\n(c) 2026 Open Democracy NZ\nUnsubscribe: ${unsubscribeUrl}\n\nThis email is automated, but a real person reads the replies. We'd love to hear what you think of digitalwellbeingscore.app. We can't offer personal advice.`;
    return { subject, html, text };
}

module.exports = { buildDripEmail };
