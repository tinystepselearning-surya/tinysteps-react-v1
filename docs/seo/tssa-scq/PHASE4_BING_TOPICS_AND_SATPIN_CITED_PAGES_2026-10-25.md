# TSSA-SCQ Phase 4 — Bing Topics Portfolio opportunities and verified SATPIN cited pages

**25 October 2026 | Owner-supplied six Bing AI Performance CSV exports | Evidence-only; no public website/SEO changes**

## Bottom line

These exports finally provide **page-level Bing AI citation evidence for two specific Tiny Steps articles** and new **market-level queries Tiny Steps was not cited for**, but they do not provide comprehensive URL identity for all 13,782 most-recent-period site citations. Preserve the cited pages and inspect closely related unmet topics without assuming the cited page caused rankings, clicks, or enrolments.

## What each uploaded file can and cannot establish

| Export | Rows | Reliable meaning | Restrictions |
| --- | ---: | --- | --- |
| `AIPageStatsReport (3).csv` | 2 | Two cited URLs and counts: SATPIN Guide **375**, SATPIN Launch **21** | No recorded page/query filter or date range; do not assign this split to a particular grounding query |
| `AIPageStatsReport (2).csv` | 2 | Same URLs with **314** Guide and **234** Launch citations | A separate filtered view; cannot infer a change over time or sum with the other file |
| `AISearchQueriesReport (1).csv` | 8 | Filtered grounding-query counts, total **900** over the eight rows | All `Citation Share` values are **0.00%**, contrasting with the previous unfiltered query report; treat zero-share as a reporting/filter artifact or unknown, **not** proof of absent citations |
| `AIPerformanceFilteredOverviewStats.csv` | 46 dated rows | **1,139** summed citations across 26 Jul–23 Oct reporting dates | Selected filters and zero/missing days not stated; different denominator from sitewide 21,422; never combine |
| `AITopicsOverallPortfolio (2).csv` | 10 topic rows | Theme-level ecosystem citation-size, query-count, and cited-site-count **ranges** | Not Tiny Steps citations, traffic, or market share |
| `AITopicsTopOpportunityQueries.csv` | 50 opportunity query rows | Approximate competitor/all-site citation ranges for queries where other sites have citations and Tiny Steps does not, under the dashboard's selected scope | Not Tiny Steps's citations or exact user prompts; category labels noisy, time window absent |

## Verified SATPIN page recipients

- Main guide `https://tinystepslearning.com/blog/satpin-phonics-guide` has **375** citations in page export A and **314** in page export B.
- Launch guide `https://tinystepslearning.com/blog/phonics-satpin-launch` has **21** in export A and **234** in export B.
- These numbers refer to **separately filtered datasets** whose UI filters are missing from the CSV filenames/header. They **cannot** be added for a sitewide total, classified as later/earlier, or assigned to `satpin` versus `satpin phonics` without filter evidence.
- The prior unfiltered Bing grounding query `satpin phonics` had **548** cited source appearances, and 314+234=548 in one page export. This numerical agreement is interesting but **does not verify the filter identity** or remove Bing's sampling caveats.
- Both URLs are previously known canonical indexed-intended blog entries; retain their distinct educational/launch content, no automatic redirect or canonical consolidation.

## Filtered SATPIN-related grounding queries (not page-attributed)

| Grounding phrase | Filtered citations | Topic classification | Review |
| --- | ---: | --- | --- |
| `satpin` | 375 | Postal Codes & Area Codes | Classification likely inappropriate in context; avoid interpreting as postal demand |
| `satpin phonics` | 314 | Education | Highly relevant |
| `phonics satpin` | 100 | K-12 Education | Relevant |
| `satpin blending` | 44 | Education | Relevant |
| `satpin order` | 26 | Order Management | Likely classification false positive; do not build order management page |
| `blending satpin words` | 20 | Education | Relevant |
| `what is satpin` | 15 | Education | Relevant |
| `satpin words` | 6 | Education | Relevant |

