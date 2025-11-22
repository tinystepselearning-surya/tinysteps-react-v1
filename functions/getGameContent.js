const functions = require('firebase-functions');

// Game content callable removed: return empty payload to avoid exposing game data.
exports.getGameContent = functions.region('us-central1').https.onCall(async (data, context) => {
  return { data: {}, type: null, message: 'game content removed' };
});
