# PROJECT CONTEXT: Digital Wellbeing Scorecard

**Mission:** Rapid deployment of a standalone tool to assess a user's relationship with technology.
**Parent Organization:** Open Democracy NZ (ODNZ).
**Goal:** Generate leads (email list) and revenue (paid reports) to fund broader democratic initiatives.
**Live URL:** https://digitalwellbeingscore.app
**Dev Constraints:** ~5 hours/week. Solutions must be low-maintenance, low-code, automated where possible.

> This file replaces the two previous versions (MVP v1.0 and v2.0) that had accumulated in this
> document. Where they disagreed, this version reflects what the code actually does today, checked
> against the live site and database on 2026-07-30. Aspirational/undone items have moved to the
> Roadmap section instead of being described as current state.

## 1. Stack

* Vanilla JS (ES modules), Tailwind CSS, Netlify Functions (Node, CommonJS), Supabase (Postgres + RPC).
* MailerSend is the intended transactional/drip email provider, but is **not yet wired up** — see Roadmap.
* Architecture: "Low-Code Hybrid." No frontend framework. Logic over boilerplate.

## 2. The 5 Archetypes (scoring output)

15-question quiz, 1–5 points per question, total range 15–75:

1. **Zombie Clickslave (15–29):** High compulsion, zero agency. Needs emergency intervention.
2. **Unconscious Doomscroller (30–44):** High regret, low friction. Needs "circuit breakers."
3. **Digital Drifter (45–55):** Reactive, functional but distracted. Needs proactive systems.
4. **Intentional Architect (56–68):** Systematized, proactive. Needs optimization.
5. **Digital Sovereign (69–75):** Independent, privacy-focused. Master level.

Defined once in `public/quiz_data.js` (frontend) and duplicated in a second, root-level `quiz_data.js`
that `netlify/functions/submit-score.js` used to import. **This duplication is now dead weight** — see
Known Issues.

## 3. The 4 Pillars

Each answer's `category` maps to one of four pillars, scored separately and stored per-submission:

| Pillar | Column | Categories rolling up to it |
|---|---|---|
| Physiological | `score_physiological` | Environment |
| Psychological | `score_psychological` | Agency, Psychology, Impact |
| Social | `score_social` | Social |
| Cognitive | `score_cognitive` | Systems, Focus, Creation |

A "weakness" concept (lowest-scoring pillar → `primary_weakness_id` 1–4, mapped to a label like
"Digital Fatigue") exists in the schema and in dead code (`netlify/functions/emailService.js`), but
**is never actually computed or written** by `submit-score.js`. `primary_weakness_id` is always `null`
today.

## 4. Data Architecture & Privacy Model

* **`research_data`:** One row per quiz completion. `answer_string`, `total_score`, `archetype_level`,
  four pillar scores, `id` (UUID). RLS: public INSERT only, **no SELECT policy** — by design, so nothing
  (not even the anon key) can read this table back. The Netlify function must not use `.select()` after
  insert for this reason (see commit `16d5532` — this was one of the two production bugs fixed this
  session).
* **`marketing_leads`:** One row per email. Lead info, archetype segment, drip-sequence stage
  (`last_email_stage`), purchase flag.
