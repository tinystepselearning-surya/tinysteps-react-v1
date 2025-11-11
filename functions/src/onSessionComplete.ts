import * as functions from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface SessionData {
  courseId: string;
  teacherId: string;
  kidIds: string[];
  enrollmentIds?: string[];
  status: string;
}

async function processSessionCompletion(sessionId: string, session: SessionData) {
  const { courseId, teacherId, kidIds } = session;
  const batch = admin.firestore().batch();

  for (const kidId of kidIds) {
    const enrollmentQuery = await admin
      .firestore()
      .collection('enrollments')
      .where('kidId', '==', kidId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!enrollmentQuery.empty) {
      const enrollmentDoc = enrollmentQuery.docs[0];
      const enrollment = enrollmentDoc.data();

      const attendanceDoc = await admin
        .firestore()
        .collection('attendance')
        .doc(sessionId)
        .collection('attendanceRecords')
        .doc(kidId)
        .get();

      const attendanceData = attendanceDoc.data();
      if (attendanceDoc.exists && attendanceData?.status === 'present') {
        const newCreditsRemaining = (enrollment.creditsRemaining || 0) - 1;
        const newCreditsUsed = (enrollment.creditsUsed || 0) + 1;

        batch.update(enrollmentDoc.ref, {
          creditsRemaining: newCreditsRemaining,
          creditsUsed: newCreditsUsed,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'onSessionComplete',
        });

        if (newCreditsRemaining <= 2) {
          const alertRef = admin.firestore().collection('alerts').doc();
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
    } else {
      functions.logger.warn(`Enrollment not found for kidId=${kidId}, courseId=${courseId}`);
    }
  }

  await batch.commit();

  await Promise.all(kidIds.map((kidId: string) => recomputeStudentSummary(kidId, courseId)));
  await accrueTeacherEarnings(teacherId, sessionId);

  functions.logger.info(`Session completed: sessionId=${sessionId}, kids=${kidIds.length}, credits_updated=true`);
}

export const onSessionCompleteTrigger = functions
  .region('asia-south1')
  .firestore.document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as SessionData | undefined;
    const after = change.after.data() as SessionData | undefined;
    const sessionId = context.params.sessionId;

    if (before?.status !== 'completed' && after?.status === 'completed') {
      try {
        await processSessionCompletion(sessionId, after as SessionData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        functions.logger.error(`Error in onSessionCompleteTrigger: ${errorMessage}`, { sessionId });
      }
    }
  });

export const onSessionComplete = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (data: any, context) => {
    if (!context.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { sessionId } = data as { sessionId?: string };
    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const snapshot = await admin.firestore().doc(`sessions/${sessionId}`).get();
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }

    const session = snapshot.data() as SessionData;
    const isTeacher = context.auth.token.teacher && context.auth.uid === session.teacherId;
    const isAdmin = context.auth.token.admin;

    if (!isTeacher && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only the assigned teacher or an admin can run this action.');
    }

    try {
      await processSessionCompletion(sessionId, session);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error(`Callable onSessionComplete failed: ${errorMessage}`, { sessionId });
      throw new HttpsError('internal', 'Unable to finalize session. Please retry later.');
    }
  }
);

// Helper function to recompute student summary (placeholder, implement in recomputeStudentSummary.ts)
async function recomputeStudentSummary(kidId: string, courseId: string) {
  // Implementation from Function 2
  functions.logger.info(`Recomputing summary for kidId=${kidId}, courseId=${courseId}`);
}

// Helper function to accrue teacher earnings
async function accrueTeacherEarnings(teacherId: string, sessionId: string) {
  // Placeholder: Implement earnings logic
  functions.logger.info(`Accruing earnings for teacherId=${teacherId}, sessionId=${sessionId}`);
}
