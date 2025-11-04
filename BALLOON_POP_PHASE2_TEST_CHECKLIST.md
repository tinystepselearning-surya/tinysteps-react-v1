# Balloon Pop Phase 2 - Manual Test Checklist

## Pre-Testing Setup
- [ ] Build successful (`npm run build`)
- [ ] All automated tests passing (`npm test` - 58/58)
- [ ] Development server running (`npm run dev`)

## Basic Functionality Tests

### Level p2-bp-01 (SAT Letters)
**URL**: `/games/balloon-pop-ipa?set=sat&n=3&speed=slow&adaptive=1&levelId=p2-bp-01`

- [ ] **Page loads without errors**
  - Check browser console for errors
  - Verify 3 balloons appear on screen
  - Verify sky gradient background

- [ ] **Sound plays automatically**
  - Should hear phoneme sound (s, a, or t)
  - Sound quality is clear
  - Correct phoneme pronunciation

- [ ] **Listen button works**
  - Click 🎧 Listen button
  - Sound repeats correctly
  - No overlapping sounds

- [ ] **Correct balloon selection**
  - Click balloon matching the sound
  - Confetti appears at balloon position
  - "Correct! 🎉" message displays
  - Progress counter increases (X/8)
  - New round starts after 1.5 seconds

- [ ] **Wrong balloon selection**
  - Click wrong balloon
  - Balloon shakes
  - "Try again" message shows
  - Error counter increases
  - Wrong balloon becomes semi-transparent
  - Can still click correct balloon

- [ ] **Glow hint after 3 mistakes**
  - Make 3 wrong clicks in same round
  - Correct balloon should pulse with yellow glow
  - Ring animation visible

- [ ] **Completion flow**
  - Complete 8 correct selections
  - Final message appears
  - Redirects to Phonics hub after 2 seconds
  - Check localStorage for progress saved

### Level p2-bp-02 (PIN Letters)
**URL**: `/games/balloon-pop-ipa?set=pin&n=3&speed=slow&adaptive=1&levelId=p2-bp-02`

- [ ] **Different graphemes displayed**
  - Balloons show p, i, n (not s, a, t)
  - Sounds match PIN phonemes

- [ ] **All basic tests pass** (same as p2-bp-01)

## Advanced Tests

### Adaptive Difficulty
**Start with**: `?set=sat&n=3&speed=slow&adaptive=1`

- [ ] **Difficulty increases on streaks**
  - Get 3 correct in a row on same letter (e.g., 's')
  - Balloon count should increase to 4
  - Check n value updates in debug mode

- [ ] **Difficulty decreases on errors**
  - Get 2 wrong in a row on same letter
  - Balloon count should reset to 3
  - Speed should slow down

- [ ] **Non-adaptive mode works**
  - Test with `adaptive=0`
  - Difficulty should stay constant throughout

### Different Balloon Counts
- [ ] **3 balloons**: `?set=sat&n=3`
- [ ] **4 balloons**: `?set=sat&n=4`
- [ ] **5 balloons**: `?set=sat&n=5`
- [ ] **6 balloons**: `?set=sat&n=6`

### Different Speeds
- [ ] **Slow (8s)**: `?set=sat&speed=slow`
  - Balloons rise slowly
  - Easier to click

- [ ] **Medium (6s)**: `?set=sat&speed=med`
  - Moderate rise speed

- [ ] **Fast (4s)**: `?set=sat&speed=fast`
  - Balloons rise quickly
  - More challenging

### Grapheme Sets
- [ ] **SAT**: `?set=sat` → only s, a, t
- [ ] **PIN**: `?set=pin` → only p, i, n
- [ ] **SATPIN**: `?set=satpin` → all 6 letters
- [ ] **Mixed**: `?set=mixed` → extended set

### Debug Mode
**URL**: `?set=sat&debug=1`

- [ ] **Target grapheme shown**
  - Small badge displays current target letter
  - Position: top-center of screen
  - Helps verify correct game logic

