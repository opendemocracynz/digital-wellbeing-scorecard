// netlify/functions/lib/pricing.js
//
// Single source of truth for report pricing, shared by create-checkout-session.js
// (which charges it) and get-report-price.js (which displays it) so the two can't drift.

const LEVEL_PRICE_IDS = {
    1: process.env.STRIPE_PRICE_ID_LEVEL_1,
    2: process.env.STRIPE_PRICE_ID_LEVEL_2,
    3: process.env.STRIPE_PRICE_ID_LEVEL_3,
    4: process.env.STRIPE_PRICE_ID_LEVEL_4,
    5: process.env.STRIPE_PRICE_ID_LEVEL_5,
};

function resolvePriceId(level) {
    return LEVEL_PRICE_IDS[Number(level)] || process.env.STRIPE_PRICE_ID || null;
}

module.exports = {
    LEVEL_PRICE_IDS,
    resolvePriceId,
    STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || 'usd',
    STRIPE_REPORT_AMOUNT: Number(process.env.STRIPE_REPORT_AMOUNT || '500'),
};
