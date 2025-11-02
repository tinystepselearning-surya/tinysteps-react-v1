# SpellBee Flash Trainer - Mobile Viewport Test Checklist

## ✅ Implementation Complete

All mobile viewport and single-screen fit changes have been implemented for SpellBee Flash Trainer.

### Files Modified:
1. **GameViewport.tsx** - Mobile-safe viewport wrapper
2. **SpellBeeFlashTrainer.tsx** - Compact HUD and proper flex layout
3. **WordCard.tsx** - Compact mobile-first card layout

---

## 📋 Test Checklist

### Mobile Viewport Tests (iOS & Android)

#### 1. iOS Safari URL Bar Handling
- [ ] **Test on iPhone Safari (375×667 or similar)**
  - Open SpellBee Flash game
  - Scroll down to hide URL bar
  - Scroll up to show URL bar
  - ✅ **Expected**: Content should NOT clip when URL bar appears/disappears
  - ✅ **Expected**: Game remains fully visible in both states
  - **Technical**: Uses `100svh` on mobile to handle dynamic viewport

#### 2. Android Chrome Address Bar
- [ ] **Test on Android Chrome (various screen sizes)**
  - Same test as iOS above
  - ✅ **Expected**: Content adjusts smoothly without clipping

#### 3. No Page Scroll Required
- [ ] **Test on smallest target device (375×667)**
  - Load a word card
  - Check that entire question + 3 buttons fit without scrolling
  - ✅ **Expected**: One-screen fit, no body/page scroll needed
  - ✅ **Expected**: Only GameViewport has scroll if content barely overflows

### Content Fitting Tests

#### 4. Image Height Clamping
- [ ] **Place test image in `/src/assets/spellbee-images/action.png`**
  - Word "action" should display the image
  - ✅ **Expected**: Image never exceeds ~34svh on mobile, 32svh on desktop
  - ✅ **Expected**: Image shrinks proportionally on very small devices
  - Check that image doesn't push buttons off-screen

#### 5. Long Text Handling
- [ ] **Test word with long meaning options**
  - ✅ **Expected**: Text scales via `clamp(13px, 2.9vw, 18px)`
  - ✅ **Expected**: Buttons remain min 56px height (mobile) / 64px (desktop)
  - ✅ **Expected**: Question text uses `clamp(16px, 3.8vw, 22px)`
  - ✅ **Expected**: Content doesn't push answers off-screen

#### 6. Blank Spacer (No Image)
- [ ] **Test word without corresponding image file**
  - ✅ **Expected**: Shows blank gray spacer (`h-[22svh]`)
  - ✅ **Expected**: NO emoji, NO stock images, NO placeholder art
  - ✅ **Expected**: Just subtle border and background color

### Layout & Interaction Tests

#### 7. GameViewport Overflow Behavior
- [ ] **Test on very small device (320px width or similar)**
  - ✅ **Expected**: GameViewport becomes scrollable if needed
  - ✅ **Expected**: Body/page does NOT scroll
  - ✅ **Expected**: Scroll is smooth and doesn't interfere with gameplay

#### 8. Confetti Overlay
- [ ] **Answer a question correctly**
  - ✅ **Expected**: Confetti appears as absolute overlay
  - ✅ **Expected**: No layout shift when confetti shows/hides
  - ✅ **Expected**: Buttons remain tappable after confetti clears
  - ✅ **Expected**: Cheer message shows in white/70 backdrop blur

#### 9. Touch Targets
- [ ] **Test button tappability**
  - ✅ **Expected**: All 3 horizontal buttons easily tappable
  - ✅ **Expected**: Minimum 56px height on mobile (iOS/Android guidelines)
  - ✅ **Expected**: Proper spacing between buttons (2.5 to 3 gap units)

### Game Logic Tests

#### 10. Ear-Training Gating
- [ ] **Test ear-training round (every 3rd word, not 5th)**
  - Click "Hear it!" button
  - ✅ **Expected**: Word is hidden ("???") until audio plays
  - ✅ **Expected**: 3 IPA options appear after clicking "Hear it!"
  - ✅ **Expected**: Correct selection triggers celebration
  - ✅ **Expected**: Wrong selection shows minimal-pair hint

