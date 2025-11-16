const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

// Simple feature matrix for parent tiers
const FEATURE_ACCESS = {
  'daily-practice': ['free', 'starter', 'pro', 'premium'],
  worksheets: ['free', 'starter', 'pro', 'premium'],
  'essay-scoring': ['pro', 'premium'],
  'weekly-reports': ['free', 'starter', 'pro', 'premium'],
  'voice-coach': ['premium'],
  'ai-tutor': ['premium'],
};

exports.checkSubscriptionAccess = functions.region('us-central1').https.onCall(async (data, context) => {
  const { parentId, featureName } = data || {};
  if (!parentId || typeof parentId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'parentId is required');
  }
  if (!featureName || typeof featureName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'featureName is required');
  }

  const subDoc = await admin.firestore().collection('subscriptions').doc(parentId).get();
  const tier = subDoc.exists ? subDoc.data().tier || 'free' : 'free';
  const allowed = FEATURE_ACCESS[featureName]?.includes(tier) || false;

  return { hasAccess: allowed, tier };
});
