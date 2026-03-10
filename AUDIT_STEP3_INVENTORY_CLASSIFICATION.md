# STEP 3: Inventory Classification (5 Buckets)

## Bucket Definitions

1. **Planned Only** - Games designed/in roadmap but NOT yet implemented (no working component)
2. **Legacy/Live Only** - Existing playable games from older registries that should be restored and visible
3. **Both (Planned + Existing)** - Games that exist as playable legacy versions AND are on planned roadmap (keep both)
4. **Replaced (Superseded)** - Older game versions that have been replaced by newer versions but older still exists (keep both, label clearly)
5. **Truly Obsolete** - Games intentionally removed/hidden (should be rare, prove explicit removal)

---

## BUCKET 1: Planned Only (No Implementation)

These games are in the roadmap but NOT yet implemented.

### Stage 3 Planned Games (4 tiles)
1. **Grammar Fix** 
   - gameId: eem-g14-grammar-fix
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

2. **Better Sentences**
   - gameId: eem-g15-better-sentences
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

3. **Collocation Builder**
   - gameId: eem-g16-collocation-builder
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

4. **Idiom in a Sentence**
   - gameId: eem-g17-idiom-in-a-sentence
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

### Stage 4 Planned Games (3 tiles)
5. **Meaning from Context**
   - gameId: eem-g21-meaning-from-context
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

6. **Synonym & Antonym Hunt**
   - gameId: eem-g22-synonym-antonym-hunt
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

7. **Crossword from Reading**
   - gameId: eem-g23-crossword-from-reading
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

### Stage 5 Planned Games (4 tiles)
8. **Use the Word Aloud**
   - gameId: eem-g24-use-the-word-aloud
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

9. **Explain the Meaning**
   - gameId: eem-g25-explain-the-meaning
   - Status: comingSoon: true
   - Component: ❌ Does not exist
   - Playable: ❌ No
   - Recommendation: Keep in roadmap. Status: comingSoon ✅

10. **Present an Argument – Guided**
    - gameId: eem-g26-present-argument-guided
    - Status: comingSoon: true
    - Component: ❌ Does not exist
    - Playable: ❌ No
    - Recommendation: Keep in roadmap. Status: comingSoon ✅

11. **Present an Argument – Timed**
    - gameId: eem-g27-present-argument-timed
    - Status: comingSoon: true
    - Component: ❌ Does not exist
    - Playable: ❌ No
    - Recommendation: Keep in roadmap. Status: comingSoon ✅

### Stage 6 Planned Games (3 tiles)
12. **Confident Speaking – Foundation**
    - gameId: eem-g28-confident-speaking-foundation
    - Status: comingSoon: true
    - Component: ❌ Does not exist
    - Playable: ❌ No
    - Recommendation: Keep in roadmap. Status: comingSoon ✅

13. **Confident Speaking – Advanced**
    - gameId: eem-g29-confident-speaking-advanced
    - Status: comingSoon: true
    - Component: ❌ Does not exist
    - Playable: ❌ No
    - Recommendation: Keep in roadmap. Status: comingSoon ✅

14. **Confident Speaking – Championship**
    - gameId: eem-g30-confident-speaking-championship
    - Status: comingSoon: true
    - Component: ❌ Does not exist
    - Playable: ❌ No
    - Recommendation: Keep in roadmap. Status: comingSoon ✅

### Summary
- **Total in Planned Only:** 14 games
- **Action:** Keep all in roadmap as comingSoon
- **No code changes needed**

---

## BUCKET 2: Legacy/Live Only (Existing, Not in Current Roadmap)

These games are playable, exist in legacy registries, but NOT currently featured in KidsEnglishExcellence.

### From KidsPhonicsLibrary (Legacy Mission)

1. **Letter → Sound Match**
   - gameId: (from legacy) - needs mapping
   - Route: `/kids/games/phonics/letter-sound`
   - Component: ❌ Route NOT in current routes.tsx
   - Status: Orphaned (not routed)
   - Playable: ❌ No (route missing)
   - In Current Mission? ❌ No
   - Recommendation: **Investigate if component exists. If yes, add to routes.tsx and optionally restore to mission. If no, mark as removed.**

