const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');

try {
  admin.initializeApp();
} catch (e) {
  /* noop */
}

const secretClient = new SecretManagerServiceClient();

async function getGroqApiKey() {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0) {
    return process.env.GROQ_API_KEY.trim();
  }
  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  if (!projectId) throw new Error('GCP project id not available in env');
  const secretName = process.env.GROQ_SECRET_NAME || 'groq-api-key';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  const [version] = await secretClient.accessSecretVersion({ name });
  const payload =
    version.payload && version.payload.data ? version.payload.data.toString('utf8') : null;
  if (!payload) throw new Error('Groq API key secret payload empty');
  return payload;
}

const FOCUS_TYPES = ['phonics', 'grammar', 'blending', 'mixed'];
const LEVELS = ['early-primary', 'primary', 'upper-primary'];

function difficultyFromHistory(scores = []) {
  if (!scores.length) return 'moderate';
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  if (avg < 70) return 'easy';
  if (avg > 85) return 'hard';
  return 'moderate';
}

function pickCount() {
  return Math.min(5, Math.max(3, 3 + Math.floor(Math.random() * 3)));
}

function buildPrompt({ count, level, recentHistory, focusArea, difficulty }) {
  const historyText = JSON.stringify(recentHistory || []);
  const focus = FOCUS_TYPES.includes(focusArea) ? focusArea : 'mixed';
  return `
You are an adaptive phonics and grammar tutor for children ages 5-12.
Generate ${count} practice exercises for a ${level} student.
Recent performance: ${historyText}
Focus area: ${focus}
Adapt difficulty: ${difficulty}

Requirements:
1. Create ${count} varied exercises (mix of: sound matching, word building, sentence fill-in, multiple choice)
2. Adapt difficulty based on recent scores (if <70%, easier; if >85%, harder; if 70-85%, maintain)
3. Each exercise format:
   {
     "type": "phonics|grammar|blending",
     "prompt": "Clear, child-friendly instruction",
     "options": ["a) ...", "b) ...", "c) ..."],
     "answer": "a",
     "explanation": "Why this is correct"
   }
4. Make exercises fun and relatable (school, home, animals, food)
5. Include one review question from yesterday's weak areas (if any)

Output as JSON array. Keep explanations 1-2 sentences. Use emojis where helpful.
`;
}

function isToday(ts) {
  const now = new Date();
  const then = ts.toDate ? ts.toDate() : ts;
  return (
    now.toISOString().slice(0, 10) === new Date(then).toISOString().slice(0, 10)
  );
}

function parseExercises(text) {
  try {
    const json = typeof text === 'string' ? JSON.parse(text) : text;
    if (!Array.isArray(json)) throw new Error('not array');
    return json.slice(0, 5).map((ex, idx) => ({
      type: ex.type || 'phonics',
      prompt: ex.prompt || '',
      options: ex.options || [],
      answer: ex.answer || '',
      explanation: ex.explanation || '',
      index: idx,
    }));
  } catch (err) {
    return null;
  }
}

