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
