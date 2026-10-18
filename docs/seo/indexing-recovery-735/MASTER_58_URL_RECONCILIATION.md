# Issue #735 — Master reconciliation of 58 Google Search Console URL examples
**Baseline:** owner-provided Search Console exclusion examples, October 17–18, 2026. **Prepared:** October 18, 2026.  
**Property:** `sc-domain:tinystepslearning.com`. **Production canonical:** `https://tinystepslearning.com`.  
**Scope:** 58 *distinct reported example URLs*; **not** a claim about every Google-indexed or excluded URL on the site.

## Evidence and interpretation rules
- The 28 **Discovered – currently not indexed** example rows carried `1970-01-01` in the pasted Last crawled field. Treat this as an **epoch/empty-date export placeholder**, **not** a real crawl in 1970. The current Google Index inspection may supersede historical examples.
- The 30 **Crawled – currently not indexed** example rows had specific historical crawl dates, recorded below. This status does **not** prove all 30 ought to be separately indexed or remain excluded today.
- Three of the original discovered resources had **owner screenshots of "URL is on Google / Page is indexed"** on Oct 18: `/resources/grammar`, `/resources/phonics/sh-digraph-phonics`, `/resources/vocabulary/vocabulary-for-better-writing`. A screenshot of a successful Live Test is **not** an indexed-view confirmation.
- `/resources/grammar/simple-past-tense-for-kids`: Google live test eligible, smartphone-rendered article captured, owner requested indexing; **not yet confirmed Google indexed**. `/resources/phonics/magic-e-phonics`: live eligible but earlier excluded; current indexed state unknown.
- PR #739 deployed shared prerendered-content protection for eligible **public Phonics, Grammar, Vocabulary** routes. PR #740 added CI with **23 routes × 2 injected JS failures = 46 green tests**. These protect against a specific React Soft 404 failure; they **do not cause or guarantee Google's crawl, content selection, or index inclusion**, and they did not cover blog/commercial routes until the blog-specific fix in PR #743. **PR #743 is deployed (18 Oct 2026), safeguarding eligible substantive `/blog/:slug` pages on a matching lazy-import error and revalidating clean blog HTML; Google indexing remains separately unverified.**
- `firebase.json` now establishes 14 legacy 301 mappings in the original GSC 58-URL cohort: the 12 initially identified aliases plus **C14** and **C15** discovered during Phase 2; **live verification is still required**. Do not submit legacy aliases for indexing.
- Connected Google Search Console Search Analytics from Sep 15–Oct 17 showed impressions for 8/13 *originally classified* crawled-content candidates, including one later confirmed in source as a legacy redirect (C15); **historical impressions do not establish current indexed status**. XML/RSS resources generally need a valid response, not HTML-page indexing.

## Control totals and phases

| Classification | Count | Phase |
|---|---:|---|
| Crawled — commercial page + 3 high-priority parent articles | 4 | P1 |
| Crawled — 7 additional potentially indexable educational articles | 7 | P2 |
| Discovered — protected Grammar/Phonics/Vocabulary resource hub and guides | 23 | P3 |
| Discovered — 3 editorial posts, 1 game, 1 seasonal/archive page | 5 | P4 |
| Crawled — 14 confirmed-in-source 301 aliases + 5 XML/RSS machine resources | 19 | P5 |
| **Total** | **58** | |

