# Resources Architecture — R27 Complete Content Corpus for LLM Retrieval

**Status:** implemented on top of R23–R26  
**Primary gateway:** `/resources`  
**Machine indexes:** `/ai-resource-index.json`, `/ai-resource-index.txt`  
**LLM discovery:** `/llms.txt`, `/llms-full.txt`

## Objective

R24–R26 created a three-layer answer system for parent problems, educational concepts and focused practice. R27 closes the remaining coverage gap: the retrieval system must not expose only the earlier curated authority subset or only the 31 governed programmatic phonics pages.

The connected corpus now represents the complete current Tiny Steps public content surface.

## Editorial blog coverage

The generator reads the blog source tree at build time and publishes the **82 live canonical editorial articles** as the public editorial corpus.

Each blog corpus record contains:

- canonical public URL;
- public title;
- concise source-derived summary;
- source category where available;
- publication and modified dates;
- indexing state;
- sitemap eligibility;
- retrieval role;
- answer eligibility;
- external evidence URLs already visible in the article source.

The retired `spoken-english-classes-for-kids-confidence` source remains protected by its permanent Hosting redirect to `/blog/child-understands-english-but-does-not-speak`, but it is excluded from the public content corpus, visible library count, LLM directories and answer index. A missing live canonical article fails the generated-content audit.

## Indexing-policy boundary

Connection to the AI corpus does not override the existing search-indexing policy.

For any public article that remains `noindex` under the current blog policy:

- it remains represented in the corpus so the architecture is complete;
- it is marked `supporting-only-noindex`;
- `answer_eligible` is false;
- it must not become the primary answer owner merely because it is present in the machine index.

This preserves the distinction between **content connectivity** and **search/indexing promotion**.

## Programmatic phonics coverage

All **31 governed `/resources/phonics/*` pages** remain connected as canonical informational resources.

Their corpus records contain:

- canonical URL;
- governed title and description;
- publication group;
- related URLs;
- practice URLs;
- indexable state;
- canonical informational retrieval role.

No Wave 3 or unapproved candidate page is added.

## Programmatic grammar coverage

The Grammar & Writing hub now also exposes a governed curriculum-aligned sequence of focused `/resources/grammar/*` guides. Existing substantial blog owners retain their canonical intents for punctuation, sentence formation, conjunctions, subject–verb agreement, the broad tense overview and paragraph writing; the programmatic layer fills uncovered concept intents without cloning those owners.

The generated grammar set is included in the machine corpus, sitemap/prerender manifest and answer layer as canonical informational skill guides.

## Additional public content coverage

R27 also connects the union of the governed `PUBLIC_ROUTE_MANIFEST` and `ROUTE_SEO_REGISTRY`, after deduplicating URLs already owned by:

- the 82-live-article editorial corpus;
- the 31-page governed phonics corpus;
- the governed grammar programmatic corpus.

This additional corpus includes resource hubs, parent-help pages, practice/tools, school resources, programme/support pages, seasonal public pages and public legal routes. Manifest-declared noindex routes remain present only as supporting metadata.

Noindex public routes remain marked as supporting-only/noindex.

## AI resource index structure

`/ai-resource-index.json` now contains both:

1. the **three answer layers** from R24–R26;
2. the **complete connected public content corpus**.

Top-level corpus metadata includes:

- `corpus_counts.editorial_blogs`;
- `corpus_counts.programmatic_phonics_guides`;
- `corpus_counts.programmatic_grammar_guides`;
- `corpus_counts.additional_public_routes`;
- `corpus_counts.connected_public_content`.

The corpus itself is split into:

- `corpus.editorial_blogs`;
- `corpus.programmatic_phonics_guides`;
- `corpus.programmatic_grammar_guides`;
- `corpus.additional_public_routes`.

This avoids duplicating article bodies inside the index. The canonical page remains the content source; the index supplies routing, metadata, status and evidence links.

## Plain-text AI index

`/ai-resource-index.txt` now contains:

- the three answer layers;
- all 82 live canonical editorial URLs;
- all 31 governed programmatic phonics URLs;
- all governed programmatic grammar URLs;
- all additional public corpus URLs.

This provides a compact text fallback for retrieval systems that do not consume the JSON index.

## LLM discovery files

The build now inserts a generated section into both discovery files:

> **Complete Editorial Blog Corpus**

The section is generated directly from the current blog source tree, not maintained manually.

`llms.txt` contains the complete live canonical blog link set in compact form.

`llms-full.txt` contains the same complete live set with summaries and indexing-state annotations. Retired redirect sources are intentionally omitted as content records.

The generated section explicitly states that older curated authority sections are subsets and must not be interpreted as the complete editorial corpus.

## Coverage gate

`scripts/audit-ai-answer-layers.mjs --generated` now fails when:

- the generated editorial estate does not reconcile to the source tree's live-canonical count;
- the live editorial corpus drops below the established 82 canonical articles;
- a retired redirect source leaks back into the public content corpus;
- the governed phonics corpus is not exactly 31 pages;
- the governed grammar programmatic corpus does not reconcile to its publication registry;
- a blog canonical URL is duplicated;
- a blog is missing a title or summary;
- a noindex blog is marked answer-eligible;
- a noindex blog is not marked supporting-only;
- connected corpus totals do not reconcile;
- either LLM discovery file lacks the complete editorial corpus section;
- `llms-full.txt` omits any live canonical editorial URL.

## Resulting retrieval model

The full architecture is now:

**Resources gateway**
→ **Layer 1: parent problem**
→ **Layer 2: learning concept**
→ **Layer 3: practice**
→ **complete content corpus**

The corpus includes:

**82 live canonical editorial articles + 31 governed programmatic phonics guides + governed programmatic grammar guides + all additional public route content**

while preserving canonical ownership, noindex policy, commercial-page roles and existing frozen SEO protections.
