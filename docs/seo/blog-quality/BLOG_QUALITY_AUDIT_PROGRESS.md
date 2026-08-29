# Tiny Steps Blog Quality Audit & Refresh Programme

## Sequence authority

The programme numbering is locked to the founder-supplied **authoritative 76-blog inventory** dated 2026-08-30.

- Blogs **1–34**: Phonics
- Blogs **35–51**: Parent Tips / English Communication
- Blogs **52–60**: Research / Schools
- Blogs **61–68**: Grammar
- Blogs **69–76**: Public Speaking

The full fixed order lives in `docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md`.

Previous refresh PRs #158–#161 remain valid content improvements, but they do not define the authoritative blog numbering.

## Delivery model — 10 blogs per merge batch

Batch #1 uses one branch and one PR for Blogs #1–#10:

- Branch: `seo/blog-quality-sequence-01-benefits-phonics`
- PR: `#163`
- No individual blog merge while the batch is incomplete.
- Each blog receives focused regression coverage when locked.
- The decisive full exact-head CI/SEO gate runs after Blog #10.
- Merge to `main` requires explicit founder approval for the complete batch.

## Standard 100-point quality rubric

| Dimension | Points |
|---|---:|
| Search-intent match | 15 |
| Reader usefulness | 15 |
| Content depth | 10 |
| Tiny Steps first-party insight | 10 |
| Accuracy & evidence | 10 |
| Uniqueness / cannibalization | 10 |
| SEO quality | 10 |
| AEO / GEO / LLM extractability | 10 |
| Trust / E-E-A-T | 5 |
| Next-step usefulness | 5 |
| **Total** | **100** |

Target: **90+/100** with no factual, pedagogical, evidence, diagnosis-boundary, trust, cannibalization or misleading-timeline hard fail.

## Batch #1 progress — Blogs #1–#10

| # | Article | Baseline | Status | Main action | Score after refresh |
|---:|---|---:|---|---|---:|
| 1 | Benefits of Phonics for Kids: What Parents Usually Notice First | 57/100 | **LOCKED IN BATCH** | Realistic phonics-benefits owner; removes fixed outcome timelines, separates decoding/spelling/fluency/comprehension, adds transfer signals and evidence | **95/100** |
| 2 | Child Knows ABC but Cannot Read: What Parents Should Check First | 65/100 | **LOCKED IN BATCH** | ABC-to-reading bottleneck owner; six-step recognition→sound→oral blend→print→fresh word→text check; clear boundary with Blog #50 | **96/100** |
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | 65/100 | **LOCKED IN BATCH** | Accurate CVC definition; six-step hear→map→blend→fresh word→encode→text ladder; word-family and transfer boundaries | **96/100** |
| 4 | Digraphs and Tricky Words: What to Decode and What to Remember | 64/100 | **LOCKED IN BATCH** | Distinguishes digraphs, blends, high-frequency and tricky words; four-question decode-or-remember rule; protects Blog #28 tricky-word routine intent | **96/100** |
| 5 | How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track | 66/100 | **LOCKED IN BATCH** | Five-stage oral→print→continuous→fresh-word→text blending pathway; stage-exit signals replace fixed days/weeks; error interpretation and evidence | **96/100** |
| 6 | How Long Does Phonics Take? A Realistic Parent Guide to Progress | — | QUEUED | — | — |
| 7 | How Phonics Builds Reading Confidence: What Changes First at Home | — | QUEUED | — | — |
| 8 | How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained | — | QUEUED | — | — |
| 9 | How Phonics Improves Spelling: A Parent Encoding Roadmap | — | QUEUED | — | — |
| 10 | How to Choose a Phonics Class: The Complete Parent Comparison Framework | — | QUEUED | — | — |

## Blog #1 — locked

**Canonical role:** `/blog/benefits-of-phonics-for-kids` owns the question: *What benefits of phonics should parents realistically notice, and what tends to change first?*

Intent boundaries: definition → `/blog/what-is-phonics-for-kids`; blending → Blog #5; spelling → Blog #9; confidence → Blog #7; timeline → Blog #6; fluency → `/blog/how-to-improve-reading-fluency-in-children`.

**Final decision: 95/100 — LOCKED IN BATCH.**

## Blog #2 — locked

**Canonical role:** `/blog/child-knows-abc-but-cannot-read` owns the broad alphabet-familiarity-to-first-decoding bottleneck.

The article checks printed-letter recognition, taught sound recall, oral blending, printed blending, fresh-word transfer and connected-text transfer. Once sound recall is already secure, `/blog/why-child-knows-letter-sounds-but-cannot-read-words` becomes the narrower owner.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #3 — locked

**Canonical role:** `/blog/cvc-words-explained-for-parents` owns the CVC definition and first simple printed-word decoding milestone.

