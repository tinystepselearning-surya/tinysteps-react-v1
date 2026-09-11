# C7-R1 — Knowledge → Commercial Owner Mapping

Revision: `2026-09-11-c7-r1`

Status: `knowledge-owner-mapping-validated`

## Purpose

C7-R1 turns the C7-R0 conversion inventory into a deterministic owner map. Each commercially relevant knowledge surface receives at most one existing C2 commercial owner. Pure practice and home-routine discovery may remain intentionally unforced.

R1 is architecture-only. It does not edit live knowledge copy, add URLs, alter metadata, or mutate C2/C5/C6 ownership.

## Frozen baselines

- KB-FINAL remains frozen.
- C2 retains 14 commercial owner URLs.
- C4 experiment governance remains active.
- `/book-demo` remains the sole conversion owner.
- C6 buyer/comparison/fees architecture remains frozen.
- R1 also reads the final SP6 canonical ownership view so newer reading, grammar/writing and speaking knowledge owners are included beyond the older 51-post authority-link baseline.

## Mapping principles

1. Preserve an existing commercial handoff when it already points to the correct frozen owner.
2. Use a specialist owner only when the knowledge intent is specific enough to justify it.
3. Keep assessment first only when the existing journey already reflects an unresolved cross-programme need.
4. Do not force pure practice or parent-routine content into a sales CTA.
5. Do not create a new commercial owner to solve a linking problem.

## Key mappings

| Knowledge intent | Primary commercial owner |
| --- | --- |
| Phonics/decoding | `/phonics` |
| Phonics comparison | `/best-online-phonics-classes-for-kids-in-india` |
| Broad reading/comprehension | `/reading-classes-for-kids` |
| Explicit reading fluency | `/reading-fluency-program` |
| Grammar/sentence mechanics | `/grammar` |
| Writing/composition | `/writing-classes-for-kids` |
| Everyday spoken output/conversation | `/spoken-english-classes-for-kids-online` |
| Structured speaking/communication | `/speaking` |
| Explicit shyness/confidence | `/confidence-building-program-kids` |
| Broad/cross-skill English | `/online-english-classes-for-kids` |
| Ambiguous need already using assessment-first | `/book-demo` |
| Pure practice/home-routine discovery without commercial evidence | no forced owner |

## R0 gap resolved in architecture

`/blog/online-english-classes-for-kids-india` currently hands off to `/courses` and `/class-samples`. R1 assigns `/online-english-classes-for-kids` as the primary commercial owner. The current support destinations may remain evidence/discovery links.

This is a mapping decision only. R1 does not change the blog body.

## Specialist decisions

R1 explicitly maps:

- `/blog/how-to-improve-reading-fluency-in-children` → `/reading-fluency-program`
- `/slow-reader-child-help` → `/reading-fluency-program`
- `/shy-child-speaking-confidence` → `/confidence-building-program-kids`
- `/blog/child-understands-english-but-does-not-speak` → `/spoken-english-classes-for-kids-online`
- `/blog/how-to-teach-paragraph-writing-to-kids` → `/writing-classes-for-kids` when that knowledge owner is present in the final registry

## Decision states

Every mapped surface ends in one of four states:

- `KEEP_EXISTING_OWNER`
- `ADD_CONTEXTUAL_HANDOFF`
- `PRESERVE_ASSESSMENT_FIRST`
- `HOLD_SOFT_DISCOVERY`

`HOLD_SOFT_DISCOVERY` always has no forced commercial owner.

## Guardrails

- no live knowledge-page copy changes
- no blog-body changes
- no new knowledge URLs
- no new commercial URLs
- no C2 ownership mutation
- no C4 metadata mutation
- no C5 conversion-owner mutation
- no C6 architecture mutation
- `/book-demo` remains the single conversion owner

## Next

C7-R2 should convert this owner map into intent-based handoff rules: when a knowledge page should show a programme link, specialist programme link, supporting comparison/value link, or assessment-first next step. Live CTA placement remains deferred until those rules are validated.
