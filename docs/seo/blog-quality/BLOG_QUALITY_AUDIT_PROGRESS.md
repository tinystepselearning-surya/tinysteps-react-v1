# Tiny Steps Blog Quality Audit & Refresh Programme

Branch: `seo/blog-quality-audit-refresh`

## North Star

Tiny Steps blogs exist first to **help a real reader solve a real learning problem**.

The target reader may be a parent, teacher, school leader, or—where the article is designed for direct practice—a child working with adult guidance. A successful article should leave that reader feeling that they found something specific, trustworthy, practical, and worth returning to or sharing with another family or educator.

Search visibility is a distribution goal, not the purpose of the content. We want each article to be strong enough that Google, ChatGPT, Gemini, Perplexity and other answer engines can confidently discover, understand, extract and cite it, but we will not add filler, keyword repetition or unsupported claims merely to chase rankings.

We cannot guarantee that any page will “dominate” a search result or LLM answer. The programme goal is to maximize that likelihood through superior usefulness, clear intent ownership, evidence, first-party teaching insight, structured answers, technical SEO and a coherent internal knowledge system.

### The shareability test

Before a blog is marked complete, ask:

> If a parent or teacher found this while struggling with the exact problem, would they save it, use at least one recommendation, and feel comfortable sending it to another parent, teacher or colleague?

If the answer is no, the article is not finished.

## Scope

Audit, analyze, strengthen, and refresh the complete current public blog registry before one final merge-readiness review.

- Current public blog inventory: **76**
- Merge policy: **do not merge individual blog improvements to `main`**
- Final gate: complete all blog reviews, run full CI/SEO/content validation on the final exact branch SHA, review the final inventory, then open one merge-readiness PR.
- URL policy: preserve the canonical URL architecture already established by the Week-label cleanup unless an audit finds a specific SEO reason that requires a separately reviewed redirect migration.
- Intent policy: protect existing B2 search-intent ownership and avoid creating new cannibalization while improving depth.
- Human-value policy: no article is considered improved merely because it is longer, contains more keywords, or has more headings.

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

- Target quality after refresh: **90+/100** for every article we keep as a meaningful public resource.
- A numeric score never overrides a critical factual, pedagogical, trust, or intent problem.
- An article with a hard-fail issue remains incomplete even if its calculated score is above 90.

## Human-helpfulness acceptance test

Every completed blog should, where relevant to its intent, include the following:

1. **Answer the real question early.** The reader should understand the core answer without scrolling through a long introduction.
2. **Explain why the problem happens.** Do not give disconnected tips without helping the reader understand the underlying learning stage or bottleneck.
3. **Give concrete next actions.** Include usable examples, routines, checklists, scripts, word sets, practice steps, diagnostic questions, or implementation guidance as appropriate.
4. **Show what progress looks like.** Prefer observable behaviours over vague promises such as “improves confidence” or “boosts skills.”
5. **Explain what not to do.** Prevent common mistakes, over-practice, premature progression, guessing, memorisation-only strategies, or other relevant failure modes.
6. **Help the reader decide what to do next.** Distinguish home practice, teacher support, assessment, programme support, or a different article when appropriate.
7. **Use Tiny Steps first-party knowledge where it adds real value.** Classroom observations, recurring learner difficulties, readiness checks, correction routines and implementation patterns must be supportable and clearly presented as Tiny Steps practice rather than universal research findings.
8. **Use evidence responsibly.** Significant research, policy, curriculum or developmental claims should have credible sources. Do not call content “research-backed,” “scientifically proven,” or equivalent unless the page actually supports that wording.
9. **Be easy to quote and extract.** Definitions, quick answers, steps, comparisons and FAQs should be written clearly enough for search engines and answer engines to identify without losing context.
10. **Earn sharing rather than ask for it.** The article should be useful enough that sharing is a natural reader response; avoid artificial “share this” padding.

## LLM / AEO / GEO quality standard

We want answer engines to be able to identify:

- the article's exact question or job;
- a concise direct answer;
- important definitions and distinctions;
- a logical set of steps or decision criteria;
- examples that illustrate the answer;
- evidence and source attribution where relevant;
- the Tiny Steps first-party contribution;
- the boundary between general information and Tiny Steps programme guidance;
- the canonical next resource when the reader's problem is adjacent rather than identical.

Content should therefore use natural descriptive headings, self-contained answer paragraphs, clean lists, meaningful FAQs and precise internal links. We will not manufacture FAQ questions purely for schema or repeat the same answer in several sections.

## Hard-fail conditions

A blog cannot be marked complete if it contains any of the following:

- factual or pedagogical errors;
- practice examples that require skills or graphemes not yet introduced without explaining that dependency;
- unsupported research/science claims;
- guaranteed outcomes or unrealistic timelines;
- a title or introduction that promises a different answer from the body;
- substantial duplication or unresolved cannibalization with another Tiny Steps owner page;
- generic AI-style filler that does not advance the reader's understanding;
- keyword stuffing or awkward search-engine phrasing;
- outdated Tiny Steps programme, pricing, platform or curriculum information;
- advice that could confuse a normal learning variation with a diagnosis;
- evidence links that do not actually support the claim they are attached to;
- a sales CTA that interrupts the solution before useful help has been provided.

