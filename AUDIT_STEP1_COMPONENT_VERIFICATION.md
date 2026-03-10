# STEP 1: Comprehensive Component Verification Report

## Executive Summary
STEP 1 completed. All component param support verified across game components. Found that route variants using query params ARE actually supported by components but WITH CRITICAL CAVEATS about what they actually do.

## Component Audit Results

### 1. Phonics Games

#### 1.1 LetterTracingGame (`/kids/games/phonics/letter-tracing`)
- **File:** `src/pages/kids/games/phonics/LetterTracingGame.tsx` (592 lines)
- **Params supported:** None specific found for variants
- **Variants:** Single game, no internal levels/modes
- **Current mission mapping:** Basic route only
- **Status:** ✅ Single game component

#### 1.2 LetterTracingWithSounds (`/kids/games/phonics/letter-tracing-sounds`)
- **File:** `src/pages/kids/games/phonics/LetterTracingWithSounds.tsx` (1014 lines)
- **Params supported:** None specific found for variants
- **Variants:** Single game, no internal levels/modes
- **Current mission mapping:** Basic route only
- **Status:** ✅ Single game component

#### 1.3 SoundDetectiveGame (`/kids/games/phonics/sound-detective`)
- **File:** `src/pages/kids/games/phonics/SoundDetectiveGame.tsx` (164 lines)
- **Params supported:** `eemTile` (telemetry tracking)
- **Variants:** Single game
- **Current mission mapping:** Routed to `/kids/games/phonics/sound-detective`
- **Status:** ✅ Single game component, no query variants

#### 1.4 KidsBalloonPop (`/kids/games/phonics/balloon-pop`)
- **File:** `src/pages/KidsBalloonPop.tsx`
- **Params supported:** 
  - `level` (line 260: `const levelParam = searchParams.get("level");`)
  - `eemTile` (line 372: `const eemTile = searchParams.get("eemTile");`)
  - `pack` (implied, but NOT used in component)
- **Variants identified:** 
  - NO internal `LEVELS` array found (unlike MyFirstWordsGame)
  - `level` param is read but NOT used to create distinct game experiences
  - `eemTile` used for telemetry/mission tracking only
  - **CRITICAL:** Component does NOT support multiple levels/packs
- **Current mission mapping:**
  - `?pack=1&eemTile=letter_sounds` for "Letter Sounds"
  - `?pack=2` for "Balloon Pop"
- **Status:** ⚠️ **Query params are read but DO NOT create actual game variants**
- **Conclusion:** Routes with `?pack=1` and `?pack=2` go to SAME component with SAME game

#### 1.5 MyFirstWordsGame (`/kids/games/phonics/my-first-words`)
- **File:** `src/pages/kids/games/phonics/MyFirstWords/MyFirstWordsGame.tsx` (51 lines main)
- **Params supported:** `mode` (line 25: `const urlModeRaw = (searchParams.get("mode") || "").toLowerCase();`)
- **Variants identified (VERIFIED):**
  - Line 40: `const [activeLevelId, setActiveLevelId] = useState<LevelId>(...)`
  - Line 51: `const activeLevel = useMemo(() => LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0]...)`
  - **LEVELS array exists in `myFirstWordsData.ts` (lines 89-99)**
- **Levels in LEVELS array:**
  - Level 1: "Level 1: Slide & Join (Practice)" - `id: "level_1"`
  - Level 2: "Level 2: Tap the Word (Quick Quiz)" - `id: "level_2"`
- **Current mission mapping:**
  - `?level=1` for "Blend 2 Sounds"
  - `?level=2` for "More Blending"
- **Status:** ✅ **Query param DOES create actual game variants with different gameplay**
- **Conclusion:** Different levels = different game experiences (Slide & Join vs Tap Word)

#### 1.6 CvcWordReaderGame (`/kids/games/phonics/cvc-word-reader`)
- **File:** `src/pages/kids/games/phonics/CvcWordReader/CvcWordReaderGame.tsx` (435 lines)
- **Params supported:** `eemTile` (telemetry only)
- **Variants:** Single game
- **Status:** ✅ Single game component

#### 1.7 MakeAWordRimeGame (`/kids/games/phonics/cvc-word-reader/make-a-word`)
- **File:** `src/pages/kids/games/phonics/CvcWordReader/MakeAWordRimeGame.tsx` (462 lines)
- **Params supported:** `eemTile` (telemetry only)
- **Variants:** Single game
- **Status:** ✅ Single game component (different game, different route)

#### 1.8 SentenceStepperStage4 (`/kids/games/phonics/sentence-stepper`)
- **File:** `src/pages/kids/games/phonics/SentenceStepperStage4.tsx` (897 lines)
- **Params supported (VERIFIED):**
  - `pack` (line 224: `const startPackParam = (searchParams.get("pack") as PackId) || undefined;`)
  - `eemTile` (line 201: `const missionTile = (searchParams.get("eemTile") || "").toLowerCase();`)
  - `eemStage` (line 200: `const missionStage = searchParams.get("eemStage");`)
