# STEP 2: Comprehensive Reconciliation Matrix

## Matrix Structure

| Game Title (Screenshot/Live) | Current Mission Title | Route | Component File | Variant Support | Variant Type | Stage | Current Status | Implemented? | Playable Now? | Visible? | Product Expected? | Planned Roadmap? | Legacy/Live? | Issue | Recommendation | Mapped Correctly? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## STAGE 1: Letters & Sounds

### Tile 1: Letter Tracing
| Property | Value |
|---|---|
| Product Title (Screenshot) | Letter Tracing |
| Current Mission Title | Letter Tracing |
| gameId | eem-g00-letter-tracing |
| Route | /kids/games/phonics/letter-tracing |
| Component File | LetterTracingGame.tsx |
| Variant Support | None (single game) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 1) |
| Product Expected? | ✅ Yes (Stage 1 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | None |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 2: Letter Tracing + Sounds
| Property | Value |
|---|---|
| Product Title (Screenshot) | Letter Tracing + Sounds |
| Current Mission Title | Letter Tracing + Sounds |
| gameId | eem-g00b-letter-tracing-sounds |
| Route | /kids/games/phonics/letter-tracing-sounds |
| Component File | LetterTracingWithSounds.tsx |
| Variant Support | None (single game) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 1) |
| Product Expected? | ✅ Yes (Stage 1 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | None |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 3: Letter Sounds
| Property | Value |
|---|---|
| Product Title (Screenshot) | Letter Sounds |
| Current Mission Title | Letter Sounds |
| gameId | eem-g04-letter-sounds |
| Route | /kids/games/phonics/balloon-pop?pack=1&eemTile=letter_sounds |
| Component File | KidsBalloonPop.tsx |
| Variant Support | ❌ FALSE - `pack` param NOT used in component, `level` param NOT used |
| Query Params | pack=1, eemTile=letter_sounds |
| Actual Behavior | Routes to KidsBalloonPop.tsx, same component as "Balloon Pop" tile |
| Current Status | live |
| Implemented? | ⚠️ Partially - component exists but doesn't support pack param |
| Playable Now? | ✅ Yes (but loads same as Balloon Pop) |
| Currently Visible? | ✅ Yes (Stage 1, Tile 3) |
| Product Expected? | ✅ Yes (Stage 1 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (but mapped incorrectly) |
| Issue | ⚠️ **CRITICAL: Query param route (`?pack=1`) does NOT create distinct game experience** |
| Actual Component Behavior | Loads KidsBalloonPop, ignores pack param, `level` param ignored, uses eemTile for telemetry only |
| Mapped Correctly? | ❌ **NO - False variant mapping** |
| Recommendation | **FIX: Create two separate scenarios or verify if "Letter Sounds" and "Balloon Pop" should be same game with different title. For now, mark as legacy mapping and plan refactor.** |

### Tile 4: Balloon Pop
| Property | Value |
|---|---|
| Product Title (Screenshot) | Balloon Pop |
| Current Mission Title | Balloon Pop |
| gameId | eem-g04b-balloon-pop |
| Route | /kids/games/phonics/balloon-pop?pack=2 |
| Component File | KidsBalloonPop.tsx |
| Variant Support | ❌ FALSE - `pack` param NOT used in component |
| Query Params | pack=2 |
| Actual Behavior | Routes to KidsBalloonPop.tsx, same component as "Letter Sounds" tile |
| Current Status | live |
| Implemented? | ⚠️ Partially - component exists but doesn't support pack param |
| Playable Now? | ✅ Yes (but same as Letter Sounds) |
| Currently Visible? | ✅ Yes (Stage 1, Tile 4) |
| Product Expected? | ✅ Yes (Stage 1 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (but mapped incorrectly) |
| Issue | ⚠️ **CRITICAL: Query param route (`?pack=2`) does NOT create distinct game experience. Both routes point to same component.** |
| Actual Component Behavior | Loads KidsBalloonPop, ignores pack param, `level` param ignored, uses eemTile for telemetry only |
| Mapped Correctly? | ❌ **NO - False variant mapping** |
| Recommendation | **FIX: Consolidate both tiles to single route or verify if they should load with different game content. Currently indistinguishable.** |

### Tile 5: Sound Listening
| Property | Value |
|---|---|
| Product Title (Screenshot) | Sound Listening |
| Current Mission Title | Sound Listening |
| gameId | eem-g05-sound-listening |
| Route | /kids/games/phonics/sound-detective |
| Component File | SoundDetectiveGame.tsx |
| Variant Support | None (single game) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 1) |
| Product Expected? | ✅ Yes (Stage 1 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | None |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

---

## STAGE 2: Build Words

### Tile 1: Blend 2 Sounds
| Property | Value |
|---|---|
| Product Title (Screenshot) | Blend 2 Sounds |
| Current Mission Title | Blend 2 Sounds |
| gameId | eem-g06-blend-2-sounds |
| Route | /kids/games/phonics/my-first-words?level=1 |
| Component File | MyFirstWordsGame.tsx |
| Variant Support | ✅ **TRUE - `level=1` creates distinct game** |
| Level 1 Behavior | "Slide & Join (Practice)" - drag bubbles to blend |
| Component Support | ✅ Line 40: `useState<LevelId>()` reads LEVELS array |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 2) |
| Product Expected? | ✅ Yes (Stage 2 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Variant Match | ✅ Line 25 component reads mode param, lines 89-99 LEVELS has 2 levels |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 2: More Blending
| Property | Value |
|---|---|
| Product Title (Screenshot) | More Blending |
| Current Mission Title | More Blending |
| gameId | eem-g06b-more-blending |
| Route | /kids/games/phonics/my-first-words?level=2 |
| Component File | MyFirstWordsGame.tsx |
| Variant Support | ✅ **TRUE - `level=2` creates distinct game** |
| Level 2 Behavior | "Tap the Word (Quick Quiz)" - listen and tap |
| Component Support | ✅ Line 40: `useState<LevelId>()` reads LEVELS array |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 2) |
| Product Expected? | ✅ Yes (Stage 2 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Variant Match | ✅ Component reads level param and applies LEVELS[1] |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 3: Read Tiny Words
| Property | Value |
|---|---|
| Product Title (Screenshot) | Read Tiny Words |
| Current Mission Title | Read Tiny Words |
| gameId | eem-g08b-read-tiny-words |
| Route | /kids/games/phonics/cvc-word-reader |
| Component File | CvcWordReaderGame.tsx |
| Variant Support | None (single game) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 2) |
| Product Expected? | ✅ Yes (Stage 2 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | None |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 4: Word Families
| Property | Value |
|---|---|
| Product Title (Screenshot) | Word Families |
| Current Mission Title | Word Families |
| gameId | eem-g09-word-families |
| Route | /kids/games/phonics/cvc-word-reader/make-a-word |
| Component File | MakeAWordRimeGame.tsx |
| Variant Support | None (single game, different route) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 2) |
| Product Expected? | ✅ Yes (Stage 2 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | None |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

---

## STAGE 3: Make Sentences

### Tile 1: Read Sentences
| Property | Value |
|---|---|
| Product Title (Screenshot) | Read Sentences |
| Current Mission Title | Read Sentences |
| gameId | eem-g12-read-sentences |
| Route | /kids/games/phonics/sentence-stepper?pack=4.0&eemTile=read_sentences&eemStage=3 |
| Component File | SentenceStepperStage4.tsx |
| Variant Support | ✅ **TRUE - `pack=4.0` creates distinct game variant** |
| Pack 4.0 Behavior | "Level 1" - SATPIN phrases (easy start) |
| Component Support | ✅ Line 224: reads pack param, Line 59: PACK_ORDER includes 4.0-4.6, Line 66: CONTENT[PackId] |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 3) |
| Product Expected? | ✅ Yes (Stage 3 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Variant Match | ✅ Component reads pack param, 7 packs defined with different content/focus |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 2: Early Reader Fluency
| Property | Value |
|---|---|
| Product Title (Screenshot) | Early Reader Fluency |
| Current Mission Title | Early Reader Fluency |
| gameId | eem-g12b-early-reader-fluency |
| Route | /kids/games/phonics/sentence-stepper?pack=4.3&eemTile=early_reader_fluency&eemStage=3 |
| Component File | SentenceStepperStage4.tsx |
| Variant Support | ✅ **TRUE - `pack=4.3` creates distinct game variant** |
| Pack 4.3 Behavior | "Level 4" - short o (on/top/tom) |
| Component Support | ✅ Same as Read Sentences |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 3) |
| Product Expected? | ✅ Yes (Stage 3 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Variant Match | ✅ Component reads pack param, pack 4.3 defined with different content/focus |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 3: Sentence Builder
| Property | Value |
|---|---|
| Product Title (Screenshot) | Sentence Builder |
| Current Mission Title | Sentence Builder |
| gameId | eem-g13-fill-the-blank |
| Route | /kids/games/phonics/sentence-stepper?pack=4.2&eemStage=3 |
| Component File | SentenceStepperStage4.tsx |
| Variant Support | ✅ **TRUE - `pack=4.2` creates distinct game variant** |
| Pack 4.2 Behavior | "Level 3" - c, k, g, r (use "can" frames) |
| Component Support | ✅ Same as Read Sentences |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 3) |
| Product Expected? | ✅ Yes (Stage 3 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Variant Match | ✅ Component reads pack param, pack 4.2 defined with different content/focus |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tiles 4-7: Planned Games
- Grammar Fix (comingSoon: true)
- Better Sentences (comingSoon: true)
- Collocation Builder (comingSoon: true)
- Idiom in a Sentence (comingSoon: true)

| Property | All Planned Games |
|---|---|
| Status | comingSoon: true |
| Implemented? | ❌ No components found |
| Playable Now? | ❌ No |
| Currently Visible? | ✅ Yes (but disabled) |
| Product Expected? | ✅ Yes (screenshot shows Grammar Fix + Better Sentences) |
| Planned Roadmap? | ✅ Yes (planned only) |
| Issue | None - planned as-is |
| Recommendation | Keep as planned roadmap. No code needed yet. Status: comingSoon ✅ |

---

## STAGE 4: Read & Understand

### Tile 1: Fluent Reading
| Property | Value |
|---|---|
| Product Title (Screenshot) | Fluent Reading |
| Current Mission Title | Fluent Reading |
| gameId | eem-g18-fluent-reading |
| Route | /kids/games/reading/story-reading?mode=fluent |
| Component File | StoryReadingGame.tsx |
| Variant Support | ❌ **FALSE - `mode=fluent` param NOT in component** |
| Current Status | live |
| Implemented? | ⚠️ Partially - component exists but mode param not supported |
| Playable Now? | ✅ Yes (but loads same as Story Reading) |
| Currently Visible? | ✅ Yes (Stage 4) |
| Product Expected? | ✅ Yes (Stage 4 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (but mapped incorrectly) |
| Issue | ⚠️ **CRITICAL: Query param route (`?mode=fluent`) does NOT exist in component code** |
| Component Analysis | Line 16 only reads eemTile, no mode param found |
| Actual Behavior | Ignores mode param, loads base StoryReadingGame |
| Mapped Correctly? | ❌ **NO - False variant mapping** |
| Recommendation | **FIX: Either (a) implement `mode=fluent` support in component, OR (b) consolidate to single Story Reading route, OR (c) mark as separate planned game.** |

### Tile 2: Story Reading
| Property | Value |
|---|---|
| Product Title (Screenshot) | Story Reading |
| Current Mission Title | Story Reading |
| gameId | eem-g18b-story-reading |
| Route | /kids/games/reading/story-reading |
| Component File | StoryReadingGame.tsx |
| Variant Support | None (single route) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 4) |
| Product Expected? | ✅ Yes (Stage 4 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | Shares component with "Fluent Reading" (false variant) |
| Mapped Correctly? | ✅ Base route yes, but variant situation needs fixing |
| Recommendation | Keep this. Fix Fluent Reading issue separately. Status: live ✅ |

### Tile 3: New Words from Reading
| Property | Value |
|---|---|
| Product Title (Screenshot) | New Words from Reading |
| Current Mission Title | New Words from Reading |
| gameId | eem-g20-new-words-from-reading |
| Route | /kids/games/reading/new-words |
| Component File | NewWordsFromReading.tsx |
| Variant Support | None (single route) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 4) |
| Product Expected? | ✅ Yes (Stage 4 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | Shares component with "Summarize Simply" (false variant) |
| Mapped Correctly? | ✅ Base route yes, but variant situation needs fixing |
| Recommendation | Keep this. Fix Summarize Simply issue separately. Status: live ✅ |

### Tile 4: Comprehension Questions
| Property | Value |
|---|---|
| Product Title (Screenshot) | Comprehension Questions |
| Current Mission Title | Comprehension Questions |
| gameId | eem-g19-comprehension-questions |
| Route | /kids/games/reading/comprehension |
| Component File | ComprehensionGame.tsx |
| Variant Support | None (single game) |
| Current Status | live |
| Implemented? | ✅ Yes |
| Playable Now? | ✅ Yes |
| Currently Visible? | ✅ Yes (Stage 4) |
| Product Expected? | ✅ Yes (Stage 4 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (existing) |
| Issue | None |
| Mapped Correctly? | ✅ Yes |
| Recommendation | Keep as-is. Status: live ✅ |

### Tile 5: Summarize Simply
| Property | Value |
|---|---|
| Product Title (Screenshot) | Summarize Simply |
| Current Mission Title | Summarize Simply |
| gameId | eem-g20b-summarize-simply |
| Route | /kids/games/reading/new-words?mode=summarize |
| Component File | NewWordsFromReading.tsx |
| Variant Support | ❌ **FALSE - `mode=summarize` param NOT in component** |
| Current Status | live |
| Implemented? | ⚠️ Partially - component exists but mode param not supported |
| Playable Now? | ✅ Yes (but loads same as New Words) |
| Currently Visible? | ✅ Yes (Stage 4) |
| Product Expected? | ✅ Yes (Stage 4 screenshot) |
| Planned Roadmap? | ❌ No (existing playable game) |
| Legacy/Live? | ✅ Live (but mapped incorrectly) |
| Issue | ⚠️ **CRITICAL: Query param route (`?mode=summarize`) does NOT exist in component code** |
| Component Analysis | Line 11 only reads eemTile, no mode param found |
| Actual Behavior | Ignores mode param, loads base NewWordsFromReading |
| Mapped Correctly? | ❌ **NO - False variant mapping** |
| Recommendation | **FIX: Either (a) implement `mode=summarize` support in component, OR (b) consolidate to single New Words route, OR (c) mark as separate planned game.** |

### Tiles 6-8: Planned Games
- Meaning from Context (comingSoon: true)
- Synonym & Antonym Hunt (comingSoon: true)
- Crossword from Reading (comingSoon: true)

| Property | All Planned Games |
|---|---|
| Status | comingSoon: true |
| Implemented? | ❌ No components found |
| Playable Now? | ❌ No |
| Currently Visible? | ✅ Yes (but disabled) |
| Product Expected? | ✅ Yes (Stage 4 screenshot) |
| Planned Roadmap? | ✅ Yes (planned only) |
| Issue | None - planned as-is |
| Recommendation | Keep as planned roadmap. No code needed yet. Status: comingSoon ✅ |

---

## STAGE 5 & 6: Speaking & Review (All Planned)

All 10 tiles in Stages 5-6 have `comingSoon: true` with no routes.
- Status: ✅ Planned roadmap kept as-is
- Recommendation: Keep as-is until implementation begins

---

## Legacy Games Not Currently in KidsEnglishExcellence

From `src/pages/KidsPhonicsLibrary.tsx`:

1. **Letter → Sound Match**
   - Route: `/kids/games/phonics/letter-sound` ⚠️ **NOT in current routes.tsx**
   - Status: Orphaned (not in any mission, not routed)
   
2. **Sentence Stepper** (legacy version)
   - Route: `/kids/games/phonics/sentence-stepper`
   - Status: Now using SentenceStepperStage4 (same route) ✅
   
3. (Other games in legacy registry are covered by current routes)

---

## Summary of Issues Found

### Critical Issues (Require Fixing)

1. **FALSE VARIANT #1: Balloon Pop / Letter Sounds**
   - Routes: `/balloon-pop?pack=1` vs `/balloon-pop?pack=2`
   - Both route to same component
   - pack param NOT used in component
   - **2 tiles map to identical gameplay**

2. **FALSE VARIANT #2: Fluent Reading**
   - Route: `/story-reading?mode=fluent`
   - mode param NOT in component code
   - Routes to base Story Reading game
   - **Tile claims unique game but loads same as Story Reading**

3. **FALSE VARIANT #3: Summarize Simply**
   - Route: `/new-words?mode=summarize`
   - mode param NOT in component code
   - Routes to base NewWordsFromReading game
   - **Tile claims unique game but loads same as New Words**

### Inventory Issues

1. **Orphaned Route: Letter → Sound Match**
   - Route `/kids/games/phonics/letter-sound` exists in legacy registry
   - NOT routed in current routes.tsx
   - Component file may be missing

2. **Unmapped Legacy Games**
   - 7 games exist in KidsPhonicsLibrary
   - Only 4 are directly referenced in KidsEnglishExcellence current tiles
   - Should evaluate if legacy games should be restored with legacyLive status

### Correct Mappings (✅ No Issues)

- **Stage 1 (minus false variants):** 3/5 tiles correct (Letter Tracing, Letter Tracing + Sounds, Sound Listening)
- **Stage 2:** 4/4 tiles correct
- **Stage 3 (live only):** 3/3 tiles correct
- **Stage 4 (minus false variants):** 2/5 tiles correct (Story Reading, Comprehension Questions)
- **Planned tiles:** All kept correctly

---

## Matrix Next Steps

STEP 3 will classify all 37 tiles + 7 legacy games into 5 buckets based on this matrix.

