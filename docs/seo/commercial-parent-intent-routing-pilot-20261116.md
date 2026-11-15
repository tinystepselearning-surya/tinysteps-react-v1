# Commercial parent-intent routing pilot — 16 November 2026

**Release state:** Separate branch / review only. No change to production until reviewed, tested and merged. This is a **navigation and buyer-intent clarity pilot**, not a ranking recovery claim.

## Why this limited change

The November 15 Search Console/GA4/Bing/CRM review found that broad educational search reach is stronger than direct discovery of paid programme pages. The follow-up excludes free games and focuses on parents looking for classes and reading/speaking support.

The existing public Phonics, Reading, Grammar, Speaking, Pricing, group-class, and assessment pages already contain substantial owner-specific guidance, trust evidence and CTAs. We will not rewrite their successful titles, H1s, meta descriptions or canonical targets without a page- and query-scoped India baseline.

Two article conversion exits were mismatched to their **specific** parent question:
- `/blog/how-to-improve-reading-fluency-in-children`: when decoding is mostly accurate but connected reading is effortful, send the **programme comparison** exit to `/reading-classes-for-kids`, whose owner page explicitly separates Phonics from connected-text fluency/comprehension support.
- `/blog/child-gives-one-word-answers`: for short everyday spoken responses, send the **programme comparison** exit to `/spoken-english-classes-for-kids-online`, not the audience-facing Public Speaking owner.

The prominent **Book a free assessment** CTA remains unchanged for both articles. Other reading/phonics and Speaking/communication pages retain their existing choices and ownership.

## Hard no-change boundaries

No changes to: existing URLs, redirects, canonical tags, robots, sitemaps, structured data, page titles/H1s, live programme promises, class fees, demo form, group format, WhatsApp handoff, Firestore lead writes or deduplication, analytics event names, attribution context, Firebase rules, and production.
No game-page SEO changes. Grammar PR #867 remains independent.

## Review and release gates

1. Run `src/tests/seo/blogB11LeadAttribution.spec.ts` and the relevant blog SEO build/route regressions; confirm that all previously protected parent and schools CTA families keep their behaviour.
2. Confirm both destination routes exist and their parent-facing programmes accurately match the article problem.
3. Check a phone and desktop render: the existing one end-of-article CTA card should show the assessment action and corrected programme comparison, with no added overlays or competing CTAs.
4. Inspect the deployed response/canonical and link destination, if later approved. No genuine lead should be submitted as a test.

## Measurement — compare like with like

Report separately for these two article URLs (exclude all games), with source and India filters where available:
- GSC: query/page impressions, clicks, CTR and position for the same weekday-aligned 28-day periods. Do not interpret general GSC growth as a direct result of these two links.
- GA4: article views, `blog_cta_impression`, `blog_program_click` grouped by `destination_path`, and `book_assessment_click` as *intent*, not unique parent leads.
- CRM: canonical new parent–child enquiries and returning episodes, blog attribution where preserved, confirmed/completed demo and enrolled status; do not infer paid admissions from GA4 clicks.

An internal link change may improve parent navigation without changing SEO rankings. Do not conclude success from impressions alone, and do not aggregate repeat clicks as unique parent enquiries.

## Pricing and Reading evidence pass — 16 November 2026

The following figures were recalculated directly from the user's 15 November uploaded exports:
- **Google Search Console, 14 Aug–13 Nov 2026, page totals:** `/pricing`: **37 clicks, 4,643 impressions, 0.80% CTR, 2.55 average position**; `/reading-classes-for-kids`: **4 clicks, 159 impressions, 2.52% CTR, 19.48 average position**.
- **GA4-linked GSC landing-page report, 18 Oct–14 Nov 2026:** Pricing **7/1,183 clicks/impressions**; Reading **2/63**. These metrics are Google organic Search Console data embedded in a GA4 export, not an independent GA4 session count.
- **Google generative-AI feature impressions, 14 Aug–13 Nov:** Pricing **201**; Reading **30**. AI impressions are **not visits, distinct referrals, recommendations or leads**.
- **Unfiltered *site-wide* Queries.csv:** `online phonics classes fees` 74 impressions / 4 clicks / avg position 16.55; `phonics classes fees` 74 / 1 / 14.97; `reading classes for kids near me` 46 / 0 / 8.70; `online reading classes for kids` 23 / 1 / 23.39. These are **NOT Pricing-page or Reading-page query observations**, and none of these exports provides a page-by-query-by-India cross-tabulation. Search Console omits many query rows; aggregate query totals cannot be equated with page totals.

### Interpretation and risk decision

- Pricing is being **shown often without many clicks**, even though its aggregated average position is relatively high. We cannot tell from this dataset whether that represents branded navigational impressions, irrelevant queries, rich-result presentation, or low-intent searches. **No metadata or snippet experiment** is justified yet.
- Reading has an **exposure/discovery** limitation, not established evidence of a poor search snippet. Low-volume query rows and the weaker page-level position do not prove a particular keyword opportunity, but support checking the existing internal pathways.
- The Pricing page already links to the correct Reading programme, but its question grouped *decoding* with Reading even though Reading explicitly sends unstable decoding to Phonics. We made **one parent-fit wording clarification in `src/pages/PricingPage.tsx`**; the pricing table, CTA, metadata and links remain unchanged.
- The two article-programme links earlier in this branch remain the other bounded edits. Do not create a new Reading page, Pricing fee page or query-variant URL.

### Evidence still required before considering any title/meta/canonical alteration

From **Google Search Console → Performance → Search results**, export two independently filtered **Queries** views for the same date range:
1. Page filter **Exact URL** `https://tinystepslearning.com/pricing` plus Country = **India**.
2. Page filter **Exact URL** `https://tinystepslearning.com/reading-classes-for-kids` plus Country = **India**.

Include device and the prior matched comparison period if available; evaluate branded vs nonbranded parent-buying queries, position, snippet accuracy and month-over-month direction. These results are currently **unavailable**. Preserve existing metadata until this evidence is reviewed.

### Post-approval measurement (not yet live)

For the revised Pricing question, watch use of the existing Reading programme link and subsequent assessment clicks, with canonical CRM enquiries and admissions counted separately. For Reading, compare true **India page-level impressions and clicks**, new enquiry episodes, completed assessments, and admissions. Do not interpret historical GA4 aggregate key events as submitted leads or attribute causality without comparable observation windows. The release decision must include mobile and desktop inspection and no-regression confirmation.
