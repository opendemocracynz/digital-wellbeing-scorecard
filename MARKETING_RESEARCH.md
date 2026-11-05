# Launch marketing research (2026-11-05)

Desk research to prepare the social media launch. Most figures come from vendor blogs with unclear
methods, so use them for planning ranges only and replace them with our own account numbers as soon as
we have any. Items marked **(my judgment)** are hypotheses, not findings. This feeds `MARKETING_PLAN.md`,
whose August dates are out of date.

## 1. Can one creative work across all regions?

Largely yes, if the voice is the common denominator rather than a US hard sell.
- US ads lean hard-sell and optimistic; UK ads lean softer, with self-deprecating humour and the product
  appearing late. Australian commentary says local ads have lost some irreverence. Sources are mostly
  practitioner pieces, and Australia is thinly evidenced.
- Our brand voice already fits the middle: calm, practical, a little self-deprecating ("Zombie Clickslave"),
  not hyped. **(my judgment)** That should read fine in the US and better than a US hard sell in the UK,
  Australia and NZ.
- Localise lightly, not fully: one core creative, with per-market hook, spelling and currency.
- Check copy for US spellings (the archetype copy says "Optimize") if the UK/AU/NZ are a large share.

## 2. Costs by market (indicative CPM, USD)

| Market | Range seen | Notes |
|---|---|---|
| US | about $16-23 | Most expensive in every source |
| Canada | about $11-14 | |
| Australia | about $9-14 | Close to Canada |
| New Zealand | about $7-13 | Usually the cheapest of the English-speaking markets, most variable data |
| UK | about $9-18 | Wide range |
| Germany | about $8-15 | |

**Revenue per sale matters as much as cost per click.** We charge 4.99 in every currency. At roughly current
exchange rates (my approximation, check live rates) a 4.99 purchase is worth very different amounts:
NZD about US$3, AUD/CAD about US$3.3-3.6, USD $4.99, EUR about US$5.5-5.8, GBP about US$6.4-6.6. So the UK
and Europe are the *highest* revenue per purchase at middling cost, the opposite of the instinct that they
convert worst. Test, do not assume. If NZ/AU/CA sales are consistently thin, consider a modest price test.

## 3. Meta ad policy risks for this product

- Meta bans ads that assert or imply a person's personal attributes or health, and warns against copy that
  uses "you/your" to reference a personal attribute. It also bans promoting negative self-perception.
- So avoid "Are you addicted to your phone?", "Is your phone ruining your life?", "Do you have...?".
  The current plan's Variant A ("Is your phone stealing your attention?") is a risk.
- Safer: curiosity and benefit. "Find your Digital Wellbeing Score. 15 questions, about 3 minutes."
  "What's your digital archetype?" Always say it is a self-reflection tool, not a diagnosis.
- Confirm everything in Meta Ad Review; no source gave verified quiz-specific rewrites.

## 4. Hooks and timing

- Governments are acting on kids and phones: Australia's under-16 social media ban took effect in
  December 2025 and its effect is contested; the UK government announced an under-16 ban in June 2026
  (restrictions expected 2027) and "phone-free by default" schools; NZ's proposal (August 2026) faces an
  uphill battle in parliament.
- **Adult angle (my judgment):** "We're banning phones for kids. What about us?" Works in AU, UK and NZ;
  weaker in the US. This is how one creative gets a regional variant without being rewritten.
- Statistics exist (for example a February 2026 AASM poll: 38% of US adults say bedtime news scrolling hurts
  their sleep), but several are vendor surveys. Don't put stats in ads until verified from the original source.

## 5. Funnel economics, honestly

- No independent quiz-funnel benchmarks were found. The one cited quiz conversion figure (28%) is a vendor
  claim. Meta lead-form medians (about 7.7% conversion, about $23-28 cost per lead) are a different product.
- **Illustration with my assumptions, not data:** CPM $12, CTR 1% gives about $1.20 per click. If half
  start-to-finish and a third of finishers sign up, about $7-8 per signup. At 3% of signups buying a 4.99
  report (about $3.50 net after fees), that is roughly $250 of ad spend per sale.
