const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

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

const essayScorePrompt = `You are an experienced English teacher grading student essays.
Student age: {age}
Essay length: {length} words

Grade this essay on these criteria:
1. Grammar (1-5): Spelling, punctuation, sentence structure
2. Organization (1-5): Flow, paragraphs, transitions  
3. Clarity (1-5): Word choice, explanations, examples
4. Creativity (1-5): Originality, voice, engagement

For each criterion:
- Provide score (1-5)
- Give 1 specific example of what's good
- Suggest 1 improvement

Also provide:
1. Corrected version of 3 sentences (show fixes)
2. 3 vocabulary words student should use more
3. One writing tip for next essay

Be encouraging but honest. Age-appropriate feedback.`;

function buildUserPrompt(age, essayText) {
  const length = essayText ? essayText.split(/\s+/).length : 0;
  return `Student age: ${age || 'unknown'}
Essay length: ${length} words

Essay text:
${essayText || ''}`;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

exports.essayScore = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { essayText, studentAge } = data || {};
  if (!essayText || typeof essayText !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'essayText is required');
  }

  let tokensUsed = null;
  let feedback = null;

  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: essayScorePrompt },
          { role: 'user', content: buildUserPrompt(studentAge, essayText) },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1.0,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    tokensUsed = resp.data?.usage?.total_tokens || null;
    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
    feedback = safeJson(content);
  } catch (err) {
    console.error('Groq essayScore error', err?.response?.data || err.message);
  }

  if (!feedback) {
    throw new functions.https.HttpsError('unavailable', 'Could not score essay. Please try again.');
  }

  try {
    await admin.firestore().collection('ai-usage-logs').add({
      userId: context.auth.uid,
      feature: 'essay-score',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to log ai-usage for essay-score', err);
  }

  return { feedback, tokens: tokensUsed, cost: 0 };
});
