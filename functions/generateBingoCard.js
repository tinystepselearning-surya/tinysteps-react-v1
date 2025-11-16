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

const DIFFICULTY_POOL = {
  easy: ['the', 'and', 'is', 'in', 'a', 'to', 'for', 'you', 'it', 'of', 'on', 'we', 'he', 'she', 'me', 'be', 'can', 'go', 'so', 'no', 'up', 'down', 'look', 'see', 'like'],
  medium: ['there', 'because', 'could', 'should', 'would', 'where', 'what', 'when', 'who', 'why', 'about', 'after', 'before', 'every', 'many', 'some', 'come', 'here', 'they', 'these', 'those', 'once', 'people', 'laugh', 'again'],
  hard: ['through', 'thought', 'enough', 'although', 'beautiful', 'favorite', 'neighbor', 'another', 'everybody', 'anything', 'around', 'without', 'across', 'between', 'beneath', 'during', 'toward', 'instead', 'certain', 'trouble', 'busy', 'clothes', 'rough', 'height', 'weight'],
};

function resolveDifficulty(input) {
  if (input && DIFFICULTY_POOL[input]) return input;
  return 'medium';
}

function buildPrompt(difficulty) {
  return `Generate a 5x5 sight word bingo card.
Difficulty: ${difficulty}
Provide:
- 25 sight words (grid words)
- 25 clues (one per word)
- Card as a 5x5 grid

Output JSON:
{
  "words": ["the","and",...],
  "clues": ["A small word that comes before other words","Two things joined together", ...],
  "card": [
    ["the","and","is","in","a"],
    ["to","for","not","you","it"],
    ["..."],
    ["..."],
    ["..."]
  ]
}
Use simple, age-appropriate language.`;
}

function parseBingo(text) {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.words) || !Array.isArray(parsed.clues) || !Array.isArray(parsed.card)) return null;
    return {
      words: parsed.words.slice(0, 25),
      clues: parsed.clues.slice(0, 25),
      card: parsed.card.slice(0, 5).map((row) => row.slice(0, 5)),
    };
  } catch (err) {
    return null;
  }
}

function buildFallback(difficulty) {
  const words = DIFFICULTY_POOL[difficulty] || DIFFICULTY_POOL.medium;
  const card = [];
  let idx = 0;
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      row.push(words[idx % words.length]);
      idx++;
    }
    card.push(row);
  }
  const clues = card.flat().map((w) => `Use "${w}" in a short sentence.`);
  return { words: card.flat(), clues, card };
}

exports.generateBingoCard = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { difficulty: requested = 'medium' } = data || {};
  const difficulty = resolveDifficulty(requested);

  const prompt = buildPrompt(difficulty);
  let tokensUsed = null;
  let result = null;

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
    const parsed = parseBingo(content);
    if (parsed) result = parsed;
  } catch (err) {
    console.error('Groq generateBingoCard failed', err?.response?.data || err.message);
  }

  if (!result) {
    result = buildFallback(difficulty);
    result.fallback = true;
  }

  // Persist to Firestore for reuse/analytics
  try {
    const db = admin.firestore();
    const id = db.collection('bingo-cards').doc().id;
    await db.collection('bingo-cards').doc(id).set({
      cardId: id,
      difficulty,
      ...result,
      createdAt: admin.firestore.Timestamp.now(),
      userId: context.auth.uid,
      source: result.fallback ? 'fallback' : 'api',
      tokensUsed,
    });

    await db.collection('ai-usage-logs').add({
      userId: context.auth.uid,
      feature: 'generate-bingo-card',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });

    result.cardId = id;
  } catch (err) {
    console.error('Failed to store bingo card', err);
  }

  return { ...result, difficulty, source: result.fallback ? 'fallback' : 'api' };
});
