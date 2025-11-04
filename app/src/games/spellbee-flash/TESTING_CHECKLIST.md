# SpellBee Flash UX Changes - Testing Checklist

## ✅ Testing Checklist

### 1. Option Count (3 instead of 4)
- [ ] **Meaning MCQ**: Verify exactly 3 options appear in normal rounds
- [ ] **IPA MCQ**: Verify exactly 3 options appear
- [ ] **Speed Rounds**: Verify exactly 3 meaning options
- [ ] **Ear-Training**: Verify exactly 3 IPA options after audio plays
- [ ] **Fix-Up Mode**: Verify 3 options in all phases

### 2. Horizontal Layout
- [ ] **Desktop View**: All 3 options appear in one horizontal row
- [ ] **Mobile View (iPhone)**: Options wrap gracefully (likely 3 in a row or 2+1)
- [ ] **Tablet View**: Options maintain good spacing
- [ ] **Button Size**: Each button is min-h-[64px] for easy tapping
- [ ] **Focus Rings**: Keyboard focus shows clear 4px purple ring
- [ ] **Hover Effects**: Desktop hover shows scale animation
- [ ] **Active State**: Tap/click shows scale-down effect

### 3. Picture Upload & Display
- [ ] **Placeholder Shows**: When no image is set, placeholder appears with dashed border, gradient background, photo icon, and "Add picture (optional)" text
- [ ] **Upload Works**: Clicking "Upload image" button opens file picker
- [ ] **Image Preview**: After selecting .jpg/.png/.webp, image immediately displays
- [ ] **Persistence**: Image persists when navigating to next word and back
- [ ] **Replace Button**: "Replace" button appears on top-right when image exists
- [ ] **Remove Button**: "Remove" button clears image and shows placeholder again
- [ ] **Error Handling**: Non-image files show alert
- [ ] **Not in Ear-Training**: Picture area hidden during ear-training phase (word is "???")
- [ ] **localStorage**: Images stored in "spellbee-word-images-v1" key
- [ ] **No Built-In Images**: Confirm no default/system images are shown

### 4. Celebration on Correct Answer
- [ ] **Confetti Burst**: Shows on correct meaning selection
- [ ] **Confetti Burst**: Shows on correct IPA selection
- [ ] **Confetti Burst**: Shows on correct ear-training IPA
- [ ] **Confetti Burst**: Shows on correct speed round answer
- [ ] **Confetti Duration**: Lasts ~1 second and auto-cleans up
- [ ] **Cheer Message**: Random message appears ("You did it! 🎉", "Great job! 🌟", or "Congratulations! 🥳")
- [ ] **Cheer Position**: Centered overlay, readable against background
- [ ] **Cheer Duration**: Disappears after ~1.2 seconds
- [ ] **Aria Announcement**: Screen reader announces "Correct! You did it!"
- [ ] **No Celebration on Wrong**: Confetti/cheer does NOT appear on wrong answers

### 5. Existing Features (Preserved)
- [ ] **SRS Buckets**: Words still move between Learning/Getting Better/Mastered
- [ ] **Coins System**: Coins still awarded correctly
- [ ] **Badges**: Achievements still unlock
- [ ] **Ear-Training Gating**: IPA options only appear after "Hear it!" is clicked
- [ ] **Speed Rounds**: Timer works, bonus coins awarded for fast answers
- [ ] **Fix-Up Mode**: Struggling words identified and practiced
- [ ] **Sound Controls**: Volume slider and mute button functional
- [ ] **Dyslexia Toggle**: Font changes globally
- [ ] **Sound Gate**: One-time prompt on first load
- [ ] **Streak Tracking**: Consecutive correct answers tracked
- [ ] **TTS**: Word pronunciation, meaning reading, IPA sounds work
- [ ] **Parent Report**: Mini-report generates correctly

### 6. Accessibility
- [ ] **Keyboard Navigation**: Tab through all 3 options
- [ ] **Enter/Space**: Activate selected option
- [ ] **Aria Labels**: Each button has clear label ("Option 1: [text]")
- [ ] **Screen Reader**: Announces correct/wrong feedback
- [ ] **Focus Management**: Focus order is logical
- [ ] **Touch Targets**: All buttons 64px minimum height

### 7. Edge Cases
- [ ] **First Word**: Picture placeholder shows correctly on first load
- [ ] **Last Word**: Completion screen still works
- [ ] **Rapid Clicking**: Buttons disable after selection
- [ ] **Multiple Images**: Different words can have different images
- [ ] **Image Removal**: Removing image doesn't break subsequent uploads
- [ ] **Large Images**: 4K images scale properly
- [ ] **Mobile Safari**: File picker works on iOS
- [ ] **Page Refresh**: Images persist across refreshes
- [ ] **localStorage Full**: Graceful degradation if storage quota exceeded

### 8. Performance
- [ ] **Confetti Animation**: Smooth 60fps animation
- [ ] **Image Loading**: No lag when displaying uploaded images
- [ ] **Option Rendering**: 3 options render instantly
- [ ] **No Memory Leaks**: Blob URLs revoked when images removed

### 9. Visual Regression
- [ ] **Card Flip**: Still animates smoothly
- [ ] **Timer Bar**: Speed round timer displays correctly
- [ ] **Mastery Badge**: Still shows at top
- [ ] **Reveal Phase**: Back of card unchanged
- [ ] **Spacing**: No layout shifts with horizontal options

### 10. Browser Compatibility
- [ ] **Chrome Desktop**: All features work
- [ ] **Safari Desktop**: All features work
- [ ] **Firefox Desktop**: All features work
- [ ] **Chrome Mobile**: Touch targets work well
- [ ] **Safari iOS**: File upload works, confetti smooth
- [ ] **Chrome Android**: All interactive elements functional

---

## 🐛 Known Issues to Watch For
- **Confetti Performance**: Monitor frame rate on older devices
- **localStorage Quota**: Watch for quota exceeded errors with many images
- **Blob URL Memory**: Ensure URLs are revoked to prevent leaks
- **Horizontal Overflow**: Test on very small screens (< 320px)

---

## 📸 Screenshot Checklist
- [ ] Placeholder with no image
- [ ] Image uploaded and displayed
- [ ] 3 options in horizontal layout (mobile)
- [ ] 3 options in horizontal layout (desktop)
- [ ] Confetti burst mid-animation
- [ ] Cheer message overlay
- [ ] Focus ring on option button

---

## 🚀 Deployment Notes
- Bundle size increased by ~5KB (acceptable for new features)
- No external dependencies added
- All code TypeScript strict mode compliant
- localStorage keys use versioned naming (future-proof)

---

**Tester**: _________________  
**Date**: _________________  
**Device/Browser**: _________________  
**Build Version**: _________________  
**Result**: ☐ Pass ☐ Fail  
**Notes**:
