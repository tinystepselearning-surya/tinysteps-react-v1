# Tiny Steps group-class discovery: visibility-safe release plan

**Scope:** /group-phonics-classes-for-kids, /group-grammar-classes-for-kids, /group-public-speaking-classes-for-kids and supporting source links on /phonics, /grammar, /speaking, /pricing. Other established commercial pages stay intact.

**Goal:** improve parent discovery and qualified clicks for the new small-group offer without changing the established 1:1 programme owners or damaging existing Google Search visibility. Success is measured from Search Console; no guaranteed ranking or AI citation improvement.

## Phase 1 — bounded internal discovery links (this PR)

- From each established /phonics, /grammar and /speaking page, add one relevant descriptive anchor to the corresponding group format; leave the 1:1 primary CTA and teaching evidence untouched.
- From the standard Group Classes pricing section, link all three group programmes; do not alter prices, rates, eligibility, class durations, legacy packages or one-to-one offer.
- On group pages, link genuine existing class samples and academic team information while explicitly not presenting published 1:1 evidence as proof of a currently operating group batch.
- Include three group pages in both LLM directory documents as *format alternatives* to existing commercial owners; this is a discovery hint, not a ranking mechanism.
- No changes to route names, canonicals, metadata, H1s, sitemaps, robots, structured data, main hero or existing parent enquiry funnel.

## Mandatory release gates

1. Source-level regression locks the current commercial titles/self-canonicals/sitemap ownership, 1:1 CTA continuity, exact matching group links and current standard group pricing.
2. Existing TypeScript, commercial-page, Soft 404/prerender and mobile chunk-recovery checks pass on the precise PR head.
3. Inspect generated output for the three group links in the intended owning pages and validate the group pages still have their original CTA and canonical.
4. Only merge after the required PR workflows pass; verify Firebase Hosting production marker equals the merged commit and release smoke tests pass.
5. Record any Google live URL Inspection failures separately; do not confuse live crawl eligibility with indexing or search impressions.

## Phase 2 — evidence and trust (separate, consent-gated PR)

Publish teacher profiles only once qualifications, relevant experience, professional photographs and permissions have been verified. Reference existing, consent-authorized class samples and neutral parent reviews. Never imply a 1:1 recording is footage of a group batch, fabricate enrolment numbers or claim accreditation that is not held. Preserve privacy of teachers and children.

## Phase 3 — query-driven optimization (separate PR after measurement)

Query-level Search Console analysis should identify pages with meaningful impressions and weak clicks: /speaking, /grammar and /pricing first. Edit titles or rich on-page content *only if* query mix, current CTR and competing result formats support the specific change, with a controlled before/after release and rollback criteria. Protect /phonics and its successful established query ownership.

## Evaluation and rollback

- Capture a **pre-release** GSC page/query extract for /phonics, /grammar, /speaking, /pricing, /courses, /reading-classes-for-kids and the three group pages. Track **impressions, clicks, CTR, average position and non-branded queries** per page.
- Compare the first **14 full days** and next **28 full days** after deployment against equivalent preceding days. Segment branded vs non-branded where GSC provides enough data; account for search-demand changes, Google reporting delay and the 19 October domain incident.
- Track URL Inspection index status for each group page and separate AI citation tests; no indexed status is inferred from an HTML accessibility test.
- A concern deserving review is a persistent decline in high-volume established non-branded queries together with a worsening average position and no corresponding group traffic gain. Do not auto-revert based on a one-day anomaly; confirm query mix and indexing first.
- If a link causes an unintended conversion drop or redirects to the wrong programme, revert this small link-only PR rather than modifying the established page metadata.

**Measurement principle:** GSC click/impression trends measure Google Search, not actual ChatGPT usage or citations. Measure direct AI answer selections separately with reproducible prompts and dated responses.
