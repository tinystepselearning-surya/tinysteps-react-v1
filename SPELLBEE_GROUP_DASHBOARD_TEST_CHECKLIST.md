# SpellBee Flash Group Dashboard — Test Checklist

**Feature**: A-Z Letter Group Overview with Progress Tracking  
**Components**: GroupDashboard.tsx, GroupCard.tsx, WordsModal.tsx  
**Updated Files**: utils.ts, SpellBeeFlashTrainer.tsx  

---

## Pre-Test Setup

1. **Clear localStorage** to start fresh (or use existing mastery data):
   ```javascript
   // In browser console:
   localStorage.removeItem('spellbee-mastery-v1');
   localStorage.removeItem('spellbee-last-group-v1');
   ```

2. **Navigate to Group Dashboard** (route needs to be configured):
   - Expected route: `/games/spellbee-flash/dashboard` or similar
   - Note: Router integration is pending, may need temporary navigation

---

## ✅ Dashboard Layout & Rendering

### 1. Group Tiles Display
- [ ] Only letters with ≥1 word show tiles (e.g., if no words start with "X", no "X" tile)
- [ ] "All" tile always shows (represents all words)
- [ ] "#" tile shows if any words start with non-alpha characters
- [ ] Tiles display in order: "All", A-Z (filtered), "#" (if present)
- [ ] Grid layout: 2 columns on mobile, 3 on tablet, 4 on desktop
- [ ] All tiles have equal height and consistent spacing

### 2. Summary Chips (Top Section)
- [ ] "All Groups" chip shows total completed/total words across entire dataset
- [ ] "All Groups" chip shows correct percentage (e.g., "45% Complete")
- [ ] "Last Played" chip appears only if user has played a group (not on first visit)
- [ ] "Last Played" chip shows correct group letter
- [ ] "Last Played" chip shows completed/total for that specific group
- [ ] Chips have correct color coding (purple for "All Groups", blue for "Last Played")

---

## ✅ GroupCard Component

### 3. Visual Elements
- [ ] Letter badge displays correctly (10×10 on mobile, 12×12 on desktop)
- [ ] Letter badge has purple-100 background with purple-900 text
- [ ] Progress bar shows correct percentage (0-100%)
- [ ] Progress bar is ARIA-compliant (aria-valuenow, aria-valuemin, aria-valuemax)
- [ ] "X/Y Words" label shows correct completed vs. total count
- [ ] Confidence pill displays correct level: Low / Medium / High
- [ ] Confidence pill colors: rose-100/rose-700 (Low), amber-100/amber-700 (Medium), emerald-100/emerald-700 (High)

### 4. Confidence Calculation
- [ ] **High**: ≥70% completion OR average mastery ≥2.5 → emerald colors
- [ ] **Medium**: 40-69% completion AND avg mastery <2.5 → amber colors
- [ ] **Low**: <40% completion AND avg mastery <2.5 → rose colors
- [ ] Test edge cases: 0% (Low), 40% (Medium), 70% (High), 100% (High)

### 5. Action Buttons
- [ ] "Start" button (purple-600 background) is visible and clickable
- [ ] "View" button (outlined) is visible and clickable
- [ ] "Reset" button (outlined) is visible and clickable
- [ ] All buttons are ≥64px in height/width (WCAG 2.5.5)
- [ ] All buttons have strong focus rings (3px purple-500 with offset)
- [ ] Buttons respond to hover states (scale, shadow, background changes)

---

## ✅ WordsModal Component

### 6. Modal Opening & Closing
- [ ] Modal opens when "View" button clicked on any GroupCard
- [ ] Modal shows correct group letter in title (e.g., "Group A Words")
- [ ] Modal backdrop (black/30 with blur) appears correctly
- [ ] Clicking backdrop closes modal
- [ ] Clicking "×" close button closes modal
- [ ] Pressing **Esc** key closes modal
- [ ] Body scroll is disabled when modal is open
- [ ] Body scroll re-enables when modal closes

### 7. Words List Display
- [ ] All words in the group are listed correctly
- [ ] Words are in alphabetical order (or dataset order)
- [ ] Each word has a mastery dot (colored circle)
- [ ] Each word has word text (bold, slate-800)
- [ ] Each word has accuracy badge (percentage or "New")
- [ ] Empty state message shows if group has 0 words: "No words in this group yet."