The eight query counts sum to 900 **within this filtered report only**. Their listed 0.00% Citation Share conflicts with positive counts and previously exported nonzero values, so **do not use filtered Citation Share for prioritisation**; retain the original unfiltered query-share report with its date/scope caution.

## Topics Portfolio — do not mistake market sizes for our visibility

Microsoft's official 13 Oct 2026 Topics Portfolio release defines `Topic Size` as **approximate citations across all sites**, `Queries` as the number of distinct grounding queries across the topic, and `Sites Cited` as the count of sites appearing. Our site has meaningful presence in the listed topic families, but these numbers are **ecosystem ranges**.

Topics include Education (1B–5B ecosystem citation range), Grammar & Language Structure (100M–500M), K–12 Education (100M–500M), Language Courses & Tutoring (50M–100M), Public Speaking & Presentations (10M–50M), and Pronunciation & Phonetics (100M–500M). These are NOT impressions, inquiries, total Tiny Steps citations, or addressable market estimates.

**Top Opportunity Queries** are queries on which **other sites were cited but Tiny Steps was not**, not 'Tiny Steps top citations'. All 50 opportunity phrases have **zero exact casefolded matches** among the 168 grounding phrases in the earlier unfiltered site-citation export. This consistency check supports (but does not independently prove) the 'uncited opportunities' interpretation. The 50 rows contain many irrelevant adults' or non-English learning queries (Chinese, Mandarin, Spanish, generic language platforms), video games, and poor ML taxonomies; do not optimise for those merely because the ecosystem range is large.

### Prioritised, existing-content-first opportunity groups

| Priority | Grounding opportunity | Ecosystem citations range | Investigate existing owner |
| --- | --- | --- | --- |
| P0 | `spoken english classes` | 1K–5K | `/spoken-english-classes-for-kids-online` |
| P0 | `spoken english classes online` | 101–500 | `/spoken-english-classes-for-kids-online` |
| P0 | `online spoken english classes` | 101–500 | `/spoken-english-classes-for-kids-online` |
| P0 | `public speaking for kids` | 1K–5K | `/speaking` |
| P0 | `phonics reading` | 1K–5K | `/phonics`, `/resources/phonics` and existing reading guides |
| P1 | `learn to read` | 1K–5K | `/reading-classes-for-kids` and parent reading guides; generic search intent |
| P1 | `phonetic sounds` | 500–1K | `/blog/what-is-phonics-for-kids` and focussed letter-sound resources; generic linguistics ambiguity |
| P1 | `learning public speaking for kids` | 51–100 | `/speaking` and public-speaking tutorials |

These are **opportunity hypotheses**, not guaranteed AI citations on completion. Do not infer Google Search keyword ranking or Bing click-through from them.

## Practical Phase 4 actions

1. Mark **two SATPIN cited URLs verified**; keep broader per-page Bing visibility open. Capture the dashboard's exact selected date range and filter used for each page report before interpreting the splits.
2. For priority opportunity queries, compare what an answer needs to provide against the **existing** phonics/reading, Spoken English and Public Speaking owners. Check actual educational accuracy, independent response examples, and honest 1:1 programme scope; do not add generic platform/app comparisons merely for larger citation ranges.
3. User's filtered AI report with 46 daily rows should be treated as a **filtered series of unknown query selection**, not a new sitewide trend or a contradiction of the domain-wide overview.
4. Retain separate Google Search Console click/CTR evidence, Bing AI citation evidence and validated GA4 completed lead events. Neither provider's visibility automatically means enrolments.
5. Only change production pages after a reproducible problem is identified and scoped PR passes normal content/SEO CI gates. Protect existing SATPIN cited articles and canonical URLs.

**References:** Microsoft [Topics Portfolio Beta, 13 October 2026](https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/) and [AI Performance help](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c).

