# SpellBee Flash - Compact Top Layout & In-Card Toolbar Test Checklist

## Overview
Tests for the tightened top spacing and in-card toolbar (book/speaker/volume icons moved inside the card).

## Modified Files
- **NEW**: `/app/src/games/spellbee-flash/TopToolbar.tsx` - Compact toolbar component
- **UPDATED**: `/app/src/games/spellbee-flash/SpellBeeFlashTrainer.tsx` - Removed top spacing, removed DyslexiaToggle/SoundControl
- **UPDATED**: `/app/src/games/spellbee-flash/GameViewport.tsx` - Reduced top padding (pt-2 instead of pt-3/pt-4)
- **UPDATED**: `/app/src/games/spellbee-flash/WordCard.tsx` - Added TopToolbar inside card, tightened spacing

---

## Test Cases

### 1. Top Spacing Reduction

#### 1.1 Gap Between Navbar and Card
- [ ] The large empty space between the site navbar and game card is **gone**
- [ ] Card sits much closer to the navbar (only ~8-16px gap)
- [ ] No excessive whitespace at the top of the page
- [ ] On scroll, card doesn't hide under navbar due to `scroll-mt-[84px]`

#### 1.2 Back Button Position
- [ ] Back button ("← Back") is visible at top-left
- [ ] Button is not overlapping with navbar
- [ ] Button is clickable and functional
- [ ] Min height of 48px maintained for touch targets

#### 1.3 GameViewport Padding
- [ ] Top padding is tight: `pt-2` on mobile, `pt-2` on desktop
- [ ] Bottom padding preserved: `pb-3` on mobile, `pb-4` on desktop
- [ ] No clipping of content at edges

---

### 2. In-Card Toolbar

#### 2.1 Toolbar Visibility
- [ ] Three icons appear **inside** the card at top-right corner
- [ ] Icons are: 📖 (book), 🔊 (speaker), 🎚️ (volume)
- [ ] Toolbar is absolutely positioned (`absolute right-3 top-3`)
- [ ] Toolbar doesn't overlap with word title or other content
- [ ] Icons have white/90% opacity background with subtle shadow

#### 2.2 Toolbar Functionality
- [ ] **Book icon** (📖): Clickable (no-op currently, placeholder for word list)
- [ ] **Speaker icon** (🔊): Clicks and re-speaks the current word
- [ ] **Volume icon** (🎚️): Clickable (no-op currently, placeholder for audio settings)
- [ ] All buttons have proper hover states (bg-white on hover)
- [ ] Disabled state works (opacity-50, cursor-not-allowed)

#### 2.3 Toolbar Accessibility
- [ ] Speaker button has `aria-label="Play or pause audio"`
- [ ] Book button has `aria-label="Open word list"`
- [ ] Volume button has `aria-label="Audio settings"`
- [ ] All buttons have `title` attributes for tooltips
- [ ] Focus rings visible: `focus:ring-4 focus:ring-purple-300`
- [ ] Keyboard navigation works (Tab to focus, Enter/Space to activate)

#### 2.4 Toolbar Positioning
- [ ] Toolbar is inside the card wrapper (not floating outside)
- [ ] Card wrapper has `relative` class to contain absolute toolbar
- [ ] Toolbar z-index is `z-20` (appears above card content)
- [ ] Toolbar doesn't block game interactions (buttons below it are clickable)

---

### 3. Removed External Controls

#### 3.1 DyslexiaToggle and SoundControl
- [ ] **Desktop**: DyslexiaToggle (book icon) is NOT visible at top-right of page
- [ ] **Desktop**: SoundControl (volume icon) is NOT visible at top-right of page
- [ ] **Mobile**: Same - controls moved into card toolbar
- [ ] No duplicate icons anywhere on the page
- [ ] SpellBeeFlashTrainer imports removed (no unused imports)

#### 3.2 Only Back Button Remains
- [ ] Only the "← Back" button remains outside the card
- [ ] Back button is on the left side, aligned properly
- [ ] No other external controls visible

---

### 4. Card Layout Tightening

