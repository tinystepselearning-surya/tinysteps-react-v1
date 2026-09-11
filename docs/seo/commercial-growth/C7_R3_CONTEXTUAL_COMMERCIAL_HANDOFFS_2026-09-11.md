# C7-R3 — Contextual Commercial Handoffs

Date: 2026-09-11
Status: IMPLEMENTED — VALIDATION IN PROGRESS

## Purpose

Implement the C7-R1 owner map and C7-R2 next-step rules on live knowledge surfaces without creating new URLs, editing individual blog bodies, changing C4-controlled metadata, or reopening frozen C2/C5/C6 ownership.

## Implemented surfaces

### Shared blog pipeline

`src/content/blog/shared/commercialHandoffs.ts` now applies the R2 rule for each individual blog path after title/editorial normalization.

The transformer:
- uses the R3 primary owner and optional secondary assessment exactly as authorised by R2;
- keeps `/book-demo` secondary when the programme need is already known;
- keeps comparison and fee research inside their dedicated owner;
- does not add a commercial prompt to `SOFT_DISCOVERY` content;
- may retain one useful non-commercial legacy support link such as a class sample, curriculum or parent resource;
- drops the generic `/courses` fallback once a precise frozen owner is known;
- falls back to the existing B7 authority-linking behaviour only when a blog has no C7 rule.

Important corrected routes include:
- `/blog/online-english-classes-for-kids-india` → `/online-english-classes-for-kids`;
- `/blog/child-understands-english-but-does-not-speak` → `/spoken-english-classes-for-kids-online` → `/book-demo`;
- `/blog/how-to-improve-reading-fluency-in-children` → `/reading-fluency-program`;
- phonics comparison content → `/best-online-phonics-classes-for-kids-in-india`.

### Focused phonics knowledge renderer

`src/pages/PhonicsKnowledgePage.tsx` now reads the R3 handoff for the current knowledge path.

Where R2 resolves a programme owner, the rendered next-step block shows that owner first. `/book-demo` appears only when R2 authorises assessment as a secondary step. If a page has no R3 handoff, the existing assessment fallback remains available.

## Protected existing placements

R3 does not duplicate a new generic CTA block where the page already acts as a discovery/decision hub or already exposes the correct next steps. Protected surfaces are:
- `/blog` — discovery library with intent-specific article routes;
- `/parents` — multi-programme concern routing plus assessment;
- `/resources/phonics` — phonics programme plus assessment;
- `/resources/grammar` — grammar programme plus assessment;
- `/resources/speaking` — speaking programme plus assessment;
- `/child-not-reading-properly` — phonics/reading routes plus assessment;
- `/slow-reader-child-help` — specialist reading-fluency owner plus assessment;
- `/shy-child-speaking-confidence` — confidence-building owner plus assessment.

R3 contains a runtime coverage guard: every non-soft R2 rule must either use one of the shared R3 renderers or belong to this explicit protected-placement set. Any uncovered route fails validation.

## Guardrails

- no new knowledge URLs;
- no new commercial URLs;
- no direct edits to individual blog post bodies;
- no C2 ownership changes;
- no C4 title/meta/canonical changes;
- no C5 conversion-owner changes;
- no C6 architecture changes;
- `/book-demo` remains the single conversion owner;
- maximum two commercial prompts per R3 knowledge handoff.

## Next

C7-R4 should add knowledge-conversion measurement so the path from informational landing page → commercial owner → `/book-demo` → qualified lead can be evaluated without treating CTA clicks as the qualified-lead source of truth.
