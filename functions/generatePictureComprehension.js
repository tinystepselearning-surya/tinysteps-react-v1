const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

try {
  admin.initializeApp();
} catch (_) {}

const secretClient = new SecretManagerServiceClient();

async function getGroqApiKey() {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0) {
    return process.env.GROQ_API_KEY.trim();
  }
  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  if (!projectId) throw new Error('Missing project id');
  const secretName = process.env.GROQ_SECRET_NAME || 'groq-api-key';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  const [version] = await secretClient.accessSecretVersion({ name });
  const payload = version.payload?.data?.toString('utf8');
  if (!payload) throw new Error('Groq API key secret payload empty');
  return payload;
}

function buildPrompt(level) {
  return `Create a picture comprehension exercise for ${level} kids.

Requirements:
- Describe a simple scene (school, park, home, market)
- Generate 3 questions (what, where, who, how)
- Multiple choice answers
- Make it age-appropriate

Format:
{
  "scenario": "Scene description",
  "imageDescription": "Visual description (for emoji/text display)",
  "questions": [
    { "prompt": "Q1", "options": ["a)", "b)", "c)"], "answer": "a" }
  ]
}`;
}

function parseComprehension(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      scenario: parsed.scenario || '',
      imageDescription: parsed.imageDescription || '',
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
    };
  } catch (err) {
    return null;
  }
}

exports.generatePictureComprehension = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { studentId, level = 'Grade 1-2' } = data || {};
    if (!studentId || typeof studentId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'studentId required');
    }

    const firestore = admin.firestore();
    const prompt = buildPrompt(level);
    let tokensUsed = null;
    let result = null;
    let fallback = false;

    try {
      const apiKey = await getGroqApiKey();
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 768,
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 }
      );
      tokensUsed = resp.data?.usage?.total_tokens || null;
      const content =
        resp.data?.choices?.[0]?.message?.content ||
        resp.data?.choices?.[0]?.text ||
        '';
      result = parseComprehension(content);
    } catch (err) {
      console.error('Groq picture comprehension failed', err.response?.data || err.message);
    }

    if (!result) {
      fallback = true;
      result = {
        scenario: 'In the park, a dog plays with a red ball while two kids watch.',
        imageDescription: '🌳🐕‍🦺⚽️ two kids smiling',
        questions: [
          { prompt: 'What color is the ball?', options: ['a) Red', 'b) Blue', 'c) Green'], answer: 'a' },
          { prompt: 'Where are the kids?', options: ['a) At home', 'b) In the park', 'c) In class'], answer: 'b' },
          { prompt: 'Who is playing with the ball?', options: ['a) A dog', 'b) A cat', 'c) A bird'], answer: 'a' },
        ],
      };
    }

    try {
      await firestore.collection('student-comprehension-log').add({
        studentId,
        level,
        ...result,
        fallback,
        tokensUsed,
        timestamp: admin.firestore.Timestamp.now(),
      });
      await firestore.collection('ai-usage-logs').add({
        studentId,
        feature: 'picture-comprehension',
        tokens_used: tokensUsed,
        cost: 0,
        timestamp: admin.firestore.Timestamp.now(),
      });
    } catch (err) {
      console.error('Failed to log comprehension', err);
    }

    return result;
  });
