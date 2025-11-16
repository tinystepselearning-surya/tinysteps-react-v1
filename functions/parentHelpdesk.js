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

const parentHelpdeskPrompt = `You are a warm, helpful Tiny Steps parent support assistant.
Answer parent questions about phonics, grammar, public speaking, and learning progress.

Guidelines:
1. Be warm and encouraging (no jargon)
2. Give specific, actionable advice
3. Mention timeframes ("2-3 weeks to see improvement")
4. Suggest simple home activities (5-10 min daily)
5. Know when to escalate (complex behavioral issues)

Respond in 2-3 sentences maximum (parent is busy).
End with one specific action they can take today.`;

exports.parentHelpdesk = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { message } = data || {};
  if (!message || typeof message !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'message is required');
  }

  let tokensUsed = null;
  let responseText = null;
  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: parentHelpdeskPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
        top_p: 1.0,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    tokensUsed = resp.data?.usage?.total_tokens || null;
    responseText =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Groq API error:', error?.response?.data || error.message);
    throw new functions.https.HttpsError('unavailable', 'Service temporarily unavailable. Please try again.');
  } finally {
    try {
      await admin.firestore().collection('ai-usage-logs').add({
        userId: context.auth.uid,
        feature: 'parent-helpdesk',
        tokens_used: tokensUsed,
        cost: 0,
        timestamp: admin.firestore.Timestamp.now(),
      });
    } catch (err) {
      // non-blocking
      console.error('Failed to log ai-usage for parent-helpdesk', err);
    }
  }

  return { response: responseText, tokens: tokensUsed, cost: 0 };
});
