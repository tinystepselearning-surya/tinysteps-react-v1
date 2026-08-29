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
| 7 | How Phonics Builds Reading Confidence: What Changes First at Home | 68/100 | **LOCKED IN BATCH** | Separates decoding competence from confidence, removes unsupported success ratios/daily dosage, adds five observable confidence signals, home-response guidance, evidence and causal boundaries | **96/100** |
| 8 | How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained | 67/100 | **LOCKED IN BATCH** | Rebuilt as the class-to-reading mechanism owner; six-part start→teach→blend/segment→fresh word→matched text→review chain; separates decoding, fluency and comprehension; adds transfer evidence and class-shopping boundary | **96/100** |
| 9 | How Phonics Improves Spelling: A Parent Encoding Roadmap | — | QUEUED | — | — |
| 10 | How to Choose a Phonics Class: The Complete Parent Comparison Framework | — | QUEUED | — | — |

## Blog #1 — locked

**Canonical role:** `/blog/benefits-of-phonics-for-kids` owns the question: *What benefits of phonics should parents realistically notice, and what tends to change first?*

**Final decision: 95/100 — LOCKED IN BATCH.**

## Blog #2 — locked

**Canonical role:** `/blog/child-knows-abc-but-cannot-read` owns the broad alphabet-familiarity-to-first-decoding bottleneck.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #3 — locked

**Canonical role:** `/blog/cvc-words-explained-for-parents` owns the CVC definition and first simple printed-word decoding milestone.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #4 — locked

**Canonical role:** `/blog/digraphs-and-tricky-words` owns the conceptual parent decision: *Which parts should my child decode and which parts genuinely need extra memory?*

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #5 — locked

**Canonical role:** `/blog/how-kids-learn-blending` owns the developmental and instructional progression from hearing separate phonemes to independently blending printed words and carrying that strategy into connected text.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #6 — locked

**Canonical role:** `/blog/how-long-does-phonics-take` owns the parent question: *How should I think about phonics duration without relying on a universal deadline?*

The article separates current-target time, full-progression time and fluent-reading time, then uses starting point, accuracy, independence, transfer and retention instead of fixed calendars.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #7 — locked

**Canonical role:** `/blog/how-phonics-builds-reading-confidence` owns the parent question: *How can improved decoding show up as reading-confidence behaviour at home, and what should I watch for without assuming confidence is guaranteed?*

Key decisions: separates decoding competence from confidence; removes unsupported daily dosage and accuracy thresholds; adds starting, strategy-use, retry, independence and transfer signals; distinguishes decoding difficulty from reading-aloud pressure; preserves rich adult read-alouds; adds evidence and non-diagnostic boundaries.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #8 — locked

**Canonical role:** `/blog/how-phonics-classes-help-kids-read` owns the parent question: *What should actually happen inside a phonics class that helps a child become a more independent reader?*

### Intent boundaries

- `/blog/how-phonics-classes-help-kids-read` → instructional mechanism from taught correspondences to independent word reading and matched-text transfer.
- `/blog/how-kids-learn-blending` → stage-by-stage blending development.
- `/blog/how-long-does-phonics-take` → duration and progress interpretation.
- `/blog/how-phonics-builds-reading-confidence` → reading-confidence behaviour.
- `/blog/how-phonics-improves-spelling` → full encoding/spelling roadmap.
- `/blog/how-to-improve-reading-fluency-in-children` → accurate-but-effortful connected reading.
- `/blog/how-to-choose-phonics-classes` → provider/class comparison and purchase framework.
- `/blog/online-phonics-classes-vs-school` → online-versus-school support comparison.
- `/phonics` → commercial programme owner.

### Baseline problems fixed

- Corrected the title from the temporary `A Parent Evidence Guide` wording to the authoritative title: **How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained**.
- Converted the article from the shared generic `PhonicsSeoPost` generator into a direct editorial `BlogPost`.
- Replaced generic class-selection/template material with a clear explanation of the instructional mechanism.
- Added explicit distinctions between **blending**, **decoding** and **fluency** so they are not presented as interchangeable outcomes.
- Added the **Tiny Steps six-part class-to-reading chain**:
  1. establish current starting point;
  2. teach the sound-spelling relationship explicitly;
  3. blend for reading and segment for spelling;
  4. check a fresh word;
  5. transfer into matched connected text;
  6. revisit cumulatively until prompting reduces and earlier learning remains available.
- Labels that six-part chain editorial teaching guidance rather than a standardized research protocol.
- Added a live-teaching-versus-worksheet explanation focused on responsive error observation and feedback rather than claiming worksheets are inherently ineffective.
- Added a clear encoding boundary explaining why spelling belongs inside phonics instruction while protecting Blog #9 as the full spelling owner.
- Added a fluency boundary: phonics contributes to accurate word reading and increasingly efficient recognition, but completing phonics is not identical to becoming a fluent reader.
- Added a comprehension boundary: vocabulary, oral language, background knowledge and meaning-focused instruction remain necessary.
- Added five parent-visible transfer signals: strategy use, fresh-word transfer, reduced prompting, spelling/word-building transfer and matched-text transfer.
- Added guidance for the common class/home mismatch without treating untaught storybook words as a fair decoding test.
- Added explicit plan-review triggers when memorised success, persistent errors, lost earlier patterns, mismatched text or unchanged prompting remain.
- Protected Blog #10 as the provider-comparison owner and Blog #12 as the online-versus-school comparison owner.
- Added Tiny Steps first-party teaching context without turning the article into a sales page.
- Added four external evidence sources: EEF Phonics, IES/What Works Clearinghouse foundational reading guide, DfE Reading Framework and DfE SSP validation criteria.
- Added five AEO/GEO FAQs, founder authorship, updated metadata and focused regression coverage.

### Evidence decision

The article uses external evidence for the underlying instructional components: explicit/systematic sound-letter teaching, blending, decoding, segmenting for spelling, matched decodable text, connected-text practice, assessment and cumulative review. The **Tiny Steps six-part class-to-reading chain is an editorial synthesis**, not a validated research instrument.

The article does not claim that phonics alone guarantees fluency or comprehension. EEF explicitly distinguishes phonics’ positive effect on reading accuracy from broader comprehension and vocabulary needs, while IES and DfE guidance connect foundational decoding with spelling and connected-text practice.

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
