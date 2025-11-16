# Phase 4 Games — UX/Accessibility Enhancements

## Micro-interactions
- correctFeedback: bounce + confetti, sound `ding.mp3`, duration 800ms, auto-advance next question after 2s delay.
- incorrectFeedback: shake + fade red background, sound `buzz.mp3`, duration 500ms, message “Not quite. Try again!”, show hint after 2s, enable retry button.
- loading: spinning circle with progress %, message “Generating words…”, timeout 5s then fallback “Use cached words”.
- levelUp: particle explosion, sound `success.mp3`, duration 2000ms, message “🎉 You advanced to Level 2!”, confetti true, nextAction: show level 2 intro.
- streakCounter: number increases with scale, subtle ding per correct, persistent top-right, color golden yellow, celebrate at [3, 5, 10, 25, 50].

## Accessibility Features
- screenReader: ARIA labels for all interactive elements (e.g., `role="application" aria-label="SpellBee Spelling Game"`, `aria-label="Type your spelling answer" aria-required="true"`, `aria-label="Check answer" role="button"`, `aria-live="polite" aria-atomic="true"` for score).
- keyboardNavigation: Tab/Shift+Tab to move, Enter to submit, Space to toggle, Escape to close, ArrowKeys to navigate maze/grid.
- visualAccessibility: High contrast option (bg #000, text #FFF, buttons #FFFF00, focusRing #00FF00 3px solid); min font 16px, scalable to 200%; color-blind safe (don’t rely on color, add patterns).
- cognitiveAccessibility: Simple language, specific error messages, age-appropriate reading level; reducedMotion option (confetti disabled, simplified animations, instant transitions).
