# Launch test: ad pack (round 1)

Companion to `MARKETING_RESEARCH.md`. Everything needed to set up and run the first paid test.
Images are in `marketing/ads/` (re-build with `node marketing/build-ads.js` after editing copy).

## The plan in one paragraph
One campaign, one ad set, about **$200 over 14 days (about $14/day)**, targeting **Australia, New Zealand,
Canada and the UK**, three ads (a still, a carousel, a short video), optimised for **link clicks**
(no Meta pixel is installed; we measure quiz starts, completions and signups in Google Analytics through UTM
tags). $200 is enough to learn which message and format people click. It is **not** enough to compare
countries, so that is round 2. The US and Europe are left out of round 1 (US: most expensive, weakest hook;
EU: consent norms, see the research file).

## Before spending anything
- [ ] Netlify site is back online and the deploy tasks are done (CSP check, live email test, key rotation).
- [ ] Facebook Page and Meta ad account created (steps below). Do these early: new accounts can be slow to
      approve ads and have low initial spend limits.
- [ ] Open the live quiz from each ad link on a phone and complete one test run with your own address.
- [ ] Check Google Analytics sees the UTM source (`meta`) and the events listed under "Measuring it".

## Ads

### Ad A: "They're banning it for kids" (still, 1080 x 1350)
- **Image:** `ad-a-global.png` (round 1). `ad-a-au.png` and `ad-a-uk.png` are built for round 2, when
  country-specific ad sets let each show only to its own market. **Do not run the AU or UK versions in the
  combined round-1 ad set**: a UK viewer would see "Australia banned it".
- **Primary text:** Some countries are banning social media for under-16s. Fair enough. But what's it doing to
  the rest of us? 15 questions, 3 minutes, one digital archetype.
- **Headline:** What's your Digital Wellbeing Score?
- **Description:** A 3-minute, 15-question scorecard.
- **Button:** Learn more
- **Link:** `https://digitalwellbeingscore.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=ban-test-1&utm_content=ad-a-global`

Round-2 primary-text variants (swap the first sentence):
- AU: "Australia banned social media for under-16s. Fair enough. But what's it doing to the rest of us?..."
- UK: "The UK's planning to ban social media for under-16s. Fair enough. But what's it doing to the rest of us?..."

### Ad B: "Which digital archetype are you?" (carousel, 6 cards at 1080 x 1080)
- **Cards, in order:** `ad-b-card-1.png` to `ad-b-card-6.png` (intro, then Zombie Clickslave, Unconscious
  Doomscroller, Digital Drifter, Intentional Architect, Digital Sovereign).
- **Primary text:** From Zombie Clickslave to Digital Sovereign: where do you land? 15 questions, 3 minutes.
- **Card headlines:** use the archetype name on cards 2-6; "Find your digital archetype" on card 1.
- **Card descriptions:** the one-liner on each image (for example "Functional, but pinged to pieces.").
- **Button:** Learn more
- **Link (same for every card):** `https://digitalwellbeingscore.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=ban-test-1&utm_content=ad-b-carousel`

### Ad C: founder clip (vertical video, 1080 x 1920, 15-20 seconds)
Shoot on a phone, held vertically. Photos from the emails can be used as stills in the cut.

| Time | What we see | Caption (burned in) |
|---|---|---|
| 0-3s | Dark room, your face lit only by the phone (like the dark photo). Slight scroll motion. | "2am. Not working. Not sleeping. Just scrolling." |
| 3-8s | Same, you look up at the camera, a wry half-smile | "I was a Zombie Clickslave. So I built a quiz to find out how bad." |
| 8-14s | Daylight, you, relaxed and happy (like the happy photo), phone in pocket or away | "Turns out noticing is half the fix. 15 questions. 3 minutes." |
| 14-18s | End card: the navy "Digital Wellbeing Score" card with the URL | "See your score. Link below." |

- **Primary text:** I built this after my own phone habit got out of hand. Curious where you land?
- **Headline:** Find your Digital Wellbeing Score
- **Button:** Learn more
- **Link:** `https://digitalwellbeingscore.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=ban-test-1&utm_content=ad-c-video`
- **Tips:** captions must be burned in (most people watch muted); grab attention in the first 2 seconds;
  keep captions out of roughly the top 15% and bottom 30% of the frame where Reels and Stories show buttons;
  natural light and a real, unpolished look suit the tone; MP4 or MOV, under about 30 MB is plenty.

