# GV5 — Vocabulary Natural English and Transfer

**Status:** implementation and publication brick  
**Revision:** `2026-09-27-gv5`  
**Base:** merged GV4 Vocabulary hub + first six authority guides  
**Scope:** four additional Vocabulary authority guides only

## Purpose

GV5 extends the Vocabulary knowledge architecture from six to ten published guides without changing the frozen sixteen-topic requirement set, the 50-word Vocabulary Adventure lexical baseline, or commercial ownership.

The new batch covers the two final Stage 5 Natural English topics and both Stage 6 transfer topics:

1. **Collocations for Kids**  
   `/resources/vocabulary/collocations-for-kids`
2. **Phrasal Verbs & Common Expressions**  
   `/resources/vocabulary/phrasal-verbs-common-expressions-for-kids`
3. **Vocabulary for Better Writing**  
   `/resources/vocabulary/vocabulary-for-better-writing`
4. **Vocabulary for Speaking & Conversation**  
   `/resources/vocabulary/vocabulary-for-speaking-conversation`

The six GV4 pages remain unchanged as the first publication batch.

## Architecture

### Knowledge owner

`/resources/vocabulary` remains the Vocabulary subject hub.

Each GV5 page is a canonical informational skill guide with one unique owner ID:

- `gv5-vocabulary-vocabulary-collocations`
- `gv5-vocabulary-phrasal-verbs-expressions`
- `gv5-vocabulary-vocabulary-for-writing`
- `gv5-vocabulary-vocabulary-for-speaking`

### Practice owner

Vocabulary Adventure remains the single declared Vocabulary practice surface:

`/free-games/word-meaning-flashcards`

GV5 does not create a second lexical game, duplicate the 50-word dataset, or move knowledge ownership to the game.

### Cross-domain boundaries

GV1 remains authoritative for cross-domain boundaries:

- **Collocations**
  - Grammar may later explain lexical patterning.
  - Vocabulary owns acquisition, recall and production of natural word partnerships.
- **Phrasal verbs**
  - Grammar may later explain verb + particle structure.
  - Vocabulary owns high-frequency meaning and contextual use.
- **Writing transfer**
  - Vocabulary owns word choice and lexical precision.
  - `/writing-classes-for-kids` remains the commercial writing programme owner.
- **Speaking transfer**
  - Vocabulary owns active lexical retrieval and conversational word use.
  - `/spoken-english-classes-for-kids-online` remains the commercial speaking programme owner.

The two still-unpublished Grammar reference paths for collocations and phrasal verbs must not be created by GV5.

## Content requirements

Every GV5 guide follows the existing authority schema:

- direct answer;
- concept explanation;
- why it matters;
- three core ideas;
- three worked examples;
- additional examples;
- common mistakes;
- tricky cases;
- parent/teacher note;
- three practice prompts;
- two FAQs;
- at least two visible authoritative references;
- related learning;
- Vocabulary Adventure practice connection.

The minimum knowledge floor remains **600 words per guide**.

## Evidence basis

GV5 adds specific source records for:

- Cambridge Dictionary — Collocation
- Cambridge Dictionary — Phrasal verbs and multi-word verbs
- British Council LearnEnglish — Phrasal verbs

Existing British Council vocabulary and IES vocabulary/academic-language sources remain available for transfer into writing and speaking.

## Public discovery

The four new pages are data-driven through the existing Vocabulary publication architecture:

- lightweight SEO manifest;
- dynamic Vocabulary route renderer;
- public route manifest;
- self-canonical SEO entries;
- canonical ownership;
- sitemap/prerender pipeline;
- public analytics dynamic prefix;
- AI Layer 2;
- machine-readable Vocabulary authority corpus;
- visible references.

No placeholder route is created for an unpublished topic.

## AI architecture

Before GV5:

- Layer 1: 28
- Layer 2: 102
- Layer 3: 12
- published Vocabulary guides: 6

After GV5:

- Layer 1: **28**
- Layer 2: **106**
- Layer 3: **12**
- published Vocabulary guides: **10**

The four new Layer 2 items use the Vocabulary authority registry as their answer source and continue to route practice only to Vocabulary Adventure.

## Remaining six unpublished requirements

After GV5, these requirements remain intentionally unpublished:

1. Action Words for Kids
2. Describing Words for Kids
3. Home, Family & Daily Routine Vocabulary
4. Food, Clothes & Body Vocabulary
5. Nature, Weather, Places & Transport Vocabulary
6. Multiple-Meaning & Easily Confused Words

They must not have:

- public routes;
- SEO owners;
- sitemap entries;
- canonical ownership records;
- thin placeholder pages.

These six form the natural candidate set for the later foundation-completion publication batch before final GV6 closure.

## C7 protections

GV5 changes only two C7-protected public/ownership files intentionally:

- `src/pages/VocabularyHubPage.tsx`
- `src/lib/canonicalTopicOwnershipRegistry.js`

Both are pinned by exact reviewed Git blob IDs in the existing C7 reviewed-byte protection map. The exception remains byte-for-byte, not path-wide permission.

GV5 does not alter:

- C2 commercial ownership;
- C4 CTR ownership;
- C5 conversion flow;
- C6 frozen architecture;
- C7 contextual commercial routing;
- `/book-demo` conversion ownership.

## Performance guard

The **150 KiB gzip public bundle guard remains unchanged**.

GV5 reuses the existing shared Vocabulary renderer and data-driven routing rather than adding four page components. Rich page content remains in the authority registry, while lightweight SEO/discovery registries stay separate.

## Validation

Dedicated GV5 validation covers:

- four new pages only;
- six preserved GV4 pages;
- six still-unpublished requirements;
- minimum content depth;
- authoritative references;
- 50-word lexical baseline;
- canonical owner uniqueness;
- no C7 commercial handoffs;
- AI Layer 2 = 106;
- Layer 3 = 12;
- Vocabulary corpus = 10;
- sitemap and prerender output;
- rendered references and practice links;
- public bundle guard.

The GV4 regression suite is also retained as an additive preservation check.

## GV5 closure conditions

GV5 is complete when:

- exactly four pages are marked `gv5-natural-english-transfer`;
- total published Vocabulary authority guides = 10;
- the original six GV4 guides remain intact;
- the remaining six requirements have no public route, SEO record or owner;
- each GV5 guide clears the 600-word knowledge floor;
- each GV5 guide has at least two visible authoritative references;
- all new pages use Vocabulary Adventure as practice;
- the 50-word lexical baseline remains exactly 50;
- each new guide has one `gv5-vocabulary-*` canonical owner;
- no new commercial handoff is created;
- Layer 2 = 106 and Layer 3 = 12;
- machine Vocabulary corpus = 10;
- sitemap/prerender/rendered audits pass;
- C7 reviewed-byte tests pass;
- the 150 KiB gzip public bundle guard passes;
- full repository CI is green.