2-7. **Other legacy games** (already mapped to current routes)
   - Balloon Pop (Jolly Levels) → Now in current mission ✓
   - Sound Detective → Now in current mission ✓
   - Letter Tracing → Now in current mission ✓
   - Letter Tracing + Sounds → Now in current mission ✓
   - My First Words → Now in current mission ✓
   - Sentence Stepper → Now in current mission ✓

### Summary
- **Total in Legacy/Live Only:** 1 (orphaned route)
- **Action:** Investigate Letter → Sound Match. If recoverable, restore or mark as hidden. If missing, accept as removed.
- **Tier 2:** Consider if any legacy games should be restored with legacyLive status for practice/challenge purposes

---

## BUCKET 3: Both (Planned + Existing Playable)

Games that exist as BOTH playable components AND are on the planned roadmap. These should be kept visible AND marked to show they're playable now (not just coming soon).

### Analysis Required

None identified in initial audit. The current structure keeps planned games separate from existing games.

**However,** the 3 "false variants" (Balloon Pop / Letter Sounds, Fluent Reading, Summarize Simply) might fit this category IF they are intended to be:
- Existing base game (Story Reading, New Words, Balloon Pop)
- PLUS planned feature variants (Fluent mode, Summarize mode)

**Decision needed:** Are these false variants:
- Separate planned games (should be comingSoon entries)?
- Variants of existing games (should update component to support modes)?
- Duplicate entries (should be consolidated)?

### Recommendation

**For now, classify as false variants to fix in STEP 5-6. If intended as separate planned games, move to BUCKET 1.**

---

## BUCKET 4: Replaced (Superseded but Both Exist)

Games where a newer version exists but older version is also kept playable and visible.

### Analysis

None identified in current audit. The codebase appears to have:
- MyFirstWordsGame (replaces older blend games but branded differently)
- SentenceStepperStage4 (replaces older SentenceSteps but single newer version)

None are explicitly marked as `supersededBy` field in Tile type.

**If intended future use:**
- Mark old games with `supersededBy: "newer-game-id"`
- Add UI badge showing "Newer Version Available: [link]"
- Keep visible but with note

### Current Status

- **Total in Replaced:** 0
- **Action:** None needed unless strategic decision to restore older game versions

---

## BUCKET 5: Truly Obsolete (Intentionally Removed)

Games that were in codebase but intentionally removed and hidden from UI.

### Analysis

None identified. All removed games are simply not referenced, not explicitly marked as hidden.

**Examples of what would be Bucket 5:**
- Old flash games no longer supported
- Games that didn't work correctly
- Games replaced by better versions and explicitly removed

### Current Status

- **Total in Obsolete:** 0
- **Action:** None needed. Don't artificially remove playable games.

---

## Classification Summary Table

| Bucket | Count | Games | Action |
|---|---|---|---|
| 1: Planned Only | 14 | Grammar Fix, Better Sentences, ... (all comingSoon) | Keep all in roadmap |
| 2: Legacy/Live Only | 1 | Letter → Sound Match (orphaned) | Investigate route |
| 3: Both | 3 | Fluent Reading, Summarize Simply, Letter Sounds/Balloon Pop issue | Fix false variants |
| 4: Replaced | 0 | None identified | N/A |
| 5: Obsolete | 0 | None identified | N/A |

---

## Inventory Summary

### Current Mission (KidsEnglishExcellence)
- Stage 1: 5 tiles (3 correct, 2 false variants)
- Stage 2: 4 tiles (4 correct)
- Stage 3: 7 tiles (3 correct, 4 planned)
- Stage 4: 8 tiles (2 correct, 3 false variants, 3 planned)
- Stage 5: 4 tiles (4 planned)
- Stage 6: 3 tiles (3 planned)
- **Total: 31 current + 6 stage 5-6 planned = 37 tiles**

### Playable Games (Not counting duplicates/variants)
- Actual distinct components: 11
- True variants: 2 (MyFirstWordsGame: 2 levels, SentenceStepperStage4: 7 packs)
- False variants: 3 (need fixing)
- **Net distinct playable games: ~11 components**

### Status Distribution
- Live: 15 tiles (mostly correct)
- Ready: 0 tiles
- Legacy: 0 tiles
- comingSoon: 22 tiles (14 planned, 3 false variants, 5 planned future)

---

## Next Steps

STEP 4-5 will:
1. Fix the 3 false variants
2. Investigate orphaned Letter → Sound Match route
3. Create implementation-level proofs for all true variants
4. Build exact fix list with new status types

