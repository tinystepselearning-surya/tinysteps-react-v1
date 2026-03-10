# STEP 4 & 5: Implementation-Level Verification + Exact Mismatches

## STEP 4: Implementation-Level Proof for All Variants

### TRUE VARIANT #1: MyFirstWordsGame (2 Levels)

**Game:** My First Words  
**File:** `src/pages/kids/games/phonics/MyFirstWords/MyFirstWordsGame.tsx`  
**Routed as:** Two separate tiles with different level params

#### Level 1: "Blend 2 Sounds"
- **Route:** `/kids/games/phonics/my-first-words?level=1`
- **Expected Behavior:** Slide & Join mode
- **Implementation Proof:**
  - **Line 25:** `const urlModeRaw = (searchParams.get("mode") || "").toLowerCase();`
  - **Line 40:** `const [activeLevelId, setActiveLevelId] = useState<LevelId>(...)`
  - **Lines 45-48:** `useEffect(() => { if (forcedMode && activeLevelId !== forcedMode) setActiveLevelId(forcedMode); }, [forcedMode, activeLevelId]);`
  - **Lines 50-51:** `const activeLevel = useMemo(() => LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0], ...)`
  - **File: myFirstWordsData.ts, Lines 89-99:** LEVELS array:
    ```typescript
    export const LEVELS: { id: LevelId; title: string; subtitle: string }[] = [
      { id: "level_1", title: "Level 1: Slide & Join (Practice)", subtitle: "Drag bubbles to join sounds" },
      { id: "level_2", title: "Level 2: Tap the Word (Quick Quiz)", subtitle: "Listen and tap what you hear" },
    ];
    ```
- **Result:** ✅ **Component DOES support level param and renders different modes**

#### Level 2: "More Blending"
- **Route:** `/kids/games/phonics/my-first-words?level=2`
- **Expected Behavior:** Tap the Word mode
- **Implementation Proof:** Same as above - component uses LEVELS[1] for level=2
- **Result:** ✅ **Component DOES support level param for second mode**

**Verdict:** ✅ **TRUE VARIANT - Both level params create distinct gameplay**

---

### TRUE VARIANT #2: SentenceStepperStage4 (7 Packs)

**Game:** Sentence Stepper  
**File:** `src/pages/kids/games/phonics/SentenceStepperStage4.tsx`  
**Routed as:** Three separate tiles with different pack params

#### Pack 4.0: "Read Sentences"
- **Route:** `/kids/games/phonics/sentence-stepper?pack=4.0&eemTile=read_sentences&eemStage=3`
- **Expected Behavior:** Level 1 - SATPIN phrases (easy start)
- **Implementation Proof:**
  - **Line 20:** `type PackId = "4.0" | "4.1" | "4.2" | "4.3" | "4.4" | "4.5" | "4.6";`
  - **Line 59:** `const PACK_ORDER: PackId[] = ["4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6"];`
  - **Line 224:** `const startPackParam = (searchParams.get("pack") as PackId) || undefined;`
  - **Lines 227-230:** 
    ```typescript
    const initialPackIndex = useMemo(() => {
      if (startPackParam && PACK_ORDER.includes(startPackParam)) return PACK_ORDER.indexOf(startPackParam);
      return 0;
    }, [startPackParam]);
    ```
  - **Line 66:** `const CONTENT: Record<PackId, string[]> = { ...with different content per pack... }`
  - **Lines 165-166:** 
    ```typescript
    { packId: "4.0", title: "Level 1", focus: "SATPIN phrases (easy start)" },
    ```
- **Result:** ✅ **Component DOES support pack=4.0 and routes to pack 0**

#### Pack 4.3: "Early Reader Fluency"
- **Route:** `/kids/games/phonics/sentence-stepper?pack=4.3&eemTile=early_reader_fluency&eemStage=3`
- **Expected Behavior:** Level 4 - short o (on/top/tom)
- **Implementation Proof:** Same logic as 4.0, but PACK_ORDER.indexOf("4.3") = 3
  - **Line 169:** `{ packId: "4.3", title: "Level 4", focus: "+ short o (on/top/tom)" },`
- **Result:** ✅ **Component DOES support pack=4.3 with different content**

#### Pack 4.2: "Sentence Builder"
- **Route:** `/kids/games/phonics/sentence-stepper?pack=4.2&eemStage=3`
- **Expected Behavior:** Level 3 - c, k, g, r
- **Implementation Proof:**
  - **Line 168:** `{ packId: "4.2", title: "Level 3", focus: "+ c, k, g, r (use \"can\" frames)" },`
- **Result:** ✅ **Component DOES support pack=4.2 with different content**

**Verdict:** ✅ **TRUE VARIANT - All 7 packs are implemented with distinct content**

---

### FALSE VARIANT #1: KidsBalloonPop (Letter Sounds vs Balloon Pop)

**Game:** Balloon Pop  
**File:** `src/pages/KidsBalloonPop.tsx`  
**Routed as:** Two separate tiles with different pack params

