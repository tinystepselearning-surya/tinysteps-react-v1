# TSSA-SCQ Phase 4 — Bing AI citation trend and Google landing-page performance

**Evidence date: 25 October 2026 | Read-only observations | No URL/content/SEO or deployment changes**

## Sources and methodology

- Owner-uploaded `tinystepslearning.com_AIPerformanceOverviewStats_10_25_2026.csv`, with **91 complete daily records, 25 July–23 October 2026**, fields `Date`, `Citations`, `Cited Pages`.
- Owner-uploaded `download (11).csv`, **Google Analytics 4 → Search Console linked 'Google organic search traffic: Landing page + query string'**, 27 September–24 October 2026. It includes Search Console page metrics and GA4 on-site metrics in the same report, but their grains must be kept distinct.
- **Privacy:** uploaded GA4 data includes non-public app route/query parameter details. Do **not** commit the raw CSV, URLs containing identifiers, or per-user query strings to this public-facing project. This file contains **aggregates only**.
- Bing definition (Microsoft official): https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/ . **Citations** = source appearances in supported AI generated answers; **Cited Pages** = unique cited site pages **per day**, not deduplicated unique pages across dates or a ranking metric.
- GA4/Search Console integration: https://support.google.com/analytics/answer/13682863 . Key events are **configured GA4 events**, not necessarily parent enquiries. Landing page is the first pageview in a session. Do not divide GA4 key-event counts by Search Console clicks to fabricate a 'lead conversion rate'.
- Search Console query privacy: https://developers.google.com/search/blog/2022/10/performance-data-deep-dive . Query-row sums can be below page/site totals due to anonymous queries and row restrictions; the earlier Google query-only CSV with 3,008 clicks and 58,750 impressions is not the same denominator as the **6,506 / 171,495** page-level aggregate.

## Bing AI Performance — time series

| Comparable period (28 days) | Citations summed | Avg citations/day | Avg distinct cited pages/day |
| --- | ---: | ---: | ---: |
| 29 Aug–25 Sep 2026 | 5,878 | 209.9 | 20.6 |
| **26 Sep–23 Oct 2026** | **13,782** | **492.2** | **39.4** |

- Citations grew **134.5%** on the equal-length periods. Average daily cited-page breadth grew **91.3%** (20.61 to 39.43). These are *AI visibility activity* gains, not proven growth in traffic, conversions, authority or citations by ChatGPT/Gemini.
- Short-term momentum: **10–16 Oct 3,852** versus **17–23 Oct 3,880**, only **+0.7%**. Avg daily cited-page breadth decreased **43.4 → 41.1**. The citation level remains high, but recent weeks suggest a **plateau/volatility**, not continual acceleration.
- Across 91 daily rows: **21,422 citation appearances**. This is a sum of daily source appearances (not 21,422 distinct questions or users). Daily cited pages **must not** be summed to infer unique page count over 91 days.
- Example high day **21 Oct: 838 citations, 49 cited pages**. No evidence in these files associates changes with a specific production release or Google ranking algorithm.

### Weekly citation history (seven-day bins, Sat–Fri)

| Week | Citations | Avg cited pages/day |
| --- | ---: | ---: |
| Jul 25–31 | 159 | 4.1 |
| Aug 1–7 | 164 | 4.7 |
| Aug 8–14 | 410 | 10.3 |
| Aug 15–21 | 408 | 10.0 |
| Aug 22–28 | 621 | 11.6 |
| Aug 29–Sep 4 | 830 | 17.7 |
| Sep 5–11 | 1,238 | 17.3 |
| Sep 12–18 | 1,716 | 20.7 |
| Sep 19–25 | 2,094 | 26.7 |
| Sep 26–Oct 2 | 2,874 | 36.0 |
| Oct 3–9 | 3,176 | 37.1 |
| Oct 10–16 | 3,852 | 43.4 |
| Oct 17–23 | 3,880 | 41.1 |

## Google organic landing pages — full report aggregate

- Grand total **6,506 Search Console clicks / 171,495 impressions** (3.7937% CTR), with **4,742 GA4 active users / 6,750 GA4 engaged sessions / 156 configured GA4 key events**. Metrics measure different interactions and **must not** be combined as a single acquisition funnel without validated attribution.
- `/free-letter-tracing-game-for-kids`: **2,877 search clicks, 39,657 impressions** (44.2% of site search clicks); **4 aggregated GA4 key events** across stripped-query variants.
- Homepage `/`: **1,638 search clicks / 4,136 impressions**; **63 aggregated key events** across variants.
- Together those two URLs deliver **69.4% of reported Google search clicks**, emphasizing the difference between free learning activity, brand navigation and paid programme discovery.
- `/phonics`: **69 search clicks / 3,056 impressions / 2.26% CTR**, 14 GA4 key events on bare path and 15 on the `?book=1` variant (**29** grouped by stripping query strings). These are not 29 proven paid leads, nor 29 leads attributable to 69 organic search clicks.
- `/speaking`: **57 / 2,019 / 2.82%**, **11 aggregated** GA4 key events across bare and booking-query variants.
- `/best-online-phonics-classes-for-kids-in-india`: **18 / 972 / 1.85%**, **7 aggregated** key events.
- `/spoken-english-classes-for-kids-online`: **2 / 242 / 0.83%**, **0** GA4 key events; this is a high-priority *discovery* check but has small clicks and broad-query ownership overlap from separately verified GSC query→page evidence.
- `/online-english-classes-hyderabad`: **28 / 997**, **8** aggregated GA4 key events.
- `/online-english-classes-for-kids`: **21 / 713**, **7** aggregated key events.
- `/grammar`: **7 / 339**, **5** aggregated key events.
- The full GA4-linked export contains **465 path/query variants** representing **246 base paths**. **236 rows contain a query string**. **45 of 156 key events** occur on rows with **zero Search Console impressions and clicks**; these GA4 events cannot be labeled Google organic conversions from this report alone.
- Some landing URL strings contain app-only/internal navigation parameters. Aggregate and redact before sharing with any external research or tracking repository.

## Decision implications for TSSA-SCQ

**P0 — Preserve successful educational citation sources.** Bing breadth and citation rate rose sharply; this report still has *no per-URL identity*. No blanket rewrite or canonical change justified.

**P0 — Fix attribution definitions before lead-gen conclusions.** Read GA4 configured key-event names, source/medium, landing page, and completed demo/lead event counts. Verify whether `?book=1` is a modal/route flag, not a booking-completion event. Count actual enquiries from their completion action, not booking intent.

**P1 — Commercial programme conversion / click-through.** Existing `/phonics` receives commercial query impressions on the correct URL (prior first-party GSC query→page evidence #784) but low clicks. Distinguish mobile SERP competition and snippet attraction from actual click-to-enquiry conversion, using *matched* attribution cohorts.

**P1 — Bing cited-page ownership.** The **AI Performance Overview Stats file has no page URLs**. Still request Bing Webmaster Tools → AI Performance → **Cited Pages** export and grounding query→pages mapping with the chosen date window. This is needed before asserting which URL gained or lost citations.

**P2 — Comparable monitoring.** Week-on-week Bing citations and avg cited-page breadth, Google non-brand commercial impressions/clicks/CTR, and validated organic completed demo leads. Avoid conflating surface metrics across different providers.

## Engineering and release status

These are external provider observations and aggregate analytics. **No technical indexing issue, page content defect, AI citation causality, or deployment regression is established**. Keep website-change PR #782 and #783 separately reviewed. No new SEO pages, redirects, schema edits, or title tests authorized by this evidence alone.