* **Decision (2026-07-30): the linkage is intentional and stays.** Earlier docs promised research
  answers are never linked to identity; in reality `research_data.user_email` (FK to
  `marketing_leads.email`, backfilled by `submit_lead()` on signup) links a subscriber's exact
  `answer_string` and pillar scores to their email. Revenue and retention (the "welcome back, you
  improved by N points" feature, personalized reports, drip content) depend on this, so the old
  anonymity promise is retired rather than enforced. **Do not describe research data as anonymous or
  unlinked in any user-facing copy or privacy policy going forward.**
* **The boundary that replaces it — data minimization:** linking email↔score is fine; the constraint is
  not collecting anything *beyond* that without a deliberate decision first. Concretely, before launch:
  - Confirm the only PII collected is email + first name (both already user-supplied via the sign-up
    form) — no phone numbers, addresses, or device/location identifiers beyond what Netlify's own
    platform-level analytics captures independently of this app's code.
  - Payment integration (Roadmap, below) must not have this app's own code or database touch raw card
    details — that has to stay entirely inside Stripe (or whichever processor), via hosted
    checkout/Elements, not a form this app submits itself.
  - Quiz answers are inherently sensitive-adjacent (sleep, anxiety, habits) even without being
    formally "health data" — worth a plain-language line in the privacy policy saying scores are stored
    linked to email once someone subscribes, rather than silence on the topic.

## 5. Current Implementation Status (verified working in production, 2026-07-30)

* Quiz flow: splash screen → 15 questions with auto-advance → unanswered-question warning → scoring.
* `localStorage` session persistence (resume / clear progress) — implemented as
  `digitalWellbeingQuizState`, not the `dw_session` key either old doc mentioned.
* `submit-score` Netlify function: scores answers, computes pillar scores, inserts to `research_data`.
  Confirmed working end-to-end against the live Supabase project after two bugfixes this session.
* Results screen: score gauge, explorable archetype cards for all 5 levels, "Challenge a Friend" share
  text with copy-to-clipboard.
* `subscribe` Netlify function → `submit_lead()` RPC: inserts/upserts `marketing_leads`, returns a
  "welcome back, you improved/declined by N points" message on repeat submissions. Confirmed working.
* Share buttons and the "Unlock Full Report" button only become visible **after** a successful email
  subscribe (they sit in a `hidden` container that's revealed on subscribe success) — the score/archetype
  itself is always visible without an email.
* Payment: `public/payment.html` is a non-functional placeholder — a static "Pay $9.00" button that
  triggers `alert('This is a demo payment gateway...')`. No Stripe or other processor is integrated.

## 6. Known Issues (open, unless marked fixed)

1. ~~Site is unstyled in production.~~ **Fixed 2026-07-30** (commit `5e46f02`): reverted `index.html`
   from the broken `build.css` link back to the `<script src="https://cdn.tailwindcss.com">` tag that
   `payment.html` already used successfully. The compiled-build migration that caused this (empty
   `styles.css`, no `netlify.toml` build step) is still worth finishing properly — tracked in Roadmap as
   a fast-follow, not a launch blocker, since the CDN approach works.
2. `netlify/functions/emailService.js` is dead code — not imported or called anywhere.
3. `daily-mailer/index.ts` (the drip-email cron job) targets the Supabase Edge Functions runtime (Deno,
   `Deno.serve`) but there is no `supabase/` directory, no `config.toml`, and no evidence it has ever been
   deployed or scheduled. `MAILERSEND_API_KEY` is not set anywhere. It currently does nothing.
4. Duplicate `quiz_data.js` (repo root + `public/`) — two sources of truth that must be hand-kept in sync.
5. `research_data.country_code` and `.primary_weakness_id` are schema columns nothing ever populates.

## 7. Roadmap (prioritized)

**Context:** the site is already live and getting organic traffic (10–40 visits/day via Netlify
analytics) even pre-launch. Goal now is to close out the two revenue-critical gaps — payment and email —
and push a "final" launch build, not to keep iterating on architecture first.

**P0 — blocking launch (needed to start promoting the app)**
- **Payment gateway:** replace the `payment.html` placeholder (`alert('demo')`, no processor) with a
  real Stripe integration — hosted Checkout or Payment Element, a Netlify function to create the
  session/verify payment server-side, and a webhook to flip `marketing_leads.has_purchased_report`. Per
  §4, card data must never pass through this app's own code/DB — Stripe handles it directly.
- **Email service:** get `MailerSend` actually sending. Minimum for launch is the Day-0 "here's your
  score" transactional email on signup (currently nothing is sent — `subscribe.js` only writes to the
  DB). The longer drip sequence (`daily-mailer`) can follow, but *something* should confirm signup by
  email before launch.
- Re-run [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) end-to-end once both land.

**P1 — fast-follow (don't block launch, but do soon after)**
- Finish the compiled-Tailwind build properly (populate `styles.css` with `@tailwind` directives, add a
  real `[build.command]` to `netlify.toml`) so production isn't running the CDN script, which Tailwind
  itself says isn't meant for production use.
- Deploy + schedule `daily-mailer` for the full drip sequence (currently doesn't run anywhere — see
  Known Issues). Needs: decide Supabase Edge Function vs. scheduled Netlify Function, reconcile the Day
  0/2/4/7 vs. Day 5/15/50/70 cadence disagreement between old docs, fix the `ARCHETYPE_CONTENT` key typos
  (`31`, missing `4`) and placeholder template IDs, set `MAILERSEND_API_KEY`.
- No "No thanks" decline path: share buttons and the report-unlock CTA are currently only reachable by
  submitting an email. If that's an intentional hard email gate, no action needed — just confirm it's
  intentional; if not, add the decline path the original design called for.
- Compute and store `primary_weakness_id` so weakness-based email personalization is possible.

**P2 — cleanup**
- Delete `netlify/functions/emailService.js` (dead code) or wire it into the MailerSend work above if the
  weakness-email approach is still wanted.
- Collapse the duplicate `quiz_data.js` into one file both the frontend and the Netlify function import
  from.
- Create the `view_pending_marketing_emails` view the old doc described, or drop the reference —
  `daily-mailer` currently queries `marketing_leads` directly instead.

**Done this session (for context, not action items)**
- Fixed `submit-score.js` crashing on every call from an ESM import inside a CommonJS function.
- Fixed the RLS violation on quiz submission caused by `.select()` after insert with no SELECT policy.
- Confirmed `SUPABASE_URL`/`SUPABASE_KEY` are correctly set on Netlify and the Supabase project (which
  had been paused) is active again.
- Fixed the unstyled production site by reverting to the Tailwind CDN script.
- Retired the "anonymous research data" promise in favor of an explicit, bounded email↔score linkage
  (§4).
