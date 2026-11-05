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

// Falls back to the email form for leads without a token (or if the column isn't there yet),
// so an email never ships with a broken unsubscribe link.
function unsubscribeUrl({ email, token }) {
    return isValidToken(token)
        ? `${SITE_URL}/.netlify/functions/unsubscribe?t=${token}`
        : `${SITE_URL}/.netlify/functions/unsubscribe?email=${encodeURIComponent(email)}`;
}

module.exports = { isValidToken, retakeUrl, unsubscribeUrl };
