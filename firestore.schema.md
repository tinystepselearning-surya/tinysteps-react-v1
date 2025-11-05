# Firestore Schema Documentation

## Collections

### `/users/{uid}`
User account information (parents, teachers, admins, kids).

**Fields:**
- `displayName`: string
- `role`: "admin" | "teacher" | "parent" | "kid"
- `email`: string
- `phoneNumber`: string (optional)
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Parent-specific fields:**
- `childIds`: string[] - Array of student IDs this parent has access to
- `subscription`: "free" | "basic" | "premium"
- `preferredLanguage`: string (default: "en")

**Teacher-specific fields:**
- `specialization`: string[] - Array of subjects (e.g., ["phonics", "grammar"])
- `yearsOfExperience`: number
- `studentIds`: string[] - Array of student IDs assigned to this teacher

**Security:**
- Read: Self or admin
- Write: Self or admin

---

### `/users/{uid}/summary/{docId}`
Aggregated user learning summary (maintained by Cloud Functions).

**Fields:**
- `lastUpdated`: number (timestamp)
- `masteryPct`: { phonics, grammar, speaking, spellbee }
- `weakestSkills`: string[] (skill IDs needing practice)

**Security:**
- Read: Self or admin
- Write: Admin only (Cloud Functions)

---

### `/students/{id}`
Student profile (PII protected). Links to parents via `parentIds` array.

**Fields:**
- `name`: string - Full name
- `displayName`: string - Preferred name
- `ageYears`: number
- `gender`: "male" | "female" | "other"
- `grade`: string (e.g., "Pre-K", "Kindergarten", "1st Grade")
- `parentIds`: string[] - Array of parent user IDs who have access
- `teacherId`: string - Assigned teacher's user ID
- `enrolledCourses`: string[] - Courses student is enrolled in (["phonics", "grammar", "speaking", "spellbee"])
- `currentPhase`: number (0-10) - Current phonics phase
- `avatarUrl`: string - Profile picture URL
- `preferredSubjects`: string[] - Student's favorite subjects
- `learningStyle`: "visual" | "auditory" | "kinesthetic" | "mixed"
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Security:**
- Read: Admin, assigned teacher, or parent (via parentIds)
- Create: Admin or teacher
- Update/Delete: Admin or assigned teacher

---

### `/students/{id}/progress/{gameId}`
Per-game progress tracking.

**Fields:**
- `mastery`: "not_started" | "emerging" | "developing" | "proficient" | "mastered"
- `streak`: number (consecutive successful sessions)
- `lastPlayedAt`: number (timestamp)
- `scoreBand`: "0-20" | "21-40" | "41-60" | "61-80" | "81-100"

**Security:**
- Read: Admin, teacher, or parent
- Write: Admin or teacher (updated by Cloud Functions)

---

### `/students/{id}/sessions/{sessionId}`
Individual game session records (immutable).

**Fields:**
- `id`: string (session UUID)
- `uid`: string (user ID who played)
- `gameId`: string
- `phase`: 1-10
- `startedAt`: number (timestamp)
- `endedAt`: number (timestamp)
- `itemsServed`: string[] (item IDs in order)
- `attempts`: Attempt[]
  - `itemId`: string
  - `correct`: boolean
  - `firstTry`: boolean
  - `timeMs`: number
  - `assistanceUsed`: boolean (optional)
  - `ts`: number (timestamp)
- `scorePct`: number (0-100)
- `masteryDelta`: number (+/- mastery change)

**Security:**
- Read: Admin, teacher, or parent
- Create: User who owns the session (uid matches auth.uid)
- Update: Immutable (no updates allowed)

---

### `/students/{id}/summary/{docId}`
Student-level aggregated summary (maintained by Cloud Functions).

**Fields:**
- Same as user summary
- `lastUpdated`: timestamp
- `masteryPct`: { phonics, grammar, speaking, spellbee }
- `weakestSkills`: string[]

**Security:**
- Read: Admin, teacher, or parent
- Write: Admin only (Cloud Functions)

---

### `/games/{id}`
Game metadata catalog.

**Fields:**
- `id`: string
- `slug`: string
- `title`: string
- `phase`: 1-10
- `area`: "phonics" | "grammar" | "speaking" | "spellbee"
- `ageMin`: number
- `ageMax`: number
- `durationMin`: number
- `difficulty`: "easy" | "med" | "hard"
- `thumbnailUrl`: string
- `badges`: string[]
- `status`: "live" | "beta" | "coming_soon"
- `featured`: boolean

**Security:**
- Read: Public
- Write: Admin only

---

### `/items/{id}`
Game item bank (questions/prompts).

**Fields:**
- `id`: string
- `skillId`: string (links to SkillNode)
- `kind`: "audio" | "image" | "text"
- `prompt`: string (URL or text)
- `choices`: string[]
- `answerIndex`: number
- `meta`: Record<string, any>
- `difficulty`: "easy" | "med" | "hard"

**Security:**
- Read: Public
- Write: Admin only

---

## Indexes

### Sessions Index
**Collection Group:** `sessions`
**Fields:**
- `uid` (ASC)
- `gameId` (ASC)
- `startedAt` (DESC)

**Use Case:** Query user's recent sessions for a specific game.

### Progress Index
**Collection Group:** `progress`
**Fields:**
- `mastery` (ASC)
- `lastPlayedAt` (DESC)

**Use Case:** Find weakest skills or most/least recently practiced games.

---

## Cloud Functions

### `onSessionCreate`
**Trigger:** `students/{sid}/sessions/{sessionId}` onCreate

**Actions:**
1. Calculate score band and mastery delta
2. Update `/students/{sid}/progress/{gameId}` with new mastery level
3. Aggregate all progress and update `/students/{sid}/summary/overall`
4. Identify weakest skills for adaptive learning

**Logic:**
- Score >= 80%: mastery +1, streak +1
- Score 60-79%: mastery unchanged
- Score < 60%: mastery -1, streak reset

**Mastery Levels:**
1. not_started (0%)
2. emerging (25%)
3. developing (50%)
4. proficient (75%)
5. mastered (100%)

---

## Security Model

### Roles
- **admin**: Full access to all collections
- **teacher**: Can read/write students assigned to them
- **parent**: Can read their children's data
- **kid**: Can write their own session data

### Custom Claims
Set via Firebase Admin SDK:
```typescript
admin.auth().setCustomUserClaims(uid, { role: 'teacher' });
```

### Role Mapping
- Students have `parentIds[]` and `teacherId`
- Functions `isParentOf(sid)` and `isTeacherOf(sid)` check ownership
- Kids write sessions with their own `uid`
