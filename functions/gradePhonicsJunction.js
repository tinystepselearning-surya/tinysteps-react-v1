// gradePhonicsJunction: stubbed to remove game progress writes and leaderboard updates.
const { onCall } = require('firebase-functions/v2/https');

exports.gradePhonicsJunction = onCall({ region: 'us-central1', memory: '128MiB', timeoutSeconds: 30 }, async (data, context) => {
  if (!context || !context.auth || !context.auth.uid) {
    return { correct: false, points: 0, difficulty: null, stubbed: true };
  }
  const { correct } = data || {};
  const points = correct ? 5 : 0;
  return { correct: !!correct, points, difficulty: null, stubbed: true };
});
