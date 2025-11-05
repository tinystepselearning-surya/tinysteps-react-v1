# Student Data Population Guide

## Overview

This guide explains the new student database structure and how to populate it with sample data for testing.

## Database Structure

### Collections Created

1. **`/users/{uid}`** - All user accounts (parents, teachers, admins)
2. **`/students/{id}`** - Student profiles with parent-child relationships
3. **`/students/{id}/sessions/{sessionId}`** - Game session records
4. **`/students/{id}/progress/{gameId}`** - Per-game progress
5. **`/students/{id}/summary/overall`** - Aggregated learning summary

### Parent-Child Relationship Model

```
users/parent-001
├── childIds: ["kid1", "kid2"]  ← Array of student IDs
├── subscription: "premium"
└── role: "parent"

students/kid1
├── parentIds: ["parent-001"]  ← Bi-directional link
├── name: "Sophia Johnson"
├── ageYears: 4
├── currentPhase: 1
└── enrolledCourses: ["phonics", "grammar"]

students/kid2
├── parentIds: ["parent-001"]
├── name: "Liam Johnson"
├── ageYears: 6
└── currentPhase: 3
```

## Sample Data Structure

### 5 Parents Created
1. **Alice Johnson** (parent-001)
   - Children: Sophia (kid1), Liam (kid2)
   - Subscription: Premium
   
2. **Bob Smith** (parent-002)
   - Children: Emma (kid3), Noah (kid4)
   - Subscription: Free
   
3. **Carol Davis** (parent-003)
   - Children: Olivia (kid5)
   - Subscription: Premium
   
4. **David Wilson** (parent-004)
   - Children: Ava (kid6), Ethan (kid7)
   - Subscription: Basic
   
5. **Emma Brown** (parent-005)
   - Children: Mia (kid8), Lucas (kid9), Charlotte (kid10)
   - Subscription: Premium

### 10 Students Created

| ID | Name | Age | Gender | Grade | Phase | Courses |
|---|---|---|---|---|---|---|
| kid1 | Sophia Johnson | 4 | F | Pre-K | 1 | Phonics, Grammar |
| kid2 | Liam Johnson | 6 | M | 1st | 3 | Phonics, Grammar, Speaking |
| kid3 | Emma Smith | 5 | F | K | 2 | Phonics |
| kid4 | Noah Smith | 7 | M | 2nd | 5 | Phonics, Grammar, SpellBee |
| kid5 | Olivia Davis | 3 | F | Pre-K | 0 | Phonics |
| kid6 | Ava Wilson | 8 | F | 3rd | 7 | All 4 courses |
| kid7 | Ethan Wilson | 6 | M | 1st | 4 | Phonics, Grammar |
| kid8 | Mia Brown | 5 | F | K | 2 | Phonics, Speaking |
| kid9 | Lucas Brown | 7 | M | 2nd | 6 | Phonics, Grammar, SpellBee |
| kid10 | Charlotte Brown | 4 | F | Pre-K | 1 | Phonics |

### 3 Teachers Created

1. **Ms. Jane Anderson** (teacher-001)
   - Specialization: Phonics, Speaking
   - Students: kid1, kid2, kid5, kid8, kid10
   
2. **Mr. John Martinez** (teacher-002)
   - Specialization: Grammar, SpellBee
   - Students: kid3, kid4, kid9
   
3. **Ms. Sarah Chen** (teacher-003)
   - Specialization: Phonics, Grammar, SpellBee
   - Students: kid6, kid7

## How to Populate Data

### Method 1: Admin UI (Recommended)

1. Navigate to: **http://localhost:5173/admin/populate-data**

2. Review the data that will be created

3. Click "🚀 Populate Database"

4. Confirm the action

5. Wait for success message

6. Check Firebase Console → Firestore Database

### Method 2: Browser Console

```javascript
// Open browser console (F12)
// Import and run the populate function
import { populateStudentData } from './utils/populateStudentData';
await populateStudentData();
```

