# SpellBee Flash Trainer - Feature Testing Guide

## 🚀 Quick Start

1. **Start Dev Server**:
   ```bash
   cd /Users/ravalipriya/Documents/Tinysteps-react-v1/app
   npm run dev
   ```
   Server runs on: `http://localhost:5174`

2. **Navigate to Game**:
   - Home → Games Gallery → SpellBee Flash Trainer
   - Or direct: `http://localhost:5174/games/spellbee-flash`

3. **Clear LocalStorage** (for fresh testing):
   ```javascript
   // In browser console
   localStorage.clear();
   ```

---

## ✅ Feature 1: Parent Report Testing

### Setup
1. Play a full game session (complete all 10 words)
2. Note: Session tracks mastered words, tricky phonemes, coins earned

### Test Cases

#### TC1: Generate Report
- **Action**: Click "📊 Parent View" button on summary screen
- **Expected**:
  - Blue/indigo gradient panel appears
  - Shows 4 stat boxes (accuracy, attempted, streak, coins)
  - Displays up to 8 mastered words as chips
  - Shows top 3 tricky phonemes with labels
  - Displays practice tip based on weakest phoneme

#### TC2: Copy Report
- **Action**: Click "📋 Copy Report" button
- **Expected**:
  - Green toast appears: "✅ Copied to clipboard!"
  - Toast disappears after 2 seconds
  - Paste clipboard → see formatted plain text report

#### TC3: Report Persistence
- **Action**: Refresh page → click "Parent View" again
- **Expected**:
  - Same report data loads from localStorage
  - No re-computation needed

#### TC4: Phoneme Labels
- **Action**: Review tricky phonemes section
- **Expected**:
  - IPA symbols show kid-friendly labels:
    - `/æ/` → "short a"
    - `/iː/` → "long e"
    - `/ɪ/` → "short i"
    - etc.

### Sample Report Format
```
📊 SpellBee Session Report
Date: Jan 1, 2025, 3:45 PM

✅ Session Stats:
• Accuracy: 90%
• Attempted: 20 questions
• Best Streak: 7
• Coins Earned: 45

🌟 Mastered Today:
cat, dog, run, sun

🎯 Tricky Phonemes:
1. /æ/ (short a) - 3 wrong out of 5

💡 Practice Tip:
Focus on short 'a' sound (/æ/) - words like "cat", "hat", "mat"

Keep up the great work! 🎉
```

---

## ✅ Feature 2: Daily Quests Testing

### Setup
1. Start new game session
2. Quests panel appears in top-left corner
3. 2 random quests from pool of 6

### Test Cases

#### TC5: Quest Display
- **Action**: Game loads
- **Expected**:
  - Quests panel visible in top-left (purple/pink gradient)
  - Shows 2 quests with icons and titles
  - Progress bars show 0/target initially
  - Can expand/collapse panel with chevron button

#### TC6: Coins Quest
- **Quest**: "🪙 Earn 25 coins"
- **Action**: Earn coins by answering correctly
- **Expected**:
  - Progress bar updates: "15/25", "20/25", "25/25"
  - Green checkmark appears when done
  - Quest celebration toast shows: "🪙 Quest Complete!"

#### TC7: Streak Quest
- **Quest**: "🔥 Get 5-streak"
- **Action**: Answer 5 questions correctly in a row
- **Expected**:
  - Progress updates each correct answer: "1/5", "2/5", ..., "5/5"
  - Quest completes on 5th streak
  - Celebration appears

#### TC8: Speed Quest
- **Quest**: "⚡ Win 2 speed rounds"
- **Action**: Complete speed rounds (every 5th word) within 10 seconds
- **Expected**:
  - Progress updates: "1/2" after first win
  - Progress updates: "2/2" after second win
  - Quest completes

#### TC9: IPA Quest
- **Quest**: "🎵 Perfect IPA 3 times"
- **Action**: Answer IPA MCQ correctly
- **Expected**:
  - Progress updates: "1/3", "2/3", "3/3"
  - Quest completes on 3rd correct IPA

#### TC10: Mastery Quest
- **Quest**: "🌟 Master 3 words"
- **Action**: Answer both meaning + IPA correctly for same word 3+ times
- **Expected**:
  - Progress updates when word enters mastered bucket
  - Quest completes after 3 masteries

