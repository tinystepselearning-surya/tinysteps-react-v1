# Brick 1 — India acquisition baseline and keyword intelligence

**Date:** 2026-11-01 IST. **Parent:** [#834](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/834). **Scope:** read-only research and reproducible aggregate reconciliation; zero production page, Firestore, enquiry-form or deployment changes.

## Existing assets — DO NOT rebuild

- `src/lib/commercialC1SearchUniverse.ts`: prior parent search-intent research.
- `src/lib/commercialC2KeywordOwnership.ts`: frozen canonical commercial ownership, including special price/comparison, fluency and local-intent exceptions.
- `src/pages/admin/AnalyticsDashboardV2.tsx` and `LeadSourceAnalysis.tsx`: already implemented lead-record acquisition panels.
- `src/lib/leadAcquisition.ts`: existing first-touch source classification.

**Critical metric difference:** the current admin marketing panel counts **lead records**, not deduplicated **genuinely new parents**. Do not relabel the former or silently change it in this brick.

## Reviewed July–October evidence

Source: owner-provided reviewed Codex/Firebase/GSC aggregate snapshot (generated 2026-11-01), titled *Tiny Steps grew search traffic while high-intent Phonics and AI-referred enquiries weakened*. The report states that its authors read production Firestore project `tinysteps-react-v1` and GSC domain `sc-domain:tinystepslearning.com`. This PR **does not** independently re-query Firestore.

| Period | Recoverable submissions | Genuine new parents | Attribution coverage | India GSC clicks | /phonics impressions | Commercial Phonics impressions |
|---|---:|---:|---:|---:|---:|---:|
| July 2026* | 104 | 78 | 9% | 588 | 2,688 | 2,992 |
| August 2026 | 166 | 148 | 78% | 787 | 3,409 | 3,509 |
| September 2026 | 198 | 158 | 87% | 1,494 | 2,246 | 1,735 |
| October 2026** | 156 | 127 | 93% | 1,639 | 1,745 | 1,215 |

- *July website lead-event history starts **11 July**, so this is an incomplete month.*
- **October sitewide GSC clicks cover **1–30 October**; page/query extracts may have different freshness. Do not treat a shortened GSC month as a full-month matched acquisition conversion cohort.
- October vs September: new parents **158→127 (−31, −19.6%)**; ChatGPT-attributed **60→32 (−28)**; Google organic **59→52 (−7)**. These are measured classification movements, **not proof that AI recommendation frequency fell**.
- Parent Phonics interest **65→46 (−19)**; unknown/ambiguous **36→20 (−16)**. Raw concern `Not sure where to start` remains ambiguous—not Reading just because source form code assigns that category.
- Commercial Phonics disclosed query impressions **1,735→1,215 (−520)** while India sitewide clicks **1,494→1,639 (+145)**. GSC clicks are not unique parents.
- Attribution enrichment changed **10 August**; AI persistence changed **19 September**. Historical source labels must show confidence and unknowns. Recoverable records may omit deleted/archived history; unmatched July demos were not added to enquiries.
- Previous GSC extractions disagree slightly on some /phonics page figures: retain the *single reviewed snapshot* as a versioned baseline; investigate extract dates/filters rather than blending numbers.

## Five programme search-intent owners — inherit existing C2

| Parent buyer intent | Existing C2 cluster | Canonical commercial page |
|---|---|---|
| Phonics classes, blending/decoding, tutors | `phonics-provider` | `/phonics` |
| Reading classes, generic reading tutors | `reading-provider` | `/reading-classes-for-kids` |
| Grammar, sentence formation classes/tutors | `grammar-provider` | `/grammar` |
| Formal public speaking/presentations | `public-speaking-provider` | `/speaking` |
| Broad English and undiagnosed learning needs | `broad-english-provider` | `/online-english-classes-for-kids` |

**Respect C2 special owners:** `/phonics-fees-india` for explicit Phonics fees, `/best-online-phonics-classes-for-kids-in-india` for comparisons, `/reading-fluency-program` for narrow fluency, `/spoken-english-classes-for-kids-online` for spoken fluency, `/online-english-classes-hyderabad` for explicit local intent, `/pricing` for cross-programme fees. Do not create duplicate city/AI landing owners from this research.

## Market-size evidence status

Previous Deep Research found a **third-party historical estimate** of **9,900 Indian searches for “phonics class” in July 2025**, not official 2026 Google Keyword Planner volume and not the total commercial Phonics market. Comparable monthly India volumes for Reading, Grammar, Public Speaking and Broad English **are not verified**. An absent volume is not zero demand.

**Required additional input:** one consistent Google Keyword Planner or comparable SEO dataset, India, 24 months where possible, agreed language and close-variant treatment, transactional/comparison modifiers separated from worksheets/jobs/informational intent. Controlled India mobile/desktop SERP snapshots are useful for *presence* but not a market-size denominator.

## Decision contract

- **Primary outcome:** distinct *genuine new parent identities* in an IST calendar period, first known enquiry; preserve repeat/new distinction and historical-identity lookback.
- **Diagnostic:** new parents by first-touch channel, first landing, original `mainConcern` and classified intent, alongside **attribution coverage**.
- **Search driver:** India GSC Web commercial query and canonical-owner impressions, clicks, device, position where reliable; disclosed query rows are privacy filtered.
- **Commercial market:** national monthly search-volume estimates only from a compatible, dated dataset.
- **Guardrails:** no PII, no inferred ChatGPT referral from source='website', no AI citations-as-leads, no fake exact GSC→Firestore conversion ratio, no national share estimate from GSC impressions; preserve canonical URLs and the working enquiry form.
- **Cadence:** weekly operational review; primary decision uses comparable complete 28-day cohorts and release annotations.

## Reproducible report check

`scripts/india-acquisition-brick1.mjs <private-reviewed-aggregate.json>` accepts **aggregate-only** JSON with `queries.month_matrix.rows`, `channel_month.rows`, `intent_month.rows` and `search_month.rows`. It validates monthly parent-source/intent sums and the internally consistent GSC export; never reads production Firestore or emits raw customer records.

The private reviewed JSON is **not committed**. Never commit customer-level datasets or credentials.

## Brick 1 completion gates

- [x] Review and reuse existing C1/C2 owners and Analytics V2, avoiding duplicate architecture.
- [x] Freeze owner-supplied reviewed historical baseline with explicit date/attribution caveats.
- [x] Establish primary KPI, source/intent reconciliation and commercial query owner contract.
- [ ] Add and test reproducible aggregate-only verification tool and run against supplied reviewed JSON.
- [ ] PR-head checks, owner review and approval.
- [ ] External India commercial search-volume export across all five markets — **still required**, not claimed complete.
- [ ] Live **new-parent** admin cohort read model — separate security/access design; existing lead-record admin panel is not equivalent.
