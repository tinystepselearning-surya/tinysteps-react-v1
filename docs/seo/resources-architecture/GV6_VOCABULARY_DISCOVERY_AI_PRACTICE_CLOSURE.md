# GV6 — Vocabulary Discovery, AI and Practice Integration Closure

**Status:** final integration and freeze brick  
**Revision:** `2026-09-27-gv6`  
**Base:** merged GV5B 16/16 Vocabulary authority estate  
**Publication effect:** no new authority topics or routes

## Purpose

GV6 closes the Grammar + Vocabulary authority roadmap defined in GV1. GV4, GV5 and GV5B already published the complete sixteen-guide Vocabulary estate. GV6 therefore does not add more content. It verifies and freezes the discovery, machine-retrieval, practice, semantic-transfer and measurement contracts around the completed estate.

## Frozen estate

- Vocabulary stages: **6**
- frozen Vocabulary authority requirements: **16**
- published Vocabulary authority guides: **16**
- unpublished planned Vocabulary guides: **0**
- Vocabulary Adventure lexical baseline: **50 words**
- Vocabulary knowledge hub: `/resources/vocabulary`
- Vocabulary practice owner: `/free-games/word-meaning-flashcards`

No new Vocabulary authority URL, taxonomy topic, lexical-baseline expansion or second practice owner is authorised by GV6.

## Discovery closure

Every Vocabulary authority guide must remain:

- present in the public route manifest;
- indexable;
- self-canonical in route SEO;
- represented by exactly one Vocabulary canonical owner;
- present in the generated sitemap/prerender estate;
- measurable through the public analytics path policy.

The existing hub is measured as a static public path and all guide URLs are covered by the `/resources/vocabulary/` dynamic analytics prefix.

## AI answer-layer closure

GV6 freezes the existing three-layer answer architecture:

- Layer 1 remains the parent-problem layer.
- Layer 2 remains **112** learning concepts overall and contains all **16** Vocabulary authority guides.
- Layer 3 remains **12** practice actions overall.
- Vocabulary has exactly **one** Layer 3 practice owner: Vocabulary Adventure.

The machine-readable files remain:

- `/ai-resource-index.json`
- `/ai-resource-index.txt`

GV6 advances the answer-index revision to `2026-09-27-gv6` without changing canonical educational ownership.

## LLM discovery closure

`scripts/generate-rss.mjs` now generates a dedicated section in both:

- `/llms.txt`
- `/llms-full.txt`

The section is named:

**Vocabulary Authority Library — 16 governed guides**

It enumerates all sixteen canonical Vocabulary authority URLs, identifies Vocabulary Adventure as the practice owner, and states the Reading / Speaking / Writing semantic-transfer boundaries.

The LLM files are generated artifacts. CI validates the generated result after the normal prebuild generation step rather than treating hand-maintained copies as the source of truth.

## Practice integration

Every Vocabulary authority page continues to route focused practice to:

`/free-games/word-meaning-flashcards`

GV6 does not create a new game or duplicate the 50-word lexical dataset.

## Reading, Speaking and Writing semantic connections

Vocabulary remains a knowledge owner for word meaning, retrieval, natural usage and lexical transfer. It may point to adjacent programme owners when the learner is applying vocabulary inside another skill, but those links do not transfer canonical ownership.

The frozen semantic destinations are:

- **Reading:** `/reading-classes-for-kids`
- **Speaking / conversation:** `/spoken-english-classes-for-kids-online`
- **Writing:** `/writing-classes-for-kids`

Required examples remain explicit:

- Context Clues → Reading
- Vocabulary for Speaking & Conversation → Spoken English
- Vocabulary for Better Writing → Writing

## Commercial / C7 protection

All sixteen Vocabulary authority guides remain C7 soft-discovery surfaces:

- R1 primary commercial owner = `null`
- R1 owner family = `soft-discovery`
- R1 decision = `HOLD_SOFT_DISCOVERY`
- R2 rule = `SOFT_DISCOVERY`
- R2 commercial destination = `null`
- R2 prompt cap = **0**
- R3 handoff = `null`

Semantic related links are educational connections, not C7 commercial prompts. GV6 does not mutate C2, C4, C5, C6 or the single conversion-owner policy.

## Measurement and expansion gate

GV6 makes the completed estate measurable without inventing a numeric performance threshold.

Expansion defaults to **HOLD**.

The architecture may be reopened only when all of the following are true:

1. measured search, AI-retrieval or engagement evidence shows a real unmet intent;
2. no existing canonical owner already answers that intent;
3. a source-backed authority plan exists;
4. the normal publication quality gates can be met.

Useful evidence signals include:

- search impressions and query coverage;
- AI retrieval or citation coverage;
- authority-to-practice engagement;
- a clearly distinct unmet intent with no current canonical owner.

## Validation

GV6 adds:

- `src/lib/vocabularyGv6Closure.js`
- `src/tests/seo/vocabularyAuthorityGv6.spec.ts`
- `scripts/audit-vocabulary-authority-gv6.mjs`
- `.github/workflows/resources-gv6-vocabulary-closure.yml`

The dedicated workflow validates:

- 16/16 route, SEO and canonical coverage;
- public analytics coverage;
- AI Layer 2 / Layer 3 contracts;
- generated AI index revision;
- generated `llms.txt` and `llms-full.txt` coverage;
- Vocabulary Adventure ownership;
- Reading / Speaking / Writing semantic connections;
- C7 soft-discovery preservation;
- sitemap/prerender output;
- GV5B preservation;
- typecheck, full build and the 150 KiB gzip public-bundle guard.

## Closure condition

The Grammar + Vocabulary authority roadmap is closed when the GV6 workflow and normal repository CI are green on a branch that is **0 commits behind `main`**, and the merged production deployment passes its post-merge SEO and Firebase checks.