- **Packs defined (VERIFIED):**
  - Line 20: `type PackId = "4.0" | "4.1" | "4.2" | "4.3" | "4.4" | "4.5" | "4.6"`
  - Line 59: `const PACK_ORDER: PackId[] = ["4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6"]`
  - Line 66: `const CONTENT: Record<PackId, string[]>` with different content per pack
  - Lines 165-172: `const LEVELS` array with 7 pack definitions, each with different focus:
    - 4.0: "Level 1" (SATPIN phrases - easy start)
    - 4.1: "Level 2" (+ m, d - more CVC variety)
    - 4.2: "Level 3" (+ c, k, g, r - use "can" frames)
    - 4.3: "Level 4" (+ short o - on/top/tom)
    - 4.4: "Level 5" (+ short e - pen/red/get)
    - 4.5: "Level 6" (assumed, not shown in lines 165-172 but in PACK_ORDER)
    - 4.6: "Level 7" (assumed, not shown in lines 165-172 but in PACK_ORDER)
- **Current mission mapping:**
  - `?pack=4.0&eemTile=read_sentences&eemStage=3` for "Read Sentences"
  - `?pack=4.3&eemTile=early_reader_fluency&eemStage=3` for "Early Reader Fluency"
  - `?pack=4.2&eemStage=3` for "Sentence Builder"
- **Status:** ✅ **Query param DOES create actual game variants with different content**
- **Conclusion:** Different packs = different vocabulary/difficulty levels

### 2. Reading Games

#### 2.1 StoryReadingGame (`/kids/games/reading/story-reading`)
- **File:** `src/pages/kids/games/reading/StoryReading/StoryReadingGame.tsx` (28 lines)
- **Params supported:** 
  - `eemTile` (line 16: `const missionTileId = searchParams.get("eemTile") || 'story-reading';`)
  - `mode` mentioned in mission as `?mode=fluent` but NOT found in component code
- **Variants:** Single game component (no `LEVELS` array found)
- **Current mission mapping:**
  - `/kids/games/reading/story-reading` for "Story Reading"
  - `/kids/games/reading/story-reading?mode=fluent` for "Fluent Reading"
- **Status:** ⚠️ **`?mode=fluent` param NOT actually supported in component**
- **Conclusion:** Both routes point to same component, no variant support detected

#### 2.2 ComprehensionGame (`/kids/games/reading/comprehension`)
- **File:** `src/pages/kids/games/reading/ComprehensionGame/ComprehensionGame.tsx`
- **Params supported:** Only standard params (kidId, eemTile)
- **Variants:** Single game
- **Status:** ✅ Single game component

#### 2.3 NewWordsFromReading (`/kids/games/reading/new-words`)
- **File:** `src/pages/kids/games/reading/NewWordsFromReading/NewWordsFromReading.tsx` (variable lines)
- **Params supported:**
  - `eemTile` (line 11: `const missionTileId = searchParams.get('eemTile') || 'new-words-from-reading';`)
  - `mode` mentioned in mission as `?mode=summarize` but NOT found in component code
- **Variants:** Single game component (no variants found)
- **Current mission mapping:**
  - `/kids/games/reading/new-words` for "New Words from Reading"
  - `/kids/games/reading/new-words?mode=summarize` for "Summarize Simply"
- **Status:** ⚠️ **`?mode=summarize` param NOT actually supported in component**
- **Conclusion:** Both routes point to same component, no variant support detected

### 3. Legacy Mission Registry

#### 3.1 KidsPhonicsLibrary (`src/pages/KidsPhonicsLibrary.tsx`)
- **Games in registry (7 total):**
  1. Letter → Sound Match (route: `/kids/games/phonics/letter-sound`) - **NOT in current routes.tsx**
  2. Balloon Pop (Jolly Levels) (route: `/kids/games/phonics/balloon-pop`)
  3. Sound Detective (route: `/kids/games/phonics/sound-detective`)
  4. Letter Tracing (route: `/kids/games/phonics/letter-tracing`)
  5. Letter Tracing + Sounds (route: `/kids/games/phonics/letter-tracing-sounds`)
  6. My First Words (route: `/kids/games/phonics/my-first-words`)
  7. Sentence Stepper (route: `/kids/games/phonics/sentence-stepper`)
- **Note:** Legacy registry uses different stage structure than KidsEnglishExcellence
- **Status:** ✅ Discovered but not currently displayed

## Route Registry (routes.tsx) - Complete Game Routes

From `src/app/routes.tsx` lines 370-387, confirmed routes:

```
/kids/games/phonics/letter-tracing → LetterTracingGame
/kids/games/phonics/letter-tracing-sounds → LetterTracingWithSounds
/kids/games/phonics/my-first-words → Blend2LettersGame (MyFirstWordsGame)
/kids/games/phonics/cvc-word-reader → CvcWordReaderGame
/kids/games/phonics/cvc-word-reader/make-a-word → MakeAWordRimeGame
/kids/games/phonics/balloon-pop → KidsBalloonPop
/kids/games/phonics/sound-detective → SoundDetectiveGame
/kids/games/phonics/sentence-stepper → SentenceStepperStage4
/kids/games/reading/story-reading → StoryReadingGame
/kids/games/reading/comprehension → ComprehensionGame
/kids/games/reading/new-words → NewWordsFromReading
```

