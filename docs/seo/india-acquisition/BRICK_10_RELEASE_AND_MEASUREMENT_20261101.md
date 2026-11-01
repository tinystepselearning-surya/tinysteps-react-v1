# Brick 10/10 — India acquisition release and measurement contract

**Prepared:** 2026-11-01 IST. **Issue:** [#851](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/851). **State:** pending PR-head full CI and deployment state verification. **Scope:** validation automation and decision record only; no website copy, metadata, price or booking changes.

## Consolidated ten-brick release ledger

| Brick | Scope | Repository result | What it DOES NOT establish |
|---|---|---|---|
| 1 | Research/keyword baseline | PR #835 merged, source review and safer aggregate-history guards | Complete verified India search TAM or complete historical new-parent cohort |
| 2 | Commercial keyword ownership / initial copy | PR #837 merged, 5 owners frozen, Grammar phrase + broad English tuition FAQ | Actual Google index state or increase in enquiries |
| 3 | Phonics recovery pilot | PR #839 merged, class format clarification | Full phonics recovery or improved organic ranking |
| 4 | Homepage / Online English gateway | PR #841 merged, one contextual chooser link | Search traffic or conversion uplift |
| 5 | Teacher, class and progress proof | PR #843 merged, three real supporting evidence links | Verified complete teacher-photo/qualification roster |
| 6 | Reading | Read-only issue #844 remains **OPEN** | Cause of low Google India visibility, live indexing status, or completed recovery |
| 7 | Grammar & Sentence Formation | PR #846 merged, focused FAQ clarity | New qualified-lead growth |
| 8 | Public Speaking | PR #848 merged, group option FAQ clarification | AI/Google recommendation increase |
| 9 | AI and brand authority | PR #850 merged, public founder `sameAs` consistency | Verified founding year, independent profile ownership, ChatGPT/Gemini visibility |
| 10 | Validation / measurement | This draft source-only contract; no customer-facing site change | The post-Brick-10 Google and conversion evidence is **not yet collected** |

Each merge must be verified separately from Firebase deployment and from crawler indexing. CI validates source/build behaviour, not search-engine discovery.

## Reviewed five core commercial owners

| Buyer intent | Frozen URL | Supporting / distinct specialist |
|---|---|---|
| Paid online Phonics | `/phonics` | `/phonics-fees-india`, comparison, conditional group Phonics |
| Paid online Reading | `/reading-classes-for-kids` | `/reading-fluency-program`, phonics diagnostics |
| Paid Grammar / Sentence Formation | `/grammar` | Beginner/Advanced course specifics, Writing programme, conditional group Grammar |
| Public Speaking / Communication | `/speaking` | Spoken English conversational fluency, confidence-only specialist, conditional group Speaking |
| Broad online English for children | `/online-english-classes-for-kids` | Subject programme discovery; Hyderabad-local route only for explicit local intent |

Regression gate verifies unique static public routes, C2 canonical owners, source-level SEO registry self-canonicals and current titles, FAQ generation, one demo path per owner, canonical business facts, pricing, class duration, true group-interest limitations, and distinct specialist intent. It also reruns source tests from Bricks 2, 3, 4, 5, 7, 8 and 9, TypeScript and full Playwright-enabled prerender build.

## Measurement, not estimates: acceptance definitions

1. **Search Console, Google India:** date-scoped 14-day comparable periods; include full-day timestamps Asia/Kolkata and account for Search Console data lag. Record page, query and device performance, impressions, clicks, CTR, position *with volume caveats*, brand/nonbrand splits where available, and Google index-selected canonicals through URL Inspection. Query anonymity/suppression means aggregate-by-query may not sum exactly to page aggregates.
2. **Unique enquiries:** assess actual Firestore lead schema and attribution before any report. Deduplicate normalized parent phone only within covered records; distinguish requested demos from confirmed, scheduled demos. No synthetic production lead writes. If historical deletions/identity lookback are unverified, flag cohort completeness as unknown and avoid claiming an accurate new-parent count.
3. **Qualification:** distinguish parental commercial intent from child-unspecified grammar searches, worksheet hunters, jobs, near-me offline requests, non-paying traffic and branded searches. Third-party keyword volumes (e.g., 1,000 broad English; 880 phonics) are estimates with overlap, not sales funnels or TAM.
4. **Evidence of improvement:** make release annotations and compare *both* organic behaviour and real qualified enquiries against adequately matched periods. Separate rankings, snippet selection, traffic and leads. Do not infer cause from a small difference or seasonal change.
5. **Adversarial safety:** retain working demo CTA, site-nav links, expected canonical ownership, indexability, brand schema and page-based pricing. No lead data export or private child/student records in logs, docs or CI.

## Blocker and next-stage register

**A. High priority — Reading discovery (#844).** Historical India GSC had 1 impression / 0 clicks for 2–15 October on `/reading-classes-for-kids`, with no returned row for 16–29 October. No result row **does not prove deindexation**. Reading already has substantial owner content and supporting links. Inspect indexing state, Google-selected canonical, last crawl, crawled versus live rendered HTML and query/device split before touching title, URL, canonical, robots or introducing new pages.

**B. Commercial owners indexing.** After Brick 10, use manual GSC URL Inspection for **all five** URLs and record Google-selected versus user-declared canonical, coverage reason, last crawl, live test and screenshot/notes. If the content is indexed but traffic is missing, prioritize search-demand/competition/intent analysis, not sitemap fixes.

**C. Founder identity provenance.** `src/lib/schemas.ts` currently claims `foundingDate: '2020'`; canonical fact registry does not document proof. Await legal or operational records distinguishing business founding, teaching start, brand use and website launch. Do not guess a year. Teacher credentials/photos and learner/country reach need separate verified source/consent.

**D. AI-native discoverability.** After the release, use a fixed, prespecified set of parent buyer-intent queries for each of the five programmes, report actual retrieved brand/page results and citation evidence per engine, test branded/entity lookups and structured data. Do not report synthetic “ChatGPT recommendation probability” without a sampling design or direct engine observations.

**E. Production evidence.** GitHub successful Firebase deploy workflow is the deploy signal; separately verify public HTTP 200, correct title/canonical/index meta/visible body, class/sample and enquiry links, mobile view, and no WAF/bot-block interference. Do not treat unavailable web fetch as a live technical failure without crosschecking.

**F. Eligibility and data privacy.** No new child/parent PII or account access requested for this source-only gate. Any operational analytics must be read-only and maintain data minimization and restricted access.

## GSC sequencing

The owner explicitly asked to conduct Google URL Inspection **after the tenth brick**, not before. This document and the Brick 10 CI gate are the **technical closure stage**, but the broader acquisition programme remains **unverified on Google** until the subsequent inspection and India lead measurement. No fabricated results will be used to close this evidence gap.

## Release decision

- [ ] Brick 10 five-owner protection contract passes
- [ ] Prior brick source regression tests pass
- [ ] TypeScript, full build/prerender and all triggered project checks pass
- [ ] Source-only diff review confirms zero customer-facing changes
- [ ] PR merged and Firebase run confirmed successful (if triggered)
- [ ] **Then** initiate post-Brick-10 Google Search Console Inspection and Reading diagnosis
- [ ] Assign ranked corrective actions based on real evidence, not speculative rewriting

**Rule:** “CI green”, “merged”, “deployed”, “live HTTP validated”, “Google indexed” and “qualified-parent-lead lift proven” are six distinct statuses.
