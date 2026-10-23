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


## Owner-verified GSC indexed results — 22 October 2026

**Evidence provenance:** Website owner provided screenshots from **Google Search Console URL Inspection** for two exact URLs, showing separate **Google Index** (indexed verdict) and **Live Test** (current eligibility) tabs. These are authoritative first-party owner-visible inspection observations at the shown times, unlike the earlier Search Analytics proxy or CI HTTP tests. The screenshots were presented in the TSSA-7 project conversation, not uploaded to GitHub. Do not infer fields that are outside the captured screen.

| URL | Google Index result | Live test | Googlebot last crawl | Crawl/fetch/indexing | Google-selected canonical |
|---|---|---|---|---|---|
| `https://tinystepslearning.com/phonics` | **URL is on Google; Page is indexed** | **URL available to Google** (tested 22 Oct 2026, 22:22 IST) | **21 Oct 2026, 13:46:21** shown in GSC | Googlebot smartphone; crawl allowed **Yes**; fetch **Successful**; indexing allowed **Yes** | **Inspected URL**, i.e. `/phonics`, confirmed in screenshot |
| `https://tinystepslearning.com/best-online-phonics-classes-for-kids-in-india` | **URL is on Google; Page is indexed** | **URL available to Google** (tested 22 Oct 2026, 22:28 IST) | **22 Oct 2026, 19:11:42** shown in GSC | Googlebot smartphone; crawl allowed **Yes**; fetch **Successful**; indexing allowed **Yes** | **NOT SHOWN** in screenshots; retain **unverified** until Google Index panel canonical rows are captured |

Both owner inspections show HTTPS and one valid Breadcrumb enhancement. Both show **`Sitemaps: Temporary processing error`** in the Discovery section; this is a surfaced per-URL GSC diagnostic requiring follow-up if persistent, **not proof that the XML sitemap fails or that either URL is excluded** (both are separately confirmed indexed). GSC earlier reported `/sitemap.xml` and `/sitemap-blog.xml` downloaded with zero errors/warnings. For the commercial URL, GSC listed referring pages `/blog/how-to-choose-phonics-classes` and `/best-online-phonics-classes-india`; this is a discovery signal, not an exhaustive backlink report. No indexing request was made by this audit.

**Refreshed connected Search Analytics through 20 October:** The commercial page received **556 impressions / 12 clicks during 1–10 Oct** (55.6 impressions/day), versus **80 impressions / 1 click during 11–20 Oct** (8 impressions/day), a **-85.61%** impressions/day period comparison. After the initial collapse, daily impressions recovered from 12 (18 Oct) to **23 (19 Oct) and 39 (20 Oct)**, but still trail the previous 55.6/day baseline. The connector did not return 21 Oct rows at this refresh; this is **reporting availability**, not a zero on 21 Oct. The URL remains indexed in GSC, so the ranking/query-exposure loss is **not explained by the URL being unindexed at the screenshot observation time**. October 11–16 historical crawl/index history and precise ranking cause remain unknown. Google-selected canonical for the commercial page remains unverified; do not equate the "URL is on Google" verdict with canonical confirmation.

**Next B2 decision:** Preserve the existing `/phonics` indexable canonical and the commercial page's current indexable configuration. Investigate the specific high-value queries and page/query distributions, competitors and potential ranking/intent selection changes before changing content, canonicals, redirects, robots or issuing reindexing requests. Separately fix the two confirmed Public Speaking **generated AI directory** alias `noindex` classifications in a tightly scoped, regression-tested generator PR after checking all existing canonical ownership rules. Continue owner GSC priority URLs and Bing inspection. **B2 remains in progress**; no production implementation change in this evidence-only PR.


## Query-owner comparison after owner GSC inspection — 22 October 2026

**Source:** Connected first-party GSC Search Analytics domain property, `date + page + query` dimension, refreshed through **20 October** (1–10 October vs 11–20 October, equal 10-day windows). Google privacy-filtered query-level data are **not** exhaustive page totals; never sum the visible query rows and claim they represent all impressions. Neither these query impressions nor search rankings prove why Google showed one owner instead of another.

| Exact query | `/phonics` 1–10 → 11–20 Oct impressions | Comparison URL 1–10 → 11–20 Oct impressions |
|---|---:|---:|
| `online phonics classes for kids` | **7 → 23** | **6 → 2** |
| `online phonics classes` | **6 → 24** | **4 → 3** |
| `best online phonics classes for kids in india` | **2 → 6** | **12 → 2** |
| `best online phonics classes in india` | **2 → 2** | **7 → 0** returned |
| `tiny steps learning` | **453 → 311** | **206 → 21** |

