# R19 — Grammar & Writing Semantic Journeys

## Goal

Connect the R18 grammar/writing guides and the strongest existing grammar resources into explicit skill relationships without rewriting the historical Brick 6 graph or changing canonical/commercial ownership.

R19 is a semantic-linking brick. It publishes no new content pages.

## Ownership additions

R18 already owns the two new parent intents:

- `punctuation-capitalisation-guide` → `/blog/punctuation-and-capital-letters-for-kids`
- `paragraph-writing-guide` → `/blog/how-to-teach-paragraph-writing-to-kids`

R19 formally names six strong existing pages that R17 protected but which did not yet have additive canonical topic IDs:

- `grammar-tenses-guide` → `/blog/grammar-tenses`
- `subject-verb-agreement-guide` → `/blog/grammar-subject-verb`
- `conjunctions-guide` → `/blog/grammar-conjunctions`
- `creative-writing-guide` → `/blog/grammar-creative-writing`
- `grammar-editing-guide` → `/blog/grammar-editing-camp`
- `grammar-assessment-guide` → `/blog/grammar-assessment`

This names existing ownership; it does not transfer URLs or create redirects.

## Composition order

Runtime semantic navigation composes in this order:

1. historical Brick 6 semantic links;
2. additive R16 reading semantic links;
3. additive R19 grammar/writing semantic links;
4. deduplicate destinations;
5. apply the final display limit.

This order keeps previously established links stable and lets later bricks add only the missing relationships.

## R19 journeys

### Punctuation & capitals

`punctuation-capitalisation-guide`

- prerequisite → sentence formation
- related → grammar progression
- practice → grammar editing
- practice → grammar practice

### Paragraph writing

`paragraph-writing-guide`

- prerequisite → sentence formation
- related → conjunctions
- related → creative writing
- practice → grammar editing

### Tenses

`grammar-tenses-guide`

- related → subject–verb agreement
- diagnostic → grammar transfer mistakes
- practice → grammar practice

### Subject–verb agreement

`subject-verb-agreement-guide`

- related → tenses
- diagnostic → grammar transfer mistakes
- practice → grammar practice

### Conjunctions

`conjunctions-guide`

- prerequisite → sentence formation
- next → paragraph writing
- practice → sentence building

### Creative writing

`creative-writing-guide`

- prerequisite → paragraph writing
- practice → grammar editing
- related → grammar progression

### Editing

`grammar-editing-guide`

- diagnostic → grammar transfer mistakes
- related → punctuation & capitals
- related → grammar assessment

### Grammar assessment

`grammar-assessment-guide`

- diagnostic → grammar transfer mistakes
- related → grammar progression
- assessment → free assessment booking

The assessment relation exists in graph data but remains excluded from the educational article pathway UI, preserving the separation between educational navigation and conversion CTAs.

## Guardrails

R19 must preserve:

- historical Brick 6 journeys unchanged for unaffected pages;
- R16 reading journeys unchanged;
- `/grammar` as live grammar programme owner;
- `/writing-classes-for-kids` as writing programme route;
- the two R18 article owners;
- maximum four links per additive journey;
- no duplicate destinations per journey;
- at most one assessment/programme edge per journey;
- acyclic `next` relationships;
- no invented journey for unrelated routes.

## Rendered behavior

`BlogSemanticPathway` uses the R19 adapter. It still:

- displays a maximum of four educational links;
- excludes `assessment` and `programme` relations;
- emits semantic relation/topic data attributes;
- uses canonical owner URLs resolved from the graph rather than hard-coded destination URLs in the component.

## Validation

Dedicated CI verifies:

- R19 ownership composition and uniqueness;
- source/target resolution;
- exact upstream regression samples;
- punctuation and paragraph journeys;
- existing grammar-guide journeys;
- acyclic `next` edges;
- component adapter/commercial boundaries;
- rendered semantic links after prerender;
- all R0–R18 tests/audits and rendered guards;
- typecheck, production build and SEO smoke.

## Merge policy

R19 is stacked on R18. Merge only in stack order and only with explicit approval.
