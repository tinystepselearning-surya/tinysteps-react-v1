import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface MarkAttendanceRequest {
  sessionId: string;
  date: string;
  attendance: { [kidId: string]: 'present' | 'absent' | 'late' };
}

export const markAttendance = functions.https.onCall(
  async (data, context) => {
    const { sessionId, date, attendance } = data as MarkAttendanceRequest;

    if (!sessionId || !date || !attendance) {
      throw new functions.https.HttpsError('invalid-argument', 'sessionId, date, and attendance are required');
    }

    try {
      // Verify caller is teacher
      const sessionDoc = await admin.firestore().collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Session not found');
      }
      const session = sessionDoc.data()!;
      if (session.teacherId !== context.auth?.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only the assigned teacher can mark attendance');
      }

      const batch = admin.firestore().batch();
      let count = 0;

      for (const [kidId, status] of Object.entries(attendance)) {
        const attendanceRef = admin.firestore()
          .collection('attendance')
          .doc(sessionId)
          .collection('attendanceRecords')
          .doc(kidId);

        batch.set(attendanceRef, {
          kidId,
          status,
          markedAt: admin.firestore.FieldValue.serverTimestamp(),
          markedBy: context.auth!.uid
        });
        count++;
      }

      // Update session status to completed
      batch.update(sessionDoc.ref, {
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth!.uid
      });

      await batch.commit();

      // Trigger onSessionComplete (it will handle credits/summary)
      // Since it's a trigger, it should fire automatically on update

      functions.logger.info(`Attendance marked: sessionId=${sessionId}, count=${count}, markedBy=${context.auth!.uid}`);

      return { success: true, marked: count };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error(`Error in markAttendance: ${errorMessage}`, { sessionId, date });
      throw new functions.https.HttpsError('internal', 'Failed to mark attendance');
    }
  }
);