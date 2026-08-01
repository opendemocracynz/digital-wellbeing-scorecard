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

* Vanilla JS (ES modules), Tailwind CSS, Netlify Functions (Node, CommonJS), Supabase (Postgres + RPC),
  MailerSend (transactional email, sending domain `digitalwellbeingscore.app`).
* Architecture: "Low-Code Hybrid." No frontend framework. Logic over boilerplate.

## 1a. Analytics and campaign tracking

The site has an optional Google Analytics 4 integration in `public/analytics.js`. It is deliberately
disabled until a GA4 Web stream ID is placed in `public/index.html` as
`window.DWS_GA_MEASUREMENT_ID = 'G-...'`. No quiz events or analytics requests are sent while that
value is blank.

The app sends these events to GA4, without sending email addresses or raw answer values:

* `quiz_started` — includes whether this was a resumed session.
* `question_viewed`, `question_answered`, and `question_skipped` — include question number and category.
* `quiz_completed` and `results_viewed` — include score and archetype level.
* `quiz_abandoned` — includes the last question reached and answered-question count.
* `signup_started`, `signup_submitted`, `signup_completed`, and `signup_failed`.
* `share_clicked` and `report_cta_clicked`.

The helper also retains the first campaign's `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, and `utm_term` in local storage so a visitor who completes the quiz later remains
attributed to the campaign. Example campaign links:

* `/?utm_source=linkedin&utm_medium=organic&utm_campaign=founder-story`
* `/?utm_source=meta&utm_medium=paid_social&utm_campaign=attention-reset&utm_content=parent-creative-a`

Campaign traffic currently receives a modest alternative signup message. It does not pretend to be
deep personalisation: add more variants only after GA4 shows that a specific audience or message is
meaningfully different. In GA4, register `question_number`, `question_category`, `archetype_level`,
`dws_session_id`, `utm_campaign`, and `utm_content` as event-scoped custom dimensions if they are needed in reports.

## 1b. Founder story writing brief

The live follow-up sequence is `netlify/functions/scheduled-drip.js` using
`netlify/functions/lib/drip-email.js`. The older `daily-mailer/index.ts` is superseded reference code
and should not be completed or deployed: it uses the old Day 5/15/50/70 cadence, stale template IDs,
old archetype names, and incomplete content structures.

Write the two live story emails as follows:

* **Day 3 — the low point and the turn:** 150–250 words. Describe one recognisable moment when
  technology was clearly running your attention, mood, sleep, or relationships. Name the cost without
  dramatising it, then describe the realisation or decision that made change possible. End with a
  forward reference to the practical changes in the next email.
* **Day 10 — what actually changed:** 150–250 words. Describe two or three concrete changes you made,
  why they worked better than willpower, and what remains imperfect. Connect the idea back to the
  reader's own result without claiming that one system works for everyone. End with an invitation to
  retake the scorecard after a month or three months.

Use first person, plain language, and one specific detail in each email. Avoid presenting the story as
medical advice, a guaranteed transformation, or a generic list of productivity tips. The existing
subject lines are `I was a Zombie Clickslave too` and `What actually changed`; they can be revised if
the final story suggests a more honest subject.

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

A "weakness" concept (lowest-scoring pillar, mapped to a label like "Digital Fatigue") exists in the
schema (`research_data.primary_weakness_id`, 1–4) and in dead code (`netlify/functions/emailService.js`),
but `submit-score.js` never writes it — `primary_weakness_id` is always `null` in the database.

