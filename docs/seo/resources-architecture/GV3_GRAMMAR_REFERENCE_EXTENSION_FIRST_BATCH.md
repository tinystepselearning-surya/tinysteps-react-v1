# GV3 — First Grammar Reference-Extension Publication Batch

**Status:** implementation and publication brick  
**Revision:** `2026-09-27-gv3`  
**Base:** merged GV1 authority requirements + merged GV2 Vocabulary lexical model  
**Scope:** six Grammar reference guides only

## Purpose

GV3 publishes the first high-value reference layer identified in GV1 without changing the established Tiny Steps Grammar learning progression.

The existing Grammar pathway remains:

- **38 learning steps**
- **32 governed focused Grammar knowledge pages**
- **6 established canonical owners** for topics already covered strongly elsewhere

GV3 adds a separate **reference library of six pages**. These pages deepen topics that cut across multiple learning steps or need a consolidated reference explanation. They are not inserted into the 38-step sequence and do not renumber it.

## First publication batch

GV3 publishes exactly these six reference guides:

1. **Determiners for Kids**  
   `/resources/grammar/determiners-for-kids`

2. **Countable & Uncountable Nouns**  
   `/resources/grammar/countable-uncountable-nouns-for-kids`

3. **Noun Phrases for Kids**  
   `/resources/grammar/noun-phrases-for-kids`

4. **Verb Forms & Irregular Verbs**  
   `/resources/grammar/verb-forms-irregular-verbs-for-kids`

5. **Word Order in English**  
   `/resources/grammar/word-order-for-kids`

6. **Common Grammar Mistakes for Kids**  
   `/resources/grammar/common-grammar-mistakes-for-kids`

## Why these six were selected first

These six close the largest reference gaps while connecting strongly to existing Tiny Steps curriculum owners.

### Determiners

The core sequence already teaches articles and quantifiers. The reference guide connects articles, demonstratives, possessives, numbers and quantifiers into one noun-reference system without replacing those focused core pages.

### Countable and uncountable nouns

Countability affects articles, plural forms and quantifier choice across several existing lessons. A dedicated reference owner reduces repeated partial explanations and gives children one place to diagnose forms such as `many homework`, `an advice` or `informations`.

### Noun phrases

Tiny Steps already teaches nouns, adjectives, determiners and agreement. The noun-phrase reference shows how those skills combine around a head noun and supports longer-sentence comprehension and subject–verb agreement.

### Verb forms and irregular verbs

The core sequence teaches tenses, perfect forms, questions and passive voice. GV3 consolidates the underlying base/past/participle/-ing/third-person form system so children can understand why patterns such as `did go`, `has gone` and `is going` use different forms.

### Word order

The existing sentence-formation owner remains intact. The reference guide goes deeper into statement order, question order, adverb placement and information focus without competing with the broader sentence-formation diagnostic owner.

### Common Grammar Mistakes

Every Grammar page already includes local mistakes. This reference page acts as a **diagnostic router**: identify the error family, explain the rule, correct it and move into the relevant focused guide. It does not replace the existing problem-aware owner for children who know rules but fail to transfer them.

## Authority-content contract

Every GV3 page must satisfy the stronger GV1 publication floor:

- at least **600 knowledge words**;
- at least **2 authoritative references**;
- at least **3 worked examples**;
- at least **3 core rule/pattern explanations**;
- at least **3 common mistakes**;
- at least **2 tricky cases**;
- at least **3 guided-practice prompts**;
- at least **2 meaningful FAQs**;
- a parent/teacher teaching note;
- descriptive related-learning links;
- visible reference links;
- unique canonical ownership;
- sitemap/prerender/public-manifest inclusion;
- AI answer-layer and machine-corpus inclusion only after publication approval.

The word floor is a thin-content safeguard, not a writing target.

## Evidence basis

GV3 uses authoritative references to verify definitions and usage while keeping Tiny Steps explanations, examples and sequencing original.

Reference families include:

- **Cambridge Dictionary — English Grammar Today**
  - determiners;
  - determiners and noun types;
  - countable and uncountable nouns;
  - noun phrases;
  - verb forms;
  - word order and focus;
  - questions;
  - common learner mistakes.

- **British Council LearnEnglish**
  - determiner/quantifier reference;
  - countable and uncountable nouns;
  - clause structure and verb patterns;
  - irregular verbs;
  - general learner Grammar reference.

- **Purdue Online Writing Lab**
  - sentence clarity where the diagnostic error guide needs a writing-level reference.

