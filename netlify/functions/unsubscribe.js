// netlify/functions/unsubscribe.js

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    const email = event.queryStringParameters && event.queryStringParameters.email;

    if (!email) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html' },
            body: page("We couldn't find an email address to unsubscribe."),
        };
    }

    try {
        const { error } = await supabase.rpc('unsubscribe_lead', { p_email: email });
        if (error) throw error;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: page(`You've been unsubscribed. ${email} will no longer receive emails from us.`),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: page('Something went wrong processing your request. Please try again later.'),
        };
    }
};