## Prerequisites

### 1. Deploy Firestore Rules

Before populating data, deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

### 2. Verify Firebase Configuration

Check `src/firebase.ts` has correct config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};
```

### 3. Check Environment Variables

Ensure `.env` has:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Verify Data in Firestore

After population, check Firebase Console:

### Users Collection
```
users/
├── parent-001/
│   ├── displayName: "Alice Johnson"
│   ├── role: "parent"
│   ├── childIds: ["kid1", "kid2"]
│   └── subscription: "premium"
├── parent-002/
│   └── ...
└── teacher-001/
    ├── displayName: "Ms. Jane Anderson"
    ├── role: "teacher"
    └── studentIds: ["kid1", "kid2", ...]
```

### Students Collection
```
students/
├── kid1/
│   ├── name: "Sophia Johnson"
│   ├── parentIds: ["parent-001"]
│   ├── teacherId: "teacher-001"
│   ├── ageYears: 4
│   ├── currentPhase: 1
│   ├── enrolledCourses: ["phonics", "grammar"]
│   └── summary/
│       └── overall/
│           ├── masteryPct: {phonics: 0, ...}
│           └── weakestSkills: []
└── kid2/
    └── ...
```

## Query Examples

### Get all children for a parent

```typescript
import { collection, query, where, getDocs } from "firebase/firestore";

// Get parent's childIds
const parentDoc = await getDoc(doc(db, "users/parent-001"));
const childIds = parentDoc.data().childIds;

// Get all children
const children = await Promise.all(
  childIds.map(id => getDoc(doc(db, "students", id)))
);
```

### Get all students assigned to a teacher

```typescript
const teacherDoc = await getDoc(doc(db, "users/teacher-001"));
const studentIds = teacherDoc.data().studentIds;

const students = await Promise.all(
  studentIds.map(id => getDoc(doc(db, "students", id)))
);
```

### Find students by age range

```typescript
const q = query(
  collection(db, "students"),
  where("ageYears", ">=", 5),
  where("ageYears", "<=", 7)
);
const snapshot = await getDocs(q);
```

## Security Rules Applied

The populated data respects these security rules:

✅ **Parents** can read their children's data (via `parentIds` array)
✅ **Teachers** can read/write students assigned to them (via `teacherId`)
✅ **Students** can write their own session data
✅ **Admins** have full access to all collections

## Next Steps After Population

1. ✅ **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

2. ✅ **Test Game Integration**
   - Use `useBalloonEngine` hook with student IDs
   - Play a game and verify session writes
   - Check Cloud Function creates progress documents

3. ✅ **Build Parent Dashboard**
   - Show children linked to parent account
   - Display progress for each child
   - Export reports

4. ✅ **Build Teacher Dashboard**
   - List assigned students
   - View class-wide progress
   - Assign learning materials

## Troubleshooting

### "Permission denied" errors
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check custom claims are set for admin/teacher accounts

### Data not appearing
- Check Firebase Console → Firestore Database
- Verify you're connected to correct project
- Check browser console for errors

### Cloud Function not triggering
- Deploy functions: `firebase deploy --only functions`
- Check Functions logs in Firebase Console
- Verify function is not crashing on session write

## Cleanup

To remove all sample data:

```typescript
// Delete all students
for (let i = 1; i <= 10; i++) {
  await deleteDoc(doc(db, "students", `kid${i}`));
}

// Delete all parents
for (let i = 1; i <= 5; i++) {
  await deleteDoc(doc(db, "users", `parent-00${i}`));
}

// Delete all teachers
for (let i = 1; i <= 3; i++) {
  await deleteDoc(doc(db, "users", `teacher-00${i}`));
}
```

## Support

For questions or issues:
- Check `firestore.schema.md` for complete schema documentation
- Review `ENGINE_README.md` for game engine integration
- Check Firebase Console logs for errors
