# GR7 — Grammar & Writing Closure / Freeze

Revision: `2026-09-10-gr7`

Status: **FROZEN after cumulative GR7 CI is green on the reconciled Session B branch.**

## Purpose

GR7 closes Session B. It does not add another grammar content layer, another URL family, or another taxonomy. It verifies that GR1–GR6 collectively form a complete Grammar & Writing knowledge, diagnostic, practice and semantic system and then freezes informational expansion.

The frozen architecture is:

`GR1 taxonomy → GR2 tense system → GR3 writing progression → GR4 parent problems → GR5 practice utilities → GR6 semantic graph → GR7 closure governance`

## Frozen scope

### GR1 — Core taxonomy

- 9 R17 knowledge domains
- 14 stable grammar/writing skill nodes
- explicit prerequisite and next-skill relationships
- all domains represented

### GR2 — Tense architecture

- 9 tense/control nodes
- 5 meaningful tense comparisons
- 16 common child-error patterns
- one coherent tense system rather than one page per tense

### GR3 — Writing progression

- 10 writing stages
- word/idea units → complete sentence → expanded sentence → connected sentences → focused paragraph → cohesive paragraph
- three parallel genre applications: descriptive, narrative, explanation/opinion
- editing/revision/transfer as the terminal writing stage

### GR4 — Tier-1 parent problems

The following ten problem IDs are frozen:

1. `knows-rules-but-does-not-use-them`
2. `mixes-tenses`
3. `incomplete-sentences`
4. `very-short-sentences`
5. `repetitive-sentence-beginnings`
6. `limited-descriptive-vocabulary`
7. `cannot-organise-paragraphs`
8. `poor-punctuation`
9. `weak-editing`
10. `speaking-grammar-does-not-transfer-to-writing`

Every problem must remain connected to underlying GR1 skills, relevant GR2 tense/control nodes where applicable, GR3 writing stages, ordered practice handoffs and existing public owners.

### GR5 — Practice utilities

The following nine utility kinds are frozen:

1. `tense-comparison`
2. `sentence-builder`
3. `sentence-expansion`
4. `error-correction`
5. `punctuation-challenge`
6. `editing-practice`
7. `paragraph-organiser`
8. `conjunction-practice`
9. `tense-choice`

Each utility has three modes:

`guided → independent → transfer`

That produces 27 reusable, data-driven practice blueprints.

### GR6 — Semantic graph

- 90 semantic nodes
- every GR1–GR5 entity participates in the graph
- all 17 existing Grammar/Writing public canonical owners participate
- all 17 public owners have a semantic journey
- no orphan internal or public nodes
- the public graph reuses existing canonical owners only
- historical R19 journeys remain preserved

## Eight closure criteria

GR7 freezes only when all eight criteria are satisfied:

1. **Taxonomy complete** — all nine R17 domains map into GR1.
2. **Tense system complete** — GR2 provides the full tense/control/comparison/error architecture.
3. **Writing progression complete** — GR3 provides sentence-to-composition-to-editing progression.
4. **Tier-1 parent problems covered** — all ten GR4 problems have diagnostic, skill, practice and public-owner paths.
5. **Practice layer complete** — all nine GR5 utilities exist with guided/independent/transfer blueprints.
6. **Semantic graph closed** — GR6 has no orphan internal nodes or public owners.
7. **Canonical ownership stable** — the 17 existing Grammar/Writing owners remain unique and no competing thin owner is created.
8. **Technical SEO and CI green** — cumulative GR1–GR7 tests/audits, canonical ownership, shadowing, TypeScript, production build/prerender, rendered semantic checks and SEO smoke all pass on the reconciled branch head.

## Publication policy after freeze

Informational expansion is **FROZEN**.

The following stay on HOLD unless new evidence justifies them:

- one page per grammar label
- one page per tense
- one page per punctuation mark
- near-identical parent-problem pages
- worksheet/page factories built only from internal taxonomy nodes
- duplicate search-intent owners

A new Grammar/Writing canonical owner requires a demonstrated user, curriculum or search-intent gap. An internal node, child-error pattern or practice blueprint is not sufficient evidence by itself.

Practice utilities may later be exposed through existing practice owners, but publication is a separate execution decision. Commercial SEO/lead-growth work is also a separate project after the knowledge-base sessions are closed.

## GR7 code contract

Runtime governance manifest:

`src/lib/grammarWritingGr7Closure.js`

It freezes:

- Session B revision chain
- exact architecture counts
- exact Tier-1 parent-problem IDs
- exact GR5 practice vocabulary
- eight closure criteria
- post-freeze publication policy
- immutable downstream closure snapshot

## GR7 validation contract

Dedicated test:

`src/tests/seo/grammarWritingGr7Closure.spec.ts`

Dedicated audit:

`scripts/audit-grammar-writing-gr7-closure.mjs`

Dedicated CI:

`.github/workflows/gr7-grammar-writing-closure.yml`

The GR7 workflow must run:

- GR1–GR7 tests
- R17 and R19 regression tests
- GR1–GR7 audits
- canonical ownership audit
- shadowing audit
- TypeScript
- full production build/prerender
- rendered R19 semantic journey audit after build
- SEO smoke

The repository build itself already includes sitemap generation, rendered SEO checks, route integrity, indexation/indexability checks, GSC audits, public bundle checks and public-offer consistency checks, so GR7 uses the production build as the technical SEO integration gate rather than duplicating those scripts separately.

## Branch / merge rule

All GR1–GR7 work remains on:

`seo/gr1-grammar-knowledge-taxonomy`

PR:

`#281 — Session B — Grammar & Writing GR1–GR7`

Before final merge, the branch must be reconciled with then-current `main` and the full GR7 workflow must pass on that reconciled head.

**Do not merge to `main` as part of building GR7.** Final merge requires explicit approval after the final reconciled validation is green.

## End state

When the reconciled GR7 head is green:

**SESSION B — Grammar & Writing Knowledge Base Completion = 🔒 FROZEN**

Further work should shift from informational expansion to execution, distribution, practice presentation, conversion, or the separate commercial SEO/lead-growth project unless new evidence reopens a specific knowledge gap.
