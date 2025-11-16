const functions = require('firebase-functions');
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

function buildPrompt({ bookId, chapterNumber, readingLevel }) {
  return `Generate an interactive reading chapter.
Book id: ${bookId}
Chapter: ${chapterNumber}
Reading level: ${readingLevel}

Provide JSON:
{
  "chapter": "Once upon a time...",
  "question": "What did the bird see first?",
  "options": ["A tree","The sky","Another bird"],
  "correctAnswer": "The sky"
}
${CHILD_PSYCHOLOGY_ADDENDUM}`;
}

exports.generateReadingChapter = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { bookId = 'default-book', chapterNumber = 1, readingLevel = 'early-primary' } = data || {};

  let result = null;
  let tokensUsed = null;
  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: buildPrompt({ bookId, chapterNumber, readingLevel }) }],
        max_tokens: 800,
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
    console.error('generateReadingChapter Groq failed', err?.response?.data || err.message);
  }

  if (!result) {
    result = {
      chapter: 'Once upon a time, there was a little bird who loved to fly above the forest trees.',
      question: 'What did the bird see first?',
      options: ['A tree', 'The sky', 'Another bird'],
      correctAnswer: 'The sky',
      fallback: true,
    };
  }

  try {
    const db = admin.firestore();
    await db.collection('reading-chapters').add({
      bookId,
      chapterNumber,
      readingLevel,
      ...result,
      createdAt: admin.firestore.Timestamp.now(),
      userId: context.auth.uid,
    });
    await db.collection('ai-usage-logs').add({
      userId: context.auth.uid,
      feature: 'reading-chapter',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to store reading chapter', err);
  }

  return result;
});
