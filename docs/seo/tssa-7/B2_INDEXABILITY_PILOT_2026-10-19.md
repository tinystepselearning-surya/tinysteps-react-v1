# TSSA-7/B2 — First live origin indexability pilot

**Project:** [TSSA-7](./README.md)  · **Date:** 19 October 2026  · **Status:** pilot evidence in progress, **Google/Bing indexing verdicts not collected**.

## Why these 10 routes

The B1 canonical inventory reconciled 279 source-derived directory entries and identified two speaking-course pages wrongly flagged `noindex` by the **generated AI directory**, despite the canonical `/courses/**` source route being indexed by design. Historic Google indexing issue [#747](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/747) separately lists still-unverified 39 candidate HTML pages, including five specific priorities. B2 starts with a **read-only production HTTP pilot**, not another huge technical rewrite.

**Pilot paths:**
- `/courses/public-speaking-foundations` and `/courses/public-speaking-excellence` — generated index-policy collision from B1
- `/best-online-phonics-classes-for-kids-in-india` — earlier GSC impressions disruption; owner Incognito search demonstrated discoverability for one query, not an indexed-view verdict
- `/confidence-building-program-kids` — historical noindex observation, current outcome unknown
- `/blog/online-phonics-classes-vs-school` — historical Soft 404 question, fixed source changes but actual index outcome unknown
- `/blog/grammar-assessment`, `/resources/grammar/simple-past-tense-for-kids` and `/resources/phonics/magic-e-phonics` — #747 owner URL inspection priorities
- `/resources/vocabulary` — knowledge hub and GSC sitemap risk cross-check
- `/courses` — overview of public course-level discoverability

## Run the read-only witness

```bash
node scripts/tssa7-b2-live-indexability-pilot.mjs
```

This makes normal HTTP GET requests to production, gathers response status, served canonical, robots directives, X-Robots-Tag, basic content visibility, live sitemap membership and **generated** AI directory metadata. It writes:
- `artifacts/tssa7-b2/LIVE_INDEXABILITY_PILOT.json`
- `artifacts/tssa7-b2/LIVE_INDEXABILITY_PILOT.csv`

GitHub CI uploads both artifacts. The script will **record technical flags and unknowns**, not automatically repair, submit indexing, deploy or rewrite anything. A normal user-agent cannot establish that verified Googlebot/Bingbot IPs can reach the site.

**Interpretation discipline:**
- HTTP 200 + self-canonical + no noindex = **eligible for search indexing on examined HTTP evidence**, not Google/Bing indexed
- Search Console impressions = search exposure, not complete URL Inspection history
- Missing AI directory/zero AI citations is not a Google index exclusion verdict
- Redirect aliases should NOT become their destination's `noindex` policy; no correction made by this pilot
- If a test fails with `fetch` error, mark the relevant live attribute unknown, not a sitewide outage

## B2 real indexed-view evidence — required from the website owner

For each priority URL, capture GSC **URL Inspection → Indexed result**, plus Google-selected canonical, crawl time, robots/crawl/indexation reason, **Test Live URL** separately, any rendered screenshot and latest Page Indexing category.

Capture Bing Webmaster Tools **URL Inspection or Site Explorer** index status and canonical where available. Those platforms require owner access; the repository and regular HTTP cannot forge their decisions. Export 7/28-day Google query/page impressions with matching date windows, and use the separately verified GSC Generative AI report for AI-feature impressions. **No mass indexing requests.**

## Acceptance and release gate

B2 will be completed only when the scope of top indexed/excluded canonical owners is reconciled with GSC/Bing owner evidence and confirmed high-priority defects are either corrected or explicitly documented as platform pending. **This pilot does not complete B2**; it only establishes what the origin serves now.

B1 is **complete**, merged in [PR #758](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/758). Source-index-policy correction, if warranted by live evidence, belongs in a separate scoped implementation PR, not inside this evidence-only pilot. PRs #754 and #755 remain unmerged and independent; #756 lead health investigation separately blocks nonessential public content releases.
