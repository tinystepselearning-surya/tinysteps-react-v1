# SpellBee Flash - Left Overlay Test Checklist

## Overview
Tests for the compact left overlay system that shows Quests + Coins/Score chips without affecting main content layout.

## Modified Files
- **NEW**: `/app/src/games/spellbee-flash/LeftOverlay.tsx` - Compact left overlay component
- **UPDATED**: `/app/src/games/spellbee-flash/QuestsPanel.tsx` - Removed fixed positioning
- **UPDATED**: `/app/src/games/spellbee-flash/SpellBeeFlashTrainer.tsx` - Uses LeftOverlay, hides old HUD on desktop

---

## Test Cases

### 1. Desktop Layout (≥ 1024px)

#### 1.1 Left Overlay Visibility
- [ ] Quests panel appears at top-left, floating over content
- [ ] Quests panel is positioned at `left-4 top-24` (approximately)
- [ ] Directly below quests: Two compact chips (Coins + Score) in horizontal row
- [ ] Chips are aligned with quests panel (same left edge)
- [ ] Total overlay width is approximately 180px

#### 1.2 Main Content Centering
- [ ] Main game card (word + answers) is centered horizontally
- [ ] No empty left margin/gutter where overlay is positioned
- [ ] Content uses full available width (max-width: 980px)
- [ ] Back button, dyslexia toggle, and sound control are visible at top
- [ ] Progress bar spans full width of content area

#### 1.3 Overlay Behavior
- [ ] Left overlay does NOT push main content to the right
- [ ] Clicking on quests panel works (expand/collapse)
- [ ] Clicking on main content (word card, buttons) works normally
- [ ] No pointer-event conflicts between overlay and main content

#### 1.4 HUD Display
- [ ] Old HUD (coins/score badges at top center) is HIDDEN on desktop
- [ ] Only the left overlay chips show coins and score
- [ ] No duplicate coin/score displays visible

---

### 2. Tablet Layout (768px - 1023px)

#### 2.1 Overlay Visibility
- [ ] Left overlay is visible (same as desktop)
- [ ] Positioned at `left-2 top-20` on smaller tablets
- [ ] Quests + chips display correctly

#### 2.2 Responsive Behavior
- [ ] Main content adjusts appropriately for tablet width
- [ ] No horizontal scrolling
- [ ] Overlay remains floating and doesn't affect layout

---

### 3. Mobile Layout (< 768px)

#### 3.1 Overlay Visibility
- [ ] Left overlay is HIDDEN (not visible at all)
- [ ] No quests panel visible on left side
- [ ] No chips row visible on left side

#### 3.2 Mobile HUD Fallback
- [ ] Old HUD (coins/score badges) IS VISIBLE at top center
- [ ] Coins chip shows: "🪙 {coins}"
- [ ] Score chip shows: "Score: {score}"
- [ ] Streak badge shows when streak > 0: "🔥 {streak}"

#### 3.3 Main Content
- [ ] Game card is centered and uses full width
- [ ] No empty left space where overlay would be
- [ ] All game interactions work normally

---

### 4. Functional Tests (All Screen Sizes)

#### 4.1 Coins Updates
- [ ] Coins value in overlay (desktop) updates when earning coins
- [ ] Coins value in mobile HUD (mobile) updates when earning coins
- [ ] Values match between displays when switching screen size

#### 4.2 Score Updates
- [ ] Score value in overlay (desktop) updates after each answer
- [ ] Score value in mobile HUD (mobile) updates after each answer
- [ ] Progress bar reflects correct progress

#### 4.3 Quests Interaction
- [ ] **Desktop**: Clicking quests panel header expands/collapses
- [ ] **Desktop**: Quest progress bars update correctly
- [ ] **Desktop**: Completed quests show checkmark and green border
- [ ] **Desktop**: Quest completion celebration appears correctly
- [ ] **Mobile**: Quests are hidden (no interaction needed)

#### 4.4 Overlay Positioning
- [ ] Overlay stays in top-left during gameplay
- [ ] Overlay doesn't move when scrolling (if overflow occurs)
- [ ] Overlay has correct z-index (appears above game elements but below modals)

---

### 5. Visual Tests

