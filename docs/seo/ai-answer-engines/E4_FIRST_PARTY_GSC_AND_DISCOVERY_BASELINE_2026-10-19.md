# E4 — First-party Google baseline, unbranded discoverability and native engine evidence gap

**Run date:** 2026-10-19, Asia/Kolkata  
**Phase:** E4 — search visibility and citation measurement (initial evidence)  
**Issue:** [#748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748)  
**Cohort and native protocol:** [E3/E4 parent intent matrix](./E3_PARENT_EDUCATIONAL_REVIEW_AND_E4_NATIVE_EVALUATION_2026-10-19.md)  
**E1/E2 prerequisite:** all 168 editorial and programmatic URLs directly available in tested origin HTTP; see [audit](./E1E2_LIVE_168_URL_AUDIT_2026-10-19.md).

## Executive results, without unearned AI claims
1. **Google Search Analytics first-party data accessed through the connected Windsor.ai Search Console source.** The `sc-domain:tinystepslearning.com` property returned page metrics for 10 of our 12 priority parent-answer articles for the requested Oct 1–18 period. Two priority pages returned no matching row. These are **Search Analytics figures**, not proof of today's Google indexed-view state nor AI citations.
2. **The connector does not expose the dedicated Google Generative AI report dimensions/metrics.** Fields inspection showed `search_appearance` only for traditional Search Appearance, and requesting it for Oct 1–18 returned a `TRANSLATED_RESULT` category (112 impressions, 1 click) rather than AI Overview/AI Mode metrics. **Do not mislabel those as generative impressions or infer zero generative exposure.**
3. **Native AI answer sessions were not available for this execution**: no genuine ChatGPT Search, Gemini, Google AI Mode or Perplexity session outputs, screenshots and clickable citations have been obtained. Status **NOT TESTED**, denominator **0**, citation rate **NOT CALCULABLE**. A conventional search-results retrieval is not an AI answer test.
4. Public web search for natural, brand-free parent problems returned Tiny Steps' one-word-answer guide as a discoverable source, alongside independent competing guides such as Fonemio (blending), Flalingo (one-word replies) and Understood.org (fluency). This is **public web source discovery only**; no ranking order, personalized results, native citations or AI competitive share are inferred from result lists.
5. The three E3 reader-first edits merged to main as `43a213cc40b0a2db201df1c72014aa8e671cc2e5` (PR #751). **Actual post-merge deployment was verified** by the direct production read-only [CI #39228607145](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39228607145) on **2026-10-19 09:15:31 UTC / 14:45:31 IST**: all 3 HTTP 200, expected new heading visible, legacy editorial label absent, self-canonical preserved, valid linked BlogPosting/WebPage graph and `Cache-Control: no-cache, max-age=0, must-revalidate`. 0 technical flags, 0 unknowns. An older cached web-search snippet showing 'Blog 37' is superseded by this direct-origin observation. The script does not deploy or alter production.

## 1. Search Console conventional page visibility (connected property)
**Requested window:** 2026-10-01 through 2026-10-18 inclusive. **Observed result:** one page aggregate per returned URL; date-based pull returned data only through Oct 16. Search Analytics data can lag and privacy thresholds may omit queries. Do not represent Oct 17–18 as fully final.

| Priority parent-answer owner | GSC clicks | GSC impressions | Average position if returned |
|---|---:|---:|---:|
| `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | 9 | 1,033 | 6.16 |
| `/blog/child-gives-one-word-answers` | 5 | 285 | 5.44 |
| `/blog/what-age-to-start-phonics` | 0 | 73 | 8.90 |
| `/blog/how-long-does-phonics-take` | 0 | 33 | 7.24 |
| `/blog/child-knows-grammar-but-makes-mistakes` | 0 | 22 | 6.18 |
| `/blog/sight-words-or-phonics-first` | 0 | 16 | 8.13 |
| `/blog/how-to-improve-reading-fluency-in-children` | 0 | 12 | 11.50 |
| `/blog/why-child-reads-words-but-does-not-understand-story` | 0 | 12 | 6.25 |
| `/blog/are-phonics-apps-enough-for-kids` | 0 | 10 | 7.30 |
| `/blog/child-understands-english-but-does-not-speak` | 0 | 5 | 5.60 |
| `/blog/online-phonics-classes-vs-school` | — | no returned row | — |
| `/blog/phonics-diagnostics` | — | no returned row | — |

A missing row does **not** prove zero underlying demand, nonindex status, no impressions, or a broken site. Query-level extraction for the letter-sounds article returned only seven visible query rows, despite 1,033 page-level impressions, emphasizing privacy/row-volume limitations. For example, `child knows sounds but can t blend` had 1 impression; this is not a full query census. Do not sum sparse query rows to reproduce page totals.

**Other confirmed Search Console context:** Live connected sitemap rows show `sitemap-blog.xml` submitted 83 URLs (0 errors/0 warnings; last downloaded Oct 16) and `sitemap.xml` submitted 260 URLs (0 errors/0 warnings; last downloaded Oct 17). Sitemaps and impressions do not establish every page's Google-selected canonical/index verdict. Index outcomes remain #747.

**Decision implication:** Our priority answer pages are already receiving some Search impressions. Protect current canonicals and their pedagogically accurate content, especially the blending and one-word articles. Optimize based on per-intent evidence and observed native citations; do not chase a global word-count or publish overlapping keyword combinations.

## 2. Public non-branded web-search competitor observation
Unbranded queries such as “my child knows letter sounds but cannot read words how to help,” “my child gives only one word answers how to encourage speaking in sentences,” and “how to improve reading fluency in children at home” were run through a public web search retrieval on Oct 19. Among returned sources:

- Tiny Steps: `https://tinystepslearning.com/blog/child-gives-one-word-answers`
- Fonemio blending discussion: `https://fonemio.com/blog/my-child-knows-letter-sounds-but-cant-read-words`
- Flalingo question-answer page: `https://academy.flalingo.com/en/parent-academy/faq/my-child-always-gives-one-word-answers-in-online-lessons-how-can-i-encourage-them-to-speak-longer-and-more-fluently`
- Understood.org fluency advice: `https://www.understood.org/en/articles/improve-reading-fluency-children`

**Limitations:** Results came from a conventional web search tool, not search-engine-specific browser results with stable rank positions, not Gemini, not ChatGPT's answer model, not Google AI Mode. It establishes only that source discoverability and topical competition exist. One returned Tiny Steps snippet was indexed/crawled before E3 merge, so **it must not be used as proof of current deployed text**.

## 3. Google AI feature report retrieval gap
Google's June 3, 2026 announcement states dedicated Search Generative AI reports were rolled out worldwide as of Aug 31, 2026. They display AI feature impressions, pages, countries, dates and (for Search) devices. Google has since also announced multimodal filters in Sep 2026.

Official platform references:
- https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/blog/2026/09/web-multimodal-in-sc

**To complete first-party Google E4:** open Search Console for `sc-domain:tinystepslearning.com` or `https://tinystepslearning.com/`; inspect **Performance → Generative AI → Search** for date range Oct 1–18 and page/country breakdown (if visible), and export the report. These AI impressions are already included in overall performance; **do not add them to the classic Search Analytics impressions**. Report availability or no data must be recorded from the actual owner UI. The current connected connector has not delivered that report.

## 4. Native answer-engine benchmark — awaiting genuine product sessions
The companion `E4_NATIVE_12x4_SESSION_MATRIX_2026-10-19.csv` explicitly prepares 12 parent problems × 4 products = 48 cells (`NOT_TESTED` by default), with corresponding expected canonical URLs. The file is **not** 48 completed observations.

**Minimum credible execution:** fresh genuine ChatGPT Search, Gemini app with search/grounding, Google AI Mode and Perplexity responses on the same 12 natural prompts, without inserting Tiny Steps in the query. Each trial needs date/time, locale, session type, screenshot/answer source, actual link targets and whether the educational explanation is accurate. `NO_CITATION` only when a full native response was actually tested and lacked an appropriate link. Compare per-product citation source mix, correct owner selection, answer usefulness, and educational evidence strength.

**Citation metric:** `correctly cited Tiny Steps prompts / genuine eligible native answer sessions`; while `eligible native sessions=0`, the metric is **N/A**, not zero. Do not imply citation success from robots allowed, schema present, `llms.txt`, Google impressions, or our content being included in ordinary web search.

## 5. Scoped next decisions
- **E3 rollout verified.** Retain the direct-origin witness as a release regression check; don't confuse old cached search snippets with current served HTML.
- Obtain first-party GSC Generative AI page export through Search Console UI / supported dedicated connector when available; protect and prioritize pages with demonstrable AI impressions.
- Execute native session matrix and compare sources fairly; then choose **one** genuinely under-served parent intent for deep educational-source evidence review.
- If the observed answer is poor, fix its teaching clarity, public evidence or missing relevant guide link, never invent testimonials, study-backed results, author degrees, `dateModified` values or new SEO pages.
- Track Google indexing outcomes on #747 independently of AI citation improvement.

**Release note:** this document is an evidence record; the rollout probe is a read-only diagnostic. No site/application/business logic/pricing/SEO URL configuration changes.
