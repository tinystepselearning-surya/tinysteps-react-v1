# Tiny Steps SEO Recovery — Brick 10 CTR Optimization

**Date:** 2026-09-12  
**Status:** CLOSED — first controlled CTR batch implemented  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

## Objective

Improve click-through rate on existing URLs that already earn meaningful impressions and rank within reach, without creating new SEO pages, changing canonical ownership, or rewriting ranking pages wholesale.

## GSC evidence window

Finalized Google Search Console data used for this brick:

- Current: **2026-08-13 to 2026-09-09**
- Comparison: **2026-07-16 to 2026-08-12**
- Site totals: 3,490 clicks, 46,626 impressions, 7.49% CTR, average position 8.00

Search Console is treated as performance evidence, not search-volume data.

## Controlled batch

Brick 10 deliberately changes snippets for only five educational pages from the recovery master plan.

| URL | Clicks | Impressions | CTR | Avg position | Brick 10 action |
| --- | ---: | ---: | ---: | ---: | --- |
| `/blog/satpin-phonics-guide` | 83 | 6,907 | 1.20% | 7.91 | Title + meta experiment |
| `/blog/long-vowel-sounds-for-kids` | 5 | 695 | 0.72% | 8.78 | Title + meta experiment |
| `/blog/grammar-conjunctions` | 1 | 565 | 0.18% | 7.45 | Title + meta experiment |
| `/blog/grammar-subject-verb` | 0 | 159 | 0.00% | 6.30 | Title + meta experiment |
| `/blog/digraphs-and-tricky-words` | 1 | 176 | 0.57% | 7.17 | Title + meta experiment |

## New snippets

### SATPIN

**Title:** `SATPIN Phonics Guide: Sounds, Order, Words & Blending`

**Meta:** `What is SATPIN phonics? Learn the SATPIN order, sounds, words, blending, early sentences and what comes next, with practical examples for parents.`

Reason: Search Console shows strong impressions across SATPIN, SATPIN phonics, SATPIN method, SATPIN reading, SATPIN order and SATPIN words, while the page CTR remains low.

### Long vowels

**Title:** `Long Vowel Sounds for Kids: Rules, Patterns & Examples`

**Meta:** `Learn long vowel sounds for kids with clear examples of silent-e, vowel teams and open syllables, plus common mix-ups and what to practise next.`

Reason: The page already ranks within reach. The test foregrounds common parent search language rather than the narrower phrase “pattern order”.

### Conjunctions

**Title:** `Conjunctions for Kids: And, But, Because & So Examples`

**Meta:** `Teach conjunctions for kids with simple and, but, because and so examples. Learn how each word joins ideas, shows contrast, gives reasons or shows results.`

Reason: 565 impressions at average position 7.45 produced only one click. The experiment makes the concrete conjunction examples explicit.

### Subject-verb agreement

**Title:** `Subject-Verb Agreement for Kids: Rules, Examples & Mistakes`

**Meta:** `Learn subject-verb agreement for kids with simple rules and examples for he, she, it, they, is/are and has/have, plus common mistakes and easy fixes.`

Reason: Zero clicks despite average position 6.30. The snippet now exposes the actual grammar examples parents are likely looking for.

### Digraphs and tricky words

**Title:** `Digraphs and Tricky Words for Kids: Examples & Reading Tips`

**Meta:** `Learn digraphs and tricky words with examples such as sh, ch and ng. See what children can decode, what needs extra attention and how to avoid whole-word guessing.`

Reason: The page already sits around position 7 but has weak CTR. The test adds concrete digraph examples and clarifies the reading job.

## Technical implementation

Central experiment registry:

`src/config/seoRecoveryBrick10CtrExperiments.ts`

The registry stores:

- finalized GSC measurement range;
- baseline clicks, impressions, CTR and average position;
- test title and meta description;
- rationale for each experiment.

`src/content/blog/index.ts` applies the experiment **after legacy public slug normalization and existing title optimization**, so the experiment targets the live public slug rather than old internal weekly identifiers.

Regression guard:

`src/tests/seo/recoveryBrick10CtrExperiments.spec.ts`

The guard ensures:

- exactly five URLs are in the first experiment batch;
- title/meta lengths remain controlled;
- each page had meaningful impressions and average position under 10 at baseline;
- renamed weekly grammar pages receive the experiment on their public slugs;
- non-experiment pages remain untouched.

## Pages deliberately not changed in this batch

Search Console also identifies low CTR on pages such as `/pricing`, `/courses`, `/why-tiny-steps`, `/contact`, `/class-samples`, and other articles. They are not included in this first batch because Brick 10 uses controlled experiments rather than changing many snippets at once.

Commercial phonics pages are also not broadly rewritten here. Their recovery is being measured separately because rank deterioration and query-owner consolidation are more important than changing several commercial signals simultaneously.

## Measurement protocol

Do not judge the experiment immediately after deployment.

- Days 1–7: verify indexing/crawl and snippet deployment only.
- Days 14–21: inspect CTR, clicks, impressions, average position and ranking URL.
- Day 28+: compare a full post-change window against the Brick 10 baseline.

A title/meta test is considered useful only if CTR improves without damaging query-owner consistency or materially worsening average position.

## Brick 10 closure decision

Brick 10 implementation is complete because:

- five evidence-backed low-CTR pages are in one controlled experiment batch;
- no new SEO page was created;
- no canonical owner or URL changed;
- no whole-page rewrite was performed merely to chase CTR;
- baseline GSC metrics are recorded for later comparison;
- regression protection is present.

**Brick 10: CLOSED.**

Next recovery stage: **Brick 11 — Technical Consolidation.**
