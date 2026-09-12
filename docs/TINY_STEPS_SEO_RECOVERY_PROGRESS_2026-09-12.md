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

**Status:** ✅ CLOSED — commercial ownership control locked

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_3_COMMERCIAL_CANNIBALISATION_2026-09-12.md`  
**Ownership registry:** `src/lib/seoRecoveryBrick3CommercialOwnership.ts`  
**Regression test:** `src/tests/seo/recoveryBrick3CommercialCannibalisation.spec.ts`

**Ownership registry commit:** `bd322318114ac401503aaee25e9865be180946c2`  
**Regression-test commit:** `909f76cf5619fbabd12221c53e793f517673c70d`  
**Artifact commit:** `850941c5f08a8e270298014d0f86318ecd353746`  
**Closure commit:** `c23dd4b052ad844bca035c459c5ced21c3913737`

Commercial owner boundaries locked:

- `/phonics` — generic phonics programme intent.
- `/best-online-phonics-classes-for-kids-in-india` — best / compare / review / provider-selection intent.
- `/phonics-fees-india` — phonics fee / price / cost research.
- `/pricing` — cross-programme pricing and packages.
- `/book-demo` — assessment / demo / trial intent.

Existing aliases confirmed:

- `/phonics-classes-for-kids` → `/phonics`
- `/online-phonics-reading-classes` → `/phonics`
- `/best-online-phonics-classes-india` → `/best-online-phonics-classes-for-kids-in-india`

Brick 3 isolated the remaining approved commercial duplicate and locked its final destination for Brick 4.

**Brick 3 decision:** CLOSED.

---

## BRICK 4 — Merge Genuine Duplicate Pages

**Status:** ✅ CLOSED — provider-selection duplicate retired into the commercial comparison authority

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_4_DUPLICATE_MERGE_2026-09-12.md`  
**Regression test:** `src/tests/seo/recoveryBrick4DuplicateMerge.spec.ts`

### Consolidation completed

Retired source:

`/blog/how-to-choose-phonics-classes`

Final authority owner:

`/best-online-phonics-classes-for-kids-in-india`

Historical aliases also now resolve directly to the final owner:

- `/blog/best-online-phonics-classes-for-kids`
- `/blog/best-phonics-classes-for-kids`

Final topology:

```text
/blog/how-to-choose-phonics-classes
    └── 301 → /best-online-phonics-classes-for-kids-in-india

/blog/best-online-phonics-classes-for-kids
    └── 301 → /best-online-phonics-classes-for-kids-in-india

/blog/best-phonics-classes-for-kids
    └── 301 → /best-online-phonics-classes-for-kids-in-india
```

No redirect chain through another retired URL is allowed.

### Content-preservation decision

The retiring article’s useful provider-selection concepts were audited before deletion. The surviving comparison page already contains the equivalent decision framework through:

- child-fit / placement decision gates
- teaching-quality checks
- proof-of-transfer checks
- format comparison
- provider scorecard
- trial / demo questions
- red flags
- pricing questions
- links to programme, fee and assessment owners

Therefore no duplicate block of retired copy was pasted into the surviving page. The authority owner already covers the useful decision job.

### Technical and discovery cleanup

- [x] retired source post deleted from `src/content/blog/posts/phonics/`
- [x] consolidation map points all three retired paths directly to the final comparison owner
- [x] server-side canonical redirect map updated
- [x] consolidation audit expanded for blog → commercial-page destinations
- [x] retired URL removed from RSS required URLs
- [x] prebuild LLM discovery cleanup added
- [x] phonics editorial authority set updated from 34 → 33
- [x] overall quality-reviewed editorial set updated from 51 → 50
- [x] blog intent matrix updated so only distinct informational support pages remain
- [x] dedicated Brick 4 regression guard added

### Surviving informational pages deliberately preserved

- `/blog/online-phonics-classes-vs-school` — delivery-mode comparison
- `/blog/why-parents-choose-online-phonics` — online-format benefits / parent fit

These are not merged because they serve different informational jobs from commercial provider selection.

### Key implementation commits

- `19dbd29805308daa0eaa3bf61847816ed026c72b` — final consolidation topology
- `d2dc29e20d8647efc652178df73e30c2da7fd2ca` — server redirects
- `d0f4ae19583a0d74b8aced2a87037dc3621cc722` — consolidation audit
- `03341c055b04da69296ed66f8cefde3742b759ae` — duplicate source deletion
- `8dfdf6ac349969b1d6bfca7b28c7e2c3e3456865` — intent matrix update
- `41311eee83f5bbdb8330d014f29b3a4757aa65e0` — feed / LLM discovery normalization
- `cb1fc1b0d87152fe827cd710da021cd3e46da771` — Brick 4 regression guard
- `87f5094a1af8715cc4dd603c8dc4160c22426d7f` — Brick 4 artifact

### Deferred cleanup

Historical metadata entries, dormant CTA overrides, committed generated files awaiting normal prebuild regeneration, and old audit documentation may still mention the retired slug. These are not live competing owners and are reserved for Brick 8 / Brick 11 cleanup.

**Brick 4 decision:** CLOSED.

---

## BRICK 5 — Strengthen the Parent-Problem Authority Page

