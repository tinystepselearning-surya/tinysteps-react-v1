// scripts/seed-notifications.js
// Run with: npm run seed:notifications

import admin from 'firebase-admin';
import serviceAccount from '../tinysteps-react-v1-firebase-adminsdk-fbsvc-75997bbcea.json' assert { type: 'json' };

// Only init once, using your local service account JSON
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Helper: safely get a nice teacher name
 */
function getTeacherName(user) {
  return (
    user.displayName ||
    user.name ||
    user.fullName ||
    user.email ||
    'Teacher'
  );
}

/**
 * Seed notifications for ALL teachers in users collection
 */
async function seedNotificationsForAllTeachers() {
  console.log('🔎 Loading teachers from users collection…');

  const usersSnap = await db
    .collection('users')
    .where('role', '==', 'teacher')
    .get();

  if (usersSnap.empty) {
    console.log(
      '⚠️ No teachers found with role == "teacher" in users collection.',
    );
    return;
  }

  console.log(`👩‍🏫 Found ${usersSnap.size} teacher(s). Seeding notifications…`);

  const batch = db.batch();
  let notifCount = 0;

  usersSnap.forEach((userDoc) => {
    const teacherId = userDoc.id;
    const userData = userDoc.data();
    const teacherName = getTeacherName(userData);

    // Ensure a basic /teachers/{teacherId} doc exists
    const teacherDocRef = db.collection('teachers').doc(teacherId);
    batch.set(
      teacherDocRef,
      {
        userId: teacherId,
        displayName: teacherName,
        role: 'teacher',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Notifications subcollection
    const notifCol = teacherDocRef.collection('notifications');

    // 1) Welcome notification
    const welcomeRef = notifCol.doc();
    batch.set(welcomeRef, {
      title: 'Welcome to your Tiny Steps Teacher Dashboard 💛',
      body: `Hi ${teacherName}, your teacher dashboard is now live. Explore Today’s Sessions, Students, and Topic-wise Progress.`,
      type: 'system',
      source: 'seed-script',
      read: false,
      pinned: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      importance: 'high',
    });
    notifCount++;

    // 2) Tip about topic-wise progress
    const tipRef = notifCol.doc();
    batch.set(tipRef, {
      title: 'Try updating topic-wise progress',
      body: 'Open any student from your dashboard and record their topic-wise progress to see how the analytics grow over time.',
      type: 'hint',
      source: 'seed-script',
      read: false,
      pinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      importance: 'normal',
    });
    notifCount++;

    // 3) Soft reminder
    const reminderRef = notifCol.doc();
    batch.set(reminderRef, {
      title: 'Remember to mark attendance & progress',
      body: 'After each class, quickly update attendance and topic progress so parents see fresh insights on their dashboard.',
      type: 'reminder',
      source: 'seed-script',
      read: false,
      pinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      importance: 'low',
    });
    notifCount++;
  });

  await batch.commit();

  console.log(
    `✅ Done! Seeded ${notifCount} notification(s) across ${usersSnap.size} teacher(s).`,
  );
}

seedNotificationsForAllTeachers()
  .then(() => {
    console.log('✨ seed-notifications.js finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error seeding notifications:', err);
    process.exit(1);
  });
