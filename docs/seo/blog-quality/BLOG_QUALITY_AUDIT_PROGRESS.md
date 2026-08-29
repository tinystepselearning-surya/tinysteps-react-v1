# Tiny Steps Blog Quality Audit & Refresh Programme

## North Star

Tiny Steps blogs exist first to **help a real reader solve a real learning problem**.

The target reader may be a parent, guardian, teacher, school leader, or—where the article is designed for direct practice—a child working with adult guidance. A successful article should leave that reader feeling that they found something specific, trustworthy, practical, and worth returning to or sharing with another family or educator.

Search visibility is a distribution goal, not the purpose of the content. We want each article to be strong enough that Google, ChatGPT, Gemini, Perplexity and other answer engines can confidently discover, understand, extract and cite it, but we will not add filler, keyword repetition or unsupported claims merely to chase rankings.

### The shareability test

Before a blog is marked complete, ask:

> If a parent or teacher found this while struggling with the exact problem, would they save it, use at least one recommendation, and feel comfortable sending it to another parent, teacher or colleague?

If the answer is no, the article is not finished.

## Delivery workflow

The programme ships **incrementally, one blog at a time**:

1. Audit and improve one blog on an isolated branch.
2. Lock its quality, intent ownership, evidence and indexability decision.
3. Open a PR against the current `main` and run exact-head CI/SEO checks.
4. Merge only when the user confirms the block is green and ready.
5. Start the next blog from the preceding locked head/new `main` so work remains sequential.

Current sequence:

- Blog #1: merged through PR #158.
- Blog #2: merged through PR #159.
- Blog #3: merged through PR #160.
- Blog #4: `seo/blog-quality-04-multisyllabic-words` → PR #161, exact-head CI initiated.

## Standard 100-point quality rubric

| Dimension | Points |
|---|---:|
| Search-intent match | 15 |
| Reader usefulness — parent / teacher / school leader | 15 |
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

- Target quality after refresh: **90+/100** for every article we retain as a meaningful public resource.
- A numeric score never overrides a critical factual, pedagogical, trust, or intent problem.
- A quality-audited former roadmap article may be promoted from noindex to indexable only when it owns a distinct useful search intent and no hard-fail/cannibalization issue remains.

## Human-helpfulness acceptance test

Every completed blog should, where relevant to its intent:

1. Answer the real question early.
2. Explain why the problem happens without oversimplifying.
3. Give concrete actions, examples, routines, checklists or decision rules.
4. Show observable progress rather than vague promises.
5. Explain common mistakes and what not to do.
6. Help the reader decide the next appropriate step.
7. Use supportable Tiny Steps first-party knowledge where it adds value.
8. Use credible evidence for meaningful research/policy/development claims.
9. Be easy for search engines and LLMs to quote and extract accurately.
10. Earn sharing through usefulness rather than artificial share prompts.

## Hard-fail conditions

A blog cannot be marked complete if it contains factual/pedagogical errors, unsupported research claims, guaranteed outcomes, unrealistic timelines, unresolved cannibalization, generic AI filler, keyword stuffing, outdated Tiny Steps facts, misleading diagnosis language, evidence that does not support the attached claim, or a sales CTA that interrupts the solution before useful help is provided.

## Progress

| # | Public article | Baseline | Status | Main action | Score after refresh |
|---:|---|---:|---|---|---:|
| 1 | SATPIN at Home: A Parent Launch Plan for Early Blending and Reading | 70/100 | **MERGED / PR #158** | Evergreen SATPIN home implementation owner; corrected sequence, readiness progression, evidence, self-routing, escalation and AEO structure | **95/100** |
| 2 | How to Prevent the Summer Slide in Reading (10-Minute Daily Plan) | 64/100 | **MERGED / PR #159** | Evidence-aware summer reading continuity; stage-matched routines, book-fit guidance, Tiny Steps three-signal check, support boundary, FAQs, internal authority links and indexability promotion | **94/100** |
| 3 | Phonics Assessment Checklist for Parents Before a New School Term | 61/100 | **MERGED / PR #160** | Informal parent phonics observation owner using taught scope, fresh-word decoding, blending/segmenting, encoding, connected-text transfer, evidence and a diagnostic boundary; quality-promoted to indexable | **95/100** |
| 4 | How to Help Kids Read Multisyllabic Words: Simple Chunking Practice | 59/100 | **LOCKED / PR #161 — CI initiated** | Rebuilt as a phonics- and morphology-aware long-word decoding guide with readiness checks, a repeatable five-step routine, stage-matched practice, transfer signals, evidence, FAQs and support boundaries; quality-promoted to indexable | **95/100** |

