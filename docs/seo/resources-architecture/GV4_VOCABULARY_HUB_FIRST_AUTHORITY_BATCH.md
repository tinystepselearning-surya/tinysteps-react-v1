# GV4 — Vocabulary Hub + First Authority Publication Batch

**Status:** implementation and publication brick  
**Revision:** `2026-09-27-gv4`  
**Base:** merged GV1 authority requirements + merged GV2 lexical model + merged GV3 Grammar reference batch  
**Scope:** one Vocabulary hub + six authority guides

## Purpose

GV4 turns the frozen Vocabulary architecture into a public knowledge system without turning individual words into thin search pages.

The brick publishes:

- one canonical Vocabulary hub at `/resources/vocabulary`;
- six substantial authority guides;
- one existing practice continuation at `/free-games/word-meaning-flashcards`.

The complete GV1 Vocabulary architecture remains **16 authority topics across six stages**. GV4 publishes only the first six topics whose content, evidence and ownership boundaries are ready.

## Published hub

### `/resources/vocabulary`

The hub owns discovery for Tiny Steps Vocabulary knowledge.

It explains the six-stage progression:

1. Everyday Foundations
2. Word Relationships
3. Building New Words
4. Vocabulary in Context
5. Natural English
6. Vocabulary for Speaking & Writing

Published topics are links. Unpublished topics appear only as planned labels and do **not** create placeholder pages, canonical URLs or sitemap entries.

## First authority batch

GV4 publishes exactly these six guides:

1. **Everyday Vocabulary for Kids**  
   `/resources/vocabulary/everyday-vocabulary-for-kids`

2. **Feelings & Emotions Vocabulary**  
   `/resources/vocabulary/feelings-emotions-for-kids`

3. **School Vocabulary for Kids**  
   `/resources/vocabulary/school-vocabulary-for-kids`

4. **Synonyms & Antonyms for Kids**  
   `/resources/vocabulary/synonyms-antonyms-for-kids`

5. **Context Clues for Kids**  
   `/resources/vocabulary/context-clues-for-kids`

6. **Word Families, Prefixes & Suffixes**  
   `/resources/vocabulary/word-families-prefixes-suffixes-for-kids`

## Why these six were selected first

### Everyday Vocabulary

GV2 already contains a stable beginner lexical baseline. Everyday vocabulary creates the broadest bridge from that practice dataset into real-world language use.

### Feelings & Emotions

The existing 50-word dataset contains a complete 10-word feeling category. Publishing this guide gives those words a meaningful semantic and speaking/writing context rather than leaving them as isolated flashcard material.

### School Vocabulary

The existing dataset also contains a complete 10-word school category. School language has immediate value for classroom comprehension and can expand later into more academic vocabulary without turning the first page into a large school dictionary.

### Synonyms & Antonyms

The public game already practises these relationships. GV4 adds the missing knowledge owner explaining that synonyms are usually meaning neighbours rather than perfect replacements, and that antonyms depend on the sense active in context.

### Context Clues

Context-clue practice already exists inside Vocabulary Adventure. GV4 adds an evidence-based explanation of how to reread, identify useful clues, propose a meaning and verify it instead of rewarding unsupported guessing.

### Word Families, Prefixes & Suffixes

This gives Vocabulary a governed morphology bridge while keeping the GV1 cross-domain boundary intact:
- Vocabulary owns meaning growth and usable word families.
- Grammar may separately own structural word-class/morphology explanation.
- Phonics/spelling remains the owner of decoding/encoding patterns.

## Authority-content contract

Every published GV4 guide must satisfy the GV1 floor:

- at least **600 knowledge words**;
- at least **2 authoritative references**;
- at least **3 core teaching ideas**;
- at least **3 worked examples**;
- at least **3 additional examples**;
- at least **3 common mistakes/confusions**;
- at least **2 tricky cases or distinctions**;
- a parent/teacher teaching note;
- at least **3 guided practice prompts**;
- at least **2 meaningful FAQs**;
- descriptive related-learning paths;
- visible references;
- one connected practice owner;
- self-canonical SEO;
- public routing, sitemap and prerender coverage;
- AI answer-layer and machine-corpus publication only after approval.

The word threshold prevents thin content; it is not a target for padding.

## Evidence basis

GV4 uses external references to check principles, definitions, usage and evidence. Tiny Steps keeps its own child-focused explanations, examples and progression.

### British Council LearnEnglish

Used as a benchmark for:
- topic-organised beginner/intermediate vocabulary;
- learning meaning, pronunciation and spelling in context;
- everyday-object and school vocabulary;
- learner-friendly adjective usage.

### Cambridge Dictionary

Used for:
- synonym/antonym and thesaurus relationships;
- word-formation principles involving bases, prefixes and suffixes.

### Institute of Education Sciences / What Works Clearinghouse

Used for:
- vocabulary knowledge as part of reading for understanding;
- intensive teaching of selected academic vocabulary;
- explicit context-clue routines;
- building world and word knowledge during reading intervention.

The source catalogue is page-specific. A benchmark URL does not automatically count as evidence for every Vocabulary topic.

## GV2 lexical-model integration

GV4 reuses the existing canonical 50-word lexical baseline.