### Phase work order and release gates
**P0 — Reconcile (this document):** freeze the supplied 58 historical examples; record evidence levels and group membership; avoid unverified "all fixed" statements.  
**P1 — Highest-impact crawled content (4):** `/courses`, two highest-value parent phonics questions, school-vs-online article. For each, obtain **current Google Index**, last crawl, user & Google-selected canonical; inspect **Live Test screenshot + resource failures** only when unindexed/problematic. Preserve performing URLs and only fix demonstrated defects.  
**P2 — Remaining crawled canonical editorial candidates (7):** classify current GSC status; audit intent overlap, educational accuracy, canonical, article visibility, internal links. A missing performance row does not prove exclusion.  
**P3 — Previously discovered resources (23):** review three confirmed-indexed ones for regression only, check Simple Past Tense request outcome and Magic E status, then batch-verify other 18 URLs. Existing browser/render and sitemap safeguards are in place; no blanket rewrite.  
**P4 — Other discovered pages (5):** three blogs, playable word-building game, 2026 summer archive. Validate real parent value, game accessibility and age-appropriate/seasonal truthfulness; check live render and current GSC status.  
**P5 — Exclusion-list housekeeping (19):** validate fourteen source-configured production 301s, canonical target 200/indexability and absence of loops; validate four XML sitemaps plus RSS. Do **not** request indexing for redirect aliases or XML/RSS.  
**P6 — Google decision tracking (recurring review):** compare URL Inspection / Page Indexing export with this historical cohort in ~7–14 days, record requests once, check indexed status and organic impressions/clicks, and only open implementation PRs on reproducible, scoped defects. No guaranteed deadline.

**Each phase:** produce a per-URL evidence table with `owner GSC indexed verdict`, `last crawled`, `live accessibility / Google rendered screenshot`, `canonical owner`, `recommended action`, `PR if any`, `post-release verdict`. No phase is "resolved" based on a passing CI test or public text fetch alone.

## D — 28 discovered/not-indexed examples (original Last crawled field: 1970-01-01 placeholder)

