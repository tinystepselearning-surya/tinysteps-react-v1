# Game Engine & Adaptive Learning System

Complete game engine with state management, event telemetry, adaptive learning policy, and Firestore integration for Tinysteps phonics games.

## Architecture

```
src/engine/
├── types.ts                    # Core type definitions
├── core/
│   └── GameEngine.ts          # State machine + event bus
├── adaptive/
│   └── policy.ts              # Item selection + difficulty caps
├── catalog/
│   └── phonicsTaxonomy.ts     # Skill taxonomy (SAT, digraphs)
└── providers/
    └── firestoreProgress.ts   # Firestore write operations

src/hooks/
├── useBalloonEngine.ts        # Game engine hook with callbacks
└── useStudentSummary.ts       # Real-time summary subscription

functions/src/
└── onSessionCreate.ts         # Cloud Function for aggregation
```

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
npm install firebase

# Cloud Functions
cd functions
npm install firebase-functions firebase-admin
```

### 2. Deploy Firestore Configuration

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy Cloud Functions
firebase deploy --only functions:onSessionCreate
```

### 3. Use in Your Game

```typescript
import { useBalloonEngine } from "@/hooks/useBalloonEngine";
import { Item } from "@/engine/types";

function BalloonPopGame() {
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  
  const itemPool: Item[] = [
    {
      id: "item-s-01",
      skillId: "phonics.sat.s",
      kind: "audio",
      prompt: "/audio/phonemes/s.mp3",
      choices: ["s", "sh", "z"],
      answerIndex: 0,
      difficulty: "easy"
    },
    // ... more items
  ];

  const { startRound, choose, getCurrentItem } = useBalloonEngine({
    uid: user.uid,
    studentId: student.id,
    gameId: "balloon-pop-p2",
    phase: 2,
    ageYears: 5,
    itemPool,
    onRoundStart: (item) => {
      setCurrentItem(item);
      // Play audio, spawn balloons, etc.
    },
    onChoice: (correct, timeMs, firstTry) => {
      if (correct) {
        // Pop balloon, show success animation
      } else {
        // Show retry prompt
      }
    },
    onAssist: (hint) => {
      if (hint === "highlight") {
        // Glow the correct balloon
      }
    },
    onSessionEnd: (scorePct) => {
      // Show results screen
      console.log(`Session complete! Score: ${scorePct}%`);
    }
  });

  return (
    <div>
      <button onClick={startRound}>Start Game</button>
      {currentItem && (
        <div>
          {currentItem.choices.map((choice, i) => (
            <button key={i} onClick={() => choose(i)}>
              {choice}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Core Concepts

### GameEngine

The `GameEngine` class manages game state and emits events:

**Methods:**
- `startRound()` - Begin a new round with adaptive item selection
- `choose(index)` - Submit player's choice
- `endSession()` - Finalize session and trigger Firestore write
- `getSession()` - Get complete session data
- `getCurrentItem()` - Get current item being played

**Events:**
- `ROUND_START` - New item presented
- `CHOICE` - Player made a choice (correct/incorrect)
- `ASSIST` - Assistance triggered (highlight, replay, etc.)
- `ROUND_END` - Round completed successfully
- `SESSION_END` - Session finished with final score

### Adaptive Policy

Smart item selection based on:
1. **Weakest Skills** - Prioritize skills with low mastery
2. **Confusion Sets** - Practice similar sounds (s vs sh)
3. **Spaced Repetition** - Avoid immediate repeats
4. **Age/Phase Caps** - Adjust difficulty and speed

**Functions:**
- `phaseSpeedCapMs(phase, age)` - Calculate minimum response time
- `optionsPerRound(phase)` - Determine number of choices (3-5)
- `selectNextItem(context)` - Adaptive item picker

### Firestore Integration

**Write Path:**
1. Player completes game → `GameEngine` emits `SESSION_END`
2. `writeSession()` writes to `students/{sid}/sessions/{sessionId}`
3. Cloud Function `onSessionCreate` triggers
4. Updates `students/{sid}/progress/{gameId}` with new mastery
5. Aggregates to `students/{sid}/summary/overall`

**Read Path:**
```typescript
const { summary, loading } = useStudentSummary(studentId);
// summary.masteryPct.phonics
// summary.weakestSkills
```

## Adaptive Learning

### Mastery Progression

```
not_started (0%) 
    ↓ score < 60%
emerging (25%)
    ↓ score 60-79%
developing (50%)
    ↓ score 80%+
proficient (75%)
    ↓ score 80%+ consistently
mastered (100%)
```

### Speed Caps (Age-Adjusted)

| Phase | Age ≤5 | Age 6-7 | Age 8+ |
|-------|--------|---------|--------|
| 1-2   | 2400ms | 2200ms  | 2000ms |
| 3-4   | 2000ms | 1800ms  | 1600ms |
| 5+    | 1600ms | 1400ms  | 1200ms |

### Options Per Round

| Phase | Choices |
|-------|---------|
| 1-2   | 3       |
| 3-4   | 4       |
| 5+    | 5       |

## Security

### Firestore Rules

- **Students**: Read by admin/teacher/parent, write by admin/teacher
- **Sessions**: Create by student (own uid), read by admin/teacher/parent
- **Progress**: Write by admin/teacher (via Cloud Functions)
- **Games/Items**: Read public, write admin

### Custom Claims

Set user roles via Firebase Admin:

```typescript
// Server-side
await admin.auth().setCustomUserClaims(uid, { role: 'teacher' });
```

Roles: `admin`, `teacher`, `parent`, `kid`

## Cloud Functions

### onSessionCreate

Triggered when a new session is written. Performs:

1. **Calculate Metrics**
   - Score band (0-20, 21-40, etc.)
   - Mastery delta (+1, 0, -1)

2. **Update Progress**
   - Advance/retreat mastery level
   - Update streak counter
   - Record last played timestamp

3. **Aggregate Summary**
   - Compute average mastery per skill area
   - Identify weakest skills
   - Update summary document

## Example: Balloon Pop IPA Integration

```typescript
// Item pool for Phase 2 (s/a/t)
const satItems: Item[] = [
  {
    id: "sat-s-01",
    skillId: "phonics.sat.s",
    kind: "audio",
    prompt: "/audio/phonemes/s.mp3",
    choices: ["s", "sh", "z"],
    answerIndex: 0,
    difficulty: "easy"
  },
  {
    id: "sat-a-01",
    skillId: "phonics.sat.a",
    kind: "audio",
    prompt: "/audio/phonemes/a.mp3",
    choices: ["a", "ɒ", "ʌ"],
    answerIndex: 0,
    difficulty: "easy"
  },
  // ... more items
];

// In component
const engine = useBalloonEngine({
  uid: currentUser.uid,
  studentId: currentStudent.id,
  gameId: "balloon-pop-ipa-p2",
  phase: 2,
  ageYears: 5,
  itemPool: satItems,
  onRoundStart: (item) => {
    playAudio(item.prompt);
    spawnBalloons(item.choices);
  },
  onChoice: (correct, timeMs, firstTry) => {
    if (correct && firstTry) {
      showConfetti();
    }
  },
  onAssist: (hint) => {
    if (hint === "highlight") {
      glowCorrectBalloon();
    }
  },
  onSessionEnd: (scorePct) => {
    showResultsScreen(scorePct);
  }
});
```

## Skill Taxonomy

Define skills in `src/engine/catalog/`:

```typescript
export const phonicsSAT: SkillNode[] = [
  {
    id: "phonics.sat.s",
    area: "phonics",
    phase: 2,
    label: "/s/",
    confusionWith: ["sh", "z"]
  },
  // ... more skills
];
```

**Confusion Sets** enable targeted practice when students mix up similar sounds.

## Testing

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start

# Update environment to use emulators
// src/firebase.ts
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Test Data

```typescript
// Create test student
const testStudent = {
  name: "Test Child",
  ageYears: 5,
  parentIds: [testParentUid],
  teacherId: testTeacherUid,
  createdAt: Date.now(),
  updatedAt: Date.now()
};
await setDoc(doc(db, "students/test-child-1"), testStudent);
```

## Deployment Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Deploy Cloud Functions: `firebase deploy --only functions`
- [ ] Set custom claims for admin/teacher accounts
- [ ] Create initial games collection documents
- [ ] Populate items collection with question bank
- [ ] Test with sample student account

## Roadmap

- [ ] Implement spaced repetition algorithm (Leitner system)
- [ ] Add confusion set tracking in Cloud Functions
- [ ] Build parent/teacher dashboard with progress charts
- [ ] Integrate with existing phase journey UI
- [ ] Add streak badges and achievements
- [ ] Implement AI-powered difficulty adjustment
- [ ] Export progress reports as PDF

## License

Proprietary - Tinysteps eLearning
