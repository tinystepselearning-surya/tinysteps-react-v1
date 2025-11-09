import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface ScheduleSessionBatchRequest {
  enrollmentId: string;
  cadence: 'daily' | '3x_weekly' | 'weekly' | '2x_weekly';
  startDate: string;
  endDate?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
}

interface SessionData {
  courseId: string;
  teacherId: string;
  kidIds: string[];
  enrollmentIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  joinUrl: string | null;
  status: string;
  createdBy: string;
  createdAt: admin.firestore.FieldValue;
  updatedBy: string;
  updatedAt: admin.firestore.FieldValue;
}

export const scheduleSessionBatch = functions.https.onCall(
  async (data, context) => {
    const { enrollmentId, cadence, startDate, endDate, duration = 1, startTime = '10:00', endTime = '10:30' } = data as ScheduleSessionBatchRequest;

    if (!enrollmentId || !cadence || !startDate) {
      throw new functions.https.HttpsError('invalid-argument', 'enrollmentId, cadence, and startDate are required');
    }

    try {
      // Fetch enrollment
      const enrollmentDoc = await admin.firestore().collection('enrollments').doc(enrollmentId).get();
      if (!enrollmentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Enrollment not found');
      }
      const enrollment = enrollmentDoc.data()!;
      const { kidIds, teacherId, courseId } = enrollment;

      // Generate dates
      const dates = generateDates(cadence, startDate, endDate || addMonths(startDate, duration));

      let batch = admin.firestore().batch();
      let count = 0;

      for (const date of dates) {
        const sessionRef = admin.firestore().collection('sessions').doc();
        const sessionData: SessionData = {
          courseId,
          teacherId,
          kidIds,
          enrollmentIds: [enrollmentId],
          date,
          startTime,
          endTime,
          joinUrl: null,
          status: 'scheduled',
          createdBy: context.auth?.uid || 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: context.auth?.uid || 'system',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        batch.set(sessionRef, sessionData);
        count++;
        if (count % 500 === 0) {
          await batch.commit();
          batch = admin.firestore().batch();
        }
      }

      if (count % 500 !== 0) {
        await batch.commit();
      }

      functions.logger.info(`Sessions scheduled: enrollment=${enrollmentId}, count=${count}, cadence=${cadence}`);

      return { success: true, sessionsCreated: count, dates };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error(`Error in scheduleSessionBatch: ${errorMessage}`, { enrollmentId, cadence });
      throw new functions.https.HttpsError('internal', 'Failed to schedule session batch');
    }
  }
);

function generateDates(cadence: string, startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  while (start <= end) {
    const dayOfWeek = start.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    let include = false;
    switch (cadence) {
      case 'daily':
        include = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
        break;
      case '3x_weekly':
        include = [1, 3, 5].includes(dayOfWeek); // Mon, Wed, Fri
        break;
      case 'weekly':
        include = dayOfWeek === 1; // Mon
        break;
      case '2x_weekly':
        include = [1, 4].includes(dayOfWeek); // Mon, Thu
        break;
    }

    if (include) {
      dates.push(start.toISOString().split('T')[0]);
    }

    start.setDate(start.getDate() + 1);
  }

  return dates;
}

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}