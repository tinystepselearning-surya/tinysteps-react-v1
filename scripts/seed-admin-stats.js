#!/usr/bin/env node
/*
  Seed script to add a test document to the adminStats collection in Firestore.
  Intended for use with the Firebase Emulators (emulator host at localhost:8085) or against a dev project.

  Usage (recommended):
    FIRESTORE_EMULATOR_HOST=localhost:8085 node scripts/seed-admin-stats.js

  Or using the emulator tooling:
    firebase emulators:exec --only firestore "node scripts/seed-admin-stats.js" --project tinysteps-react-v1
*/
import admin from 'firebase-admin';
import fs from 'fs/promises';

async function main() {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8085';

  // Look for the service account JSON next to the repo root
  // file(s) in repo root (scripts/ is the current directory)
  const svcCandidates = [
    '../tinysteps-react-v1-firebase-adminsdk-fbsvc-54979d3c19.json',
    '../tinysteps-react-v1-firebase-adminsdk-fbsvc-75997bbcea.json'
  ];

  let serviceAccount;
  for (const p of svcCandidates) {
    try {
      const raw = await fs.readFile(new URL(p, import.meta.url));
      serviceAccount = JSON.parse(raw);
      break;
    } catch (err) {
      continue;
    }
  }

  if (!serviceAccount) {
    console.error('No service-account file found. Put the service account JSON in the repo root.');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  const db = admin.firestore();

  const docRef = db.collection('adminStats').doc('testAdminDoc');
  const payload = {
    seededAt: admin.firestore.FieldValue.serverTimestamp(),
    seededBy: 'seed-admin-stats.js',
    metrics: {
      totalUsers: 100,
      activeThisWeek: 25,
      test: true
    },
  };

  console.log('Writing test document to adminStats/testAdminDoc...');
  await docRef.set(payload);
  console.log('Done. Document written.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
