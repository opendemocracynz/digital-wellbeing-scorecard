// netlify/functions/retake-info.js
//
// Resolves the retake token from an email link to the lead's details, so the quiz can
// start in "retake" mode (skip the email step, show their last score, record the new one
// against the same lead). The response goes only to whoever holds the token.

const { supabaseAdmin } = require('./lib/report-storage');
const { isValidToken } = require('./lib/retake');

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function notFound() {
    return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'not_found' }) };
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = event.queryStringParameters?.t;
    if (!isValidToken(token)) {
        return notFound();
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('marketing_leads')
            .select('email, first_name, archetype_segment, current_score, has_purchased_report')
            .eq('retake_token', token)
            .maybeSingle();

        if (error) throw error;
        if (!data) return notFound();

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                email: data.email,
                firstName: data.first_name,
                previousLevel: data.archetype_segment,
                previousScore: data.current_score,
                hasPurchased: data.has_purchased_report === true,
            }),
        };
    } catch (error) {
        console.error('retake-info failed:', error);
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'lookup_failed' }) };
    }
};
