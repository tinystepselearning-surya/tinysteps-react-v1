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
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | — | QUEUED | — | — |
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

### Baseline problems fixed

- Removed template-generated fixed claims such as `weeks 1–3`, `weeks 3–6`, `weeks 6–10` and `after 8–10 weeks`.
- Removed the generic requirement to run a 10-minute routine for 2–3 weeks before judging progress.
- Removed template FAQ language prescribing `10 minutes a day, 5–6 days a week` as though it were an evidence-defined dose.
- Removed the claim that phonics directly supports speaking confidence.
- Reframed confidence carefully as a possible behavioural consequence of successful reading, not a guaranteed phonics outcome.
- Separated decoding, spelling, fluency and comprehension instead of treating them as one automatic chain.
- Added the Tiny Steps five-signal benefit check: **coverage, blending, independence, encoding and transfer**.
- Added fresh-word checks so parents can distinguish transferable decoding from memorised word lists.
- Added a clear boundary that phonics supports word reading but does not replace vocabulary, oral language, comprehension, reading experience or motivation.
- Added four external evidence sources: EEF, National Reading Panel/NICHD, IES/What Works Clearinghouse and the UK Department for Education Reading Framework.
- Added five AEO/GEO FAQs and contextual intent routing.
- Added founder authorship, `modifiedDate: 2026-08-30`, a dedicated meta description and a 13-minute read estimate.

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

### Baseline problems fixed

- Converted Blog #2 from the shared generic `PhonicsSeoPost` generator into a direct editorial `BlogPost`.
- Removed generic template copy about class selection, a 10-minute daily routine, fixed judgement windows and shared escalation timelines.
- Removed the oversimplified FAQ instruction to “prioritize letter sounds” and replaced it with the more accurate distinction that children benefit from both letter names and sound-letter knowledge, while decoding specifically requires usable sound correspondences.
- Added the **Tiny Steps six-step ABC-to-reading check**:
  1. printed-letter recognition;
  2. taught sound recall;
  3. oral blending without print;
  4. simple printed blending;
  5. fresh-word transfer;
  6. short connected-text transfer.
- Made every check conditional on **already-taught** sounds/patterns so parents do not test advanced or untaught spellings and misclassify the child.
- Added an interpretation section that maps the first weak step to the next appropriate practice target.
- Added a firm cannibalization boundary with Blog #50: once letter-sound recall is secure, the parent should move to the letter-sounds-but-cannot-read article instead of repeating alphabet work.
- Added practical home responses for letter-sound recall, oral blending and printed decoding without imposing a research-invented daily dosage.
- Added explicit warnings against picture guessing during a decoding check, long random word lists, premature speed pressure and fixed-week expectations.
- Added a progress section based on observable independence and transfer rather than calendar promises.
- Added a diagnostic boundary: this parent guide does not diagnose dyslexia, hearing, speech, language, attention or broader learning conditions.
- Added four external evidence sources: IES/What Works Clearinghouse, National Reading Panel/NICHD, Education Endowment Foundation and the UK Department for Education Reading Framework.
- Added five answer-engine-friendly FAQs and contextual links to blending, CVC, diagnostics and the main Phonics pathway.
- Added founder authorship, `modifiedDate: 2026-08-30`, a dedicated meta description and a 14-minute read estimate.

### Evidence decision

The Tiny Steps six-step check is explicitly labelled **editorial guidance rather than a standardized research test**.

The external evidence supports the underlying principles that:

- phonemic awareness involves noticing and manipulating sounds in spoken words;
- sound-letter correspondences must become usable in reading rather than remain isolated knowledge;
- blending is required to decode unfamiliar words;
- explicit, systematic phonics instruction should progress from simpler to more complex applications;
- children need opportunities to apply decoding in connected text.

The article makes no claim that knowing ABC, passing the six steps or failing one step constitutes a professional diagnosis.

### Final decision

**96/100 — LOCKED IN BLOGS #1–#10 BATCH.** No known factual, pedagogical, evidence, diagnosis-boundary, reader-helpfulness or cannibalization hard fail remains after review.

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
