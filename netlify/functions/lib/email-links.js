// netlify/functions/lib/email-links.js
//
// Every link in a lifecycle email carries UTM tags so GA4 can show which email (and which
// button in it) drives retakes and purchases. The retake token, where present, is the only
// identifier in a link; the site strips it from the address bar and from GA's page_location.

const { retakeUrl, isValidToken } = require('./retake');

const SITE_URL = 'https://digitalwellbeingscore.app';

function tagged(url, campaign, content) {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'email');
    u.searchParams.set('utm_medium', 'lifecycle');
    u.searchParams.set('utm_campaign', campaign);
    if (content) u.searchParams.set('utm_content', content);
    return u.toString();
}

const links = {
    retake: (token, campaign, content) => tagged(retakeUrl(token), campaign, content),
    report: (level, campaign, content) => tagged(`${SITE_URL}/payment.html?level=${encodeURIComponent(level)}`, campaign, content),
    // The "how it works" page is deliberately not linked from the site; it is reached from emails.
    howItWorks: (token, campaign, content) => {
        const base = isValidToken(token) ? `${SITE_URL}/how-it-works?r=${token}` : `${SITE_URL}/how-it-works`;
        return tagged(base, campaign, content);
    },
    poster: (campaign, content) => tagged(`${SITE_URL}/.netlify/functions/download-poster`, campaign, content),
};

module.exports = { links, tagged, SITE_URL };
