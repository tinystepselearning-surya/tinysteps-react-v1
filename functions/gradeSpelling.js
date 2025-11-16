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

const { CHILD_PSYCHOLOGY_ADDENDUM } = require('./promptAddendum');

const systemPrompt = `Kid spelling feedback assistant. Be brief, encouraging, and age-appropriate. Use emojis: ✅ correct, 🤔 retry, 💡 tip. Respond as JSON.
${CHILD_PSYCHOLOGY_ADDENDUM}`;

function buildPrompt({ correctWord, studentAnswer, age, difficulty }) {
  return `Kid tried to spell "${correctWord}" but typed "${studentAnswer}".
Age level: ${age || '6-8'}
Difficulty: ${difficulty}

Provide brief, encouraging feedback:
1. Is it correct? (true/false)
2. If wrong: Show correct spelling
3. Memory tip (how to remember correct spelling)
4. One-sentence encouragement
5. Short explanation of the spelling pattern

Format:
{
  "correct": true/false,
  "feedback": "Your spelling of ${studentAnswer} is...",
  "tip": "Memory trick: ...",
  "encouragement": "Great effort!",
  "explanation": "Why this spelling"
}`;
}

function levenshtein(a, b) {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function fallbackFeedback(correctWord, studentAnswer) {
  const dist = levenshtein(correctWord, studentAnswer);
  const isCorrect = dist === 0;
  const almost = dist === 1;
  if (isCorrect) {
    return {
      correct: true,
      feedback: `✅ Great job! "${studentAnswer}" is correct.`,
      tip: 'Keep sounding out each letter.',
      encouragement: 'Awesome spelling!',
      explanation: 'Exact match.',
      score: 100,
      fallback: true,
    };
  }
  if (almost) {
    return {
      correct: false,
      feedback: `🤔 Almost! "${studentAnswer}" is close.`,
      tip: `Check the letters: ${correctWord}`,
      encouragement: 'One tiny tweak and you got it!',
      explanation: 'One letter off.',
      score: 70,
      fallback: true,
    };
  }
  return {
    correct: false,
    feedback: `💡 The correct spelling is "${correctWord}".`,
    tip: `Sound it out: ${correctWord.split('').join('-')}`,
    encouragement: 'Keep practicing—you’re improving!',
    explanation: 'Multiple letters differ.',
    score: 50,
    fallback: true,
  };
}

function parseResponse(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      correct: !!parsed.correct,
      feedback: parsed.feedback || '',
      tip: parsed.tip || '',
      encouragement: parsed.encouragement || '',
      explanation: parsed.explanation || '',
    };
  } catch (err) {
    return null;
  }
}

function difficultyMultiplier(diff) {
  if (diff === 'hard') return 3;
  if (diff === 'medium') return 2;
  return 1;
}

async function updateProgressAndLeaderboard({ userId, correct, difficulty }) {
  const db = admin.firestore();
  const mult = difficultyMultiplier(difficulty);
  const scoreDelta = correct ? 10 * mult : 0;

  // progress
  await db.runTransaction(async (tx) => {
    const ref = db.collection('spelling-progress').doc(userId);
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { correct: 0, attempts: 0, score: 0 };
    const attempts = (data.attempts || 0) + 1;
    const correctCount = (data.correct || 0) + (correct ? 1 : 0);
    const accuracy = attempts ? Math.round((correctCount / attempts) * 100) : 0;
    tx.set(
      ref,
      {
        correct: correctCount,
        attempts,
        accuracy,
        score: (data.score || 0) + scoreDelta,
        lastUpdated: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
  });

  // leaderboard
  await db.runTransaction(async (tx) => {
    const ref = db.collection('spelling-leaderboard').doc(userId);
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { score: 0, games: 0 };
    tx.set(
      ref,
      {
        score: (data.score || 0) + scoreDelta,
        lastUpdated: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
  });
}

exports.gradeSpelling = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { userId, correctWord, studentAnswer, difficulty = 'medium', age = '6-8', gameId } = data || {};
  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'userId required');
  }
  if (!correctWord || typeof correctWord !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'correctWord required');
  }
  if (!studentAnswer || typeof studentAnswer !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'studentAnswer required');
  }

  const db = admin.firestore();
  let tokensUsed = null;
  let ai = null;

  // If exact match, short-circuit
  const exactMatch = correctWord.trim().toLowerCase() === studentAnswer.trim().toLowerCase();
  if (exactMatch) {
    ai = {
      correct: true,
      feedback: `✅ Great job! "${correctWord}" is correct.`,
      tip: 'Keep sounding out each letter.',
      encouragement: 'Awesome spelling!',
      explanation: 'Exact match.',
      score: 100,
    };
  } else {
    try {
      const apiKey = await getGroqApiKey();
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: buildPrompt({ correctWord, studentAnswer, age, difficulty }) },
          ],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 1.0,
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 3000 }
      );
      tokensUsed = resp.data?.usage?.total_tokens || null;
      const content =
        resp.data?.choices?.[0]?.message?.content ||
        resp.data?.choices?.[0]?.text ||
        '';
      const parsed = parseResponse(content);
      if (parsed) {
        ai = {
          ...parsed,
          score: parsed.correct ? 100 : 60,
        };
      }
    } catch (err) {
      console.error('Groq gradeSpelling failed', err?.response?.data || err.message);
    }
  }

  if (!ai) {
    ai = fallbackFeedback(correctWord, studentAnswer);
  }

  // Update user-scoped progress and stats (optional additive to existing logs)
  const userProgressRef = db.collection('users').doc(userId).collection('progress').doc('spellbee');
  try {
    await userProgressRef.set(
      {
        accuracy: ai.correct ? 1 : 0,
        played: admin.firestore.FieldValue.increment(1),
        lastPlayed: admin.firestore.Timestamp.now(),
        totalPoints: admin.firestore.FieldValue.increment(ai.correct ? 10 : 0),
      },
      { merge: true }
    );
    await db
      .collection('users')
      .doc(userId)
      .collection('gameStats')
      .add({
        game: 'spellbee',
        timestamp: admin.firestore.Timestamp.now(),
        correct: ai.correct,
        word: correctWord,
        answer: studentAnswer,
        difficulty,
      });
  } catch (err) {
    console.error('User progress update failed', err);
  }

  // Persist attempt
  try {
    const attemptRef = gameId
      ? db.collection('spelling-games').doc(userId).collection('games').doc(gameId).collection('attempts')
      : db.collection('student-spelling-log');
    await attemptRef.add({
      userId,
      correctWord,
      studentAnswer,
      correct: ai.correct,
      feedback: ai.feedback,
      tip: ai.tip,
      encouragement: ai.encouragement,
      explanation: ai.explanation,
      score: ai.score,
      difficulty,
      tokensUsed,
      createdAt: admin.firestore.Timestamp.now(),
    });

    await db.collection('ai-usage-logs').add({
      userId,
      feature: 'spelling-grade',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to log spelling attempt', err);
  }

  // Update progress / leaderboard
  try {
    await updateProgressAndLeaderboard({ userId, correct: ai.correct, difficulty });
  } catch (err) {
    console.error('Progress/leaderboard update failed', err);
  }

  return ai;
});
