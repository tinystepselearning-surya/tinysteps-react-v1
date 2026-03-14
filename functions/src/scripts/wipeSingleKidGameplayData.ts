/**
 * Tiny Steps - Wipe one kid's gameplay/progress test data.
 *
 * Scope (only under kids/{kidId}):
 * - gameSessions/*
 * - gameProgress/*
 * - gameSummaries/* (including __overview)
 * - activity/*
 * - skillTagStats/*
 * - rollupsApplied/*
 * - levelCompletions/*
 * - root fields: summary, progress
 *
 * Safety:
 * - DRY RUN by default (no writes/deletes)
 * - real wipe requires BOTH:
 *   - CONFIRM_WIPE_ONE_KID=YES
 *   - CONFIRM_KID_ID=<exact kidId>
 *
 * Usage (after functions build):
 *   node functions/lib/scripts/wipeSingleKidGameplayData.js --kidId=<KID_ID>
 *
 * Real wipe:
 *   CONFIRM_WIPE_ONE_KID=YES CONFIRM_KID_ID=<KID_ID> \
 *   node functions/lib/scripts/wipeSingleKidGameplayData.js --kidId=<KID_ID>
 */

import * as admin from "firebase-admin";

const TARGET_SUBCOLLECTIONS = [
  "gameSessions",
  "gameProgress",
  "gameSummaries",
  "activity",
  "skillTagStats",
  "rollupsApplied",
  "levelCompletions",
] as const;

type PerCollectionCount = Record<(typeof TARGET_SUBCOLLECTIONS)[number], number>;

function parseKidIdArg(): string | null {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith("--kidId=")) {
      const kidId = arg.slice("--kidId=".length).trim();
      return kidId || null;
    }
  }
  return null;
}

function ensureAdminInit(): void {
  if (admin.apps.length > 0) return;

  const hasCredentials =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_CONFIG;

  if (!hasCredentials) {
    console.error("\nERROR: No Firebase credentials found.");
    console.error("Set one of:");
    console.error("  1) GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json");
    console.error("  2) FIRESTORE_EMULATOR_HOST=localhost:8080");
    console.error("  3) gcloud auth application-default login\n");
    process.exit(1);
  }

  admin.initializeApp();
}

async function deleteDocumentTree(
  docRef: admin.firestore.DocumentReference,
  bulkWriter: admin.firestore.BulkWriter,
  isDryRun: boolean,
): Promise<number> {
  let deleted = 0;

  const nestedCollections = await docRef.listCollections();
  for (const nested of nestedCollections) {
    deleted += await deleteCollectionTree(nested, bulkWriter, isDryRun);
  }

  if (isDryRun) {
    console.log(`  [DRY RUN] Would delete: ${docRef.path}`);
  } else {
    bulkWriter.delete(docRef);
  }
  deleted += 1;

  return deleted;
}

async function deleteCollectionTree(
  collectionRef: admin.firestore.CollectionReference,
  bulkWriter: admin.firestore.BulkWriter,
  isDryRun: boolean,
): Promise<number> {
  const snap = await collectionRef.get();
  let deleted = 0;
  for (const doc of snap.docs) {
    deleted += await deleteDocumentTree(doc.ref, bulkWriter, isDryRun);
  }
  return deleted;
}

async function main(): Promise<void> {
  const kidId = parseKidIdArg();
  if (!kidId) {
    console.error("\nERROR: Missing required --kidId argument.");
    console.error("Example:");
    console.error("  node functions/lib/scripts/wipeSingleKidGameplayData.js --kidId=KID_123\n");
    process.exit(1);
  }

  ensureAdminInit();
  const db = admin.firestore();

  const isDryRun = process.env.CONFIRM_WIPE_ONE_KID !== "YES";
  const confirmKidId = String(process.env.CONFIRM_KID_ID || "").trim();
  const canRunRealWipe = !isDryRun && confirmKidId === kidId;

  if (!isDryRun && !canRunRealWipe) {
    console.error("\nERROR: Real wipe blocked.");
    console.error("For real wipe, CONFIRM_KID_ID must match --kidId exactly.");
    console.error(`  --kidId=${kidId}`);
    console.error(`  CONFIRM_KID_ID=${confirmKidId || "(empty)"}\n`);
    process.exit(1);
  }

  console.log("\n============================================================");
  console.log("ONE-KID GAMEPLAY DATA WIPE");
  console.log("============================================================");
  console.log(`Kid ID: ${kidId}`);
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "REAL WIPE"}`);

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  const kidRef = db.collection("kids").doc(kidId);
  const kidSnap = await kidRef.get();
  if (!kidSnap.exists) {
    console.error(`\nERROR: kids/${kidId} not found. Aborting.\n`);
    process.exit(1);
  }

  const bulkWriter = db.bulkWriter();
  bulkWriter.onWriteError((error) => {
    if (error.failedAttempts < 3) return true;
    console.error(`Delete failed after retries: ${error.documentRef.path} :: ${error.message}`);
    return false;
  });

  const perCollectionDeleted: PerCollectionCount = {
    gameSessions: 0,
    gameProgress: 0,
    gameSummaries: 0,
    activity: 0,
    skillTagStats: 0,
    rollupsApplied: 0,
    levelCompletions: 0,
  };

  for (const name of TARGET_SUBCOLLECTIONS) {
    const colRef = kidRef.collection(name);
    const count = await deleteCollectionTree(colRef, bulkWriter, isDryRun);
    perCollectionDeleted[name] = count;
    console.log(`\n${name}: ${count} doc(s) ${isDryRun ? "would be deleted" : "queued for delete"}`);
  }

  if (isDryRun) {
    console.log(`\n[DRY RUN] Would clear root fields on kids/${kidId}: summary, progress`);
  } else {
    await kidRef.update({
      summary: admin.firestore.FieldValue.delete(),
      progress: admin.firestore.FieldValue.delete(),
    });
    console.log(`\nCleared root fields on kids/${kidId}: summary, progress`);
  }

  if (!isDryRun) {
    await bulkWriter.close();
  }

  const totalDocs = Object.values(perCollectionDeleted).reduce((sum, n) => sum + n, 0);

  console.log("\n------------------------------------------------------------");
  console.log("SUMMARY");
  console.log("------------------------------------------------------------");
  console.log(`Kid: ${kidId}`);
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "REAL WIPE"}`);
  console.log(`Total gameplay/progress docs affected: ${totalDocs}`);
  for (const name of TARGET_SUBCOLLECTIONS) {
    console.log(`  - ${name}: ${perCollectionDeleted[name]}`);
  }
  console.log("  - root fields cleared: summary, progress");
  console.log("------------------------------------------------------------\n");

  if (isDryRun) {
    console.log("To run REAL wipe:");
    console.log(`  CONFIRM_WIPE_ONE_KID=YES CONFIRM_KID_ID=${kidId} node functions/lib/scripts/wipeSingleKidGameplayData.js --kidId=${kidId}\n`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

