// gradeSpelling: stubbed to remove AI calls and progress writes related to games.
// Returns a neutral feedback object so clients remain functional but no game
// progress or AI services are used.
const { onCall } = require('firebase-functions/v2/https');

function neutralFeedback(correct = false) {
  return {
    correct,
    feedback: correct ? '✅ Correct (stubbed feedback)' : '🤔 Feedback is not available',
    tip: '',
    encouragement: 'Good effort!',
    explanation: '',
    score: correct ? 100 : 0,
    stubbed: true,
  };
}

exports.gradeSpelling = onCall({ region: 'us-central1', memory: '128MiB', timeoutSeconds: 30 }, async (data, context) => {
  // Authentication gating retained but no data mutations
  if (!context || !context.auth || !context.auth.uid) {
    return neutralFeedback(false);
  }
  const { correct } = data || {};
  return neutralFeedback(!!correct);
});
