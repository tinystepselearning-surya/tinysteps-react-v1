# Tiny Steps Blog Quality Audit & Refresh Programme

## Sequence authority

The programme numbering is locked to the founder-supplied **authoritative 76-blog inventory** dated 2026-08-30.

- Blogs **1–34**: Phonics
- Blogs **35–51**: Parent Tips / English Communication
- Blogs **52–60**: Research / Schools
- Blogs **61–68**: Grammar
- Blogs **69–76**: Public Speaking

The full fixed order lives in `docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md`.

## Delivery model — 10 blogs per merge batch

Batch #1 uses one branch and one PR for Blogs #1–#10:

- Branch: `seo/blog-quality-sequence-01-benefits-phonics`
- PR: `#163`
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

## Batch #1 final scorecard — Blogs #1–#10

| # | Article | Baseline | Status | Score after refresh |
|---:|---|---:|---|---:|
| 1 | Benefits of Phonics for Kids: What Parents Usually Notice First | 57/100 | **LOCKED IN BATCH** | **95/100** |
| 2 | Child Knows ABC but Cannot Read: What Parents Should Check First | 65/100 | **LOCKED IN BATCH** | **96/100** |
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | 65/100 | **LOCKED IN BATCH** | **96/100** |
| 4 | Digraphs and Tricky Words: What to Decode and What to Remember | 64/100 | **LOCKED IN BATCH** | **96/100** |
| 5 | How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track | 66/100 | **LOCKED IN BATCH** | **96/100** |
| 6 | How Long Does Phonics Take? A Realistic Parent Guide to Progress | 74/100 | **LOCKED IN BATCH** | **96/100** |
| 7 | How Phonics Builds Reading Confidence: What Changes First at Home | 68/100 | **LOCKED IN BATCH** | **96/100** |
| 8 | How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained | 67/100 | **LOCKED IN BATCH** | **96/100** |
| 9 | How Phonics Improves Spelling: A Parent Encoding Roadmap | 62/100 | **LOCKED IN BATCH** | **96/100** |
| 10 | How to Choose a Phonics Class: The Complete Parent Comparison Framework | 79/100 | **LOCKED IN BATCH** | **97/100** |

### Batch quality movement

- Baseline total: **667/1000**
- Final total: **960/1000**
- Baseline average: **66.7/100**
- Final average: **96.0/100**
- Total quality gain: **+293 points**
- All 10 retained articles: **95+/100**

## Canonical intent map — Blogs #1–#10

1. `/blog/benefits-of-phonics-for-kids` → realistic observable phonics benefits.
2. `/blog/child-knows-abc-but-cannot-read` → broad alphabet-familiarity-to-decoding bottleneck.
3. `/blog/cvc-words-explained-for-parents` → CVC definition and first simple printed-word decoding milestone.
4. `/blog/digraphs-and-tricky-words` → what remains decodable versus what needs extra attention/memory.
5. `/blog/how-kids-learn-blending` → stage-by-stage blending development and stage-exit decisions.
6. `/blog/how-long-does-phonics-take` → realistic interpretation of phonics duration and progress.
7. `/blog/how-phonics-builds-reading-confidence` → reading-confidence behaviour without claiming confidence is guaranteed by phonics.
8. `/blog/how-phonics-classes-help-kids-read` → instructional mechanism from taught correspondences to independent reading transfer.
9. `/blog/how-phonics-improves-spelling` → encoding/spelling roadmap and error interpretation.
10. `/blog/how-to-choose-phonics-classes` → complete parent provider/class comparison and purchase framework.

## Blog #9 — locked

**Canonical role:** `/blog/how-phonics-improves-spelling` owns the parent question: *How does phonics support spelling, what is encoding, and what do different spelling errors tell me about the next teaching step?*

### Key quality decisions