It does **not** create a second Vocabulary dataset.

Examples:

- Everyday Vocabulary surfaces the existing everyday words.
- Feelings & Emotions surfaces the existing 10 feeling words.
- School Vocabulary surfaces the existing 10 school words.
- Synonyms & Antonyms reuses relationship-bearing entries already governed by GV2.
- Context Clues uses selected familiar words for contextual practice.
- Word Families uses existing headwords as anchors without fabricating new lexical metadata in the GV2 baseline.

The 50-word dataset remains unchanged in size and continues to feed Vocabulary Adventure through the compatibility adapter.

## Practice boundary

The existing public game remains:

`/free-games/word-meaning-flashcards`

Its role is **practice**.

The new hub and authority guides own:
- explanation;
- vocabulary architecture;
- lexical relationships;
- context strategy;
- meaning-building progression.

The game owns:
- meaning retrieval;
- context-clue practice;
- synonym/antonym choices;
- recall challenges.

GV4 links every published guide back to the game after explanation.

## Canonical ownership

GV4 adds:

- one discovery `subject-hub` owner for `/resources/vocabulary`;
- six informational `skill-guide` owners for the authority pages.

No commercial programme owner changes.

Vocabulary is kept inside the existing canonical subject taxonomy as a governed general-English knowledge layer rather than modifying frozen Phonics, Grammar or Speaking subject ownership.

## Central Resources discovery

The main `/resources` gateway adds a dedicated **Vocabulary** pathway card.

Vocabulary therefore becomes a first-class public knowledge pathway beside:
- Phonics & Reading;
- Grammar & Writing;
- Speaking & Communication;
- Parent Help;
- Free Learning Activities;
- Schools & Educators.

## Breadcrumbs and AEO

GV4 adds:

`Home → Resources → Vocabulary → Current guide`

Vocabulary pages expose:
- answer-first title/summary selectors;
- Article schema;
- FAQ schema;
- visible citations;
- Vocabulary hub context.

## AI answer layer

GV4 adds six governed Vocabulary concepts to Layer 2.

The new Layer 2 total becomes:

- 27 curated concept owners;
- 31 governed Phonics guides;
- 38 governed Grammar knowledge guides;
- 6 governed Vocabulary authority guides;
- **102 total Layer 2 items**.

GV4 also adds one Layer 3 practice owner:

- Vocabulary Adventure

Layer 3 becomes **12 practice actions**.

## Machine-readable corpus

The generated AI resource corpus receives:

`vocabulary_authority_guides`

Each record contains:
- canonical URL;
- content type `vocabulary-authority-guide`;
- Vocabulary stage;
- publication order;
- summary;
- related URLs;
- Vocabulary Adventure practice URL;
- visible external reference URLs.

The six Vocabulary pages are excluded from the generic public-route corpus so they are represented exactly once as governed authority content.

## Analytics and discovery

GV4 adds:
- `/resources/vocabulary` to the public analytics path policy;
- `/resources/vocabulary/*` as a public dynamic analytics family;
- the hub and six pages to the public route manifest;
- sitemap/prerender discovery through the existing static-route pipeline.

## Remaining ten GV1 Vocabulary authority topics

GV4 deliberately leaves these unpublished:

1. Action Words for Kids
2. Describing Words for Kids
3. Home, Family & Daily Routine Vocabulary
4. Food, Clothes & Body Vocabulary
5. Nature, Weather, Places & Transport Vocabulary
6. Multiple-Meaning & Easily Confused Words
7. Collocations for Kids
8. Phrasal Verbs & Common Expressions
9. Vocabulary for Better Writing
10. Vocabulary for Speaking & Conversation

They remain requirements, not placeholder pages.

## Frozen protections

GV4 must not alter:

- the 38-step Grammar progression;
- the 32 core Grammar pages;
- the six GV3 Grammar reference pages;
- the frozen GR6 historical graph;
- C7 commercial ownership/routing;
- the established 50-word Vocabulary Adventure baseline;
- Phonics decoding/spelling ownership;
- Reading comprehension programme ownership;
- Speaking/Writing commercial ownership;
- the **150 KiB gzip public bundle guard**.

If rich Vocabulary content causes eager bundle growth, isolate rich authority content from lightweight discovery registries rather than raising the guard.

## GV4 closure conditions

GV4 is complete when:

- the hub exists at `/resources/vocabulary`;
- exactly six authority guides are public;
- the other ten planned topics have no route, SEO owner or sitemap entry;
- every authority page clears the >=600-word floor;
- every page has >=2 visible authoritative references;
- the 50-word GV2 lexical baseline remains exactly 50;
- Vocabulary Adventure remains the single declared practice owner;
- central Resources links to the Vocabulary hub;
- hub and pages are self-canonical, prerendered and in `sitemap-static.xml`;
- canonical ownership contains one hub + six guide owners;
- Layer 2 contains 102 items including exactly six Vocabulary guides;
- Layer 3 contains 12 items including Vocabulary Adventure;
- machine corpus contains exactly six `vocabulary-authority-guide` records;
- C7 reviewed-byte protections are updated only for intentionally changed reviewed files;
- full tests, typecheck, build/prerender, AI audit and rendered GV4 audit are green.
