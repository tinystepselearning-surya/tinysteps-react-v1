const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

function scoreForDifficulty(diff) {
  if (diff === 'hard') return 15;
  if (diff === 'medium') return 10;
  return 5;
}

exports.gradePhonicsJunction = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { mazeId, userId, junctionIndex, correct } = data || {};
  if (!mazeId || typeof mazeId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'mazeId required');
  }
  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'userId required');
  }
  if (typeof junctionIndex !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'junctionIndex required');
  }

  const db = admin.firestore();
  let difficulty = 'medium';
  try {
    const mazeDoc = await db.collection('phonics-mazes').doc(mazeId).get();
    if (mazeDoc.exists) {
      difficulty = mazeDoc.data().difficulty || 'medium';
    }
  } catch (err) {
    // ignore; fallback difficulty
  }

  const points = correct ? scoreForDifficulty(difficulty) : 0;

  try {
    await db.collection('phonics-maze-attempts').add({
      mazeId,
      userId,
      junctionIndex,
      correct,
      points,
      createdAt: admin.firestore.Timestamp.now(),
    });

    await db.runTransaction(async (tx) => {
      const ref = db.collection('phonics-maze-progress').doc(userId);
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : { attempts: 0, correct: 0, score: 0 };
      const attempts = (data.attempts || 0) + 1;
      const correctCount = (data.correct || 0) + (correct ? 1 : 0);
      tx.set(
        ref,
        {
          attempts,
          correct: correctCount,
          score: (data.score || 0) + points,
          accuracy: attempts ? Math.round((correctCount / attempts) * 100) : 0,
          lastUpdated: admin.firestore.Timestamp.now(),
        },
        { merge: true }
      );
    });

    // Leaderboard
    await db.runTransaction(async (tx) => {
      const ref = db.collection('phonics-maze-leaderboard').doc(userId);
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : { score: 0 };
      tx.set(
        ref,
        {
          score: (data.score || 0) + points,
          lastUpdated: admin.firestore.Timestamp.now(),
        },
        { merge: true }
      );
    });
  } catch (err) {
    console.error('Failed to log phonics junction', err);
  }

  return { correct, points, difficulty };
});
