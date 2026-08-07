// netlify/functions/download-report.js
//
// Purchase-checked redirect to a paid archetype report PDF. Unlike
// download-poster.js (always free), this re-verifies the Stripe checkout
// session server-side before generating a signed URL — the query string
// can't be trusted on its own, since anyone could type ?status=success into
// the address bar.

const { getSignedReportUrl } = require('./lib/report-storage');

exports.handler = async function (event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const sessionId = event.queryStringParameters?.session_id;
    if (!sessionId) {
        return { statusCode: 400, body: 'Missing session_id.' };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        return { statusCode: 500, body: 'Stripe is not configured.' };
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });

    const session = await response.json();

    if (!response.ok) {
        return { statusCode: 404, body: 'Checkout session not found.' };
    }

    if (session.payment_status !== 'paid') {
        return { statusCode: 402, body: 'This checkout session has not been paid.' };
    }

    const level = Number(session.metadata?.level);
    if (!level || level < 1 || level > 5) {
        return { statusCode: 400, body: 'Could not determine which report was purchased.' };
    }

    try {
        const signedUrl = await getSignedReportUrl(`level-${level}-report.pdf`, 300);
        return {
            statusCode: 302,
            headers: { Location: signedUrl },
            body: '',
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Could not generate a download link right now. Please try again shortly.',
        };
    }
};
