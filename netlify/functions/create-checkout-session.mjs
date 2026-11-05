// netlify/functions/create-checkout-session.mjs
//
// Thin wrapper around lib/checkout.js. It exists as a modern-format function because
// Netlify's per-IP rate limiting can only be configured on those. The checkout logic
// itself is unchanged.

import checkout from './lib/checkout.js';

export default async (req, context) => {
    const headers = Object.fromEntries(req.headers);
    // Make the visitor's country available to the pricing helper, which picks the currency.
    if (context?.geo?.country?.code) {
        headers['x-country'] = context.geo.country.code;
    }

    const result = await checkout.createCheckout({
        httpMethod: req.method,
        headers,
        queryStringParameters: Object.fromEntries(new URL(req.url).searchParams),
        body: req.method === 'POST' ? await req.text() : null,
    });

    return new Response(result.body ?? '', {
        status: result.statusCode,
        headers: result.headers || {},
    });
};

// 10 checkout sessions per minute per IP is plenty for a real buyer and stops someone
// scripting thousands of Stripe Checkout sessions.
export const config = {
    rateLimit: {
        windowLimit: 10,
        windowSize: 60,
        aggregateBy: ['ip', 'domain'],
    },
};
