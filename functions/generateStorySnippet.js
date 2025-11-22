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

const TOPICS = ['singular/plural', 'tense', 'subject-verb agreement', 'pronouns', 'articles'];

function normalizeTopic(t) {
  const lower = (t || '').toLowerCase();
  if (lower.includes('plural') || lower.includes('singular')) return 'singular/plural';
  if (lower.includes('tense')) return 'tense';
  if (lower.includes('agreement')) return 'subject-verb agreement';
  if (lower.includes('pronoun')) return 'pronouns';
  if (lower.includes('article')) return 'articles';
  return 'singular/plural';
}

function buildPrompt(previousStory, topic) {
  return `You are generating a kid-friendly story snippet with a grammar choice.
Story so far: ${previousStory || 'The cat was sleeping...'}
Grammar topic: ${topic}

Create:
{
  "snippet": "Suddenly, the dogs ______",
  "choices": [
    {"text": "come", "correct": false},
    {"text": "comes", "correct": true},
    {"text": "coming", "correct": false}
  ],
  "correctChoice": "comes"
}
Keep language simple. Only ONE correct choice.
${CHILD_PSYCHOLOGY_ADDENDUM}`;
}

function parseSnippet(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed.snippet || !Array.isArray(parsed.choices)) return null;
    return {
      snippet: parsed.snippet,
      choices: parsed.choices.slice(0, 3),
      correctChoice: parsed.correctChoice || parsed.choices.find((c) => c.correct)?.text || '',
    };
  } catch (err) {
    return null;
  }
}

exports.generateStorySnippet = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (data, context) => {
  const { previousStory = '', grammar_topic = 'singular/plural' } = data || {};
  const topic = normalizeTopic(grammar_topic);

  let result = null;
  let tokensUsed = null;
  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: buildPrompt(previousStory, topic) }],
        max_tokens: 600,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 8000 }
    );
    tokensUsed = resp.data?.usage?.total_tokens || null;
    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
    result = parseSnippet(content);
  } catch (err) {
    console.error('Groq generateStorySnippet failed', err?.response?.data || err.message);
  }

  if (!result) {
    result = {
      snippet: 'Suddenly, the dogs ______',
      choices: [
        { text: 'come', correct: false },
        { text: 'comes', correct: true },
        { text: 'coming', correct: false },
      ],
      correctChoice: 'comes',
    };
  }

  try {
    await admin.firestore().collection('ai-usage-logs').add({
      userId: context.auth?.uid || null,
      feature: 'grammar-story-snippet',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to log ai-usage for grammar snippet', err);
  }

  return result;
});
