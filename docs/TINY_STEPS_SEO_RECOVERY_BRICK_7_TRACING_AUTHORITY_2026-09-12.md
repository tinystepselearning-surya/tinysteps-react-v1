# Tiny Steps SEO Recovery — Brick 7: Protect Tracing Authority

**Date:** 2026-09-12  
**Status:** ✅ CLOSED  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

---

## Objective

Protect the existing tracing traffic asset without creating additional tracing SEO pages, while making the learning journey from tracing into phonics explicit.

Locked learning sequence:

> **Letter formation → sounds → blending → reading**

---

## Authority ownership preserved

### Primary generic tracing owner

`/free-letter-tracing-game-for-kids`

Owns:

- ABC tracing
- alphabet tracing
- letter tracing
- tracing letters
- tracing online
- uppercase and lowercase letter formation
- A–Z tracing practice
- printable single-letter tracing workflow

This URL remains unchanged and self-canonical.

### Distinct supporting tracing page

`/letter-tracing-with-sounds-game`

Owns the narrower practice job:

- tracing while hearing/repeating phonics sounds
- connecting print, letter formation and sound recall
- moving from letter-form familiarity toward phonics practice

It does **not** become another generic alphabet-tracing owner.

---

## Changes implemented

### 1. Protected the high-traffic tracing owner

The generic tracing page keeps its existing:

- URL
- title
- H1
- A–Z discovery structure
- interactive tracing game
- printable worksheet pathway
- preschool / kindergarten audience
- self-canonical SEO signals

No migration, rename or duplicate page was introduced.

### 2. Added a clear reading-development bridge

The generic tracing page now contains an explicit pathway:

**Letter formation → sounds → blending → reading**

It sends users to the correct existing owners:

1. `/letter-tracing-with-sounds-game` — connect formation with sound
2. `/blog/satpin-phonics-guide` — understand early phonics sounds, order and words
3. `/free-word-building-game-for-kids` — practise blending and word building
4. `/phonics` — structured teacher-guided phonics pathway
5. `/book-demo` — assessment only when a child is struggling and the starting point is unclear

This uses the tracing traffic as an authority and learning-path feeder without changing its primary search intent.

### 3. Differentiated sound-supported tracing

The sound-enabled tracing page now explicitly states that tracing plus sounds:

- supports print–sound connection;
- is useful preparation for reading;
- is **not by itself evidence of decoding**;
- should progress into blending rather than remain isolated tracing practice.

It now links to:

- SATPIN master guide
- word-building / blending practice
- letter-sounds-but-cannot-read diagnostic guide
- generic tracing owner
- `/phonics`

### 4. Preserved the evidence/learning boundary

The existing practice-capability registry already contained the correct distinction and was preserved:

- generic tracing: letter-form familiarity, not proof of sound retrieval or decoding;
- tracing with sounds: print–sound connection that should feed into blending.

No unsupported claim that tracing itself teaches reading was introduced.

### 5. Added Brick 7 regression protection

New guard:

`src/tests/seo/recoveryBrick7TracingAuthority.spec.ts`

It protects:

- generic tracing ownership
- distinct sound-tracing ownership
- self-canonical route identities
- practice capability boundaries
- tracing → sounds → blending → reading pathway
- SATPIN / word-building / phonics handoffs
- public route and sitemap inclusion
- absence of a need for a new tracing SEO page

---

## URLs deliberately NOT created

Brick 7 creates no new variants such as:

- `/abc-tracing-online`
- `/alphabet-tracing-for-kids`
- `/trace-letters-online`
- `/tracing-games-for-kids`
- individual A–Z SEO landing pages

The existing owner remains the consolidation point for those generic tracing intents.

---

## Implementation commits

- `d4e57003ff1d6d98c95a0c434dc4ff19b12ffa4b` — strengthen the primary tracing-owner learning path
- `9b7ee8368326881dc20290c4e96ccfed06b5ffac` — differentiate sound-supported tracing and feed into blending
- `070577f2203726eabf3d860fc39f0292d33efe48` — Brick 7 regression guard

---

## Definition of Done

- [x] `/free-letter-tracing-game-for-kids` remains the primary generic tracing owner.
- [x] `/letter-tracing-with-sounds-game` remains separately indexable for its narrower print–sound practice intent.
- [x] No new tracing SEO page was created.
- [x] Tracing is not presented as proof of reading or decoding.
- [x] Educational path into sounds, SATPIN, blending and reading is explicit.
- [x] Existing tracing URL/canonical/indexability signals are preserved.
- [x] `/phonics` receives a contextually appropriate authority path.
- [x] Assessment is downstream of educational guidance rather than the first next step.
- [x] Regression protection is committed.

**Brick 7 decision: CLOSED.**

---

## Next Brick

**Brick 8 — Rebuild the Internal-Link Architecture**

Brick 8 will systematically audit and clean authority flow across the recovery ecosystem, including direct links that still point through retired aliases or fail to reinforce the locked URL owners.
