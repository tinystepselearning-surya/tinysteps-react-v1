# GR4 — Grammar & Writing Parent Problem Architecture

**Status:** Session B / GR4

**Revision:** `2026-09-10-gr4`

## Mission

Translate the most important parent-observed grammar and writing struggles into one reusable diagnostic layer that sits on top of GR1 taxonomy, GR2 tense control and GR3 writing progression.

GR4 is **not** a page-generation programme. Different parent wording does not automatically justify a new URL. Existing diagnostic, skill and writing owners remain authoritative where they already answer the need.

## Frozen Tier-1 problem set

| Order | Parent problem | Primary diagnosis | Existing public coverage |
|---|---|---|---|
| 1 | Knows grammar rules but does not use them | Grammar transfer | Direct existing diagnostic owner |
| 2 | Mixes tenses | Tense meaning, form or connected-language consistency | Existing tense + transfer + editing owners |
| 3 | Writes incomplete sentences | Sentence formation / fragment / oral-to-written structure | Direct existing diagnostic owner |
| 4 | Writes very short sentences | Sentence development after completeness | Existing sentence-formation + grammar progression owners |
| 5 | Repeats the same sentence beginnings | Sentence variety and cohesion | Existing paragraph + conjunction + creative-writing owners |
| 6 | Uses limited descriptive vocabulary | Word choice and purposeful description | Existing creative-writing + progression owners |
| 7 | Cannot organise paragraphs | Focus, relevance, order and cohesion | Existing paragraph-writing owner |
| 8 | Poor punctuation | Sentence boundaries and conventions under writing load | Existing punctuation + editing owners |
| 9 | Weak editing and revision | Independent detection, revision and repair | Existing editing + assessment + transfer owners |
| 10 | Speaking grammar does not transfer to writing | Oral-to-written transfer under transcription load | Direct grammar-transfer diagnostic + sentence-formation support |

## Diagnostic model

Every GR4 problem stores:

- a parent-observable description;
- at least three observable signals;
- at least four diagnostic questions;
- likely underlying breakdowns;
- one first teaching move;
- GR1 skill dependencies;
- GR2 tense/control dependencies where relevant;
- GR3 writing-stage locations;
- nearby problems that should be distinguished;
- a four-step or deeper intervention sequence;
- observable progress signals;
- recommended GR5 practice kinds;
- existing canonical-topic anchors and a coverage rationale.

This allows later layers to route from a symptom to an underlying skill without treating every symptom as its own curriculum topic.

## Critical boundaries

### Incomplete is not the same as short

`incomplete-sentences` owns fragments, missing core sentence information and unstable structure.

`very-short-sentences` starts **after the sentence is already complete**. The question becomes whether the task needs meaningful expansion, connection or explanation. A short effective sentence is not automatically a problem.

### Rule transfer is not the same as oral-to-written transfer

`knows-rules-but-does-not-use-them` covers the broad pattern where a child can recall or recognise a grammar rule but cannot retrieve it reliably in fresh language.

`speaking-grammar-does-not-transfer-to-writing` is narrower: the child can already produce the target accurately orally, but the structure, tense, agreement or conventions deteriorate once writing load is added. Its protected bridge is:

`SAY → HOLD → WRITE → READ BACK → COMPARE`

### Tense mixing is not one error

The parent phrase “mixes tenses” may represent:

- an insecure tense form;
- confusion between two meanings;
- clue-word matching without meaning;
- accidental drift across connected language;
- a broader controlled-practice transfer gap.

GR4 therefore routes tense mixing through the complete GR2 tense architecture instead of creating a single shallow rule.

### Paragraph problems are not solved by sentence count

The paragraph diagnosis protects the GR3 principle that a paragraph is a coherent unit of meaning, not a compulsory number of sentences. Diagnosis checks focus, relevance, order and cohesion before surface correction.

## Existing-owner policy

GR4 records two coverage modes:

- `direct-existing-owner` — an existing problem-aware diagnostic owner already directly owns the parent problem;
- `supported-by-existing-owners` — existing skill/writing/practice owners substantively answer the problem without needing another indexable diagnostic page.

Only three GR4 problems are intentionally marked `direct-existing-owner`:

1. knows rules but does not use them;
2. incomplete sentences;
3. speaking grammar does not transfer to writing.

The other seven are deliberately routed through existing authoritative pages. This is an anti-cannibalisation decision, not a statement that the parent concern is unimportant.

## GR1 / GR2 / GR3 coverage contract

GR4 is invalid if any frozen upstream architecture becomes disconnected:

- all 14 GR1 grammar/writing skill nodes must appear in at least one parent-problem diagnosis;
- all 9 GR2 tense/control nodes must appear in at least one parent-problem diagnosis;
- all 10 GR3 writing stages must appear in at least one parent-problem diagnosis.

This makes the parent-problem layer a diagnostic view of the same knowledge system rather than a parallel taxonomy.

## GR5 handoff

GR4 freezes the required GR5 practice-kind vocabulary without implementing the utilities:

1. `tense-comparison`
2. `sentence-builder`
3. `sentence-expansion`
4. `error-correction`
5. `punctuation-challenge`
6. `editing-practice`
7. `paragraph-organiser`
8. `conjunction-practice`
9. `tense-choice`

Every planned practice kind already has at least one GR4 parent-problem use case. GR5 must implement reusable, data-driven utilities against this vocabulary rather than inventing an unrelated activity taxonomy.

## Publication boundary

GR4 adds no:

- public route;
- indexable page;
- sitemap target;
- new canonical topic owner;
- new query intent;
- curriculum lesson;
- R19 semantic journey rewrite.

It stores canonical **topic IDs**, never hard-coded public paths, and resolves those IDs through the established ownership registry.

## Closure conditions

GR4 is green when:

- the 10 Tier-1 parent problems remain stable;
- diagnostic and intervention fields are complete;
- every GR1, GR2 and GR3 node is represented;
- every GR5 practice kind has a parent use case;
- direct owners resolve to existing diagnostic owners;
- supported problems reuse existing authoritative owners;
- no publication fields or hard-coded `/blog/` routes leak into the architecture;
- GR1→GR4 regression tests, audits, typecheck, production build/prerender and SEO smoke are green.

After GR4 freezes, **GR5 builds the reusable practice utility layer** against these diagnosed needs.
