# Tiny Steps Blog Quality Audit & Refresh Programme

## Sequence authority

The programme numbering is locked to the **authoritative 76-blog inventory supplied by the founder on 2026-08-30**:

- Blogs **1–34**: Phonics
- Blogs **35–51**: Parent Tips / English Communication
- Blogs **52–60**: Research / Schools
- Blogs **61–68**: Grammar
- Blogs **69–76**: Public Speaking

The complete fixed order lives in `docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md`.

This numbering overrides the earlier temporary refresh order. Previous quality work merged through PRs #158–#161 remains valid content work, but those PR numbers do **not** define Blog #1, #2, #3 or #4 in the authoritative sequence.

## Delivery model — 10 blogs per merge batch

The founder changed the delivery model on 2026-08-30:

1. Build and lock Blogs **#1–#10 on the same branch/PR**.
2. Do not merge individual blogs while the batch is incomplete.
3. Keep focused regression coverage for each article as it is added.
4. Re-run the full exact-head CI/SEO gate on the final Blog #10 head.
5. Merge the complete Blogs #1–#10 batch to `main` only after the founder explicitly approves it.
6. Then start the next batch (#11–#20) from the new `main`.

Current batch branch:

`seo/blog-quality-sequence-01-benefits-phonics`

Current batch PR:

`#163`

## North Star

Tiny Steps blogs exist first to **help a real reader solve a real learning problem**.

Search visibility is a distribution goal, not the purpose of the content. Every retained article should be specific, trustworthy, practical, evidence-aware where appropriate, distinct from neighbouring articles, easy for Google and answer engines to understand, and useful enough that a parent, teacher or school leader would save or share it.

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

### Completion target

- Every retained article should reach **90+/100** after refresh.
- A numeric score never overrides a factual, pedagogical, evidence, safety, trust or intent hard fail.
- The full 10-blog batch must pass exact-head CI/SEO before merge.
- Merge requires explicit founder approval after Blog #10 is locked.

## Batch #1 progress — Blogs #1–#10

| # | Article | Baseline | Status | Main action | Score after refresh |
|---:|---|---:|---|---|---:|
| 1 | Benefits of Phonics for Kids: What Parents Usually Notice First | 57/100 | **LOCKED IN BATCH** | Rebuilt from generic phonics template into the realistic parent benefits owner; removed fixed timelines and unsupported direct-confidence claims; added observable decoding/encoding/transfer signals, evidence boundaries and intent routing | **95/100** |
| 2 | Child Knows ABC but Cannot Read: What Parents Should Check First | 65/100 | **LOCKED IN BATCH** | Rebuilt as the ABC-to-reading bottleneck owner; adds six-step check from recognition to connected-text transfer, removes generic template claims, separates Blog #2 from the letter-sounds-specific owner, adds evidence and diagnostic boundaries | **96/100** |
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | 65/100 | **LOCKED IN BATCH** | Rebuilt as the first simple printed-word decoding owner; defines CVC accurately, adds a six-step hear→map→blend→fresh-word→encode→text ladder, mixed-vowel/word-family guidance, transfer checks, evidence and non-diagnostic boundaries | **96/100** |
| 4 | Digraphs and Tricky Words: What to Decode and What to Remember | — | QUEUED | — | — |
| 5 | How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track | — | QUEUED | — | — |
| 6 | How Long Does Phonics Take? A Realistic Parent Guide to Progress | — | QUEUED | — | — |
| 7 | How Phonics Builds Reading Confidence: What Changes First at Home | — | QUEUED | — | — |
| 8 | How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained | — | QUEUED | — | — |
| 9 | How Phonics Improves Spelling: A Parent Encoding Roadmap | — | QUEUED | — | — |
| 10 | How to Choose a Phonics Class: The Complete Parent Comparison Framework | — | QUEUED | — | — |

## Blog #1 — locked in batch

### Canonical role

`/blog/benefits-of-phonics-for-kids` owns the parent question:

> **What benefits of phonics should I realistically notice in my child, and what usually changes first?**

It is an outcomes/observation explainer, not a general definition page, not a blending lesson, not a spelling tutorial, not a confidence article and not a progress-timeline article.

### Intent boundaries

- `/blog/benefits-of-phonics-for-kids` → observable benefits and realistic parent interpretation.
- `/blog/what-is-phonics-for-kids` → start-here definition and method explanation.
- `/blog/how-kids-learn-blending` → stage-by-stage blending progression.
- `/blog/how-phonics-improves-spelling` → encoding/spelling owner.
- `/blog/how-phonics-builds-reading-confidence` → reading-confidence behaviour owner.
- `/blog/how-long-does-phonics-take` → progress pace and timeline owner.
- `/blog/how-to-improve-reading-fluency-in-children` → fluency accuracy/phrasing/meaning owner.
- `/phonics` → commercial programme owner.

### Final decision

**95/100 — LOCKED IN BLOGS #1–#10 BATCH.**

## Blog #2 — locked in batch

### Canonical role

`/blog/child-knows-abc-but-cannot-read` owns the broad parent diagnostic question:

> **My child knows or recites the alphabet but cannot read words. Which link between ABC knowledge and decoding should I check first?**

This article starts before word reading and identifies the first breakdown across alphabet recognition, sound-letter recall, oral blending, printed blending, fresh-word transfer and short connected text.

### Intent boundaries

- `/blog/child-knows-abc-but-cannot-read` → ABC/alphabet familiarity to first real decoding bottleneck.
- `/blog/why-child-knows-letter-sounds-but-cannot-read-words` → narrower owner after letter-sound recall is already secure but blending/word reading still fails.
- `/blog/how-kids-learn-blending` → stage-by-stage blending instruction rather than broad diagnosis.
- `/blog/cvc-words-explained-for-parents` → first simple CVC decoding milestone.
- `/blog/phonics-diagnostics` → broader informal home phonics observation across taught skills.
- `/blog/what-is-phonics-for-kids` → general definition/start-here owner.
- `/phonics` → commercial structured programme owner.

### Final decision

**96/100 — LOCKED IN BLOGS #1–#10 BATCH.** No known factual, pedagogical, evidence, diagnosis-boundary, reader-helpfulness or cannibalization hard fail remains after review.

## Blog #3 — locked in batch

### Canonical role

`/blog/cvc-words-explained-for-parents` owns the parent question:

> **What are CVC words, why are they an important first printed-word decoding milestone, and how can I tell whether my child is genuinely decoding them rather than memorising a list?**

The article begins after a child has at least a small taught set of usable sound-letter correspondences and emerging oral blending. It focuses on applying those component skills to regular consonant-vowel-consonant printed words.

### Intent boundaries

- `/blog/cvc-words-explained-for-parents` → CVC definition, first simple printed-word decoding, fresh-word transfer and readiness to move beyond CVC.
- `/blog/child-knows-abc-but-cannot-read` → broader alphabet-to-reading bottleneck before reliable word decoding.
- `/blog/how-kids-learn-blending` → the blending process itself, including children who know sounds but cannot merge them.
- `/blog/phonics-blending-activities` → practical blending exercises rather than the CVC milestone explanation.
- `/blog/digraphs-and-tricky-words` → next-pattern distinction between decodable multi-letter graphemes and exception/high-frequency words.
- `/blog/how-phonics-improves-spelling` → full encoding/spelling roadmap.
- `/phonics` → commercial programme owner.

### Baseline problems fixed

- Converted Blog #3 from the shared generic `PhonicsSeoPost` generator into a direct editorial `BlogPost`.
- Removed generic template sections about choosing a phonics class, fixed practice duration, shared progress timelines and unrelated base FAQs.
- Clarified that **CVC is a consonant-vowel-consonant spelling structure**, not a synonym for every three-letter word.
- Made beginner CVC checks conditional on regular words using **already-taught** sound-letter correspondences.
- Explicitly stated that Tiny Steps’ “first real decoding milestone” language is editorial framing, not a standardized research stage.
- Added the **Tiny Steps six-step CVC decoding ladder**:
  1. hear the sounds in order;
  2. map each taught letter to its sound;
  3. blend the printed word;
  4. decode a fresh CVC word;
  5. reverse the process through spelling/encoding;
  6. transfer into short connected text.
- Added continuous-blending guidance and a boundary for when the problem is blending rather than sound recall.
- Added short-vowel example sets while making clear they are examples, not a required mastery list or order.
- Added mixed-vowel contrast guidance only after the relevant vowels are taught.
- Added a word-family boundary: families can scaffold early learning but can also hide memorisation unless order and examples are mixed.
- Added interpretation for first-letter guessing, middle-vowel substitutions, blend failure, familiar-card dependence and reading-ahead-of-spelling.
- Replaced universal word-count and fixed-week mastery rules with independence and transfer signals.
- Added readiness guidance for moving from CVC words to the next systematic patterns without requiring perfect speed.
- Added a clear non-diagnostic support boundary for persistent difficulties.
- Added four external evidence sources: IES/What Works Clearinghouse, Education Endowment Foundation, UK Department for Education Reading Framework and Reading Rockets’ parent-facing CVC decoding guidance.
- Added five answer-engine-friendly FAQs and contextual links to Blogs #2, #4, #5, blending activities, spelling and `/phonics`.
- Added founder authorship, `modifiedDate: 2026-08-30`, a dedicated meta description and a 14-minute read estimate.

### Evidence decision

The Tiny Steps six-step CVC decoding ladder is explicitly labelled **editorial teaching guidance rather than a standardized research protocol**.

The evidence layer supports the underlying principles that beginning readers need phonemic awareness, sound-letter mapping, blending, word decoding, spelling/encoding practice and opportunities to apply those skills in connected text. No source is used to claim a universal CVC word count, fixed mastery timeline or research-defined daily practice dose.

### Indexability decision

Blog #3 is an ordinary evergreen public phonics source rather than a historical week-* roadmap alias. Under the existing indexing policy, non-weekly slugs are already indexable and sitemap eligible, so **no indexability promotion or policy change is required**.

### Final decision

**96/100 — LOCKED IN BLOGS #1–#10 BATCH.** No known factual, pedagogical, evidence, diagnosis-boundary, reader-helpfulness, SEO or cannibalization hard fail remains after review.

## Batch merge gate

Do not merge PR #163 until Blogs #1–#10 are all complete and the final batch head passes:

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