#### TC11: Fix-Up Quest
- **Quest**: "🩹 Complete Fix-Up mode"
- **Action**: Make mistakes → complete fix-up session
- **Expected**:
  - Progress updates: "0/1" → "1/1" when fix-up ends
  - Quest completes

#### TC12: Daily Refresh
- **Action**: 
  1. Note current quests
  2. Change system date to tomorrow
  3. Refresh page
- **Expected**:
  - New set of 2 quests generated
  - Previous progress reset
  - New date saved to localStorage

#### TC13: Quest Persistence
- **Action**: Earn progress → refresh page → continue
- **Expected**:
  - Quest progress persists (same date)
  - Can continue from previous progress

---

## ✅ Feature 3: Sticker Sheet Testing

### Setup
1. Complete game session (earn coins)
2. Click "🎉 My Stickers (0/12)" button on summary

### Test Cases

#### TC14: Modal Open
- **Action**: Click sticker button
- **Expected**:
  - Full-screen modal appears
  - Left pane: 12 stickers in 3x4 grid (shop)
  - Right pane: Sticker selector + 4x3 placement grid
  - Coin display shows current total

#### TC15: Purchase with Insufficient Coins
- **Setup**: Have <10 coins
- **Action**: Click any sticker in shop
- **Expected**:
  - Red error toast: "Not enough coins!"
  - No purchase occurs
  - Coins unchanged

#### TC16: Purchase Success
- **Setup**: Have 10+ coins
- **Action**: Click sticker in shop (e.g., 🌟)
- **Expected**:
  - Coins deduct by 10 (125 → 115)
  - Sticker border turns green
  - "✓ Owned" label appears
  - Sticker appears in owned selector

#### TC17: Duplicate Purchase Blocked
- **Action**: Click already-owned sticker
- **Expected**:
  - Error toast: "Already owned!"
  - No coin deduction

#### TC18: Sticker Selection
- **Action**: Click owned sticker in selector
- **Expected**:
  - Purple highlight + ring-4 ring-purple-500
  - Empty grid slots show "➕"

#### TC19: Place Sticker
- **Action**: Select sticker → click empty grid slot
- **Expected**:
  - Sticker appears in slot
  - Selection cleared (no more purple highlight)
  - "➕" disappears from empty slots

#### TC20: Remove Sticker
- **Action**: Click filled grid slot
- **Expected**:
  - Sticker removed from grid
  - Slot becomes empty (shows "➕" when next sticker selected)
  - Sticker still owned (remains in selector)

#### TC21: Grid Persistence
- **Action**: Place 3 stickers → close modal → reopen
- **Expected**:
  - Placed stickers remain in same grid positions
  - Owned stickers persist in selector

#### TC22: Button Counter
- **Action**: Purchase 5 stickers
- **Expected**:
  - Button text updates: "(0/12)" → "(5/12)"
  - Shows owned count accurately

#### TC23: Fill Grid
- **Action**: Purchase all 12 stickers → place in grid
- **Expected**:
  - All 12 slots filled
  - Button shows "(12/12)"
  - Shop shows all stickers as "✓ Owned"

---

## 🔄 Integration Testing

### IT1: Full Session Flow
1. Start game → verify 2 quests load
2. Play 10 words → verify quest progress updates
3. Earn 30+ coins → verify coins quest completes
4. Get 5-streak → verify streak quest completes
5. Complete game → verify summary shows correct stats
6. View parent report → verify mastered words listed
7. Purchase 3 stickers → verify coins deduct
8. Place stickers on grid → verify persistence
9. Play again → verify quests persist (same day)

### IT2: Cross-Feature Coins
1. Start with 0 coins
2. Earn 50 coins in game
3. Complete "coins_25" quest → verify celebration
4. Open stickers → verify shows 50 coins
5. Purchase 2 stickers (20 coins)
6. Verify coins now 30 in summary
7. Play again → verify starts with 30 coins

### IT3: LocalStorage Integrity
1. Play full session with all features
2. Check localStorage keys:
   ```javascript
   console.log(localStorage.getItem("spellbee-quests-v1"));
   console.log(localStorage.getItem("spellbee-report-v1"));
   console.log(localStorage.getItem("spellbee-stickers-v1"));
   console.log(localStorage.getItem("spellbee-coins-v1"));
   ```
