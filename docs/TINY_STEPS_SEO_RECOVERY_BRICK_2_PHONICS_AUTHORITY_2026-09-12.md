# Tiny Steps SEO Recovery — Brick 2 `/phonics` Commercial Authority

**Status:** ✅ BUILT / CERTIFIED  
**Date:** 2026-09-12  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`  
**Brick 1 registry:** `docs/TINY_STEPS_SEO_RECOVERY_BRICK_1_URL_OWNERSHIP_REGISTRY_2026-09-12.md`  
**Primary URL:** `/phonics`

---

## 1. Objective

Restore and protect `/phonics` as the single Tiny Steps owner for generic commercial phonics intent:

- online phonics classes
- online phonics classes for kids
- phonics classes
- phonics classes online
- phonics classes for kids
- live 1:1 phonics classes

Brick 2 must strengthen authority **without** taking comparison intent from `/best-online-phonics-classes-for-kids-in-india` or fee intent from `/phonics-fees-india`.

---

## 2. Audit result

The current `/phonics` implementation already satisfies the recovery contract substantially better than the original recovery baseline assumed.

The correct recovery action is therefore **preserve + certify**, not another large rewrite.

A broad rewrite would create unnecessary ranking volatility and make it harder to measure whether the later cannibalisation cleanup is working.

---

## 3. Commercial owner signals — PASS

### Canonical ownership

- `/phonics` is self-canonical.
- The commercial ownership registry assigns the generic phonics-provider cluster to `/phonics`.
- `/phonics-classes-for-kids` is already a permanent alias to `/phonics`.
- `/online-phonics-reading-classes` is already a permanent alias to `/phonics`.

**Decision:** preserve these consolidations.

### Search snippet

Current title:

> `Online Phonics Classes for Kids | Live 1:1 | Tiny Steps`

Current description communicates:

- live 1:1 delivery
- ages 3–12
- India and worldwide availability
- blending
- decoding
- spelling
- reading fluency
- assessment-first placement

**Decision:** keep the current title and description unchanged during Brick 2.

Reason: they are already tightly aligned to the generic commercial owner and are protected by existing commercial CTR/ownership infrastructure.

### H1

Current H1:

> `Online Phonics Classes for Kids`

**Decision:** keep unchanged.

---

## 4. Above-the-fold commercial proposition — PASS

The hero already establishes:

- live 1:1 online phonics classes
- ages 3–12
- India and worldwide availability
- letter sounds
- blending
- decoding
- spelling patterns
- reading fluency
- structured level-based pathway
- parent-visible progress
- free assessment/demo pathway

This is sufficient generic commercial intent coverage without keyword stuffing.

**Decision:** no forced insertion of repetitive exact-match phrases such as “phonics classes online” into visible hero copy solely for SEO.

---

## 5. Assessment and placement — PASS

The page clearly communicates an assessment-first journey:

1. Free 35-minute demo assessment.
2. Current reading/decoding-gap review.
3. Level-based recommendation.
4. Parent-visible plan.
5. Informed enrolment decision.

This directly supports the Tiny Steps commercial differentiator while remaining consistent with `/book-demo` as the transactional owner.

---

## 6. Programme structure and methodology — PASS

The current page already contains:

### Three curriculum levels

- Foundations
- Early Phonics
- Advanced Phonics

### Three learning stages

- Sounds to words
- Patterns and teams
- Fluency and comprehension

### Methodology signals

- structured synthetic phonics
- explicit modelling
- cumulative progression
- blending
- segmenting/spelling support
- live correction
- retry
- fresh-word transfer
- matched progression
- parent-visible checkpoints

### Standard delivery facts

- ages 3–12
- live 1:1
- 35 minutes per standard live class
- stage-based progression

**Decision:** no programme-structure rewrite is required in Brick 2.

---

## 7. Parent problem coverage — PASS

The page already recognises commercially relevant parent concerns including:

- child knows letters but cannot read words
- child struggles with blending
- child guesses words
- child reads slowly
- spelling confusion
- parent wants structured reading support

It then routes parents into appropriate diagnostic/support content rather than attempting to make `/phonics` an encyclopaedic parent-problem article.

This is the correct role for the commercial programme owner.

---

## 8. Comparison ownership separation — PASS

The page explicitly states that provider comparison belongs to the dedicated comparison guide and links to:

`/best-online-phonics-classes-for-kids-in-india`

The page also states:

> `This programme page stays focused on how Tiny Steps phonics works.`

This is exactly the separation required by Brick 1.

**Decision:** `/phonics` must not absorb “best phonics classes”, provider ranking, or full buyer-comparison ownership.

---

## 9. Fee ownership separation — PASS

The page links to:

`/phonics-fees-india`

for dedicated phonics fee research.

**Decision:** keep fee/cost/market-comparison depth on `/phonics-fees-india`; `/phonics` may state the programme proposition and hand off price research.

---

## 10. Informational authority handoffs — PASS

The page already provides contextual pathways to existing supporting authorities, including:

- `/blog/satpin-phonics-guide`
- `/blog/how-kids-learn-blending`
- `/blog/phonics-blending-activities`
- `/blog/cvc-words-explained-for-parents`
- `/child-not-reading-properly`
- `/reading-classes-for-kids`
- `/reading-fluency-program`

This supports a hub-and-spoke structure without turning `/phonics` into another blog hub.

---

## 11. Free-practice handoffs — PASS

The page correctly distinguishes learning support from practice tools and links to:

- `/free-letter-tracing-game-for-kids`
- `/letter-tracing-with-sounds-game`

This preserves the tracing/practice owners while allowing free-resource traffic to connect into the commercial programme journey.

---

## 12. FAQ / AEO / machine-readable coverage — PASS

The page contains visible parent FAQs and matching FAQ schema covering:

- usefulness of online phonics classes
- choosing a class
- when 1:1 support is useful
- starting age
- signs that a child needs support
- phonics vs reading practice
- blending progress
- spelling
- 1:1 delivery
- parent updates
- class duration
- international families

Machine-readable coverage also includes:

- Course schema
- FAQPage schema
- phonics pathway ItemList
- phonics-class quality criteria ItemList
- India + Worldwide service area

**Decision:** preserve current schema architecture.

---

## 13. Testimonials / trust — PASS

The page includes:

- parent testimonial snippets
- founder/academic review language
- parent-visible progress positioning
- class samples pathway
- curriculum pathway

These are appropriate commercial trust signals without relying on unsupported “best” or “#1” claims.

---

## 14. Brick 2 regression protection added

A dedicated recovery test was added:

`src/tests/seo/recoveryBrick2PhonicsAuthority.spec.ts`

It protects:

- `/phonics` generic-owner assignment
- title/canonical contract
- programme-intent signals
- assessment-first facts
- comparison-owner separation
- fee-owner separation
- SATPIN/problem/practice handoffs
- Course/FAQ/ItemList structured-data signals
- historical generic-phonics alias consolidation

Commit:

`55e528e349e6c0090a7fd4d6626a1721f7f50297`

---

## 15. Known internal-link cleanup — recorded, not a Brick 2 blocker

The `/phonics` source still contains direct references to the retired historical URL:

`/blog/child-knows-letter-sounds-but-cannot-read`

That URL already permanently redirects to the current canonical owner:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

This does **not** create a second indexable owner, so it is not a Brick 2 ownership failure.

However, direct internal links should ultimately point straight to the canonical destination.

**Action owner:** Brick 8 internal-link architecture / Brick 11 technical consolidation.

Reason for not broad-editing the page now: Brick 2 is intentionally minimizing production churn while the generic commercial owner is already structurally strong.

---

## 16. Brick 2 change policy

### Intentionally NOT changed

- `/phonics` URL
- canonical
- title
- meta description
- H1
- hero layout
- programme hierarchy
- major copy blocks
- sitemap membership
- schema architecture
- conversion owner

### Added

- recovery-specific automated regression protection
- formal Brick 2 authority certification
- documented downstream internal-link cleanup

---

## 17. Definition of Done

- [x] `/phonics` confirmed as generic commercial phonics owner.
- [x] Canonical remains `/phonics`.
- [x] Generic historical aliases remain consolidated into `/phonics`.
- [x] Title/meta/H1 align to generic commercial intent.
- [x] Ages, live 1:1, duration and assessment-first placement are clear.
- [x] Curriculum and methodology are sufficiently covered.
- [x] Outcomes and parent-visible progress are clear.
- [x] Comparison intent is delegated to the comparison owner.
- [x] Fee intent is delegated to the fee owner.
- [x] SATPIN/problem/practice supporting paths are present.
- [x] FAQ and structured data are aligned.
- [x] Unsupported “best/#1” claims are not required for programme authority.
- [x] Recovery regression test added.
- [x] No new indexable URL created.
- [x] No unnecessary large-scale content rewrite introduced.

**Brick 2 decision:** CLOSED — `/phonics` is certified as the main generic commercial phonics authority. Brick 3 can now remove remaining commercial cannibalisation around it.
