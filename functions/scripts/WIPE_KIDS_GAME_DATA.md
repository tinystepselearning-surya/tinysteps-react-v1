# Wipe Kids Game Data Script - Documentation

## ⚠️ DANGER: Irreversible Data Deletion

This script **permanently deletes ALL game progress and history** for ALL kids in your Firestore database. It preserves kid profiles but wipes game-related data.

---

## What Gets Deleted

### Subcollections (complete deletion):
- `kids/{kidId}/skillStats/*` - All skill statistics documents
- `kids/{kidId}/gameProgress/*` - All game progress documents
  - Including nested: `kids/{kidId}/gameProgress/{gameId}/levels/*`
- `kids/{kidId}/gameSummaries/*` - Game summaries (if present)

### Kid Document Fields (removed via FieldValue.delete()):
- `progressSummary` - Legacy progress summary object
- `summary.weakTop` - Top 10 weak skills array
- `summary.games` - Per-game statistics map
- `summary.totalSessions` - Total game sessions counter
- `summary.last10Acc` - Last 10 accuracy scores
- `summary.avgAccuracy10` - Average accuracy (10 sessions)
- `summary.lastGameId` - Last played game ID
- `summary.lastPlayedAt` - Last play timestamp
- `summary.lastPlayedDateKey` - Date key for streaks
- `summary.timeSpentWeekSec` - Weekly time spent
- `summary.streakDays` - Streak days counter

---

## What Gets Preserved

### Kid Profile Fields (NEVER TOUCHED):
- `fullName` - Kid's name
- `dob` - Date of birth
- `grade` - Current grade
- `parentIds` - Array of parent UIDs
- `primaryParentId` - Primary parent UID
- `status` - Account status (active/inactive)
- `createdAt` - Account creation timestamp
- `teacherId` - Assigned teacher ID
- `creditsRemaining` - Session credits
- All other non-game-related fields

---

## Prerequisites

The script requires Firebase Admin SDK credentials. Choose ONE option:

### Option A: Service Account Key (Recommended for Production)
```bash
# Download service account key from Firebase Console:
# Project Settings → Service Accounts → Generate New Private Key

export GOOGLE_APPLICATION_CREDENTIALS="./tinysteps-react-v1-firebase-adminsdk.json"
```

### Option B: Firestore Emulator (Safe Testing)
```bash
# Start emulator first
firebase emulators:start --only firestore

# In another terminal
export FIRESTORE_EMULATOR_HOST="localhost:8080"
```

### Option C: gcloud CLI (Alternative)
```bash
gcloud auth application-default login
```

---

## Usage Examples

### 1. DRY RUN (Default - Safe, No Deletes)

Test with 1 kid:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
LIMIT_KIDS=1 \
node functions/lib/scripts/wipeKidGameData.js
```

Test with 5 kids:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
LIMIT_KIDS=5 \
node functions/lib/scripts/wipeKidGameData.js
```

### 2. REAL WIPE (⚠️ IRREVERSIBLE)

Wipe 1 kid (testing):
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
CONFIRM_WIPE=YES \
LIMIT_KIDS=1 \
node functions/lib/scripts/wipeKidGameData.js
```

**Wipe ALL kids (PRODUCTION WIPE):**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
CONFIRM_WIPE=YES \
node functions/lib/scripts/wipeKidGameData.js
```

### 3. Using Firestore Emulator (Safe Testing)

```bash
# Terminal 1: Start emulator
firebase emulators:start --only firestore

# Terminal 2: Run script against emulator
FIRESTORE_EMULATOR_HOST=localhost:8080 \
CONFIRM_WIPE=YES \
node functions/lib/scripts/wipeKidGameData.js
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONFIRM_WIPE` | No | `NO` | Must be `YES` to perform actual deletes |
| `LIMIT_KIDS` | No | None | Limit number of kids to process (for testing) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes* | - | Path to service account JSON |
| `FIRESTORE_EMULATOR_HOST` | Yes* | - | Emulator host (e.g., `localhost:8080`) |

*One of `GOOGLE_APPLICATION_CREDENTIALS` or `FIRESTORE_EMULATOR_HOST` is required.

---

## Expected Output

### DRY RUN Example:
```
================================================================================
🚨 WIPE ALL KIDS GAME DATA SCRIPT 🚨
================================================================================

🔍 MODE: DRY RUN (no actual deletes)
   Set CONFIRM_WIPE=YES to perform actual deletes

📊 LIMIT: Processing maximum 2 kids

--------------------------------------------------------------------------------

📝 Step 1: Enumerating kids collection...
   Found 150 kids in Firestore
   Limited to first 2 kids (LIMIT_KIDS=2)

--------------------------------------------------------------------------------

📦 Step 2: Processing 2 kids...

📦 Processing kid: abc123xyz
  [DRY RUN] Would delete: kids/abc123xyz/skillStats/letter:a
  [DRY RUN] Would delete: kids/abc123xyz/skillStats/letter:s
  ...
  ✓ skillStats: 45 docs
  [DRY RUN] Would delete: kids/abc123xyz/gameProgress/phonics_letter_sound/levels/1
  [DRY RUN] Would delete: kids/abc123xyz/gameProgress/phonics_letter_sound
  ...
  ✓ gameProgress: 3 docs (+ 12 nested level docs)
  [DRY RUN] Would update kid doc: kids/abc123xyz
    Removing fields: progressSummary, summary.weakTop, summary.games, etc.
  ✓ Kid doc updated (game fields removed)

📦 Processing kid: def456uvw
  ...

================================================================================
📊 FINAL SUMMARY
================================================================================

🔍 DRY RUN RESULTS (no actual deletes performed):

   Kids scanned:           2
   skillStats docs:        87
   gameProgress docs:      6
   └─ nested level docs:   24
   gameSummaries docs:     0
   Kid docs updated:       2
   Errors:                 0

   TOTAL OPERATIONS:       119

================================================================================

💡 To perform the actual wipe, run with:
   CONFIRM_WIPE=YES node functions/lib/scripts/wipeKidGameData.js
```

