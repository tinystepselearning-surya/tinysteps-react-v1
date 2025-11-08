#!/usr/bin/env node
/**
 * Script to add a parent-child link for a student.
 * Usage: node tools/add_parent_link.js <studentId> <parentUid>
 * This will add the parentUid to students/{studentId}.parentIds (array)
 * and create a doc at parents/{parentUid}/children/{studentId} = { createdAt }
 */
const admin = require('firebase-admin');

const [,, studentId, parentUid] = process.argv;

if (!studentId || !parentUid) {
  console.error('Usage: node tools/add_parent_link.js <studentId> <parentUid>');
  process.exit(2);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';

admin.initializeApp({ projectId });
const db = admin.firestore();

if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  try { db.settings({ host: `${host}:${port}`, ssl: false }); } catch (e) {}
}

async function main() {
  try {
    const studentRef = db.doc(`students/${studentId}`);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) {
      console.error(`Student ${studentId} not found`);
      process.exit(1);
    }

    const data = studentSnap.data() || {};
    const parentIds = Array.isArray(data.parentIds) ? data.parentIds : [];
    if (!parentIds.includes(parentUid)) {
      parentIds.push(parentUid);
      await studentRef.update({ parentIds });
      console.log(`Added ${parentUid} to students/${studentId}.parentIds`);
    } else {
      console.log(`students/${studentId}.parentIds already contains ${parentUid}`);
    }

    const linkRef = db.doc(`parents/${parentUid}/children/${studentId}`);
    await linkRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    console.log(`Created parents/${parentUid}/children/${studentId}`);

    process.exit(0);
  } catch (err) {
    console.error('Error adding link:', err);
    process.exit(1);
  }
}

main();
