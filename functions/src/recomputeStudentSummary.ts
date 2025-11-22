import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface RecomputeSummaryRequest {
  kidId: string;
  courseId: string;
}

interface StudentSummary {
  phonicsMastery: number;
  grammarMastery: number;
  speakingMastery: number;
  attendanceRate30d: number;
  sessionsCompletedMTD: number;
  worksheetsDone: number;
  lastUpdated: admin.firestore.FieldValue;
}

// Helper: convert raw score (0–100) to mastery bucket
function getMasteryFromScore(score: number): number {
  if (score >= 90) return 100;
  if (score >= 80) return 80;
  if (score >= 70) return 60;
  if (score >= 60) return 40;
  return 20;
}

// Helper: safe average
function average(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

/**
 * Core logic that recomputes a student's summary.
 * You can reuse this from other functions (e.g. onSessionComplete) if needed.
 */
export async function computeStudentSummaryCore(
  kidId: string,
  courseId: string
): Promise<StudentSummary> {
  const db = admin.firestore();

  // ---------- 1) Progress → mastery ----------
  const progressSnap = await db
    .collection('progress') // NOTE: legacy path; update to students/{kidId}/progress if you migrate
    .where('kidId', '==', kidId)
    .where('courseId', '==', courseId)
    .get();

  const areas: { [key: string]: number[] } = {
    phonics: [],
    grammar: [],
    speaking: [],
  };

  progressSnap.forEach((doc) => {
    const data = doc.data();
    const area = data.area as string | undefined;
    const score = data.score as number | undefined;

    if (!area || typeof score !== 'number') return;
    if (!areas[area]) return; // ignore unknown areas

    const mastery = getMasteryFromScore(score);
    areas[area].push(mastery);
  });

  const summary: StudentSummary = {
    phonicsMastery: average(areas.phonics),
    grammarMastery: average(areas.grammar),
    speakingMastery: average(areas.speaking),
    attendanceRate30d: 0,
    sessionsCompletedMTD: 0,
    worksheetsDone: 0,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };

  // ---------- 2) Attendance rate – last 30 days ----------
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Assumes sessions.date is stored as 'YYYY-MM-DD'
  const dateFloor = thirtyDaysAgo.toISOString().split('T')[0];

  const sessionsSnap = await db
    .collection('sessions')
    .where('kidIds', 'array-contains', kidId)
    .where('date', '>=', dateFloor)
    .get();

  let totalSessions = 0;
  let presentSessions = 0;

  for (const sessionDoc of sessionsSnap.docs) {
    const sessionId = sessionDoc.id;
    const attendanceDoc = await db
      .collection('attendance')
      .doc(sessionId)
      .collection('attendanceRecords')
      .doc(kidId)
      .get();

    if (attendanceDoc.exists) {
      totalSessions++;
      if (attendanceDoc.data()?.status === 'present') {
        presentSessions++;
      }
    }
  }

  summary.attendanceRate30d =
    totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // ---------- 3) Sessions completed month-to-date ----------
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthFloor = startOfMonth.toISOString().split('T')[0];

  const mtdSessionsSnap = await db
    .collection('sessions')
    .where('kidIds', 'array-contains', kidId)
    .where('status', '==', 'completed')
    .where('date', '>=', monthFloor)
    .get();

  summary.sessionsCompletedMTD = mtdSessionsSnap.size;

  // ---------- 4) Worksheets done ----------
  const worksheetsSnap = await db
    .collection('activities')
    .where('kidId', '==', kidId)
    .where('status', '==', 'completed')
    .get();

  summary.worksheetsDone = worksheetsSnap.size;

  // ---------- 5) Persist summary into kids/{kidId} ----------
  await db.collection('kids').doc(kidId).update({
    summary,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'recomputeStudentSummary',
  });

  functions.logger.info('Summary updated', {
    kidId,
    courseId,
    phonics: summary.phonicsMastery,
    grammar: summary.grammarMastery,
    speaking: summary.speakingMastery,
  });

  return summary;
}

/**
 * Callable wrapper so admins can force a recompute from the dashboard.
 */
export const recomputeStudentSummary = functions
  .region('asia-south1')
  .https.onCall(async (data, context) => {
    const { kidId, courseId } = data as RecomputeSummaryRequest;

    // ---------- Auth / permission checks ----------
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required'
      );
    }

    const claims = context.auth.token as any;
    const tokenIsAdmin = !!claims.admin || claims.role === 'admin';
    let firestoreIsAdmin = false;

    if (!tokenIsAdmin) {
      // Fallback: check Firestore user doc
      try {
        const callerUid = context.auth.uid;
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(callerUid)
          .get();
        const userData = userDoc.data();
        if (userData?.role === 'admin' || userData?.roles?.includes('admin')) {
          firestoreIsAdmin = true;
        }
      } catch (err) {
        // If this fails, we just don't grant admin
        functions.logger.warn(
          'recomputeStudentSummary: failed to verify admin via Firestore',
          { err }
        );
      }
    }

    if (!tokenIsAdmin && !firestoreIsAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // ---------- Input validation ----------
    if (!kidId || typeof kidId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'kidId is required and must be a string'
      );
    }
    if (!courseId || typeof courseId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'courseId is required and must be a string'
      );
    }

    try {
      const summary = await computeStudentSummaryCore(kidId, courseId);
      return { success: true, summary };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error('Error in recomputeStudentSummary', {
        error: message,
        kidId,
        courseId,
      });
      throw new functions.https.HttpsError(
        'internal',
        'Failed to recompute student summary'
      );
    }
  });