#### 4.1 Word Title Spacing
- [ ] Word icon (emoji) appears with minimal top margin
- [ ] Word title uses responsive text: `clamp(18px, 4.2vw, 28px)`
- [ ] Word title has `leading-tight` for compact line height
- [ ] Title has `mt-1 sm:mt-2` (very small top margin)

#### 4.2 Image Clamping
- [ ] Word images are clamped to `max-h-[30svh]` on mobile
- [ ] Word images are clamped to `max-h-[28svh]` on desktop
- [ ] Blank spacer (when no image) has height `h-[22svh]`
- [ ] Images don't overflow or push content below the fold
- [ ] Images maintain aspect ratio

#### 4.3 Q&A Section Compact
- [ ] Question text uses responsive sizing: `clamp(16px, 3.8vw, 22px)`
- [ ] Answer buttons grid has `gap-2.5 sm:gap-3` (compact gaps)
- [ ] Answer buttons have `min-h-[56px] sm:min-h-[64px]` (proper touch targets)
- [ ] Grid has `shrink-0` to prevent squishing

---

### 5. Responsive Behavior

#### 5.1 Desktop (≥ 1024px)
- [ ] Card sits close to navbar
- [ ] Toolbar visible at top-right inside card
- [ ] All three toolbar icons visible
- [ ] Main content centered, max-width 980px
- [ ] Left overlay (quests/coins) still visible

#### 5.2 Tablet (768px - 1023px)
- [ ] Card spacing tight
- [ ] Toolbar visible and functional
- [ ] Content fits without horizontal scrolling

#### 5.3 Mobile (< 768px)
- [ ] Card sits just below navbar
- [ ] Toolbar visible inside card (not hidden)
- [ ] Buttons tappable (min 56px height)
- [ ] No overflow or clipping
- [ ] Mobile HUD (coins/score) visible at top (if applicable)

---

### 6. Scroll Behavior

#### 6.1 Scroll Margin
- [ ] When scrolling to anchors, card doesn't hide under navbar
- [ ] `scroll-mt-[84px]` applied to relative wrapper
- [ ] If navbar height differs, adjust value (72/80/88/96px)

#### 6.2 Overflow Handling
- [ ] GameViewport has `overflow-y-auto` for fallback scroll
- [ ] Very small screens (< 667px height) can scroll if needed
- [ ] No unwanted horizontal scroll

---

### 7. Visual Tests

#### 7.1 Toolbar Styling
- [ ] Icons are properly sized (emoji display correctly)
- [ ] White/90% background with backdrop blur (if browser supports)
- [ ] Subtle shadow: `shadow`
- [ ] Ring border: `ring-1 ring-slate-200`
- [ ] Rounded corners: `rounded-xl`
- [ ] Padding: `px-2.5 py-1.5`

#### 7.2 Card Appearance
- [ ] Card has gradient background: `from-purple-100 via-pink-100 to-blue-100`
- [ ] Card has rounded corners: `rounded-2xl sm:rounded-3xl`
- [ ] Card has shadow: `shadow-xl`
- [ ] Card padding: `p-3 sm:p-4`

#### 7.3 Overall Layout
- [ ] No jarring visual gaps or misalignments
- [ ] Content flows naturally from navbar to card
- [ ] Toolbar looks integrated into card (not floating)

---

### 8. Functional Tests

#### 8.1 Speaker Button (Re-speak Word)
- [ ] Clicking speaker icon plays TTS for current word
- [ ] Audio plays correctly with proper pronunciation
- [ ] During ear-training phase, button does nothing (correct behavior)
- [ ] No errors in console when clicking

#### 8.2 Game Flow Preserved
- [ ] Ear-training gating works (every 3rd word)
- [ ] Speed rounds work (every 5th word)
- [ ] Confetti appears on correct answers
- [ ] Progress bar updates correctly
- [ ] SRS system functions normally

#### 8.3 No Regressions
- [ ] All answer buttons clickable
- [ ] MCQ selection works (meaning + IPA phases)
- [ ] Timer countdown works for speed rounds
- [ ] Brain break modal appears at word 12

---

### 9. Browser Compatibility

