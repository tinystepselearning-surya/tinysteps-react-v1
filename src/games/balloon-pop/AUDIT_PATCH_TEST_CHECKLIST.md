# Balloon-Pop Phonics - Audit Patch Test Checklist

## Quick Tests (2-3 minutes)

### 1. Audio & Sound Permission
- [ ] **First tap/click**: "Enable Sound" tip appears (top-right)
- [ ] **Dismiss tip**: Click "Got it" → tip disappears
- [ ] **Word TTS**: Click "🔊 Hear Word" → hears word pronounced
- [ ] **Correct beep**: Pop correct balloon → hears success beep
- [ ] **Wrong beep**: Pop wrong balloon → hears error beep
- [ ] **Sound persists**: Refresh page → no tip shows (localStorage flag set)

### 2. Visual Enhancements
- [ ] **Animated sky**: Background gradient shifts hue slowly (pastel colors)
- [ ] **Parallax clouds**: Two cloud layers drift left→right at different speeds
- [ ] **Glossy balloons**: Balloons have highlight shine (top-left white oval)
- [ ] **Balloon knot**: Small dark circle at bottom of each balloon
- [ ] **String**: Gray gradient line extends below each balloon (fades to transparent)

### 3. Rise Speed & Difficulty
- [ ] **Level 1**: Balloons rise slower (~110 px/s, 3 balloons, no sway)
- [ ] **Level 2**: Balloons rise medium speed (~150 px/s, 4 balloons, no sway)
- [ ] **Level 3**: Balloons rise faster (~190 px/s, 5 balloons, horizontal sway visible)
- [ ] **Adaptive slow**: Pop 2 wrong in a row → next round balloons noticeably slower
- [ ] **Adaptive fast**: Get 5+ streak → balloons speed up slightly

### 4. HUD & Progress
- [ ] **Coins animate**: Coins counter increments smoothly (not instant jump)
- [ ] **Coin bounce**: Earning coins → number bounces/scales up briefly
- [ ] **Streak fire**: Get 5+ streak → 🔥 icon appears with "On fire!" text
- [ ] **Accuracy %**: Shows percentage (updates each round)
- [ ] **Progress bar**: Thin bar below HUD fills as balloons rise

### 5. Feedback & Hints
- [ ] **Wrong pop toast**: Click wrong balloon → "Oops! Incorrect" toast (top-right, red, 1.8s)
- [ ] **Balloon shake**: Wrong balloon shakes briefly (rotates left-right)
- [ ] **Minimal-pair hint**: Yellow hint appears below HUD (e.g., "Hint: /æ/ vs /ʌ/") for 3s
- [ ] **Correct toast**: Click correct → "Correct pop! 🎈" toast (green)
- [ ] **Confetti burst**: Correct pop → 20 colorful particles explode from balloon location
- [ ] **ARIA announce**: Screen reader announces "Correct pop!" or "Try again"

### 6. Badges & End Summary
- [ ] **Sharpshooter 🎯**: Pop 10 balloons first-try in a row → badge awarded at end
- [ ] **Quick Popper 🕒**: Pop 5 balloons within 3 seconds each → badge awarded
- [ ] **Wind Tamer 🌪️**: Complete Level 3 with ≥80% accuracy → badge awarded
- [ ] **Tune-Up 🔧**: Complete practice mode with ≥5/6 correct → badge awarded
- [ ] **End summary**: Shows coins earned, best streak, accuracy %, new badges
- [ ] **Practice tricky**: After game, click "Practice Tricky Sounds" → 6 quick rounds with phonemes missed

### 7. Keyboard Accessibility
- [ ] **Arrow Left/Right**: Cycle focus between balloons (yellow ring visible)
- [ ] **Enter/Space**: Pop focused balloon
- [ ] **Tab navigation**: Can tab to "Hear Word" button
- [ ] **64px hit targets**: All balloons are large enough to click easily

### 8. Performance & Stability
- [ ] **Tab switch**: Hide browser tab → balloons pause rising
- [ ] **Tab return**: Return to tab → balloons resume smoothly (no huge jump)
- [ ] **No console errors**: Open DevTools → no errors in console
- [ ] **Memory cleanup**: Complete game → no runaway intervals/rAF (check DevTools Performance)
- [ ] **Smooth 60fps**: Balloons rise smoothly without stuttering

### 9. Edge Cases
- [ ] **Balloon reaches top**: Let balloon escape → round ends, no crash
- [ ] **Multiple wrong pops**: Pop 3+ wrong balloons → hint still shows, game continues
- [ ] **Streak reset**: Get 10 streak, then 1 wrong → streak resets to 0, fire icon gone
- [ ] **Practice mode**: Has 6 rounds, uses tricky phonemes, awards Tune-Up badge

### 10. localStorage Persistence
- [ ] **Coins persist**: Earn coins → refresh page → coins still there
- [ ] **Stats persist**: Complete game → check `balloon-pop-stats-v1` in localStorage (has bestStreak, badges)
- [ ] **Sound flag**: Enable sound → refresh → "Enable Sound" tip doesn't show again

---

## Expected Behavior Summary

| Feature | Expected Result |
|---------|----------------|
| **Sky gradient** | Hue shifts smoothly from blue→purple→pink cycle |
| **Clouds** | Layer 1: 4 clouds (60s drift), Layer 2: 3 clouds (80s drift) |
| **Balloon visuals** | Glossy gradient, white shine, knot, fading string |
| **Rise speeds** | L1: 110px/s, L2: 150px/s, L3: 190px/s |
| **Adaptive** | 2 misses → -15% speed, 5 streak → +10% speed |
| **Audio** | Correct beep, wrong beep, pop sound, word TTS |
| **Toasts** | 1.8s duration, auto-dismiss, red/green colors |
| **Confetti** | 20 particles, 800ms duration, explode in circle |
| **Hints** | Yellow bar, 3s duration, shows minimal-pair phonemes |
| **Keyboard** | Left/Right cycle, Enter/Space pop, Tab to buttons |
| **Visibility API** | Pause on hidden, resume on visible |
| **Badges** | 4 total (Sharpshooter, Quick Popper, Wind Tamer, Tune-Up) |

---

## Regression Checks

- [ ] **Meaning-Match still works**: Navigate to /kids/games/meaning-match → plays normally
- [ ] **SpellBee Flash still works**: Navigate to /kids/games/spellbee-flash → plays normally
- [ ] **Games Gallery**: All 3 games show in gallery with correct badges

---

## Pass Criteria

**All checkboxes checked = Audit patch successful** ✅

If any feature fails:
1. Check browser console for errors
2. Verify localStorage keys exist
3. Test in different browser (Chrome/Firefox/Safari)
4. Check network tab for failed audio requests
