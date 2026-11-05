// marketing/build-ads.js
//
// Builds the launch ad images from the site's own look (navy, blue, yellow, the archetype robots):
//   node marketing/build-ads.js
// Writes HTML sources to marketing/ads/src/ and renders PNGs to marketing/ads/ using headless Edge or
// Chrome (whichever is installed). Edit the copy below and re-run to regenerate.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'ads');
const SRC = path.join(OUT, 'src');
fs.mkdirSync(SRC, { recursive: true });

const IMG = (name) => 'file:///' + path.join(ROOT, 'public', 'images', name).replace(/\\/g, '/');

const BROWSERS = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const browser = BROWSERS.find((p) => fs.existsSync(p));
if (!browser) throw new Error('Edge or Chrome not found');

const ARCHETYPES = [
    { level: 1, name: 'Zombie Clickslave', color: '#ef4444', line: 'Your phone sets the schedule.' },
    { level: 2, name: 'Unconscious Doomscroller', color: '#f97316', line: 'Hours vanish. You know it.' },
    { level: 3, name: 'Digital Drifter', color: '#facc15', line: 'Functional, but pinged to pieces.' },
    { level: 4, name: 'Intentional Architect', color: '#60a5fa', line: 'Systems in place. Still the odd slip.' },
    { level: 5, name: 'Digital Sovereign', color: '#c084fc', line: 'Tech serves you. Not the other way round.' },
];

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{background:#0f172a;color:#fff;font-family:'Segoe UI',Helvetica,Arial,sans-serif;overflow:hidden;position:relative}
.glow{position:absolute;border-radius:50%;filter:blur(120px);opacity:.35}
.brand{font-size:30px;letter-spacing:8px;font-weight:700;color:#60a5fa;text-transform:uppercase}
.circle{border-radius:50%;object-fit:cover;background:#fff}
`;

function page(w, h, css, body) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body style="width:${w}px;height:${h}px">${body}</body></html>`;
}

const outputs = [];
function add(name, w, h, html) {
    fs.writeFileSync(path.join(SRC, `${name}.html`), html);
    outputs.push({ name, w, h });
}

// ---- Ad A: the ban line (4:5 feed, 1080x1350), three regional headlines ------------------------
const BAN_HEADLINES = {
    'ad-a-global': 'They&rsquo;re banning it for kids. <span class="y">What&rsquo;s it doing to us?</span>',
    'ad-a-au': 'Australia banned it for kids. <span class="y">What&rsquo;s it doing to us?</span>',
    'ad-a-uk': 'The UK&rsquo;s planning to ban it for kids. <span class="y">What&rsquo;s it doing to us?</span>',
};
for (const [name, headline] of Object.entries(BAN_HEADLINES)) {
    add(name, 1080, 1350, page(1080, 1350, `
        .glow.a{width:700px;height:700px;background:#3b82f6;right:-200px;bottom:-120px}
        .glow.b{width:500px;height:500px;background:#f97316;left:-220px;top:-200px;opacity:.18}
        .wrap{position:absolute;inset:0;padding:96px 88px}
        h1{margin-top:56px;font-size:112px;line-height:1.04;font-weight:800;letter-spacing:-2px}
        .y{color:#eab308}
        .hero{position:absolute;right:88px;bottom:176px;width:400px;height:400px;border:10px solid #f97316;box-shadow:0 0 90px rgba(96,165,250,.55)}
        .foot{position:absolute;left:88px;bottom:96px;font-size:36px;color:#cbd5e1;max-width:560px;line-height:1.3}
        .foot b{color:#fff}
    `, `<div class="glow a"></div><div class="glow b"></div>
        <div class="wrap">
            <div class="brand">Digital Wellbeing Score</div>
            <h1>${headline}</h1>
            <img class="circle hero" src="${IMG('level-2.png')}">
            <div class="foot"><b>Take the 3-minute scorecard.</b><br>digitalwellbeingscore.app</div>
        </div>`));
}

// ---- Ad B: archetype carousel (1080x1080 cards) -----------------------------------------------
add('ad-b-card-1', 1080, 1080, page(1080, 1080, `
    .glow.a{width:620px;height:620px;background:#3b82f6;left:230px;top:300px}
    .wrap{position:absolute;inset:0;padding:90px 80px;text-align:center}
    h1{margin-top:70px;font-size:104px;line-height:1.05;font-weight:800;letter-spacing:-2px}
    .y{color:#eab308}
    .row{position:absolute;left:0;right:0;bottom:190px;display:flex;justify-content:center}
    .row img{width:200px;height:200px;border:9px solid;margin:0 -16px}
    .sub{position:absolute;left:0;right:0;bottom:56px;font-size:34px;color:#cbd5e1}
`, `<div class="glow a"></div><div class="wrap">
        <div class="brand">Digital Wellbeing Score</div>
        <h1>Which digital archetype <span class="y">are you?</span></h1>
        <div class="row">${ARCHETYPES.map((a) => `<img class="circle" style="border-color:${a.color}" src="${IMG(`level-${a.level}.png`)}">`).join('')}</div>
        <div class="sub">Swipe to meet all five &rarr;</div>
    </div>`));

for (const a of ARCHETYPES) {
    add(`ad-b-card-${a.level + 1}`, 1080, 1080, page(1080, 1080, `
        .glow.a{width:700px;height:700px;background:${a.color};left:190px;top:140px;opacity:.28}
        .wrap{position:absolute;inset:0;padding:80px;text-align:center}
        .lvl{margin-top:34px;font-size:34px;letter-spacing:6px;font-weight:700;color:${a.color}}
        .hero{display:block;margin:40px auto 0;width:470px;height:470px;border:12px solid ${a.color};box-shadow:0 0 80px ${a.color}66}
        h2{margin-top:44px;font-size:78px;line-height:1.05;font-weight:800;letter-spacing:-1px}
        p{margin-top:20px;font-size:42px;color:#cbd5e1}
    `, `<div class="glow a"></div><div class="wrap">
        <div class="brand" style="font-size:24px">Digital Wellbeing Score</div>
        <div class="lvl">LEVEL ${a.level} OF 5</div>
        <img class="circle hero" src="${IMG(`level-${a.level}.png`)}">
        <h2>${a.name}</h2>
        <p>${a.line}</p>
    </div>`));
}

// ---- Render ------------------------------------------------------------------------------------
for (const { name, w, h } of outputs) {
    const src = 'file:///' + path.join(SRC, `${name}.html`).replace(/\\/g, '/');
    const out = path.join(OUT, `${name}.png`);
    execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, `--screenshot=${out}`, '--default-background-color=0f172aff', src], { stdio: 'ignore', timeout: 60000 });
    console.log(`${name}.png  ${w}x${h}`);
}
