const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');

// Initialize Firebase Admin if not already initialized
try {
  admin.initializeApp();
} catch (e) {
  // ignore if already initialized in emulator or elsewhere
}

// Secret Manager client
const secretClient = new SecretManagerServiceClient();

/**
 * Helper: read Groq API key from Secret Manager
 * Expects a secret named `groq-api-key` in the same GCP project
 */
async function getGroqApiKey() {
  // Local/dev fallback: if GROQ_API_KEY is set in env, use it (useful for emulator or CI)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0) {
    return process.env.GROQ_API_KEY.trim();
  }
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  if (!projectId) throw new Error('GCP project id not available in env');

  const secretName = process.env.GROQ_SECRET_NAME || 'groq-api-key';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  const [version] = await secretClient.accessSecretVersion({ name });
  const payload = version.payload && version.payload.data ? version.payload.data.toString('utf8') : null;
  if (!payload) throw new Error('Groq API key secret payload empty');
  return payload;
}

/**
 * Cloud Function: generateAIResponse
 * Input: { prompt: string, studentId: string, featureType: 'practice-buddy' | 'worksheet' }
 * Output: { response: string, tokens_used: number, timestamp: timestamp, studentId: string }
 */
exports.generateAIResponse = functions.region('us-central1').https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { prompt, studentId, featureType } = data || {};

  // Validate inputs
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid `prompt`.');
  }
  if (typeof studentId !== 'string' || studentId.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid `studentId`.');
  }
  if (!['practice-buddy', 'worksheet'].includes(featureType)) {
    throw new functions.https.HttpsError('invalid-argument', 'featureType must be "practice-buddy" or "worksheet"');
  }

  // Authorization: only allow teachers or parents
  const userRef = admin.firestore().collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User record not found');
  }
  const user = userSnap.data();
  const role = user && user.role;
  if (!['teacher', 'parent'].includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Only teachers or parents may call this function');
  }

  // Rate limiting: max 100 calls per student per day
  const firestore = admin.firestore();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const usageQuery = await firestore.collection('ai-usage-logs')
    .where('studentId', '==', studentId)
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(endOfDay))
    .get();

  if (usageQuery.size >= 100) {
    throw new functions.https.HttpsError('resource-exhausted', 'Daily AI call limit reached for this student');
  }

  // Prepare Groq request
  let apiKey;
  try {
    apiKey = await getGroqApiKey();
  } catch (err) {
    console.error('Secret access error:', err);
    throw new functions.https.HttpsError('internal', 'Failed to access AI service credentials');
  }

  const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const groqPayload = {
    model: 'mixtral-8x7b-32768',
    messages: [ { role: 'user', content: prompt } ],
    max_tokens: 512,
    temperature: 0.7
  };

  try {
    const resp = await axios.post(groqUrl, groqPayload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30_000
    });

    // Parse response: adapt if Groq's shape differs
    const result = resp.data;
    const aiText = (result?.choices && result.choices[0] && (result.choices[0].message?.content || result.choices[0].text)) || '';
    const tokensUsed = result?.usage?.total_tokens || null;
    const now = admin.firestore.Timestamp.now();

    // Log usage
    await firestore.collection('ai-usage-logs').add({
      studentId,
      userId: uid,
      featureType,
      prompt: prompt.slice(0, 5000), // limit stored prompt length
      response: aiText.slice(0, 10000),
      tokens: tokensUsed,
      cost: 0,
      timestamp: now
    });

    return {
      response: aiText,
      tokens_used: tokensUsed,
      timestamp: now.toDate(),
      studentId
    };

  } catch (err) {
    console.error('Groq API call failed:', err && err.response ? err.response.data || err.response.statusText : err.message);

    // Log error
    try {
      await firestore.collection('ai-error-logs').add({
        studentId,
        userId: uid,
        featureType,
        prompt: prompt && prompt.slice(0, 2000),
        error: err && err.message,
        statusCode: err.response?.status || null,
        raw: err.response?.data || null,
        timestamp: admin.firestore.Timestamp.now()
      });
    } catch (logErr) {
      console.error('Failed to write ai-error-logs:', logErr);
    }

    // Map errors to friendly HttpsError
    if (err.response && err.response.status === 429) {
      throw new functions.https.HttpsError('resource-exhausted', 'AI service rate limit exceeded. Try again later.');
    }
    if (err.response && err.response.status >= 400 && err.response.status < 500) {
      throw new functions.https.HttpsError('invalid-argument', 'AI service rejected the request');
    }
    if (err.response && err.response.status >= 500) {
      throw new functions.https.HttpsError('unavailable', 'AI service temporarily unavailable');
    }
    if (err.code === 'ECONNABORTED') {
      throw new functions.https.HttpsError('deadline-exceeded', 'AI request timed out');
    }

    throw new functions.https.HttpsError('internal', 'Unexpected error during AI request');
  }
});