- Converted the article from the generic `PhonicsSeoPost` generator into a direct editorial `BlogPost`.
- Removed unsupported weeks 1–10 progress promises, the 6–8 week support trigger and fixed daily word-count advice.
- Defines encoding as segmenting spoken words into phonemes and mapping them to graphemes in sequence.
- Adds the Tiny Steps six-step encoding roadmap: whole word → segment phonemes → map taught graphemes → choose alternatives → write in order → verify and transfer.
- Adds an error map distinguishing omitted phonemes, order errors, phonically plausible alternatives, taught-pattern confusion, exception-word errors and morphology errors.
- Explains why reading can develop ahead of spelling and why English spelling eventually requires more than phonics alone.
- Replaces the unsupported “dictation is better than copying” claim with a purpose-based distinction between independent retrieval and copying/handwriting practice.
- Adds evidence from DfE Reading Framework, DfE National Curriculum, IES/WWC, UFLI and EEF.
- Adds five answer-engine FAQs, founder authorship, updated metadata and focused regression coverage.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #10 — locked

**Canonical role:** `/blog/how-to-choose-phonics-classes` owns the parent decision: *How should I compare phonics classes or providers fairly before enrolling my child?*

### Four-gate decision framework

1. **Fit** — does placement start from the child’s actual reading and spelling behaviour?
2. **Teaching quality** — is instruction explicit, systematic, cumulative, blending-led and connected to spelling and matched reading?
3. **Proof of transfer** — can the provider show progress on fresh words, matched text, spelling, retention and reduced prompting rather than lesson completion alone?
4. **Practical clarity** — are format, duration, frequency, teacher continuity, parent communication, materials, policies and total pricing clear before enrolment?

The framework is explicitly labelled **Tiny Steps editorial decision guidance**, not a standardized provider rating or accreditation tool.

### Major improvements

- Preserves the useful comparison intent while replacing loose provider-shopping copy with a structured four-gate framework.
- Expands the parent scorecard from 12 to **16 evidence-oriented checks** covering placement, sequence, blending, segmenting, matched text, fresh transfer, correction, review, progress reporting, adaptation, teacher training, scope boundaries, policies and marketing claims.
- Adds explicit teacher-training and implementation-quality checks.
- Adds commercial clarity without equating higher price with higher teaching quality or lower price with better value.
- Separates 1:1, group and whole-class format from the underlying quality decision; EEF evidence includes positive phonics effects across these contexts.
- Routes the online-versus-in-person comparison to Blog #12 instead of allowing Blog #10 to cannibalize that intent.
- Removes the named-programme FAQ and provider-format absolutism.
- Makes Tiny Steps subject to the **same comparison framework** as any other provider rather than granting itself a different standard.
- Adds evidence from the current EEF phonics evidence review, DfE Choosing a Phonics Teaching Programme guidance, DfE SSP validation criteria, DfE Reading Framework and IES/WWC foundational reading guidance.
- Adds five focused AEO/GEO FAQs, founder authorship, updated metadata and a dedicated regression test.

### Evidence decision

External sources support the underlying programme-selection features: systematic progression, explicit blending and segmenting, matched decodable text, assessment, responsiveness, teacher training, connected-text application and the need to distinguish decoding from wider reading comprehension. The Tiny Steps four-gate framework and 16-point parent scorecard are editorial syntheses rather than validated research instruments.

### Indexability decision

Ordinary evergreen non-weekly public slug; already indexable and sitemap eligible. No indexing-policy change required.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Batch #1 merge gate

Blogs #1–#10 are content-complete. Final state before merge must confirm:

- all focused blog quality regression tests pass
- full CI passes on the final exact head
- title/meta/FAQ/internal-link checks remain green
- evidence-source extraction remains green
- no intent/cannibalization hard fail is introduced
- no accidental files are present in the PR diff
- PR remains mergeable
- explicit founder approval is received

**Exact-head CI/SEO gate: PENDING on the final batch head.**

**Do not merge PR #163 until the final exact-head gate is green and the founder explicitly approves the merge.**
