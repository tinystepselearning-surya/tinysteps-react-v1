# GSC #735 — Phase 2: seven indexable blog articles and two legacy aliases
**Started:** 18 October 2026. **Related master:** `MASTER_58_URL_RECONCILIATION.md`. **Scope:** Nine *historically "Crawled – currently not indexed"* examples, now 7 likely indexable canonical articles plus 2 legitimate 301 aliases. **Audit only, no changes to production website.**

## Entry conditions and Phase 1 handoff
- Both Phase 1 PRs #742 (tracker and checks) and #743 (blog Soft 404 + clean article HTML revalidation) were merged 18 Oct 2026. Firebase Hosting deploy `39124317852` **SUCCESS**, live deployment integrity/build-identity verification passed for SHA `695393b6a80664ba7ca4456b726a3601b710c079`. **Still pending:** independent live `Cache-Control` header verification and Google Inspection smartphone screenshot after deployment for `/blog/online-phonics-classes-vs-school`; that URL has not been confirmed indexed.
- P2 source evidence is against deployed main at launch. All seven intended articles produced substantial readable HTML through separate public-web page retrieval. No independent HTTP header or current **Google Index** verdict for these seven has been verified; don't confuse a public reader or indexed-looking content with Search Console eligibility or actual Google inclusion.
- Since #743 now guards properly prerendered index-permitted self-canonical `/blog/:slug` articles on lazy chunk failure, **do not automatically add another blanket fallback or rewrite content** without a verified defect. The previously reported module-import Soft 404 applied to a Phase 1 article, not demonstrated individually for these seven.

## Seven canonical articles — index status and search-intent queue

| Master ID | Original GSC URL path (prefix https://tinystepslearning.com) | Last crawled in original GSC report | Search Analytics impressions Sep 15–Oct 17 | Clicks | Intent / content evidence | Current GOOGLE INDEX |
|---|---|---|---:|---:|---|---|
| C10 | `/blog/grammar-assessment` | 2026-09-07 | 140 | 2 | Parent grammar assessment checklist; actionable home evaluation | **Unknown** |
| C05 | `/blog/how-phonics-grammar-and-communication-work-together` | 2026-09-30 | 83 | 0 | Multi-skill explanation: reading/writing/speaking progression | **Unknown** |
| C25 | `/blog/online-english-classes-for-kids-india` | 2026-05-12 | No exact row | — | Commercial/comparison parent guide for online English classes | **Unknown** |
| C07 | `/blog/what-is-phonics-for-kids` | 2026-09-15 | 9 | 0 | Broad parent introduction to phonics; intent distinct from individual sounds | **Unknown** |
| C08 | `/blog/phonics-r-controlled` | 2026-09-07 | No exact row | — | R-controlled vowel teaching (ar/er/ir/or/ur); avoid intent collision with individual resource guides | **Unknown** |
| C09 | `/blog/phonics-diagnostics` | 2026-09-07 | No exact row | — | Home phonics diagnostic / skills checklist; distinguish from grammar assessment | **Unknown** |
| C21 | `/blog/synthetic-phonics-vs-traditional-reading` | 2026-06-03 | 6 | 0 | Parent reading-method comparison and evidence-based decision guide | **Unknown** |

**Prioritization:** Start with C10 and C05 (largest historical impressions in this group), and C25 (commercial decision guide even though the exact Search Analytics extract returned no row). Then verify C07, C08, C09 and C21. No performance row does **not** imply nonindexing. All seven displayed educational content through the public text reader; review real Googlebot rendering only where indexed-view evidence demands it.

## Two legacy URLs — redirects, NOT indexable targets

| ID | Historical GSC URL | 301 replacement configured in `firebase.json` | Sitemap owner | Disposition |
|---|---|---|---|---|
| C14 | `/blog/how-long-does-it-take-child-to-learn-phonics` | `/blog/how-long-does-phonics-take` | Replacement in `sitemap-blog.xml` | Transfer to P5; verify live HTTP 301 and replacement's current Google Index, **not the old URL** |
| C15 | `/blog/can-child-master-english-in-10-days` | `/blog/can-child-improve-english-in-10-days` | Replacement in `sitemap-blog.xml` | Transfer to P5; verify live HTTP 301 and replacement's current Google Index, **not the old URL** |

Source declarations for both are **`type: 301`** and public reader followed the C15 redirect. Live server response code for the pair still needs explicit HTTP validation. Their original *Crawled – currently not indexed* labels and last-crawl dates remain preserved in the 58-row master. Revised original cohort control totals are **39 possibly indexable pages + 14 301 aliases + 5 XML/RSS = 58**; not all 39 are necessarily currently excluded.

## Per-URL evidence workflow
1. Inspect each **canonical URL's GOOGLE INDEX tab**: "URL is on Google" / current exclusion reason, Google-selected canonical, last crawl and sitemap/referring owner. Record date, screenshot vs owner-reported evidence.
2. If indexed, mark verified with the correct evidence level and **do not** change metadata, content or request indexing merely because a historical report included it.
3. If not indexed, perform **TEST LIVE URL**. View tested page screenshot and More Info resources/console. Intermittent `BlogPostPage` import failures, stale HTML cache headers or 404 error content must be **observed**, not presumed from exclusion.
4. If live eligible and substantive, examine unique search intent, parent usefulness, educational citations, programme conversion and canonical/redirect ownership, then decide whether a single indexing request is appropriate; avoid duplicate requests.
5. Only prepare a separate fix PR for a reproduced issue. Maintain QA on live deployment and recrawl monitoring 7–14 days, without claiming Google indexing is controllable or immediate.

## Phase 2 close conditions
- C05, C07, C08, C09, C10, C21 and C25 each have dated current GSC Google Index outcome or explicitly recorded "unknown" limitation and accountable next action.
- C14 and C15 have been moved to P5 for redirect verification, with canonical replacement checks; no duplicate-content artificial reindexing.
- No SEO copy changes or technical fix PR occurs without positive evidence that one is needed.