As of 2026-07-30, the weakest pillar **is** computed, but only at email-send time, in
`netlify/functions/lib/welcome-email.js::getWeakestPillar()` — not stored back to the DB. Important
correctness note: the four pillars roll up different numbers of questions (Physiological/Social = 2
questions each, range 2–10; Cognitive = 5 questions, range 5–25; Psychological = 6 questions, range
6–30), so comparing raw scores to find the "weakest" one is wrong — it will almost always pick a
2-question pillar just because its ceiling is lower, not because the user is relatively weaker there.
`getWeakestPillar()` normalizes each pillar to a 0–100% score before comparing. Any other code that needs
"weakest pillar" (e.g. if `primary_weakness_id` gets wired up for real) should reuse this normalization,
not redo the dead code's raw-`Math.min()` approach.

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
* **Day-0 welcome email:** on first-time signup (not repeat retakes), `subscribe.js` sends a branded
  results email via MailerSend's API — custom HTML built in `netlify/functions/lib/welcome-email.js`
  (not a MailerSend dashboard template; those proved too fiddly to make match the site's design), with
  the 4-pillar breakdown and a weakest-pillar callout. Confirmed working end-to-end (real send, rendered
  correctly, arrived — see deliverability note below). We don't collect a first name (see Known Issues),
  so the email doesn't personalize a greeting.
* **Unsubscribe:** `netlify/functions/unsubscribe.js` + `unsubscribe_lead()` RPC set
  `marketing_leads.unsubscribed_from_sequences = true` for the emailed link. Deliberately unauthenticated
  (no token) — anyone knowing an email can unsubscribe it. Accepted low-severity tradeoff for now given
  the time budget; revisit if it's ever abused.
* **Email deliverability:** first real send landed in spam (Outlook). Diagnosed: SPF and DKIM were
  correctly configured via MailerSend's domain verification, but there was no DMARC record. Added one
  2026-07-30 (`_dmarc.digitalwellbeingscore.app`, `p=none` monitoring mode) via Netlify DNS. This should
  help, but `digitalwellbeingscore.app` is a brand-new sending domain with zero reputation — expect spam
  placement to keep happening for a while regardless of correct DNS, until the domain "warms up" through
  consistent sending and recipients marking mail as not-spam. Not a one-time fix; see Roadmap.
* Payment: `public/payment.html` is a non-functional placeholder — a static "Pay $9.00" button that
  triggers `alert('This is a demo payment gateway...')`. No Stripe or other processor is integrated.
* **Follow-up drip sequence (2026-07-31):** `netlify/functions/scheduled-drip.js` runs daily (Netlify
  Scheduled Function, confirmed registered with `schedule: "@daily"` after deploy — see
  `searchSiteFunctions` API) and sends, per lead, whichever of Day 3 / 10 / 30 / 90 they've newly crossed
  since `quiz_completed_at`:
  - **Day 3 / 10** carry the founder narrative (Rakesh's own turnaround story, told in two parts). The
    polished copy, subjects, CTAs, and unsubscribe link are live in `netlify/functions/lib/drip-email.js`.
    Existing leads already past these stages will not be resent automatically.
  - **Day 30** is a real, working progress-recap + retake-CTA email.
  - **Day 90** is a real, working progress-recap + retake-CTA email **plus a free poster PDF**, delivered
    via `netlify/functions/download-poster.js` (a signed URL from Supabase Storage's private `reports`
    bucket, regenerated fresh on each click rather than embedded statically, so the email link never
    expires).
  - Day 3/10/30 skip leads with `has_purchased_report = true`; Day 90 intentionally goes to **everyone**
    non-unsubscribed, purchased or not (product decision, 2026-07-31).
  - This fix required discovering and patching a real gap: `submit_lead()` never set
    `quiz_completed_at` or reset `last_email_stage`, so every day-based calculation would have silently
    been a no-op forever. Fixed in the same migration — retaking the quiz now restarts the 30/90-day
    clock from the new attempt.
  - Supersedes `daily-mailer/index.ts` (see Known Issues) rather than reconciling with it — that file's
    cadence (Day 5/15/50/70) and template IDs were already stale/never deployed.
* **Report/poster assets:** the 5 per-archetype PDFs and the poster (all Typst-authored) are uploaded to a
  **private** Supabase Storage bucket named `reports`, filenames `level-N-report.pdf` and
  `digital-wellbeing-scorecard-poster.pdf`. Deliberately not in `public/` — anything there is a guessable,
  unprotected URL, which would let anyone download the paid reports without paying. `download-poster.js`
  is scoped to only ever serve the free poster (hardcoded filename, not a `?file=` param) — a
  purchase-checked equivalent for the paid reports is part of the Stripe work, not built yet.
  **Known content issues in the PDFs as of upload** (flagged, not yet fixed): "Zombie Click slave" is two
  words in `level-1-report.pdf` (should match the one-word branding used everywhere else), and the
  corner tracking code reads `DS-ARCH-L4`/`DWS-ARCH-L4` (inconsistent prefix, and stuck at "L4" regardless
  of actual archetype level) on at least the two files reviewed — likely an uncorrected Typst template
  placeholder across all 5.

## 6. Known Issues (open, unless marked fixed)

1. ~~Site is unstyled in production.~~ **Fixed 2026-07-30** (commit `5e46f02`): reverted `index.html`
   from the broken `build.css` link back to the `<script src="https://cdn.tailwindcss.com">` tag that
   `payment.html` already used successfully. The compiled-build migration that caused this (empty
   `styles.css`, no `netlify.toml` build step) is still worth finishing properly — tracked in Roadmap as
   a fast-follow, not a launch blocker, since the CDN approach works.
2. `netlify/functions/emailService.js` is dead code — not imported or called anywhere.
3. ~~`daily-mailer/index.ts` never deployed.~~ **Superseded 2026-07-31**: `scheduled-drip.js` (Netlify
   Scheduled Function) replaces it. `daily-mailer/index.ts` is now doubly dead — left in the repo for
   reference but nothing points to it; safe to delete whenever convenient (P2 below).
4. Duplicate `quiz_data.js` (repo root + `public/`) — two sources of truth that must be hand-kept in sync.
5. `research_data.country_code` and `.primary_weakness_id` are schema columns nothing ever populates.
6. The results-page post-signup experience needs a deliberate conversion pass; the current profile
  explorer and weakness tease are useful, but their relationship to the email CTA and paid report is
  not yet settled.

## 7. Roadmap (prioritized)

**Context:** the site is already live and getting organic traffic (10–40 visits/day via Netlify
analytics) even pre-launch. Goal now is to close out the two revenue-critical gaps — payment and email —
and push a "final" launch build, not to keep iterating on architecture first.

**P0 — blocking launch (needed to start promoting the app)**
- **Payment gateway:** replace the `payment.html` placeholder (`alert('demo')`, no processor) with a
  real Stripe integration — hosted Checkout or Payment Element, a Netlify function to create the
  session/verify payment server-side, and a webhook to flip `marketing_leads.has_purchased_report`. Per
  §4, card data must never pass through this app's own code/DB — Stripe handles it directly. The email's
  "Unlock Your Targeted Action Plan" button currently links to `payment.html?level=N` — update it once
  the real checkout URL exists.
- ~~Email service~~ **Done 2026-07-30** — Day-0 welcome email sends via MailerSend on signup. See §5.
- **Monitor deliverability before/during launch promotion.** A DMARC record was added, but the sending
  domain has no history yet; watch whether early sends keep landing in spam and ask early recipients to
  mark "not spam" / add `hello@digitalwellbeingscore.app` as a contact to help the domain warm up. Don't
  assume this is fully solved.
- Re-run [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) end-to-end once payment lands.

**P1 — fast-follow (don't block launch, but do soon after)**
- ~~Write the Day 3/10 founder-narrative copy~~ **Done 2026-08-01** — polished copy with CTAs is live in
  `netlify/functions/lib/drip-email.js`'s `buildStory1`/`buildStory2`.
- **Fix the 5 report PDFs**: "Zombie Click slave" → "Zombie Clickslave", and correct the `DS-ARCH-L4` /
  `DWS-ARCH-L4` header codes to the right prefix + level per file. Re-upload to the `reports` Storage
  bucket once fixed.
- **Build the purchase-gated report delivery endpoint** — needed for the Stripe work anyway: a function
  parallel to `download-poster.js` but that checks `marketing_leads.has_purchased_report` (or a
  payment-specific token) before generating a signed URL for `level-N-report.pdf`. Do this alongside
  Stripe, not before — no reason to build it earlier.
- Finish the compiled-Tailwind build properly (populate `styles.css` with `@tailwind` directives, add a
  real `[build.command]` to `netlify.toml`) so production isn't running the CDN script, which Tailwind
  itself says isn't meant for production use.
- No "No thanks" decline path: share buttons and the report-unlock CTA are currently only reachable by
  submitting an email. If that's an intentional hard email gate, no action needed — just confirm it's
  intentional; if not, add the decline path the original design called for.
- Compute and store `primary_weakness_id` so weakness-based email personalization is possible outside the
  email-send-time calculation that already exists.
- Watch the first live Day 3/10/30/90 sends once real leads reach those stages — nothing has exercised
  this path against a real inbox yet (only the Day-0 path and the SQL fix have been verified).

### Results-page refinement to resolve next

The current design supports two different jobs and should keep them distinct:

* **Before email signup:** let people explore the five profiles so they do not retake the quiz just to
  understand the range. Keep the profile selector and the user's result visible.
* **After email signup:** shift attention from exploration to action. Consider reducing the profile
  exploration prominence, retaining the user's profile and weakest-pillar tease, and making the report
  offer the clear primary CTA.

Before changing the UI again, decide and test these points:

1. Move the personalised weakness message into the post-signup/action area, or repeat a short version
  beside the report CTA. Do not remove the weakness insight entirely; it is the strongest bridge from
  the free result to a useful paid action plan.
2. Define the post-signup hierarchy: primary report CTA, secondary share action, and optional profile
  exploration. The report should be presented as a product with a small preview or sample page, not
  merely as a download or PDF.
3. Decide whether profile exploration remains available after signup as a collapsed or secondary
  control. Preserve it if it helps users understand the archetype system, but keep it from competing
  with the report CTA.
4. Decide what the email CTA promises: a weakness-specific action plan, a full archetype report, or
  both. The page, welcome email, and payment page should use the same promise and price.
5. Add analytics for `profile_explored`, `post_signup_report_viewed`, and `report_preview_clicked` before
  testing the redesign, so we can tell whether people explore, read the offer, and move toward purchase.
6. Test the revised post-signup layout on mobile first, then compare report CTA clicks and signup-to-CTA
  conversion against the current version before removing the explorer.

**P2 — cleanup and launch hygiene**
- **Remove redundant configuration and dead paths before launch:** choose one styling/build path. The
  app currently runs Tailwind through the CDN in `public/index.html`, while `tailwind.config.js`,
  `postcss.config.js`, the `build:css` script, and the empty `public/styles.css` describe an unused
  compiled-CSS path. Either complete the compiled build and remove the CDN dependency, or remove the
  unused build configuration and script. Do not leave two competing production paths.
- Delete `netlify/functions/emailService.js` and the now-fully-superseded `daily-mailer/index.ts` after
  confirming no deployment references them. The `daily-mailer/index.ts` edit currently in the working
  tree is separate and must be reviewed or discarded deliberately before deletion.
- Collapse the duplicate `quiz_data.js` into one source of truth, updating the Netlify function import or
  shared data boundary as needed, then run the score-boundary checks.
- Run a final repository hygiene pass: search for placeholder copy, demo payment text, stale template IDs,
  unused environment variables, and documentation that contradicts the deployed app. Record each item as
  removed, intentionally retained, or deferred with an owner and reason.

**Done this session (for context, not action items)**
- Fixed `submit-score.js` crashing on every call from an ESM import inside a CommonJS function.
- Fixed the RLS violation on quiz submission caused by `.select()` after insert with no SELECT policy.
- Confirmed `SUPABASE_URL`/`SUPABASE_KEY` are correctly set on Netlify and the Supabase project (which
  had been paused) is active again.
- Fixed the unstyled production site by reverting to the Tailwind CDN script.
- Retired the "anonymous research data" promise in favor of an explicit, bounded email↔score linkage
  (§4).
- Built and shipped the Day-0 welcome email (MailerSend, custom HTML, not a dashboard template) and a
  working unsubscribe endpoint; extended `submit_lead()` to return pillar scores for it.
- Diagnosed spam placement on the first real send and added the missing DMARC record.
- Built and deployed the Day 3/10/30/90 drip sequence as a Netlify Scheduled Function (confirmed
  registered with Netlify's cron scheduler), superseding the never-deployed `daily-mailer/index.ts`.
- Found and fixed a second real gap: `submit_lead()` never set `quiz_completed_at` or
  `last_email_stage`, which would have made the entire day-based drip schedule permanently inert.
- Set up private Supabase Storage delivery (signed URLs, service_role key) for the poster/report PDFs,
  scoped so the free poster can't be used to also leak the paid reports.