## Blog #1 — locked and merged

### Canonical role

Practical **SATPIN-at-home implementation** owner for parents, guardians and educators supporting an early reader. `/blog/satpin-phonics-guide` remains the broader SATPIN explanation/progression owner.

### Final decision

**95/100 — LOCKED and merged through PR #158.**

## Blog #2 — locked and merged

### Canonical role

**Summer reading continuity and stage-matched home practice** owner.

Intent boundaries:

- `/blog/prevent-summer-slide-reading` → summer reading continuity/maintenance across reading stages.
- `/blog/how-to-improve-reading-fluency-in-children` → persistent fluency/accuracy/phrasing remediation.
- `/blog/phonics-summer-plan` → phonics-specific summer pattern practice.
- `/summer-camps` → commercial structured live summer learning option, not the editorial answer owner.

### Final decision

**94/100 — LOCKED and merged through PR #159.**

### Indexability decision

The cleaned public URL `/blog/prevent-summer-slide-reading` is quality-promoted to **indexable + sitemap eligible**. The historical `/blog/week-27-prevent-summer-slide-reading` remains a permanent redirect alias. Historical GSC snapshot rows remain historical evidence rather than being rewritten.

## Blog #3 — locked and merged

### Canonical role

**Informal parent phonics assessment / observation** owner before a new school term or when a parent wants to identify the next practice priority.

Intent boundaries:

- `/blog/phonics-diagnostics` → parent/guardian home observation of already-taught phonics skills.
- `/blog/how-schools-can-assess-decoding-not-memorisation` → school/institutional assessment design and transferable decoding evidence.
- `/book-demo` → Tiny Steps commercial 35-minute 1:1 demo assessment pathway, not the editorial explanation owner.
- `/blog/why-child-knows-letter-sounds-but-cannot-read-words` → diagnostic explanation for the specific sounds-to-blending gap, not a general assessment checklist.

### Baseline problems fixed

- Removed the old `Week 22` campaign framing and fixed seven-day remediation timetable.
- Removed the one-size-fits-all list of sounds, blends, digraphs, tricky words and long vowels regardless of what the child had actually been taught.
- Reframed the page as an **informal home observation**, not a standardized diagnostic or screening test.
- Added a clear boundary that the checklist cannot diagnose dyslexia, hearing, speech, language, attention or developmental conditions.
- Replaced generic Green/Amber/Red scoring with **Secure / Developing / Priority** plus an observed example rather than a percentage.
- Added the Tiny Steps five-part phonics check: sound-letter recall, oral blending/segmenting, fresh-word decoding, encoding/spelling, and connected-text transfer.
- Added fresh-word examples by teaching stage and made every example conditional on the pattern already being taught.
- Added optional, carefully bounded pseudo-word guidance so parents understand why unfamiliar items can reveal transferable decoding without imitating a statutory screening test.
- Added assessment-fairness guidance: avoid hints, do not teach during the item, do not let pictures replace decoding, accept self-correction as useful evidence, and stop if the child becomes distressed.
- Added actionable interpretation of common error patterns so results lead to the correct next practice rather than more random worksheets.
- Added teacher-ready language for sharing observations, such as describing a blending or transfer problem rather than saying a child is simply “weak in phonics”.
- Added evidence from the UK Standards and Testing Agency/DfE phonics screening framework and US IES/What Works Clearinghouse foundational-reading and assessment guidance.
- Added five answer-engine FAQs covering home assessment, scope, pseudo-words, sounds-without-reading, and dyslexia/diagnosis boundaries.
- Added contextual links to the letter-sounds diagnostic, blending guide, CVC guide, ABC diagnostic, Phonics programme and Tiny Steps demo assessment.
- Added `modifiedDate: 2026-08-30` and a concise search-result meta description.

