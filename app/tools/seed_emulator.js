#!/usr/bin/env node
/**
 * Seed the Firestore + Auth emulator with a teacher, a parent, and a student linked together.
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099 node tools/seed_emulator.js
 *
 * The script will create users in the Auth emulator, set custom claims (role), and create
 * Firestore documents: users/{uid}, students/{sid}, parents/{pid}/children/{sid}, teachers/{tid},
 * plus sample attendance and curriculum entries under students/{sid}.
 */

const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';

admin.initializeApp({ projectId });
const db = admin.firestore();

async function createAuthUser(uid, email, password, role, displayName) {
  try {
    // create or get user
    let user;
    try {
      user = await admin.auth().getUser(uid);
      console.log(`User ${uid} already exists`);
    } catch (e) {
      user = await admin.auth().createUser({ uid, email, password, displayName });
      console.log(`Created auth user ${uid}`);
    }

    // set custom claims (role)
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Set custom claims for ${uid}: role=${role}`);

    // create a users/{uid} doc for the app's users collection
    await db.doc(`users/${uid}`).set({
      role,
      displayName,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Wrote users/${uid} doc`);

    return user;
  } catch (err) {
    console.error('Error creating auth user', uid, err);
    throw err;
  }
}

async function seed() {
  const teacherUid = 'teacher-test';
  const parentUid = 'parent-test';
  const studentId = 'student-test';

  console.log('Seeding emulator with:', { teacherUid, parentUid, studentId });

  // Create/auth users and docs
  await createAuthUser(teacherUid, 'teacher-test@tinysteps.com', 'password', 'teacher', 'Test Teacher');
  await createAuthUser(parentUid, 'parent-test@tinysteps.com', 'password', 'parent', 'Test Parent');

  // Student doc
  await db.doc(`students/${studentId}`).set({
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    parentIds: [parentUid],
    assignedTeacherId: teacherUid,
    summary: { phonicsMastery: 10, grammarMastery: 5, speakingMastery: 0, streakDays: 2, weeklyMinutes: 30 },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`Wrote students/${studentId}`);

  // Parents children link
  await db.doc(`parents/${parentUid}/children/${studentId}`).set({ createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log(`Wrote parents/${parentUid}/children/${studentId}`);

  // Teacher doc (lightweight)
  await db.doc(`teachers/${teacherUid}`).set({ displayName: 'Test Teacher', email: 'teacher-test@tinysteps.com', createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log(`Wrote teachers/${teacherUid}`);

  // Seed attendance (last 5 days)
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    await db.collection(`students/${studentId}/attendance`).add({
      date: dateKey,
      status: i % 5 === 0 ? 'absent' : 'present',
      minutesAttended: i % 5 === 0 ? 0 : 45,
      createdBy: teacherUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  console.log('Seeded attendance');

  // Seed curriculum topics
  const topics = [
    { id: 'phonics-a2z', title: 'Jolly Phonics order', status: 'in_progress', teacherNote: 'Starting sequence' },
    { id: 'phonics-short-vowels', title: 'Short vowel sounds', status: 'not_started' },
    { id: 'grammar-nouns', title: 'Nouns', status: 'in_progress', completedDate: new Date().toISOString() },
  ];

  for (const t of topics) {
    await db.doc(`students/${studentId}/curriculum/${t.id}`).set({
      title: t.title,
      status: t.status,
      teacherNote: t.teacherNote || null,
      completedDate: t.completedDate ? t.completedDate : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  console.log('Seeded curriculum topics');

  console.log('Seeding complete. You can now sign in as parent-test@tinysteps.com or teacher-test@tinysteps.com in the emulator-hosted app.');
}

seed().catch(err => { console.error('Seeding failed', err); process.exit(1); });
