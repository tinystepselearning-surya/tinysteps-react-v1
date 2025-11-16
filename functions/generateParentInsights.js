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

function buildPrompt({ sessions, avgAccuracy, strengths, weaknesses }) {
  return `Child completed ${sessions} sessions in the last 7 days.
Accuracy: ${avgAccuracy}%
Strengths: ${strengths.join(', ') || 'none listed'}
Weak areas: ${weaknesses.join(', ') || 'none listed'}

Generate 3 short, actionable home practice suggestions.
Keep it encouraging and specific.
Format: Simple language, no jargon.
Return JSON:
{
  "suggestions": [
    { "title": "fun name", "steps": ["step1","step2"], "time": "5-10 minutes" }
  ],
  "strengths": ["..."],
  "weaknesses": ["..."]
}`;
}

function parseResponse(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      suggestions: parsed.suggestions || [],
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
    };
  } catch (err) {
    return null;
  }
}

exports.generateParentInsights = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { childId, sessions = 0, avgAccuracy = 0, strengths = [], weaknesses = [] } = data || {};
    if (!childId || typeof childId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'childId required');
    }

    const prompt = buildPrompt({ sessions, avgAccuracy, strengths, weaknesses });
    let tokensUsed = null;
    let insights = null;
    let fallback = false;

    try {
      const apiKey = await getGroqApiKey();
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.55,
          max_tokens: 600,
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 }
      );
      tokensUsed = resp.data?.usage?.total_tokens || null;
      const content =
        resp.data?.choices?.[0]?.message?.content ||
        resp.data?.choices?.[0]?.text ||
        '';
      insights = parseResponse(content);
    } catch (err) {
      console.error('Groq generateParentInsights failed', err.response?.data || err.message);
    }

    if (!insights) {
      fallback = true;
      insights = {
        strengths,
        weaknesses,
        suggestions: [
          { title: 'Rhyming Relay', steps: ['Say the word', 'Find a rhyme', 'Clap syllables'], time: '5-10 minutes' },
          { title: 'Label the Room', steps: ['Pick 3 items', 'Spell aloud', 'Write on sticky notes'], time: '5-10 minutes' },
          { title: 'Story Swap', steps: ['Tell a 3-line story', 'Spot one verb and noun', 'High-five for effort'], time: '5 minutes' },
        ],
      };
    }

    try {
      const dateKey = new Date().toISOString().slice(0, 10);
      await admin.firestore().collection('parent-insights').doc(childId).collection('daily').doc(dateKey).set(
        {
          childId,
          strengths: insights.strengths,
          weaknesses: insights.weaknesses,
          suggestions: insights.suggestions,
          generatedAt: admin.firestore.Timestamp.now(),
          tokensUsed,
          fallback,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to write parent insights', err);
    }

    return insights;
  });
