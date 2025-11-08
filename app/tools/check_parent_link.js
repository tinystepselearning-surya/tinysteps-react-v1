#!/usr/bin/env node
/**
 * Simple script to check whether a parent is linked to a student.
 * Usage: node tools/check_parent_link.js <studentId> <parentUid>
 *
 * Works with the Firestore emulator if FIRESTORE_EMULATOR_HOST is set.
 */
const admin = require('firebase-admin');

const [,, studentId, parentUid] = process.argv;

if (!studentId || !parentUid) {
  console.error('Usage: node tools/check_parent_link.js <studentId> <parentUid>');
  process.exit(2);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';

admin.initializeApp({ projectId });
const db = admin.firestore();

// If emulator host is set, admin SDK will pick it up automatically, but
// for older SDKs we try to parse and set the settings.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  try {
    db.settings({ host: `${host}:${port}`, ssl: false });
  } catch (e) {
    // ignore
  }
}

async function main() {
  try {
    const studentRef = db.doc(`students/${studentId}`);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) {
      console.log(`Student ${studentId} not found`);
    } else {
      const data = studentSnap.data();
      console.log('Student doc found. parentIds:', data.parentIds || null);
      const hasParent = Array.isArray(data.parentIds) && data.parentIds.includes(parentUid);
      console.log(`Student.parentIds includes parentUid? ${hasParent}`);
    }

    const linkRef = db.doc(`parents/${parentUid}/children/${studentId}`);
    const linkSnap = await linkRef.get();
    console.log(`parents/${parentUid}/children/${studentId} exists? ${linkSnap.exists}`);

    process.exit(0);
  } catch (err) {
    console.error('Error checking links:', err);
    process.exit(1);
  }
}

main();