**Interpretation:** The core `/phonics` owner gained reported exposure on important generic phonics terms while the separate comparison page lost branded and some specific long-tail exposure. This makes a broad `/phonics` or sitewide phonics indexing failure **unlikely** and raises a **candidate query-ownership / search-intent shift**. The comparison page is confirmed in Google's index in the owner's 22 Oct screenshots and recovered to 39 daily impressions on 20 Oct, so **no canonical, redirect, robots, page rewrite, or mass indexing intervention is justified from these rows**. Continue B2 with the missing *Google-selected canonical* indexed-panel row for the comparison page, quality/intent and internal link review, and Bing inspection. Note: the commercial page's full page-dimension count 556 → 80 is larger than its query-row totals due to GSC aggregation/privacy, not a data discrepancy to solve by summing query rows.


## User-supplied Bing AI Performance and Clarity exports — 22 October 2026

**Evidence provenance and confidentiality.** User uploaded two CSVs to the TSSA-7 project conversation on 22 Oct 2026: `tinystepslearning.com_AIPerformanceOverviewStats_10_22_2026.csv` and `Clarity_Tiny_Steps_URL performance_10-22-2026 22 57.csv`. This section records **aggregated derived metrics**, not raw content or authenticated URLs. The originals remain conversation attachments. No authenticated URL/path IDs or user/staff identifiers from Clarity are reproduced in GitHub. This is a read-only analysis with no application changes.

### Bing Webmaster AI Performance — aggregate citations, not organic clicks

The AI Performance export contains **90 consecutive dated daily rows** from **22 Jul to 19 Oct 2026**, with no duplicate dates or missing cells, fields `Date`, `Citations`, `Cited Pages`. Those metrics match Microsoft's Bing Webmaster Tools *AI Performance* definitions. They reflect visible references to the site in supported Microsoft Copilot, AI-generated Bing search summaries and supported partner AI experiences. They **do not verify ChatGPT/Gemini citations, impressions, search rankings, clickthrough, leads, or conversions**. Data is aggregated/sampled by the provider; do not claim complete response-level coverage or causal attribution.

| Period | Days | Reported citations | Citations/day | Daily cited pages avg (NOT unique across full period) |
|---|---:|---:|---:|---:|
| 22–31 Jul | 10 | 210 | 21.0 | 4.9 |
| August | 31 | 1,824 | 58.8 | 9.5 |
| September | 30 | 7,532 | 251.1 | 23.7 |
| 1–19 October | 19 | 9,526 | 501.4 | 39.7 |
| **All exported dates** | **90** | **19,092** | **212.1** | **20.1** |

The file ends on **19 October** despite its 22 October export filename; there are no 20–22 October observations to interpret. In the Google comparison-page collapse period, **1–10 Oct** Bing AI citations averaged **448.1/day** and **11–19 Oct** averaged **560.6/day** (+25.1% vs the preceding average), suggesting Microsoft's AI citation activity did **not** collapse in parallel with that single Google's commercial Phonics page. This is a **cross-platform aggregate comparison**, *not proof of transferred traffic, a ranking cause, or that phonics content specifically gained AI citations*. The 90-day overall total is the sum of citation counts; **never sum cited-pages daily counts as unique site URLs**.

Official provider definition: https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c ; provider explicitly warns reports are aggregate representative samples and citations do not equal clicks or ranking.

**Next B6 evidence to request/inspect:** dated Bing AI Performance exports for *Pages* (specific canonical cited URLs), *Grounding Queries* (topic phrases, not verbatim user prompts), and available query→page mapping, with date window 1–10 vs 11–19 Oct. This is essential to determine whether `/phonics`, the commercial phonics page, or the Speaking course pages drive citations. Do not credit any one URL with these sitewide counts.

### Microsoft Clarity URL Performance — selected 20-row export

The separate Clarity report header declares period **23 Sep–22 Oct 2026**, with **20 reported URL rows**, sorted in descending performance score (**90–95**, average **92.33**). Only **17** rows are publicly accessible-style routes; **3** are authenticated Teacher/Founder/Admin app routes; their exact IDs are withheld in this report. The columns are Clarity `Score`, `LCP` in **seconds**, `INP` in **milliseconds**, `CLS` unitless; the latter three are performance measurements, not user acquisition/engagement, traffic or Google indexing verdicts.