## Progress & Navigation Tests

### Progress Tracking
- [ ] **localStorage saved after completion**
  - Open DevTools → Application → Local Storage
  - Check `PSM_PROGRESS` key
  - Verify entry: `{"p2-bp-01": {"completed": true, "stars": X}}`

- [ ] **Star calculation correct**
  - 0-1 errors → 3 stars
  - 2-3 errors → 2 stars
  - 4+ errors → 1 star

- [ ] **Last played level saved**
  - Check `PSM_META` in localStorage
  - Verify `{"lastPlayedLevel": "p2-bp-01"}`

### Navigation
- [ ] **Back button works**
  - Click "← Back" button
  - Returns to Phonics Sounds Mastery hub
  - No errors in console

- [ ] **Hub shows progress**
  - Navigate to `/games/phonics-sounds-mastery`
  - Check "Foundations" tab
  - Level p2-bp-01 should show checkmark
  - Star count displayed correctly

- [ ] **Resume button**
  - Click "Resume" on hub
  - Should load last played level

## Browser Compatibility

### Desktop Browsers
- [ ] **Chrome** (latest)
- [ ] **Safari** (latest)
- [ ] **Firefox** (latest)
- [ ] **Edge** (latest)

### Mobile Browsers
- [ ] **iOS Safari**
  - Touch interactions work
  - Sound plays correctly
  
- [ ] **Android Chrome**
  - Touch interactions work
  - Sound plays correctly

### Responsiveness
- [ ] **Desktop (1920x1080)**
- [ ] **Tablet (768x1024)**
- [ ] **Mobile (375x667)**

## Performance Tests

- [ ] **No console errors** during gameplay
- [ ] **No console warnings** (except expected dynamic import warnings)
- [ ] **Smooth animations** (60fps)
- [ ] **Quick sound playback** (<100ms delay)
- [ ] **No memory leaks** (play 5+ rounds, check DevTools memory)

## Accessibility

- [ ] **Keyboard navigation**
  - Tab to focus balloons
  - Enter/Space to pop balloon
  - Visible focus ring

- [ ] **Screen reader support**
  - Balloon aria-labels present
  - Button labels meaningful

- [ ] **Color contrast**
  - Text readable against background
  - Focus indicators visible

## Edge Cases

- [ ] **Rapid clicking**
  - Click multiple balloons quickly
  - No duplicate confetti
  - State remains consistent

- [ ] **Browser back button**
  - Click back during game
  - No errors on return

- [ ] **Page refresh mid-game**
  - Refresh browser
  - Game restarts cleanly

- [ ] **Sound disabled in browser**
  - Mute browser/system audio
  - Game continues without errors
  - Visual feedback still works

- [ ] **localStorage disabled**
  - Block localStorage in DevTools
  - Game functions without crashing
  - Progress not saved (expected)

## Regression Tests (Phase 1 Still Works)

- [ ] **Original IPA game loads**: `/games/balloon-pop-ipa`
  - No query params
  - Phase 1 (IPA listening) renders
  - No errors from router

- [ ] **Phase 1 gameplay intact**
  - IPA symbols display (not letters)
  - Listen to IPA sound
  - Click matching IPA balloon

## Final Verification

- [ ] **Build size acceptable** (<1MB after gzip)
- [ ] **All tests passing** (58/58)
- [ ] **No TypeScript errors**
- [ ] **No ESLint warnings** (in new code)
- [ ] **Documentation updated** (this checklist + summary)

---

## Test Results Template

**Date**: _______  
**Tester**: _______  
**Browser**: _______  
**OS**: _______  

### Issues Found
1. 
2. 
3. 

### Passed Tests Count
- Basic: ___/21
- Advanced: ___/11
- Progress: ___/7
- Performance: ___/5
- Accessibility: ___/3
- Edge Cases: ___/5
- Regression: ___/2

**Total**: ___/54

### Notes
