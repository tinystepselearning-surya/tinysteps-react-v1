# Tiny Steps SEO Recovery — Brick 14: Query-Owner Consistency

**Date:** 2026-09-12  
**Status:** ✅ IMPLEMENTED / POST-DEPLOYMENT VERIFICATION GATED  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

---

## Objective

Confirm that each priority recovery query has one intended Tiny Steps authority URL, record the finalized pre-deployment Search Console ownership baseline, and surface residual query-owner drift without making another broad SEO rewrite from a short or pre-change window.

Brick 14 is a **measurement and governance brick**. It does not claim that Google has already completed post-recovery reassignment. That outcome belongs to Brick 15 after finalized post-deployment data is available.

---

## Final Desired Mapping

| Query / intent | Desired ranking URL |
|---|---|
| `online phonics classes` | `/phonics` |
| `phonics classes online` | `/phonics` |
| `best phonics classes online` | `/best-online-phonics-classes-for-kids-in-india` |
| `phonics fees` | `/phonics-fees-india` |
| `satpin` | `/blog/satpin-phonics-guide` |
| `child knows sounds but cannot read` | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |

The parent-diagnostic owner above intentionally supersedes the older master-plan table entry. Brick 5 permanently consolidated:

`/blog/child-knows-letter-sounds-but-cannot-read`

→ **301** →

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

The retired path must not become an authority owner again.

---

## Commercial Ownership Alignment

Brick 14 does not invent a second commercial ownership model. It inherits the canonical C2 decisions:

- generic phonics provider intent → `/phonics`
- best / compare / provider-selection intent → `/best-online-phonics-classes-for-kids-in-india`
- phonics fee / cost / price research → `/phonics-fees-india`

Regression tests explicitly cross-check Brick 14 against `COMMERCIAL_C2_OWNERSHIP_CLUSTERS`.

---

## Search Console Baseline

Brick 14 uses the finalized Brick 13 GSC window:

- **Current:** 2026-08-13 → 2026-09-09
- **Comparison:** 2026-07-16 → 2026-08-12
- **Property:** `https://tinystepslearning.com/`

This window ends before the 12 September recovery deployment. It is therefore a **pre-deployment ownership baseline**, not proof of post-change recovery.

Search Console planning data has an approximately three-day finalization delay, and the returned query-page rows are top-row relationships rather than an exhaustive stored export. Brick 14 records that limitation in code so absence from the returned list is never treated as proof of zero visibility.

---

## Query-Owner Findings

### 1. Generic phonics: intended owner observed

`online phonics classes`

- query: 3 clicks / 104 impressions / average position 12.92
- observed `/phonics` row: 3 clicks / 95 impressions / average position 9.43
- status: **CONSISTENT_OBSERVED**

`phonics classes online`

- query: 6 clicks / 174 impressions / average position 6.35
- observed `/phonics` row: 6 clicks / 159 impressions / average position 4.25
- status: **CONSISTENT_OBSERVED**

Decision: protect `/phonics`. Ranking weakness is not solved by changing the owner.

### 2. Comparison intent: residual drift is real

For `best phonics classes online`, Search Console reports multiple Tiny Steps URLs:

| URL | Clicks | Impressions | Avg position |
|---|---:|---:|---:|
| `/best-online-phonics-classes-for-kids-in-india` | 3 | 57 | 3.19 |
| `/phonics` | 2 | 86 | 5.57 |
| `/` | 0 | 30 | 1.00 |
| `/blog/best-online-phonics-classes-for-kids` | 0 | 4 | 46.75 |

Status: **DRIFT_OBSERVED**.

The comparison page is the correct owner and earns the stronger click/position signal among the two meaningful commercial pages, but Google still surfaces other Tiny Steps URLs for the same evaluation query.

The historical comparison blog has already been retired into the commercial comparison owner. Its appearance in the baseline is therefore a recrawl/reindexing watch item, not a reason to restore it.

### 3. Phonics fees: owner locked, exact-query evidence incomplete

`/phonics-fees-india` baseline:

- 2 clicks
- 129 impressions
- 1.55% CTR
- average position 7.19

The returned planning relationship set does not include a direct query-page row for the exact query `phonics fees`.

