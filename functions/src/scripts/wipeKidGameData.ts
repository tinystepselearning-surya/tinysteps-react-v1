/**
 * Tiny Steps - Wipe All Kids' Game Data Script
 * 
 * DANGER: Irreversible deletion of all game progress/history for ALL kids.
 * Preserves kid profiles (name/dob/grade/parents/status).
 * 
 * PREREQUISITES:
 *   Must run from within Firebase Functions context OR set credentials:
 *   
 *   Option A (Recommended): Use Firebase emulator or deployed environment
 *     firebase functions:shell
 *     > require('./lib/scripts/wipeKidGameData.js')
 *   
 *   Option B: Set service account credentials
 *     export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
 *     export FIRESTORE_EMULATOR_HOST="localhost:8080"  # For emulator
 *   
 *   Option C: Use gcloud auth
 *     gcloud auth application-default login
 * 
 * USAGE:
 *   DRY RUN (default, no deletes):
 *     LIMIT_KIDS=2 node functions/lib/scripts/wipeKidGameData.js
 * 
 *   REAL WIPE (performs deletes):
 *     CONFIRM_WIPE=YES node functions/lib/scripts/wipeKidGameData.js
 * 
 *   REAL WIPE with limit (for testing):
 *     CONFIRM_WIPE=YES LIMIT_KIDS=2 node functions/lib/scripts/wipeKidGameData.js
 * 
 * ENV VARS:
 *   CONFIRM_WIPE - Must be "YES" to perform actual deletes (default: NO = DRY RUN)
 *   LIMIT_KIDS - Limit number of kids to process (optional, for testing)
 *   FIRESTORE_EMULATOR_HOST - Use emulator (e.g., "localhost:8080")
 *   GOOGLE_APPLICATION_CREDENTIALS - Path to service account JSON
 * 
 * WHAT IT DELETES:
 *   Subcollections:
 *     - kids/{kidId}/skillStats/*
 *     - kids/{kidId}/gameProgress/* (including nested levels)
 *     - kids/{kidId}/gameSummaries/* (if present)
 *   
 *   Kid doc fields (using FieldValue.delete()):
 *     - progressSummary
 *     - summary.weakTop
 *     - summary.games
 *     - summary.totalSessions
 *     - summary.last10Acc
 *     - summary.avgAccuracy10
 *     - summary.lastGameId
 *     - summary.lastPlayedAt
 *     - summary.lastPlayedDateKey
 *     - summary.timeSpentWeekSec
 *     - summary.streakDays
 * 
 * WHAT IT PRESERVES:
 *   Kid profile fields:
 *     - fullName, dob, grade, parentIds, primaryParentId, status
 *     - createdAt, teacherId, creditsRemaining, etc.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if we have explicit credentials or emulator
  const hasCredentials = 
    process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_CONFIG;
  
  if (!hasCredentials) {
    console.error('\n❌ ERROR: No Firebase credentials found!');
    console.error('\nPlease set one of:');
    console.error('  1. GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json');
    console.error('  2. FIRESTORE_EMULATOR_HOST=localhost:8080 (for emulator)');
    console.error('  3. Run: gcloud auth application-default login');
    console.error('\nExample:');
    console.error('  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json LIMIT_KIDS=1 node functions/lib/scripts/wipeKidGameData.js\n');
    process.exit(1);
  }
  
  admin.initializeApp();
  
  console.log('✓ Firebase Admin initialized');
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`✓ Using Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }
}

const db = admin.firestore();

// Environment variables
const CONFIRM_WIPE = process.env.CONFIRM_WIPE === 'YES';
const LIMIT_KIDS = process.env.LIMIT_KIDS ? parseInt(process.env.LIMIT_KIDS, 10) : null;
const isDryRun = !CONFIRM_WIPE;

// Stats
interface WipeStats {
  kidsScanned: number;
  skillStatsDeleted: number;
  gameProgressDeleted: number;
  levelDocsDeleted: number;
  gameSummariesDeleted: number;
  kidDocsUpdated: number;
  errors: number;
}

const stats: WipeStats = {
  kidsScanned: 0,
  skillStatsDeleted: 0,
  gameProgressDeleted: 0,
  levelDocsDeleted: 0,
  gameSummariesDeleted: 0,
  kidDocsUpdated: 0,
  errors: 0,
};

/**
 * Delete all documents in a subcollection using BulkWriter
 */
