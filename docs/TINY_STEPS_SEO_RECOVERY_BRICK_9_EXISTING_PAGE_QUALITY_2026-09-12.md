# Tiny Steps SEO Recovery — Brick 9 Existing Page Quality

**Date:** 2026-09-12  
**Status:** ✅ CLOSED — priority existing pages audited against one quality standard  
**Depends on:** Bricks 0–8  
**Rule:** improve existing winners before considering new SEO content; do not disturb locked URL ownership.

---

## Objective

Brick 9 applies one quality standard to the existing recovery priorities before any new-content decision is allowed.

This is deliberately a **protect-or-strengthen** pass. A page that already has a clear intent, strong answer architecture, useful evidence, appropriate schema and a sensible conversion path is protected from unnecessary rewriting. Brick 9 does not use low CTR alone as a reason to rewrite titles or metas; controlled CTR experiments belong to Brick 10.

No new SEO URL is created in Brick 9.

---

## The 14-point quality standard

Every priority page is reviewed for:

1. search intent
2. title
3. meta description
4. H1
5. introduction / answer-first opening
6. H2 coverage
7. examples
8. expertise / evidence
9. FAQs
10. internal links
11. CTA fit
12. schema consistency with visible content
13. duplication / intent-boundary control
14. freshness / factual accuracy

The machine-readable contract lives in:

`src/config/seoRecoveryBrick9PageQuality.ts`

---

## Priority-page audit

| Page | Role | Brick 9 decision | Result |
|---|---|---|---|
| `/phonics` | Generic online phonics programme | **PROTECT** | Strong programme H1, answer-first commercial framing, live 1:1 proposition, assessment-first placement, levels, methodology, FAQs, Course schema and comparison/fee handoffs remain intact. |
| `/best-online-phonics-classes-for-kids-in-india` | Best / compare / provider selection | **PROTECT** | Child-fit gates, 1:1/group/self-practice comparison, provider scorecard, demo questions, red flags, evidence and pricing handoff remain distinct from `/phonics`. |
| `/phonics-fees-india` | Phonics fees / cost | **PROTECT** | 1:1 and group pricing remain separated, research review date is exposed through schema, current Tiny Steps pricing is transparent, FAQ coverage is strong and programme/assessment handoffs remain clear. |
| `/pricing` | Cross-programme pricing | **PROTECT** | Central pricing configuration, OfferCatalog, package facts, value-comparison guidance and assessment-first CTA remain the correct cross-programme pricing surface. |
| `/book-demo` | Free assessment / demo / trial | **PROTECT** | Free 35-minute live 1:1 assessment, scope, expected outcome, programme routing, no-pressure enrolment language, FAQ and booking form remain aligned. |
| `/blog/satpin-phonics-guide` | SATPIN master authority | **TARGETED UPGRADE** | Existing strong guide preserved; rendered copy now removes internal SEO ownership jargon and historical SATPIN support links resolve directly to the public home-routine URL. |
| `/blog/phonics-satpin-launch` | SATPIN home routine | **PROTECT** | Flexible session-by-session practice intent stays distinct from the SATPIN master explanation. No generic SATPIN duplication added. |
| `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | Parent decoding diagnostic | **PROTECT** | Six-stage diagnostic sequence, CVC/fresh-word transfer, evidence boundaries, home routine and `/phonics` → `/book-demo` support path remain intact. |
| `/free-letter-tracing-game-for-kids` | Generic tracing authority | **PROTECT** | A–Z tracing, pre-writing practice, WebApplication/FAQ semantics and the explicit tracing ≠ reading boundary remain protected. |
| `/letter-tracing-with-sounds-game` | Sound-supported tracing | **TARGETED UPGRADE** | User-facing “owner” jargon was replaced with normal parent-facing “letter formation practice” wording while keeping SATPIN, word-building, diagnostic and programme handoffs. |

---

## Implementation completed

### 1. Reader-facing blog quality cleanup

`src/content/blog/shared/editorialCleanup.ts` now handles more internal editorial leakage before articles are rendered:

- `Blog #12` and `Blog 12` numbering are both normalized;
- phrases such as `This guide owns the ... intent` are converted to reader-facing differentiation language;
- phrases such as `This article is the ... owner` are converted to `This guide focuses on ...`;
- `choose the right owner` becomes `choose the right guide`;
- existing raw-route and retired-link cleanup continues to run afterwards.