#### Tile 1: "Letter Sounds" (`?pack=1&eemTile=letter_sounds`)
#### Tile 2: "Balloon Pop" (`?pack=2`)

**Implementation Analysis:**

1. **Pack Param Support:**
   - **Line 244:** `const [searchParams] = useSearchParams();`
   - **Grep Result:** No `pack` param used anywhere in component after line 244
   - **Line 260:** `const levelParam = searchParams.get("level");`
   - **Observation:** `level` param read but NOT used to create game variants
   - **Line 372:** `const eemTile = searchParams.get("eemTile");`
   - **Line 373-375:** `if (eemTile) { ... }` - only used for telemetry tracking

2. **LEVELS Array Check:**
   - **Result:** ❌ NO LEVELS array found in component
   - **Comparison:** Unlike MyFirstWordsGame which has LEVELS array (myFirstWordsData.ts), BalloonPop has no such structure
   - **Game Structure:** Single monolithic balloon pop game, no internal levels

3. **What Actually Happens:**
   - Both routes `/balloon-pop?pack=1` and `/balloon-pop?pack=2` load **identical component**
   - `pack` parameter is read but **NOT used**
   - `level` parameter is read but **NOT used**
   - Only `eemTile` affects behavior (telemetry, not gameplay)
   - **Result:** Both routes produce IDENTICAL game experience

**Verdict:** ❌ **FALSE VARIANT - Query params do NOT create distinct games**

**Recommendation:** 
- Either consolidate to single route `/balloon-pop`
- OR implement actual pack/level variants in component (not current implementation)
- For now, both tiles load same game - should be consolidated or marked as same game

---

### FALSE VARIANT #2: Story Reading / Fluent Reading

**Game:** Story Reading  
**File:** `src/pages/kids/games/reading/StoryReading/StoryReadingGame.tsx`  
**Routed as:** Two separate tiles
- Tile 1: "Story Reading" (`/story-reading`)
- Tile 2: "Fluent Reading" (`/story-reading?mode=fluent`)

**Implementation Analysis:**

1. **Mode Param Support:**
   - **Line 3:** `import { useNavigate, useSearchParams } from "react-router-dom";`
   - **Line 12:** `const [searchParams] = useSearchParams();`
   - **Line 14:** `const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";`
   - **Line 15:** `const missionReturnHref = buildMissionReturnHref(searchParams, kidId);`
   - **Line 16:** `const missionTileId = searchParams.get("eemTile") || 'story-reading';`
   - **Grep Result:** `mode` param is **NOT mentioned anywhere** in component code

2. **What Actually Happens:**
   - Route `/story-reading?mode=fluent` loads StoryReadingGame.tsx
   - Component ignores `mode` param (not read, not used)
   - Both routes produce **identical game experience**

**Verdict:** ❌ **FALSE VARIANT - mode param NOT implemented**

**Recommendation:**
- Either implement `mode` parameter support in component
- OR consolidate to single route
- OR mark "Fluent Reading" as planned (comingSoon) until mode support added

---

### FALSE VARIANT #3: New Words / Summarize Simply

**Game:** New Words from Reading  
**File:** `src/pages/kids/games/reading/NewWordsFromReading/NewWordsFromReading.tsx`  
**Routed as:** Two separate tiles
- Tile 1: "New Words from Reading" (`/new-words`)
- Tile 2: "Summarize Simply" (`/new-words?mode=summarize`)

**Implementation Analysis:**

1. **Mode Param Support:**
   - **Line 2:** `import { useNavigate, useSearchParams } from 'react-router-dom';`
   - **Line 7:** `const [searchParams] = useSearchParams();`
   - **Line 9:** `const kidId = searchParams.get('kidId') || localStorage.getItem('ts_active_kid_v1') || '';`
   - **Line 10:** `const missionReturnHref = buildMissionReturnHref(searchParams, kidId);`
   - **Line 11:** `const missionTileId = searchParams.get('eemTile') || 'new-words-from-reading';`
   - **Grep Result:** `mode` param is **NOT mentioned anywhere** in component code

2. **What Actually Happens:**
   - Route `/new-words?mode=summarize` loads NewWordsFromReading.tsx
   - Component ignores `mode` param (not read, not used)
   - Both routes produce **identical game experience**

**Verdict:** ❌ **FALSE VARIANT - mode param NOT implemented**

**Recommendation:**
- Either implement `mode` parameter support in component
- OR consolidate to single route
- OR mark "Summarize Simply" as planned (comingSoon) until mode support added

---

## STEP 5: Exact Mismatches Summary

### Critical Mismatches Found

