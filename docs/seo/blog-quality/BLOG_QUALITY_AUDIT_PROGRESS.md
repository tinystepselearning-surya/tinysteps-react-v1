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

The programme now ships **incrementally, one blog at a time**:

1. Audit and improve one blog on an isolated branch.
2. Lock its quality, intent ownership, evidence and indexability decision.
3. Open a PR against the current `main` and run exact-head CI/SEO checks.
4. Merge only when the user confirms the block is green and ready.
5. Start the next blog from the preceding locked head/new `main` so work remains sequential.

Current sequence:

- Blog #1 branch: `seo/blog-quality-audit-refresh` → PR #158, merge pending manual CI confirmation.
- Blog #2 branch: `seo/blog-quality-02-summer-slide`, created from the locked Blog #1 head so Blog #1 remains unchanged while Blog #2 work proceeds.

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
| 1 | SATPIN at Home: A Parent Launch Plan for Early Blending and Reading | 70/100 | **LOCKED / PR #158** | Evergreen SATPIN home implementation owner; corrected sequence, readiness progression, evidence, self-routing, escalation and AEO structure | **95/100** |
| 2 | How to Prevent the Summer Slide in Reading (10-Minute Daily Plan) | 64/100 | **LOCKED — ready for incremental validation** | Rebuilt around evidence-aware summer reading continuity; stage-matched 10-minute plans, book-fit guidance, Tiny Steps three-signal check, support boundary, FAQs, internal authority links and indexability promotion | **94/100** |
| 3 | Phonics Assessment Checklist for Parents Before a New School Term | — | QUEUED | Audit after Blog #2 ships | — |

## Blog #1 — locked

### Canonical role

Practical **SATPIN-at-home implementation** owner for parents, guardians and educators supporting an early reader. `/blog/satpin-phonics-guide` remains the broader SATPIN explanation/progression owner.

### Final decision

**95/100 — LOCKED.** Do not broadly rewrite unless a later concrete factual, technical or intent issue is discovered.

## Blog #2 — locked

### Canonical role

**Summer reading continuity and stage-matched home practice** owner.

Intent boundaries:

- `/blog/prevent-summer-slide-reading` → summer reading continuity/maintenance across reading stages.
- `/blog/how-to-improve-reading-fluency-in-children` → persistent fluency/accuracy/phrasing remediation.
- `/blog/phonics-summer-plan` → phonics-specific summer pattern practice.
- `/summer-camps` → commercial structured live summer learning option, not the editorial answer owner.

### Final decision

**94/100 — LOCKED.** Blog #2 passes the human-helpfulness/shareability review and has no known factual, pedagogical or intent hard fail after the final content review. The remaining gate is exact-head technical/SEO validation when the block is prepared for its incremental PR.

### Baseline problems fixed

- Removed the claim that summer reading loss is universally “preventable”.
- Removed the unsupported claim that exactly 10 minutes is usually enough to maintain or improve reading.
- Explained that measured summer learning patterns vary across children, assessments and student groups.
- Replaced one identical ages-3–12 routine with three stage-matched versions: pre-reader/early phonics, developing decoder, increasingly fluent reader.
- Stopped prescribing phonics drills to every older/fluent reader.
- Added practical text-selection guidance so difficulty does not force guessing or destroy comprehension.
- Added the Tiny Steps three-signal summer check: accuracy/independence, meaning, and fresh-text transfer.
- Added a low-pressure weekly rhythm that keeps the holiday from becoming another school timetable.
- Added specific resistance/motivation troubleshooting and behaviour-based praise examples.
- Added a clear `When home practice is not enough` boundary and avoided online diagnosis language.
- Added credible evidence from NWEA, the Kim & Quinn summer-reading intervention meta-analysis, and the National Reading Panel fluency findings.
- Added five meaningful answer-engine FAQs.
- Replaced raw sales URLs/CTA copy with contextual next-step links after the substantive help.
- Added links to the reading-fluency owner, comprehension diagnostic, Parents Hub reading-at-home guide, Phonics programme and Summer Camp page.
- Added `modifiedDate: 2026-08-30` and a concise meta description.
- Added Blog #2 to the canonical LLM editorial authority map with explicit intent boundaries.

### Indexability decision

Blog #2 now owns a distinct, useful and evidence-backed search intent, so its cleaned public URL `/blog/prevent-summer-slide-reading` is **quality-promoted to indexable + sitemap eligible**.

The historical `/blog/week-27-prevent-summer-slide-reading` URL remains non-indexable and preserves its permanent redirect to the clean canonical. Historical GSC snapshot rows are not rewritten; audit infrastructure now supports later quality promotions while preserving historical evidence.

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