This improves existing pages without creating or renaming content.

### 2. SATPIN public-path normalization

The historical source path:

`/blog/week-1-phonics-satpin-launch`

now normalizes in rendered internal links to the public support URL:

`/blog/phonics-satpin-launch`

This prevents the SATPIN master guide from advertising the implementation-era source slug and keeps the master → home-routine relationship clear.

### 3. Sound-tracing copy polish

The sound-supported tracing page previously exposed the internal phrase:

`letter formation owner`

It now uses:

`letter formation practice`

The page remains educational-first and keeps the reading-development boundary introduced in Brick 7.

### 4. Brick 9 governance contract

Added:

`src/config/seoRecoveryBrick9PageQuality.ts`

It locks:

- the 14-point quality standard;
- the ten priority recovery pages;
- each page's role and parent job;
- protect vs targeted-upgrade decisions;
- primary CTA and supporting handoffs.

This prevents future “quality work” from silently changing the established intent map.

### 5. Regression protection

Added:

`src/tests/seo/recoveryBrick9ExistingPageQuality.spec.ts`

Expanded:

`src/tests/seo/blogEditorialCleanup.spec.ts`

The guards cover:

- the complete 14-point quality contract;
- all ten priority-page paths;
- commercial-owner protect decisions;
- programme/comparison/fee/assessment source signals;
- answer-first and freshness requirements on the three priority blog authorities;
- SATPIN master → public home-routine URL normalization;
- diagnostic six-stage sequence and conversion handoffs;
- tracing ≠ decoding boundaries;
- removal of internal Blog numbering and common SEO ownership jargon from normalized blog copy.

---

## What Brick 9 intentionally did not do

Brick 9 does **not** broadly rewrite established titles, descriptions or H1s merely because improvement is theoretically possible. That would mix page-quality work with the controlled CTR experiments reserved for Brick 10.

Brick 9 also does not perform the final repository-wide technical-residue sweep. A few long-lived static source literals can still reference historical redirect destinations or older internal ownership terminology even though canonical ownership and redirects are already correct. Those are explicitly reserved for **Brick 11 — technical consolidation**, where redirect maps, static literals, generated discovery artifacts and final canonical consistency are handled together.

Examples already known from earlier bricks include the direct retired diagnostic alias in the large `/phonics` source and a retired provider-selection link embedded in the large comparison-page source. They are not competing indexable owners, but Brick 11 should replace the raw literals so the repository and live internal-link graph are fully clean.

---

## Brick 9 completion gate

Brick 9 is considered closed because:

- [x] one explicit quality standard is defined;
- [x] all ten priority recovery pages are classified;
- [x] strong existing pages are protected from unnecessary rewrites;
- [x] visible blog editorial leakage is normalized centrally;
- [x] SATPIN master/support differentiation is reinforced;
- [x] tracing quality language is improved without changing intent;
- [x] no new SEO page is created;
- [x] no URL ownership is changed;
- [x] no broad title/meta CTR experiment is mixed into this brick;
- [x] regression guards are added;
- [x] residual technical cleanup is explicitly handed to Brick 11.

**Brick 9 decision:** CLOSED.

---

## Next brick

**Brick 10 — Improve CTR on Existing Winners**

Brick 10 should use GSC evidence to make controlled title/meta/opening-answer improvements only where impressions and ranking make the test worthwhile. It must not reopen the ownership and duplication decisions already frozen in Bricks 1–9.
