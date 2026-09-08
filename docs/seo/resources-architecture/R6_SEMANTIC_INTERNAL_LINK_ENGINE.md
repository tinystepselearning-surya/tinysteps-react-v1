# Resources Architecture — R6 Semantic Internal-Link Engine

Brick 6 turns the Brick 5 canonical topic-ownership map into a controlled internal knowledge graph.

## Purpose

Internal links should help a parent or crawler understand the learning relationship between pages. They should not be generated from publication order, keyword similarity, or a generic same-category widget.

The Brick 6 model is:

**prerequisite → current skill → next skill → related topic → diagnostic help → practice → assessment/programme**

Only relationships with a clear user reason are registered.

## Canonical-owner rule

`src/lib/semanticInternalLinkRegistry.js` stores **topic IDs**, never copied destination URLs.

At runtime every destination is resolved through `canonicalTopicOwnershipRegistry.js` from Brick 5. This means:

- a semantic link cannot silently create a second topic owner;
- a deliberate future owner transfer only needs to happen in the canonical ownership layer;
- the link engine cannot keep pointing at a stale URL after ownership changes;
- practice, diagnostic, assessment and programme links can be validated by owner role.

## Supported relationship types

| Relation | Meaning |
| --- | --- |
| `hub` | broader subject/gateway context |
| `prerequisite` | knowledge or skill worth reviewing first |
| `next` | directed next learning step |
| `related` | useful adjacent explanation |
| `diagnostic` | established owner for a visible learning problem |
| `practice` | existing activity/game/practice owner |
| `assessment` | Tiny Steps assessment conversion route |
| `programme` | established commercial programme owner |

The `next` graph must remain acyclic. Bidirectional context is allowed through `related`, `prerequisite`, or `diagnostic` where educationally useful.

## Initial graph scope

Brick 6 deliberately starts with high-confidence journeys around the established R4/R5 authority pages rather than attempting to connect every URL on the site.

### Phonics & Reading

The initial graph covers:

- parent phonics overview;
- phonics definition;
- SATPIN;
- blending progression;
- blending practice;
- CVC decoding;
- ABC-known-but-reading-fails diagnostic;
- letter-sounds-known-but-word-reading-fails diagnostic;
- reading fluency guidance;
- related letter-sound, word-building and reading practice owners.

### Grammar & Writing

The initial graph covers:

- grammar-to-writing progression;
- sentence formation;
- grammar knowledge that does not transfer into independent use;
- grammar and sentence-building practice;
- the existing grammar/writing programme owners.

### Speaking & Communication

The initial graph covers:

- speaking-confidence progression;
- one-word-answer diagnostic;
- understands-English-but-does-not-speak diagnostic;
- shy-child confidence problem route;
- speaking practice and the established speaking programme owners.

## Visible article integration

`BlogSemanticPathway.tsx` is rendered immediately before the existing article-end conversion card for articles that have an explicit semantic journey.

The visible block is labelled **Continue the learning path** and shows up to four curated educational links.

Commercial separation is enforced in the UI:

- `assessment` and `programme` relationships are **not rendered inside the learning-path block**;
- the existing conversion card remains the distinct commercial surface;
- pages with no explicit semantic journey receive no generated fallback block.

This prevents Brick 6 from becoming a new CTA or keyword-linking system.

## Guardrails

The Brick 6 audit fails when:

1. a semantic source or target topic does not exist in Brick 5;
2. a link resolves back to the same canonical owner;
3. a journey has more than four curated links;
4. a source repeats the same target;
5. a practice relationship does not land on a practice/activity owner;
6. a diagnostic relationship does not land on a diagnostic/problem owner;
7. an assessment relationship does not land on the conversion owner;
8. a programme relationship does not land on a commercial owner;
9. prerequisite/next language disguises a commercial destination;
10. a journey contains more than one commercial/conversion destination;
11. a required core editorial/diagnostic topic has no explicit outbound journey;
12. the directed `next` graph contains a cycle;
13. the runtime resolver returns a URL other than the Brick 5 canonical owner.

## Non-goals

Brick 6 does **not**:

- create new public routes;
- change canonicals or redirects;
- create programmatic phonics pages;
- add exact-match links throughout article body copy;
- alter existing article search-intent ownership;
- make Resources hubs own granular topics;
- replace the programme conversion system;
- generate links from keywords, embeddings, category similarity, or publication order.

## Acceptance criteria

Brick 6 is complete when:

- the semantic graph and runtime resolver are present;
- core R4/R5 articles have explicit journeys;
- visible semantic pathways render on eligible blog articles;
- commercial links stay visually separate from educational semantic links;
- Brick 6 audit passes;
- R0–R5 regression tests remain green;
- typecheck, production build/prerender, rendered Resources audit and SEO smoke remain green;
- repository-wide CI and existing GSC/SEO guards remain green.