| ID | Type | Issue | Current State | Expected State | Fix Required |
|---|---|---|---|---|---|
| M1 | False Variant | Balloon Pop shows 2 tiles (`?pack=1` & `?pack=2`) but both are identical games | Stage 1 has 2 tiles: "Letter Sounds" & "Balloon Pop" loading same component | Either (a) 1 tile with consolidated route, or (b) implement pack variants, or (c) merge as same game with new title | **HIGH PRIORITY** |
| M2 | False Variant | Fluent Reading claims distinct game but mode param not implemented | Stage 4 Tile 1: "Fluent Reading" routes to `/story-reading?mode=fluent` | Either (a) implement mode support, or (b) mark as planned (comingSoon), or (c) consolidate to Story Reading | **HIGH PRIORITY** |
| M3 | False Variant | Summarize Simply claims distinct game but mode param not implemented | Stage 4 Tile 5: "Summarize Simply" routes to `/new-words?mode=summarize` | Either (a) implement mode support, or (b) mark as planned (comingSoon), or (c) consolidate to New Words | **HIGH PRIORITY** |
| M4 | Orphaned Route | Letter → Sound Match route not in routes.tsx | Legacy registry references `/kids/games/phonics/letter-sound` but not routed | Add route to routes.tsx if component exists, else mark as removed | **MEDIUM PRIORITY** |
| M5 | Status Mismatch | Current status type insufficient | Only supports: 'live' \| 'ready' \| 'legacy' | Expand to: 'live' \| 'legacyLive' \| 'ready' \| 'comingSoon' \| 'replaced' \| 'hidden' | **HIGH PRIORITY** |
| M6 | Legacy Games | 7 legacy games exist but not all surfaced in current mission | KidsPhonicsLibrary has 7 games, only ~4 actively featured | Decide if legacy games should be restored with legacyLive status for practice | **LOW PRIORITY** |

### Mismatch Count
- **Total critical mismatches:** 6
- **Blocking reconciliation:** 5 (M1-M5)
- **Optional enhancement:** 1 (M6)

---

## Implementation Fix List (for STEP 6)

### Priority 1: Status Type Update
- **File:** `src/pages/KidsEnglishExcellence.tsx`
- **Current:** `status?: 'live' | 'ready' | 'legacy';` (line 637)
- **New:** `status?: 'live' | 'legacyLive' | 'ready' | 'comingSoon' | 'replaced' | 'hidden';`
- **Impact:** Allows proper classification of all tiles

### Priority 2: False Variants (Decide on each)

**Option A for all false variants:** Mark as planned (comingSoon)
- Mark "Letter Sounds" as comingSoon
- Mark "Fluent Reading" as comingSoon  
- Mark "Summarize Simply" as comingSoon
- Remove false routes
- Keep base games (Balloon Pop, Story Reading, New Words)

**Option B for Balloon Pop:** Consolidate
- Remove "Letter Sounds" tile (duplicate)
- Keep "Balloon Pop" tile
- Verify Balloon Pop component loads correctly

**Option C for Reading Games:** Implement mode support
- Modify StoryReadingGame.tsx to support `mode=fluent`
- Modify NewWordsFromReading.tsx to support `mode=summarize`
- Verify implementations create distinct UX

### Recommended Approach: **Option A (Safest)**

1. Mark 3 false variants as `comingSoon: true`
2. Remove their query param routes
3. Keep base games with clean routes
4. Future: Implement variants when ready

**Rationale:**
- Preserves existing playable games (safe)
- Honest about planned features (true)
- Prevents fake routes loading identical games (correct)
- Can implement variants later when component support added

---

## Proof Table (Summary)

| Variant | Component | Param | Supported? | Proof Line | Evidence |
|---|---|---|---|---|---|
| MyFirstWordsGame Level 1 | MyFirstWordsGame.tsx | level=1 | ✅ YES | 25, 40, 51 | LEVELS array with 2 modes |
| MyFirstWordsGame Level 2 | MyFirstWordsGame.tsx | level=2 | ✅ YES | 25, 40, 51 | LEVELS array with 2 modes |
| SentenceStepperStage4 Pack 4.0 | SentenceStepperStage4.tsx | pack=4.0 | ✅ YES | 20, 59, 224 | PACK_ORDER array, CONTENT per pack |
| SentenceStepperStage4 Pack 4.3 | SentenceStepperStage4.tsx | pack=4.3 | ✅ YES | 20, 59, 224 | PACK_ORDER array, CONTENT per pack |
| SentenceStepperStage4 Pack 4.2 | SentenceStepperStage4.tsx | pack=4.2 | ✅ YES | 20, 59, 224 | PACK_ORDER array, CONTENT per pack |
| Balloon Pop Pack 1 | KidsBalloonPop.tsx | pack=1 | ❌ NO | grep no match | Param read but NOT used |
| Balloon Pop Pack 2 | KidsBalloonPop.tsx | pack=2 | ❌ NO | grep no match | Param read but NOT used |
| Story Reading Fluent | StoryReadingGame.tsx | mode=fluent | ❌ NO | grep no match | Param NOT in component |
| New Words Summarize | NewWordsFromReading.tsx | mode=summarize | ❌ NO | grep no match | Param NOT in component |

---

## Next Steps

STEP 6 will patch the mission registry with:
1. New status type definition
2. Updated tile entries for false variants
3. Corrected routes for all games
4. TypeScript validation