#### 9.1 Chrome/Edge
- [ ] Toolbar renders correctly
- [ ] Backdrop blur works (white/90%)
- [ ] Focus rings visible

#### 9.2 Firefox
- [ ] Layout matches Chrome
- [ ] Toolbar functional

#### 9.3 Safari (Desktop)
- [ ] Toolbar positioning correct
- [ ] svh units work for image clamping

#### 9.4 Safari (iOS)
- [ ] Toolbar visible and tappable
- [ ] No overlap with iOS safe areas
- [ ] URL bar collapse/expand doesn't affect toolbar

---

### 10. Performance & Console

#### 10.1 Build Output
- [ ] TypeScript compiles with no errors
- [ ] Build succeeds: `npm run build`
- [ ] Bundle size reasonable (< 800 kB)
- [ ] Vite warnings only about chunk size (expected)

#### 10.2 Console Checks
- [ ] No TypeScript errors
- [ ] No React warnings (keys, refs, hooks)
- [ ] No CSS-related warnings
- [ ] No unused import warnings

#### 10.3 Render Performance
- [ ] Toolbar renders instantly on card load
- [ ] No layout shift when toolbar appears
- [ ] Smooth interactions (no jank)

---

## Edge Cases

### 11.1 Very Small Screens (< 375px width)
- [ ] Toolbar icons don't overlap with word title
- [ ] Icons remain tappable (adequate spacing)
- [ ] Content still legible

### 11.2 Very Short Screens (< 600px height)
- [ ] Content fits with overflow-y-auto fallback
- [ ] Toolbar doesn't hide question/answers
- [ ] Scroll works smoothly if needed

### 11.3 Long Word Titles
- [ ] Word titles don't overlap with toolbar
- [ ] Titles wrap or truncate gracefully
- [ ] Toolbar remains visible

### 11.4 No Image Available
- [ ] Blank spacer renders with correct height
- [ ] Layout doesn't break
- [ ] Toolbar still visible

---

## Navbar Height Adjustment

If your site navbar height is **not** 84px, adjust the `scroll-mt` value:

| Navbar Height | scroll-mt Value |
|---------------|-----------------|
| 64px          | scroll-mt-[64px] |
| 72px          | scroll-mt-[72px] |
| 80px          | scroll-mt-[80px] |
| **84px**      | **scroll-mt-[84px]** (current) |
| 88px          | scroll-mt-[88px] |
| 96px          | scroll-mt-[96px] |

To measure navbar height:
1. Open browser DevTools
2. Inspect navbar element
3. Check computed height in Layout tab

---

## Success Criteria

✅ **Top Spacing**: Large gap removed, card sits close to navbar
✅ **Toolbar**: Three icons (book, speaker, volume) inside card top-right
✅ **Removed**: DyslexiaToggle and SoundControl no longer external
✅ **Positioning**: Toolbar absolutely positioned, doesn't affect layout
✅ **Accessibility**: All buttons have aria-labels and focus rings
✅ **Responsive**: Works on desktop, tablet, mobile
✅ **Build**: No TypeScript errors, successful compilation
✅ **Functionality**: Speaker button re-speaks word, game logic preserved

---

## Rollback Plan

If issues arise:

1. **Revert TopToolbar**:
   - Delete `/src/games/spellbee-flash/TopToolbar.tsx`
   - Remove import and `<TopToolbar />` from WordCard.tsx

2. **Restore External Controls**:
   - Re-add imports: `import DyslexiaToggle from "../shared/DyslexiaToggle";`
   - Re-add imports: `import SoundControl from "../shared/SoundControl";`
   - Restore the `<div className="flex items-center gap-2">` block with DyslexiaToggle + SoundControl

3. **Restore Original Spacing**:
   - GameViewport.tsx: Change `pt-2 pb-3 sm:pt-2 sm:pb-4` back to `py-3 sm:py-4`
   - WordCard.tsx: Remove `relative` from card wrapper, remove `mt-1 sm:mt-2` from word display

4. **Build**: `npm run build` to verify rollback

---

**Test completed by**: _________________  
**Date**: _________________  
**Build version**: _________________  
**Navbar height measured**: _________ px  
**Notes**: _________________
