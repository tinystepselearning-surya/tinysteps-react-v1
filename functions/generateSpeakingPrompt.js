const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { CHILD_PSYCHOLOGY_ADDENDUM } = require('./promptAddendum');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

const secretClient = new SecretManagerServiceClient();

async function getGroqApiKey() {
  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  if (!projectId) throw new Error('Missing project id');
  const name = `projects/${projectId}/secrets/groq-api-key/versions/latest`;
  const [version] = await secretClient.accessSecretVersion({ name });
  const payload = version.payload?.data?.toString('utf8');
  if (!payload) throw new Error('Groq API key secret payload empty');
  return payload;
}

function buildPrompt(age, difficulty, topic) {
  return `Generate an age-appropriate public speaking prompt.
Age: ${age || '6-10'}
Difficulty: ${difficulty || 'easy'}
Topic: ${topic || 'favorite animal'}

Provide JSON:
{
  "prompt": "Tell me about your favorite animal. Why do you like it?",
  "targetTime": 30,
  "evaluationCriteria": [
    "Speaks clearly",
    "Stays on topic",
    "Speaks at good pace"
  ]
}
${CHILD_PSYCHOLOGY_ADDENDUM}`;
}

exports.generateSpeakingPrompt = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (data, context) => {
  const { age = '6-10', difficulty = 'easy', topic = 'favorite animal' } = data || {};

  let result = null;
  let tokensUsed = null;
  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: buildPrompt(age, difficulty, topic) }],
        max_tokens: 400,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 8000 }
    );
    tokensUsed = resp.data?.usage?.total_tokens || null;
    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
    result = JSON.parse(content);
  } catch (err) {
    console.error('generateSpeakingPrompt Groq failed', err?.response?.data || err.message);
  }

  if (!result) {
    result = {
      prompt: 'Tell me about your favorite animal. Why do you like it?',
      targetTime: 30,
      evaluationCriteria: ['Speaks clearly', 'Stays on topic', 'Speaks at good pace'],
      fallback: true,
    };
  }

  try {
    await admin.firestore().collection('ai-usage-logs').add({
      userId: context.auth?.uid || null,
      feature: 'speaking-prompt',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to log ai-usage for speaking prompt', err);
  }

  return result;
});
