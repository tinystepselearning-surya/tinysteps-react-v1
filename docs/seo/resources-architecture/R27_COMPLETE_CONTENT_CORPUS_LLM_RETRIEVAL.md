# Resources Architecture — R27 Complete Content Corpus for LLM Retrieval

**Status:** implemented and refined by the 2026-09-27 Grammar expansion  
**Primary gateway:** `/resources`  
**Machine indexes:** `/ai-resource-index.json`, `/ai-resource-index.txt`  
**LLM discovery:** `/llms.txt`, `/llms-full.txt`

## Objective

R27 keeps the machine-readable retrieval corpus aligned to the current public site without duplicating page bodies or reviving retired sources.

## Editorial blog coverage

The build-time source tree now contains **82 live canonical editorial articles**.

The historical URL:

`/blog/spoken-english-classes-for-kids-confidence`

remains protected by a one-hop **301** to:

`/blog/child-understands-english-but-does-not-speak`

but its retired source file has been removed. It is therefore **not part of the editorial corpus, answer index, citation inventory, RSS or sitemap**.

Each live blog corpus record contains its canonical URL, public title, source-derived summary, indexing state, retrieval role, answer eligibility and visible evidence references.

## Programmatic knowledge coverage

The connected informational corpus contains:

- **31 governed phonics guides** under `/resources/phonics/*`;
- **42 governed grammar guides** under `/resources/grammar/*`.

The Grammar set follows the canonical Tiny Steps Basic and Advanced Grammar curriculum order while established broad owners such as sentence formation, conjunctions, tenses, punctuation, paragraph writing, creative writing and editing remain on their existing canonical URLs.

## Additional public content

The generated corpus also connects the union of `PUBLIC_ROUTE_MANIFEST` and `ROUTE_SEO_REGISTRY`, after deduplicating URLs already represented by editorial, phonics and grammar records.

Noindex public routes remain supporting-only metadata and do not become primary answer owners.

## Machine index structure

`/ai-resource-index.json` contains:

- the three answer layers;
- `corpus.editorial_blogs`;
- `corpus.programmatic_phonics_guides`;
- `corpus.programmatic_grammar_guides`;
- `corpus.additional_public_routes`.

Corresponding `corpus_counts` fields reconcile to those four live groups.

There is no retired-editorial lineage collection.

## Plain-text and LLM discovery

`/ai-resource-index.txt` lists the live editorial, phonics, grammar and additional public corpus.

Both `llms.txt` and `llms-full.txt` receive generated sections for:

- the complete 82-article editorial corpus;
- the governed 31-page phonics library;
- the governed 42-page grammar library;
- the three-layer answer architecture.

Historical redirected URLs are not presented as articles or independent answer owners.

## Coverage gate

`scripts/audit-ai-answer-layers.mjs --generated` fails when:

- the live editorial source count drops below the established 82;
- generated editorial coverage does not equal the live source tree;
- phonics coverage differs from the governed 31 pages;
- grammar coverage differs from the governed 42 pages;
- a canonical URL is duplicated;
- a noindex article becomes answer-eligible;
- connected corpus totals do not reconcile;
- a public manifest route is not represented;
- generated LLM discovery omits live editorial or grammar coverage.

## Resulting retrieval model

**Resources gateway**
→ **parent problem**
→ **learning concept**
→ **focused practice**
→ **complete live content corpus**

The corpus now consists of:

**82 live canonical editorial articles + 31 governed phonics guides + 42 governed grammar guides + all additional public route content**

while the retired speaking URL remains only a Hosting redirect for historical URL continuity.
