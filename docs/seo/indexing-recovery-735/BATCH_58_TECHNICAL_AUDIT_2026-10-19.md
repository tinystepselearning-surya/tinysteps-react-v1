# Issue #735 — Full 58-URL technical audit (production and generated build)
**Run:** [GitHub Actions #39160744830](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39160744830) — **SUCCESS**, 18 Oct 2026 UTC / 19 Oct IST.  
**Evidence artifact:** `gsc735-58-production-build-audit` (58-row JSON + CSV, 30-day retention), displayed on that run.  
**Audited PR source:** `4ebf4fe4d1f81a6e57530601b632befc35b37b4b`; production site `https://tinystepslearning.com` fetched independently.  
**Methods:** `scripts/audit-gsc735-58-live-and-build.mjs`, generated HTML, 266-page prerendered link graph, GET responses (no deployment or indexing request).

## Executive totals

| Measure | Observed result |
|---|---:|
| URLs from owner GSC inventory | **58/58** (28 discovered, 30 crawled historical group) |
| Potentially indexable HTML pages | **39/39 HTTP 200**, substantive rendered-in-HTML main content |
| Old alias URLs | **14/14 proper 301** to correct destination |
| Redirect target pages | **14/14 HTTP 200, self canonical, index permitted** |
| Sitemap and RSS resources | **5/5 HTTP 200**, XML-looking content |
| Production HTTP fetch errors | **0** |
| Index-blocked / missing canonical / generic error on 39 HTML pages | **0 detected** |
| HTML candidates present in generated sitemaps | **39/39** |
| HTML candidates with at least one crawlable `<a href>` inbound link in generated build | **39/39** |
| Distinct generated HTML documents scanned for inbound references | **266** |
| Exact duplicate HTML titles among 39 | **0** |
| Simulated Googlebot mobile UA sample | **7/7 HTTP 200**, correct article heading and self canonical |
| Potential caching issues flagged | **3** |

**Scope limitation:** This is not 58 Google Search Console URL Inspection results. The original 'Discovered/Crawled – currently not indexed' reports were historical; several URLs were later owner-confirmed indexed. Passing these HTTP/build checks does not establish actual Google Index selection or guarantee Google-specific JavaScript rendering success on future crawls.

## Common findings — what to fix, and what NOT to fix

### F01 — Three clean public HTML URLs still cached one hour (confirmed header; medium reliability concern)
| ID | URL | Observed cache-control | Context |
|---|---|---|---|
| C01 | `/courses` | `max-age=3600` | Already owner-reported Google indexed; high traffic and **264** inbound pages |
| D04 | `/free-word-building-game-for-kids` | `max-age=3600` | 9 inbound pages, public playable game page; Google Index unknown |
| D28 | `/summer-camp-for-kids-india` | `max-age=3600` | 2 inbound pages; seasonal archive/relevance needs review |

All other **36** HTML candidates returned `no-cache, max-age=0, must-revalidate` in this scan. The #739 resource and #743 blog prerendered-content safeguards remain live. Old one-hour HTML can create risk of stale HTML/hashed JS module mismatch during deployments, which is an observed failure *category* from genuine Google live diagnostics on a different blog page. **Caching is not itself a Google indexing failure, and causation is unproved for these three routes.**

**Proposed separate fix, only with approval:** narrow public clean-URL HTML revalidation rules for exactly these three routes; preserve `immutable` hashed JS/CSS, RSS, XML and authenticated routes. Add safe regression checks. For gameplay, confirm live JS functionality rather than equating substantive HTML with a playable game.

### F02 — Ten pages have only 1–3 in-build incoming HTML links (genuine discovery opportunity, not zero links)
| ID | URL | Count | Observed linking pages |
|---|---|---:|---|
| D02 | `/blog/phonics-summer-plan` | 1 | `/blog/prevent-summer-slide-reading` |
| C25 | `/blog/online-english-classes-for-kids-india` | 1 | `/faq` |
| D28 | `/summer-camp-for-kids-india` | 2 | `/sitemap`, `/summer-camps` |
| C08 | `/blog/phonics-r-controlled` | 2 | `/blog/phonics-summer-plan`, `/blog/r-controlled-vowels-explained` |
| C21 | `/blog/synthetic-phonics-vs-traditional-reading` | 2 | `/blog/science-of-phonics-learning`, `/phonics` |
| D01 | `/blog/back-to-school-english-confidence-plan` | 3 | `/blog/conversation-skills-for-kids`, `/blog/screen-smart-summer-routine-for-kids`, `/resources/speaking` |
| D06 | `/resources/grammar/conditionals-for-kids` | 3 | `/resources/grammar/contrast-and-concession-for-kids`, `/resources/grammar`, `/resources/grammar/time-and-sequence-connectors-for-kids` |
| D07 | `/resources/grammar/future-forms-for-kids` | 3 | `/resources/grammar`, `/resources/grammar/present-perfect-vs-simple-past-for-kids`, `/resources/grammar/simple-past-vs-past-continuous-for-kids` |
| D15 | `/resources/phonics/floss-rule-phonics` | 3 | `/resources/phonics/ch-tch-spelling-phonics`, `/resources/phonics/ck-rule-phonics`, `/resources/phonics` |
| C10 | `/blog/grammar-assessment` | 3 | `/blog/child-knows-grammar-but-makes-mistakes`, `/blog/grammar-creative-writing`, `/blog/grammar-editing-camp` |

Prioritize **C25 Online English Classes for Kids in India** (only ` /faq` refers to it) and **D02 Phonics Summer Plan** (one inbound page), then C10 Grammar Assessment (3), C08 R-Controlled Phonics article (2), and C21 Synthetic Phonics vs Traditional Reading (2). Add only helpful, semantically relevant contextual links from existing hubs/courses/related parent resources. Avoid mass links or duplicate pages. **GSC 'Referring page: None detected' is not evidence of zero actual generated links**: C10 presently has three real `<a href>` sources in the build.

### F03 — No shared robots, canonical, sitemap, HTTP, or redirect failure identified (no blanket technical fix)
All 39 HTML targets were HTTP 200, self-canonical, index-permitted, accessible with substantive content, sitemap-listed and linked; **no zero-link pages**. All 14 redirected aliases and destinations operated correctly and no aliases appeared in generated sitemaps. Five sitemap/RSS machine resources returned XML-looking HTTP 200; blog RSS appropriately sent `X-Robots-Tag: noindex`. The response/body matcher detected no generic React error screen. There were **zero network fetch errors** and **zero exact duplicate HTML titles** within this particular cohort. Semantic duplication and current Google-selected canonical still require editorial/GSC inspection.

**Do not** rewrite all pages, add repeated indexing requests, blanket modify robots/noindex or try to index 14 redirect aliases and five XML/RSS resources.

### F04 — Google indexing decision and content differentiation remain unresolved for individual URLs
The issue is no longer explainable by a universal missing sitemap or bad canonical among these 58 URLs. Some pages may still be excluded because of Google crawl scheduling, content selection, overlapping intent, perceived usefulness or intermittent JS failures outside this HTTP-only snapshot. The shared #739 and #743 prerender-fallback fixes address a **specific previously verified lazy import failure**, and our mobile fault simulation passed, but they do **not** force Google to index pages.

Next step: current GSC Page Indexing CSV/URL inspection *on still-excluded pages*, content/parent intent comparison for overlapping phonics/grammar articles, and, where needed, genuine Google mobile rendering resource diagnostics. Preserve already indexed pages; don't claim that a Request Indexing action is index inclusion.

### F05 — Two historical 'editorial' candidates are genuine redirects (resolved classification)
C14 `/blog/how-long-does-it-take-child-to-learn-phonics` and C15 `/blog/can-child-master-english-in-10-days` are properly **301** redirected to `/blog/how-long-does-phonics-take` and `/blog/can-child-improve-english-in-10-days`, respectively. Both destinations returned 200, intended self-canonicals and substantive index-permitted HTML. Corrected control group remains **39 HTML + 14 aliases + 5 machine resources = 58**.

## Full dated 58-URL production matrix
GSC IDs retain original exclusion-list provenance: `D` (historical Discovered) and `C` (historical Crawled). HTML per-page Google Index state is separately recorded in `MASTER_58_URL_RECONCILIATION.md` and cannot be inferred from the table below. These metrics are observed, not assumed from GitHub source.

### 39 intended HTML pages
| GSC ID | Path | Live HTTP | Self canonical | Sitemap | Inbound pages | Cache header | Detected technical flags |
|---|---|---:|---|---|---:|---|---|
| D01 | `/blog/back-to-school-english-confidence-plan` | 200 | Yes | Yes | 3 | no-cache, max-age=0, must-revalidate | — |
| D02 | `/blog/phonics-summer-plan` | 200 | Yes | Yes | 1 | no-cache, max-age=0, must-revalidate | — |
| D03 | `/blog/speaking-confidence-seeds` | 200 | Yes | Yes | 15 | no-cache, max-age=0, must-revalidate | — |
| D04 | `/free-word-building-game-for-kids` | 200 | Yes | Yes | 9 | max-age=3600 | cacheable-clean-html |
| D05 | `/resources/grammar` | 200 | Yes | Yes | 55 | no-cache, max-age=0, must-revalidate | — |
| D06 | `/resources/grammar/conditionals-for-kids` | 200 | Yes | Yes | 3 | no-cache, max-age=0, must-revalidate | — |
| D07 | `/resources/grammar/future-forms-for-kids` | 200 | Yes | Yes | 3 | no-cache, max-age=0, must-revalidate | — |
| D08 | `/resources/grammar/simple-past-tense-for-kids` | 200 | Yes | Yes | 7 | no-cache, max-age=0, must-revalidate | — |
| D09 | `/resources/phonics/ai-vowel-team-phonics` | 200 | Yes | Yes | 8 | no-cache, max-age=0, must-revalidate | — |
| D10 | `/resources/phonics/ar-r-controlled-vowels-phonics` | 200 | Yes | Yes | 5 | no-cache, max-age=0, must-revalidate | — |
| D11 | `/resources/phonics/au-aw-phonics` | 200 | Yes | Yes | 9 | no-cache, max-age=0, must-revalidate | — |
| D12 | `/resources/phonics/ch-digraph-phonics` | 200 | Yes | Yes | 14 | no-cache, max-age=0, must-revalidate | — |
| D13 | `/resources/phonics/ck-rule-phonics` | 200 | Yes | Yes | 4 | no-cache, max-age=0, must-revalidate | — |
| D14 | `/resources/phonics/er-ir-ur-r-controlled-vowels-phonics` | 200 | Yes | Yes | 4 | no-cache, max-age=0, must-revalidate | — |
| D15 | `/resources/phonics/floss-rule-phonics` | 200 | Yes | Yes | 3 | no-cache, max-age=0, must-revalidate | — |
| D16 | `/resources/phonics/j-sound-spellings-phonics` | 200 | Yes | Yes | 5 | no-cache, max-age=0, must-revalidate | — |
| D17 | `/resources/phonics/kn-silent-k-phonics` | 200 | Yes | Yes | 9 | no-cache, max-age=0, must-revalidate | — |
| D18 | `/resources/phonics/magic-e-phonics` | 200 | Yes | Yes | 6 | no-cache, max-age=0, must-revalidate | — |
| D19 | `/resources/phonics/ng-digraph-phonics` | 200 | Yes | Yes | 7 | no-cache, max-age=0, must-revalidate | — |
| D20 | `/resources/phonics/oa-vowel-team-phonics` | 200 | Yes | Yes | 7 | no-cache, max-age=0, must-revalidate | — |
| D21 | `/resources/phonics/oi-oy-phonics` | 200 | Yes | Yes | 6 | no-cache, max-age=0, must-revalidate | — |
| D22 | `/resources/phonics/oo-sounds-phonics` | 200 | Yes | Yes | 7 | no-cache, max-age=0, must-revalidate | — |
| D23 | `/resources/phonics/or-r-controlled-vowels-phonics` | 200 | Yes | Yes | 4 | no-cache, max-age=0, must-revalidate | — |
| D24 | `/resources/phonics/sh-digraph-phonics` | 200 | Yes | Yes | 9 | no-cache, max-age=0, must-revalidate | — |
| D25 | `/resources/phonics/soft-c-hard-c-phonics` | 200 | Yes | Yes | 6 | no-cache, max-age=0, must-revalidate | — |
| D26 | `/resources/phonics/y-as-a-vowel-phonics` | 200 | Yes | Yes | 4 | no-cache, max-age=0, must-revalidate | — |
| D27 | `/resources/vocabulary/vocabulary-for-better-writing` | 200 | Yes | Yes | 5 | no-cache, max-age=0, must-revalidate | — |
| D28 | `/summer-camp-for-kids-india` | 200 | Yes | Yes | 2 | max-age=3600 | cacheable-clean-html |
| C01 | `/courses` | 200 | Yes | Yes | 264 | max-age=3600 | cacheable-clean-html |
| C02 | `/blog/sight-words-or-phonics-first` | 200 | Yes | Yes | 5 | no-cache, max-age=0, must-revalidate | — |
| C03 | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | 200 | Yes | Yes | 31 | no-cache, max-age=0, must-revalidate | — |
| C04 | `/blog/online-phonics-classes-vs-school` | 200 | Yes | Yes | 11 | no-cache, max-age=0, must-revalidate | — |
| C05 | `/blog/how-phonics-grammar-and-communication-work-together` | 200 | Yes | Yes | 9 | no-cache, max-age=0, must-revalidate | — |
| C07 | `/blog/what-is-phonics-for-kids` | 200 | Yes | Yes | 11 | no-cache, max-age=0, must-revalidate | — |
| C08 | `/blog/phonics-r-controlled` | 200 | Yes | Yes | 2 | no-cache, max-age=0, must-revalidate | — |
| C09 | `/blog/phonics-diagnostics` | 200 | Yes | Yes | 14 | no-cache, max-age=0, must-revalidate | — |
| C10 | `/blog/grammar-assessment` | 200 | Yes | Yes | 3 | no-cache, max-age=0, must-revalidate | — |
| C21 | `/blog/synthetic-phonics-vs-traditional-reading` | 200 | Yes | Yes | 2 | no-cache, max-age=0, must-revalidate | — |
| C25 | `/blog/online-english-classes-for-kids-india` | 200 | Yes | Yes | 1 | no-cache, max-age=0, must-revalidate | — |

### 14 old 301 aliases
| GSC ID | Old path | 301 destination | Correct 301 | Target HTTP | Target self canonical | Flags |
|---|---|---|---|---:|---|---|
| C06 | `/blog/week-26-screen-smart-summer-routine` | `/blog/screen-smart-summer-routine-for-kids` | Yes | 200 | Yes | — |
| C14 | `/blog/how-long-does-it-take-child-to-learn-phonics` | `/blog/how-long-does-phonics-take` | Yes | 200 | Yes | — |
| C15 | `/blog/can-child-master-english-in-10-days` | `/blog/can-child-improve-english-in-10-days` | Yes | 200 | Yes | — |
| C17 | `/blog/week-27-prevent-summer-slide-reading` | `/blog/prevent-summer-slide-reading` | Yes | 200 | Yes | — |
| C18 | `/blog/week-4-phonics-long-vowels` | `/blog/phonics-long-vowels` | Yes | 200 | Yes | — |
| C19 | `/blog/week-7-grammar-nouns-to-paragraphs` | `/blog/grammar-nouns-to-paragraphs` | Yes | 200 | Yes | — |
| C20 | `/blog/week-6-phonics-comprehension` | `/blog/phonics-comprehension` | Yes | 200 | Yes | — |
| C22 | `/blog/week-2-phonics-blending-club` | `/blog/phonics-blending-club` | Yes | 200 | Yes | — |
| C23 | `/blog/week-18-speaking-video-feedback` | `/blog/speaking-video-feedback` | Yes | 200 | Yes | — |
| C24 | `/blog/week-10-grammar-subject-verb` | `/blog/grammar-subject-verb` | Yes | 200 | Yes | — |
| C27 | `/blog/week-22-phonics-diagnostics` | `/blog/phonics-diagnostics` | Yes | 200 | Yes | — |
| C28 | `/courses/advanced-grammar` | `/courses/grammar-mastery` | Yes | 200 | Yes | — |
| C29 | `/blog/week-16-phonics-summer-plan` | `/blog/phonics-summer-plan` | Yes | 200 | Yes | — |
| C30 | `/blog/week-21-speaking-competition-prep` | `/blog/speaking-competition-prep` | Yes | 200 | Yes | — |

### 5 machine-readable URLs
| GSC ID | Path | HTTP | Signature | X-Robots-Tag | Flags |
|---|---|---:|---|---|---|
| C11 | `/sitemap-blog.xml` | 200 | XML-looking | none | — |
| C12 | `/sitemap.xml` | 200 | XML-looking | none | — |
| C13 | `/sitemap-static.xml` | 200 | XML-looking | none | — |
| C16 | `/sitemap-courses.xml` | 200 | XML-looking | none | — |
| C26 | `/blog/rss.xml` | 200 | XML-looking | noindex | — |

## QA and delivery decisions
1. **No production code deployed by this batch audit.** PR #744 is a draft with auditing scripts, per-URL evidence logs, CSV/JSON artifact and documentation; current source code, canonicals, site content, Firebase rules, robots and redirects remain unchanged.
2. **Possible fix package A (medium):** narrow revalidation of `/courses`, word game and summer archive clean HTML URLs with end-to-end Hosting checks; only after approval. Existing hashed asset policy must remain immutable.
3. **Possible fix package B (selective):** parent-beneficial internal links for C25 and a handful of genuinely underlinked articles; content should preserve distinct intent, avoid link stuffing and ungrounded promises. Validate generated links before deploying.
4. **Possible fix package C (evidence-dependent):** separate editor/SEO review for current non-indexed candidates with overlapping topics, trusted educational explanation and canonical ownership. Do not rewrite articles purely to create freshness.
5. **Verification:** keep Issue #735 open, compare current Google Index and Page Indexing export (not Search Analytics impressions alone), sample Google smartphone real rendering after any later approved change, allow 7–14 days or more for recrawl; indexing not guaranteed.
6. **Not tested by this scan:** every remote JS module load, complete Googlebot renderer, form submissions, game interactivity, semantic near-duplicate content, Core Web Vitals, full schema validity, human educational accuracy, or Google indexing selection. 'XML-looking' is not full schema validation.
