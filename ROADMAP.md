# Roadmap: things to build after launch

Ideas that are deliberately not in the launch scope. Pick them up when the trigger condition is met.

## 1. Insights dashboard (trigger: a few hundred completed quizzes)

**Why:** once there's real data, the dashboard should give us evidence-based reasons to change the emails
and the site, not guesses. It is a tool for us first. Anything shown publicly is a later, separate decision.

**Data already collected**
- `research_data`: anonymous answers, total score, archetype, four pillar scores, country, weakest pillar.
- `marketing_leads`: score history per lead, retake count, purchase flag, email stage reached.
- GA4: quiz funnel events, UTM campaign/content (including `utm_campaign=drip_d3` etc. from the emails).
- Stripe: purchases, currency, country.

**What the dashboard should show**
1. **Funnel:** visit -> quiz started -> completed -> signed up -> report page viewed -> purchased.
   Where do people drop out, by source (organic vs each paid campaign)?
2. **Question drop-off:** which questions people abandon or skip most (`question_number` GA event).
3. **Who is taking it:** score distribution, archetype mix, by country and by traffic source.
4. **Weakest pillar mix:** which pillar is most often the weakest. This decides which quick wins and
   report copy matter most.
5. **Per-question answer distribution:** the habits that are most common (for example phone in the bedroom).
6. **Email performance:** open/click and, more importantly, purchases and retakes by email (UTM), for
   welcome / Day 3 / 10 / 30 / 90, and Day 3 versus Day 10 purchase rate.
7. **Retake effect:** share who retake after the 30 and 90 day emails, and the average score change.
   This is the evidence for the "it works" story, and for the Day 30/90 emails.

**How the results should feed back**
- Commonest weakest pillar -> lead the welcome email and ads with it; improve that pillar's quick win.
- Questions with high drop-off -> reword, reorder or cut.
- Email with the best purchase rate -> use it as the template; rewrite the weakest.
- Real retake improvements -> replace general claims with real numbers in the Day 30/90 emails and on the
  "how it works" page (only once the sample is large enough to be honest about).
- Country differences -> localise ad creative and copy; decide whether per-region pricing is worth testing.

**Guardrails**
- Aggregates only. Never show individual emails or answers; hide any group smaller than about 20 people.
- Only publish a statistic ("most people...") when the sample supports it and we can show how it's calculated.
- Build it read-only: use SQL views or an aggregating function so the dashboard never needs write access or
  the service-role key in the browser.

**How to build it:** a Dashboard-type Artifact (or a page behind a login) reading aggregated views from
Supabase plus a GA4 export. Start with the funnel and weakest-pillar charts, which are the quickest wins.

## 2. Other ideas, not yet scheduled
- Add a Day 1 example from the report to the Day 10 email (needs the real report text).
- Test two subject lines on Day 3 and Day 10 once volume allows.
- Make the CSP enforcing (after checking the live console for violations).
- Per-region pricing test, if the dashboard shows real differences in conversion by country.
- Retire the older `?email=` unsubscribe path: done. Remove the migration fallback in `scheduled-drip.js`
  for a missing `retake_token` column, now that the column exists everywhere.
