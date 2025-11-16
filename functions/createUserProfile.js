// Creates a user profile and initializes per-game progress documents.
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

const db = admin.firestore();

async function createUserProfile(userId, userData) {
  const profileData = {
    name: userData.name,
    age: userData.age,
    email: userData.email,
    joinDate: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionTier: 'free',
    preferences: {
      difficulty: 'medium',
      dailyGoal: 5,
      notifications: true,
    },
    gamesStarted: false,
  };

  await db.collection('users').doc(userId).set(profileData);

  const games = ['spellbee', 'maze', 'bingo', 'grammar', 'speaking', 'reading'];
  const batch = db.batch();
  for (const game of games) {
    const progressRef = db.collection('users').doc(userId).collection('progress').doc(game);
    batch.set(progressRef, {
      accuracy: 0,
      played: 0,
      mastered: 0,
      lastPlayed: null,
      currentLevel: 1,
      totalPoints: 0,
    });
  }
  await batch.commit();
  console.log(`✅ User profile created for ${userId}`);
  return { success: true };
}

module.exports = { createUserProfile };
