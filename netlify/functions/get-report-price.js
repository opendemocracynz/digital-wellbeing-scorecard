// netlify/functions/get-report-price.js
//
// Lets payment.html display the actual price it's about to charge, instead of a
// hardcoded number that can silently drift from create-checkout-session.js.
// The currency is picked from the visitor's country by the same helper
// create-checkout-session.js uses, so the page and the checkout always agree.

const { resolvePriceId, currencyForRequest, REPORT_AMOUNT } = require('./lib/pricing');

function json(body) {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300' },
        body: JSON.stringify(body),
    };
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const level = event.queryStringParameters?.level;
    const currency = currencyForRequest(event);
    const priceId = resolvePriceId(level);

    if (priceId && process.env.STRIPE_SECRET_KEY) {
        try {
            const response = await fetch(
                `https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}?expand[]=currency_options`,
                { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
            );
            const price = await response.json();
            if (response.ok) {
                const localised = price.currency_options?.[currency]?.unit_amount;
                if (localised != null) {
                    return json({ amount: localised, currency });
                }
                if (price.currency === currency && price.unit_amount != null) {
                    return json({ amount: price.unit_amount, currency });
                }
                // The Price has no option for this currency: Checkout would fall back to the
                // Price's own currency, so show that rather than a number we won't charge.
                if (price.unit_amount != null) {
                    return json({ amount: price.unit_amount, currency: price.currency });
                }
            }
        } catch (error) {
            // Fall through to the flat-rate default below.
        }
    }

    return json({ amount: REPORT_AMOUNT, currency });
};
