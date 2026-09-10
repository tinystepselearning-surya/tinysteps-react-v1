# GR1 — Grammar & Writing Knowledge Taxonomy

**Status:** implementation brick  
**Revision:** `2026-09-10-gr1`  
**Base architecture:** R17 Grammar/Writing domains  
**Publication effect:** none

## Purpose

GR1 freezes the canonical conceptual model for Grammar & Writing before the deeper tense, writing-progression, parent-problem, practice and semantic-journey bricks are built.

GR1 does **not** create new public routes, change canonical ownership, alter `/grammar`, or turn individual grammar labels into SEO pages. It refines the existing nine R17 domains into a stable skill graph that downstream bricks can reuse.

The graph is intentionally not a claim that every child develops through one rigid sequence. The ordered list supports navigation and curriculum reasoning; prerequisite and next-skill relationships may branch and converge.

## Frozen skill model

1. **Sentence Foundations**
2. **Nouns & Pronouns**
3. **Verbs**
4. **Adjectives & Adverbs**
5. **Articles & Determiners**
6. **Prepositions**
7. **Conjunctions**
8. **Agreement**
9. **Tenses**
10. **Clauses & Sentence Combining**
11. **Punctuation**
12. **Paragraph Writing**
13. **Descriptive & Narrative Writing**
14. **Editing & Revision**

## R17 domain reuse

| GR1 skill | Primary R17 domain |
| --- | --- |
| Sentence Foundations | `sentence-core` |
| Nouns & Pronouns | `word-classes-morphology` |
| Verbs | `word-classes-morphology` |
| Adjectives & Adverbs | `sentence-expansion` |
| Articles & Determiners | `word-classes-morphology` |
| Prepositions | `sentence-expansion` |
| Conjunctions | `clauses-connectives` |
| Agreement | `verb-tense-agreement` |
| Tenses | `verb-tense-agreement` |
| Clauses & Sentence Combining | `clauses-connectives` |
| Punctuation | `punctuation-conventions` |
| Paragraph Writing | `cohesion-paragraphs` |
| Descriptive & Narrative Writing | `composition-idea-development` |
| Editing & Revision | `editing-transfer` |

All nine R17 domains remain represented. GR1 does not introduce another domain vocabulary.

## Progression graph

The canonical root is **Sentence Foundations**. The terminal transfer node is **Editing & Revision**.

Important branching examples:

- Sentence Foundations can lead directly into nouns/pronouns, verbs and basic punctuation.
- Nouns/pronouns and verbs converge on subject–verb agreement.
- Agreement and verbs converge on tense control.
- Conjunctions, tense control and sentence combining converge on paragraph writing.
- Adjectives/adverbs, tense control and paragraph writing support descriptive/narrative composition.
- Agreement, tense, punctuation, paragraph organisation and composition all feed editing/revision.

Every declared prerequisite is reciprocated by a corresponding next-skill edge. Every GR1 skill is reachable from Sentence Foundations and can progress to Editing & Revision.

## Boundary with later Session B bricks

### GR2 — Tense Knowledge Architecture

GR1 owns only the canonical **Tenses** concept node and broad time/consistency scope. GR2 will define the detailed structure for simple present, present continuous, simple past, past continuous, simple future/future forms, present perfect, past perfect, comparisons, tense consistency and common child errors.

### GR3 — Writing Progression

GR1 establishes the writing nodes and prerequisites. GR3 will model the fuller journey from word → sentence → expanded sentence → connected sentences → paragraph → cohesive paragraph → description → narrative → explanation/opinion → editing, and connect curriculum lessons where academically appropriate.

### GR4–GR6

Parent-problem ownership, reusable practice utilities and semantic relationships will attach to these canonical skill IDs. They should not create parallel skill labels or independent taxonomies.

## SEO and publication guardrails

GR1 is architecture-only:

- no new routes;
- no new indexable pages;
- no canonical-owner changes;
- no sitemap changes;
- no `/resources/grammar` UI expansion;
- no split pages for nouns, verbs, adjectives, articles, prepositions or punctuation marks;
- no tense-per-page expansion in GR1.

## Closure conditions for GR1

GR1 is complete when:

- all 14 requested skill nodes are frozen in stable order;
- all nine R17 domains are reused;
- every non-root node has at least one prerequisite;
- every non-terminal node has at least one next skill;
- prerequisite/next relationships are reciprocal and resolvable;
- the root can reach every node;
- every node can reach Editing & Revision;
- no publication or canonical-ownership fields are introduced;
- targeted GR1 tests and the GR1 audit pass;
- existing R17/R19 grammar architecture regressions remain green.
