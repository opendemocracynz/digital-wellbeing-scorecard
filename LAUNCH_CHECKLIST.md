# Pre-Launch QA Checklist — Digital Wellbeing Scorecard

Manual checklist. Run through this on the live URL (https://digitalwellbeingscore.app) right before
announcing the site publicly. Check items off as you go; anything that fails, note it and fix before
launch if marked **(blocking)**.

## 1. Styling & first impressions
- [ ] Splash screen, quiz, and results screens all show the intended dark styled theme — not plain
      unstyled HTML. (Fixed 2026-07-30 by reverting to the Tailwind CDN script — re-confirm on a fresh
      page load / hard refresh.)
- [ ] Test on a phone (real device or browser dev tools mobile view) — this is presumably the primary
      device for most visitors.
- [ ] Test in at least Chrome and Safari (iOS Safari especially, since desktop-only testing misses it).
- [ ] Favicon shows correctly in the browser tab.
- [ ] No layout breakage/overflow on narrow (320px) screens.

## 2. Quiz flow
- [ ] "Begin Assessment" starts the quiz from question 1.
- [ ] Answering a question auto-advances after ~1.5s, and clicking "Next" advances immediately.
- [ ] "Previous" works and preserves your prior answer selection (highlighted).
- [ ] Progress bar reflects current question number correctly.
- [ ] Skipping to the end with unanswered questions shows the warning dialog and lets you jump back to
      the first missed question.
- [ ] Submitting with 0 unanswered questions works without the warning.
- [ ] Refresh mid-quiz → splash screen offers "Resume Assessment"; resuming restores your answers and
      position.
- [ ] "Clear Progress & Restart" actually clears `localStorage` and restarts at question 1.

## 3. Scoring correctness
- [ ] Manually answer all questions with the lowest option (score 1 each) → total = 15, archetype =
      "Zombie Clickslave."
- [ ] All highest options (score 5 each) → total = 75, archetype = "Digital Sovereign."
- [ ] One run at a boundary (e.g. total 29 vs 30, 44 vs 45) lands in the correct archetype either side.
- [ ] Pillar breakdown math is plausible (spot-check one submission's four pillar scores sum toward the
      total — they should be close, since every question feeds exactly one pillar).

## 4. Results screen
- [ ] Correct archetype name, image, and description render for your score.
- [ ] Gauge marker position matches your score visually (roughly, along the 15–75 scale).
- [ ] Clicking other archetype level icons on the gauge updates the profile card ("Viewing Profile") and
      clicking doesn't lose your own actual result.
- [ ] "Challenge a Friend" share text includes your correct score and archetype name.
- [ ] "Click to Copy" actually copies to clipboard (paste somewhere to confirm) and briefly shows
      "Copied!".

## 5. Email signup (data pipeline) **(blocking)**
- [ ] Submitting a new email succeeds, shows "Thank you for subscribing!", and reveals the
      share/unlock-report buttons.
- [ ] Submitting the **same** email again with a **different** score shows the correct "improved by N" /
      "dropped by N" / "unchanged" message.
- [ ] Submitting an obviously invalid email (e.g. empty, no @) is rejected client-side or shows a clean
      error — not a raw error dump.
- [ ] After successful subscribe, `localStorage` quiz state is cleared (refreshing doesn't offer "Resume"
      for a completed quiz).
- [ ] **Verify in Supabase directly** (Table Editor) that:
  - [ ] A new `research_data` row appeared with the correct total/archetype/pillar scores.
  - [ ] A new (or updated) `marketing_leads` row appeared with the correct email, segment, score.
  - [ ] `research_data.user_email` got backfilled to match (this linkage is intentional — see
        PROJECT_CONTEXT.md §4).
- [ ] Simulate a backend failure (e.g. temporarily rename/break an env var) and confirm the UI shows a
      graceful error message rather than a blank screen or console-only failure. Revert after testing.

## 6. Payment gateway **(blocking — real Stripe integration required for launch)**
- [ ] "Unlock Full Report" leads to a real checkout (Stripe Checkout/Payment Element), not the current
      `alert()` demo.
- [ ] Card details never touch this app's own frontend code or Netlify functions — confirm the flow is a
      Stripe-hosted form/redirect, not a form this app submits itself (see PROJECT_CONTEXT.md §4).
- [ ] A successful test payment (Stripe test mode) correctly flips `marketing_leads.has_purchased_report`
      via webhook.
- [ ] A failed/cancelled payment returns the user to the app cleanly, without marking them as purchased.
- [ ] "Cancel and return to results" link (or equivalent) works.
- [ ] Archetype name shown on the checkout page matches the user's actual result.

## 7. Email service
- [x] Subscribing sends a real email via MailerSend confirming signup and showing the user's
      score/archetype/4-pillar breakdown. Built and confirmed working 2026-07-30 (custom HTML in
      `netlify/functions/lib/welcome-email.js`, not a MailerSend dashboard template).
- [x] Sender is `hello@digitalwellbeingscore.app` — real, ODNZ-controlled domain with SPF + DKIM
      configured via MailerSend domain verification.
- [x] Unsubscribe link works — `unsubscribe_lead()` RPC + `netlify/functions/unsubscribe.js`. Note: it's
      unauthenticated (email in the URL, no token) — accepted tradeoff, see PROJECT_CONTEXT.md §5.
- [ ] **(blocking) Deliverability**: first live send landed in spam (Outlook). Missing DMARC record was
      added 2026-07-30 (`_dmarc.digitalwellbeingscore.app`, `p=none`) — re-test a fresh send to Gmail,
      Outlook, and one other provider before wide launch promotion. Domain has no sending history yet, so
      don't be surprised if spam placement persists for a while regardless — this needs ongoing
      monitoring during early launch, not a one-time check.
- [ ] Email renders correctly on mobile mail clients (Gmail app, Outlook app, Apple Mail).

## 8. Privacy & copy accuracy **(blocking)**
- [ ] Public-facing copy (site + any ODNZ privacy policy linked from it) reflects the actual, current data
      practice: quiz scores get linked to a subscriber's email once they sign up (see PROJECT_CONTEXT.md
      §4) — don't leave an "anonymous" claim standing anywhere.
- [ ] Confirm no PII beyond email + first name is being captured anywhere in the funnel (check payment
      flow too, once Stripe is wired up — see §6).
- [ ] "Unsubscribe at any time" text has a real unsubscribe mechanism behind it (see §7) before this line
      ships to more users.

## 9. Things explicitly OK to launch without (not blocking)
- Real Day 3/10 story content — `scheduled-drip.js` is live and will fire on schedule, but those two
  stages currently send placeholder copy (see PROJECT_CONTEXT.md §5) until the founder-narrative text is
  written. Fine to launch before that's filled in; just don't forget it's placeholder in production.
- Live verification of the Day 3/10/30/90 sends against a real inbox — only Day 0 and the underlying
  `quiz_completed_at` fix have been tested end-to-end so far. Worth a manual check once real leads reach
  those stages, but not a reason to hold launch.
- The compiled-Tailwind build (vs. the CDN script currently in use) — functionally fine for launch, best
  practice cleanup to follow.
