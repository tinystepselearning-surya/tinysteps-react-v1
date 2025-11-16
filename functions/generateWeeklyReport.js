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

const weeklyReportPrompt = `Generate a warm, encouraging weekly progress report for a parent.

Child: {childName}, age {age}
Week: {dateRange}

Performance data:
- Sessions completed: {sessionsCount}
- Total practice time: {totalMinutes} minutes
- Average accuracy: {avgAccuracy}%
- Topics practiced: {topics}
- Common errors: {topErrors}

Generate a report with:
1. 3 specific achievements (with numbers/percentages)
2. Progress comparison (this week vs last week)
3. 3 specific home practice recommendations
4. One teacher insight (warm, observational)
5. What to focus on next week

Tone: Warm, encouraging, specific numbers, no jargon.
Length: 200-300 words for email.

Format as markdown.`;

async function fetchPerformanceMetrics(childId, weekEndDate) {
  const firestore = admin.firestore();
  const end = weekEndDate ? new Date(weekEndDate) : new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const practiceSnap = await firestore
    .collection('practice-history')
    .where('studentId', '==', childId)
    .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
    .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
    .get();

  const sessionsCount = practiceSnap.size;
  let totalMinutes = 0;
  let accuracySum = 0;
  let topics = new Set();
  let errors = {};

  practiceSnap.forEach((doc) => {
    const d = doc.data();
    totalMinutes += d.durationMinutes || 0;
    if (typeof d.totalScore === 'number') accuracySum += d.totalScore;
    if (Array.isArray(d.strengths)) d.strengths.forEach((t) => topics.add(t));
    if (Array.isArray(d.weaknesses)) d.weaknesses.forEach((w) => (errors[w] = (errors[w] || 0) + 1));
  });

  const avgAccuracy = sessionsCount ? Math.round(accuracySum / sessionsCount) : 0;
  const topErrors = Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  // Basic child profile
  const profileSnap = await firestore.collection('students').doc(childId).get();
  const childName = profileSnap.exists ? profileSnap.data().studentName || 'your child' : 'your child';
  const age = profileSnap.exists ? profileSnap.data().age || '—' : '—';

  return {
    childName,
    age,
    sessionsCount,
    totalMinutes,
    avgAccuracy,
    topics: Array.from(topics).slice(0, 5),
    topErrors,
    dateRange: `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
  };
}

exports.generateWeeklyReport = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const { childId, weekEndDate } = data || {};
  if (!childId || typeof childId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'childId is required');
  }

  const perf = await fetchPerformanceMetrics(childId, weekEndDate);

  let reportText = null;
  let tokensUsed = null;
  try {
    const apiKey = await getGroqApiKey();
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: weeklyReportPrompt },
          {
            role: 'user',
            content: `Child: ${perf.childName}, age ${perf.age}
Week: ${perf.dateRange}
Sessions completed: ${perf.sessionsCount}
Total practice time: ${perf.totalMinutes} minutes
Average accuracy: ${perf.avgAccuracy}%
Topics practiced: ${perf.topics.join(', ') || 'Not available'}
Common errors: ${perf.topErrors.join(', ') || 'None logged'}`,
          },
        ],
        max_tokens: 500,
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
    reportText =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      '';
  } catch (err) {
    console.error('Error generating weekly report:', err?.response?.data || err.message);
    throw new functions.https.HttpsError('internal', 'Could not generate report');
  }

  const weekKey = (weekEndDate ? new Date(weekEndDate) : new Date()).toISOString().slice(0, 10);
  try {
    await admin
      .firestore()
      .collection('parent-weekly-reports')
      .doc(childId)
      .collection('reports')
      .doc(weekKey)
      .set({
        report: reportText,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        tokens: tokensUsed,
        childId,
        weekEndDate: weekKey,
      });
  } catch (err) {
    console.error('Failed to store weekly report', err);
  }

  return { report: reportText, cost: 0, tokens: tokensUsed };
});
