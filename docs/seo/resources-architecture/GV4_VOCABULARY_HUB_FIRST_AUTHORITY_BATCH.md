# GV4 — Vocabulary Hub + First Authority Publication Batch

**Status:** implementation and publication brick  
**Revision:** `2026-09-27-gv4`  
**Base:** merged GV1 requirements + merged GV2 lexical model + merged GV3 Grammar reference batch

## Purpose

GV4 turns the governed Vocabulary architecture into its first public knowledge layer.

It publishes:

- one canonical Vocabulary knowledge hub at `/resources/vocabulary`;
- six substantial authority guides;
- one reciprocal practice relationship with Vocabulary Adventure;
- explicit canonical ownership;
- public-route, SEO, breadcrumb, analytics, sitemap, prerender and AI-corpus wiring.

GV4 does **not** create word-by-word pages, does not reinterpret the GV2 difficulty bands as CEFR levels, and does not turn the free game into an informational owner.

## Publication batch

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

These six were selected because they provide a balanced first layer across:

- concrete everyday vocabulary;
- emotion and school language;
- semantic relationships;
- vocabulary inference in reading;
- morphology and word building.

The remaining ten GV1 Vocabulary requirements stay unpublished.

## Hub role

`/resources/vocabulary` is the canonical Vocabulary knowledge-discovery hub.

It teaches a simple progression:

> understand meaning → connect words → infer from context → build word families → retrieve → use in reading, speaking and writing

The hub exposes:

- the six live authority guides;
- the wider six-stage Vocabulary architecture;
- explicit practice handoff to Vocabulary Adventure;
- transfer links into Reading, Spoken English and Writing.

The hub states clearly that Tiny Steps internal progression bands are **not CEFR equivalence**.

## Practice boundary

`/free-games/word-meaning-flashcards` remains the existing **Vocabulary Adventure practice surface**.

GV4 gives the relationship a reciprocal structure:

- knowledge guides → Vocabulary Adventure;
- Vocabulary hub → Vocabulary Adventure;
- Vocabulary Adventure → Vocabulary knowledge hub.

The game continues to consume the GV2 50-word lexical model. It does not become the canonical owner for Vocabulary concepts.

## GV2 lexical baseline

GV4 preserves the merged GV2 model:

- 50 migrated words;
- 4 internal difficulty bands;
- 13 semantic domains;
- exact legacy game compatibility;
- source-curated relationships only.

GV4 does not bulk-fill empty lexical fields merely to make the model look complete. Authority-page examples may teach broader vocabulary while canonical lexical-entry enrichment remains a separate controlled task.

## Authority-content contract

Every GV4 page must include:

- direct answer;
- concept explanation;
- why the skill matters;
- three core teaching points;
- three meaningful word groups;
- three worked examples;
- additional examples;
- three common mistakes;
- two tricky cases;
- parent/teacher teaching note;
- three guided-practice prompts;
- two FAQs;
- at least two visible authoritative references;
- related learning;
- direct practice handoff.

Each page must exceed the GV1 **600 knowledge-word floor**. The floor prevents thin content; it is not a target.

## Evidence basis

GV4 uses external references as evidence and breadth checks while Tiny Steps retains original child-focused explanations and examples.

### British Council LearnEnglish

Used for:

- general vocabulary-learning breadth;
- A1–A2 topic organisation;
- everyday objects;
- daily routines;
- school vocabulary;
- the principle that vocabulary learning includes meaning, pronunciation/spelling awareness and repeated practice.

### Cambridge Dictionary / Thesaurus

Used for:

- synonym and antonym distinctions;
- shades of meaning;
- intensity;
- word formation, prefixes, suffixes, conversion and compounds.

### Reading Rockets

Used for:

- context-clue instruction;
- cautious evidence-based inference;
- vocabulary instructional guidance;
- word-family and morphology connections.

### Education Endowment Foundation

Used for:

- receptive versus expressive vocabulary;
- repeated exposure and embedding new words into use.