3. Verify all data saved correctly
4. Refresh page → verify all state restored

---

## 🐛 Edge Cases & Error Handling

### EC1: Quest Completion Conflicts
- **Scenario**: Complete 2 quests simultaneously
- **Expected**: Both celebrations appear (staggered 3s apart)

### EC2: Negative Coins
- **Scenario**: Manual localStorage edit to negative coins
- **Expected**: Purchase blocked, error shown

### EC3: Invalid Sticker Data
- **Scenario**: Corrupt `spellbee-stickers-v1` data
- **Expected**: Falls back to empty state, console warning

### EC4: Quest Date Mismatch
- **Scenario**: Date changes mid-session
- **Expected**: Quests persist until page refresh

### EC5: Parent Report with 0 Words
- **Scenario**: Exit game before completing any words
- **Expected**: Report shows 0 data, no crash

---

## 📱 Responsive Testing

### Mobile (375px width)
- [ ] Quests panel readable (consider auto-collapse)
- [ ] Parent report stats grid stacks vertically
- [ ] Sticker modal scrollable
- [ ] All buttons tap-friendly (44px min)

### Tablet (768px width)
- [ ] Quests panel stays left-aligned
- [ ] Sticker shop/grid side-by-side
- [ ] Parent report 2x2 stats grid

### Desktop (1920px width)
- [ ] No excessive whitespace
- [ ] Quests panel doesn't cover main content
- [ ] Sticker modal centered, max-width 6xl

---

## ⚡ Performance Testing

### Load Time
- [ ] Initial quest load <100ms
- [ ] Parent report build <200ms
- [ ] Sticker modal open <100ms

### Memory
- [ ] No memory leaks from quest timers
- [ ] Celebration timers cleaned up after 3s
- [ ] No duplicate localStorage writes

### LocalStorage Size
- [ ] Total usage <1MB (well under 5-10MB limit)
- [ ] JSON.parse/stringify errors handled

---

## 🔍 Browser Console Checks

### No Errors
```javascript
// Should see no errors in console during:
// 1. Game start
// 2. Quest updates
// 3. Parent report generation
// 4. Sticker purchases
// 5. Modal open/close
```

### Expected Warnings (Harmless)
```
// If data doesn't exist yet:
"Failed to load quests: [error]"
"Failed to load stickers: [error]"
```

---

## 🎯 Acceptance Criteria

All features considered **PASSED** when:

### Parent Report
- ✅ Displays on summary screen
- ✅ Shows accurate session stats
- ✅ Lists mastered words correctly
- ✅ Identifies tricky phonemes
- ✅ Generates practice tip
- ✅ Copies to clipboard
- ✅ Persists across refreshes

### Daily Quests
- ✅ 2 quests appear on game start
- ✅ All 6 quest types update correctly
- ✅ Celebration appears on completion
- ✅ Re-rolls on new day
- ✅ Persists same-day progress
- ✅ No duplicate updates

### Sticker Sheet
- ✅ All 12 stickers purchasable
- ✅ Coin deduction works
- ✅ Purchase guards prevent errors
- ✅ Grid placement/removal works
- ✅ State persists across sessions
- ✅ Button counter accurate

### Integration
- ✅ No feature conflicts
- ✅ Coins sync across features
- ✅ All localStorage keys valid
- ✅ No runtime errors
- ✅ Build succeeds
- ✅ Mobile responsive

---

## 📝 Bug Reporting Template

```markdown
**Bug Title**: [Short description]

**Feature**: Parent Report | Daily Quests | Sticker Sheet

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**: 

**Actual Behavior**: 

**Browser**: Chrome/Safari/Firefox [version]
**Screen Size**: Mobile/Tablet/Desktop
**Console Errors**: [paste errors]
**LocalStorage State**: [paste relevant keys]
```

---

## 🚀 Deployment Checklist

Before production:
- [ ] All test cases pass
- [ ] No console errors
- [ ] Build succeeds (`npm run build`)
- [ ] Bundle size acceptable (<1MB)
- [ ] LocalStorage guards in place
- [ ] TypeScript strict mode passes
- [ ] Mobile tested (real device)
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Accessibility audit (screen reader, keyboard nav)
- [ ] Performance profiling (no memory leaks)

---

Happy testing! 🎉
