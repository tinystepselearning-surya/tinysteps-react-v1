# Global UX & Perf Pack - Implementation Guide

## ✅ Shared Utilities Created (7 files)

### 1. `/src/games/shared/sound.ts` (119 lines)
- Sound config management per game
- Pre-warm audio context on first interaction
- Volume control (0-1 scale)
- Mute toggle
- TTS with volume integration

### 2. `/src/games/shared/storage.ts` (41 lines)
- Debounced localStorage writes (150ms)
- Prevents UI jank from excessive writes
- Immediate save option for critical data
- Flush pending writes on unmount

### 3. `/src/games/shared/accessibility.ts` (48 lines)
- aria-live announcer creation
- Dyslexia-friendly font preference
- Apply font globally

### 4. `/src/games/shared/SoundControl.tsx` (68 lines)
- Volume slider component
- Mute button
- Integrates with sound config

### 5. `/src/games/shared/SoundGate.tsx` (60 lines)
- One-time "Enable Sound?" toast
- Pre-warms audio on enable
- Auto-dismisses after first interaction

### 6. `/src/games/shared/DyslexiaToggle.tsx` (33 lines)
- Toggle button for dyslexia font
- Persists preference
- Applies globally

### 7. `/src/index.css` (patch)
- Added `slide-up` animation for sound gate

---

## 🎯 Per-Game Patches Required

### Game 1: SpellBee Flash (`/src/games/spellbee-flash/`)

**Files to modify:**
1. **SpellBeeFlash.tsx** (main component)
2. **HUD.tsx** (add sound + dyslexia controls)
3. **utils.ts** (replace localStorage with debounced storage)

**Changes:**
```typescript
// SpellBeeFlash.tsx
import SoundGate from "../shared/SoundGate";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

// Add in component:
const announcerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  announcerRef.current = createAnnouncer();
  document.body.appendChild(announcerRef.current);
  return () => {
    if (announcerRef.current) {
      document.body.removeChild(announcerRef.current);
    }
    flushPending();
  };
}, []);

// In render:
<SoundGate gameSlug="spellbee-flash" />
<div ref={announcerRef} /> // Already exists as announcer

// On correct/wrong:
announce(announcerRef.current, correct ? "Correct!" : "Try again!");
```

```typescript
// HUD.tsx
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";

// Add to HUD render (top-right controls):
<div className="flex items-center gap-2">
  <DyslexiaToggle />
  <SoundControl gameSlug="spellbee-flash" />
  {/* existing buttons */}
</div>
```

```typescript
// utils.ts - Replace all localStorage.setItem with:
import { debouncedSave, loadData } from "../shared/storage";

export function saveProgress(data: ProgressData): void {
  debouncedSave("spellbee-progress-v1", data);
}

export function getProgress(): ProgressData {
  return loadData("spellbee-progress-v1", defaultProgress);
}
```

**Accessibility:**
- Add `focus:ring-2 focus:ring-blue-500` to all interactive elements
- Ensure all buttons have `min-h-[64px]` or `min-w-[64px]`
- Add aria-labels where missing

---

### Game 2: Meaning-Match (`/src/games/meaning-match/`)

**Files to modify:**
1. **MeaningMatch.tsx**
2. **utils.ts**

**Changes:**
```typescript
// MeaningMatch.tsx
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";
import { speak } from "../shared/sound";

// Add announcer + cleanup
const announcerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  announcerRef.current = createAnnouncer();
  document.body.appendChild(announcerRef.current);
  return () => {
    if (announcerRef.current) document.body.removeChild(announcerRef.current);
    flushPending();
  };
}, []);

// Add to header:
<div className="flex gap-2">
  <DyslexiaToggle />
  <SoundControl gameSlug="meaning-match" />
</div>

<SoundGate gameSlug="meaning-match" />

// Replace speakText with:
speak("meaning-match", text);

// On match result:
announce(announcerRef.current, isCorrect ? "Correct match!" : "Try again!");
```

```typescript
// utils.ts
import { debouncedSave, loadData } from "../shared/storage";

export function saveWordStats(stats: WordStats): void {
  debouncedSave("meaning-match-stats-v1", stats);
}

export function getWordStats(): WordStats {
  return loadData("meaning-match-stats-v1", {});
}
```

**Focus rings:** Add to all draggable/droppable elements

---

### Game 3: Balloon-Pop (`/src/games/balloon-pop/`)

**Files to modify:**
1. **BalloonPop.tsx**
2. **utils.ts**

**Changes:**
```typescript
// BalloonPop.tsx
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

// Add announcer
const announcerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  announcerRef.current = createAnnouncer();
  document.body.appendChild(announcerRef.current);
  return () => {
    if (announcerRef.current) document.body.removeChild(announcerRef.current);
    flushPending();
  };
}, []);

// Ensure rAF cleanup (already exists, verify):
useEffect(() => {
  let animFrame: number | null = null;
  const animate = () => {
    // ... animation logic
    animFrame = requestAnimationFrame(animate);
  };
  animate();
  
  return () => {
    if (animFrame) cancelAnimationFrame(animFrame);
  };
}, []);

// Add controls to HUD
<div className="flex gap-2">
  <DyslexiaToggle />
  <SoundControl gameSlug="balloon-pop" />
</div>

<SoundGate gameSlug="balloon-pop" />

// On balloon pop:
announce(announcerRef.current, correct ? "Correct! +2 coins" : "Oops! Try again");
```