Visible page references are the same references exported to the machine corpus.

## Canonical ownership

GV4 creates seven new Vocabulary ownership records:

- one `vocabulary-resource-discovery` owner for `/resources/vocabulary`;
- six `gv4-vocabulary-*` skill-guide owners.

The canonical registry uses a dedicated `vocabulary-language` subject family. This deliberately keeps Vocabulary knowledge separate from the frozen C7 `general-english` commercial chooser logic, so publishing Vocabulary does not create implicit broad-English programme handoffs.

The six child pages are governed informational owners under the Vocabulary hub.

## Frozen three-hub protection

The historical Resources architecture froze three original subject hubs:

- `/resources/phonics`
- `/resources/grammar`
- `/resources/speaking`

GV4 **does not alter**:

- `CENTRAL_RESOURCE_SUBJECT_HUBS`;
- KB-FINAL protected-hub baselines;
- C7 subject-hub counts;
- the original R4/R23 historical assertions.

Vocabulary is added as a later specialist knowledge hub adjacent to that frozen three-hub architecture.

## Resources gateway

The central `/resources` page adds one Vocabulary pathway card.

The existing gateway still preserves:

- Parent Help;
- Free Learning Activities;
- Schools & Educators;
- editorial guide discovery;
- all established commercial owners.

No existing content URL is moved or redirected.

## AI answer layer

GV4 adds six governed Vocabulary concepts to Layer 2.

Layer 2 therefore becomes:

- 27 curated concepts;
- 31 governed Phonics guides;
- 38 governed Grammar knowledge guides;
- 6 governed Vocabulary authority guides;
- **102 total Layer-2 items**.

Vocabulary concepts use:

- canonical child-page URL;
- `/resources/vocabulary` hub;
- source-backed quick answer;
- related-learning paths;
- Vocabulary Adventure as the practice path.

Layer 1 parent-problem baseline and Layer 3 practice baseline remain unchanged.

## Machine corpus

The AI resource index adds a dedicated:

`vocabulary_authority_guides`

corpus with exactly six items.

Each item includes:

- `content_type: vocabulary-authority-guide`;
- canonical URL;
- authority order;
- stage ID;
- related URLs;
- Vocabulary Adventure practice URL;
- visible external reference URLs.

Vocabulary child pages are excluded from the generic additional-public-route corpus so they have one machine-readable corpus identity.

## C7 protection

GV4 intentionally changes two C7-reviewed knowledge/discovery files:

- `src/pages/ResourcesPage.tsx`
- `src/lib/canonicalTopicOwnershipRegistry.js`

Their exact reviewed Git blob pins are updated.

GV4 does **not**:

- change C2 commercial owner clusters;
- change C4 CTR experiments;
- change C5 conversion ownership;
- change C6 frozen architecture;
- add a Vocabulary commercial programme;
- create a new conversion owner;
- alter `/book-demo`.

## GV4 closure conditions

GV4 is complete when:

- `/resources/vocabulary` is indexable, self-canonical, prerendered and in the sitemap;
- exactly six first-batch Vocabulary authority pages are live;
- all six correspond to approved GV1 topic requirements;
- all six exceed 600 knowledge words;
- all six expose at least two visible authoritative references;
- all six point to Vocabulary Adventure for practice;
- Vocabulary Adventure points back to the knowledge hub;
- GV2 still contains exactly 50 migrated lexical entries;
- canonical ownership contains exactly seven GV4 Vocabulary records;
- frozen three-hub Resources baselines remain unchanged;
- AI Layer 2 contains 102 items including six Vocabulary concepts;
- generated machine corpus contains exactly six Vocabulary authority guides;
- the Resources gateway links to the Vocabulary hub;
- the 150 KiB gzip public bundle guard remains unchanged;
- targeted tests, canonical audit, C7 reviewed-snapshot test, typecheck, build/prerender, rendered GV4 audit and generated AI audit are green.
