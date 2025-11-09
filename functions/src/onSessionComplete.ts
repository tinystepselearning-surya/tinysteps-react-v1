import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface SessionData {
  courseId: string;
  teacherId: string;
  kidIds: string[];
  enrollmentIds: string[];
  status: string;
}

export const onSessionComplete = functions
  .region('asia-south1')
  .firestore.document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as SessionData | undefined;
    const after = change.after.data() as SessionData | undefined;
    const sessionId = context.params.sessionId;

    // Detect status change to "completed"
    if (before?.status !== 'completed' && after?.status === 'completed') {
      functions.logger.info(`Session completed: sessionId=${sessionId}`);

      try {
        const session = after;
        const { courseId, teacherId, kidIds } = session;

        const batch = admin.firestore().batch();

        // Process each kid
        for (const kidId of kidIds) {
          // Find enrollment for this course
          const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('kidId', '==', kidId)
            .where('courseId', '==', courseId)
            .limit(1)
            .get();

          if (!enrollmentQuery.empty) {
            const enrollmentDoc = enrollmentQuery.docs[0];
            const enrollment = enrollmentDoc.data();

            // Check attendance
            const attendanceDoc = await admin.firestore()
              .collection('attendance')
              .doc(sessionId)
              .collection('attendanceRecords')
              .doc(kidId)
              .get();

            const attendanceData = attendanceDoc.data();
            if (attendanceDoc.exists && attendanceData?.status === 'present') {
              // Decrement creditsRemaining, increment creditsUsed
              const newCreditsRemaining = enrollment.creditsRemaining - 1;
              const newCreditsUsed = enrollment.creditsUsed + 1;

              batch.update(enrollmentDoc.ref, {
                creditsRemaining: newCreditsRemaining,
                creditsUsed: newCreditsUsed,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'onSessionComplete'
              });

              // Check for alert
              if (newCreditsRemaining <= 2) {
                // Create alert ticket for LP (assuming LP is in enrollment)
                const alertRef = admin.firestore().collection('alerts').doc();
                batch.set(alertRef, {
                  type: 'low_credits',
                  enrollmentId: enrollmentDoc.id,
                  kidId,
                  creditsRemaining: newCreditsRemaining,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  createdBy: 'onSessionComplete'
                });
              }
            }
          } else {
            functions.logger.warn(`Enrollment not found for kidId=${kidId}, courseId=${courseId}`);
          }
        }

        // Commit batch
        await batch.commit();

        // Call recomputeStudentSummary for each kid
        const promises = kidIds.map((kidId: string) => recomputeStudentSummary(kidId, courseId));
        await Promise.all(promises);

        // Call accrueTeacherEarnings
        await accrueTeacherEarnings(teacherId, sessionId);

        functions.logger.info(`Session completed: sessionId=${sessionId}, kids=${kidIds.length}, credits_updated=true`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        functions.logger.error(`Error in onSessionComplete: ${errorMessage}`, { sessionId });
        throw new functions.https.HttpsError('internal', 'Failed to process session completion');
      }
    }
  });

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