import * as functions from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Session shape in Firestore
interface SessionData {
  courseId: string;
  teacherId: string;
  kidIds: string[];
  enrollmentIds?: string[];
  status: string;
  // Mark that credits have been processed for this session
  creditsProcessed?: boolean;
  creditsProcessedAt?: admin.firestore.Timestamp;
}

interface CreditChange {
  kidId: string;
  enrollmentId: string;
  previousRemaining: number;
  newRemaining: number;
  previousUsed: number;
  newUsed: number;
  attendanceStatus: string | null;
}

async function processSessionCompletion(sessionId: string, session: SessionData) {
  const { courseId, teacherId, kidIds, creditsProcessed } = session;

  // Guard: minimal session info
  if (!courseId || !teacherId || !Array.isArray(kidIds) || kidIds.length === 0) {
    functions.logger.warn('processSessionCompletion: missing core fields', {
      sessionId,
      courseId,
      teacherId,
      kidIds,
    });
    return;
  }

  // Idempotency guard – if already processed, do nothing
  if (creditsProcessed) {
    functions.logger.info(
      'processSessionCompletion: session already processed, skipping',
      { sessionId }
    );
    return;
  }

  const db = admin.firestore();
  const batch = db.batch();

  let creditsEarnedForTeacher = 0;
  const creditChanges: CreditChange[] = [];

  for (const kidId of kidIds) {
    if (!kidId) continue;

    // Find enrollment for this kid + course
    const enrollmentQuery = await db
      .collection('enrollments')
      .where('kidId', '==', kidId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (enrollmentQuery.empty) {
      functions.logger.warn(
        `Enrollment not found for kidId=${kidId}, courseId=${courseId}`
      );
      continue;
    }

    const enrollmentDoc = enrollmentQuery.docs[0];
    const enrollment = enrollmentDoc.data();

    // Look up attendance for this session + kid
    const attendanceDoc = await db
      .collection('attendance')
      .doc(sessionId)
      .collection('attendanceRecords')
      .doc(kidId)
      .get();

    const attendanceData = attendanceDoc.data();

    // Only count if present (you can change this to include 'late' if you want)
    if (attendanceDoc.exists && attendanceData?.status === 'present') {
      const currentRemaining =
        typeof enrollment.creditsRemaining === 'number'
          ? enrollment.creditsRemaining
          : 0;
      const currentUsed =
        typeof enrollment.creditsUsed === 'number'
          ? enrollment.creditsUsed
          : 0;

      const newCreditsRemaining = currentRemaining - 1;
      const newCreditsUsed = currentUsed + 1;

      batch.update(enrollmentDoc.ref, {
        creditsRemaining: newCreditsRemaining,
        creditsUsed: newCreditsUsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'onSessionComplete',
      });

      creditsEarnedForTeacher++;

      creditChanges.push({
        kidId,
        enrollmentId: enrollmentDoc.id,
        previousRemaining: currentRemaining,
        newRemaining: newCreditsRemaining,
        previousUsed: currentUsed,
        newUsed: newCreditsUsed,
        attendanceStatus: attendanceData?.status || null,
      });

      // Low-credit alert
      if (newCreditsRemaining <= 2) {
        const alertRef = db.collection('alerts').doc();
        batch.set(alertRef, {
          type: 'low_credits',
          enrollmentId: enrollmentDoc.id,
          kidId,
          creditsRemaining: newCreditsRemaining,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'onSessionComplete',
        });
      }
    }
  }

  // Mark session as processed so we never double-charge
  const sessionRef = db.collection('sessions').doc(sessionId);
  batch.set(
    sessionRef,
    {
      creditsProcessed: true,
      creditsProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  // ---- AUDIT LOG WRITE ----
  try {
    const auditRef = db.collection('auditLogs').doc();
    await auditRef.set({
      type: 'session_completion',
      sessionId,
      courseId,
      teacherId,
      kidIds,
      creditsEarned: creditsEarnedForTeacher,
      creditChanges,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'onSessionComplete',
    });
    functions.logger.info('Session audit log written', {
      sessionId,
      auditLogId: auditRef.id,
      creditsEarnedForTeacher,
    });
  } catch (err) {
    functions.logger.error('Failed to write session audit log', {
      sessionId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Post-processing (non-batched)
  await Promise.all(
    kidIds.map((kidId: string) => recomputeStudentSummary(kidId, courseId))
  );

  await accrueTeacherEarnings(
    teacherId,
    sessionId,
    courseId,
    creditsEarnedForTeacher
  );

  functions.logger.info('Session completed and processed', {
    sessionId,
    kidCount: kidIds.length,
    creditsEarnedForTeacher,
  });
}

// Firestore trigger: when a session status becomes "completed"
export const onSessionCompleteTrigger = functions
  .region('asia-south1')
  .firestore.document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as SessionData | undefined;
    const after = change.after.data() as SessionData | undefined;
    const sessionId = context.params.sessionId;

    // Only run when status flips to completed
    if (before?.status !== 'completed' && after?.status === 'completed') {
      try {
        await processSessionCompletion(sessionId, after as SessionData);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        functions.logger.error(
          `Error in onSessionCompleteTrigger: ${errorMessage}`,
          { sessionId }
        );
      }
    }
  });

// Callable: manual finalize / re-run by teacher or admin
export const onSessionComplete = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { sessionId } = data as { sessionId?: string };
    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const db = admin.firestore();
    const snapshot = await db.doc(`sessions/${sessionId}`).get();
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }

    const session = snapshot.data() as SessionData;

    // Require session to be marked completed (e.g., via markAttendance)
    if (session.status !== 'completed') {
      throw new HttpsError(
        'failed-precondition',
        'Session must be marked completed before finalization.'
      );
    }

    const claims = context.auth.token as any;
    const isTeacher =
      !!claims.teacher && context.auth.uid === session.teacherId;
    const isAdmin = !!claims.admin || claims.role === 'admin';

    if (!isTeacher && !isAdmin) {
      throw new HttpsError(
        'permission-denied',
        'Only the assigned teacher or an admin can run this action.'
      );
    }

    try {
      await processSessionCompletion(sessionId, session);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error(
        `Callable onSessionComplete failed: ${errorMessage}`,
        { sessionId }
      );
      throw new HttpsError(
        'internal',
        'Unable to finalize session. Please retry later.'
      );
    }
  }
);

// Helper: recompute student summary (currently using your existing logic/stub)
// You can later replace this with a real import from ./recomputeStudentSummary
async function recomputeStudentSummary(kidId: string, courseId: string) {
  functions.logger.info(
    `Recomputing summary for kidId=${kidId}, courseId=${courseId}`
  );
}

// Minimal earnings model: per-teacher, per-month
async function accrueTeacherEarnings(
  teacherId: string,
  sessionId: string,
  courseId: string,
  creditsEarned: number
) {
  if (!teacherId || creditsEarned <= 0) {
    functions.logger.info('accrueTeacherEarnings: nothing to do', {
      teacherId,
      creditsEarned,
    });
    return;
  }

  const db = admin.firestore();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthId = `${year}-${month}`; // e.g. "2025-11"

  const earningsRef = db
    .collection('teachers')
    .doc(teacherId)
    .collection('earnings')
    .doc(monthId);

  await earningsRef.set(
    {
      teacherId,
      month: monthId,
      sessionsCompleted: admin.firestore.FieldValue.increment(1),
      creditsEarned: admin.firestore.FieldValue.increment(creditsEarned),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSessionId: sessionId,
      lastCourseId: courseId,
    },
    { merge: true }
  );

  functions.logger.info('Teacher earnings updated', {
    teacherId,
    monthId,
    sessionId,
    creditsEarned,
  });
}