### 8. Mastery Dots & Accuracy Badges
- [ ] **Mastery Level 0** (not started): slate-300 dot, "New" badge (slate-50/slate-600)
- [ ] **Mastery Level 1** (learning): amber-500 dot, accuracy % badge
- [ ] **Mastery Level 2** (good): green-500 dot, accuracy % badge
- [ ] **Mastery Level 3+** (mastered): emerald-500 dot, accuracy % badge
- [ ] **Accuracy ≥80%**: emerald-50/emerald-700 badge
- [ ] **Accuracy 60-79%**: amber-50/amber-700 badge
- [ ] **Accuracy <60%**: rose-50/rose-700 badge
- [ ] Tooltips show on mastery dot hover: "Mastered", "Good progress", "Learning", "Not started"

### 9. Legend (Footer)
- [ ] Legend shows 4 mastery levels with colored dots and labels
- [ ] Legend labels: "Mastered" (emerald), "Good" (green), "Learning" (amber), "New" (slate)
- [ ] Legend is centered and visible at bottom of modal

---

## ✅ Functionality & Data Persistence

### 10. Start Group Action
- [ ] Clicking "Start" on a group saves `spellbee-last-group-v1` to localStorage
- [ ] Console log confirms: `[GroupDashboard] Start group: X`
- [ ] "Last Played" chip updates after starting a different group (refresh page to see)
- [ ] Starting "All" group saves `'All'` to localStorage
- [ ] Starting individual letter group (e.g., "B") saves `'B'` to localStorage

### 11. Reset Group Action
- [ ] Clicking "Reset" shows browser confirm dialog: "Reset all progress for group X?"
- [ ] Clicking "Cancel" in confirm does nothing
- [ ] Clicking "OK" in confirm clears mastery data for all words in that group
- [ ] After reset, page reloads and group shows 0% completion
- [ ] Mastery dots in modal change to slate-300 (not started) after reset
- [ ] Accuracy badges change to "New" after reset
- [ ] Resetting "All" clears all mastery data for all words
- [ ] Resetting individual letter group (e.g., "C") only clears words in group C

### 12. Stats Accuracy
- [ ] Total word count matches actual number of words in WORDS dataset for each group
- [ ] Completed count increments correctly (mastery ≥2 OR mastered flag = true)
- [ ] Percentage is calculated correctly: `Math.round((completed / total) * 100)`
- [ ] After completing words in trainer, returning to dashboard shows updated stats (may need page refresh if no live sync)
- [ ] Stats for "All" group aggregate all individual group stats correctly

---

## ✅ Accessibility (WCAG AA)

### 13. Keyboard Navigation
- [ ] All buttons are keyboard focusable (Tab key)
- [ ] Focus order is logical: Summary chips → Group tiles (left-to-right, top-to-bottom) → Modal buttons
- [ ] Enter/Space activates buttons
- [ ] Esc key closes modal
- [ ] Focus trap works in modal (Tab cycles through modal elements only)
- [ ] Focus returns to trigger button when modal closes

### 14. Focus Indicators
- [ ] All interactive elements have visible 3px purple-500 focus ring with offset
- [ ] Focus rings are visible on white and colored backgrounds
- [ ] Focus rings do NOT clip or get cut off by overflow:hidden

### 15. ARIA & Screen Readers
- [ ] Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="words-modal-title"`
- [ ] Modal title has `id="words-modal-title"`
- [ ] Progress bars have `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- [ ] Close button has `aria-label="Close modal"`
- [ ] Mastery dots have `aria-label` with level description
- [ ] No ARIA errors in browser console

### 16. Contrast Ratios (WCAG 4.5:1)
- [ ] Letter badges: purple-900 on purple-100 (≥7:1) ✅
- [ ] Confidence pills: rose-700/amber-700/emerald-700 on rose-100/amber-100/emerald-100 (≥7:1) ✅
- [ ] Button text: white on purple-600 (≥4.5:1) ✅
- [ ] Accuracy badges: emerald-700/amber-700/rose-700 on emerald-50/amber-50/rose-50 (≥7:1) ✅
- [ ] All text meets or exceeds WCAG AA contrast requirements

---

## ✅ Mobile Responsiveness

