# Tiny Steps Blog Quality Audit & Refresh Programme

## Sequence authority

The programme numbering is now locked to the **authoritative 76-blog inventory supplied by the founder on 2026-08-30**:

- Blogs **1–34**: Phonics
- Blogs **35–51**: Parent Tips / English Communication
- Blogs **52–60**: Research / Schools
- Blogs **61–68**: Grammar
- Blogs **69–76**: Public Speaking

This numbering overrides the earlier temporary refresh order. Previous quality work merged through PRs #158–#161 remains valid content work, but those PR numbers do **not** define Blog #1, #2, #3 or #4 in the authoritative 76-blog sequence.

The current programme must always move through the supplied inventory in numeric order unless the founder explicitly changes the sequence.

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
- No individual article is merged until its exact-head CI/SEO gate is green and the founder explicitly approves the merge.

## Authoritative progress

| # | Article | Baseline | Status | Main action | Score after refresh |
|---:|---|---:|---|---|---:|
| 1 | Benefits of Phonics for Kids: What Parents Usually Notice First | 57/100 | **LOCKED — exact-head validation next** | Rebuilt from generic phonics template into the realistic parent benefits owner; removes fixed benefit timelines and unsupported direct-confidence claims; adds observable decoding/encoding/transfer signals, evidence boundaries, five FAQs and intent routing | **95/100** |
| 2 | Child Knows ABC but Cannot Read: What Parents Should Check First | — | QUEUED | Start only after Blog #1 validation/merge decision | — |
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | — | QUEUED | — | — |
| 4 | Digraphs and Tricky Words: What to Decode and What to Remember | — | QUEUED | — | — |
| 5 | How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track | — | QUEUED | — | — |

## Blog #1 — locked for exact-head validation

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
- Added first-party guidance for interpreting uneven progress without changing the whole method too early.
- Added four external evidence sources: EEF, National Reading Panel/NICHD, IES/What Works Clearinghouse and the UK Department for Education Reading Framework.
- Added five AEO/GEO FAQs.
- Added contextual links to blending, spelling, confidence, fluency, assessment, phonics sequence and the main Phonics programme.
- Added founder authorship, `modifiedDate: 2026-08-30`, a dedicated meta description and a 13-minute read estimate.

### Evidence decision

The article now makes only evidence-supported broad claims:

- systematic phonics supports early word reading/decoding;
- phonics can support spelling when sound-to-print encoding is taught;
- explicit, systematic teaching should be matched to current knowledge;
- connected-text practice matters for fluency;
- phonics alone does not guarantee comprehension.

The Tiny Steps five-signal check is explicitly labelled editorial guidance rather than a standardized research instrument.

### Final decision

**95/100 — LOCKED pending exact-head CI/SEO validation.**

## Per-blog final gate

Before each merge:

- human-helpfulness/shareability review
- no hard-fail issue
- final score 90+
- intent/cannibalization check
- title/meta/FAQ/internal-link review
- evidence claim verification
- indexability decision
- focused regression tests
- exact-head CI/SEO validation
- explicit founder approval to merge
