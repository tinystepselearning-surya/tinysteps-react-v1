# Boss Level: Phonics Gauntlet - Usage Notes

## Overview
A 12-round capstone game mixing all skills: Meaning MCQ, Ear-Training, Speed Rounds, Balloon-Pop, Drag-Drop, and Fix-Up rounds. Designed for 6-7 year olds with adaptive difficulty, badges, and parent reporting.

## Architecture

### State Machine (BossLevel.tsx)
- **Phases**: `intro → flash → ear → speed → pop → drag → flash → ear → speed → pop → drag → fixup → fixup → summary`
- **12 Rounds Total**: Mix of 6 different mini-games
- **Adaptive Difficulty**: Adjusts timer, distractors, and balloon speed based on streak and wrong streak
- **Persistence**: Coins, mastery, phonemes, boss stats, session reports

### Mini-Rounds (rounds.tsx)
1. **FlashMCQ**: 1 word → 4 meaning options (smart distractors)
2. **EarTraining**: Audio → IPA selection (minimal-pair hints on wrong)
3. **SpeedMeaning**: 10s timer → meaning MCQ (tiered coin bonus)
4. **BalloonPopLite**: 3-4 balloons with IPA, rAF rise, pop correct one
5. **DragDropLite**: 2 words → drag to meaning + IPA (hint after 2 wrongs)
6. **FixupLite**: Weakest word from session → quick MCQ

### Scoring & Badges
- **Base Coins**: +2 per correct
- **Speed Bonuses**: +3 (≤4s), +1 (≤10s)
- **Streak Bonuses**: +1 (≥3), +2 (≥5)
- **Ear-Training Bonus**: +5 (first try, no hints)

**Badges**:
- 🏁 Gauntlet Clear (finish all 12)
- 🎯 No-Help Hero (no hints)
- 🔥 Streak Beast (streak ≥8)
- 👂 Phoneme Pro (≥80% on ear tasks)
- 💨 Speed Ace (≥6 speed bonuses)

**Special Unlock**: 🐝 Gold Bee sticker on first clear

## Data Integration

### Current Setup
Using 24 sample words in `data.ts` for development.

### TODO: Wire to Shared WORDS
To use the shared 566-word dataset from `spellbee-flash`:

```typescript
// data.ts
import { WORDS as SHARED_WORDS } from "../spellbee-flash/data";

export interface WordEntry {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  forms: string[];
}

export const WORDS: WordEntry[] = SHARED_WORDS.map((w, idx) => ({
  id: `word-${idx}-${w.word}`,
  word: w.word,
  ipa: w.ipa,
  meaning: w.meaning,
  example: w.example,
  forms: Array.isArray(w.forms) ? w.forms : [],
}));
```

## Persistence Keys

### Shared Keys (from other games)
- `spellbee-coins-v1`: Global coin balance
- `spellbee-mastery-v1`: SRS buckets per word
- `spellbee-phonemes-v1`: Phoneme error tracking
- `spellbee-report-v1`: Last session report (parent view)
- `spellbee-stickers-v1`: Unlocked stickers

### Boss-Specific Keys
- `boss-level-stats-v1`: `{ bestAccuracy, bestStreak, clears, lastPlayed }`

## Testing

### Manual Test Checklist

#### Core Flow
- [ ] Intro screen shows correctly with title and "Start Gauntlet" button
- [ ] All 12 rounds execute in order (flash, ear, speed, pop, drag, flash, ear, speed, pop, drag, fixup, fixup)
- [ ] HUD displays: coins, streak, round X/12, accuracy %
- [ ] Summary screen shows after round 12

#### Coins & Scoring
- [ ] Coins increase on correct answers
- [ ] Speed bonuses awarded (≤4s: +3, ≤10s: +1)
- [ ] Streak bonuses awarded (≥3: +1, ≥5: +2)
- [ ] Ear-training bonus +5 on first try
- [ ] Coins persist across sessions (check localStorage)

#### Badges
- [ ] "Gauntlet Clear" badge always awarded
- [ ] "No-Help Hero" awarded if no hints used
- [ ] "Streak Beast" awarded if streak ≥8
- [ ] "Phoneme Pro" awarded if ear accuracy ≥80%
- [ ] "Speed Ace" awarded if ≥6 speed bonuses

