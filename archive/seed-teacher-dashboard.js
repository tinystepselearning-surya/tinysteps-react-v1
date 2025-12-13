#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require('firebase-admin');
const { randomUUID } = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Require a conscious opt-in to seed demo data in the DB. This avoids accidental upload
// of sample students/parents/teachers to shared environments. To run seeding, set
// ALLOW_DEMO_SEED=true and provide SEED_TEACHER_UID and SEED_PARENT_UID.
const allowSeed = process.env.ALLOW_DEMO_SEED === 'true';
const teacherId = process.env.SEED_TEACHER_UID || null;
const parentId = process.env.SEED_PARENT_UID || null;
const today = new Date();
const isoDate = today.toISOString().slice(0, 10);

// No demo kids by default. The script will not create any kid documents unless
// ALLOW_DEMO_SEED is set to 'true' and the env vars for target uids are present.
const kids = [];

const sessions = [];

async function seed() {
  if (!allowSeed) {
    console.log('Demo seeding disabled. Set ALLOW_DEMO_SEED=true to enable. No data written.');
    process.exit(0);
  }
  if (!teacherId || !parentId) {
    console.error('SEED_TEACHER_UID and SEED_PARENT_UID must be set to seed demo data. Exiting.');
    process.exit(1);
  }

  console.log('Seeding teacher dashboard data (demo mode)...');

  for (const kid of kids) {
    await db.collection('kids').doc(kid.id).set({
      // fullName intentionally omitted from demo seeding script unless provided
      fullName: kid.fullName || '',
      grade: kid.grade,
      courseNames: kid.courseNames,
      progressStatus: kid.progressStatus,
      teacherIds: [teacherId],
      parentIds: [parentId],
      lastSessionDate: isoDate,
      status: 'active',
    }, { merge: true });
  }

  for (const session of sessions) {
    await db.collection('sessions').doc(session.id).set({
      teacherId,
      courseId: session.courseId,
      courseName: session.courseName,
      date: isoDate,
      startTime: session.startTime,
      endTime: session.endTime,
      kidIds: session.kidIds,
      status: 'scheduled',
      joinUrl: session.joinUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  for (const kid of kids) {
    await db.collection('progress').doc(`${teacherId}-${kid.id}`).set({
      teacherId,
      studentId: kid.id,
      studentName: kid.fullName,
      phonics: kid.id === 'seed-kid-1' ? 76 : 45,
      grammar: kid.id === 'seed-kid-1' ? 62 : 30,
      speaking: kid.id === 'seed-kid-1' ? 55 : 40,
      attendanceRate: kid.id === 'seed-kid-1' ? 95 : 82,
      lastSessionDate: isoDate,
    });
  }

  await db.collection('teacherEarnings').doc(teacherId).set({
    month: isoDate.slice(0, 7),
    totalSessions: 12,
    sessionsCompleted: 10,
    sessionsPending: 2,
    ratePerSession: 500,
    totalEarnings: 5000,
    pendingEarnings: 1000,
    breakdownByCourse: [
      { courseName: 'Phonics Level 2', sessions: 5, amount: 2500 },
      { courseName: 'Grammar Level 1', sessions: 4, amount: 2000 },
      { courseName: 'Speaking Level 1', sessions: 3, amount: 1500 },
    ],
    payments: [
      { id: 'pay-1', date: isoDate, amount: 2000, status: 'paid' },
      { id: 'pay-2', date: isoDate, amount: 1500, status: 'paid' },
      { id: 'pay-3', date: isoDate, amount: 1500, status: 'pending' },
    ],
  });

  await db.collection('teacherStats').doc(teacherId).set({
    totalSessions: 250,
    totalStudents: kids.length,
    averageAttendance: 92,
    averageSatisfaction: 4.6,
    completionRate: 95,
    sessionsByCourse: [
      { course: 'Phonics', value: 120 },
      { course: 'Grammar', value: 80 },
      { course: 'Speaking', value: 50 },
    ],
    sessionsByMonth: [
      { month: '2024-09', value: 18 },
      { month: '2024-10', value: 20 },
      { month: '2024-11', value: 22 },
    ],
    studentProgress: [
      { label: 'On Track', value: 85 },
      { label: 'Needs Attention', value: 15 },
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Seed data written successfully.');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed data:', error);
    process.exit(1);
  });
