const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { buildPurchaseEmail } = require('./lib/purchase-email');

const supabaseUrl = process.env.SUPABASE_URL;
// Service-role key: mark_report_purchased is not executable by the public anon key
// (see schema.sql), so only this verified-webhook path can flip has_purchased_report.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function getHeader(headers, name) {
    const key = Object.keys(headers || {}).find((headerName) => headerName.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
}

function getEmailFromSession(session) {
    // Prefer the email Stripe actually collected; metadata is only what the browser
    // told create-checkout-session, so it's a last resort.
    const customerDetailsEmail = session?.customer_details?.email;
    const customerEmail = session?.customer_email;
    const metadataEmail = session?.metadata?.email;
    return (customerDetailsEmail || customerEmail || metadataEmail || '').trim().toLowerCase();
}

const PURCHASE_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

const FROM_EMAIL = 'hello@digitalwellbeingscore.app';
const FROM_NAME = 'Digital Wellbeing Score';

async function sendPurchaseEmail({ email, level, sessionId }) {
    const { subject, html, text } = buildPurchaseEmail({ level, sessionId });

    const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: { email: FROM_EMAIL, name: FROM_NAME },
            to: [{ email }],
            subject,
            html,
            text,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`MailerSend send failed (${response.status}): ${errorBody}`);
    }
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

    if (PURCHASE_EVENTS.includes(stripeEvent.type)) {
        const session = stripeEvent.data?.object || {};

        // 'completed' also fires for delayed payment methods that haven't been paid yet.
        if (session.payment_status !== 'paid') {
            return {
                statusCode: 200,
                body: JSON.stringify({ received: true, status: 'not_paid' }),
            };
        }

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

        // Best-effort: the purchase is already recorded, so a failed email must not make
        // Stripe retry the webhook (which would just re-run the flag update).
        const level = Number(session.metadata?.level);
        if (process.env.MAILERSEND_API_KEY && Number.isInteger(level) && level >= 1 && level <= 5) {
            try {
                await sendPurchaseEmail({ email, level, sessionId: session.id });
            } catch (emailError) {
                console.error('Failed to send purchase email:', emailError);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ received: true }),
    };
};
