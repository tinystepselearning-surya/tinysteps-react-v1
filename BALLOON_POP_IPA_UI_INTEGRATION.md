# Balloon Pop IPA – UI Integration Guide

## ✅ Completed (Engine & Data)

### 1. Data Layer (`phoneme-data.ts`)
- Added `MINIMAL_PAIRS` array with 17 phoneme pairs (p/b, t/d, θ/ð, etc.)
- Added `TRICKY_WORDS` array with 12 tricky words + rhyme anchors
- Exported `getMinimalPairs()` and `getTrickyWords()` helpers

### 2. Engine (`engine.ts`)
- **minimalPair(pairData, pool)**: Generates minimal pair rounds
  - Prompt: audio of targetA
  - Choices: [A, B, +2 neutral fillers] from pool
  - Returns `RoundSpec` with `bonusStreakThreshold: 2000` (ms)
  - Award +2 streak if correct < 2s
  
- **trickyRhyme(trickyData)**: Generates tricky rhyme rounds
  - Prompt: word + audio
  - Choices: rhymeAnchors (text)
  - All anchors are correct (multi-select)
  - Returns `rhymeCard: { word, rhymes }` for UI display

- **selectRound(phase, learner, category)**: Phase-based round generator
  - P1: audioOnly → IPA choices
  - P2: letterToIPA
  - P3-4: graphemeToIPA
  - P5-6: ipaToGrapheme (multi-select)
  - **Injects minimalPair or trickyRhyme every 6–8 questions** (50/50 random)

- **resetQuestionCounter()**: Export to reset injection counter on game start

### 3. Types (`types.ts`)
- `PromptType`: added `'minimalPair'` and `'trickyRhyme'`
- `Phase`: 1 | 2 | 3 | 4 | 5 | 6
- `RoundSpec`: includes prompt + choices + correctIds
- `LearnerState`: phase, level, mastery, confusionMatrix, avgResponseMs, recent

---

## 🚧 TODO: UI Integration (`BalloonPopIPA.tsx`)

### Step 1: Replace Question Generation
**Current:**
```tsx
import { generateQuestion, recordResult, nextLevelConfig } from './engine';
const q = generateQuestion(pool);
```

**New:**
```tsx
import { selectRound, resetQuestionCounter, nextLevelConfig } from './engine';
import type { Phase, LearnerState, RoundSpec } from './types';

// Build learner state from session
const learner: LearnerState = {
  phase: currentPhase,
  level: session.level,
  mastery: session.mastery,
  confusionMatrix: {},
  avgResponseMs: 2000,
  recent: []
};

const round = selectRound(currentPhase, learner, category);
```

### Step 2: Add Phase State & Tabs
```tsx
const [currentPhase, setCurrentPhase] = useState<Phase>(1);

// Phase unlock logic
const isPhaseUnlocked = (phase: Phase): boolean => {
  if (phase === 1) return true;
  return mastered.length >= 5; // Unlock when 5+ phonemes mastered
};

// Render tabs
{([1, 2, 3, 4, 5, 6] as Phase[]).map(phase => (
  <button
    key={phase}
    onClick={() => isPhaseUnlocked(phase) && setCurrentPhase(phase)}
    disabled={!isPhaseUnlocked(phase)}
    className={active ? 'bg-purple-600 text-white' : unlocked ? 'bg-white' : 'bg-gray-200'}
  >
    {isPhaseUnlocked(phase) ? `P${phase}` : `🔒 P${phase}`}
  </button>
))}
```

### Step 3: Handle All Prompt Types
Create `<PromptDisplay round={round} />` component:

```tsx
function PromptDisplay({ round }: { round: RoundSpec }) {
  const { promptType, prompt } = round;
  
  return (
    <div className="prompt-card">
      {promptType === 'audioOnly' && (
        <>
          <p>Listen and find:</p>
          <button>🔊</button>
          <small>Audio: {prompt.audioKey}</small>
        </>
      )}
      
      {promptType === 'letterToIPA' && (
        <>
          <p>Find the sound in:</p>
          <div className="text-5xl">{prompt.letter}</div>
          <p>Target: {prompt.ipa}</p>
        </>
      )}
      
      {promptType === 'graphemeToIPA' && (
        <>
          <p>Find the sound for:</p>
          <div className="text-5xl">{prompt.grapheme}</div>
          <p>Target IPA: {prompt.ipa}</p>
        </>
      )}
      
      {promptType === 'ipaToGrapheme' && (
        <>
          <p>Find all spellings for:</p>
          <div className="text-5xl">{prompt.ipa}</div>
          <small>(Select all correct, then click Check)</small>
        </>
      )}
      
      {promptType === 'trickyRhyme' && (
        <>
          <p>Find words that rhyme with:</p>
          <div className="text-5xl">{prompt.letter}</div>
          <button>🔊</button>
          <small>(Select all that rhyme, then click Check)</small>
        </>
      )}
      
      {promptType === 'minimalPair' && (
        <>
          <p>Minimal Pair Challenge!</p>
          <button>🔊</button>
          <small>Listen carefully: {prompt.audioKey}</small>
          <small className="text-orange-600">🔥 Answer under 2s for +2 streak bonus!</small>
        </>
      )}
    </div>
  );
}
```

