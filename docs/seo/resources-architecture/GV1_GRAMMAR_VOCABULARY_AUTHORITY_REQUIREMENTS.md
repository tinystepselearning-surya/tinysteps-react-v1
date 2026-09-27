# GV1 — Grammar + Vocabulary Authority Requirements

**Status:** implementation requirements brick  
**Revision:** `2026-09-27-gv1`  
**Base:** completed 38-step Grammar programme + Grammar Knowledge Enrichment + existing Vocabulary Adventure practice surface  
**Publication effect:** none in GV1

## Purpose

GV1 combines the next Grammar reference improvements with a new Vocabulary knowledge architecture before any additional public resource routes are created.

The requirements are informed by three external reference families:

- British Council LearnEnglish Vocabulary A1-A2: https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2
- British Council LearnEnglish Vocabulary B1-B2: https://learnenglish.britishcouncil.org/free-resources/vocabulary/b1-b2
- Cambridge Dictionary Grammar: https://dictionary.cambridge.org/grammar/british-grammar/

These sources are used as breadth and reference benchmarks. Tiny Steps keeps its own child-focused teaching progression, examples, explanations, practice design and commercial ownership.

## Frozen boundaries

1. The existing **38-step Grammar sequence remains the learning-progression owner**. GV1 does not renumber, replace or insert hidden steps into it.
2. The additional Grammar topics are a **reference-extension layer**, not a second curriculum sequence.
3. Vocabulary receives its own canonical knowledge hub at the planned path **`/resources/vocabulary`**.
4. The existing **Vocabulary Adventure** at `/free-games/word-meaning-flashcards` remains a **practice surface**, not the knowledge owner.
5. Vocabulary may support Reading comprehension, Speaking and Writing, but may not claim phonics decoding, Reading programme ownership or commercial programme ownership.
6. Word formation, collocations and phrasal verbs are intentionally cross-domain. Ownership is split by purpose:
   - Grammar owns structural explanation.
   - Vocabulary owns lexical meaning, recall, natural usage and transfer.
7. No new route becomes indexable until its content, evidence, discovery and quality gates pass.

## Grammar reference-extension requirements

The current Grammar library is strong on school Grammar and learning progression. The remaining reference-grammar gaps are concentrated in phrase structure, verb patterns, morphology, lexical grammar and consolidated error diagnosis.

GV1 freezes these **12 reference-extension requirements**:

1. Determiners for Kids
2. Countable & Uncountable Nouns
3. Noun Phrases for Kids
4. Prepositional Phrases
5. Phrasal Verbs & Particles
6. Verb Forms & Irregular Verbs
7. Gerunds, Infinitives & Verb Patterns
8. Word Order in English
9. Word Formation: Prefixes, Suffixes & Word Families
10. Collocations for Kids
11. Easily Confused English Words
12. Common Grammar Mistakes for Kids

### Grammar reference-extension purpose

These pages should close gaps exposed by broader grammar reference systems without turning the Tiny Steps progression into an encyclopaedia.

Examples:

- **Determiners** unifies articles, demonstratives, possessives and quantifiers.
- **Noun phrases** explains how nouns, determiners and adjectives work together.
- **Verb forms** consolidates base, past, participle and -ing forms.
- **Verb patterns** explains common gerund/infinitive choices.
- **Word order** covers placement, question order and focus beyond basic sentence formation.
- **Common Grammar Mistakes** acts as a diagnostic router into existing canonical owners rather than duplicating every rule.

## Vocabulary authority architecture

Tiny Steps already has Vocabulary Adventure practice with word meanings, context clues, synonyms, antonyms and recall. That is useful practice, but it is not yet a public Vocabulary knowledge architecture.

GV1 defines **six stages and sixteen authority resources**.

### Stage 1 — Everyday Foundations

Purpose: high-frequency child-relevant vocabulary for comprehension and communication.

1. Everyday Vocabulary for Kids
2. Action Words for Kids
3. Feelings & Emotions Vocabulary
4. Describing Words for Kids
5. School Vocabulary for Kids
6. Home, Family & Daily Routine Vocabulary
7. Food, Clothes & Body Vocabulary
8. Nature, Weather, Places & Transport Vocabulary

This stage reflects the useful breadth seen in beginner vocabulary systems while keeping the domains relevant to children ages 3–12.

### Stage 2 — Word Relationships

9. Synonyms & Antonyms for Kids
10. Multiple-Meaning & Easily Confused Words

Purpose: compare semantic relationships rather than memorise isolated definitions.

### Stage 3 — Building New Words

11. Word Families, Prefixes & Suffixes

Purpose: connect vocabulary growth to morphology, spelling and word-class families.

### Stage 4 — Vocabulary in Context

12. Context Clues for Kids

Purpose: move from isolated word knowledge to inference and meaning selection inside sentences and short passages.

### Stage 5 — Natural English

13. Collocations for Kids
14. Phrasal Verbs & Common Expressions

Purpose: teach natural combinations and multi-word meaning, not only grammatical possibility.

### Stage 6 — Transfer into Speaking & Writing

15. Vocabulary for Better Writing
16. Vocabulary for Speaking & Conversation

Purpose: move known words into independent production, school language, storytelling, fuller spoken answers and precise writing.

