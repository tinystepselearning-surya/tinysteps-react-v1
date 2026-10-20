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

## Initial production network result — 19 Oct 2026 (pilot blocked)

**No live indexability verdict was obtained from this GitHub-hosted runner.** Both pilot executions succeeded as evidence collectors but returned **0/10 readable HTTPS responses**, **10/10 UNKNOWN**, **zero confirmed page technical flags** and **zero Google/Bing indexed verdicts**. Do **not** interpret the CI job's success as a 10-page indexability pass, nor the ten connection failures as ten broken URLs.

[Run #39290188854](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39290188854) recorded for **all ten URLs** `ECONNRESET: Client network socket disconnected before secure TLS connection was established`. HTTPS `/sitemap.xml` and `/ai-resource-index.json` yielded the **same TLS reset**, so sitemap and directory statuses remained unknown. To isolate general connectivity, a control request to `https://example.com/` returned HTTP 200.

[Run #39290485663](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39290485663) additionally observed `https://www.tinystepslearning.com/` **TLS reset**, while `http://tinystepslearning.com/` returned an HTTP **200** to the GitHub runner. **We did not examine that HTTP response's body or intermediary path**, so no redirect/canonical correctness conclusion is established from this contrast. The potential causes are runner egress path, edge/CDN security or TLS routing, not a diagnosed public-site outage.

The previous 168-page E1/E2 HTTPS audit had succeeded from a GitHub Actions runner earlier on October 19. **The inconsistency is meaningful and warrants independent verification**, but does not justify code/robots/canonical changes or indexing requests based on this test alone.

**Next decision gate:** Reproduce two exact speaking course HTTPS pages plus `/robots.txt` and `/sitemap.xml` in an independent browser/network, preserve response status, certificate and headers if available, and check any CDN/Hosting blocking logs. Obtain GSC URL Inspection and Bing indexed-view evidence separately. If independent production/browser tests are healthy, document the GitHub-runner-specific TLS reset without mistaking it for an indexing outage. The two **source-level** AI directory `noindex` alias misclassifications from B1 remain reproducible independently of live connectivity.

## B2 real indexed-view evidence — required from the website owner

For each priority URL, capture GSC **URL Inspection → Indexed result**, plus Google-selected canonical, crawl time, robots/crawl/indexation reason, **Test Live URL** separately, any rendered screenshot and latest Page Indexing category.

Capture Bing Webmaster Tools **URL Inspection or Site Explorer** index status and canonical where available. Those platforms require owner access; the repository and regular HTTP cannot forge their decisions. Export 7/28-day Google query/page impressions with matching date windows, and use the separately verified GSC Generative AI report for AI-feature impressions. **No mass indexing requests.**

## Acceptance and release gate

B2 will be completed only when the scope of top indexed/excluded canonical owners is reconciled with GSC/Bing owner evidence and confirmed high-priority defects are either corrected or explicitly documented as platform pending. **This pilot does not complete B2**; it only establishes what the origin serves now.

B1 is **complete**, merged in [PR #758](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/758). Source-index-policy correction, if warranted by live evidence, belongs in a separate scoped implementation PR, not inside this evidence-only pilot. PRs #754 and #755 remain unmerged and independent; #756 lead health investigation separately blocks nonessential public content releases.


## Follow-up evidence — 21 October 2026 (independent retrieval and connected GSC)

**Scope and provenance.** Read-only external web content retrieval of the exact 10 B2 pilot URLs, and first-party Google Search Console **domain property** \`sc-domain:tinystepslearning.com\` queried through the connected Windsor.ai Search Console integration on 21 October. These are **not** the same probes as the GitHub runner, and the integration's Search Analytics and Sitemaps data are not GSC URL Inspection indexed verdicts. The latest daily Search Analytics rows returned through **18 October**; no complete rows were returned for 19–20 October. Do not backfill those dates as zeros.

### What the independent web retrieval did and did not establish

The external content retriever returned substantive, route-specific public HTML text for **10/10** of the exact B2 pilot URLs, including both Public Speaking course pages, the Phonics comparison page, both historical blog priorities, the grammar and phonics resources, the vocabulary hub and the courses overview. Crawl ages reported by that retriever ranged from today to three days ago, so this is evidence of independent *content retrievability*, **not** a single contemporaneous ten-request origin/header audit or proof that every network reaches them.

The retriever **could not access the \`www\` homepage through its interface**. It declined to parse \`/sitemap.xml\` because it was served as \`application/xml\` (unsupported document format in that retriever); \`/robots.txt\` and \`/ai-resource-index.json\` had retrieval errors. These observations do **not** establish an invalid sitemap, incorrect robots policy, live noindex, TLS certificate status, redirect behavior, or crawler reachability. A separate restricted command-line environment could not resolve external hostnames, so its \`curl\` failures are **not counted as website failures**. The earlier 19 October GitHub TLS resets remain unresolved.

### First-party GSC domain-property Search Analytics — normalized daily comparisons

| Metric | 1–10 Oct (10 days) | 11–18 Oct (8 days) | Interpretation |
|---|---:|---:|---|
| Phonics commercial page, impressions | 556 total; **55.6/day** | 18 total; **2.25/day** | **-95.95%** reported daily average; page-specific exposure collapse began 11 October |
| Whole property, impressions | 58,872 total; **5,887.2/day** | 42,704 total; **5,338/day** | **-9.33%** daily average; materially different scale from the commercial-page decline |
| Phonics commercial page, clicks | 12 | 0 | No reported clicks in the later eight-day period |

Commercial URL: \`https://tinystepslearning.com/best-online-phonics-classes-for-kids-in-india\`.

The per-day commercial page query returned 53, 55, 48, 43, 73, 68, 53, 56, 58 and 49 impressions on 1–10 October; then 1, 1, **no page row** on 13–16 October, 4 on the 17th and 12 on the 18th. The absent page rows are **zero reported impressions in this retrieved result**, not a proof of exclusion or a claim of impossible visits. Query dimension coverage may be anonymized; do not sum query rows as a full-page census. The named brand query \`tiny steps learning\` had 206 reported page/query impressions in 1–10 October but four in 11–18 October. Most previously visible nonbrand query rows also did not appear in the later results; the retrieved query table is not a complete crawl/index diagnostic.

The exact B2 pilot cohort produced **eight** Search Analytics page rows across 1–18 October: the two Public Speaking course pages (2 and 4 impressions respectively), the commercial Phonics page, the Confidence Building page, Grammar Assessment, Simple Past Tense, Vocabulary Hub and \`/courses\`. The absence of returned page rows for \`/blog/online-phonics-classes-vs-school\` and \`/resources/phonics/magic-e-phonics\` is **unknown indexing status, not proof of noindex/deindexing**. Positive search impressions show past visibility for the source URL, not Google's currently selected canonical/index state.

### First-party GSC sitemap metadata retrieved 21 October

- \`https://tinystepslearning.com/sitemap.xml\`: last submitted 20 October 19:59:37 UTC, last downloaded 20 October 19:59:38 UTC; **260 submitted**, **0 errors**, **0 warnings**; identified as a sitemap index.
- \`https://tinystepslearning.com/sitemap-blog.xml\`: last submitted 20 October 19:59:05 UTC, last downloaded 20 October 19:59:07 UTC; **83 submitted**, **0 errors**, **0 warnings**.
- Excluded one malformed/empty connector row with null sitemap URL. These are submission metadata, **not** URL-level indexed totals or certification that all listed resources are accessible.

### Decision and pending checks

**No code/SEO/deployment change warranted from these observations alone.** The urgent issue is to understand the Phonics page's large *page-specific* exposure loss, rather than assume all 279 pages were deindexed or that the generated Public Speaking directory classifications caused live \`noindex\`.

1. Owner-access **GSC URL Inspection indexed view**, live test, Google-selected canonical, last crawl and Page Indexing reason for the commercial Phonics page first, then the two Public Speaking course pages and other #747 priorities.
2. Obtain authoritative served HTTP code, X-Robots-Tag, meta robots, canonical, XML membership and certificate/redirect status from an independent fully networked diagnostic environment; retest \`www\` and runner TLS failures.
3. Review page-and-query change points, Google Search Appearance and deployments around 11 October before proposing a scoped fix. Check whether visibility transferred to another canonical route; never infer the cause from impression counts alone.
4. Collect Bing URL inspection/indexed-view separately; the Windsor.ai connection currently exposed GSC Search Analytics and Sitemaps fields, **not** Google URL Inspection or Bing indexed verdicts.

**B2 stays IN PROGRESS.** Keep PR #759 draft as an evidence-only collector until these acceptance checks are met. No mass reindexing or canonical/robots changes.


### Related owner and search-intent crosscheck (same GSC property and dates)

Normalized impressions/day for the main \`/phonics\` programme were **87.0 before** and **84.6 after** (approximately **-2.7%**). The separate \`/phonics-fees-india\` owner had **28.9/day before** and **30.1/day after** (approximately **+4.2%**). Thus the comparison-page decline (55.6/day to 2.25/day) is not matched by those adjacent phonics owners.

For four exact “best online phonics classes” queries, the Google Search Console \`query + page\` report included the comparison page before 11 October but showed only a few later impressions mapped to \`/phonics\`; the 11–18 October records did **not** contain comparison-page rows for those four queries. Query coverage is limited by GSC privacy and reporting thresholds. This is a **hypothesis of search-result owner selection/intent shift**, **not** evidence of a Google-selected canonical change, deindexing or a proven cause. Inspect the affected URL's indexed canonical and changes in search appearance before changing either commercial page.


## Live CI recovery and actual header evidence — 21 October 2026

The newest B2 GitHub workflow [run #39492956864](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39492956864) completed successfully using head commit \`645f2dfc930d75e7afbbedcd2415b4c662879bc9\` (observation at **20 October 2026 20:33:54 UTC**, i.e. **21 October IST**). It confirms that the 19 October GitHub-runner TLS failure was **not reproduced** on this later run. B1 baseline [run #39492956882](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39492956882) also passed after these read-only changes.

**Actual first-party HTTP/HTML findings from the read-only Node pilot:**
- All **10/10** target HTTPS URLs returned **HTTP 200**, exactly **one self-referencing canonical**, an index-permitting robots meta tag, no \`X-Robots-Tag: noindex\`, substantive HTML, and membership in the fetched live XML sitemaps; \`sitemapReady=true\` and generated \`ai-resource-index.json\` loaded/parsed.
- **8/10** were \`LIVE_INDEXABILITY_ELIGIBLE\` in the script's limited HTTP/HTML terminology, with no technical flags.
- The other **2/10**, \`/courses/public-speaking-foundations\` and \`/courses/public-speaking-excellence\`, also had actual **HTTP 200**, self canonicals, live \`robots: index,follow\`, no X-Robots restriction and sitemap membership; their **only flagged discrepancy** was \`indexing_state=noindex\` in the generated AI resource directory. The live pages were **not** observed serving noindex.
- Verified separate \`curl\` GET client: apex HTTP 200; HTTPS \`www\` redirected to apex and landed HTTP 200; HTTP apex redirected to HTTPS apex and landed HTTP 200; \`robots.txt\`, \`sitemap.xml\`, \`ai-resource-index.json\`, both speaking courses and the commercial Phonics page all landed **HTTP 200**, with \`verify_ssl=0\` and remote IP \`199.36.158.100\` for this runner/path. These checks validate TLS for this client, **not all networks, verified search-bot traffic or global DNS convergence**.

**Revised gate:** The original origin-TLS-blocked portion of B2 is now **resolved for the current GitHub runner**. The source-level AI-directory alias misclassification is independently corroborated against actual live course-route indexability and merits a **separate narrowly scoped generator/test fix proposal**; it is not proof of missing Google index inclusion and is not a plausible established cause of the commercial Phonics URL's 11 October impressions decline.

**Still pending:** GSC URL Inspection indexed results / Google-selected canonical for priority URLs; Bing indexed results; root-cause determination for the commercial-page query-exposure collapse. No code fix, indexing request, deployment or merge was made by this evidence-only CI. PR #759 remains draft and B2 remains in progress.
