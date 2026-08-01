const CAMPAIGN_STORAGE_KEY = 'digitalWellbeingCampaign';
const SESSION_STORAGE_KEY = 'digitalWellbeingAnalyticsSession';

const measurementId = window.DWS_GA_MEASUREMENT_ID;
const sessionId = getOrCreateSessionId();
const emittedEvents = new Set();

if (measurementId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true });
}

const campaign = captureCampaign();

function getOrCreateSessionId() {
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
}

function captureCampaign() {
    const params = new URLSearchParams(window.location.search);
    const stored = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || 'null');
    const current = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
        if (params.get(key)) current[key] = params.get(key);
    });

    const result = Object.keys(current).length ? current : (stored || {});
    if (Object.keys(current).length) localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(result));
    return result;
}

export function track(name, parameters = {}, options = {}) {
    const eventKey = options.once ? `${name}:${JSON.stringify(parameters)}` : null;
    if (eventKey && emittedEvents.has(eventKey)) return;
    if (eventKey) emittedEvents.add(eventKey);

    if (window.gtag) {
        window.gtag('event', name, {
            ...parameters,
            dws_session_id: sessionId,
            ...campaign,
        });
    }
}

export function getCampaignCta(defaultText, campaignText) {
    return campaign.utm_campaign && campaignText ? campaignText : defaultText;
}