# GV2 — Vocabulary Taxonomy & Lexical Data Model

**Status:** implementation brick  
**Revision:** `2026-09-27-gv2`  
**Base architecture:** GV1 Grammar + Vocabulary Authority Requirements  
**Publication effect:** none

## Purpose

GV2 creates the canonical Vocabulary data layer before Tiny Steps publishes the planned `/resources/vocabulary` hub or any Vocabulary authority page.

The brick has two jobs:

1. freeze a reusable Vocabulary taxonomy that can grow beyond the current game;
2. migrate the existing 50-word Vocabulary Adventure dataset into that model without changing the public game contract.

GV2 does **not** publish new Vocabulary knowledge routes. All sixteen GV1 Vocabulary authority requirements remain publication-unapproved.

## Why this brick exists

The existing Vocabulary Adventure already contains useful child-facing material:

- 50 words;
- child-friendly meanings;
- example sentences;
- five legacy categories;
- meaning matching;
- word retrieval;
- context clues;
- synonym practice;
- antonym practice;
- word-detective recall.

Before GV2, those words lived directly inside `publicVocabularyContent.ts`. That made the game the de facto word dataset even though GV1 established that the game should remain a practice surface rather than the canonical Vocabulary knowledge owner.

GV2 reverses that dependency:

> Canonical lexical model → compatibility adapter → Vocabulary Adventure practice.

## Difficulty bands

GV2 defines four reusable progression bands.

### 1. Foundation

High-frequency, concrete or immediately useful child vocabulary that can be understood through a short definition, sentence, picture or familiar context.

The existing 50 game words are migrated here because they are the beginner baseline.

### 2. Developing

Broader vocabulary requiring comparison, multiple contexts, word relationships or more precise semantic distinctions.

### 3. Expanding

Richer vocabulary including morphology, collocations, phrasal expressions and less concrete school or real-world language.

### 4. Transfer

Vocabulary selected for independent speaking, writing, explanation, argument, storytelling and school-language transfer.

The bands are instructional/data bands. They are not claimed as CEFR equivalence.

## Semantic-domain taxonomy

GV2 defines these reusable semantic domains:

1. Actions
2. Feelings & Emotions
3. Description & Properties
4. School & Learning
5. Home, Family & Routines
6. Places & Environment
7. Everyday Objects
8. Word Relationships
9. Word Building
10. Context & Inference
11. Natural English
12. Speaking Transfer
13. Writing Transfer

These domains are deliberately broader than the five legacy game categories and can support the sixteen GV1 Vocabulary authority resources.

## Canonical lexical-entry schema

Each lexical entry can support:

- stable id;
- headword;
- child-friendly meaning;
- example sentence;
- primary word class;
- difficulty band;
- Vocabulary stage;
- primary authority topic;
- one or more semantic domains;
- legacy game category where applicable;
- synonyms;
- antonyms;
- word family;
- collocations;
- common confusions;
- speaking prompts;
- writing prompts;
- migration/source provenance;
- enrichment status.

GV2 intentionally does **not** fabricate word-family, collocation, confusion, pronunciation, speaking or writing data for the 50 legacy entries. Those fields remain empty until a later source-curated enrichment brick supplies academically checked data.

## 50-word migration

All 50 current Vocabulary Adventure words move into the lexical model in exactly the same order.

Legacy categories remain compatible:

- 10 action words;
- 10 feeling words;
- 10 describing words;
- 10 school words;
- 10 everyday words.

The public game still receives the same compatibility shape:

- `id`
- `word`
- `meaning`
- `sentence`
- `category`

but those fields are now derived from the canonical lexical entries.

## Authority-topic mapping

Each migrated word is connected to a GV1 authority requirement.

Examples:

- `run` → Action Words
- `happy` → Feelings & Emotions
- `big` → Describing Words
- `teacher` → School Vocabulary
- `family` → Home, Family & Daily Routine
- `market` → Nature, Weather, Places & Transport
- `bottle` → Everyday Vocabulary

This creates a stable path from current practice content into future Vocabulary authority pages without making the game itself the owner.

## Existing synonym/antonym facts

GV2 migrates only lexical relationships already present in the current game.

Examples include:

- happy → joyful
- happy ↔ sad in the current challenge direction
- big → large
- big → small as the current antonym answer
- calm → peaceful
- fast → quick
- fast → slow
- bright → shiny
- clean → dirty
- open → close

These facts are now available in the canonical lexical model, and regression tests ensure the existing synonym/antonym challenges remain consistent with them.

GV2 does not infer additional relationships merely because they appear obvious.

## Compatibility guarantee

`publicVocabularyContent.ts` no longer owns a separate 50-word array.

Instead it consumes:

- `VOCABULARY_LEXICAL_ENTRIES`
- `toLegacyPublicVocabularyWord()`

The challenge/level system is left unchanged in GV2.

This means the current Vocabulary Adventure can continue to render and validate the same game while the knowledge architecture grows independently.

## Publication boundary

GV2 does not:

- create `/resources/vocabulary`;
- publish the sixteen GV1 Vocabulary pages;
- add sitemap entries;
- alter canonical ownership;
- expose new Vocabulary pages to AI/LLM corpora;
- add speculative pronunciation or lexical facts;
- turn individual words into thin public routes.

## Next brick

### GV3 — Grammar reference-extension publication batch

The planned first batch is:

1. Determiners
2. Countable & Uncountable Nouns
3. Noun Phrases
4. Verb Forms & Irregular Verbs
5. Word Order
6. Common Grammar Mistakes

Each page must satisfy the GV1 authority-page contract before publication.

After that:

### GV4 — Vocabulary hub + first authority batch

Suggested first Vocabulary publication batch:

- Everyday Vocabulary
- Feelings & Emotions
- School Vocabulary
- Synonyms & Antonyms
- Context Clues
- Word Families, Prefixes & Suffixes

## GV2 closure conditions

GV2 is complete when:

- four difficulty bands are frozen;
- thirteen semantic domains are frozen;
- all 50 existing Vocabulary Adventure words are represented in the lexical model;
- all 50 retain their legacy order and compatibility fields;
- legacy category counts remain 10/10/10/10/10;
- every migrated word maps to a valid GV1 stage and authority topic;
- existing synonym/antonym challenge answers are represented in the lexical model;
- no unsourced enrichment is fabricated;
- the public game consumes the lexical model rather than a second word array;
- all sixteen GV1 Vocabulary authority topics remain publication-unapproved;
- targeted tests, type check and existing game regression tests pass.