#### 11. Speed Round Timer
- [ ] **Test speed round (every 5th word)**
  - ✅ **Expected**: Timer bar shows at top (compact, 2-3px height)
  - ✅ **Expected**: "SPEED!" label visible with countdown
  - ✅ **Expected**: Timer animates smoothly (orange to red gradient)
  - ✅ **Expected**: Beep at 7s, 4s, 1s remaining
  - ✅ **Expected**: Auto-timeout at 0s with "Time's Up!" message

#### 12. Three-Option Layout
- [ ] **Check all phases (meaning, IPA, ear-training)**
  - ✅ **Expected**: Always exactly 3 horizontal buttons
  - ✅ **Expected**: NO 4th option appears
  - ✅ **Expected**: Grid layout: `grid-cols-3`
  - ✅ **Expected**: Buttons stack vertically on very narrow screens if needed

### Technical Validation

#### 13. Console Errors
- [ ] **Open browser DevTools**
  - ✅ **Expected**: No TypeScript compilation errors
  - ✅ **Expected**: No React warnings
  - ✅ **Expected**: No console errors during gameplay

#### 14. Build Verification
- [ ] **Run `npm run build`**
  - ✅ **Expected**: Build completes successfully
  - ✅ **Expected**: No TS errors in GameViewport, SpellBeeFlashTrainer, WordCard
  - ✅ **Expected**: Dist bundle size reasonable (~791 kB as of last build)

---

## 🎯 Key Technical Details

### GameViewport.tsx
```tsx
// Mobile: 100svh (handles iOS URL bar)
// Desktop: dvh (dynamic viewport height)
className="h-[100svh] md:h-dvh overflow-x-hidden overflow-y-auto"
```

### WordCard.tsx Layout Structure
```tsx
<div className="flex-1 min-h-0 flex flex-col">
  {/* Image: max-h-[34svh] sm:max-h-[32svh] */}
  {/* Q&A: flex-1 min-h-0 allows shrinking */}
  <section className="flex-1 min-h-0 flex flex-col justify-center">
    {/* Question: clamp(16px, 3.8vw, 22px) */}
    {/* Buttons: clamp(13px, 2.9vw, 18px), min-h-[56px] sm:min-h-[64px] */}
  </section>
</div>
```

### Button Styling
```tsx
className="rounded-2xl shadow-md px-3 sm:px-4 py-3 sm:py-4 
  min-h-[56px] sm:min-h-[64px] w-full
  text-[clamp(13px,2.9vw,18px)] sm:text-base
  bg-white hover:bg-slate-50 active:scale-[0.98]
  focus:outline-none focus:ring-4 focus:ring-purple-300"
```

---

## 📱 Target Devices

### Minimum Supported:
- **iPhone SE (375×667)** - Smallest modern iPhone
- **iPhone 8/7/6s (375×667)**
- **Small Android phones (360×640 and up)**

### Ideal Testing:
- iPhone 12/13/14 (390×844)
- iPhone 14 Pro Max (430×932)
- Samsung Galaxy S21 (360×800)
- Google Pixel 5 (393×851)
- iPad Mini (768×1024)

---

## ✅ Success Criteria

**The implementation is successful if:**
1. ✅ No page scroll on 375×667 devices
2. ✅ iOS Safari URL bar doesn't cause clipping
3. ✅ Image max height is respected (~34svh)
4. ✅ Text scales responsively with clamp()
5. ✅ Buttons are always tappable (56px+ min height)
6. ✅ Confetti doesn't cause layout shift
7. ✅ Only local assets render (no emojis/stock images)
8. ✅ Ear-training and speed rounds work correctly
9. ✅ No TypeScript or console errors
10. ✅ Build completes successfully

---

## 🐛 Known Issues / Edge Cases

**None currently identified**

If issues are found during testing, document them here:
- **Issue**: [Description]
- **Device**: [iPhone/Android model]
- **Steps to reproduce**: [...]
- **Expected**: [...]
- **Actual**: [...]

---

## 📝 Notes

- **Assets Location**: `/src/assets/spellbee-images/<wordId>.(png|jpg|jpeg|webp)`
- **Asset Naming**: Lowercase, spaces→hyphens (e.g., `big-apple.png`)
- **No Upload UI**: Images must be placed before build (build-time asset loading)
- **Viewport Units**: `svh` (small viewport height) for mobile, `dvh` (dynamic) for desktop
- **Flex Shrinking**: `flex-1 min-h-0` prevents children from exceeding container height
