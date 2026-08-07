const SITE_URL = process.env.URL || process.env.SITE_URL || 'http://localhost:8888';
const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || 'usd';
const STRIPE_REPORT_AMOUNT = process.env.STRIPE_REPORT_AMOUNT || '500';
const LEVEL_PRICE_IDS = {
    1: process.env.STRIPE_PRICE_ID_LEVEL_1,
    2: process.env.STRIPE_PRICE_ID_LEVEL_2,
    3: process.env.STRIPE_PRICE_ID_LEVEL_3,
    4: process.env.STRIPE_PRICE_ID_LEVEL_4,
    5: process.env.STRIPE_PRICE_ID_LEVEL_5,
};

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { Allow: 'POST' },
            body: 'Method Not Allowed',
        };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to your Netlify environment variables.' }),
        };
    }

    let payload = {};
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body.' }),
        };
    }

    const { level, archetypeName, email } = payload;
    const archetypeLabel = archetypeName || 'your result';

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${SITE_URL}/payment.html?status=success&level=${encodeURIComponent(level || '')}&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${SITE_URL}/payment.html?status=cancelled&level=${encodeURIComponent(level || '')}`);

    const priceId = LEVEL_PRICE_IDS[Number(level)] || process.env.STRIPE_PRICE_ID;
    if (priceId) {
        params.set('line_items[0][price]', priceId);
    } else {
        params.set('line_items[0][price_data][currency]', STRIPE_CURRENCY);
        params.set('line_items[0][price_data][unit_amount]', STRIPE_REPORT_AMOUNT);
        params.set('line_items[0][price_data][product_data][name]', 'Digital Wellbeing Full Report');
        params.set('line_items[0][price_data][product_data][description]', `Full report for ${archetypeLabel}`);
    }

    params.set('line_items[0][quantity]', '1');
    params.set('metadata[level]', String(level || ''));
    params.set('metadata[archetype_name]', archetypeLabel);
    params.set('metadata[email]', email || '');

    if (email) {
        params.set('customer_email', email);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: data.error?.message || 'Stripe checkout session creation failed.' }),
        };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: data.url,
            id: data.id,
            sessionId: data.id,
        }),
    };
};
