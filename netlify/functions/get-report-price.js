// netlify/functions/get-report-price.js
//
// Lets payment.html display the actual price it's about to charge, instead of a
// hardcoded number that can silently drift from create-checkout-session.js.

const { resolvePriceId, STRIPE_CURRENCY, STRIPE_REPORT_AMOUNT } = require('./lib/pricing');

exports.handler = async function (event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const level = event.queryStringParameters?.level;
    const priceId = resolvePriceId(level);

    if (priceId && process.env.STRIPE_SECRET_KEY) {
        try {
            const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
                headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
            });
            const price = await response.json();
            if (response.ok && price.unit_amount != null) {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: price.unit_amount, currency: price.currency }),
                };
            }
        } catch (error) {
            // Fall through to the flat-rate default below.
        }
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: STRIPE_REPORT_AMOUNT, currency: STRIPE_CURRENCY }),
    };
};
