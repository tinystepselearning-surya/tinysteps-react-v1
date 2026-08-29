# Tiny Steps Blog Quality Audit & Refresh Programme

Branch: `seo/blog-quality-audit-refresh`

## Scope

Audit, analyze, strengthen, and refresh the complete current public blog registry before one final merge-readiness review.

- Current public blog inventory: **76**
- Merge policy: **do not merge individual blog improvements to `main`**
- Final gate: complete all blog reviews, run full CI/SEO/content validation on the final exact branch SHA, review the final inventory, then open one merge-readiness PR.
- URL policy: preserve the canonical URL architecture already established by the Week-label cleanup unless an audit finds a specific SEO reason that requires a separately reviewed redirect migration.
- Intent policy: protect existing B2 search-intent ownership and avoid creating new cannibalization while improving depth.

## Standard 100-point quality rubric

| Dimension | Points |
|---|---:|
| Search-intent match | 15 |
| Parent / school-leader usefulness | 15 |
| Content depth | 10 |
| Tiny Steps first-party insight | 10 |
| Accuracy & evidence | 10 |
| Uniqueness / cannibalization | 10 |
| SEO quality | 10 |
| AEO / GEO readiness | 10 |
| Trust / E-E-A-T | 5 |
| Next-step usefulness | 5 |
| **Total** | **100** |

## Per-blog workflow

1. Read the full source article and current public title/slug.
2. Confirm the page's search-intent owner and nearby competing Tiny Steps pages.
3. Score the current article against the 100-point rubric.
4. Identify factual, pedagogical, structural, evidence, trust, SEO, AEO/GEO, UX, internal-linking, and conversion gaps.
5. Rewrite or strengthen only what improves the article's assigned job.
6. Preserve or add first-party Tiny Steps guidance only where it is supportable.
7. Add external evidence links where evidence claims are made; do not label unsupported editorial guidance as research-backed.
8. Add/update `modifiedDate` only after a meaningful editorial revision.
9. Record the completed audit here.
10. Move to the next blog only after the current blog is materially improved.

## Progress

| # | Public article | Baseline | Status | Main action | Target after refresh |
|---:|---|---:|---|---|---:|
| 1 | SATPIN at Home: A Parent Launch Plan for Early Blending and Reading | 70/100 | **REFRESHED** | Rebuilt as evergreen SATPIN home implementation guide; corrected teaching sequence; removed seven-day pressure; added evidence, first-party readiness checks, FAQ, internal learning path and updated authorship | 92+/100 |
| 2 | How to Prevent the Summer Slide in Reading (10-Minute Daily Plan) | — | QUEUED | Audit next | — |

## Blog #1 — completed changes

### Canonical role

Practical **SATPIN-at-home implementation** owner for parents.

The separate `/blog/satpin-phonics-guide` remains the broader SATPIN explanation/progression owner.

### Fixed

- Removed public-content dependence on “Week 1 / Week 2” calendar framing.
- Replaced the rigid seven-day expectation with seven flexible practice sessions and readiness-led progression.
- Corrected the sequence error where words containing untaught `t` and `p` appeared before those sounds had been introduced.
- Removed non-SATPIN and unnatural practice examples such as `Tin can`, `Tan pan`, and `Nap in pan`.
- Added a genuinely SATPIN-only cumulative word bank.
- Added decoding + encoding transfer rather than isolated sound recall alone.
- Replaced weak completion criteria with observable Tiny Steps readiness checkpoints.
- Added an explicit distinction between this practical routine and the comprehensive SATPIN guide.
- Added parent-focused troubleshooting for the sound-knowledge → blending gap.
- Added evidence links from EEF, UK Department for Education, and NICHD National Reading Panel.
- Replaced unsupported “research-backed” marketing language with evidence-informed, source-linked wording.
- Changed authorship to `Priya`, which resolves to the founder author profile in the existing editorial-trust system.
- Added `modifiedDate: 2026-08-30` for this meaningful revision.
- Added FAQ content for answer-engine extraction.
- Added links to the SATPIN authority guide, blending guide, CVC guide, Balloon Pop SATPIN level, Letter Tracing with Sounds, and the Phonics programme.

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
