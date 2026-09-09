# Resources R16 — Reading Semantic Journeys

Revision: `2026-09-09-r16`

## Purpose

R16 closes the discovery gap created when R15 introduced three new reading knowledge owners. Brick 6 remains the historical semantic-link contract for the original Resources architecture; R16 adds a downstream reading-specific adapter rather than rewriting that history.

## What R16 adds

### Two established comprehension owners

R14 identified two valuable existing pages that did not yet have canonical topic IDs:

- `reading-comprehension-bridge` → `/blog/phonics-comprehension`
- `story-comprehension-diagnostic` → `/blog/why-child-reads-words-but-does-not-understand-story`

The first owns the instructional bridge from accurate decoding into meaning. The second owns the problem-aware intent where a child can read words but repeatedly fails to understand stories. They are intentionally separate.

### Six focused semantic journeys

R16 adds explicit journeys for:

1. phonological / phonemic awareness vs phonics;
2. automatic word recognition;
3. vocabulary in reading comprehension;
4. the decoding-to-comprehension bridge;
5. the reads-words-but-does-not-understand diagnostic;
6. one additive conceptual edge from the established fluency owner to automatic word recognition.

Each journey is capped at four semantic destinations, deduplicated, and allowed at most one assessment/programme destination. Directed `next` edges must remain acyclic.

## Runtime composition

`BlogSemanticPathway.tsx` now calls `getReadingSemanticInternalLinksForPath()`.

The adapter:

1. asks the frozen Brick 6 engine for its legacy links;
2. resolves any R16 reading additions through the R16 canonical ownership view;
3. combines the two sets in legacy-first order;
4. removes duplicate destinations;
5. applies the existing limit and relation filters.

Therefore an unaffected legacy page such as `/blog/how-kids-learn-blending` keeps exactly the same Brick 6 journey, while R15 reading pages and the two comprehension pages gain useful semantic pathways.

## Commercial boundary

The data graph may contain one assessment destination where it is contextually justified, but the rendered educational `BlogSemanticPathway` continues to exclude both `assessment` and `programme` relations. Commercial conversion remains handled by the separate blog conversion component.

## Why this is valuable

The three R15 guides were already crawlable from `/resources/phonics`, but a hub link alone does not express how the concepts relate to the rest of the reading system. R16 makes those relationships explicit for parents, crawlers and machine-readable site architecture without creating more pages.

Examples:

- oral sound awareness → phonics definition → blending → letter-sound practice;
- secure decoding → automatic word recognition → connected-text fluency;
- vocabulary → decoding-to-comprehension bridge → persistent story-understanding diagnosis.

These are semantic relationships, not a claim that reading develops as one rigid staircase.

## Non-goals

R16 does not:

- publish new articles;
- alter the 31-page phonics programmatic resource library;
- rewrite the historical Brick 5 or Brick 6 registries;
- turn vocabulary, fluency and comprehension into interchangeable skills;
- add another commercial CTA to article-end educational navigation;
- claim that automatic recognition eliminates the need for decoding unfamiliar words;
- create category or taxonomy URLs.
