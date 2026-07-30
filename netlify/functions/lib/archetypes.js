// netlify/functions/lib/archetypes.js

// Mirrors public/ui_text.js archetypes (name/desc/cta/img) — duplicated here rather than
// imported, to avoid the ESM/CommonJS cross-directory import issue that previously broke
// submit-score.js. Keep in sync with public/ui_text.js if that copy changes.
const ARCHETYPES = {
    1: { name: 'Zombie Clickslave', desc: 'Driven by compulsion. Technology dictates your schedule, mood, and attention span. Immediate intervention recommended.', cta: 'Reclaim your agency. Immediate intervention recommended to break the cycle.', img: '/images/level-1.png', color: '#ef4444' },
    2: { name: 'Unconscious Doomscroller', desc: 'High regret, low friction. You lose hours to screens without meaning to, but you are aware of the pain.', cta: 'Stop the scroll. Learn to build "circuit breakers" into your day.', img: '/images/level-2.png', color: '#f97316' },
    3: { name: 'Digital Drifter', desc: 'Reactive and distracted. You function okay, but your attention is constantly fragmented by pings and buzzes.', cta: 'Focus your attention. Move from reactive habits to proactive systems.', img: '/images/level-3.png', color: '#facc15' },
    4: { name: 'Intentional Architect', desc: 'Systematized and proactive. You use tools to block distractions, though you still fight the occasional battle.', cta: 'Optimize your flow. Fine-tune your environment for deep work.', img: '/images/level-4.png', color: '#60a5fa' },
    5: { name: 'Digital Sovereign', desc: 'The master level. Technology is a precision instrument that serves you. You are fully present offline.', cta: 'Maintain your sovereignty. Lead others by example.', img: '/images/level-5.png', color: '#c084fc' },
};

module.exports = { ARCHETYPES };