exports.generateDailyPractice = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { studentId, level, recentHistory = [], focusArea = 'mixed' } = data || {};
    if (!studentId || typeof studentId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'studentId required');
    }
    if (!LEVELS.includes(level)) {
      throw new functions.https.HttpsError('invalid-argument', 'level invalid');
    }

    const firestore = admin.firestore();
    const todayKey = new Date().toISOString().slice(0, 10);
    const existingQuery = await firestore
      .collection('daily-practice')
      .where('studentId', '==', studentId)
      .where('dateKey', '==', todayKey)
      .limit(1)
      .get();
    if (!existingQuery.empty) {
      const doc = existingQuery.docs[0];
      return { ...(doc.data() || {}), cached: true };
    }

    const scoresSnap = await firestore
      .collection('practice-history')
      .where('studentId', '==', studentId)
      .orderBy('date', 'desc')
      .limit(5)
      .get();
    const scores = [];
    scoresSnap.forEach((d) => {
      const s = d.data();
      if (typeof s.totalScore === 'number') scores.push(s.totalScore);
    });
    const difficulty = difficultyFromHistory(scores);
    const count = pickCount();
    const prompt = buildPrompt({ count, level, recentHistory: scores, focusArea, difficulty });

    let exercises = null;
    let tokensUsed = null;
    let fallbackUsed = false;

    try {
      const apiKey = await getGroqApiKey();
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.8,
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10_000 }
      );
      const msg =
        resp.data?.choices?.[0]?.message?.content ||
        resp.data?.choices?.[0]?.text ||
        '';
      tokensUsed = resp.data?.usage?.total_tokens || null;
      exercises = parseExercises(msg);
      if (!exercises) throw new Error('Parse error');
    } catch (err) {
      console.error('Groq daily practice failed', err.response?.data || err.message);
      fallbackUsed = true;
      exercises = [
        {
          type: 'phonics',
          prompt: 'Sound out the word: c-a-t. Which picture shows it?',
          options: ['a) cat', 'b) cap', 'c) cab'],
          answer: 'a',
          explanation: 'c-a-t makes cat. 🐱',
        },
        {
          type: 'grammar',
          prompt: 'Choose the correct plural: One fox, two _____.',
          options: ['a) foxs', 'b) foxes', 'c) foxies'],
          answer: 'b',
          explanation: '"Foxes" is the correct plural.',
        },
        {
          type: 'blending',
          prompt: 'Blend the sounds: sh + ip = ?',
          options: ['a) sip', 'b) ship', 'c) shop'],
          answer: 'b',
          explanation: 'sh + ip → ship. 🚢',
        },
      ].slice(0, count);
    }

    const docRef = await firestore.collection('daily-practice').add({
      studentId,
      date: admin.firestore.Timestamp.now(),
      dateKey: todayKey,
      level,
      focusArea,
      difficulty,
      exercises,
      totalExercises: exercises.length,
      estimatedTime: Math.max(5, exercises.length * 2),
      completed: false,
      score: null,
      duration: null,
      createdAt: admin.firestore.Timestamp.now(),
      cached: false,
      fallbackUsed,
    });

    await firestore.collection('ai-usage-logs').add({
      studentId,
      feature: 'daily-practice',
      tokens_used: tokensUsed,
      cost: 0,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return {
      id: docRef.id,
      exercises,
      totalExercises: exercises.length,
      estimatedTime: Math.max(5, exercises.length * 2),
      difficulty,
      fallbackUsed,
    };
  });

async function getRecentHistory(studentId) {
  const snap = await admin
    .firestore()
    .collection('practice-history')
    .where('studentId', '==', studentId)
    .orderBy('date', 'desc')
    .limit(5)
    .get();
  return snap.docs.map((d) => d.data());
}

function determineFocusArea(weakAreas = []) {
  if (Array.isArray(weakAreas) && weakAreas.length) {
    const first = weakAreas[0];
    if (FOCUS_TYPES.includes(first)) return first;
  }
  return 'mixed';
}

async function generateDailyPracticeInternal({ studentId, level, recentHistory, focusArea }) {
  return await exports.generateDailyPractice({
    data: { studentId, level, recentHistory, focusArea },
    context: { auth: { uid: studentId } },
  });
}

exports.scheduleDailyPracticeGeneration = functions
  .region('us-central1')
  .pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const firestore = admin.firestore();
    const students = await firestore
      .collection('students')
      .where('enrollmentStatus', '==', 'active')
      .get();

    const tasks = [];
    const concurrency = 10;

    for (const doc of students.docs) {
      const studentId = doc.id;
      const data = doc.data() || {};
      tasks.push(async () => {
        const todayKey = new Date().toISOString().slice(0, 10);
        const exists = await firestore
          .collection('daily-practice')
          .where('studentId', '==', studentId)
          .where('dateKey', '==', todayKey)
          .limit(1)
          .get();
        if (!exists.empty) return;
        try {
          await generateDailyPracticeInternal({
            studentId,
            level: data.level || 'early-primary',
            recentHistory: await getRecentHistory(studentId),
            focusArea: determineFocusArea(data.weakAreas),
          });
        } catch (err) {
          console.error('Scheduled practice failed for', studentId, err.message);
        }
      });
    }

    const chunks = [];
    while (tasks.length) chunks.push(tasks.splice(0, concurrency));
    for (const chunk of chunks) {
      await Promise.all(chunk.map((fn) => fn()));
    }
    return null;
  });
