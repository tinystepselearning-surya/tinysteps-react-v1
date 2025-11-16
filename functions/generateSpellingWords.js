const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { enhancedSpellbeeData } = require('./enhancedSpellbeeData');

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

// Fallback word banks by difficulty
const FALLBACK = {
  easy: [
    { word: 'cat', sentence: 'The cat sleeps on the mat.', pronunciation: '/kæt/', hint: 'c-a-t sounds like /k/ /æ/ /t/', topic: 'CVC' },
    { word: 'dog', sentence: 'The dog wags its tail.', pronunciation: '/dɔg/', hint: 'd-o-g short o', topic: 'CVC' },
    { word: 'sun', sentence: 'The sun is bright.', pronunciation: '/sʌn/', hint: 's-u-n', topic: 'CVC' },
    { word: 'run', sentence: 'I run fast.', pronunciation: '/rʌn/', hint: 'r-u-n', topic: 'CVC' },
    { word: 'hat', sentence: 'She wears a hat.', pronunciation: '/hæt/', hint: 'h-a-t', topic: 'CVC' },
  ],
  medium: [
    { word: 'lake', sentence: 'We sat by the lake.', pronunciation: '/leɪk/', hint: 'long a: l-ake', topic: 'Vowel patterns' },
    { word: 'cake', sentence: 'The cake is sweet.', pronunciation: '/keɪk/', hint: 'c-ake, long a', topic: 'Vowel patterns' },
    { word: 'road', sentence: 'Cars drive on the road.', pronunciation: '/roʊd/', hint: 'oa says /oʊ/', topic: 'Vowel patterns' },
    { word: 'team', sentence: 'Our team won.', pronunciation: '/tiːm/', hint: 'ea says /iː/', topic: 'Vowel patterns' },
    { word: 'boat', sentence: 'The boat sails.', pronunciation: '/boʊt/', hint: 'oa says /oʊ/', topic: 'Vowel patterns' },
  ],
  hard: [
    { word: 'blend', sentence: 'Blend the colors.', pronunciation: '/blend/', hint: 'bl- is a blend', topic: 'Blends' },
    { word: 'spring', sentence: 'Spring flowers bloom.', pronunciation: '/sprɪŋ/', hint: 'spr- blend', topic: 'Blends' },
    { word: 'street', sentence: 'Cross the street safely.', pronunciation: '/striːt/', hint: 'str- blend', topic: 'Blends' },
    { word: 'bright', sentence: 'The light is bright.', pronunciation: '/braɪt/', hint: 'br- blend + igh', topic: 'Blends' },
    { word: 'splash', sentence: 'Jump with a splash.', pronunciation: '/splæʃ/', hint: 'spl- blend', topic: 'Blends' },
  ],
};

function pickDifficulty(recentAccuracy, provided) {
  if (provided && ['easy', 'medium', 'hard'].includes(provided)) return provided;
  if (recentAccuracy == null) return 'medium';
  if (recentAccuracy < 60) return 'easy';
  if (recentAccuracy > 85) return 'hard';
  return 'medium';
}

function selectWordsForDifficulty(wordPatterns = {}, difficulty = 'medium', count = 5) {
  let patterns;
  if (difficulty === 'easy') {
    patterns = ['cvc_short_a', 'cvc_short_e', 'cvc_short_i'];
  } else if (difficulty === 'medium') {
    patterns = ['vowel_teams_ai', 'vowel_teams_ay', 'vowel_teams_ea'];
  } else {
    patterns = ['blends_bl', 'blends_cr', 'blends_str'];
  }
  let words = [];
  for (const pattern of patterns) {
    const list = wordPatterns[pattern];
    if (Array.isArray(list)) {
      words = words.concat(list);
    }
  }
  return words.sort(() => Math.random() - 0.5).slice(0, count);
}

function buildPrompt({ level, recentAccuracy, difficulty }) {
  const wordBank = JSON.stringify(enhancedSpellbeeData?.phonicsPatterns || {});
  return `Generate 5 spelling words for level ${level}.
Recent accuracy: ${recentAccuracy || 'unknown'}%
Difficulty: ${difficulty}

For each word provide:
1. Word (spelled correctly)
2. Example sentence (simple English)
3. Pronunciation hint (phonetic: /kæt/)
4. Memory tip (how to remember)
5. Topic (CVC, vowel patterns, blends)

Format as JSON:
{
  "words": [
    {
      "word": "cat",
      "sentence": "The cat sleeps on the mat.",
      "pronunciation": "/kæt/",
      "hint": "c-a-t (sounds like /k/ /æ/ /t/)",
      "topic": "CVC Words"
    }
  ],
  "difficulty": "easy",
  "estimatedDuration": 10
}

Make words relatable (animals, family, school).
Use varied sentence contexts.
Word bank (by phonics pattern) to sample from: ${wordBank}
${CHILD_PSYCHOLOGY_ADDENDUM}`;
}