async function deleteSubcollection(
  bulkWriter: admin.firestore.BulkWriter,
  collectionPath: string
): Promise<number> {
  let deletedCount = 0;
  const collectionRef = db.collection(collectionPath);
  
  const snapshot = await collectionRef.get();
  
  for (const doc of snapshot.docs) {
    if (isDryRun) {
      console.log(`  [DRY RUN] Would delete: ${doc.ref.path}`);
      deletedCount++;
    } else {
      bulkWriter.delete(doc.ref);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

/**
 * Recursively delete gameProgress documents and their nested levels subcollections
 */
async function deleteGameProgressWithLevels(
  bulkWriter: admin.firestore.BulkWriter,
  kidId: string
): Promise<{ gameProgressDeleted: number; levelDocsDeleted: number }> {
  let gameProgressDeleted = 0;
  let levelDocsDeleted = 0;
  
  const gameProgressRef = db.collection(`kids/${kidId}/gameProgress`);
  const gameProgressSnapshot = await gameProgressRef.get();
  
  for (const gameDoc of gameProgressSnapshot.docs) {
    // First, delete nested levels subcollection
    const levelsPath = `kids/${kidId}/gameProgress/${gameDoc.id}/levels`;
    const levelsDeleted = await deleteSubcollection(bulkWriter, levelsPath);
    levelDocsDeleted += levelsDeleted;
    
    // Then delete the game progress doc itself
    if (isDryRun) {
      console.log(`  [DRY RUN] Would delete: ${gameDoc.ref.path}`);
      gameProgressDeleted++;
    } else {
      bulkWriter.delete(gameDoc.ref);
      gameProgressDeleted++;
    }
  }
  
  return { gameProgressDeleted, levelDocsDeleted };
}

/**
 * Update kid doc to remove game-related fields
 */
async function updateKidDoc(
  bulkWriter: admin.firestore.BulkWriter,
  kidId: string
): Promise<void> {
  const kidRef = db.doc(`kids/${kidId}`);
  
  const updateData = {
    progressSummary: admin.firestore.FieldValue.delete(),
    'summary.weakTop': admin.firestore.FieldValue.delete(),
    'summary.games': admin.firestore.FieldValue.delete(),
    'summary.totalSessions': admin.firestore.FieldValue.delete(),
    'summary.last10Acc': admin.firestore.FieldValue.delete(),
    'summary.avgAccuracy10': admin.firestore.FieldValue.delete(),
    'summary.lastGameId': admin.firestore.FieldValue.delete(),
    'summary.lastPlayedAt': admin.firestore.FieldValue.delete(),
    'summary.lastPlayedDateKey': admin.firestore.FieldValue.delete(),
    'summary.timeSpentWeekSec': admin.firestore.FieldValue.delete(),
    'summary.streakDays': admin.firestore.FieldValue.delete(),
  };
  
  if (isDryRun) {
    console.log(`  [DRY RUN] Would update kid doc: ${kidRef.path}`);
    console.log(`    Removing fields: progressSummary, summary.weakTop, summary.games, etc.`);
  } else {
    bulkWriter.update(kidRef, updateData);
  }
}

/**
 * Process one kid: delete game data subcollections and update kid doc
 */
async function processKid(bulkWriter: admin.firestore.BulkWriter, kidId: string): Promise<void> {
  console.log(`\n📦 Processing kid: ${kidId}`);
  
  try {
    // Delete skillStats subcollection
    const skillStatsPath = `kids/${kidId}/skillStats`;
    const skillStatsDeleted = await deleteSubcollection(bulkWriter, skillStatsPath);
    stats.skillStatsDeleted += skillStatsDeleted;
    console.log(`  ✓ skillStats: ${skillStatsDeleted} docs`);
    
    // Delete gameProgress subcollection (with nested levels)
    const { gameProgressDeleted, levelDocsDeleted } = await deleteGameProgressWithLevels(bulkWriter, kidId);
    stats.gameProgressDeleted += gameProgressDeleted;
    stats.levelDocsDeleted += levelDocsDeleted;
    console.log(`  ✓ gameProgress: ${gameProgressDeleted} docs (+ ${levelDocsDeleted} nested level docs)`);
    
    // Delete gameSummaries subcollection (if present)
    const gameSummariesPath = `kids/${kidId}/gameSummaries`;
    const gameSummariesDeleted = await deleteSubcollection(bulkWriter, gameSummariesPath);
    stats.gameSummariesDeleted += gameSummariesDeleted;
    if (gameSummariesDeleted > 0) {
      console.log(`  ✓ gameSummaries: ${gameSummariesDeleted} docs`);
    }
    
    // Update kid doc to remove game-related fields
    await updateKidDoc(bulkWriter, kidId);
    stats.kidDocsUpdated++;
    console.log(`  ✓ Kid doc updated (game fields removed)`);
    
  } catch (error: any) {
    console.error(`  ❌ Error processing kid ${kidId}:`, error.message);
    stats.errors++;
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🚨 WIPE ALL KIDS GAME DATA SCRIPT 🚨');
  console.log('='.repeat(80));
  
  if (isDryRun) {
    console.log('\n🔍 MODE: DRY RUN (no actual deletes)');
    console.log('   Set CONFIRM_WIPE=YES to perform actual deletes');
  } else {
    console.log('\n⚠️  MODE: REAL WIPE (deletes will be performed)');
    console.log('   This is IRREVERSIBLE!');
  }
  
  if (LIMIT_KIDS) {
    console.log(`\n📊 LIMIT: Processing maximum ${LIMIT_KIDS} kids`);
  } else {
    console.log('\n📊 LIMIT: No limit (processing ALL kids)');
  }
  
  console.log('\n' + '-'.repeat(80));
  
  // Step 1: Get all kid document IDs
  console.log('\n📝 Step 1: Enumerating kids collection...');
  const kidsSnapshot = await db.collection('kids').select().get();
  const allKidIds = kidsSnapshot.docs.map(doc => doc.id);
  
  console.log(`   Found ${allKidIds.length} kids in Firestore`);
  
  // Apply limit if specified
  const kidIdsToProcess = LIMIT_KIDS ? allKidIds.slice(0, LIMIT_KIDS) : allKidIds;
  stats.kidsScanned = kidIdsToProcess.length;
  
  if (LIMIT_KIDS && kidIdsToProcess.length < allKidIds.length) {
    console.log(`   Limited to first ${kidIdsToProcess.length} kids (LIMIT_KIDS=${LIMIT_KIDS})`);
  }
  
  console.log('\n' + '-'.repeat(80));
  
  // Step 2: Create BulkWriter with error handling
  const bulkWriter = db.bulkWriter();
  
  bulkWriter.onWriteError((error) => {
    console.error(`❌ BulkWriter error:`, error.documentRef.path, error.message);
    
    // Retry failed operations up to 3 times
    if (error.failedAttempts < 3) {
      return true; // Retry
    } else {
      stats.errors++;
      return false; // Give up after 3 attempts
    }
  });
  
  // Step 3: Process each kid
  console.log(`\n📦 Step 2: Processing ${kidIdsToProcess.length} kids...`);
  
  for (const kidId of kidIdsToProcess) {
    await processKid(bulkWriter, kidId);
  }
  
  // Step 4: Flush BulkWriter (execute all queued operations)
  if (!isDryRun) {
    console.log('\n⏳ Step 3: Flushing BulkWriter (executing batched operations)...');
    await bulkWriter.close();
    console.log('   ✓ All operations completed');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  
  if (isDryRun) {
    console.log('\n🔍 DRY RUN RESULTS (no actual deletes performed):\n');
  } else {
    console.log('\n✅ WIPE COMPLETED:\n');
  }
  
  console.log(`   Kids scanned:           ${stats.kidsScanned}`);
  console.log(`   skillStats docs:        ${stats.skillStatsDeleted}`);
  console.log(`   gameProgress docs:      ${stats.gameProgressDeleted}`);
  console.log(`   └─ nested level docs:   ${stats.levelDocsDeleted}`);
  console.log(`   gameSummaries docs:     ${stats.gameSummariesDeleted}`);
  console.log(`   Kid docs updated:       ${stats.kidDocsUpdated}`);
  console.log(`   Errors:                 ${stats.errors}`);
  
  const totalDocsAffected = 
    stats.skillStatsDeleted + 
    stats.gameProgressDeleted + 
    stats.levelDocsDeleted + 
    stats.gameSummariesDeleted + 
    stats.kidDocsUpdated;
  
  console.log(`\n   TOTAL OPERATIONS:       ${totalDocsAffected}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (isDryRun) {
    console.log('\n💡 To perform the actual wipe, run with:');
    console.log('   CONFIRM_WIPE=YES node functions/lib/scripts/wipeKidGameData.js');
  } else {
    console.log('\n✅ Game data wipe completed successfully!');
    console.log('\n⚠️  Note: Kid profile fields (fullName, dob, grade, parents, etc.) preserved.');
  }
  
  console.log('\n');
}

// Execute
main()
  .then(() => {
    console.log('Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
