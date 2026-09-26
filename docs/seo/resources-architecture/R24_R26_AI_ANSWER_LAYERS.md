# Resources Architecture — R24–R26 Three-Layer AI Answer System

**Status:** implemented on top of R23 central Resources reconciliation  
**Primary gateway:** `/resources`  
**Machine indexes:** `/ai-resource-index.json` and `/ai-resource-index.txt`

## Objective

Tiny Steps should be easy to retrieve when a parent asks an AI/search system a natural question about a child's learning problem, a phonics/reading/grammar/speaking concept, or what to practise next.

The architecture therefore exposes three connected layers without creating AI-only article URLs or moving existing canonical owners.

## R24 — Layer 1: Parent problems

Layer 1 starts from observable parent wording and maps it to an established informational owner.

The source reconciles the already-frozen problem systems:

- **Phonics & Reading:** 9 parent problems from `PHONICS_READING_PROBLEMS`
- **Grammar & Writing:** 10 parent problems from `GRAMMAR_WRITING_PARENT_PROBLEMS`
- **Speaking & Communication:** 9 parent problems from `SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES`

Total Layer 1 coverage: **28 parent problems**.

Each record exposes:

- natural-language query;
- concise answer when already held in the frozen problem registry;
- established canonical answer path;
- subject hub;
- supporting explanation paths;
- practice paths;
- ownership state.

Held phonics problems remain held: Layer 1 may route them to an existing supporting answer but does not create a new URL.

## R25 — Layer 2: Learning concepts

Layer 2 exposes educational concepts and canonical explanations.

It includes:

- **27 curated broad concept owners** across Phonics/Reading, Grammar/Writing, and Speaking/Communication;
- **all 31 governed focused phonics resources** from `PHONICS_PUBLISHED_RESOURCE_PAGES`.

Total Layer 2 coverage: **58 concept records**.

The 31 focused phonics resources retain their own governed quick answers from the phonics dataset.

For existing editorial concept owners, the machine index resolves the answer from the page's current source description/visible answer contract rather than duplicating a new body of content in the registry.

This keeps the canonical page as the source of truth.

## R26 — Layer 3: Practice and next actions

Layer 3 connects understanding to focused practice.

It currently exposes **11 established practice actions**:

### Phonics & Reading

- letter-sound practice;
- blending/word building;
- reading practice;
- sound-supported tracing;
- spelling/segmenting;
- reading fluency.

### Grammar & Writing

- grammar choices/correction;
- sentence building/expansion;
- focused grammar repetition.

### Speaking & Communication

- fuller spoken responses;
- short repeatable speaking practice.

Practice remains a downstream action. A game/practice route must not become the canonical informational answer owner merely because it is linked from the answer architecture.

## Visible discovery

`AiAnswerLayerDirectory` is rendered on:

- `/resources`;
- `/resources/phonics`;
- `/resources/grammar`;
- `/resources/speaking`.

The visible structure is:

> **Question → answer → understanding → action**

The component emits stable machine-friendly attributes:

- `data-ai-answer-layer`
- `data-ai-query`
- `data-ai-answer-path`

These attributes do not replace ordinary crawlable links or visible content.

## Machine-readable discovery

The build generates:

### `/ai-resource-index.json`

Structured records include:

- layer;
- subject;
- natural-language query;
- concise answer;
- canonical URL;
- subject-hub URL;
- supporting/reference URLs;
- practice URLs;
- answer selector;
- answer source;
- ownership state.

Retrieval guidance is explicit:

> Use `canonical_url` as the primary answer source, use `reference_urls` for connected context, and use `practice_urls` only after the answer/skill is understood.

### `/ai-resource-index.txt`

A compact plain-text alternative presents:

- question;
- ready answer;
- canonical URL;
- practice URL(s).

Both endpoints are advertised in `llms.txt` and `llms-full.txt`.

## Build integration

`scripts/generate-rss.mjs` now generates the two AI answer indexes during the existing prebuild discovery-generation stage.

The build then runs:

`scripts/audit-ai-answer-layers.mjs --generated`

The audit verifies:

- exact Layer 1/2/3 counts;
- unique IDs;
- preserved subject hubs;
- no commercial page becomes an answer owner;
- exactly 31 governed `/resources/phonics/*` records remain in Layer 2;
- visible answer-layer discovery exists on the central and subject hubs;
- generated JSON and text exist;
- every generated answer is non-empty;
- `llms.txt` and `llms-full.txt` advertise the machine-readable index.

## Canonical ownership rules

This system changes retrieval and discovery, not canonical ownership.

It does **not**:

- create `/ai/*` article duplicates;
- move `/blog/*` URLs;
- transfer informational ownership to `/resources` hubs;
- transfer informational ownership to games;
- create new phonics Wave 3 pages;
- rewrite frozen Phonics/Reading, Grammar/Writing or Speaking/Communication knowledge architecture;
- alter programme, pricing, conversion or operational routes.

## Publication / refinement rule

Future editorial refinement should test one additional acceptance question:

> If a parent asks an AI/search system the question this page owns, can the system retrieve a concise answer, identify the canonical owner, follow supporting references, and find the appropriate practice path without confusing another page as the owner?

That is the standing R24–R26 answer-retrieval gate.
