# C6-R3 — Parent Decision Framework

**Date:** 11 September 2026  
**Status:** Implemented on existing owner  
**Canonical owner:** `/book-demo`

## Objective

Answer the post-demo parent question without creating another commercial URL or conversion owner:

> We completed a demo/assessment. What should we confirm before enrolling?

C6-R3 is deliberately conservative. The existing `/book-demo` page already contains the required decision-support surfaces from C3/C5, so this brick formalises, tests and protects that framework rather than adding duplicate copy during the active C4 observation window.

## Evidence basis

C1 contains three explicit enrolment-stage AI-style research prompts:

- `ai-global-demo-to-enrol` — teacher fit, price, schedule, programme fit and progress expectations
- `ai-global-phonics-enrol` — assessment result, programme choice, blending need and enrolment
- `ai-global-speaking-enrol` — trial experience, outcomes, class structure and enrolment

C1 also contains a four-query enrolment family covering broad English, phonics, public speaking and 1:1 tutoring.

These are research/evidence inputs. They are not measured conversion analytics.

## Five decision gates

### 1. Assessment result and programme fit

Parent question: **What did the assessment show, and why is this the right programme and starting point?**

Existing `/book-demo` support:

- “What Will You Understand After the Assessment?”
- “What Can the Assessment Recommend?”
- recommended programme
- recommended starting point
- curriculum/programme handoffs

### 2. Teacher and trial fit

Parent question: **Did the child engage with the live teacher and does the teaching experience feel suitable?**

Existing support:

- the live 1:1 assessment itself
- “What Happens in the Demo Assessment?”
- “Watch Class Samples” handoff

### 3. Class structure and intended outcomes

Parent question: **What will classes focus on, how will they be delivered, and what should improve first?**

Existing support:

- priority skill
- recommended starting path
- class-format decision
- curriculum and class-sample handoffs

### 4. Schedule, format and price fit

Parent question: **Do the available timings, class format and current pricing work for the family before committing?**

Existing support:

- available timings language
- 1:1 vs available small-group format check
- pricing decision check
- `/pricing` handoff

### 5. Progress expectations

Parent question: **What should the family expect to understand next, and what should not be over-promised from one assessment?**

Existing support:

- “Next steps” outcome
- assessment-result caveat
- explicit statement that individual learning progress varies

## Why no new body-copy change is required

The current `/book-demo` page already contains all five evidence-backed decision gates across its assessment flow, programme routing, outcomes, “Before You Enrol” section, FAQ, class-sample handoff and pricing handoff.

Adding another large decision section would duplicate existing content and create unnecessary copy churn while C4 is observing controlled commercial metadata. C6-R3 therefore implements the framework in machine-readable governance, tests and CI, and verifies the live owner already satisfies it.

## Guardrails

- No new commercial URLs.
- No C2 ownership mutation.
- No title change.
- No meta-description change.
- No canonical change.
- No C4 control mutation.
- `/book-demo` remains the single C5 conversion owner.
- No direct payment flow is introduced.
- No guaranteed outcome language.
- C1 declared demo-to-enrolment and budget-drop-off priors remain planning heuristics only; they must not be presented as measured funnel performance.

## Files

- `src/lib/commercialC6ParentDecisionFramework.ts`
- `src/tests/seo/commercialC6ParentDecisionFramework.spec.ts`
- `scripts/audit-commercial-c6-r3-parent-decision.mjs`
- `docs/seo/commercial-growth/C6_R3_PARENT_DECISION_FRAMEWORK_2026-09-11.md`

## Exit criteria

C6-R3 is complete when:

1. all five evidence-backed decision gates are represented;
2. every gate maps to existing `/book-demo` surface evidence;
3. the C5 single conversion owner remains `/book-demo`;
4. no C4 metadata control changes;
5. declared operating priors remain clearly non-measured;
6. dedicated R3 tests, audit, full repository tests, build/prerender and SEO smoke pass.