```typescript
// utils.ts
import { debouncedSave, loadData } from "../shared/storage";
import { speak } from "../shared/sound";

export function saveStats(stats: Stats): void {
  debouncedSave("balloon-pop-stats-v1", stats);
}

export function speakWord(word: string): void {
  speak("balloon-pop", word);
}
```

**Performance:** Verify all rAF use `performance.now()` deltas (already implemented)

---

### Game 4: Quick Meaning Quiz (`/src/games/quick-meaning-quiz/`)

**Files to modify:**
1. **QuickMeaningQuiz.tsx**
2. **utils.ts**

**Changes:**
```typescript
// QuickMeaningQuiz.tsx
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

// Add announcer + cleanup
const announcerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  announcerRef.current = createAnnouncer();
  document.body.appendChild(announcerRef.current);
  return () => {
    if (announcerRef.current) document.body.removeChild(announcerRef.current);
    flushPending();
  };
}, []);

// Add to HUD component
<div className="flex gap-2">
  <DyslexiaToggle />
  <SoundControl gameSlug="quick-meaning" />
</div>

<SoundGate gameSlug="quick-meaning" />

// Timer cleanup (verify exists):
useEffect(() => {
  const timer = setInterval(/* ... */);
  return () => clearInterval(timer);
}, []);

// On answer:
announce(announcerRef.current, correct ? "Correct! Well done!" : "Not quite!");
```

```typescript
// utils.ts
import { debouncedSave, loadData } from "../shared/storage";
import { speak } from "../shared/sound";

export function saveStats(stats: SessionStats): void {
  debouncedSave("quick-meaning-stats-v1", stats);
}

export function speakText(text: string): void {
  speak("quick-meaning", text);
}
```

---

### Game 5: Boss Level (`/src/games/boss-level/`)

**Files to modify:**
1. **BossLevel.tsx**
2. **utils.ts**
3. **rounds.tsx** (ensure rAF cleanup in BalloonPopLite)

**Changes:**
```typescript
// BossLevel.tsx
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce as announceA11y } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

// Add announcer (already has announceRef, enhance):
useEffect(() => {
  announceRef.current = createAnnouncer();
  document.body.appendChild(announceRef.current);
  return () => {
    if (announceRef.current) document.body.removeChild(announceRef.current);
    flushPending();
  };
}, []);

// Update HUD to include controls
// In HUD.tsx:
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";

<div className="flex gap-2">
  <DyslexiaToggle />
  <SoundControl gameSlug="boss-level" />
</div>

<SoundGate gameSlug="boss-level" />

// Replace announce with announceA11y
announceA11y(announceRef.current, message);
```

```typescript
// utils.ts
import { debouncedSave, loadData } from "../shared/storage";
import { speak } from "../shared/sound";

// Replace all debouncedSave calls with shared version
export function saveBossStats(stats: BossStats): void {
  debouncedSave("boss-level-stats-v1", stats);
}

export function speakText(text: string): void {
  speak("boss-level", text);
}
```

```typescript
// rounds.tsx - BalloonPopLite
// Verify rAF cleanup:
useEffect(() => {
  let frame: number | null = null;
  const animate = () => {
    // ... logic
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  
  return () => {
    if (frame) cancelAnimationFrame(frame);
  };
}, []);
```

---

## 🚀 Implementation Strategy

### Phase 1: Verify Shared Utilities ✅
- [x] Create `/src/games/shared/sound.ts`
- [x] Create `/src/games/shared/storage.ts`
- [x] Create `/src/games/shared/accessibility.ts`
- [x] Create `/src/games/shared/SoundControl.tsx`
- [x] Create `/src/games/shared/SoundGate.tsx`
- [x] Create `/src/games/shared/DyslexiaToggle.tsx`
- [x] Add animations to `/src/index.css`

### Phase 2: Apply Patches (Game-by-Game)
- [ ] SpellBee Flash (3 files)
- [ ] Meaning-Match (2 files)
- [ ] Balloon-Pop (2 files)
- [ ] Quick Meaning Quiz (2 files)
- [ ] Boss Level (3 files)

### Phase 3: Test & Verify
- [ ] Build passes (TypeScript strict)
- [ ] Sound gate appears on first load
- [ ] Volume control works
- [ ] Mute toggle persists
- [ ] Dyslexia font applies globally
- [ ] localStorage writes are debounced
- [ ] Focus rings visible on keyboard nav
- [ ] aria-live announcements work
- [ ] All timers/rAF clean up on unmount

### Phase 4: Commit & Push
- [ ] Single commit with all UX improvements
- [ ] Detailed commit message
- [ ] Push to GitHub

---

## 📊 Impact Summary

**Added:**
- 7 shared utility files (~370 lines)
- Sound gate toast (one-time prompt)
- Volume/mute controls (per game)
- Dyslexia font toggle (global)
- Debounced localStorage (150ms)
- aria-live announcements
- Focus ring enforcement

**Per-Game Changes:**
- ~30-50 lines per game
- All imports point to `../shared/*`
- No external dependencies
- TypeScript strict mode maintained

**Bundle Size Impact:**
- Shared utilities: ~5-7 KB (gzipped)
- Per-game overhead: <1 KB each
- Total: +10-15 KB to bundle (acceptable)

---

## 🎯 Next Steps

**Option A: Apply All Patches Now**
I'll systematically patch all 5 games in sequence, verify build, then commit.

**Option B: Selective Patching**
Apply to specific games first (e.g., SpellBee Flash + Boss Level), test, then expand.

**Option C: Manual Review**
Provide full diff patches for each game, you review and approve before application.

**Recommendation:** Option A for consistency, but can pause after each game for verification.

Which approach would you prefer?