Using official good thresholds (LCP ≤2.5 sec, INP ≤200 ms, CLS ≤0.1): **19/20** LCP good, **19/20** INP good, **20/20** CLS good, **18/20** good across all three. The two minor exceptions:
- Public blog `/blog/phonics-blending-activities`: **LCP 2.788 s**, needs improvement; other shown vitals good.
- Public blog `/blog/long-vowel-sounds-for-kids`: **INP 208 ms**, just above good; other shown vitals good.

These 20 selected URLs are **not a representative sitewide speed audit**, particularly because they are score-ordered and do **not include either** `/phonics` or `/best-online-phonics-classes-for-kids-in-india`. Thus this export cannot diagnose those two URLs' actual page experience or Google's October 11 impressions drop. Treat private URL capture by Clarity as a separate **privacy/masking/settings review** only if investigating parent/teacher session recordings; the export's presence alone is not evidence of a sensitive-data leak.

Official metric definitions: https://learn.microsoft.com/en-us/clarity/insights/performance-widget and https://developers.google.com/search/docs/appearance/core-web-vitals .

### TSSA-7 interpretation

**Verified:** AI citations increased month over month in Microsoft's supported experiences; 18/20 selected Clarity URL rows meet three good-vitals thresholds; the commercial Phonics page is owner-confirmed *indexed* on 22 Oct and started impression recovery by 20 Oct.

**Not verified:** AI citations for any individual Tiny Steps course/blog/Phonics URL, representation in ChatGPT or Gemini, conversion from AI citation to leads, user acquisition source, sitewide Core Web Vitals, 20–22 Oct AI citation activity, any direct cause linking the two independent trends.

**No Phonics site changes or reindex requests authorized from these exports.** B2 indexed-canonical verification remains outstanding for the comparison page; B6 AI query→page ownership is now a particularly useful follow-up.


## GA4 organic, AI-referral and lead-measurement evidence — 23 October 2026

**Scope/provenance.** The owner uploaded six CSV exports dated **25 Sep–22 Oct 2026** from Google Analytics 4 for property `tinysteps-react-v1`: Traffic acquisition (session channel group), User acquisition (first-user channel group), Search Console-linked Google organic landing pages, Search Console-linked Queries, session manual source, and Pages/screens by page title. This is **NOT** a Bing AI Performance Pages or Grounding Queries export. Only aggregated business-safe information is reproduced here, not user identifiers, session recordings, app-private paths, or raw query lists. Data is a **single aggregate 28-day window**, so it **cannot test an Oct 11 change point**.

### Traffic channels and ChatGPT-attributed visits

| Exported session channel | Sessions | Engaged sessions | Key events | Session key event rate |
|---|---:|---:|---:|---:|
| Organic Search | 10,398 | 7,799 | 178 | **1.40%** |
| Direct | 5,324 | 3,255 | 71 | 1.07% |
| AI Assistant | **882** | **647** | **64** | **6.01%** |
| Referral | 431 | 330 | 5 | 0.70% |
| Unassigned | 415 | 223 | 4 | 0.96% |
| Organic Social | 308 | 192 | 0 | 0% |
| Organic Video | 1 | 0 | 0 | 0% |
| **GA4 grand total (unique session estimate)** | **17,636** | **12,427** | **322** | 1.49% |

**Important nonadditivity finding:** Sum of channel Sessions rows is **17,759**, exceeding the displayed GA4 grand total **17,636** by 123 (~0.7%); sum of manual source Sessions rows is **17,808** (172 more than total). Do not present channel session shares as perfectly additive or assert the cause; the exports do not contain session IDs, privacy thresholds or implementation settings to diagnose this. Key-event rows in the channel export DO reconcile to 322. AI channel is approximately **5% of total reported sessions** but **19.9% of key-event counts**. Its session key-event rate is **~4.28×** Organic Search (6.01% vs 1.40%). These rates are **NOT lead or enquiry conversion rates** until key-event names and qualification status are verified.

The distinct *Session manual source* export reports `chatgpt.com` = **873 sessions**, **640 engaged sessions**, **64 key events**, representing almost all of the 882 AI Assistant channel sessions by magnitude. Google's default AI Assistant channel includes ChatGPT, Gemini, Copilot etc. and excludes Google AI Overview/Mode; a source named `chatgpt.com` is referral/attribution **not proof that the site was cited by a specific model response, intent, or query**. Internal-sounding session sources such as `floating_assistant_dock`, `public_assessment_modal`, and `homepage_hero_assessment` also occur: audit internal link UTM-source design to ensure navigation is not polluting acquisition/source attribution. The observed source strings alone do not prove implementation misuse.

**Primary lead-quality audit gate:** GA4 reports **322 key-event occurrences** across all channels, but the extracts **do not identify event names**, distinguish actual demo/assessment submissions, deduplicate requests, or validate against Firestore/CRM lead records. Zero recognized revenue is reported. **Never count those 322 as 322 leads or the 64 AI-source key events as 64 bookings.** Reconcile `Reports → Engagement → Events/Key events` (event name + key-event setting + source) with confirmed persisted enquiry records and lead-health Issue #756 before making ROI claims.

Official channel-group/metric definitions:
- https://support.google.com/analytics/answer/9756891 (AI Assistant channel)
- https://support.google.com/analytics/table/13948007 (session key event rate)
- https://support.google.com/analytics/answer/12922540 (key event and user metrics)

### Google organic landing and query data, same 28-day period

Search Console-linked *Google organic landing page* report: **6,424 reported search clicks**, **164,180 impressions** across **466 listed landing rows**. The separate *Queries* export lists **4,132 search phrases**, **2,992 clicks**, **56,496 impressions** in its displayed total. The query report includes **only 46.6% of landing-report clicks and 34.4% of impressions**, so query-only data is **not a census**. GSC query-level anonymization and row limiting materially affect inferences. Do not sum query rows and equate them to whole-site organic traffic. The linked landing export mixes Search Console clicks/impressions with GA4 engagement/key-event columns; do not causally treat a page's key events as conversions from its displayed GSC clicks.

| Landing URL | Search clicks | Search impressions | GSC CTR | Observed avg position |
|---|---:|---:|---:|---:|
| `/free-letter-tracing-game-for-kids` | **2,859** | 38,858 | 7.36% | 6.17 |
| `/` | **1,635** | 4,137 | 39.52% | 3.40 |
| `/phonics` | **74** | 3,187 | 2.32% | 5.13 |
| `/speaking` | **56** | 1,937 | 2.89% | 8.86 |
| `/best-online-phonics-classes-for-kids-in-india` | **21** | **1,024** | 2.05% | 7.52 |
| `/resources/grammar/verbs-for-kids` | **25** | **4,221** | 0.59% | 7.40 |

The tracing game alone accounts for **44.5% of the landing report's reported Google clicks**; together the game and homepage account for **70.0%**. The Pages/screens report independently lists **73,723 of 130,072 views** (56.7%) under the main tracing-game page title. This is **large information/tool engagement**, not automatically high-intent class enquiries. The commercial phonics comparison page has real search exposure and owner-verified GSC indexing, but only 21 linked-report clicks in the 28-day window; inspect its query-specific SERP CTR/intent rather than reindex or merge it.

**Potential strategic opportunities requiring separate query/quality checks:** 
- The free-letter-tracing tool can make age-appropriate, unobtrusive pathways to `/phonics`, `/courses` and assessment content for visitors who express intent; preserve free educational utility and avoid intrusive prompts.
- High-impression grammar explanations (e.g. verbs-for-kids) and targeted commercial phonics queries may merit snippet/intent review, not a blanket rewrite.
- Example query rows: `phonics classes` **364 impressions / 3 clicks / avg position 6.9**; `online phonics classes` **77 / 0 / 11.5**; `online phonics classes for kids` **68 / 1 / 15.4**. Queries are standalone GSC dimensions and not linked to a landing URL in this exported table.

**Decisions / next evidence:** B2 Google commercial canonical still unverified (not visible in owner's screenshot); Google page indexed YES. B3 target real parent intents and educational-to-commercial handoff, without collapsing phonics and reading. B6 corroborate referral sessions with native, date-stamped Bing **AI Pages / Grounding Queries** exports and available ChatGPT/Gemini native citations before declaring cross-model market visibility. Lead-health #756: obtain event-name-level key-event and confirmed submission evidence; check internal campaign source attribution. **No production SEO changes or premature AI ranking claims from these aggregate CSVs.**