### 17. Layout Adaptation
- [ ] On mobile (< 640px): 2-column grid, smaller text, compact spacing
- [ ] On tablet (640-1024px): 3-column grid
- [ ] On desktop (≥1024px): 4-column grid
- [ ] Summary chips wrap on small screens (flex-wrap)
- [ ] Modal is responsive: 90vw width on mobile, max-w-[720px] on desktop
- [ ] Modal is vertically scrollable if content exceeds viewport (max-h-[80vh])

### 18. Touch Targets
- [ ] All buttons are ≥64px in height and width (WCAG 2.5.5 Level AAA)
- [ ] Tap targets have adequate spacing (no overlapping hit areas)
- [ ] Buttons are easy to tap on small screens without accidental presses

---

## ✅ Integration with SpellBeeFlashTrainer

### 19. useStartGroup Export
- [ ] `useStartGroup` function is exported from SpellBeeFlashTrainer.tsx
- [ ] Calling `useStartGroup()('A')` saves `'A'` to localStorage under `spellbee-last-group-v1`
- [ ] Console log shows: Event logged with groupId and wordCount
- [ ] JSDoc comment shows example router integration code
- [ ] Note: Actual router wiring is left as TODO (intentionally not implemented yet)

### 20. Group Filtering (Future Enhancement)
- [ ] When `spellbee-last-group-v1` is set, trainer could filter words (not yet implemented)
- [ ] Placeholder comment in code indicates where group filtering would be added
- [ ] Existing trainer logic remains unaffected (no breaking changes)

---

## ✅ Edge Cases & Error Handling

### 21. Empty States
- [ ] If no words in dataset, dashboard shows "All" tile with 0/0 and 0%
- [ ] If group has 0 words (e.g., "X"), tile does not appear
- [ ] Modal shows "No words in this group yet." if word list is empty

### 22. Data Corruption Recovery
- [ ] If `spellbee-mastery-v1` localStorage has invalid JSON, dashboard handles gracefully (default to `{}`)
- [ ] If `spellbee-last-group-v1` has invalid group ID, "Last Played" chip does not appear

### 23. Performance
- [ ] Dashboard renders quickly (< 1 second) even with 500+ words
- [ ] Modal opens instantly (no lag)
- [ ] No console errors or warnings
- [ ] No memory leaks (modal cleanup removes event listeners)

---

## ✅ Visual Polish

### 24. Animations & Transitions
- [ ] Buttons have smooth hover transitions (scale, shadow, background)
- [ ] Modal backdrop fades in/out smoothly
- [ ] Progress bars animate when value changes (if implemented)
- [ ] No jarring layout shifts or jumps

### 25. Typography & Spacing
- [ ] All text is readable (minimum 14px on mobile)
- [ ] Heading hierarchy is logical (h1 → h2)
- [ ] Spacing is consistent (padding, margins, gaps)
- [ ] No text overflow or clipping

---

## 🎯 Final Validation

### 26. Build & Deploy
- [ ] `npm run build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] Bundle size is acceptable (< 1 MB gzipped)
- [ ] No runtime errors in browser console

### 27. Cross-Browser Testing
- [ ] Chrome: All features work ✅
- [ ] Firefox: All features work ✅
- [ ] Safari: All features work ✅
- [ ] Edge: All features work ✅

### 28. Screen Reader Testing
- [ ] VoiceOver (macOS): Dashboard and modal are navigable
- [ ] NVDA (Windows): Progress bars announce correctly
- [ ] All interactive elements are announced with correct labels

---

## 📝 Known Limitations (By Design)

- **Router Integration**: Not implemented. `useStartGroup` export is provided with example code in JSDoc.
- **Live Stats Updates**: Dashboard does not auto-refresh when trainer completes words. User must reload page to see updated stats.
- **Group Filtering in Trainer**: Not implemented. Trainer always shows all words regardless of `spellbee-last-group-v1` value.

---

## 🚀 Post-Test Actions

After all tests pass:

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat(spellbee-flash): Add Group Dashboard with A-Z progress tracking"
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```

3. **Document Router Integration** (for future):
   - Add route in router: `/games/spellbee-flash/dashboard`
   - Import and use `useStartGroup` hook
   - Wire navigation from dashboard → trainer

---

**Test Completion Date**: _____________  
**Tested By**: _____________  
**Browser/Device**: _____________  
**Result**: ☐ Pass ☐ Fail (attach bug report)