### REAL WIPE Example:
```
================================================================================
🚨 WIPE ALL KIDS GAME DATA SCRIPT 🚨
================================================================================

⚠️  MODE: REAL WIPE (deletes will be performed)
   This is IRREVERSIBLE!

📊 LIMIT: No limit (processing ALL kids)

...

⏳ Step 3: Flushing BulkWriter (executing batched operations)...
   ✓ All operations completed

================================================================================
📊 FINAL SUMMARY
================================================================================

✅ WIPE COMPLETED:

   Kids scanned:           150
   skillStats docs:        6,543
   gameProgress docs:      872
   └─ nested level docs:   3,214
   gameSummaries docs:     12
   Kid docs updated:       150
   Errors:                 0

   TOTAL OPERATIONS:       10,791

================================================================================

✅ Game data wipe completed successfully!

⚠️  Note: Kid profile fields (fullName, dob, grade, parents, etc.) preserved.
```

---

## Safety Features

1. **DRY RUN by Default**: Script requires explicit `CONFIRM_WIPE=YES` to perform deletes
2. **LIMIT_KIDS**: Test with small numbers before wiping all kids
3. **Preserved Profiles**: Kid profiles remain intact (only game data deleted)
4. **BulkWriter**: Efficient batched operations with automatic retries
5. **Error Handling**: Failed operations logged but don't crash entire script
6. **Idempotent**: Safe to re-run (already-deleted docs are skipped)

---

## Verification After Wipe

Check a kid document to verify:

```bash
# Using Firebase CLI
firebase firestore:get kids/abc123xyz

# Expected result:
# - fullName, dob, grade, parentIds: ✓ Present
# - progressSummary, summary.weakTop, summary.games: ✗ Absent
```

Check subcollections are empty:

```bash
# skillStats should be empty
firebase firestore:get kids/abc123xyz/skillStats --recursive

# gameProgress should be empty
firebase firestore:get kids/abc123xyz/gameProgress --recursive
```

---

## Troubleshooting

### Error: "Unable to detect a Project Id"
**Solution**: Set `GOOGLE_APPLICATION_CREDENTIALS` or use emulator:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccount.json"
```

### Error: "Permission denied"
**Solution**: Service account needs Firestore permissions:
- Firebase Console → Project Settings → Service Accounts
- Ensure role has `Cloud Datastore User` or `Editor` permissions

### Script hangs or times out
**Solution**: Use `LIMIT_KIDS` to process in batches:
```bash
# Process 50 kids at a time
CONFIRM_WIPE=YES LIMIT_KIDS=50 node functions/lib/scripts/wipeKidGameData.js
```

---

## How to Run for ALL Kids (Production)

⚠️ **FINAL WARNING**: This is irreversible. Ensure you have:
1. ✅ Tested with `LIMIT_KIDS=1` (DRY RUN)
2. ✅ Tested with `LIMIT_KIDS=1` (CONFIRM_WIPE=YES)
3. ✅ Backed up production data (Firestore export)
4. ✅ Verified correct Firebase project
5. ✅ Obtained approval from team/stakeholders

```bash
# Verify project
firebase projects:list
firebase use <correct-project>

# Final command (no LIMIT_KIDS = ALL kids)
GOOGLE_APPLICATION_CREDENTIALS=./tinysteps-react-v1-serviceAccount.json \
CONFIRM_WIPE=YES \
node functions/lib/scripts/wipeKidGameData.js
```

---

## Post-Wipe Tasks

After wiping game data, you may want to:

1. **Redeploy Functions**: Ensure summary triggers don't error on missing fields
2. **Test Parent Dashboard**: Verify "Weak Areas" section handles empty data gracefully
3. **Test Kid Games**: Verify games start fresh with no errors
4. **Monitor Logs**: Check Firebase Functions logs for any issues

---

## Technical Details

- **Script Location**: `functions/src/scripts/wipeKidGameData.ts`
- **Compiled Output**: `functions/lib/scripts/wipeKidGameData.js`
- **Build Command**: `npm --prefix functions run build`
- **Uses**: `firebase-admin`, `BulkWriter` API
- **Batch Limit**: No 500-doc limit (BulkWriter handles automatically)
- **Retry Policy**: Up to 3 retries on write errors
- **Subcollection Depth**: Handles nested `levels` subcollections

---

## License & Responsibility

This script is provided as-is. Use at your own risk. Always:
- Test in emulator first
- Test with `LIMIT_KIDS` on production
- Verify correct Firebase project
- Have backups before wiping production data

**Remember**: This operation is IRREVERSIBLE. All game progress, skill stats, and history will be permanently lost.
