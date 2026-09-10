# GR3 — Grammar & Writing: Writing Progression Architecture

Revision: `2026-09-10-gr3`

## Purpose

GR3 converts the broad writing nodes frozen in GR1 into one reusable internal progression for sentence construction, paragraph development, genre application and independent revision. It does **not** create new public SEO pages.

The protected progression is:

`word choice / idea units → complete sentence → expanded sentence → connected sentences → focused paragraph → cohesive paragraph → genre application → editing / revision / transfer`

After cohesive paragraph control, the graph branches into three parallel applications:

- descriptive writing;
- narrative writing;
- explanation & opinion writing.

Those genres are not prerequisites for one another. Editing and revision may follow any of the three genre branches.

## Frozen stage IDs

1. `word-choice-idea-units`
2. `complete-sentence`
3. `expanded-sentence`
4. `connected-sentences`
5. `focused-paragraph`
6. `cohesive-paragraph`
7. `descriptive-writing`
8. `narrative-writing`
9. `explanation-opinion-writing`
10. `editing-revision-transfer`

## Core teaching boundaries

GR3 protects eight writing principles:

1. meaning before length;
2. oral rehearsal before writing load when needed;
3. one useful expansion layer at a time;
4. connect ideas for a real semantic relationship;
5. paragraph function rather than fixed sentence count;
6. genres branch after paragraph cohesion rather than forming a rigid staircase;
7. revise meaning and organisation before surface polishing;
8. fresh-topic transfer is stronger evidence of mastery than copying a practised model.

## Stage contract

Each writing stage records:

- the output unit;
- its instructional purpose;
- required GR1 skills;
- supporting GR2 tense/control nodes;
- predecessor and next-stage relationships;
- prerequisite mode (`all` or `any`);
- three mastery signals;
- three common breakdowns;
- three teaching moves;
- a fresh-transfer check;
- existing public topic anchors;
- Beginner/Advanced Grammar curriculum anchors.

This creates a stable contract for GR4 parent-problem diagnosis, GR5 practice utilities and GR6 semantic journeys.

## GR1 integration

GR3 deliberately reuses the GR1 taxonomy rather than introducing another grammar model. Across the ten writing stages, every GR1 skill has at least one authentic writing application, including sentence foundations, word classes, agreement, tenses, clauses, punctuation, paragraph writing, composition and editing/revision.

## GR2 integration

Every GR2 tense/control node is connected to writing use. Examples include:

- simple present → complete/connected sentences and description;
- present continuous → description;
- simple past + past continuous + past perfect → narrative;
- simple future + future forms → explanation/opinion where prediction or future meaning is required;
- present perfect → explanation/opinion where present-linked past meaning is useful;
- tense consistency/transfer → paragraphs, narrative, explanation/opinion and editing.

This prevents GR2 from becoming an isolated tense-drill system.

## Curriculum alignment

GR3 is anchored to the existing Tiny Steps Grammar curriculum rather than inventing a second syllabus.

### Beginner Grammar examples

- Nouns, Verbs, Adjectives;
- Simple Sentences;
- Sentence Formation;
- Conjunctions;
- Expanding Sentences;
- Picture Description;
- Paragraph Writing;
- Overall Revision.

### Advanced Grammar examples

- Subject, Verb & Object;
- Expanding a Basic Sentence;
- Compound Sentences;
- Sentence Combining & Sentence Variety;
- Building a Powerful Paragraph;
- Cohesion & Paragraph Flow;
- Narrative Speaking & Writing;
- Description & Explanation;
- Opinion, Reason & Evidence;
- Sentence Repair;
- Final Grammar, Speaking & Writing Mastery Showcase.

The GR3 test and audit guard declared lesson titles against `src/content/courses.ts`.

## Existing public ownership only

GR3 attaches to established owners/supporting pages such as:

- grammar progression;
- sentence formation;
- conjunctions;
- paragraph writing;
- creative writing;
- tenses;
- writing classes;
- grammar editing;
- grammar assessment;
- grammar-transfer mistakes.

GR3 itself has no `path`, `ownerPath`, `proposedPath`, query intent or publication approval field. It therefore cannot silently create or claim a new public SEO owner.

## Validation contract

The GR3 gate must keep all of the following green:

- exactly 10 frozen writing stages;
- exactly 11 progression edges;
- exactly 3 parallel genre branches;
- all GR1 skills connected to writing application;
- all GR2 tense/control nodes connected to writing application;
- every curriculum anchor present in the current Grammar curriculum;
- every public topic anchor already owned by the canonical ownership graph;
- no public-route or ownership leakage;
- GR1/GR2/R17/R19 regressions;
- TypeScript;
- full build/prerender;
- SEO smoke.

## GR3 boundary

GR3 defines **how writing develops and transfers**. It does not yet define the parent-facing problem taxonomy, practice-utility inventory or final semantic journey wiring.

Those remain:

- **GR4** — Parent Problem Architecture
- **GR5** — Practice Utilities
- **GR6** — Semantic Journeys
- **GR7** — Final Closure Audit and freeze
