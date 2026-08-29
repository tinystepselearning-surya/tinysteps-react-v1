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
| 6 | How Long Does Phonics Take? A Realistic Parent Guide to Progress | 74/100 | **LOCKED IN BATCH** | Separates current-target, full-progression and fluent-reading timelines; replaces calendar promises with progress-to-time signals, evidence and provider accountability | **96/100** |
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

Key decisions: distinguishes digraphs from consonant blends; separates high-frequency from tricky/common-exception; explains temporarily tricky correspondences; adds the four-question decode-or-remember check; decodes regular parts rather than whole-word visual guessing; protects `/blog/phonics-tricky-words` as Blog #28’s detailed teaching-routine owner; adds evidence, transfer checks and five FAQs.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #5 — locked

**Canonical role:** `/blog/how-kids-learn-blending` owns the developmental and instructional progression from hearing separate phonemes to independently blending printed words and carrying that strategy into connected text.

Key decisions: removes inherited fixed-calendar examples; establishes oral blending → print connection → continuous blending → fresh-word transfer → connected-text transfer; clarifies blending as a verb; adds clean-sound/schwa guidance; replaces calendar stage exits with accuracy, independence, transfer, retention and text use; adds evidence, error interpretation and five FAQs.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #6 — locked

**Canonical role:** `/blog/how-long-does-phonics-take` owns the parent question: *How should I think about phonics duration without relying on a universal deadline?*

### Core quality decision — three separate clocks

The article now separates:

1. **Current-target time** — how long it takes the child to secure the phonics target being taught now.
2. **Full-progression time** — how long it takes to work through the programme’s wider cumulative phonics scope.
3. **Fluent-reading time** — how long accurate decoding takes to become increasingly automatic in connected text alongside vocabulary, language comprehension and reading experience.

These are related but are not one deadline.

### Intent boundaries

- `/blog/how-long-does-phonics-take` → progress pace, duration interpretation and realistic timeline owner.
- `/blog/how-kids-learn-blending` → blending progression.
- `/blog/cvc-words-explained-for-parents` → CVC milestone.
- `/blog/how-to-improve-reading-fluency-in-children` → fluency after decoding is sufficiently accurate.
- `/blog/how-to-choose-phonics-classes` → provider-selection framework.
- `/blog/phonics-diagnostics` → broader parent observation/assessment.
- `/phonics` → commercial programme owner.

### Baseline problems fixed

- The original article already rejected one universal completion deadline, but it did not clearly separate the different meanings of “How long does phonics take?”
- Changed organisation-level authorship to founder authorship and added `modifiedDate: 2026-08-30`.
- Added a dedicated hero, stronger excerpt and clearer parent-intent meta description.
- Added the three-clock distinction so completion of one current target, completion of a phonics scope and fluent reading are not conflated.
- Added the **Tiny Steps progress-to-time compass**: starting point, accuracy, independence, transfer and retention.
- Explicitly labels the compass editorial guidance rather than a standardized timing formula.
- Replaced calendar progression with observable stage evidence.
- Added a parent dashboard: current target, fresh-word result, prompt level, text transfer, spelling transfer, retention and dominant error.
- Added a clear safeguard that this article does not prescribe a research-defined weekly or monthly testing schedule.
- Prevents “give it more time” from becoming an excuse for prolonged unchanged errors.
- Added provider accountability questions without taking over Blog #10’s full class-comparison intent.
- Added a non-diagnostic boundary: parent tracking cannot diagnose dyslexia or another condition.
- Added four external evidence sources: EEF, IES/What Works Clearinghouse, DfE Reading Framework and DfE SSP validation guidance.
- Added five AEO/GEO FAQs and contextual links to blending, CVC, digraphs, fluency, diagnostics, class choice, `/phonics` and `/curriculum`.

### Evidence decision

The Tiny Steps progress-to-time compass is **editorial guidance, not a standardized timing instrument**. External evidence supports systematic teaching matched to current knowledge, decoding and spelling instruction, connected-text application, assessment of gaps and targeted response when pupils are not keeping up. No evidence source is used to claim a universal phonics-completion duration.

### Indexability decision

Ordinary evergreen non-weekly public slug; already indexable and sitemap eligible. No policy change required.

**Final decision: 96/100 — LOCKED IN BLOGS #1–#10 BATCH.**

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