| ID | Path (prefix https://tinystepslearning.com) | Type | Phase | Latest confirmed indexing evidence | Next verification |
|---|---|---|---|---|---|
| D01 | /blog/back-to-school-english-confidence-plan | Editorial | P4 | Not independently confirmed in current Google Index | Blog declared indexable in source; verify indexed/live and differentiation |
| D02 | /blog/phonics-summer-plan | Editorial | P4 | Not independently confirmed in current Google Index | Blog declared indexable in source; verify indexed/live and differentiation |
| D03 | /blog/speaking-confidence-seeds | Editorial | P4 | Not independently confirmed in current Google Index | Blog declared indexable in source; verify indexed/live and differentiation |
| D04 | /free-word-building-game-for-kids | Interactive game | P4 | Not independently confirmed in current Google Index | Verify actual playable game, prerendered HTML and Google mobile render |
| D05 | /resources/grammar | Grammar hub | P3 | Indexed — owner Google Index screenshot, Oct 18 | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D06 | /resources/grammar/conditionals-for-kids | Grammar guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D07 | /resources/grammar/future-forms-for-kids | Grammar guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D08 | /resources/grammar/simple-past-tense-for-kids | Grammar guide | P3 | Live eligible; verified Google smartphone article rendering; indexing requested; indexed status unknown | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D09 | /resources/phonics/ai-vowel-team-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D10 | /resources/phonics/ar-r-controlled-vowels-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D11 | /resources/phonics/au-aw-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D12 | /resources/phonics/ch-digraph-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D13 | /resources/phonics/ck-rule-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D14 | /resources/phonics/er-ir-ur-r-controlled-vowels-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D15 | /resources/phonics/floss-rule-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D16 | /resources/phonics/j-sound-spellings-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D17 | /resources/phonics/kn-silent-k-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D18 | /resources/phonics/magic-e-phonics | Phonics guide | P3 | Live eligible; original Google Index showed discovered/not indexed; current status unknown | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D19 | /resources/phonics/ng-digraph-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D20 | /resources/phonics/oa-vowel-team-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D21 | /resources/phonics/oi-oy-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D22 | /resources/phonics/oo-sounds-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D23 | /resources/phonics/or-r-controlled-vowels-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D24 | /resources/phonics/sh-digraph-phonics | Phonics guide | P3 | Indexed — owner Google Index screenshot, Oct 18 | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D25 | /resources/phonics/soft-c-hard-c-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D26 | /resources/phonics/y-as-a-vowel-phonics | Phonics guide | P3 | Not independently confirmed in current Google Index | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D27 | /resources/vocabulary/vocabulary-for-better-writing | Vocabulary guide | P3 | Indexed — owner Google Index screenshot, Oct 18 | Existing #739 shared fallback; #740 cohort tests passed; inspect GSC state |
| D28 | /summer-camp-for-kids-india | Seasonal/archive | P4 | Not independently confirmed in current Google Index | Assess current relevance, canonical and archived wording; then inspect GSC |

## C — 30 crawled/not-indexed examples

| ID | Path (prefix https://tinystepslearning.com) | Last crawled in owner export | Type | Phase | Supporting evidence | Next verification |
|---|---|---|---|---|---|---|
| C01 | /courses | 2026-10-13 | Commercial | P1 | **Indexed — owner-reported Oct 18, 2026**; previous Search Analytics 2,286 impressions Sep 15–Oct 17 | Preserve /courses as currently indexed; monitor, no reindexing or rewriting |
| C02 | /blog/sight-words-or-phonics-first | 2026-10-13 | Editorial | P1 | **Indexed — owner-reported Oct 18, 2026**; earlier Search Analytics 40 impressions Sep 15–Oct 17 | Preserve original article and self-canonical; no reindexing request |
| C03 | /blog/why-child-knows-letter-sounds-but-cannot-read-words | 2026-10-13 | Editorial | P1 | **Indexed — owner-reported Oct 18, 2026**; prior Search Analytics 1,777 impressions, 19 clicks Sep 15–Oct 17 | Preserve article/canonical; monitor, no reindexing or rewriting |
| C04 | /blog/online-phonics-classes-vs-school | 2026-10-11 | Editorial | P1 | **Google Index: Crawled – currently not indexed** (owner screenshot Oct 18); 4:41–4:42 live Soft 404 due failed `BlogPostPage` lazy import, 4:43 live can be indexed | Scoped blog prerender-fallback and clean-URL caching fix proposed; verify after CI/deploy; do not claim indexed |
| C05 | /blog/how-phonics-grammar-and-communication-work-together | 2026-09-30 | Editorial | P2 | Search Analytics: 83 impressions, Sep 15–Oct 17; current indexed status unverified | Check Google Index and live rendering; diagnose only proven technical/content gap |
| C06 | /blog/week-26-screen-smart-summer-routine | 2026-09-19 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/screen-smart-summer-routine-for-kids; verify live status and target |
| C07 | /blog/what-is-phonics-for-kids | 2026-09-15 | Editorial | P2 | Search Analytics: 9 impressions, Sep 15–Oct 17; current indexed status unverified | Check Google Index and live rendering; diagnose only proven technical/content gap |
| C08 | /blog/phonics-r-controlled | 2026-09-07 | Editorial | P2 | No exact page-level Search Analytics row in Sep 15–Oct 17 extract; index status unverified | Check Google Index and live rendering; diagnose only proven technical/content gap |
| C09 | /blog/phonics-diagnostics | 2026-09-07 | Editorial | P2 | No exact page-level Search Analytics row in Sep 15–Oct 17 extract; index status unverified | Check Google Index and live rendering; diagnose only proven technical/content gap |
| C10 | /blog/grammar-assessment | 2026-09-07 | Editorial | P2 | **GOOGLE INDEX: Not indexed — Crawled, currently not indexed** (owner GSC screenshot 2026-10-18 5:30 PM IST); last crawl **2026-09-07 03:57:47**; 140 impressions / 2 clicks Sep 15–Oct 17 | **LIVE TEST 2026-10-18 5:30 PM IST: URL available to Google; page can be indexed; 1 valid breadcrumb**. In both sitemap-blog.xml + sitemap.xml; GSC says 'Referring page: None detected'. Verify tested-page screenshot and resources before considering indexing request; existing code indicates indexable blog policy. Do not mark indexed. |
| C11 | /sitemap-blog.xml | 2026-09-02 | XML/RSS | P5 | Machine resource; indexing as an HTML page not required | Verify valid machine-readable HTTP response; not a search-result target |
| C12 | /sitemap.xml | 2026-07-26 | XML/RSS | P5 | Machine resource; indexing as an HTML page not required | Verify valid machine-readable HTTP response; not a search-result target |
| C13 | /sitemap-static.xml | 2026-07-26 | XML/RSS | P5 | Machine resource; indexing as an HTML page not required | Verify valid machine-readable HTTP response; not a search-result target |
| C14 | /blog/how-long-does-it-take-child-to-learn-phonics | 2026-07-12 | **Redirect alias (301)** | **P5** | `firebase.json` 301 → `/blog/how-long-does-phonics-take`; replacement is in `sitemap-blog.xml`; original GSC exclusion category/date preserved | Verify real live 301 + canonical destination's indexing; **do not request indexing for alias** |
| C15 | /blog/can-child-master-english-in-10-days | 2026-07-10 | **Redirect alias (301)** | **P5** | `firebase.json` 301 → `/blog/can-child-improve-english-in-10-days`; public-web retrieval followed redirect; replacement is in `sitemap-blog.xml`; previous historic performance 1 impression | Verify live 301 + canonical destination's indexing; **do not request indexing for alias** |
| C16 | /sitemap-courses.xml | 2026-07-04 | XML/RSS | P5 | Machine resource; indexing as an HTML page not required | Verify valid machine-readable HTTP response; not a search-result target |
| C17 | /blog/week-27-prevent-summer-slide-reading | 2026-06-20 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/prevent-summer-slide-reading; verify live status and target |
| C18 | /blog/week-4-phonics-long-vowels | 2026-06-19 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/phonics-long-vowels; verify live status and target |
| C19 | /blog/week-7-grammar-nouns-to-paragraphs | 2026-06-06 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/grammar-nouns-to-paragraphs; verify live status and target |
| C20 | /blog/week-6-phonics-comprehension | 2026-06-06 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/phonics-comprehension; verify live status and target |
| C21 | /blog/synthetic-phonics-vs-traditional-reading | 2026-06-03 | Editorial | P2 | Search Analytics: 6 impressions, Sep 15–Oct 17; current indexed status unverified | Check Google Index and live rendering; diagnose only proven technical/content gap |
| C22 | /blog/week-2-phonics-blending-club | 2026-05-31 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/phonics-blending-club; verify live status and target |
| C23 | /blog/week-18-speaking-video-feedback | 2026-05-30 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/speaking-video-feedback; verify live status and target |
| C24 | /blog/week-10-grammar-subject-verb | 2026-05-20 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/grammar-subject-verb; verify live status and target |
| C25 | /blog/online-english-classes-for-kids-india | 2026-05-12 | Editorial | P2 | No exact page-level Search Analytics row in Sep 15–Oct 17 extract; index status unverified | Check Google Index and live rendering; diagnose only proven technical/content gap |
| C26 | /blog/rss.xml | 2026-05-11 | XML/RSS | P5 | Machine resource; indexing as an HTML page not required | Verify valid machine-readable HTTP response; not a search-result target |
| C27 | /blog/week-22-phonics-diagnostics | 2026-04-28 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/phonics-diagnostics; verify live status and target |
| C28 | /courses/advanced-grammar | 2026-04-27 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /courses/grammar-mastery; verify live status and target |
| C29 | /blog/week-16-phonics-summer-plan | 2026-04-26 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/phonics-summer-plan; verify live status and target |
| C30 | /blog/week-21-speaking-competition-prep | 2026-04-24 | Redirect | P5 | 301 configured in firebase.json; live response not fully checked | Configured 301 → /blog/speaking-competition-prep; verify live status and target |

## Newer per-URL Google Index results — recorded without erasing historical baselines
- **C04 `/blog/online-phonics-classes-vs-school`: owner GSC screenshot Oct 18, 2026 shows Not indexed / Crawled–currently not indexed; the 4:41–4:42 live test Soft 404 and 4:43 live test eligible.** Connected GSC More Info logs on the failed test show a `BlogPostPage` JS chunk import error (and later a cascading NotFoundPage import error). The successful test does not establish actual indexing. Proposed scoped blog fallback and clean-URL cache fix in separate reviewable PR, not yet deployed; do not attribute the cause to content weakness by default.

- **C01 `/courses`: owner-reported indexed on October 18, 2026** (the confirmation was typed, not a screenshot). Supersedes its historical Crawled exclusion example for current decision-making; retain the original `2026-10-13` crawl date and exclusion category as provenance. Do not change or request indexing for this traffic-bearing URL. Only one Phase 1 blog URL still requires a current indexed-view check (C04); owner also reports **C02 `/blog/sight-words-or-phonics-first` indexed** on October 18, 2026 without a new screenshot. Owner now also reports **C03 `/blog/why-child-knows-letter-sounds-but-cannot-read-words` indexed** on October 18, 2026 without a screenshot in this turn. Overall **six owner-confirmed/reported indexed URLs** from the 58: **three resource pages with owner GSC screenshots** and **three Phase 1 pages (`/courses`, C03, C02) reported indexed verbally**.

## Phase 2 baseline correction — 18 October 2026
- **Two additional legacy aliases found in source:** C14 and C15 were originally labelled "editorial candidates" but `firebase.json` defines them as 301 redirects. Both canonical replacement URLs appear in `public/sitemap-blog.xml`. These historical URLs should not be treated as separately indexable pages.
- **Updated disposition:** 58 unique original examples = **39 potentially indexable target pages** (P1 4 + P2 7 + P3 23 + P4 5) and **19 technical/non-result targets** (14 301 redirects + 4 XML sitemaps + 1 blog RSS). Original Discovered/Crawled group membership and original dates remain unchanged.
- The **seven** P2 intended standalone articles are C05, C07, C08, C09, C10, C21, and C25. Current **Google Index** decisions are unverified; a site URL being readable to public web retrieval or present in sitemap is not proof of Google index inclusion.
- See `PHASE2_SEVEN_BLOGS_RECONCILIATION.md` for individual P2 priorities, canonical ownership and GSC verification workflow.

## Reconciliation checks and dependencies
- All 58 paths are unique: 28 D + 30 C; no duplicates **between** those historical lists.
- The "Discovered" target `/blog/phonics-summer-plan` is the **canonical destination** of crawled legacy `/blog/week-16-phonics-summer-plan`. This is **not** a duplicate submission: test redirect and destination independently; do not try to index the alias.
- `/blog/phonics-diagnostics` in the crawled-content cohort is the canonical target of legacy `/blog/week-22-phonics-diagnostics` in the same cohort; again, index only the intended canonical page when appropriate.
- The 3 blog items in the discovered cohort (`back-to-school-english-confidence-plan`, `phonics-summer-plan`, `speaking-confidence-seeds`) are intentionally indexable under `src/lib/blogIndexingPolicy.js`; this is **source policy**, not a live URL Inspection result.
- Public `/summer-camp-for-kids-india` source currently describes the concluded 2026 camp as an archive and parent planning guide. Audit whether its current parent intent merits continued indexing without pretending past events are upcoming.
- `/courses` and `/blog/why-child-knows-letter-sounds-but-cannot-read-words` have had substantial search impressions: protect these URLs and content pending current per-URL inspection.
- This document is evidence tracking only: **no changes to live content, robots, canonicals, redirects, sitemap outputs, or Firebase hosting**.

## Next update discipline
When new owner Search Console results arrive, update the **specific row**'s index state, observation date and next action; never silently overwrite original category or last-crawled provenance. Keep Issue #735 open until indexable targets are resolved or explicitly dispositioned and non-search-result resources/aliases are validated.