function parseWords(content) {
  try {
    const parsed = JSON.parse(content);
    const words = Array.isArray(parsed.words) ? parsed.words : parsed;
    if (!Array.isArray(words)) return null;
    return {
      words: words.slice(0, 5).map((w) => ({
        word: w.word,
        sentence: w.sentence,
        pronunciation: w.pronunciation,
        hint: w.hint,
        topic: w.topic || '',
      })),
      difficulty: parsed.difficulty || 'unknown',
      estimatedDuration: parsed.estimatedDuration || 10,
    };
  } catch (err) {
    return null;
  }
}

async function getCache({ userId, level, difficulty }) {
  const cacheDoc = await admin
    .firestore()
    .collection('spelling-cache')
    .doc(`${level}-${difficulty}`)
    .get();
  if (!cacheDoc.exists) return null;
  const data = cacheDoc.data();
  const updated = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
  if (!updated) return null;
  const ageMs = Date.now() - updated.getTime();
  const oneHour = 60 * 60 * 1000;
  if (ageMs > oneHour) return null;
  return data.payload || null;
}

async function setCache({ level, difficulty, payload }) {
  await admin.firestore().collection('spelling-cache').doc(`${level}-${difficulty}`).set(
    {
      payload,
      updatedAt: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  );
}

exports.generateSpellingWords = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { userId, level = 'early-primary', recentAccuracy, difficulty: requestedDifficulty } = data || {};
  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'userId required');
  }

  const difficulty = pickDifficulty(recentAccuracy, requestedDifficulty);

  // Try Firestore gameData + user progress for deterministic selection
  try {
    const [gameDataDoc, userProgressDoc] = await Promise.all([
      admin.firestore().collection('gameData').doc('spellbee').get(),
      admin.firestore().collection('users').doc(userId).collection('progress').doc('spellbee').get(),
    ]);
    const gameData = gameDataDoc.exists ? gameDataDoc.data() : null;
    const userProgress = userProgressDoc.exists ? userProgressDoc.data() : null;
    const adaptiveAcc = userProgress?.accuracy ?? recentAccuracy;
    const adaptiveDifficulty = pickDifficulty(adaptiveAcc, requestedDifficulty);
    if (gameData?.wordsByPattern) {
      const selected = selectWordsForDifficulty(gameData.wordsByPattern, adaptiveDifficulty, 5);
      if (selected.length) {
        const enhanced = selected.map((w) => ({
          word: w,
          hint: (gameData.hints || {})[w] || '',
          sentence: (gameData.sentences || {})[w] || '',
          pronunciation: (gameData.pronunciations || {})[w] || '',
          topic: (gameData.topics || {})[w] || '',
        }));
        return {
          words: enhanced,
          difficulty: adaptiveDifficulty,
          estimatedDuration: 10,
          source: 'firestore',
        };
      }
    }
  } catch (err) {
    console.error('Firestore gameData fetch failed', err);
  }

  // Try cache
  const cached = await getCache({ userId, level, difficulty });
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  const prompt = buildPrompt({ level, recentAccuracy, difficulty });
  let apiWords = null;
  let tokensUsed = null;

  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 5000 }
    );
    tokensUsed = resp.data?.usage?.total_tokens || null;
    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
    apiWords = parseWords(content);
  } catch (err) {
    console.error('Groq generateSpellingWords failed', err?.response?.data || err.message);
  }

  const payload = apiWords || {
    words: FALLBACK[difficulty],
    difficulty,
    estimatedDuration: 10,
    fallback: true,
  };

  try {
    await setCache({ level, difficulty, payload });
  } catch (err) {
    console.error('Cache set error', err);
  }

  // Store generated set
  let gameId = null;
  try {
    gameId = admin.firestore().collection('spelling-games').doc(userId).collection('games').doc().id;
    await admin
      .firestore()
      .collection('spelling-games')
      .doc(userId)
      .collection('games')
      .doc(gameId)
      .set({
        userId,
        level,
        difficulty,
        words: payload.words,
        estimatedDuration: payload.estimatedDuration,
        createdAt: admin.firestore.Timestamp.now(),
        source: apiWords ? 'groq' : 'fallback',
      });

    await admin.firestore().collection('spelling-progress').doc(userId).set(
      {
        lastDifficulty: difficulty,
        lastUpdated: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    await admin.firestore().collection('ai-usage-logs').add({
      userId,
      feature: 'generate-spelling-words',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to persist spelling data', err);
  }

  return { ...payload, source: apiWords ? 'api' : 'fallback', gameId };
});