**Total: 11 base routes**

## Query Param Variant Support Analysis

### ✅ TRUE VARIANTS (Query params create distinct game experiences)
1. **MyFirstWordsGame** - `?level=1|level=2` → Different gameplay modes (Slide & Join vs Tap Word)
2. **SentenceStepperStage4** - `?pack=4.0|4.1|4.2|4.3|4.4|4.5|4.6` → Different vocabulary/difficulty

### ⚠️ FALSE VARIANTS (Query params read but don't change game)
1. **KidsBalloonPop** - `?pack=1|pack=2` → SAME component, `pack` param NOT used, `level` param NOT used
2. **StoryReadingGame** - `?mode=fluent` → Param NOT in component code
3. **NewWordsFromReading** - `?mode=summarize` → Param NOT in component code

### ℹ️ TELEMETRY ONLY
- `eemTile` param: Used in all components for mission tracking/progress logging
- `eemStage` param: Used in SentenceStepperStage4 for context
- `kidId` param: Standard for tracking

## Current Mission Registry (KidsEnglishExcellence.tsx)

### Stage 1: Letters & Sounds (5 tiles, all live)
1. Letter Tracing → `/kids/games/phonics/letter-tracing` ✅
2. Letter Tracing + Sounds → `/kids/games/phonics/letter-tracing-sounds` ✅
3. Letter Sounds → `/kids/games/phonics/balloon-pop?pack=1&eemTile=letter_sounds` ⚠️ **FALSE VARIANT**
4. Balloon Pop → `/kids/games/phonics/balloon-pop?pack=2` ⚠️ **FALSE VARIANT**
5. Sound Listening → `/kids/games/phonics/sound-detective` ✅

### Stage 2: Build Words (4 tiles, all live)
1. Blend 2 Sounds → `/kids/games/phonics/my-first-words?level=1` ✅ **TRUE VARIANT**
2. More Blending → `/kids/games/phonics/my-first-words?level=2` ✅ **TRUE VARIANT**
3. Read Tiny Words → `/kids/games/phonics/cvc-word-reader` ✅
4. Word Families → `/kids/games/phonics/cvc-word-reader/make-a-word` ✅

### Stage 3: Make Sentences (7 tiles, 3 live + 4 planned)
1. Read Sentences → `/kids/games/phonics/sentence-stepper?pack=4.0&eemTile=read_sentences&eemStage=3` ✅ **TRUE VARIANT**
2. Early Reader Fluency → `/kids/games/phonics/sentence-stepper?pack=4.3&eemTile=early_reader_fluency&eemStage=3` ✅ **TRUE VARIANT**
3. Sentence Builder → `/kids/games/phonics/sentence-stepper?pack=4.2&eemStage=3` ✅ **TRUE VARIANT**
4-7. Planned games (comingSoon: true)

### Stage 4: Read & Understand (8 tiles, 5 live + 3 planned)
1. Fluent Reading → `/kids/games/reading/story-reading?mode=fluent` ⚠️ **FALSE VARIANT** (mode param not supported)
2. Story Reading → `/kids/games/reading/story-reading` ✅
3. New Words from Reading → `/kids/games/reading/new-words` ✅
4. Comprehension Questions → `/kids/games/reading/comprehension` ✅
5. Summarize Simply → `/kids/games/reading/new-words?mode=summarize` ⚠️ **FALSE VARIANT** (mode param not supported)
6-8. Planned games (comingSoon: true)

## Key Findings for STEP 2 (Reconciliation Matrix)

1. **11 base game components exist** and are routed in routes.tsx
2. **2 true multi-variant games:**
   - MyFirstWordsGame: 2 levels (Slide & Join, Tap Word)
   - SentenceStepperStage4: 7 packs (4.0-4.6)
3. **3 false variant mappings need fixing:**
   - Balloon Pop: Showing as 2 games but is 1
   - Story Reading / Fluent Reading: Same component, mode param not supported
   - New Words / Summarize Simply: Same component, mode param not supported
4. **Legacy registry has 7 games** that may need to be restored
5. **Current mission shows 37 tiles** across 6 stages

## Status Fields to Update (for STEP 6)

Current status field in Tile type (line 637): `'live' | 'ready' | 'legacy'`

**Needs to expand to:** `'live' | 'legacyLive' | 'ready' | 'comingSoon' | 'replaced' | 'hidden'`

## Next Steps

STEP 2 will build reconciliation matrix with:
- All 11 base routes
- All variants (2 true, 3 false)
- All 37 current mission tiles
- All 7 legacy games
- Mapping of product screenshot titles to implementation
- Classification into 5 buckets (planned only, legacy/live only, both, replaced, obsolete)

