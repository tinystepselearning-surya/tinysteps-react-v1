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

function dateRangeDays(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
}

function buildPrompt({ common, struggling, atRiskCount }) {
  const topError = common[0]?.name || 'N/A';
  const topic = topError;
  const numStudents = struggling.length;
  return `Class performance analysis:
- Most common error: ${topError}
- ${numStudents} students struggling with ${topic}
- ${atRiskCount} at-risk students

Suggest 3 teaching strategies to address these errors.
Keep it practical and actionable.
Return JSON: {"strategies":["...","...","..."]}`;
}

exports.analyzeStudentErrors = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { classId, dateRange = 7 } = data || {};
  if (!classId || typeof classId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'classId required');
  }
  const days = [7, 30, 90].includes(dateRange) ? dateRange : 7;
  const { start, end } = dateRangeDays(days);

  const firestore = admin.firestore();
  const studentsSnap = await firestore
    .collection('students')
    .where('classId', '==', classId)
    .get();
  const studentIds = studentsSnap.docs.map((d) => d.id);
  if (studentIds.length === 0) {
    return { commonErrors: [], atRiskStudents: [], suggestions: [] };
  }

  const logSnap = await firestore
    .collection('student-daily-practice-log')
    .where('studentId', 'in', studentIds.slice(0, 10)) // Firestore in limitation; basic sampling
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(end))
    .get();

  const errors = {};
  const studentStats = {};
  logSnap.forEach((doc) => {
    const d = doc.data();
    const key = d.errorType || d.exerciseType || 'unknown';
    errors[key] = errors[key] ? errors[key] + 1 : 1;
    const s = d.studentId;
    if (!studentStats[s]) studentStats[s] = { attempts: 0, correct: 0 };
    studentStats[s].attempts += 1;
    if (d.correct) studentStats[s].correct += 1;
  });

  const commonErrors = Object.entries(errors)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const atRiskStudents = Object.entries(studentStats)
    .map(([id, { attempts, correct }]) => ({
      studentId: id,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    }))
    .filter((s) => s.accuracy < 60);

  // Build Groq strategies
  let strategies = [];
  try {
    const prompt = buildPrompt({
      common: commonErrors,
      struggling: atRiskStudents,
      atRiskCount: atRiskStudents.length,
    });
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.45,
        max_tokens: 400,
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 8000 }
    );
    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
    const parsed = JSON.parse(content);
    strategies = parsed.strategies || [];
  } catch (err) {
    console.error('analyzeStudentErrors Groq failed', err.response?.data || err.message);
    strategies = ['Model review past errors together', 'Small-group re-teach with manipulatives', 'Extra practice with feedback'];
  }

  return {
    commonErrors,
    atRiskStudents,
    suggestions: strategies,
  };
});