Status: **NO_DIRECT_SAMPLE**.

Decision: keep `/phonics-fees-india` as the locked C2 owner and collect direct finalized query-page evidence in Brick 15. Page-level visibility alone is not promoted into a fabricated ownership claim.

### 4. SATPIN: master owner observed

`satpin`

- query: 8 clicks / 1,325 impressions / average position 8.41
- `/blog/satpin-phonics-guide`: 8 clicks / 1,311 impressions / average position 8.32
- status: **CONSISTENT_OBSERVED**

A related query, `satpin method`, still surfaces the practical SATPIN home-routine article alongside the master guide. That is retained as a low-severity watch because the support article serves a distinct implementation job. Brick 15 should confirm the master guide remains dominant for broad SATPIN-method intent.

### 5. Parent diagnostic: historical route still present in baseline

The pre-deployment GSC window still records:

`/blog/child-knows-letter-sounds-but-cannot-read`

- 3 clicks
- 346 impressions
- average position 17.85

Brick 5 has since permanently redirected that path to:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

Status: **MIGRATION_PENDING**.

Decision: do not reverse the consolidation. Brick 15 must verify that the old route drops out as an owner and the canonical diagnostic page inherits the query family after recrawl/reindexing.

---

## Principal Drift Watchlist

### High priority

`best phonics classes online`

Desired owner:

`/best-online-phonics-classes-for-kids-in-india`

Competing baseline surfaces:

- `/phonics`
- `/`
- retired comparison blog

### Low priority

`satpin method`

Desired broad authority:

`/blog/satpin-phonics-guide`

Allowed support surface:

`/blog/phonics-satpin-launch`

### Migration watch

`child knows sounds but cannot read`

Canonical owner:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

Historical route must disappear as an indexable owner after Google processes the redirect.

---

## Implementation

Added:

`src/config/seoRecoveryBrick14QueryOwnerConsistency.ts`

This registry locks:

- the finalized GSC baseline window;
- six priority query-owner mappings;
- observed query/page relationships;
- evidence quality (`query-page`, `page-only`, or none);
- consistency status;
- the residual-drift watchlist;
- stabilization decision rules.

Added regression protection:

`src/tests/seo/recoveryBrick14QueryOwnerConsistency.spec.ts`

The test protects:

- exact priority owner mapping;
- alignment with Commercial C2;
- generic `/phonics` ownership;
- comparison-intent drift visibility;
- no fabricated direct fees-query evidence;
- SATPIN authority hierarchy;
- one-way parent-diagnostic consolidation;
- mandatory Brick 15 post-deployment verification.

---

## Decision Rules Locked

Brick 14 now prevents several failure modes:

- total page visibility cannot be mistaken for exact-query ownership;
- returned GSC relationship rows cannot be assumed exhaustive;
- pre-deployment drift cannot trigger another broad title/H1/canonical rewrite;
- a retired URL cannot be restored merely because it appears in historical GSC;
- query-owner recovery cannot be declared until finalized post-deployment data exists.

---

## Definition of Done

- [x] One desired owner is locked for every priority Brick 14 query family.
- [x] Commercial owners agree with Commercial C2.
- [x] The Brick 13 finalized GSC window is reused consistently.
- [x] Generic phonics ownership evidence is recorded.
- [x] Comparison-intent cannibalisation is explicitly recorded.
- [x] Phonics-fee evidence limitations are recorded without fabrication.
- [x] SATPIN master/support behavior is recorded.
- [x] Historical parent-diagnostic visibility is classified as migration, not ownership reversal.
- [x] Query-owner regression tests are added.
- [x] Brick 15 stabilization handoff is locked.
- [ ] Finalized **post-deployment** GSC confirms stable ownership across the required observation window.

**Brick 14 implementation decision:** CLOSED / VERIFICATION-GATED.

The remaining unchecked item is intentionally owned by Brick 15 and cannot be truthfully completed on deployment day.

---

## Next Brick

**Brick 15 — Controlled Measurement and Stabilisation**

Brick 15 must perform:

1. 7-day technical/indexation checks;
2. 14–21-day finalized query-owner review;
3. 28+ day full GSC comparison;
4. final cross-check that no unresolved commercial cannibalisation remains.
