# GR2 — Tense Knowledge Architecture

**Session:** B — Grammar & Writing  
**Revision:** `2026-09-10-gr2`  
**Branch:** `seo/gr1-grammar-knowledge-taxonomy`  
**Parent skill:** GR1 `tenses`  
**Publication effect:** none

## Purpose

GR2 expands the broad GR1 **Tenses** node into a reusable internal tense system for curriculum reasoning, writing progression, parent-problem diagnosis, practice utilities and later semantic journeys.

It does **not** create one page per tense. The established public owner remains `/blog/grammar-tenses`; detailed tense concepts live as internal semantic nodes unless a later evidence-led content decision proves that a separate public utility is necessary.

## Teaching principles

GR2 freezes six principles:

1. **Meaning before label** — choose tense from intended time meaning and context.
2. **Clues, not rules** — time words support the decision but do not mechanically determine tense.
3. **Form and use together** — children learn a form with the meaning it expresses.
4. **Oral → written transfer** — stabilise tense orally when writing load masks the language skill.
5. **Future time is a system** — `will` is useful but not the only future construction.
6. **Connected-language check** — mastery requires maintaining or intentionally shifting tense across speaking and writing.

## Frozen tense/control nodes

| Order | ID | Skill |
| ---: | --- | --- |
| 1 | `simple-present` | Simple Present |
| 2 | `simple-past` | Simple Past |
| 3 | `simple-future-will` | Simple Future (`will`) |
| 4 | `present-continuous` | Present Continuous |
| 5 | `past-continuous` | Past Continuous |
| 6 | `future-forms` | Future Forms & Choice |
| 7 | `present-perfect` | Present Perfect |
| 8 | `past-perfect` | Past Perfect |
| 9 | `tense-consistency-transfer` | Tense Consistency & Transfer |

The order follows the Tiny Steps curriculum logic: secure basic time frames first, then continuous contrasts, broader future choice, perfect forms, and finally connected-language transfer.

## High-value comparisons

GR2 freezes five comparisons because these are where tense knowledge becomes choice rather than memorisation:

1. `simple-present-vs-present-continuous`
2. `simple-past-vs-past-continuous`
3. `future-forms-choice`
4. `present-perfect-vs-simple-past`
5. `past-perfect-vs-simple-past`

Each comparison stores a decision question, semantic distinction, contrast examples, common errors and curriculum anchors.

## Future-time boundary

Tiny Steps may use the school-friendly label **Simple Future** for `will + base verb`, but GR2 does not teach English future time as one conjugated tense.

The broader future node covers:

- `will + base verb` for suitable predictions, decisions, promises and offers;
- `be going to + base verb` for intentions/plans and evidence-based predictions;
- present continuous for planned arrangements;
- simple present for fixed schedules/timetables where appropriate.

The forms are related but not interchangeable.

## Perfect-tense boundary

**Present Perfect** is not treated as simply another past tense. GR2 explicitly contrasts present-linked past meaning with a finished past-time reference.

**Past Perfect** is not required simply because two events are in the past. It is used when an earlier-past relationship needs to be made explicit.

## Diagnostic error layer

GR2 records 16 reusable child-error patterns across six categories:

- **form** — e.g. missing auxiliary, double past marking, wrong verb after `will`;
- **meaning** — e.g. simple present for a right-now action, present perfect with a finished past time;
- **morphology** — e.g. irregular-past overgeneralisation such as `eated`;
- **consistency** — tense drift across connected sentences;
- **strategy** — mechanical clue-word matching without meaning;
- **transfer** — correct controlled worksheets but unstable spontaneous speaking/writing.

Every error pattern contains:

`incorrect example → correction → diagnosis → teaching response`

This structure is designed for GR4 parent-problem ownership and GR5 practice generation.

## Curriculum alignment

GR2 is anchored to the existing curriculum rather than inventing another syllabus.

### Beginner Grammar

- Lesson 25 — Simple Present Tense
- Lesson 26 — Simple Past Tense
- Lesson 27 — Simple Future Tense
- Lesson 28 — Revision — Tenses Basics

### Advanced Grammar

- Lesson 2 — Simple Present Tense
- Lesson 3 — Simple Past Tense
- Lesson 4 — Simple Future Tense
- Lesson 5 — Simple Tenses Revision
- Lesson 7 — Present Time: Simple Present vs Present Continuous
- Lesson 8 — Past Time: Simple Past vs Past Continuous
- Lesson 9 — Talking About the Future Naturally
- Lesson 10 — Present Perfect & Simple Past
- Lesson 11 — Past Perfect & Event Sequence
- Lesson 12 — Tense Mastery: Speak, Write & Edit

Tests verify declared GR2 curriculum anchors against the actual `curriculumBySlug` source.

## Relationship to GR1

GR2 does not replace the GR1 graph.

`GR1 Verbs → Agreement → Tenses`

becomes internally:

`Simple Present → Simple Past → Simple Future`

with branching into continuous forms, future-form choice and perfect forms, converging on:

`Tense Consistency & Transfer`

Then the existing GR1 graph continues:

`Tenses → Clauses & Sentence Combining → Paragraph Writing → Editing & Revision`

## Public ownership and SEO boundary

The canonical public owner remains:

`grammar-tenses-guide → /blog/grammar-tenses`

GR2 adds no route, slug, sitemap entry, canonical topic, query-intent owner or indexable page. The internal architecture deliberately contains no `/blog/` paths.

## GR2 closure conditions

GR2 is complete when:

- all 9 tense/control nodes are stable and resolvable;
- all 5 high-value comparisons are explicit;
- future-time choice is represented as a multi-form system;
- present perfect vs simple past is explicit;
- past perfect event sequencing is explicit;
- tense consistency and purposeful tense shift are explicit;
- common child errors cover form, meaning, morphology, consistency, strategy and transfer;
- every node connects to writing application;
- declared curriculum anchors resolve to the current Grammar curriculum;
- `/blog/grammar-tenses` remains the single public owner;
- no new public tense URLs are created;
- GR1, R17 and R19 regressions remain green;
- typecheck, build/prerender and SEO smoke remain green.

## Downstream boundary

GR3 will reuse these tense IDs when modelling the writing progression from sentence through paragraph, genre writing and editing. GR4 and GR5 will reuse the diagnostic/error IDs and tense comparisons rather than creating a second tense model.
