# Tiny Steps SEO Recovery — Execution Progress

**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`  
**Started:** 2026-09-12  
**Repository:** `tinystepselearning-surya/tinysteps-react-v1`  
**Execution rule:** Complete and verify one brick before moving to the next.

---

## BRICK 0 — Freeze SEO Expansion

**Status:** ✅ CLOSED — baseline established

**Baseline commit:** `e96568da6d1c7a4db9a8f91d3ca54b3c139f5f28`

Completed:

- [x] No new SEO landing pages during recovery.
- [x] No new city/programmatic phonics expansion.
- [x] No new “best phonics” variants.
- [x] No new generic SATPIN/blending pages.
- [x] No unnecessary URL changes to pages already earning visibility.
- [x] Existing sitemap architecture recorded as the recovery baseline.
- [x] Every SEO change must map to a numbered recovery brick.

**Brick 0 decision:** CLOSED.

---

## BRICK 1 — URL Ownership Registry

**Status:** ✅ CLOSED — ownership decisions locked

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_1_URL_OWNERSHIP_REGISTRY_2026-09-12.md`  
**Artifact commit:** `eeb725c524b69ca03628e3cb06955ea25cf8e856`

Locked primary owners:

- `/phonics` — generic online phonics classes / phonics classes for kids.
- `/best-online-phonics-classes-for-kids-in-india` — best / compare / provider-selection phonics intent.
- `/phonics-fees-india` — phonics fee / cost / price research.
- `/pricing` — cross-programme pricing.
- `/book-demo` — free assessment / demo / trial.
- `/blog/satpin-phonics-guide` — SATPIN master authority.
- `/blog/why-child-knows-letter-sounds-but-cannot-read-words` — child knows sounds but cannot blend/read diagnostic owner.
- `/free-letter-tracing-game-for-kids` — ABC / alphabet / letter-tracing owner.

Evidence-based correction preserved:

`/blog/child-knows-letter-sounds-but-cannot-read`

→ **301** →

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

Approved commercial merge identified:

`/blog/how-to-choose-phonics-classes`

→ final owner →

`/best-online-phonics-classes-for-kids-in-india`

**Brick 1 decision:** CLOSED.

---

## BRICK 2 — Restore `/phonics` as the Main Commercial Authority

**Status:** ✅ CLOSED — strong existing owner preserved and recovery-certified

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_2_PHONICS_AUTHORITY_2026-09-12.md`  
**Regression test:** `src/tests/seo/recoveryBrick2PhonicsAuthority.spec.ts`  
**Test commit:** `55e528e349e6c0090a7fd4d6626a1721f7f50297`  
**Artifact commit:** `b0dd85ae1ad87c6ee1629b674192a343b836c97f`  
**Closure commit:** `9f81afad9945bd45cb140f27cb00d42caf5659b1`

Verified on `/phonics`:

- [x] self-canonical `/phonics`
- [x] commercial H1 `Online Phonics Classes for Kids`
- [x] aligned title/meta
- [x] live 1:1 proposition
- [x] ages 3–12
- [x] assessment-first placement
- [x] 35-minute standard live 1:1 class
- [x] three programme levels
- [x] cumulative phonics methodology
- [x] blending, decoding, spelling and fluency coverage
- [x] progress evidence
- [x] FAQ + Course + pathway schema
- [x] comparison-page handoff
- [x] phonics-fee handoff
- [x] generic historical aliases consolidated into `/phonics`

Controlled decision: no unnecessary broad rewrite was introduced because the current page already satisfies the authority contract.

Known direct-link cleanup to a retired diagnostic alias remains queued for Brick 8 / Brick 11.

**Brick 2 decision:** CLOSED.

---

## BRICK 3 — Remove Commercial Cannibalisation

**Status:** ✅ CLOSED — commercial ownership control locked; physical duplicate retirement handed to Brick 4

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_3_COMMERCIAL_CANNIBALISATION_2026-09-12.md`  
**Ownership registry:** `src/lib/seoRecoveryBrick3CommercialOwnership.ts`  
**Regression test:** `src/tests/seo/recoveryBrick3CommercialCannibalisation.spec.ts`

**Ownership registry commit:** `bd322318114ac401503aaee25e9865be180946c2`  
**Regression-test commit:** `909f76cf5619fbabd12221c53e793f517673c70d`  
**Artifact commit:** `850941c5f08a8e270298014d0f86318ecd353746`

### Commercial owner boundaries now locked

- `/phonics` — generic phonics programme intent.
- `/best-online-phonics-classes-for-kids-in-india` — best / compare / review / provider-selection intent.
- `/phonics-fees-india` — phonics fee / price / cost research.
- `/pricing` — cross-programme pricing and packages.
- `/book-demo` — assessment / demo / trial intent.

### Existing aliases confirmed clean

- `/phonics-classes-for-kids` → `/phonics`
- `/online-phonics-reading-classes` → `/phonics`
- `/best-online-phonics-classes-india` → `/best-online-phonics-classes-for-kids-in-india`

### One remaining commercial collision

The only approved overlapping page remaining is:

`/blog/how-to-choose-phonics-classes`

which overlaps the dedicated comparison owner:

`/best-online-phonics-classes-for-kids-in-india`

Brick 3 locks the final destination but deliberately does **not** retire the source yet. Brick 4 owns merge/retirement mechanics so we do not create temporary redirect chains or change the same redirect topology twice.

### Brick 4 redirect requirement

After content-preservation verification, Brick 4 must create this final shape:

- `/blog/how-to-choose-phonics-classes` → **301** → `/best-online-phonics-classes-for-kids-in-india`
- `/blog/best-online-phonics-classes-for-kids` → **301 directly** → `/best-online-phonics-classes-for-kids-in-india`
- `/blog/best-phonics-classes-for-kids` → **301 directly** → `/best-online-phonics-classes-for-kids-in-india`

No redirect chain through the retiring `how-to-choose` URL is allowed.

### Definition of Done

- [x] Generic programme owner protected.
- [x] Comparison owner protected.
- [x] Fee owner protected.
- [x] Pricing and assessment owners protected.
- [x] Existing commercial aliases verified.
- [x] Remaining overlap reduced to one approved duplicate.
- [x] Final merge destination locked.
- [x] Direct-redirect requirement documented.
- [x] Code-level ownership registry added.
- [x] Regression protection added.
- [x] No new commercial URL created.

**Brick 3 decision:** CLOSED.

---

## BRICK 4 — Merge Genuine Duplicate Pages

**Status:** ⏭️ NEXT

Brick 4 will perform the first physical consolidation under the locked registry.

Immediate target:

`/blog/how-to-choose-phonics-classes`

→ merge useful source material into →

`/best-online-phonics-classes-for-kids-in-india`

→ retire source with direct **301**.

Brick 4 must also:

- redirect both historical “best phonics” blog aliases directly to the final comparison owner;
- remove the retired source from blog discovery/indexing outputs;
- update sitemap/RSS/LLM/editorial-authority registries that currently treat it as a live article;
- preserve useful source material before deletion;
- update internal links to the final owner;
- verify no redirect chain remains;
- run consolidation/regression checks;
- review other Brick 1 merge candidates only where user intent is genuinely duplicated.

Brick 4 must not merge pages merely because they share vocabulary.
