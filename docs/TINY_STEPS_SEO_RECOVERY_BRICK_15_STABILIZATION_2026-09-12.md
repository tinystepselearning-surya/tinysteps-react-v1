# Tiny Steps SEO Recovery — Brick 15: Controlled Measurement and Stabilisation

**Date:** 2026-09-12  
**Status:** ✅ IMPLEMENTED / OBSERVATION-GATED  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

---

## Objective

Brick 15 is the final recovery-control brick. Its job is **not** to force another ranking change. Its job is to hold the recovered architecture stable long enough for Google to process the work, verify the technical deployment, and then measure the commercial outcome on finalized data.

The recovery implementation can be complete while the recovery **outcome remains open**.

This distinction is mandatory because the latest finalized Search Console baseline ends on **2026-09-09**, before the 12 September recovery implementation. It therefore cannot prove post-change ranking recovery.

---

## Stabilization Contract

### Days 1–7 — Deployment and technical stabilization

Verify:

- redirects;
- canonical tags;
- sitemap output;
- indexing state;
- broken links;
- Google-selected canonical;
- internal-link updates.

**No ranking conclusion is permitted in this phase.**

Source-level technical controls are automated by the existing Brick 11 audit after sitemap and discovery regeneration. Live production responses, rendered production canonicals, Google-selected canonicals and Google indexing remain observation checks.

### Days 14–21 — Preliminary search stabilization review

Review finalized Search Console data for:

- query-owner consistency;
- commercial impressions;
- commercial ranking movement;
- CTR trends;
- ranking URL changes.

The review must use query and ranking URL together. Page-level visibility alone is not proof of query ownership.

### Day 28+ — Full recovery comparison

Compare a complete finalized post-change Search Console window against the locked baseline.

The final review must include:

- commercial query performance versus baseline;
- query-owner consistency versus baseline;
- Brick 10 CTR experiment outcome;
- technical/indexation regression review;
- website business-attribution context after the newer cohort has matured.

Only after this review may Tiny Steps decide whether a genuinely new SEO page or structural intervention is justified.

---

## Locked Baseline

Brick 15 inherits the finalized Brick 13 baseline:

| Window | Clicks | Impressions | CTR | Avg position |
|---|---:|---:|---:|---:|
| 2026-08-13 → 2026-09-09 | 3,490 | 46,626 | 7.485% | 8.003 |
| 2026-07-16 → 2026-08-12 | 1,794 | 35,296 | 5.083% | 7.158 |

This baseline is intentionally preserved. It is not replaced by a partial same-day or short-window chart.

---

## Query-Owner Verification Targets

Brick 15 inherits all six Brick 14 desired owners:

| Query / intent | Intended owner |
|---|---|
| online phonics classes | `/phonics` |
| phonics classes online | `/phonics` |
| best phonics classes online | `/best-online-phonics-classes-for-kids-in-india` |
| phonics fees | `/phonics-fees-india` |
| SATPIN | `/blog/satpin-phonics-guide` |
| child knows sounds but cannot read | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |

These owners remain frozen during stabilization. Brick 15 does not create a substitute owner simply because one short observation window moves.

---

## Residual Watchlist

### 1. Commercial comparison drift — HIGH

`best phonics classes online`

The pre-deployment GSC window still shows multiple Tiny Steps surfaces:

- comparison owner;
- `/phonics`;
- homepage;
- historical comparison-blog surface.

Brick 15 measures whether the recovery consolidation removes that drift. It does not trigger another same-day rewrite.

### 2. SATPIN support-page overlap — LOW

The master owner remains:

`/blog/satpin-phonics-guide`

The home-routine support page may legitimately rank for implementation intent, but broad SATPIN-method ownership should remain concentrated on the master guide.

### 3. Parent-diagnostic migration — MIGRATION WATCH

Historical route:

`/blog/child-knows-letter-sounds-but-cannot-read`

now permanently redirects to:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

The old route appearing in the pre-deployment GSC window is historical visibility. Brick 15 must verify that Google transfers visibility toward the surviving canonical owner after recrawl/reindexing rather than restoring the retired URL.

### 4. Phonics-fee exact-query evidence — SAMPLE GAP

`/phonics-fees-india` remains the locked C2 owner, but the current surfaced GSC relationship set does not include a direct exact-query row for `phonics fees`.

Brick 15 should collect direct query/page evidence before declaring this ownership outcome verified.

---

## Technical Stabilization Automation

Brick 15 reuses the proven Brick 11 technical consolidation audit rather than creating a competing technical framework.

CI performs:

1. sitemap regeneration;
2. RSS / discovery regeneration;
3. blog-consolidation audit;
4. Brick 11 technical consolidation audit;
5. Brick 13–15 recovery contract tests;
6. TypeScript validation.

This protects:

- primary self-canonicals;
- priority sitemap inclusion;
- retired URL exclusion from generated discovery surfaces;
- direct 301 topology;
- redirect-chain absence;
- canonical internal-link controls;
- build/prebuild SEO ordering.

Live Google observations are deliberately not fabricated by CI.

---

## Validation Debt Repaired

During Brick 15 setup, repository typechecking exposed missing declarations for two executable JavaScript SEO registries and a stale TypeScript suppression.

Brick 15 adds declarations for:

- `src/lib/phonicsAuthorityRoutes.js`
- `src/lib/editorialQualityRoutes.js`

and removes the obsolete `@ts-expect-error` from the SATPIN recovery test because `blogWeekRenames.js` already has a declaration file.

These changes do not alter SEO ownership or page content. They make recovery validation deterministic.

---

## Decision Rules

- Use finalized GSC data only for recovery conclusions.
- Evaluate query and ranking URL together.
- Keep revenue SEO separate from traffic/free-resource growth.
- Do not use tracing growth to offset commercial weakness.
- Do not make a ranking conclusion during Days 1–7.
- Do not create new SEO pages before the Day 28+ full review.
- Do not launch another broad rewrite from one short-window movement.
- Preserve locked owners while Google processes the consolidation.
- Never restore retired URLs as competing owners.
- Require a complete finalized post-change window before final structural decisions.

---

## Definition of Done

### Implementation DoD

- [x] Stabilization phases are encoded and regression-protected.
- [x] Brick 13 baseline is inherited without being relabelled as post-change data.
- [x] Brick 14 query-owner targets and residual drift are inherited.
- [x] Technical regeneration/audit sequence is automated in CI.
- [x] Type declarations required for recovery validation are repaired.
- [x] No new SEO landing page is created.
- [x] No same-day recovery claim is made.
- [x] Growth/expansion remains gated behind final observation.

### Outcome DoD — still pending by design

- [ ] Verified deployment date / production state.
- [ ] Days 1–7 live technical checks complete.
- [ ] Days 14–21 finalized query-owner review complete.
- [ ] Day 28+ complete finalized GSC comparison complete.
- [ ] Brick 10 CTR outcome reviewed.
- [ ] No unresolved material cannibalisation remains.
- [ ] Business-attribution context reviewed after cohort maturation.

---

## Closure Decision

**Brick 15 implementation: COMPLETE.**

**SEO recovery outcome: NOT YET CLOSED.**

The complete Brick 0–15 implementation may be merged after CI passes, but the recovery activity must remain in observation until the final stabilization gates are actually satisfied.

After those gates pass, the defensive recovery programme can close and the site can return to controlled growth, CRO and content-expansion work.
