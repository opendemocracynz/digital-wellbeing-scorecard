// netlify/functions/lib/pillars.js
//
// Pillar maths and copy shared by the welcome email and the drip emails.

// Each pillar rolls up a different number of questions, so raw scores aren't directly
// comparable across pillars — a pillar built from 2 questions (range 2-10) will almost
// always look "lower" than one built from 6 questions (range 6-30) even if the user is
// relatively stronger there. Weakest pillar is picked by normalized percentage instead.
const PILLAR_RANGES = {
    Physiological: { min: 2, max: 10, label: 'Physiological', weakness: 'Digital Fatigue' },
    Psychological: { min: 6, max: 30, label: 'Psychological', weakness: 'Mental Overload' },
    Social: { min: 2, max: 10, label: 'Social', weakness: 'Connection Gap' },
    Cognitive: { min: 5, max: 25, label: 'Cognitive', weakness: 'Information Haze' },
};

const WEAKNESS_COPY = {
    Physiological: {
        whatThisMeans: 'Your habits here are compromising your physical rest and energy.',
        risk: 'Chronic fatigue, disrupted sleep, and a body that never fully switches off.',
        quickWin: "Tonight, charge your phone outside the bedroom, or at least across the room. It protects your sleep, and it's a change many of us already know we should make, which is exactly why it's worth doing first.",
    },
    Psychological: {
        whatThisMeans: 'Your habits here are compromising your mental clarity and emotional regulation.',
        risk: 'Heightened anxiety, decision fatigue, and burnout.',
        quickWin: 'Turn off every notification except messages from real people. Then notice how often you reach for the phone anyway. That reach is the habit underneath.',
    },
    Social: {
        whatThisMeans: 'Your habits here are compromising your real-world relationships and presence.',
        risk: 'Shallow connections, isolation, and weakened relationships with the people who matter.',
        quickWin: 'Make one meal a day device-free. Not face-down on the table, but out of sight. Notice what the conversation is like.',
    },
    Cognitive: {
        whatThisMeans: 'Your habits here are compromising your focus and ability to think deeply.',
        risk: 'Shortened attention span, difficulty concentrating, and less capacity for meaningful work.',
        quickWin: 'Pick two or three set times to check email, and close it in between. Batching alone gives your attention long, uninterrupted stretches back.',
    },
};

function getWeakestPillar(pillarScores) {
    let weakestKey = null;
    let weakestPercent = Infinity;

    for (const key of Object.keys(PILLAR_RANGES)) {
        const { min, max } = PILLAR_RANGES[key];
        const percent = ((pillarScores[key] - min) / (max - min)) * 100;
        if (percent < weakestPercent) {
            weakestPercent = percent;
            weakestKey = key;
        }
    }

    return { key: weakestKey, ...PILLAR_RANGES[weakestKey], ...WEAKNESS_COPY[weakestKey] };
}

// research_data row -> { Physiological, ... }, or null when any pillar is missing.
function pillarScoresFromResearch(row) {
    if (!row) return null;
    const scores = {
        Physiological: row.score_physiological,
        Psychological: row.score_psychological,
        Social: row.score_social,
        Cognitive: row.score_cognitive,
    };
    return Object.values(scores).every((v) => Number.isFinite(v)) ? scores : null;
}

module.exports = { PILLAR_RANGES, getWeakestPillar, pillarScoresFromResearch };