#### Mini-Rounds
- [ ] **FlashMCQ**: 4 options, correct turns green, wrong turns red
- [ ] **EarTraining**: IPA hidden until play button clicked, minimal-pair hint on wrong
- [ ] **SpeedMeaning**: Timer counts down, auto-fails at 0
- [ ] **BalloonPopLite**: Balloons rise smoothly, correct pop shows confetti
- [ ] **DragDropLite**: Drag word to meaning/IPA, hint after 2 wrongs
- [ ] **FixupLite**: Shows tricky word with special 🔧 header

#### Adaptive Difficulty
- [ ] After 2 wrong in a row: timer extends to 15s, balloons slower
- [ ] After streak ≥5: timer tightens to 7s, balloons faster

#### Fix-Up Rounds (11-12)
- [ ] Pick weakest words from session (wrong + slow + hints)
- [ ] Display word with IPA before MCQ

#### Parent View
- [ ] "Parent Report" button shows detailed stats
- [ ] Session summary: date, time, accuracy, streak, hints
- [ ] Strengths listed (ear-training, speed, no hints, accuracy)
- [ ] Tricky phonemes shown (top 3)
- [ ] "Copy Summary" copies to clipboard
- [ ] "Share" button works (if navigator.share exists)

#### Accessibility
- [ ] All buttons ≥64px touch targets
- [ ] aria-live announcements on correct/wrong
- [ ] Keyboard navigation works (Tab + Enter)
- [ ] Screen reader reads options and feedback

#### Memory Safety
- [ ] No timers leak (check console on unmount)
- [ ] rAF cleaned up in BalloonPopLite
- [ ] localStorage writes debounced (no jank)

#### Mobile & Touch
- [ ] Drag-drop works on touch devices
- [ ] Balloon-pop touch targets responsive
- [ ] Buttons don't shrink below 64px

### Quick Test (2 minutes)
1. Start gauntlet
2. Complete 3-4 rounds (mix of flash, ear, speed)
3. Check HUD updates (coins, streak, round)
4. Check localStorage: `spellbee-coins-v1`, `boss-level-stats-v1`
5. Force-complete to summary (manually set roundIndex=12)
6. Verify badges, parent view, copy button

## Build & Deploy

### Build
```bash
cd app
npm run build
```

### Register in App
1. **Routes.tsx**: Add lazy import and route
   ```typescript
   const BossLevelGame = lazy(() => import("./games/boss-level"));
   
   <Route 
     path="/kids/games/boss-level" 
     element={
       <Suspense fallback={<div className="p-6">Loading game…</div>}>
         <BossLevelGame />
       </Suspense>
     } 
   />
   ```

2. **GamesGallery.tsx**: Add card
   ```typescript
   import { gameMeta as bossLevelMeta } from "../../games/boss-level";
   
   {
     id: bossLevelMeta.slug,
     title: bossLevelMeta.title,
     level: "Grade 1-2",
     duration: "7 mins",
     description: bossLevelMeta.description,
     badge: "Boss!",
     launchHref: `/kids/games/${bossLevelMeta.slug}`,
     launchLabel: "Play"
   }
   ```

### Commit
```bash
git add src/games/boss-level/
git commit -m "feat(games): add Boss Level (Phonics Gauntlet)

- 12-round capstone mixing flash, ear, speed, pop, drag, fixup
- Adaptive difficulty based on streak/wrong streak
- 5 badges: Gauntlet Clear, No-Help Hero, Streak Beast, Phoneme Pro, Speed Ace
- Gold Bee sticker unlock on first clear
- Parent report with session stats and tricky phonemes
- Full keyboard + screen reader accessible
- Memory-safe (timers/rAF cleanup)
- Uses 24 sample words (TODO: wire to shared WORDS)

Files: BossLevel.tsx, rounds.tsx, HUD.tsx, EndSummary.tsx, confetti.tsx, utils.ts, data.ts, index.tsx"
```

## Known Limitations
- Currently uses 24 sample words (not wired to shared 566-word dataset)
- Navigator.share may not work on all browsers (feature-detected)
- Balloon-Pop simplified (no multi-level system like full game)
- Drag-Drop HTML5 API may not work on all mobile browsers (consider touch events)

## Future Enhancements
- Wire data.ts to shared WORDS from spellbee-flash
- Add sound effects (pop, ding, timer beep)
- Leaderboard for weekly boss clears
- "Practice Tricky Words" mini-mode (3-round fixup)
- Export parent report as PDF