## Per-blog workflow

1. Read the full source article and current public title/slug.
2. Identify the primary reader and the exact real-world problem they are trying to solve.
3. Confirm the page's search-intent owner and nearby competing Tiny Steps pages.
4. Score the current article against the 100-point rubric.
5. Run the human-helpfulness and shareability tests.
6. Identify factual, pedagogical, structural, evidence, trust, SEO, AEO/GEO, UX, internal-linking, and conversion gaps.
7. Rewrite or strengthen only what improves the article's assigned job.
8. Preserve or add first-party Tiny Steps guidance only where it is supportable.
9. Add external evidence links where evidence claims are made; do not label unsupported editorial guidance as research-backed.
10. Build answer-engine-friendly structure without repetitive SEO filler.
11. Add/update `modifiedDate` only after a meaningful editorial revision.
12. Re-score the article and verify no hard-fail condition remains.
13. Record the completed audit here.
14. Move to the next blog only after the current blog is materially improved.

## Progress

| # | Public article | Baseline | Status | Main action | Score after refresh |
|---:|---|---:|---|---|---:|
| 1 | SATPIN at Home: A Parent Launch Plan for Early Blending and Reading | 70/100 | **LOCKED** | Rebuilt as evergreen SATPIN home implementation guide; corrected teaching sequence; removed calendar pressure; added reader self-routing, evidence, first-party readiness checks, FAQ, internal learning path, escalation boundary and updated authorship | **95/100** |
| 2 | How to Prevent the Summer Slide in Reading (10-Minute Daily Plan) | — | QUEUED | Audit next | — |

## Blog #1 — locked after final revisit

### Canonical role

Practical **SATPIN-at-home implementation** owner for parents, guardians and educators supporting an early reader.

The separate `/blog/satpin-phonics-guide` remains the broader SATPIN explanation/progression owner.

### Final quality decision

**95/100 — LOCKED.**

Blog #1 passes the human-helpfulness and shareability test and has no known hard-fail issue after the final revisit. It should not receive another broad rewrite during this programme unless later cross-blog reconciliation reveals a concrete duplication, factual, technical or intent problem.

### Fixed

- Removed public-content dependence on “Week 1 / Week 2” calendar framing.
- Replaced the rigid seven-day expectation with seven flexible practice sessions and readiness-led progression.
- Corrected the sequence error where words containing untaught `t` and `p` appeared before those sounds had been introduced.
- Removed non-SATPIN and unnatural practice examples such as `Tin can`, `Tan pan`, and `Nap in pan`.
- Added a genuinely SATPIN-only cumulative word bank.
- Added guidance for unfamiliar but decodable words so vocabulary support does not turn into guessing.
- Added decoding + encoding transfer rather than isolated sound recall alone.
- Replaced weak completion criteria with observable Tiny Steps readiness checkpoints.
- Added an explicit distinction between this practical routine and the comprehensive SATPIN guide.
- Added a `Who this SATPIN plan is for` section to help parents, guardians, tutors and teachers self-route quickly.
- Added a clear boundary explaining that this is a phonics-practice guide, not a diagnostic test for hearing, speech or language difficulties.
- Added parent-focused troubleshooting for the sound-knowledge → blending gap.
- Added `When home practice is not enough`, including appropriate teacher support and qualified-professional boundaries when hearing/speech/language concerns exist.
- Added evidence links from EEF, UK Department for Education, and NICHD National Reading Panel.
- Verified that the EEF source explicitly describes SATPIN as a commonly used early grapheme sequence and that the evidence sources support systematic phonics, blending, segmenting and responsive teaching.
- Replaced unsupported “research-backed” marketing language with evidence-informed, source-linked wording.
- Changed authorship to `Priya`, which resolves to the founder author profile in the existing editorial-trust system.
- Added `modifiedDate: 2026-08-30` for this meaningful revision.
- Tightened the meta description to fit a cleaner search-result snippet.
- Added FAQ content for answer-engine extraction and made the blending FAQ avoid oversimplifying all reading difficulty as a single cause.
- Added links to the SATPIN authority guide, blending guide, CVC guide, Balloon Pop SATPIN level, Letter Tracing with Sounds, and the Phonics programme.
- Kept the programme CTA after the substantive help, not before it.

## Final validation gate (after all 76)

- full unit-test suite
- lint
- TypeScript type check
- production build
- sitemap generation
- RSS/feed generation
- blog consolidation audit
- rendered consolidation audit
- route-integrity audit
- indexability report
- historical GSC crawl-policy audit
- GSC archive rendering audit
- SEO smoke test
- exact-SHA CI
- final cannibalization/ownership reconciliation
- final 76-title + URL + indexability inventory review
- final human-helpfulness/shareability review across every retained article
