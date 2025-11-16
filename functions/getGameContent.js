const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

// Generic callable to fetch game content from Firestore.
// Expects data: { game: 'spellbee' | 'maze' | 'bingo' | 'grammar' | 'speaking' | 'reading' }
exports.getGameContent = functions.region('us-central1').https.onCall(async (data, context) => {
  const { game } = data || {};
  if (!game || typeof game !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'game is required');
  }
  try {
    const snap = await admin.firestore().collection('gameData').doc(game).get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', `No gameData for ${game}`);
    }
    return snap.data();
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError('internal', 'Failed to fetch game content');
  }
});
