# Blog Authority Template — Batch 3

**Status:** curated authority refinement batch  
**Revision:** `2026-10-01-batch3`  
**Base:** shared authority layout already active across all 83 registered blogs  
**Publication effect:** no new URLs; no article-body rewrite

## Why this is Batch 3

The reusable authority layout is already global. The pilot and Batch 2 cohorts add article-specific hero guidance and curated eight-section guide indexes. Batch 3 extends only that bespoke curation layer to five additional search-visible articles.

## Selection basis

The primary shortlist used settled Google Search Console planning data for **2026-08-31 through 2026-09-27** and excluded:

- original authority pilots;
- Batch 2 articles;
- `satpin-phonics-guide`, which already has a bespoke SATPIN experience;
- URLs already in the active CTR experiment registry;
- commercial and Resources URLs, to keep this batch a clean blog-authority refinement.

Search Console showed the following four pages directly in the latest low-CTR striking-distance set:

| Article | Clicks | Impressions | CTR | Avg position |
| --- | ---: | ---: | ---: | ---: |
| `/blog/phonics-tricky-words` | 4 | 682 | 0.59% | 6.34 |
| `/blog/grammar-editing-camp` | 4 | 469 | 0.85% | 8.27 |
| `/blog/cvc-words-explained-for-parents` | 2 | 421 | 0.48% | 8.89 |
| `/blog/phonics-blending-club` | 2 | 233 | 0.86% | 11.86 |

The fifth page, `/blog/how-children-recognise-words-automatically-after-phonics`, was selected from the immediately preceding settled window, where it had **178 impressions, 1 click, 0.56% CTR and average position 5.46**. It remains a useful high-ranking/low-engagement research article for the same authority-template treatment.

These figures are selection evidence, not a promise that the refinement itself will change rankings or CTR.

## Batch 3 articles

1. `phonics-tricky-words`
2. `grammar-editing-camp`
3. `cvc-words-explained-for-parents`
4. `phonics-blending-club`
5. `how-children-recognise-words-automatically-after-phonics`

## Refinement contract

Each article receives:

- three article-specific hero guidance points;
- a curated eight-section H2 guide index chosen from existing headings;
- the same shared authority renderer already used site-wide.

## Protected surfaces

Batch 3 does **not** change:

- article body content;
- titles or meta descriptions;
- canonical URLs;
- index/noindex policy;
- FAQ copy or schema;
- author attribution;
- technical authority;
- canonical topic ownership;
- hero-family mapping;
- commercial handoff ownership;
- CTA/conversion-family configuration;
- CTR experiment configuration.

The dedicated audit fails if those protected blog/SEO files are changed in the Batch 3 PR.

## Article-specific curation

### Tricky Words
Hero: separate regular and unexpected spelling information → keep attention on print → verify reading/spelling transfer.

Curated guide index:
- quick answer;
- tricky/high-frequency/sight-word distinction;
- six-step routine;
- worked `said` example;
- stage-based word choice;
- print-focused practice;
- four-signal mastery check;
- evidence.

### Grammar Editing Camp
Hero: find one target → explain the reason → fix, reread and transfer.

Curated guide index:
- quick answer;
- editing vs revising vs proofreading;
- Tiny Steps editing cycle;
- editing ladder;
- five high-value activities;
- worked paragraph edit;
- independent editing;
- evidence.

### CVC Words
Hero: decode from sound–print knowledge → vary fresh short-vowel words → progress through reading, spelling and transfer.

Curated guide index:
- quick answer;
- CVC structure;
- prerequisites;
- six-step decoding ladder;
- parent practice sequence;
- common mistakes;
- security check;
- evidence.

### Blending Practice
Hero: secure sounds first → use a connected left-to-right blend → check transfer in fresh words and matched text.

Curated guide index:
- quick answer;
- who the routine is for;
- sound check;
- five-part routine;
- daily routine;
- breakdown prompts;
- progress check;
- evidence.

### Automatic Word Recognition
Hero: decode the complete print → connect spelling, pronunciation and meaning → build accurate familiarity and fluency.

Curated guide index:
- quick answer;
- three behaviours that can look like word knowledge;
- orthographic mapping;
- why phonics supports familiarity;
- repeated reading;
- parent support;
- observable signals;
- evidence boundary.

## Validation

Batch 3 adds:

- `src/tests/seo/authorityBlogBatch3Template.spec.ts`
- `scripts/audit-authority-blog-batch3.mjs`
- `.github/workflows/blog-authority-template-batch3.yml`

The gate verifies the five-article scope, preserves the pilot and Batch 2 layers, rejects active CTR-experiment collisions and protected content/SEO diffs, runs typecheck and the normal full build/prerender, and verifies the bespoke hero and guide-index text in rendered HTML.
