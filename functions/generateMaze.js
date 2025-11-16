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
const { CHILD_PSYCHOLOGY_ADDENDUM } = require('./promptAddendum');

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

const DIFFICULTY = {
  easy: { junctions: 5, spacing: 2, rows: 10, cols: 10 },
  medium: { junctions: 10, spacing: 1, rows: 12, cols: 12 },
  hard: { junctions: 15, spacing: 1, rows: 14, cols: 14 },
};

function resolveDifficulty(input) {
  if (input && DIFFICULTY[input]) return input;
  return 'medium';
}

function buildPrompt({ difficulty, focusTopic, junctionCount }) {
  return `Generate a phonics maze for difficulty ${difficulty}.
Topic: ${focusTopic || 'CVC'}
Number of junctions: ${junctionCount}

For each junction:
1. Position in maze (row, col)
2. Question (phonetic question)
3. 3 options (1 correct, 2 incorrect)
4. Sound pronunciation

Format as JSON:
{
  "junctions": [
    {
      "position": [row, col],
      "question": "Which is /bæt/?",
      "options": [
        { "text": "bat", "sound": "/bæt/", "correct": true },
        { "text": "bit", "sound": "/bɪt/", "correct": false },
        { "text": "but", "sound": "/bʌt/", "correct": false }
      ],
      "topic": "CVC"
    }
  ],
  "correctPath": [[1,1],[2,1],[2,2]]
}
Make junctions relatable + educational.
${CHILD_PSYCHOLOGY_ADDENDUM}`;
}

function parseMaze(text) {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.junctions) || !Array.isArray(parsed.correctPath)) return null;
    return {
      junctions: parsed.junctions,
      correctPath: parsed.correctPath,
    };
  } catch (err) {
    return null;
  }
}

function fallbackMaze(config) {
  const { junctions } = config;
  const path = [];
  for (let i = 1; i <= junctions + 2; i++) {
    path.push([1, i]);
  }
  const juncs = [];
  for (let i = 0; i < junctions; i++) {
    juncs.push({
      position: [1, i + 2],
      question: 'Which is /kæt/?',
      options: [
        { text: 'cat', sound: '/kæt/', correct: true },
        { text: 'kit', sound: '/kɪt/', correct: false },
        { text: 'cut', sound: '/kʌt/', correct: false },
      ],
      topic: 'CVC',
    });
  }
  return { junctions: juncs, correctPath: path };
}

exports.generateMaze = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { difficulty: requestedDiff = 'medium', focusTopic = 'CVC' } = data || {};
  const difficulty = resolveDifficulty(requestedDiff);
  const config = DIFFICULTY[difficulty];
  const junctionCount = config.junctions;

  const prompt = buildPrompt({ difficulty, focusTopic, junctionCount });
  let tokensUsed = null;
  let maze = null;

  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 5000 }
    );
    tokensUsed = resp.data?.usage?.total_tokens || null;
    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
    const parsed = parseMaze(content);
    if (parsed) maze = parsed;
  } catch (err) {
    console.error('Groq generateMaze failed', err?.response?.data || err.message);
  }

  if (!maze) {
    maze = fallbackMaze(config);
  }

  // Normalize response
  const payload = {
    rows: config.rows,
    cols: config.cols,
    difficulty,
    junctions: maze.junctions,
    correctPath: maze.correctPath,
  };

  // Persist for replay/analytics
  try {
    const db = admin.firestore();
    const id = db.collection('phonics-mazes').doc().id;
    await db.collection('phonics-mazes').doc(id).set({
      mazeId: id,
      ...payload,
      focusTopic,
      createdAt: admin.firestore.Timestamp.now(),
      userId: context.auth.uid,
      source: maze === payload ? 'fallback' : 'api',
      tokensUsed,
    });
    await db.collection('ai-usage-logs').add({
      userId: context.auth.uid,
      feature: 'phonics-maze',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
    payload.mazeId = id;
  } catch (err) {
    console.error('Failed to store phonics maze', err);
  }

  return payload;
});
