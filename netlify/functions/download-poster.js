// netlify/functions/download-poster.js
//
// Public, unauthenticated redirect to the free poster PDF. Deliberately hardcodes the
// filename rather than accepting one via query param — a generic "?file=" endpoint
// against the same private bucket would let anyone fetch the paid archetype reports
// too, without paying. Purchased-report delivery gets its own, purchase-checked
// endpoint when the Stripe integration is built.

const { getSignedReportUrl } = require('./lib/report-storage');

const POSTER_FILENAME = 'digital-wellbeing-scorecard-poster.pdf';

exports.handler = async function (event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const signedUrl = await getSignedReportUrl(POSTER_FILENAME, 300);
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
