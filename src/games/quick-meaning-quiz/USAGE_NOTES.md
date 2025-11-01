# Quick Meaning Quiz - Usage Notes

## Quick Test (Local Development)

1. **Start dev server:**
   ```bash
   cd ~/Documents/Tinysteps-react-v1/app
   npm run dev
   ```

2. **Navigate to game:**
   Open browser to: `http://localhost:5173/kids/games/quick-meaning`

3. **Quick tests:**
   - Click any option → should show green (correct) or red shake (wrong)
   - Timer bar shrinks → turns yellow at 50%, red at 25%
   - Correct answer → bonus typing screen appears
   - Type word (with 1-letter typo tolerance) → earns bonus coins
   - Complete 10 rounds → see end summary with stats

## Features to Verify

### Adaptive Difficulty
- Pop 2 wrong in a row → next timer extends to 18s
- Get streak ≥5 → timer reduces to 12s

### Scoring
- Base: +2 coins for correct meaning
- Time bonus: +1 if answered ≤7s
- Streak multiplier: +1 at streak ≥3, +2 at ≥5
- Bonus typing: +2 if typed within 6s, +1 within 12s

### Accessibility
- Tab/Arrow keys to navigate options
- Enter/Space to select
- Screen reader announces timer changes
- All buttons have aria-labels

### Parent View
- Shows session accuracy, coins, best streak
- Lists tricky words (missed/slow responses)
- "Copy Summary" button copies plain text report

## Register in App

To make the game accessible from the games gallery:

### 1. Add to Routes.tsx

```typescript
// In src/Routes.tsx
const QuickMeaningGame = lazy(() => import("./games/quick-meaning-quiz"));

// In routes array:
<Route path="/kids/games/quick-meaning" element={<QuickMeaningGame />} />
```

### 2. Add to GamesGallery.tsx

```typescript
// In src/pages/games/GamesGallery.tsx
import { gameMeta as quickMeaningMeta } from "../../games/quick-meaning-quiz";

// In GAME_LIBRARY array:
{
  ...quickMeaningMeta,
  title: "Quick Meaning Quiz",
  description: "Beat the timer—pick the right meaning!",
  ageRange: "Grade 1-2",
  duration: "12 minutes",
  badge: "New!",
},
```

## Data Source

Currently uses shared WORDS from `../spellbee-flash/data.ts` with type adaptation:
- Adds `id` field: `word-{index}-{word}`
- Ensures `forms` is always an array
- Maps all 566 words from shared dataset

No changes needed to data.ts - it's already wired to shared data!

## localStorage Keys

- `spellbee-coins-v1` - Shared coin store (reused from other games)
- `quick-meaning-stats-v1` - Session stats (bestStreak, bestAccuracy, totalPlays, trickyWords)
- `quick-meaning-report-v1` - Latest session report for parent view

## TypeScript Compliance

✅ All files pass TypeScript strict mode
✅ No 'any' types
✅ All timers cleaned up on unmount
✅ Build successful (731.94 kB total bundle)

## Next Steps

1. Test locally with `npm run dev`
2. Register in Routes.tsx and GamesGallery.tsx (see above)
3. Verify all features work:
   - Timer countdown
   - Option selection with feedback
   - Bonus typing with typo tolerance
   - Adaptive difficulty
   - End summary and parent view
4. Commit and push to GitHub