#### 5.1 Chips Styling
- [ ] Coins chip has white background with 90% opacity
- [ ] Score chip has white background with 90% opacity
- [ ] Both chips have subtle shadow and ring border
- [ ] Text is legible and properly sized (14px, semibold)
- [ ] Coins chip shows emoji: "🪙"
- [ ] Chips are compact and don't overlap

#### 5.2 Layout Consistency
- [ ] No layout shift when switching between breakpoints
- [ ] No content jumping when overlay appears/disappears
- [ ] Smooth transitions if any

#### 5.3 Accessibility
- [ ] Overlay has `aria-label="Game stats overlay"`
- [ ] Coins chip has `aria-label="Coins: {value}"`
- [ ] Score chip has `aria-label="Score: {value}"`
- [ ] Quests panel remains accessible via keyboard

---

### 6. Edge Cases

#### 6.1 No Quests
- [ ] If quests array is empty, only chips row shows
- [ ] Layout doesn't break
- [ ] Chips remain properly positioned

#### 6.2 Long Quest Titles
- [ ] Quest cards with long titles don't overflow
- [ ] Text wraps or truncates appropriately
- [ ] Panel maintains 180px width

#### 6.3 High Values
- [ ] Coins display works with values > 999 (e.g., "🪙 1234")
- [ ] Score display works with high scores
- [ ] No layout breaking with large numbers

#### 6.4 Browser Resize
- [ ] Switching from desktop → mobile hides overlay, shows mobile HUD
- [ ] Switching from mobile → desktop shows overlay, hides mobile HUD
- [ ] No console errors during resize

---

### 7. Browser Compatibility

#### 7.1 Chrome/Edge
- [ ] Overlay renders correctly
- [ ] Backdrop blur effect works (if supported)
- [ ] Pointer events work correctly

#### 7.2 Firefox
- [ ] Layout matches Chrome
- [ ] No visual differences

#### 7.3 Safari (Desktop)
- [ ] Overlay positioning correct
- [ ] Transparency/blur renders properly

#### 7.4 Safari (iOS)
- [ ] Mobile HUD visible (overlay hidden)
- [ ] Touch interactions work

---

### 8. Performance

#### 8.1 Render Performance
- [ ] No lag when overlay appears on page load
- [ ] No jank when updating coins/score values
- [ ] Smooth animations for quest completion

#### 8.2 Build Output
- [ ] TypeScript compiles with no errors
- [ ] Build completes successfully
- [ ] Bundle size reasonable (< 800 kB)

---

### 9. Console Checks

#### 9.1 No Errors
- [ ] No TypeScript errors in console
- [ ] No React warnings about keys or refs
- [ ] No CSS-related warnings

#### 9.2 No Layout Warnings
- [ ] No "pointer-events" warnings
- [ ] No z-index conflicts
- [ ] No positioning issues logged

---

## Test Devices

### Desktop
- Chrome, Firefox, Safari on macOS/Windows
- Screen sizes: 1920×1080, 1440×900, 1280×720

### Tablet
- iPad (1024×768)
- iPad Pro (1366×1024)
- Android tablets (768×1024)

### Mobile
- iPhone SE (375×667) - minimum target
- iPhone 12-14 (390×844)
- Android phones (360×640 to 414×896)

---

## Success Criteria

✅ **Layout**: Main content centered, no left gutter, overlay floating
✅ **Desktop**: Overlay visible with quests + chips, old HUD hidden
✅ **Mobile**: Overlay hidden, old HUD visible
✅ **Interaction**: All clicks work, no pointer conflicts
✅ **Updates**: Coins/score values update correctly everywhere
✅ **Build**: No TypeScript errors, successful compilation
✅ **Performance**: No lag, smooth updates

---

## Known Limitations

- On very small screens (< 375px width), overlay may overlap content slightly - this is acceptable as minimum target is 375px
- Backdrop blur may not work on older browsers - graceful degradation with solid white background

---

## Rollback Plan

If issues arise:
1. Revert `SpellBeeFlashTrainer.tsx` changes (remove LeftOverlay import, restore QuestsPanel direct usage)
2. Revert `QuestsPanel.tsx` positioning (restore `fixed top-4 left-4`)
3. Delete `LeftOverlay.tsx`
4. Run `npm run build` to verify rollback

---

**Test completed by**: _________________  
**Date**: _________________  
**Build version**: _________________  
**Notes**: _________________