### Evidence decision

The article uses formal assessment sources only to explain useful principles: assess the intended skill, use unfamiliar decodable items to check transfer, distinguish screening/diagnostic/progress-monitoring purposes, and use assessment evidence to target instruction. It does **not** claim that this home checklist is equivalent to the UK phonics screening check or a professional diagnostic assessment.

### Indexability decision

Blog #3 owns a distinct useful parent search intent and passes the human-first quality gate, so `/blog/phonics-diagnostics` is **quality-promoted to indexable + sitemap eligible**.

The historical `/blog/week-22-phonics-diagnostics` URL remains a non-indexable permanent redirect alias. Historical Search Console evidence is not rewritten.

### Final decision

**95/100 — LOCKED and merged through PR #160.**

## Blog #4 — locked for exact-head validation

### Canonical role

**Parent-facing multisyllabic decoding and chunking-practice** owner for children who can already decode many one-syllable patterns but need a repeatable way to tackle longer printed words.

Intent boundaries:

- `/blog/phonics-multisyllabic` → practical long-word decoding, syllable/morpheme chunking, transfer and home practice.
- `/blog/how-kids-learn-blending` → the broader stage-by-stage blending progression, especially early one-syllable blending.
- `/blog/cvc-words-explained-for-parents` → first simple word-decoding milestone.
- `/blog/long-vowel-sounds-for-kids` → long-vowel pattern explanation and practice order.
- `/blog/how-phonics-improves-spelling` → encoding/spelling owner.
- `/phonics` → Tiny Steps commercial programme owner, not the editorial long-word answer page.

### Baseline problems fixed

- Removed `Week 19` framing and the rigid seven-day / 12-minute schedule.
- Removed the misleading shortcut that underlining every written vowel reliably reveals where a word should split.
- Removed speed/race framing before decoding accuracy is secure.
- Added a readiness check so parents do not use long-word practice to mask unstable short-word decoding.
- Distinguished **syllables** as spoken sound units from **morphemes** as meaningful word parts.
- Added the Tiny Steps five-step long-word routine: spot familiar parts, mark useful chunks, decode each part, blend and adjust to natural pronunciation, then reread for meaning.
- Added stage-matched practice from secure two-part words to affixes and more complex morphology.
- Explained that clapping syllables can support oral phonological awareness but cannot replace print-to-sound decoding work.
- Added common-error interpretation, including first-part guessing, over-splitting vowels, blending breakdown, stress/pronunciation adjustment, repeated pattern gaps and vocabulary-vs-decoding distinctions.
- Added the Tiny Steps four-signal progress check: coverage, independence, transfer and context.
- Added a support boundary that the article is practice guidance rather than a dyslexia or learning-condition assessment.
- Added evidence from IES/What Works Clearinghouse, University of Florida Literacy Institute and Reading Rockets.
- Added five answer-engine FAQs plus contextual links to blending, CVC, long-vowel, spelling and Phonics authority pages.
- Added `modifiedDate: 2026-08-30`, a 14-minute read estimate and concise search metadata.

### Evidence decision

The exact Tiny Steps five-step routine is presented as an editorial teaching routine rather than a standardized research protocol. The evidence layer supports the underlying principles: explicit decoding, word-part analysis, systematic progression from simpler to more complex words, use of a consistent multisyllabic routine, and reconnection to connected text and meaning.

### Indexability decision

Blog #4 now owns a distinct useful parent search intent and passes the human-first quality gate, so `/blog/phonics-multisyllabic` is **quality-promoted to indexable + sitemap eligible**.

The historical `/blog/week-19-phonics-multisyllabic` URL remains a non-indexable permanent redirect alias.

### Final decision

**95/100 — LOCKED pending exact-head CI/SEO validation in PR #161.** No known factual, pedagogical, evidence, diagnosis-boundary, reader-helpfulness or cannibalization hard fail remains after the final content review.

## Per-blog final gate

Before each incremental merge:

- human-helpfulness/shareability review
- no hard-fail issue
- final score 90+
- intent/cannibalization check
- title/meta/FAQ/internal-link review
- evidence claim verification
- indexability decision
- focused regression tests
- exact-head CI/SEO validation
