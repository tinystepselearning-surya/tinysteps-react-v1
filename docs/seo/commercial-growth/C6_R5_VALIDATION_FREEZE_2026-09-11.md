# C6-R5 — Validation + Freeze

**Date:** 11 September 2026  
**Status:** VALIDATION IMPLEMENTED — FREEZE REQUIRES GREEN CI

## Mission

Close the C6 buyer/comparison/fees workstream as one validated system and prevent routine commercial-page expansion from reopening settled ownership decisions.

C6-R5 does **not** introduce another commercial feature. It verifies that R0–R4 work together, that the existing 14-owner architecture remains intact, and that the next commercial SEO work can move to C7–C9 while C4 continues its independent observation window.

## Frozen C6 outcome

Once the R5 pipeline is green, the C6 workstream status becomes:

`frozen`

The frozen architecture remains:

- **14 canonical commercial owners**
- **1 dedicated phonics comparison owner:** `/best-online-phonics-classes-for-kids-in-india`
- **1 dedicated phonics fee-research owner:** `/phonics-fees-india`
- **1 cross-programme fee/value owner:** `/pricing`
- **1 conversion owner:** `/book-demo`
- **13 pre-conversion owners with a direct assessment path**
- **6 validated strategic buyer journeys**
- **5 parent enrolment decision gates on `/book-demo`**

## R0–R5 accounting

### R0 — Buyer intent coverage audit

Validated comparison, price and enrolment evidence across the C1/C2 commercial system and established that the existing phonics comparison, phonics fee-research and general pricing surfaces were structurally sound.

### R1 — Evidence validation + buyer architecture

Converted evidence into explicit ownership decisions. No new commercial URLs were authorised. Non-phonics fee intent remained consolidated to `/pricing` and only `/pricing` was approved for R2 implementation.

### R2 — Fees/value decision support

Implemented subject-aware fee/value navigation inside `/pricing` for Reading, Grammar, Writing, Spoken English and Public Speaking while preserving the separate phonics fee-research owner and all C4-controlled metadata.

### R3 — Parent decision framework

Formalised five post-demo decision gates on `/book-demo`: assessment/programme fit, teacher/trial fit, class structure/outcomes, practical schedule/format/price fit, and progress expectations. No second enrolment or payment owner was created.

### R4 — Internal commercial paths

Validated the actual source-level internal graph across all 14 owners, retained a direct `/book-demo` path from every pre-conversion owner, and froze six strategic buyer journeys without forcing unnecessary backward or redundant handoffs.

### R5 — Validation + freeze

Adds the final aggregate contract, tests and standalone audit. CI must validate C1/C2/C4/C5, C6-R0–R5, type-check, the full repository test suite, production build/prerender, post-build C6 audits and SEO smoke before the workstream is considered frozen.

## Freeze guardrails

After R5 passes:

- no new comparison/fee/best/city/country/AI-style commercial URL is created as routine C6 work;
- C2 ownership remains frozen;
- C4-controlled title, description and canonical experiments remain untouched until the C4 evidence gate allows a change;
- `/book-demo` remains the single conversion owner;
- `/pricing` remains the general/non-phonics fee and value owner;
- declared operating priors remain heuristics unless measured by the C0/C5 attribution system;
- C6 is reopened only for new measured evidence or a verified defect.

## C4 remains active

C6 freeze does **not** freeze or cancel C4.

C4 continues its post-C3 observation and evidence-gated CTR experiment process independently. C6 simply commits not to disturb those controls while the measurement window is active.

## Post-freeze work

Once C6 is frozen, commercial growth proceeds to:

1. **C7 — Knowledge → Commercial Conversion Graph**
2. **C8 — Trust / Evidence / Differentiation**
3. **C9 — External Authority & Brand Search Growth**

Bug fixes are still allowed if they preserve the frozen C2 ownership map, active C4 controls and C5 conversion-owner contract.

## R5 validation gates

R5 is complete only when all of the following pass on the R5 branch/PR:

1. C6-R0 buyer intent tests and audit
2. C6-R1 architecture + R2 pricing-support tests and audit
3. C6-R3 parent decision framework tests and audit
4. C6-R4 internal-path tests and audit
5. C6-R5 freeze tests and standalone audit
6. C5 decision-flow audit
7. C4 CTR governance audit
8. C2 ownership/cannibalisation audit
9. C1 observed search evidence audit
10. TypeScript type-check
11. Full repository test suite
12. Ask Tiny Steps production build configuration validation
13. Production build and prerender
14. Post-build C6-R0–R5 audits
15. SEO smoke

## Files

- `src/lib/commercialC6ValidationFreeze.ts`
- `src/tests/seo/commercialC6ValidationFreeze.spec.ts`
- `scripts/audit-commercial-c6-r5-validation-freeze.mjs`
- `docs/seo/commercial-growth/C6_R5_VALIDATION_FREEZE_2026-09-11.md`
- `.github/workflows/commercial-c6-buyer-intent-audit.yml`

## Exit decision

If every R5 validation gate is green, mark:

> **C6 — Buyer / Comparison / Fees Decision Architecture: 🔒 Frozen**

Then begin C7 without reopening C6 unless new measured evidence or a verified architecture defect justifies it.
