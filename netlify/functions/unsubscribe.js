// netlify/functions/unsubscribe.js

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function page(message) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Unsubscribed - Digital Wellbeing Score</title></head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#e2e8f0;">
    <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding: 80px 20px;">
            <table role="presentation" style="max-width: 420px; background-color:#1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; text-align:center;">
                <tr><td>
                    <p style="font-size: 18px; font-weight: bold; color:#fff; margin: 0 0 8px;">Digital Wellbeing Score</p>
                    <p style="font-size: 14px; line-height: 1.6; color:#cbd5e1; margin: 0;">${message}</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const params = event.queryStringParameters || {};
    const token = params.t;

    // Links identify the lead by their random token only. The old ?email= form is retired:
    // anyone could unsubscribe any address just by knowing it.
    const invalid = (statusCode) => ({
        statusCode,
        headers: { 'Content-Type': 'text/html' },
        body: page("This unsubscribe link isn't valid. Please use the link from your most recent email, or reply to it and we'll remove you."),
    });

    try {
        const { isValidToken } = require('./lib/retake');
        if (!isValidToken(token)) return invalid(400);

        const { supabaseAdmin } = require('./lib/report-storage');
        const { data, error: lookupError } = await supabaseAdmin
            .from('marketing_leads')
            .select('email')
            .eq('retake_token', token)
            .maybeSingle();
        if (lookupError) throw lookupError;
        if (!data) return invalid(404);

        const email = data.email;

        const { error } = await supabase.rpc('unsubscribe_lead', { p_email: email });
        if (error) throw error;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: page(`You've been unsubscribed. ${escapeHtml(email)} will no longer receive emails from us.`),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: page('Something went wrong processing your request. Please try again later.'),
        };
    }
};
