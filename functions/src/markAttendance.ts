import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface MarkAttendanceRequest {
  sessionId: string;
  date: string; // e.g. '2025-11-22' or '20251122'
  attendance: { [kidId: string]: 'present' | 'absent' | 'late' };
}

interface MarkAttendanceResponse {
  success: boolean;
  marked: number;
}

export const markAttendance = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request): Promise<MarkAttendanceResponse> => {
    const { data, auth } = request;

    // 1) Auth check
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to mark attendance');
    }

    const { sessionId, date, attendance } = data as MarkAttendanceRequest;

    // 2) Basic validation
    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'sessionId is required');
    }
    if (!date || typeof date !== 'string') {
      throw new HttpsError('invalid-argument', 'date is required');
    }
    if (!attendance || typeof attendance !== 'object') {
      throw new HttpsError('invalid-argument', 'attendance object is required');
    }

    try {
      const db = admin.firestore();

      // 3) Load the session and verify teacher
      const sessionSnap = await db.collection('sessions').doc(sessionId).get();
      if (!sessionSnap.exists) {
        throw new HttpsError('not-found', 'Session not found');
      }

      const session = sessionSnap.data() as any;
      if (!session || session.teacherId !== auth.uid) {
        throw new HttpsError(
          'permission-denied',
          'Only the assigned teacher can mark attendance for this session'
        );
      }

      // 4) Batch attendance writes
      const batch = db.batch();
      let count = 0;

      for (const [kidId, status] of Object.entries(attendance)) {
        if (!['present', 'absent', 'late'].includes(status as string)) {
          // Skip invalid statuses instead of breaking the whole batch
          logger.warn('markAttendance: invalid status skipped', { kidId, status });
          continue;
        }

        // In your newer model, kidId == studentId
        const studentId = kidId;

        // Write under /students/{studentId}/attendance/{date}
        const attendanceRef = db
          .collection('students')
          .doc(studentId)
          .collection('attendance')
          .doc(date);

        batch.set(
          attendanceRef,
          {
            studentId,
            sessionId,
            date,
            status,
            markedAt: admin.firestore.FieldValue.serverTimestamp(),
            markedBy: auth.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: auth.uid,
          },
          { merge: true }
        );

        count++;
      }

      // 5) Update the session status to completed
      batch.update(sessionSnap.ref, {
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      });

      await batch.commit();

      logger.info('Attendance marked', {
        sessionId,
        date,
        count,
        markedBy: auth.uid,
      });

      // onSessionComplete trigger (Firestore) will react to the session status update
      return { success: true, marked: count };
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error in markAttendance', {
        sessionId,
        date,
        error: msg,
        caller: request.auth?.uid,
      });

      // If it’s already an HttpsError, just rethrow
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Failed to mark attendance');
    }
  }
);
