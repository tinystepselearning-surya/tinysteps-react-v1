// Seed game data callable removed to prevent re-adding game datasets.
const functions = require('firebase-functions');

exports.seedGameData = functions.region('us-central1').https.onCall(async (data, context) => {
  return { success: false, message: 'seedGameData removed from this deployment' };
});