The sources support grammar facts and usage checks. Tiny Steps does not reproduce their teaching copy or curriculum structure.

## Renderer architecture

GV3 reuses the established `GrammarKnowledgePage` renderer.

The resolver now reads a unified Grammar knowledge registry:

- 32 core/programmatic Grammar pages;
- 6 GV3 reference pages;
- **38 total published Grammar knowledge pages**.

The renderer explicitly distinguishes the two systems:

### Core page

> Grammar learning sequence · Step X of 38

### GV3 reference page

> Grammar reference library · Reference guide X of 6

Previous/next navigation for a reference page stays inside the six-page reference batch. Reference pages therefore cannot accidentally appear as hidden curriculum steps.

## Grammar hub discovery

The Grammar hub keeps the existing 38-step sequence grid and adds a separate **Grammar reference library** grid.

The reference grid explains that the guides deepen selected topics and do not add hidden steps or replace the established pathway.

The grid imports only the lightweight reference manifest. Rich teaching content is not loaded into the hub merely to render six discovery cards.

## Canonical ownership

Each GV3 URL receives one informational `skill-guide` owner under the Grammar & Writing subject with:

- owner path = the reference URL;
- hub = `/resources/grammar`;
- supporting paths = the Grammar hub plus conceptually related existing owners;
- no commercial-owner mutation.

The Grammar subject hub remains a discovery owner only.

## AI and machine-readable corpus

GV3 extends the governed Grammar knowledge count from:

- **32 core knowledge URLs**

to:

- **38 total Grammar knowledge URLs**

The AI concept layer therefore becomes:

- 27 curated concept owners;
- 31 governed Phonics resources;
- 38 governed Grammar knowledge resources;
- **96 Layer-2 items total**.

Each GV3 page is also represented in the generated Grammar corpus with:

- `content_type: grammar-reference-extension`;
- canonical URL;
- related URLs;
- existing Grammar practice URLs;
- visible external reference URLs.

The source URLs are derived from references shown on the page itself.

## Frozen architecture protections

### 38-step Grammar sequence

GV3 does not change:

- sequence length;
- sequence order;
- the six established canonical owners inside that sequence;
- the 32 existing focused Grammar pages.

### Historical GR6 semantic graph

GR6 is a frozen pre-programmatic graph. It deliberately filters child routes under `/resources/grammar/*`.

GV3 reference pages must **not** be back-propagated into its historical 17-owner public graph or its 90 semantic-node baseline.

### Commercial C7

GV3 does not:

- create or change a commercial URL;
- mutate C2 ownership;
- mutate C4 metadata experiments;
- mutate C5 conversion ownership;
- mutate C6 frozen architecture;
- add ad-hoc commercial rules for the six new reference URLs.

The shared Grammar renderer may display a C7 handoff only when the existing frozen C7 rule system already provides one. A missing C7 mapping on a new informational reference is not repaired by weakening or rewriting frozen C7 governance.

### Bundle guard

The existing **150 KiB gzip public bundle guard remains unchanged**.

If GV3 content causes an eager bundle regression, the correct fix is to isolate rich content from eager discovery/AI metadata imports rather than raise the guard.

## Remaining GV1 Grammar reference requirements

GV3 intentionally leaves these six reference requirements unpublished:

1. Prepositional Phrases
2. Phrasal Verbs & Particles
3. Gerunds, Infinitives & Verb Patterns
4. Word Formation: Prefixes, Suffixes & Word Families
5. Collocations for Kids
6. Easily Confused English Words

They remain candidates for a later controlled batch after the first six pass source, quality, discovery and production checks.

## GV3 closure conditions

GV3 is complete when:

- the original 38-step sequence remains exactly 38;
- the original generated core pages remain exactly 32;
- exactly six GV3 reference pages are publication-approved;
- unified Grammar knowledge contains exactly 38 unique URLs;
- all six pages clear the >=600-word authority-content floor;
- all six have >=2 visible authoritative references;
- routing, canonical metadata and public manifests include all six;
- canonical ownership contains exactly six `gv3-grammar-ref-*` owners;
- the Grammar hub exposes a distinct reference-library grid;
- the AI concept layer contains 38 Grammar knowledge URLs and 96 total Layer-2 items;
- generated machine corpus exposes all six as `grammar-reference-extension`;
- GR6 historical counts remain unchanged;
- C7 frozen architecture remains unchanged;
- the 150 KiB public bundle limit remains unchanged;
- targeted source tests, audits, typecheck, full build and rendered audits are green.
