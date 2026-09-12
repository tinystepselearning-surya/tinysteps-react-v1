# Tiny Steps SEO Recovery — Brick 3 Commercial Cannibalisation Control

**Status:** ✅ BUILT — commercial ownership boundaries locked; one approved duplicate handed to Brick 4 for physical retirement  
**Date:** 2026-09-12  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`  
**Brick 1 ownership registry:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_1_URL_OWNERSHIP_REGISTRY_2026-09-12.md`

---

## 1. Objective

Prevent Tiny Steps commercial phonics intent from being split across multiple surviving owners.

Brick 3 does **not** create any new SEO page. It locks the commercial owner hierarchy and identifies the exact final duplicate that Brick 4 must physically merge and retire.

---

## 2. Locked commercial ownership

| Intent | Final owner | Status |
|---|---|---|
| Generic online phonics classes / phonics classes for kids | `/phonics` | PROTECTED OWNER |
| Best / compare / provider-selection phonics intent | `/best-online-phonics-classes-for-kids-in-india` | PROTECTED OWNER |
| Phonics fee / cost / price research | `/phonics-fees-india` | PROTECTED OWNER |
| Cross-programme pricing / packages | `/pricing` | PROTECTED OWNER |
| Free demo / assessment / trial | `/book-demo` | PROTECTED OWNER |

These routes must remain semantically separate.

---

## 3. Current production audit

### `/phonics`

Already aligned to generic programme intent:

- self-canonical `/phonics`
- H1 `Online Phonics Classes for Kids`
- live 1:1 positioning
- ages 3–12
- assessment-first placement
- blending / decoding / spelling / fluency coverage
- links out to the comparison owner and fee owner instead of trying to absorb those intents

**Decision:** protect. No rewrite required in Brick 3.

### `/best-online-phonics-classes-for-kids-in-india`

Already aligned to comparison/provider-selection intent. The source explicitly contains:

- `best online phonics classes in India`
- `best phonics classes online`
- `how to choose phonics classes`
- four decision gates
- format comparison
- provider scorecard
- demo questions
- red flags
- Tiny Steps evidence links
- dedicated fee-page handoff

This means the dedicated commercial comparison route already contains the correct framework for the intent that the older editorial article also targets.

**Decision:** protect as the sole final comparison owner.

### `/phonics-fees-india`

Already aligned to fee/cost/price research intent:

- H1 `Phonics Class Fees in India`
- 1:1 and group pricing research
- fee/cost/price keyword cluster
- Tiny Steps pricing reference
- assessment handoff

**Decision:** protect. Do not broaden it into generic phonics programme intent.

---

## 4. Existing generic/comparison aliases already clean

The repository already permanently consolidates:

- `/phonics-classes-for-kids` → `/phonics`
- `/online-phonics-reading-classes` → `/phonics`
- `/best-online-phonics-classes-india` → `/best-online-phonics-classes-for-kids-in-india`

These aliases must remain direct 301s to their final owners.

---

## 5. The one remaining commercial collision

The remaining indexable overlap is:

`/blog/how-to-choose-phonics-classes`

versus:

`/best-online-phonics-classes-for-kids-in-india`

Both serve provider-selection / comparison intent. Brick 1 already classified the blog as **MERGE**.

### Final Brick 4 destination

`/blog/how-to-choose-phonics-classes`

→ **301** →

`/best-online-phonics-classes-for-kids-in-india`

The historical sources:

- `/blog/best-online-phonics-classes-for-kids`
- `/blog/best-phonics-classes-for-kids`

must also resolve **directly** to the final comparison owner when Brick 4 executes the retirement. They must not chain through the retiring `how-to-choose` URL.

---

## 6. Why the redirect is deliberately executed in Brick 4

Brick 3 owns **commercial intent separation and cannibalisation control**.

Brick 4 owns **merge / retirement / 301 mechanics**.

Keeping the physical retirement in Brick 4 avoids:

- changing redirects twice across adjacent bricks
- temporary redirect chains
- deleting a source before merge verification is recorded
- mixing ownership decisions with technical retirement mechanics

Brick 3 therefore closes with one explicit, bounded dependency: Brick 4 must retire the approved duplicate exactly as specified above.

---

## 7. Code-level recovery guardrails added

### Ownership registry

`src/lib/seoRecoveryBrick3CommercialOwnership.ts`

This records:

- the five commercial owners
- existing generic/comparison aliases
- the one pending Brick 4 retirement
- the required final redirect shape

### Regression tests

`src/tests/seo/recoveryBrick3CommercialCannibalisation.spec.ts`

The test protects:

- generic phonics ownership on `/phonics`
- comparison ownership on the dedicated comparison route
- fee ownership on `/phonics-fees-india`
- existing direct generic/comparison aliases
- the approved Brick 4 merge destination
- the requirement that no new commercial owner is introduced

---

## 8. Brick 3 guardrails

From this point forward:

1. `/phonics` must not target `best`, comparison, review or fee intent as its primary job.
2. The comparison owner must not become a duplicate generic programme page.
3. `/phonics-fees-india` must remain price-research focused.
4. `/pricing` remains cross-programme pricing, not phonics-specific price research.
5. `/book-demo` remains the transactional assessment owner.
6. No new phonics commercial URL may be created during recovery.
7. The `how-to-choose` editorial overlap must be retired in Brick 4, not repositioned into another competing commercial URL.

---

## 9. Definition of Done

- [x] Generic phonics owner verified and protected.
- [x] Comparison owner verified and protected.
- [x] Fee owner verified and protected.
- [x] Pricing and assessment owners preserved.
- [x] Existing generic/comparison aliases verified.
- [x] Remaining commercial overlap reduced to one explicitly identified URL.
- [x] Final merge destination locked.
- [x] Redirect-chain requirement documented.
- [x] Code-level ownership registry added.
- [x] Regression protection added.
- [x] No new indexable commercial URL created.
- [x] Brick 4 retirement dependency explicitly recorded.

**Brick 3 decision:** CLOSED AT OWNERSHIP/CANNIBALISATION CONTROL LAYER.  
**Immediate next action:** Brick 4 physically merges and retires `/blog/how-to-choose-phonics-classes` and cleans its historical aliases to direct 301s.