## Vocabulary data requirements

Published Vocabulary authority resources should not be simple word lists. The underlying lexical model should be able to support, where academically relevant:

- word or expression;
- child-friendly meaning;
- example sentence;
- pronunciation/audio reference;
- syllable or spelling support where useful;
- word class;
- semantic category;
- synonym and antonym;
- word family;
- prefix/suffix/root relationship;
- collocation;
- multiple meanings;
- common confusion;
- context clue;
- speaking prompt;
- writing prompt;
- age/level or difficulty band;
- related Grammar concept;
- related Reading/Speaking/Writing practice surface.

Not every word requires every field. The model should preserve academically meaningful distinctions rather than fill fields mechanically.

## Authority-page publication contract

Every new Grammar reference page or Vocabulary authority page must contain:

1. Direct answer
2. Why the concept matters
3. Core rules or meaning
4. Worked examples
5. Common mistakes or confusions
6. Tricky cases or usage notes
7. Guided practice
8. Parent/teacher teaching note
9. FAQs
10. References / further reading
11. Related learning

### Minimum pre-publication quality gates

- at least **600 knowledge words**;
- at least **2 authoritative references**;
- at least **3 worked examples**;
- at least **2 meaningful FAQs**;
- unique canonical path;
- descriptive internal anchors;
- a connected practice surface;
- no indexable route until the content is complete;
- no AI/LLM corpus exposure until publication is approved;
- no one-word or thin-child programmatic routes.

The word threshold is a floor against thin content, not a target. A concept should be as long as needed to answer the learning need properly.

## External-source policy

External references support facts, definitions and usage checks. Tiny Steps must not copy wording or reproduce another provider's curriculum.

For Vocabulary:

- British Council A1-A2 and B1-B2 are breadth/progression benchmarks.
- Additional dictionary/linguistic references may be added per topic where definitions, pronunciation, word class, collocation or usage require verification.

For Grammar:

- Cambridge Grammar remains a broad reference benchmark.
- Existing Tiny Steps Grammar knowledge sources continue to support topic-level accuracy.

Every published page must identify its actual sources; the benchmark pages do not automatically count as a source for every individual topic.

## Canonical ownership boundaries

### Grammar

The 38-step sequence remains the canonical child-learning progression. Reference-extension pages deepen missing reference topics and must link back into the correct existing sequence owners.

### Vocabulary

`/resources/vocabulary` becomes the planned Vocabulary knowledge hub.

The Vocabulary Adventure remains a practice owner:
`/free-games/word-meaning-flashcards`

### Cross-domain topics

**Word formation**
- Grammar: structural morphology and word-class change.
- Vocabulary: building usable word families and inferring meaning.

**Collocations**
- Grammar: concept of lexical patterning.
- Vocabulary: acquisition, recall and production of natural word partnerships.

**Phrasal verbs**
- Grammar: verb + particle structure.
- Vocabulary: high-frequency meanings and contextual use.

**Context clues**
- Vocabulary owns the word-inference skill.
- Reading may consume the skill for comprehension but should not create a competing canonical vocabulary owner.

## Build sequence after GV1

### GV2 — Vocabulary taxonomy and lexical data model
- freeze semantic domains and difficulty/progression bands;
- define lexical entry schema;
- map the existing 50-word Vocabulary Adventure dataset into the new model;
- preserve game compatibility.

### GV3 — Grammar reference-extension publication batch
Publish only the highest-value non-duplicative Grammar reference gaps first, with source-backed authority content and full discovery wiring.

Suggested first batch:
- Determiners
- Countable & Uncountable Nouns
- Noun Phrases
- Verb Forms & Irregular Verbs
- Word Order
- Common Grammar Mistakes

### GV4 — Vocabulary hub + first authority batch
Build `/resources/vocabulary` and publish the first child-relevant Vocabulary resources.

Suggested first batch:
- Everyday Vocabulary
- Feelings & Emotions
- School Vocabulary
- Synonyms & Antonyms
- Context Clues
- Word Families, Prefixes & Suffixes

### GV5 — Natural English and transfer
- Collocations
- Phrasal Verbs & Common Expressions
- Vocabulary for Better Writing
- Vocabulary for Speaking & Conversation

### GV6 — Discovery, AI and practice integration
- sitemap/prerender;
- route SEO;
- canonical ownership;
- AI answer layer;
- `llms.txt` / `llms-full.txt`;
- Vocabulary Adventure deep links;
- Reading/Speaking/Writing semantic connections;
- measurement and expansion gates.

## GV1 closure conditions

GV1 is complete when:

- the 38-step Grammar sequence remains unchanged;
- exactly 12 Grammar reference-extension requirements are frozen;
- exactly 6 Vocabulary stages are frozen;
- exactly 16 Vocabulary authority requirements are frozen;
- all proposed routes are unique and namespace-safe;
- Vocabulary Adventure is explicitly retained as practice rather than canonical knowledge ownership;
- cross-domain ownership for word formation, collocations and phrasal verbs is explicit;
- source-basis URLs are recorded;
- minimum authority-page quality gates are frozen;
- no GV1 requirement is publication-approved;
- targeted tests and audit pass.
