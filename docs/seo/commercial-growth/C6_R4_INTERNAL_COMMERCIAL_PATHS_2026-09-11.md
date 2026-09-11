# C6-R4 — Internal Commercial Paths

**Date:** 11 September 2026  
**Status:** IMPLEMENTED + VALIDATION REQUIRED

## Mission

Make the existing Tiny Steps commercial owner system behave as one coherent buyer-decision graph without creating new commercial URLs or disturbing the active C4 metadata observation window.

R4 does **not** create another landing-page architecture. It validates the internal paths already present across the 14 C2/C3 commercial owners and freezes the routes that answer the next parent decision.

## Guardrails

- C2 ownership remains frozen.
- C4-controlled titles, descriptions and canonicals remain unchanged.
- `/book-demo` remains the single conversion owner.
- No direct payment flow is introduced.
- No new comparison, fee, city, country or AI-prompt URL is created.
- Every pre-conversion owner retains a direct `/book-demo` route.
- R4 defaults to validating existing links rather than adding body-copy churn during the C4 control window.

## Commercial graph

The graph contains the same 14 owners established by C2/C3/C5.

### Direct assessment rule

All 13 pre-conversion owners must link directly to:

`/book-demo`

This keeps the parent free to request an assessment at any decision stage without forcing a multi-page funnel.

## Six strategic journeys

### 1. Phonics comparison path

`/best-online-phonics-classes-for-kids-in-india`
→ `/phonics-fees-india`
→ `/phonics`
→ `/book-demo`

Purpose: let a parent compare the approach, understand fee/value, confirm programme fit, then request an assessment.

### 2. Cross-programme pricing path

`/pricing`
→ `/book-demo`

When a parent is comparing general English pricing but does not yet know whether the child needs phonics, reading, grammar, writing, spoken English or public speaking, the assessment is the cleanest next decision. The pricing page already offers subject-aware programme links for parents who do know the learning need, so R4 does not force an unnecessary detour through the broad-English owner.

### 3. Reading fit path

`/reading-classes-for-kids`
→ `/reading-fluency-program`
→ `/book-demo`

Purpose: distinguish broad reading support from the narrower fluency intervention while preserving a direct assessment route from both owners.

### 4. Grammar / writing fit path

`/grammar`
→ `/writing-classes-for-kids`
→ `/book-demo`

The reciprocal handoff prevents grammar mechanics and writing-development intent from competing for the same query family.

### 5. Speaking / confidence fit path

`/speaking`
→ `/confidence-building-program-kids`
→ `/book-demo`

The speaking owner also keeps the spoken-English handoff. The confidence owner remains a narrow specialist route rather than becoming a second general speaking page.

### 6. Hyderabad local path

`/online-english-classes-hyderabad`
→ `/online-english-classes-for-kids`
→ `/book-demo`

The Hyderabad owner stays local-intent only and hands programme selection to the broad English chooser.

## Pricing-to-programme routes

`/pricing` keeps the general/non-phonics fee and value decision while linking to:

- `/phonics`
- `/reading-classes-for-kids`
- `/grammar`
- `/writing-classes-for-kids`
- `/spoken-english-classes-for-kids-online`
- `/speaking`

It also retains the direct `/book-demo` assessment path. This is deliberate: unresolved programme fit should be solved by the assessment rather than a forced extra commercial page.

Phonics keeps its distinct fee-research owner at `/phonics-fees-india`.

## Source validation

R4 adds a source-level test and standalone audit that verify:

- all 14 owner source files are represented;
- all 13 pre-conversion owners retain `/book-demo`;
- the strategic comparison, price, programme-fit and local handoffs exist in source;
- every R4 edge points only to an existing commercial owner;
- all six strategic journeys terminate at `/book-demo`;
- C2 ownership, C4 metadata controls and C5 conversion ownership remain unchanged.

## Implementation decision

**No live page rewrite is authorised by default in R4.**

The first validation run identified that the model had assumed a `/pricing` → `/online-english-classes-for-kids` handoff that was not present in source. Review showed that the existing pricing page already provides subject-aware programme handoffs plus a direct assessment route. R4 therefore corrected the graph to the stronger assessment-first path rather than adding a redundant navigation link merely to satisfy the model.

If later evidence identifies a genuine missing buyer-decision handoff, only that specific route should be repaired; unrelated body copy and metadata must remain untouched.

## Exit criteria

R4 is complete when:

1. dedicated R4 tests pass;
2. the source-level R4 audit passes;
3. upstream C1/C2/C4/C5 and C6-R0–R3 checks stay green;
4. type-check and full repository tests pass;
5. production build/prerender passes;
6. post-build C6 audits pass;
7. SEO smoke passes.

After R4, proceed to **C6-R5 — Validation + CI + Freeze**.