- Conclusion: paid traffic will not pay back on report revenue alone at this price. Treat the first paid wave
  as learning and list-building (cost per completed quiz and per signup, retake rate), and weigh founder-led
  organic content heavily, which costs time, not money.

## 6. Email consent across regions

- Germany: double opt-in is the strong de facto norm; single opt-in carries risk. GDPR itself does not
  mandate it. Our signup is single opt-in. Either add double opt-in before targeting Germany/EU, or start with
  English-first markets (UK, Ireland) and add the EU later. Not legal advice; confirm with primary sources
  (GDPR, PECR) or a lawyer.

## 7. Gaps (nothing reliable found)

- What organic formats perform for self-assessment or digital wellbeing content on TikTok, Reels and Reddit.
  Plausible plan **(my judgment, untested)**: a short founder story (the dark photo to the happy one), a
  "score reveal" format, and the quiz as the call to action. On Reddit (digital minimalism communities) read
  each subreddit's self-promotion rules first.
- Real data on how people in each country respond to this specific message. Only our own ads will tell us.

## Suggested first test (for discussion)

Three separate ad sets, so each market teaches us something: (1) AU + NZ + CA, (2) US, (3) UK + Ireland.
Same core creative, per-market hook and currency. Roughly $10/day each for 7 days. Success = cost per
completed quiz and per signup by market, not revenue. Use `utm_campaign` values per market.

## Sources
- Meta CPM by country: [Adamigo](https://www.adamigo.ai/blog/meta-ads-cpm-cpc-benchmarks-by-country-2026), [Kolonell](https://kolonell.com/en/blog/meta-ads-facebook-instagram-sme-guide-2026), [Lebesgue](https://lebesgue.io/facebook-ads/facebook-cpm-by-country), [StackMatix](https://stackmatix.com/blog/facebook-ads-cpm-by-country-2026), [Adligator](https://adligator.com/blog/meta-ads-cpm-by-country-benchmarks), [SuperAds NZ](https://www.superads.ai/facebook-ads-costs/cpm-cost-per-mille/new-zealand)
- Meta policy: [Privacy violations and personal attributes](https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/), [Health and wellness](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness)
- Lead benchmarks: [WordStream Facebook ads benchmarks](https://www.wordstream.com/blog/facebook-ads-benchmarks-2026), [Stormy quiz funnel playbook](https://stormy.ai/blog/perspective-quiz-funnel-playbook-2026)
- Tone differences: [LBB](https://lbbonline.com/news/over-the-pond-what-to-keep-in-mind-when-advertising-in-london-vs-the-us), [Adobe](https://www.adobe.com/uk/express/learn/blog/online-ad-preferences-in-uk-and-us), [B&T](https://www.bandt.com.au/brent-smart-advertising-misses-australias-larrikin-spirit/)
- Attitudes: [SQ Magazine doomscrolling statistics](https://sqmagazine.co.uk/doomscrolling-statistics/), [CMOtech UK detox survey](https://cmotech.uk/story/most-britons-shun-digital-detox-as-online-life-dominates), [Mediaweek AU](https://www.mediaweek.com.au/turns-out-aussies-will-visit-just-about-anywhere-to-get-their-doomscrolling-fix)
- Policy context: [Australia ban early results](https://www.thestar.com.my/aseanplus/aseanplus-news/2026/06/13/australia-reports-early-success-as-under-16-social-media-accounts-fall-37), [UK under-16 ban](https://iol.co.za/news/world/2026-06-15-uk-slams-the-door-on-tiktok-and-instagram-for-under-16s/), [NZ proposal](https://newsonair.gov.in/new-zealand-proposal-to-ban-social-media-for-children-below-16-faces-uphill-battle-in-parliament/)
- Double opt-in: [EmailListValidation](https://emaillistvalidation.com/blog/double-opt-in-germany-eu-requirements/), [Suped](https://www.suped.com/learn/email-deliverability/which-countries-require-double-opt-in-for-email-marketing-according-to-gdpr-and-best-practices)
