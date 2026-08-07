const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function getHeader(headers, name) {
    const key = Object.keys(headers || {}).find((headerName) => headerName.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
}

function getEmailFromSession(session) {
    const metadataEmail = session?.metadata?.email;
    const customerEmail = session?.customer_email;
    const customerDetailsEmail = session?.customer_details?.email;
    return (metadataEmail || customerEmail || customerDetailsEmail || '').trim().toLowerCase();
}

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function verifyStripeSignature(payload, signatureHeader, secret) {
    if (!signatureHeader || !secret) {
        return false;
    }

    const elements = signatureHeader.split(',').map((part) => part.trim());
    let timestamp;
    let signature;

    for (const element of elements) {
        const [key, value] = element.split('=');
        if (key === 't') {
            timestamp = value;
        } else if (key === 'v1') {
            signature = value;
        }
    }

    if (!timestamp || !signature) {
        return false;
    }

    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
        return false;
    }

    const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (error) {
        return false;
    }
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Stripe webhook secret is not configured.' }),
        };
    }

    if (!supabase) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Supabase is not configured.' }),
        };
    }

    const payload = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : (event.body || '');
    const signature = getHeader(event.headers || {}, 'stripe-signature');

    if (!verifyStripeSignature(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid Stripe signature.' }),
        };
    }

    let stripeEvent;
    try {
        stripeEvent = JSON.parse(payload);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid webhook payload.' }),
        };
    }

    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data?.object || {};
        const email = getEmailFromSession(session);

        if (!email) {
            return {
                statusCode: 200,
                body: JSON.stringify({ received: true, status: 'no_email' }),
            };
        }

        const { error } = await supabase.rpc('mark_report_purchased', { p_email: email });

        if (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ received: true }),
    };
};
