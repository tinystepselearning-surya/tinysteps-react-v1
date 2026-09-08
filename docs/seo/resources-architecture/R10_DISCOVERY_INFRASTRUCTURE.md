# R10 — Discovery Infrastructure

Status: implementation
Revision: `2026-09-09-r10`

## Goal

Brick 10 makes the phonics resource ecosystem reliably discoverable by users, crawlers and answer engines **without treating the 16 Brick 9 pages as a permanent ceiling**.

The architecture is intentionally built so the publication registry can grow from tens to hundreds of approved pages without hand-maintaining a second navigation system.

## Architectural rule

Publication and discovery remain separate responsibilities:

- **Brick 8** owns phonics knowledge and curriculum facts.
- **Brick 9** decides which concepts are public.
- **R9.1** records truthful human editorial review state.
- **Brick 10** organises and exposes the already-published set for crawl discovery.

Brick 10 must never publish an unpublished Brick 8 candidate by importing the knowledge dataset directly.

## Discovery graph

`src/lib/phonicsResourceDiscoveryGraph.js` derives its graph from `PHONICS_PROGRAMMATIC_PILOT_PAGES`.

Current graph root:

`/resources/phonics`

Current pattern families:

1. Spelling rules
2. Consonant patterns
3. Vowel patterns
4. Word structure

Each family is currently an in-page crawlable anchor on the canonical phonics hub rather than a new standalone URL. This avoids creating thin category pages before there is enough distinct category-level value to justify them.

Every published detail page receives graph relationships for:

- hub → child;
- child → parent hub;
- same-family siblings;
- adjacent patterns by curriculum progression.

The graph is data-driven. Future approved publication waves automatically participate once Brick 9/12 adds them to the publication registry.

## Hub discovery surface

`PhonicsPilotGuideGrid.tsx` now renders:

- a visible pattern-family navigation;
- stable anchor IDs for each family;
- direct HTML links to every published page;
- explicit discovery data attributes used by CI;
- counts derived from the registry rather than handwritten numbers.

The hub therefore remains a complete one-click discovery root even as the library expands.

## Sitemap contract

Published phonics resources continue to be registered through `PUBLIC_ROUTE_MANIFEST` and therefore remain:

- indexable;
- self-canonical;
- prerendered;
- sitemap eligible.

R10 adds an explicit audit requiring the phonics hub and every published detail page to occur exactly once in the generated sitemap output.

A separate Resources sitemap is an operational scaling concern, not a publication gate. The current inventory is well below sitemap protocol limits. Before the resource inventory becomes operationally large, the route inventory can be partitioned into `sitemap-resources.xml` without changing URLs or canonical ownership. Publishing does **not** need to pause at 16 pages while waiting for that split.

## Rendered discovery gate

After prerender, R10 verifies:

- the phonics hub HTML exists;
- every family anchor is present;
- every published detail page has a direct rendered `<a href>` from the hub;
- every detail page has a rendered link back to `/resources/phonics`;
- all hub/detail routes remain present in sitemap output.

This protects against JavaScript-only discovery regressions.

## Scaling policy

Brick 10 deliberately prepares the graph for continuous expansion.

It does **not** require Tiny Steps to leave only 16 pages live for a long observation period.

Expansion can proceed in controlled waves once Brick 11 measurement is attached. The graph itself should not need redesign for each wave.

Potential later browse surfaces include:

- dedicated high-value pattern-family hubs;
- sound/grapheme browse;
- curriculum-stage browse;
- difficulty or progression browse;
- word/example families where Tiny Steps has reliable structured phonics data.

A new browse URL should be created only when it has standalone user value. Anchors and graph edges are preferred over thin index pages.

## Acceptance criteria

Brick 10 is accepted only when:

1. every published phonics page belongs to exactly one discovery family;
2. every published page is reachable from `/resources/phonics`;
3. every page retains a path back to the hub;
4. every page has multiple related discovery targets;
5. no unpublished Brick 8 candidate is surfaced;
6. no thin family URL is created accidentally;
7. every published route stays indexable, self-canonical, prerendered and sitemap eligible;
8. rendered HTML contains direct crawlable links;
9. R0–R9.1 regression gates remain green;
10. the dedicated R10 CI workflow is green.

## What Brick 10 does not do

Brick 10 does not:

- auto-publish Wave 2 concepts;
- mark pending editorial reviews approved;
- generate thousands of word pages without validated data;
- transfer established blog or commercial canonical ownership;
- create category URLs solely for keyword volume;
- fabricate FAQ, HowTo, author or reviewer schema.

Those constraints keep the learnphonics-style **graph strength** while avoiding low-quality programmatic expansion.