## Campaign settings (Ads Manager)
- **Objective:** Traffic. Optimise for **link clicks** (landing page views if offered), since there is no pixel.
- **Budget:** daily, about $14 (set it in the ad account's currency; see "Choosing the currency").
  Run 14 days. One ad set.
- **Locations:** Australia, New Zealand, Canada, United Kingdom. People living in or recently in these places.
- **Age:** 25-54. Gender: all. **No interest or health targeting.** Keep it broad; the creative does the work.
- **Placements:** Advantage+ (automatic): Facebook and Instagram feeds, Stories and Reels.
- **Ads:** the three above in the one ad set.
- **Naming:** campaign `ban-test-1`; ad names `ad-a-global`, `ad-b-carousel`, `ad-c-video`, to match the UTMs.

## Measuring it
In Google Analytics, filter by `utm_source = meta` and `utm_campaign = ban-test-1`, and look at `utm_content`
for each ad. The site already records: `quiz_started`, `quiz_completed`, `results_viewed`, `signup_completed`,
`report_cta_clicked`, `quiz_abandoned` and per-question events.

| Check | Where | What good looks like |
|---|---|---|
| Click-through rate | Meta Ads Manager | At or above about 1% is healthy for cold traffic |
| Cost per link click | Meta | Compare the three ads |
| Quiz started per click | GA | Shows whether the landing experience matches the promise |
| Quiz completed, signup completed | GA | The real outcomes. Cost per signup = spend / signups |

**Decision rule (day 7):** do not judge any ad before it has about 1,000 impressions. At day 7, pause the ad
with the highest cost per *completed quiz* (not per click) and move its budget to the best performer. Also read
Meta's breakdown by country to see which market responds. Treat it as a hint, not a result, at this budget.

## Setting up Facebook and Meta (you do this; about an hour)
1. **Personal Facebook account** (you must have one to administer a Page). Use your real name.
2. **Create a Facebook Page** (facebook.com/pages/create): name `Digital Wellbeing Score`, category
   "Health & Wellness Website" or "Education Website", short bio ("A 3-minute scorecard for your digital
   habits"), website `digitalwellbeingscore.app`, contact email `hello@digitalwellbeingscore.app`. Profile
   picture: the site favicon or `dws-welcome.png`; cover: one of the carousel cards.
3. **Instagram (recommended):** create an Instagram account with the same name and connect it to the Page in
   Page settings, so ads can run on Instagram under the brand.
4. **Meta Business portfolio** (business.facebook.com): create one, add the Page (and Instagram). This is
   where ads are managed. Business verification is *not* needed for this test.
5. **Ad account** (in Ads Manager, or Business settings, Ad accounts): create one. Choose the
   **currency and time zone carefully: they cannot be changed later.** Pick the currency you want to think
   and be billed in (your Stripe and bank are NZD, so NZD is simple). Note that the $200 budget is then in
   that currency.
6. **Payment method:** add a card. Expect a small spending limit at first and possible ID checks.
7. **Post 3-4 organic posts on the Page** before running ads (the founder story, an archetype card, a quiz
   invitation). An empty Page looks untrustworthy and sometimes slows approval.
8. **Not needed for round 1:** the Meta pixel, domain verification, Conversions API. Add them later, with a
   privacy-policy and consent update, if you want Meta to optimise for signups.

## Risks to check at ad review
- **Social-issues category:** Meta can treat ads about government policy as "social issues" ads, which need
  extra authorisation and a disclaimer. The copy keeps the ban reference vague ("some countries") and the ad is
  about the reader, but I have not verified how Meta will classify it. If it is flagged, we either complete the
  authorisation or drop the ban reference and lead with the archetype carousel.
- **Negative self-image / personal attributes:** the archetype names are playful, but "Zombie Clickslave" could
  be flagged. If so, soften the names in the carousel only.
- **Facts:** the Australian ban is in effect; the UK has announced one for 2027; NZ's is a proposal only. Keep
  regional lines to those facts.
