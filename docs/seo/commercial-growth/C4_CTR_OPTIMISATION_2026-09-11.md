# C4 — CTR Optimisation

**Started:** 11 September 2026  
**Branch:** `seo/c4-ctr-optimisation`  
**Revision:** `2026-09-11-c4-r2`  
**Status:** experiment governance armed; C3 snippets remain the live control

## Purpose

C4 improves qualified organic click-through rate without reopening C1 keyword research, C2 keyword ownership, or C3 commercial-page architecture.

The controlled sequence is:

> historical page evidence → owner-specific query sample → CTR triage → intended-vs-observed SERP check → frozen control → fresh post-C3 evidence → READY → human-reviewed deployment → measurement → WIN / LOSS / INCONCLUSIVE

C4 does not create new commercial URLs, move keywords between owners, or add variants merely for repetition.

## Critical timing constraint

The frozen Google Search Console evidence covers **9 June–8 September 2026**.

C3 was merged and deployed on **11 September 2026**.

Therefore the historical CTR data largely reflects metadata and page states that existed **before the final C3 implementation**. It is useful for opportunity ranking and query diagnosis, but it cannot prove that the new C3 snippets are underperforming.

C4 therefore treats the C3 title and description as the **control**. Both fields are frozen by the C4 audit for the six active experiment candidates.

No candidate is deployable until fresh post-C3 evidence passes the deployment gate.

## Active CTR opportunity set

The six page-level HIGH opportunities remain the active observation set. C4 r2 now ranks them with an internal triage score rather than treating every HIGH page as equivalent.

The score uses:

- page impressions
- the gap between historical CTR and an internal 4% triage reference
- average-position confidence
- owner-specific query-sample coverage

The **4% value is only an internal ranking heuristic**. It is not a Google CTR benchmark, forecast, or ranking guarantee.

| Rank | Owner | Impressions | CTR | Avg. position | Headroom at 4% reference | Triage score |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | `/phonics` | 11,306 | 3.28% | 4.86 | 81.4 | 81.4 |
| 2 | `/best-online-phonics-classes-for-kids-in-india` | 3,835 | 2.63% | 8.69 | 52.5 | 36.8 |
| 3 | `/online-english-classes-hyderabad` | 3,556 | 2.42% | 7.94 | 56.2 | 33.4 |
| 4 | `/pricing` | 1,551 | 1.03% | 5.09 | 46.1 | 32.2 |
| 5 | `/speaking` | 2,602 | 2.38% | 9.10 | 42.2 | 29.5 |
| 6 | `/grammar` | 811 | 1.48% | 7.08 | 20.4 | 14.8 |

## Query alignment

C4 r2 maps the available frozen C1 core-query evidence to the correct C2 owner instead of relying on page-level CTR alone.

The query tables are **samples from the frozen C1 core evidence, not exhaustive query exports**.

### `/phonics`

Mapped generic phonics-class sample:

- 6 query rows
- 3,448 impressions
- 45 clicks
- 1.31% sample CTR
- 5.29 impression-weighted average position

The sample intentionally excludes best/comparison and fee-specific searches because those have separate C2 owners.

### `/best-online-phonics-classes-for-kids-in-india`

Mapped comparison sample:

- 3 query rows
- 938 impressions
- 28 clicks
- 2.99% sample CTR
- 3.87 impression-weighted average position

Fee-led phonics queries remain outside this comparison sample because `/phonics-fees-india` owns subject-specific price intent.

### `/speaking`

Mapped public-speaking sample:

- 3 query rows
- 112 impressions
- 1 click
- 0.89% sample CTR

### `/grammar`

Mapped grammar sample:

- 1 query row
- 4 impressions
- 0 clicks

This is too little query-level history to justify any immediate rewrite.

### `/pricing` and `/online-english-classes-hyderabad`

The frozen C1 core-query shortlist does not contain a sufficiently direct owner-specific sample for these two pages. They therefore carry `NO_CORE_SAMPLE` rather than borrowing unrelated queries. Their fresh evidence gate relies on page-level data until a proper query-family export is available.

## Directional SERP title snapshot

C4 r2 also records a **directional external search-result snapshot** for the six active owners.

This is deliberately separated from Google Search Console evidence. Search engines can rewrite titles by query, location, device and time, so the snapshot is diagnostic only and can never by itself trigger a metadata change.

Snapshot captured **11 September 2026**:

| Owner | Intended C3 control title | Directionally observed title | Rewrite seen? |
| --- | --- | --- | --- |
| `/phonics` | Online Phonics Classes for Kids \| Live 1:1 \| Tiny Steps | Online Phonics Classes for Kids in India \| Live 1:1 \| Tiny Steps | Yes |
| `/best-online-phonics-classes-for-kids-in-india` | Best Online Phonics Classes for Kids in India \| Tiny Steps Learning | Best Online Phonics Classes for Kids in India \| Tiny Steps Learning | No |
| `/online-english-classes-hyderabad` | Online English Classes for Kids in Hyderabad \| Tiny Steps | Online English Classes for Kids in Hyderabad \| Tiny Steps Learning | Yes |
| `/speaking` | Public Speaking & Communication Classes for Kids \| Tiny Steps | Public Speaking Classes for Kids in India \| Tiny Steps | Yes |
| `/pricing` | Online English Classes for Kids Fees & Pricing \| Tiny Steps | Premium 1:1 Online English Class Pricing \| Tiny Steps Learning | Yes |
| `/grammar` | Online Grammar Classes for Kids \| Live 1:1 \| Tiny Steps | Grammar Classes for Kids in India \| Tiny Steps | Yes |

These observations are **not** treated as stable Google titles. They tell C4 which pages deserve a fresh SERP recheck once post-C3 GSC evidence is mature.

## Frozen controls and prepared candidates

C4 freezes both the current C3 title and current C3 description for all six active candidates. CI fails if either changes before the experiment is intentionally advanced.

C4 r2 continues to prepare **description-only** candidates. It does not prepare title candidates yet because the C3 titles are new and title rewrites need fresh evidence before we decide whether to respond.

### `/phonics`

Prepared description candidate:

> Live 1:1 online phonics classes for kids ages 3–12. Build blending, decoding, spelling and reading fluency. Free 35-minute assessment; India + worldwide.

### `/best-online-phonics-classes-for-kids-in-india`

Prepared description candidate:

> Compare online phonics classes for kids in India by 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and fees.

### `/online-english-classes-hyderabad`

Prepared description candidate:

> Live online English classes for kids ages 3–12 in Hyderabad. Phonics, reading, grammar, writing and speaking. Start with a free 35-minute 1:1 assessment.

### `/speaking`

Prepared description candidate:

> Live 1:1 public speaking and communication classes for kids. Build structured answers, storytelling, presentations and confidence in 35-minute classes.

### `/pricing`

Prepared description candidate:

> Online English class fees for kids: live 1:1 ₹400/class or ₹4,800 for 12 classes; small groups ₹180–₹300 per child/class. Compare formats and value.

### `/grammar`

Prepared description candidate:

> Live 1:1 online grammar classes for kids. Build sentence formation, tenses, punctuation and clearer school answers. Assessment-led; India + worldwide.

## Experiment lifecycle

Every C4 experiment uses the explicit lifecycle:

**CONTROL → READY → DEPLOYED → MEASURING → WIN / LOSS / INCONCLUSIVE**

Definitions:

- **CONTROL** — C3 snippet remains live; evidence gate has not passed.
- **READY** — sufficient fresh evidence exists; candidate may be reviewed for deployment.
- **DEPLOYED** — an intentionally approved candidate has replaced the control.
- **MEASURING** — treatment is live and collecting enough comparable evidence.
- **WIN** — CTR/qualified-click performance improved without an unacceptable rank or lead-quality tradeoff.
- **LOSS** — treatment materially underperformed the control and should be reverted or replaced.
- **INCONCLUSIVE** — ranking movement, insufficient impressions or mixed lead quality prevents a valid decision.

Moving to READY is machine-evaluated. Deployment and outcome classification remain human-reviewed.

## Fresh-evidence deployment gate

A C4 candidate remains blocked until:

- at least **14 days** of post-C3 observation
- at least **200 fresh page impressions** for the owner
- at least **50 fresh impressions** for the mapped query family when C4 has a mapped query sample
- CTR is interpreted alongside average position
- qualified organic leads are reviewed alongside click-through performance

If C4 has `NO_CORE_SAMPLE` for an owner, lack of a historical core-query sample does not permanently block the page. Page-level evidence can move it to READY while a proper query-family export is added later.

Passing the gate **does not automatically publish a snippet**. It only changes the experiment from CONTROL to READY for review.

## Guardrails

C4 must not:

- create new commercial URLs
- reassign C2 ownership
- make one programme owner compete with another
- mix phonics comparison, generic phonics and phonics-fee query samples
- add keyword variants merely to increase repetition
- treat a directional title rewrite as proof that our title is wrong
- introduce unsupported urgency, guarantees, discounts, availability or outcomes
- interpret pre-C3 historical CTR as post-C3 performance
- declare a CTR win while qualified organic lead quality deteriorates

## Success definition

C4 succeeds when Tiny Steps earns more **qualified clicks and qualified organic leads** from the same relevant commercial search opportunities while preserving the frozen owner architecture.

The primary measurement set is:

**query family · impressions · clicks · CTR · average position · observed SERP title · qualified organic leads**

C4 is only frozen after evidence-backed snippet experiments have been evaluated; C4 r2 makes that process technically enforceable without prematurely changing the fresh C3 controls.
