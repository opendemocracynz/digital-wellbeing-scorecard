// netlify/functions/lib/pricing.js
//
// Single source of truth for report pricing, shared by create-checkout-session.js
// (which charges it) and get-report-price.js (which displays it) so the two can't drift.
//
// The report costs 4.99 in every supported currency. Currency is chosen from the
// visitor's country (Netlify geo header) and passed explicitly to Checkout, so the
// price shown on payment.html is always the price charged.

const LEVEL_PRICE_IDS = {
    1: process.env.STRIPE_PRICE_ID_LEVEL_1,
    2: process.env.STRIPE_PRICE_ID_LEVEL_2,
    3: process.env.STRIPE_PRICE_ID_LEVEL_3,
    4: process.env.STRIPE_PRICE_ID_LEVEL_4,
    5: process.env.STRIPE_PRICE_ID_LEVEL_5,
};

const DEFAULT_CURRENCY = 'usd';

// Matches the currency_options configured on the Stripe Prices.
const SUPPORTED_CURRENCIES = ['usd', 'cad', 'nzd', 'aud', 'gbp', 'eur'];

// US/CA prices are shown excluding sales tax; the rest are tax-inclusive (GST/VAT).
const TAX_EXCLUSIVE_CURRENCIES = ['usd', 'cad'];

const COUNTRY_CURRENCY = {
    US: 'usd',
    CA: 'cad',
    NZ: 'nzd',
    AU: 'aud',
    GB: 'gbp',
};

const EUROZONE = [
    'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE',
    'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
];
EUROZONE.forEach((country) => { COUNTRY_CURRENCY[country] = 'eur'; });

const REPORT_AMOUNT = Number(process.env.STRIPE_REPORT_AMOUNT || '499');

function getCountry(headers) {
    const h = headers || {};
    try {
        if (h['x-nf-geo']) {
            const geo = JSON.parse(Buffer.from(h['x-nf-geo'], 'base64').toString('utf8'));
            if (geo?.country?.code) return geo.country.code.toUpperCase();
        }
    } catch (error) {
        // Fall through to the plain header.
    }
    return (h['x-country'] || '').toUpperCase() || null;
}

function currencyForRequest(event) {
    const requested = (event.queryStringParameters?.currency || '').toLowerCase();
    if (SUPPORTED_CURRENCIES.includes(requested)) return requested;
    return COUNTRY_CURRENCY[getCountry(event.headers)] || DEFAULT_CURRENCY;
}

function resolvePriceId(level) {
    return LEVEL_PRICE_IDS[Number(level)] || process.env.STRIPE_PRICE_ID || null;
}

function taxBehaviorFor(currency) {
    return TAX_EXCLUSIVE_CURRENCIES.includes(currency) ? 'exclusive' : 'inclusive';
}

module.exports = {
    LEVEL_PRICE_IDS,
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    REPORT_AMOUNT,
    currencyForRequest,
    resolvePriceId,
    taxBehaviorFor,
};
