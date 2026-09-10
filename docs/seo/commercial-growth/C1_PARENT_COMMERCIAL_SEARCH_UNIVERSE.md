# C1 — Parent Commercial Search Universe

Revision: 2026-09-10-c1-r1  
Status: research-complete  
Depends on: C0 frozen, KB-FINAL frozen

## Mission

Build one classified commercial-search universe for parents considering Tiny Steps across phonics, reading, grammar, writing, spoken English, public speaking, communication, broad online English and 1:1 tutoring.

C1 is research only. It does not change public copy, titles, H1s, URLs, canonicals or keyword ownership. C2 owns canonical commercial keyword ownership.

## Parent decision journey

Every researched query is classified against the parent journey:

Problem → Solution → Provider research → Comparison → Price → Trial/demo → Enrolment

## Required accounting fields

The machine-readable registry at `src/lib/commercialC1SearchUniverse.ts` records:

- query
- subject
- intent
- parent stage
- demand signal
- commercial strength
- existing observed Tiny Steps surface
- current rank
- impressions
- CTR
- conversion relevance
- recommended research action
- evidence
- notes

Allowed research actions are KEEP, OPTIMISE, CONSOLIDATE, BUILD and HOLD. These are recommendations for C2 review, not implementation authorization.

## Evidence used in this C1 execution

1. Current Tiny Steps public commercial surfaces and frozen knowledge journeys.
2. Fresh commercial SERP observations on 10 September 2026 for phonics, reading, grammar, creative writing, spoken English, public speaking, communication, broad English, 1:1/tutor, fees and free-demo modifiers.
3. Five user-provided Google Search Generative AI Features exports covering May through 9 September 2026.
4. C0 commercial facts, attribution and qualified-lead measurement contract.
5. Competitor/provider patterns observed in current search results, including explicit 1:1 positioning, small-group positioning, fee disclosure, free/paid demo language, confidence outcomes and curriculum-led comparison language.

## Authenticated GSC limitation

The connected GSC integration returned insufficient authentication scope during this execution, so query-level GSC metrics were not available. C1 therefore deliberately leaves `currentRank`, `impressions` and `ctr` as `null` rather than fabricating values.

This is not a blocker for the research architecture. Before C2 final ownership decisions, authenticated query-level GSC data should be joined where available so high-value clusters can be prioritized using observed Tiny Steps demand as well as external commercial evidence.

## Google generative-search baseline

The uploaded exports show:

| Period | Impressions | Observed days | Avg/day |
| --- | ---: | ---: | ---: |
| 18–31 May 2026 | 1,037 | 14 | 74.1 |
| June 2026 | 3,037 | 30 | 101.2 |
| July 2026 | 7,207 | 31 | 232.5 |
| August 2026 | 9,756 | 31 | 314.7 |
| 1–9 September 2026 | 2,722 | 9 | 302.4 |

September's largest visible surfaces in the export include:

- `/free-letter-tracing-game-for-kids` — 802 impressions
- `/phonics` — 408
- `/blog/satpin-phonics-guide` — 325
- `/` — 193
- `/letter-tracing-with-sounds-game` — 86
- `/speaking` — 51
- `/best-online-phonics-classes-for-kids-in-india` — 43

Interpretation: Tiny Steps has meaningful generative-search discovery, but informational utilities currently absorb a substantial portion of that visibility. C1 treats this as supporting evidence only; C0-qualified organic leads remain the business KPI.

## Commercial search themes now represented

### Phonics

Provider terms, India modifiers, best/comparison, fees, 1:1, demo, age and blending/problem queries.

### Reading

Reading classes, struggling readers, fluency, comprehension, reading tutor and price intent.

### Grammar & writing

Grammar classes, sentence formation, school-answer improvement, grammar demo/fees, creative writing, paragraph writing, 1:1 writing and writing fees.

### Speaking & communication

Spoken English, fluency, shy-child needs, public speaking, stage fear, storytelling, debate, communication skills, confidence and 1:1 communication.

### Broad English & tutor

Online English classes, India and Hyderabad modifiers, best/comparison, fees, free trial, online English tutor, 1:1 tutor and subject-specific tutor variants.

## Current strategic signal

The strongest immediate commercial pattern is not a shortage of informational authority. Tiny Steps is already visible for phonics and multiple knowledge/utility surfaces. The commercial project should now use C1 evidence to decide exactly which high-value parent intents belong to existing commercial pages and which truly require a new owner.

That decision is C2.

## C1 completion gate

C1 is complete when:

- all planned subjects are represented;
- the parent decision journey is represented;
- every researched query is classified;
- missing authenticated metrics are explicitly null rather than invented;
- AI visibility is retained as supporting evidence, not substituted for qualified-lead measurement;
- C0 and KB-FINAL remain frozen;
- no canonical owner is assigned in C1;
- tests, audit, typecheck and repository validation pass on the exact C1 head.
