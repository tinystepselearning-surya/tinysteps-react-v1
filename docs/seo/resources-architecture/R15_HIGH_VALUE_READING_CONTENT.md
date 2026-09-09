# Resources R15 — High-Value Reading Content Execution

Revision: `2026-09-09-r15`

## Purpose

R15 executes only the high-value actions approved by R14. It does not bulk-generate reading articles and does not rewrite strong existing content merely to create freshness.

## Execution decisions

R15 contains five explicit decisions:

### Published — 3 genuine gaps

1. `/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics`
   - owns the parent-facing boundary between broad oral sound awareness, phoneme-level awareness, and print-based phonics;
   - keeps oral blending distinct from printed-word decoding;
   - explicitly rejects a mandatory long oral-only waiting stage.
2. `/blog/how-vocabulary-supports-reading-comprehension`
   - owns the reading-specific connection between word meaning and comprehension;
   - keeps vocabulary separate from decoding while showing how the two interact;
   - does not compete with general English-vocabulary content.
3. `/blog/how-children-recognise-words-automatically-after-phonics`
   - owns the transition from effortful decoding to rapid familiar-word recognition;
   - explains orthographic mapping cautiously;
   - distinguishes automatic recognition from visual/picture/first-letter guessing.

### Already satisfied — 2 no-churn refreshes

R14 marked two established owners for possible refresh. R15 inspected the actual current content and found the planned improvements already present:

- `/blog/how-to-improve-reading-fluency-in-children`
  - already separates accuracy, automaticity/ease, phrasing/prosody and meaning;
  - already includes purposeful repeated-reading boundaries, timing caution and fresh-text transfer.
- `/blog/phonics-comprehension`
  - already separates decoding, effort, vocabulary, sentence/idea integration and inference bottlenecks;
  - already includes listening-versus-independent-reading observation and transfer checks.

R15 therefore does **not** change either article or manufacture a new `modifiedDate`.

## Evidence policy

Reference sites supplied during planning were useful for information architecture and parent communication, but R15 scientific claims are grounded in stronger source types wherever possible:

- IES / What Works Clearinghouse foundational-reading guidance
- Department for Education Reading Framework
- GOV.UK English curriculum guidance
- Education Endowment Foundation evidence summaries
- peer-reviewed research on orthographic mapping (Ehri)

Reading Rockets is retained only as a clearly identified parent-facing explanatory resource in the awareness article. Read Naturally, Jolly Phonics and National Literacy Trust are not used as R15 scientific evidence sources.

## Canonical intent ownership

R15 follows the additive ownership pattern established by R12 rather than rewriting the historical R5 registry.

New canonical topic IDs:

- `phonological-phonemic-phonics-boundary`
- `vocabulary-reading-comprehension`
- `automatic-word-recognition`

All three belong to `phonics-reading`, use `/resources/phonics` as the discovery hub, and are checked against the full R12 ownership view for duplicate IDs and duplicate query intent.

## Discovery

The existing `/resources/phonics` hub receives a compact three-link **Reading knowledge** strip directly below the R13 sound-and-word utility. This keeps the approved hub architecture intact while giving the new knowledge owners a stable crawl/discovery path.

No new category route is created.

## Relationship to R14

R14 remains the planning contract: three records stay `CREATE`, and two records stay `REFRESH` in that historical decision layer.

R15 adds a separate execution registry:

- the three CREATE decisions become `published`;
- the two REFRESH decisions become `already-satisfied`.

The downstream R14 audit accepts these publications only when run with `--r15-executed` and only when the exact R15 execution registry matches the R14 proposed paths.

## Non-goals

R15 does not:

- create a generic “five components of reading” clone;
- mass-rewrite the blog library;
- create thin definition pages for phonological awareness and phonemic awareness;
- claim that phonics alone produces comprehension;
- claim that orthographic mapping is a branded activity or fixed-number repetition method;
- alter the R12 31-page phonics resource publication set;
- publish R13 individual word URLs;
- assign human review claims that did not occur.