It defines CVC as a consonant-vowel-consonant spelling structure rather than any three-letter word, requires already-taught correspondences, checks fresh-word and encoding transfer, and does not prescribe universal word counts or fixed mastery timelines.

**Indexability:** ordinary evergreen non-weekly slug; already indexable and sitemap eligible.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #4 — locked

**Canonical role:** `/blog/digraphs-and-tricky-words` owns the conceptual parent decision: *Which parts should my child decode and which parts genuinely need extra memory?*

### Key quality decisions

- Defines a digraph as two letters representing one phoneme and distinguishes it from adjacent consonant phonemes.
- Separates **high-frequency** from **tricky/common-exception**; common does not automatically mean irregular.
- Explains temporarily tricky words: a correspondence may be regular in English but not yet taught.
- Adds the Tiny Steps four-question decode-or-remember check.
- Teaches parents to decode regular/taught parts and mark only the genuinely unusual or not-yet-taught correspondence.
- Adds reading + spelling + fresh-word transfer checks instead of whole-word visual memorisation.
- Protects `/blog/phonics-tricky-words` (Blog #28) as the detailed tricky-word teaching-routine owner.
- Adds evidence from DfE National Curriculum/SSP guidance, UFLI and Reading Rockets, plus five FAQs and a non-diagnostic boundary.

**Indexability:** ordinary evergreen non-weekly slug; no policy change required.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #5 — locked

**Canonical role:** `/blog/how-kids-learn-blending` owns the developmental and instructional progression from hearing separate phonemes to independently blending printed words and carrying that strategy into connected text.

### Intent boundaries

- Blog #2 `/blog/child-knows-abc-but-cannot-read` → broader ABC-to-reading diagnostic before the exact blending stage is known.
- Blog #3 `/blog/cvc-words-explained-for-parents` → first simple CVC printed-word milestone.
- Blog #5 `/blog/how-kids-learn-blending` → stage-by-stage blending process and stage-exit decisions.
- `/blog/phonics-blending-activities` and `/blog/phonics-blending-club` → activity/routine owners rather than developmental progression.
- `/blog/why-child-knows-letter-sounds-but-cannot-read-words` → narrow diagnostic when sound recall is already secure but word reading still fails.

### Baseline problems fixed

- Converted the article from the shared generic `PhonicsSeoPost` generator into a direct editorial `BlogPost`.
- Removed inherited fixed-calendar examples such as “5 days oral + print CVC”, “next 5 days”, and “step back one stage for 2 days”.
- Removed generic class-selection, universal 10-minute dose and fixed 2–3 week judgement copy.
- Clarified **blending as a verb** and separated it from the noun phrase “consonant blend”; adjacent consonants such as `st` retain separate phonemes.
- Added the **Tiny Steps five-stage blending path**:
  1. oral phoneme blending without print;
  2. printed blending using a small taught correspondence set;
  3. continuous blending with clean, blendable phoneme pronunciation;
  4. fresh-word transfer using already-taught patterns;
  5. connected-text transfer.
- Added explicit guidance to avoid schwa insertion such as “tuh” and “puh”.
- Replaced calendar progression with five observation signals: **accuracy, independence, transfer, retention and text use**.
- Added interpretation for sound-recall-without-merge, schwa insertion, first-letter guessing, familiar-list dependence and sentence-level breakdown.
- Added a parent practice structure without claiming a research-defined daily dosage.
- Added a non-diagnostic support boundary.
- Added evidence from IES/What Works Clearinghouse, UFLI phonemic-awareness and phoneme-grapheme resources, and the DfE Reading Framework.
- Added five AEO/GEO FAQs and contextual internal links.
- Added founder authorship, `modifiedDate: 2026-08-30`, a dedicated meta description and 15-minute read estimate.

### Evidence decision

The Tiny Steps five-stage path and exit signals are explicitly labelled editorial teaching guidance, not a standardized developmental test. External sources support the underlying principles: phonemic blending, sound-letter mapping, left-to-right decoding, blendable pronunciation, systematic progression and connected-text transfer.

### Indexability decision

Blog #5 is an ordinary evergreen non-weekly public slug, so it is already indexable and sitemap eligible under the existing policy.

**Final decision: 96/100 — LOCKED IN BLOGS #1–#10 BATCH.** No known factual, pedagogical, evidence, diagnosis-boundary, reader-helpfulness, SEO or cannibalization hard fail remains after review.

## Batch merge gate

Do **not** merge PR #163 until Blogs #1–#10 are complete and the final batch head passes:

- human-helpfulness/shareability review for all 10
- no hard-fail issue
- each final score 90+
- intent/cannibalization checks
- title/meta/FAQ/internal-link review
- evidence claim verification
- indexability decisions where relevant
- focused regression tests
- full exact-head CI/SEO validation after Blog #10
- explicit founder approval to merge the complete batch