### Step 4: Multi-Select for ipaToGrapheme & trickyRhyme
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const handleBalloonClick = (balloon: BalloonData) => {
  if (!round) return;
  
  const isMultiSelect = round.promptType === 'ipaToGrapheme' || round.promptType === 'trickyRhyme';
  
  if (isMultiSelect) {
    // Toggle selection
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(balloon.id)) next.delete(balloon.id);
      else next.add(balloon.id);
      return next;
    });
  } else {
    // Single select: immediate validate
    setPoppedIds(prev => new Set(prev).add(balloon.id));
    validateAnswer([balloon.id], responseMs);
  }
};

// Check button (show when selectedIds.size > 0 and multi-select mode)
{round && (round.promptType === 'ipaToGrapheme' || round.promptType === 'trickyRhyme') && selectedIds.size > 0 && (
  <motion.button
    onClick={() => validateAnswer(Array.from(selectedIds), responseMs)}
    className="fixed bottom-20 bg-green-600 text-white px-8 py-4 rounded-full"
  >
    ✓ Check Answer ({selectedIds.size} selected)
  </motion.button>
)}
```

### Step 5: Validate Answer Logic
```tsx
const validateAnswer = (pickedIds: string[], responseMs: number) => {
  if (!round) return;
  
  const pickedTexts = pickedIds.map(id => balloons.find(b => b.id === id)?.text).filter(Boolean);
  const allCorrect = round.correctIds.every(c => pickedTexts.includes(c)) && 
                     pickedTexts.every(t => round.correctIds.includes(t));
  
  if (allCorrect) {
    dispatchCorrect(round.prompt.targetId);
    playSound('correct');
    if (!prefersReducedMotion) fireConfetti();
    
    // Bonus streak for minimalPair < 2s
    const bonusThreshold = (round as any).bonusStreakThreshold;
    if (bonusThreshold && responseMs < bonusThreshold) {
      dispatchCorrect(round.prompt.targetId); // +2 streak
    }
    
    // Show rhyme card if trickyRhyme
    const rhymeCardData = (round as any).rhymeCard;
    if (rhymeCardData) setRhymeCard(rhymeCardData);
    
    setTimeout(() => generateNewRound(), 3000);
  } else {
    dispatchWrong(round.prompt.targetId);
    playSound('wrong');
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }
};
```

### Step 6: Rhyme Card Display
```tsx
const [rhymeCard, setRhymeCard] = useState<{ word: string; rhymes: string[] } | null>(null);

<AnimatePresence>
  {rhymeCard && (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-6"
    >
      <h3>{rhymeCard.word} → rhymes:</h3>
      <div className="flex flex-wrap gap-2">
        {rhymeCard.rhymes.map(r => (
          <span key={r} className="px-3 py-1 bg-purple-100 rounded-full">{r}</span>
        ))}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### Step 7: Balloon Selection Visual Feedback
```tsx
// In Balloon component
<motion.button
  className={`... ${isSelected ? 'ring-8 ring-yellow-400 scale-105' : 'focus:ring-yellow-400'}`}
  aria-label={`Balloon ${index + 1}: ${balloon.text}, press to ${isSelected ? 'deselect' : 'select'}`}
>
  {balloon.text}
</motion.button>
```

### Step 8: Init & Cleanup
```tsx
useEffect(() => {
  initSounds();
  resetQuestionCounter(); // Reset injection counter on mount
}, []);
```

---

## 🎯 Acceptance Criteria

- [ ] P1–P6 tabs render with lock icons; unlock when mastered ≥ 5 phonemes
- [ ] All 6 prompt types render correctly:
  - [ ] audioOnly
  - [ ] letterToIPA
  - [ ] graphemeToIPA
  - [ ] ipaToGrapheme
  - [ ] trickyRhyme
  - [ ] minimalPair
- [ ] Multi-select works for ipaToGrapheme & trickyRhyme
- [ ] "Check Answer" button appears for multi-select modes
- [ ] Rhyme card displays after trickyRhyme success
- [ ] +2 streak bonus awarded for minimalPair < 2s
- [ ] Centered confetti fires for 2.5s on correct
- [ ] Focus rings on all interactive elements
- [ ] Reduced motion respected (useReducedMotion())
- [ ] Special rounds inject every 6–8 questions
- [ ] Keyboard support: 1–8 for balloons, Enter for Check

---

## 📦 Build Status
✅ Engine compiles with no TypeScript errors
✅ Build succeeds: `npm run build` → 990.96 kB (gzip: 276.14 kB)

---

## 🔊 Audio Integration (Future)
For Phase 1 (audioOnly), minimalPair, and trickyRhyme prompts:
- Use `prompt.audioKey` to look up audio file
- Play on prompt mount or via 🔊 button click
- Integrate with existing `sfx.ts` or extend with howler.js

---

## 🎨 UI Polish Checklist
- [ ] Smooth transitions between phases
- [ ] Balloon selection ring animation
- [ ] Rhyme card slide-up animation
- [ ] Bonus streak particle effect or toast
- [ ] Phase progression celebration
- [ ] Responsive layout for mobile (tab overflow scroll)

---

**Next Steps:**
1. Manually update `BalloonPopIPA.tsx` following Steps 1–8 above
2. Test each prompt type in browser
3. Verify multi-select Check button flow
4. Add audio playback for audioOnly/minimalPair/trickyRhyme
5. Polish animations and accessibility
6. Run full acceptance criteria checklist
