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

function normalizeTopic(level, topic) {
  const base = (topic || '').toLowerCase();
  const mappings = {
    'singular/plural nouns': ['singular', 'plural', 'singular/plural', 'nouns'],
    tenses: ['tense', 'tenses'],
    pronouns: ['pronoun', 'pronouns'],
    verbs: ['verb', 'verbs'],
    'subject-verb agreement': ['subject verb', 'subject-verb', 'sva'],
    adjectives: ['adjective', 'adjectives'],
    'complex sentences': ['complex', 'sentences', 'complex sentences'],
  };
  for (const key of Object.keys(mappings)) {
    if (mappings[key].some((k) => base.includes(k))) return key;
  }
  if (level === 'Early Primary') return 'singular/plural nouns';
  if (level === 'Primary') return 'tenses';
  return 'subject-verb agreement';
}

function buildPrompt({ level, topic, count }) {
  return `Create ${count} grammar exercises for ${level} kids on topic: ${topic}

Format each question:
Q{n}. Instruction | a) option | b) option | c) option
Answer: {answer}
Explanation: {why this is correct}

Make questions relatable (school, friends, family).
Avoid complex words.
Include real-world examples.

Return JSON:
[
  {
    "prompt": "Q1. ...",
    "options": ["a) ...", "b) ...", "c) ..."],
    "answer": "a",
    "explanation": "..."
  }
]; include an answerKey object keyed by question index.`;
}

function parseQuestions(text) {
  try {
    const parsed = JSON.parse(text);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
    return questions.slice(0, 10).map((q, idx) => ({
      prompt: q.prompt || '',
      options: q.options || [],
      answer: q.answer || '',
      explanation: q.explanation || '',
      index: idx,
    }));
  } catch (err) {
    return null;
  }
}

exports.generateGrammarQuiz = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { studentId, level = 'Primary', topic = 'tenses', count = 5 } = data || {};
    if (!studentId || typeof studentId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'studentId required');
    }

    const safeLevel = level;
    const safeTopic = normalizeTopic(level, topic);
    const questionCount = Math.min(10, Math.max(3, count));

    const prompt = buildPrompt({ level: safeLevel, topic: safeTopic, count: questionCount });

    let tokensUsed = null;
    let questions = null;
    let fallback = false;

    try {
      const apiKey = await getGroqApiKey();
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 900,
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 }
      );
      tokensUsed = resp.data?.usage?.total_tokens || null;
      const content =
        resp.data?.choices?.[0]?.message?.content ||
        resp.data?.choices?.[0]?.text ||
        '';
      questions = parseQuestions(content);
    } catch (err) {
      console.error('Groq grammar quiz failed', err.response?.data || err.message);
    }

    if (!questions) {
      fallback = true;
      questions = [
        {
          prompt: 'Q1. Choose the correct plural: One child, two _____.',
          options: ['a) childs', 'b) children', 'c) childs\''],
          answer: 'b',
          explanation: '"Children" is the correct plural of child.',
        },
        {
          prompt: 'Q2. Pick the verb in past tense: I ____ my homework yesterday.',
          options: ['a) do', 'b) did', 'c) doing'],
          answer: 'b',
          explanation: 'Did is past tense.',
        },
      ].slice(0, questionCount);
    }

    const answerKey = {};
    questions.forEach((q, idx) => {
      answerKey[idx] = q.answer || '';
    });

    try {
      await admin.firestore().collection('student-grammar-quiz').add({
        studentId,
        level: safeLevel,
        topic: safeTopic,
        questions,
        answerKey,
        fallback,
        tokensUsed,
        timestamp: admin.firestore.Timestamp.now(),
      });
      await admin.firestore().collection('ai-usage-logs').add({
        studentId,
        feature: 'grammar-quiz',
        tokens_used: tokensUsed,
        cost: 0,
        timestamp: admin.firestore.Timestamp.now(),
      });
    } catch (err) {
      console.error('Failed to log grammar quiz', err);
    }

    return { questions, answerKey, fallback };
  });
