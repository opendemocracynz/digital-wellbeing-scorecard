const { resolvePriceId, currencyForRequest, taxBehaviorFor, REPORT_AMOUNT } = require('./lib/pricing');

const SITE_URL = (process.env.URL || process.env.SITE_URL || 'http://localhost:8888').replace(/\/+$/, '');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const { archetypeName } = payload;
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const levelNumber = Number(payload.level);
    const level = Number.isInteger(levelNumber) ? levelNumber : null;

    // Reject up front: a session with a level download-report can't map to a PDF
    // would take payment and then fail to deliver anything.
    if (level === null || level < 1 || level > 5) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid report level.' }),
        };
    }

    if (email && !EMAIL_PATTERN.test(email)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid email address.' }),
        };
    }

    const archetypeLabel = String(archetypeName || 'your result').slice(0, 100);

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${SITE_URL}/payment.html?status=success&level=${level}&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${SITE_URL}/payment.html?status=cancelled&level=${level}`);

    // Charge in the visitor's local currency (same choice get-report-price made for the
    // price shown on the page). A Price with currency_options uses its per-currency
    // amount; the inline fallback is the same flat amount in every currency.
    const currency = currencyForRequest(event);
    params.set('currency', currency);
    params.set('automatic_tax[enabled]', 'true');

    const priceId = resolvePriceId(level);
    if (priceId) {
        params.set('line_items[0][price]', priceId);
    } else {
        params.set('line_items[0][price_data][currency]', currency);
        params.set('line_items[0][price_data][unit_amount]', String(REPORT_AMOUNT));
        params.set('line_items[0][price_data][tax_behavior]', taxBehaviorFor(currency));
        params.set('line_items[0][price_data][product_data][name]', 'Digital Wellbeing Full Report');
        params.set('line_items[0][price_data][product_data][description]', `Full report for ${archetypeLabel}`);
    }

    params.set('line_items[0][quantity]', '1');
    params.set('metadata[level]', String(level));
    params.set('metadata[archetype_name]', archetypeLabel);
    params.set('metadata[email]', email);

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
