// netlify/functions/lib/retake.js
//
// Email links identify a lead by a random per-lead token (marketing_leads.retake_token)
// instead of their email address, so URLs never carry personal data. The token is a bearer
// secret that only ever travels in that lead's own emails, so it must never be returned
// by any endpoint a stranger can call (e.g. subscribe).

const SITE_URL = 'https://digitalwellbeingscore.app';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidToken(token) {
    return typeof token === 'string' && UUID_PATTERN.test(token);
}

function retakeUrl(token) {
    return isValidToken(token) ? `${SITE_URL}/?r=${token}` : SITE_URL;
}

// The old ?email= link is retired. A lead without a token (shouldn't happen: the column is
// NOT NULL) gets a mailto so an email never ships without a working way to opt out.
function unsubscribeUrl({ token }) {
    return isValidToken(token)
        ? `${SITE_URL}/.netlify/functions/unsubscribe?t=${token}`
        : 'mailto:hello@digitalwellbeingscore.app?subject=Unsubscribe';
}

module.exports = { isValidToken, retakeUrl, unsubscribeUrl };
