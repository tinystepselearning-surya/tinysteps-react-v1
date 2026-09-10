# GR6 — Grammar & Writing Semantic Journey Graph

Revision: `2026-09-10-gr6`

## Purpose

GR6 composes the frozen Session B layers into one semantic system without creating another taxonomy or another publication layer.

The target journey is:

`concept → prerequisite → comparison → common error → writing application → practice → next concept`

Not every grammar concept needs an artificial comparison. Explicit comparison nodes are used where GR2 has defined a genuine semantic contrast; other concepts continue through prerequisite, diagnosis, writing application, practice and next-skill relationships.

## Inputs

GR6 reuses, rather than copies:

- GR1 — 14 grammar/writing skill nodes;
- GR2 — 9 tense/control nodes, 5 comparisons and 16 error patterns;
- GR3 — 10 writing progression stages;
- GR4 — 10 Tier-1 parent problems;
- GR5 — 9 reusable practice utilities;
- R19 canonical ownership and its 8 existing grammar/writing semantic journeys.

## Semantic node model

GR6 has eight node kinds:

1. `skill`
2. `tense`
3. `comparison`
4. `error`
5. `writing-stage`
6. `parent-problem`
7. `practice`
8. `public-topic`

Current counts are:

| Layer | Nodes |
| --- | ---: |
| GR1 skills | 14 |
| GR2 tenses/control | 9 |
| GR2 comparisons | 5 |
| GR2 errors | 16 |
| GR3 writing stages | 10 |
| GR4 parent problems | 10 |
| GR5 practice utilities | 9 |
| Existing Grammar/Writing public owners | 17 |
| **Total** | **90** |

## Core relation sequence

GR6 freezes these instructional relations in order:

1. `prerequisite`
2. `comparison`
3. `common-error`
4. `writing-application`
5. `practice`
6. `next-concept`

Additional graph relations such as `diagnostic`, `public-anchor`, `related` and bounded `programme` edges are allowed where they connect the same architecture layers without changing ownership.

## Full tense journeys

Tenses are the richest explicit implementation of the complete sequence because GR2 already defines prerequisites, comparisons and diagnostic error patterns.

For every GR2 tense/control node, GR6 resolves:

- prerequisite tense(s), or the GR1 `tenses` parent for the GR2 root;
- exact GR2 comparison nodes;
- exact GR2 common-error nodes;
- GR3 writing stages where that tense is applied;
- GR5 practice utilities mapped to the tense;
- GR2 next tense/control nodes;
- after terminal `tense-consistency-transfer`, the next concept becomes GR1 `editing-revision`.

GR6 checks that comparison/error arrays exactly match GR2. They cannot drift independently.

## Broader grammar concepts

Every GR1 skill is connected to:

- its GR1 prerequisites and next skills;
- the GR3 writing stages that require it;
- the GR4 parent problems where it can break down;
- the GR5 practice utilities that exercise it.

This means grammar information is not allowed to terminate at a definition or worksheet label. Each skill must have a writing application and usable practice.

## Error → diagnosis → practice

GR2 error nodes connect back to the tense concept that owns them and forward into overlapping GR4 diagnostic problems.

GR4 problems then preserve their frozen ordered handoff into GR5 practice.

GR5 utilities link reciprocally back to their GR4 diagnoses.

This creates a traceable chain from an observed mistake to a teaching response rather than a disconnected list of errors.

## Writing progression integration

GR3 writing stages keep their prerequisite/next-stage graph and connect to all GR5 utilities that practise those stages.

Every writing stage also points only to existing public canonical topic owners through `public-anchor` relationships.

## Public semantic ownership

At GR6 time there are exactly 17 canonical owners whose subject is `grammar-writing`.

GR6 requires all 17 to have semantic connectivity. It does **not** create owner paths.

The eight focused R19 public journeys are imported unchanged. GR6 adds nine completion journey records for the remaining source owners:

- Grammar/Writing subject hub;
- live Grammar classes;
- Writing classes;
- grammar progression;
- sentence formation;
- grammar-transfer diagnostic;
- Grammar games category;
- sentence-building practice;
- focused Grammar practice game.

These completion records are semantic graph data. GR6 deliberately does not replace or mutate the historical R19 rendered adapter, so R19 regression output stays exact while Session B gains a complete owner graph for closure and future routing.

## Important SEO boundary

GR6 adds:

- no route;
- no sitemap target;
- no canonical owner;
- no query intent;
- no utility-specific SEO page;
- no tense/comparison/error micro-page.

All public destinations resolve through `R19_CANONICAL_TOPIC_OWNERSHIP`.

## Orphan protection

Module guards and the GR6 audit fail if:

- any GR1–GR5 semantic node has zero graph degree;
- any of the 17 Grammar/Writing public owners has no incoming or outgoing semantic connection;
- a semantic edge references an unknown node;
- a public journey leaves Grammar/Writing ownership;
- a public journey has duplicate targets or more than four destinations;
- a GR2 tense loses its prerequisite, error, writing, practice or next-concept path;
- historical R19 grammar-progression output changes.

## Runtime helpers

GR6 exposes:

- `getGrammarWritingGr6SemanticNode(ref)`;
- `getGrammarWritingGr6OutgoingEdges(ref, relation?)`;
- `getGrammarWritingGr6IncomingEdges(ref, relation?)`;
- `getGrammarWritingGr6TenseJourney(tenseId)`;
- `getGrammarWritingGr6PublicJourney(topicId)`;
- `getGrammarWritingGr6PublicLinksForPath(pathname, options?)`.

The public resolver is intentionally not made the rendered blog adapter in GR6. Final runtime/reconciliation decisions belong to GR7 after Session B is compared with then-current `main`.

## GR7 handoff

GR7 should use GR6 to prove:

- zero orphan internal nodes;
- zero orphan Grammar/Writing owners;
- exact GR1–GR5 coverage;
- stable canonical ownership;
- preserved R19 behavior;
- technical SEO and CI green after reconciliation with current `main`.
