# Blog Authority Template — Batch 2

**Status:** curated authority refinement batch  
**Revision:** `2026-09-28-batch2`  
**Base:** shared authority layout already active across all 83 registered blogs  
**Publication effect:** no new URLs; no article-body rewrite

## Why this is Batch 2

The reusable SATPIN-style authority layout is already global on current `main`. All 83 registered blog articles already receive:

- compact dark hero;
- reviewed 16:9 hero-family image;
- sticky desktop guide index;
- mobile guide index;
- editorial article renderer;
- evidence treatment;
- FAQ;
- author attribution;
- tracked conversion surface.

The original five pilot articles additionally have bespoke hero points and curated eight-section guide indexes. Batch 2 extends that **bespoke curation layer** to five more search-visible articles rather than recreating the shared template.

## Selection basis

Google Search Console planning data for **2026-08-29 through 2026-09-25** was used to identify non-pilot articles already receiving meaningful search exposure in striking distance.

| Article | Clicks | Impressions | CTR | Avg position |
| --- | ---: | ---: | ---: | ---: |
| `/blog/grammar-conjunctions` | 26 | 3,079 | 0.84% | 6.92 |
| `/blog/grammar-tenses` | 46 | 2,079 | 2.21% | 6.42 |
| `/blog/long-vowel-sounds-for-kids` | 9 | 2,013 | 0.45% | 8.53 |
| `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | 8 | 608 | 1.32% | 7.42 |
| `/blog/child-gives-one-word-answers` | 8 | 583 | 1.37% | 6.96 |

These figures are selection evidence, not a promise that the template refinement itself will change rankings or CTR.

## Batch 2 articles

1. `grammar-tenses`
2. `grammar-conjunctions`
3. `long-vowel-sounds-for-kids`
4. `why-child-knows-letter-sounds-but-cannot-read-words`
5. `child-gives-one-word-answers`

## Refinement contract

Each article receives:

- three article-specific hero guidance points;
- a curated eight-section H2 guide index chosen from existing headings;
- the same shared authority renderer already used site-wide.

## Protected surfaces

Batch 2 does **not** change:

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

The dedicated audit fails if those protected blog/SEO files are changed in the Batch 2 PR.

## Article-specific curation

### Grammar Tenses
Hero: timeline → meaning-based choice → spoken/written transfer.

Curated guide index:
- quick answer;
- Tiny Steps timeline;
- simple present;
- simple past;
- future time;
- Tiny Steps tense pathway;
- security/progress check;
- evidence.

### Grammar Conjunctions
Hero: relationship → connector choice → fresh-sentence transfer.

Curated guide index:
- quick answer;
- conjunction framework;
- because vs so;
- two sentences to one;
- conjunction ladder;
- practice;
- security/progress check;
- evidence.

### Long Vowel Sounds
Hero: pattern families → reading/spelling comparison → controlled progression.

Curated guide index:
- quick answer;
- main pattern families;
- teaching order;
- learning chain;
- common mix-ups;
- reading + spelling;
- readiness for next pattern;
- evidence.

### Letter Sounds but Cannot Read Words
Hero: diagnose the sounds-to-blending bridge → controlled CVC practice → fresh-word transfer.

Curated guide index:
- quick answer;
- right-guide check;
- six-stage decoding check;
- six common causes;
- home routine;
- stuck-word prompts;
- progress;
- evidence.

### One-Word Answers
Hero: identify the bottleneck → expand one idea → fade support.

Curated guide index:
- quick answer;
- separate nearby speaking problems;
- six-question cause map;
- answer-expansion checkpoint;
- prompt fading;
- home routine;
- progress;
- evidence.

## Validation

Batch 2 adds:

- `src/tests/seo/authorityBlogBatch2Template.spec.ts`
- `scripts/audit-authority-blog-batch2.mjs`
- `.github/workflows/blog-authority-template-batch2.yml`

The gate verifies the five-article scope, preserves the original pilots, rejects protected content/SEO diffs, runs typecheck and the normal full build/prerender, and verifies the bespoke hero and guide-index text in rendered HTML.