**Status:** ✅ CLOSED — canonical parent decoding diagnostic strengthened

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_5_PARENT_PROBLEM_AUTHORITY_2026-09-12.md`  
**Regression test:** `src/tests/seo/recoveryBrick5ParentProblemAuthority.spec.ts`

Canonical owner preserved:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

Historical source remains permanently retired:

`/blog/child-knows-letter-sounds-but-cannot-read`

→ **301** →

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

### Authority strengthening completed

- [x] exact high-intent title retained
- [x] meta/excerpt strengthened around `cannot blend`, CVC decoding and fresh-word transfer
- [x] user-facing `Blog 50` ownership language removed
- [x] diagnostic sequence expanded to six explicit stages
- [x] dedicated CVC-decoding stage added
- [x] CVC explainer linked as a supporting authority
- [x] ABC-known, blending, fluency and comprehension intents kept separate
- [x] home-practice routine aligned to the diagnostic sequence
- [x] structured-support section added without hard-selling
- [x] `/phonics` and `/book-demo` handoffs preserved
- [x] FAQ coverage strengthened around real parent wording
- [x] professional-review / non-diagnostic boundary preserved
- [x] no new SEO URL created

### Protected six-stage sequence

**Sound recall → Oral blend → Printed blend → CVC decoding → Fresh-word transfer → Connected-text transfer**

### Implementation commits

- `d4fcc3011d236d44a4b69a2fed64a224bbb7c818` — strengthen canonical parent decoding authority
- `139febd25ef6b7176e768ba3ffbb314f760bc6b9` — Brick 5 regression guard
- `1dc647f1776db00b3a8d18b6bfd891a48932f58f` — Brick 5 artifact

**Brick 5 decision:** CLOSED.

---

## BRICK 6 — Establish SATPIN as a Master Authority Hub

**Status:** ✅ CLOSED — SATPIN master authority strengthened and home-routine intent preserved

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_6_SATPIN_AUTHORITY_2026-09-12.md`  
**Regression test:** `src/tests/seo/recoveryBrick6SatpinAuthority.spec.ts`

Master authority preserved:

`/blog/satpin-phonics-guide`

Supporting implementation page preserved:

`/blog/phonics-satpin-launch`

### Authority strengthening completed

- [x] no new SATPIN URL created
- [x] title aligned to sounds, order, words and blending
- [x] meta/excerpt expanded around the same master query family
- [x] dedicated SATPIN-order section added
- [x] dedicated SATPIN-words section added
- [x] dedicated SATPIN-sentences / early-reading section added
- [x] dedicated `What comes after SATPIN?` section added
- [x] FAQ coverage expanded for order, words, blending, reading and next steps
- [x] internal `Blog #` editorial numbering removed from parent-facing copy
- [x] evidence boundary preserved: SATPIN is useful but not a mandatory universal first sequence
- [x] no fixed duration or mastery percentage asserted
- [x] broader CVC, blending and diagnostic intents remain on their existing owners
- [x] `/blog/phonics-satpin-launch` remains the practical home-routine support article
- [x] support article continues to point to the SATPIN master guide
- [x] master guide links toward `/phonics` and `/book-demo`
- [x] regression protection added

### Public support-page identity

The source slug remains:

`week-1-phonics-satpin-launch`

The existing rename registry maps it to the public authority slug:

`phonics-satpin-launch`

No URL migration was introduced in Brick 6.

### Implementation commits

- `bf8134024dad4f7ae4c543a3b0085610c183a674` — strengthen SATPIN master guide
- `f9c38717c54c5f26d4998d5198c842a9e4766bf1` — Brick 6 regression guard
- `dcaaa737c2edd49abb2a2d4dac2fd6238b73a415` — Brick 6 artifact

**Brick 6 decision:** CLOSED.

---

## BRICK 7 — Protect the Tracing Authority Page

**Status:** ✅ CLOSED — tracing traffic owner protected and reading pathway strengthened

**Artifact:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_7_TRACING_AUTHORITY_2026-09-12.md`  
**Regression test:** `src/tests/seo/recoveryBrick7TracingAuthority.spec.ts`

Primary tracing owner preserved:

`/free-letter-tracing-game-for-kids`

Distinct sound-supported tracing page preserved:

`/letter-tracing-with-sounds-game`

### Authority protection completed

- [x] no new tracing SEO URL created
- [x] generic tracing owner retains its URL, title, H1, A–Z structure and interactive game
- [x] sound-enabled tracing remains separately indexable for a narrower print–sound practice intent
- [x] tracing is explicitly separated from decoding evidence
- [x] reading-development bridge added: **letter formation → sounds → blending → reading**
- [x] generic tracing page now links to sound-supported tracing, SATPIN, word building and `/phonics`
- [x] assessment remains downstream of educational guidance
- [x] sound-enabled tracing page now points into SATPIN, blending practice and the sounds-known-but-cannot-read diagnostic
- [x] both tracing pages remain in public route and sitemap architecture
- [x] existing practice-capability boundaries preserved
- [x] regression protection added

### Implementation commits

- `d4e57003ff1d6d98c95a0c434dc4ff19b12ffa4b` — primary tracing-owner learning path
- `9b7ee8368326881dc20290c4e96ccfed06b5ffac` — sound-supported tracing differentiation
- `070577f2203726eabf3d860fc39f0292d33efe48` — Brick 7 regression guard
- `35999128eb9533a96dd377ce12f314a70cfbc6b4` — Brick 7 artifact

**Brick 7 decision:** CLOSED.

---

## BRICK 8 — Rebuild the Internal-Link Architecture

**Status:** ⏭️ NEXT

Brick 8 will systematically audit and clean authority flow across the recovery ecosystem.

Planned scope:

- find direct internal links that still point to retired aliases;
- replace redirect-hop internal links with final authority URLs;
- ensure SATPIN support → SATPIN master → `/phonics`;
- ensure parent-problem / blending content → correct diagnostic owner → `/phonics`;
- ensure tracing → sounds / SATPIN / blending → `/phonics`;
- ensure comparison and fees pages reinforce `/phonics` without collapsing their distinct intents;
- use descriptive anchors instead of generic `click here` patterns where practical;
- protect the locked owner map with regression checks;
- create no new SEO page.
