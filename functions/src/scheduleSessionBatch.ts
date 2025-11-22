// src/scheduleSessionBatch.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface ScheduleSessionBatchRequest {
  enrollmentId: string;
  cadence: 'daily' | '3x_weekly' | 'weekly' | '2x_weekly';
  startDate: string;       // "YYYY-MM-DD"
  endDate?: string;        // "YYYY-MM-DD"
  duration?: number;       // months, default 1
  startTime?: string;      // "HH:mm"
  endTime?: string;        // "HH:mm"
}

interface SessionData {
  courseId: string | null;
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
    const {
      enrollmentId,
      cadence,
      startDate,
      endDate,
      duration = 1,
      startTime = '10:00',
      endTime = '10:30',
    } = data as ScheduleSessionBatchRequest;

    // Basic validation
    if (!enrollmentId || !cadence || !startDate) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'enrollmentId, cadence, and startDate are required'
      );
    }

    // 🔐 Security: only logged-in users
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required'
      );
    }

    const claims = context.auth.token as any;
    const callerUid = context.auth.uid;
    const callerIsAdmin = !!claims.admin || claims.role === 'admin';

    try {
      const db = admin.firestore();

      // Fetch enrollment
      const enrollmentSnap = await db
        .collection('enrollments')
        .doc(enrollmentId)
        .get();

      if (!enrollmentSnap.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Enrollment not found'
        );
      }

      const enrollment = enrollmentSnap.data() || {};

      // Handle single kidId or array kidIds
      const kidIds: string[] =
        Array.isArray(enrollment.kidIds) && enrollment.kidIds.length > 0
          ? enrollment.kidIds
          : enrollment.kidId
          ? [String(enrollment.kidId)]
          : [];

      const teacherId = enrollment.teacherId as string | undefined;
      const courseId = (enrollment.courseId as string | undefined) || null;

      if (!teacherId) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Enrollment is missing teacherId'
        );
      }

      if (kidIds.length === 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Enrollment has no kidId / kidIds'
        );
      }

      // If caller is not admin, ensure they are the assigned teacher
      if (!callerIsAdmin && callerUid !== teacherId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only the assigned teacher or an admin can schedule sessions for this enrollment'
        );
      }

      if (!courseId) {
        functions.logger.warn(
          'scheduleSessionBatch: enrollment missing courseId',
          { enrollmentId }
        );
      }

      // Generate dates (use endDate if provided, else +duration months)
      const effectiveEndDate = endDate || addMonths(startDate, duration);
      const dates = generateDates(cadence, startDate, effectiveEndDate);

      if (dates.length === 0) {
        return {
          success: false,
          sessionsCreated: 0,
          dates: [],
          message: 'No dates matched the requested cadence / range',
        };
      }

      let batch = db.batch();
      let count = 0;

      for (const date of dates) {
        const sessionRef = db.collection('sessions').doc();

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
          createdBy: callerUid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: callerUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(sessionRef, sessionData);
        count++;

        if (count % 500 === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }

      if (count % 500 !== 0) {
        await batch.commit();
      }

      functions.logger.info('Sessions scheduled', {
        enrollmentId,
        count,
        cadence,
        startDate,
        endDate: effectiveEndDate,
        teacherId,
        kidIds,
        createdBy: callerUid,
      });

      return {
        success: true,
        sessionsCreated: count,
        dates,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      functions.logger.error(
        `Error in scheduleSessionBatch: ${errorMessage}`,
        { enrollmentId, cadence, callerUid }
      );

      const httpError = error as functions.https.HttpsError;
      if (httpError && (httpError as any).code) {
        throw httpError;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to schedule session batch'
      );
    }
  }
);

/**
 * Generate all dates between startDate and endDate
 * matching the chosen cadence.
 */
function generateDates(
  cadence: string,
  startDate: string,
  endDate: string
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  while (start <= end) {
    const dayOfWeek = start.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    let include = false;
    switch (cadence) {
      case 'daily':
        include = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon–Fri
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
      default:
        include = false;
    }

    if (include) {
      dates.push(start.toISOString().split('T')[0]);
    }

    start.setDate(start.getDate() + 1);
  }

  return dates;
}

/**
 * Add N months to a YYYY-MM-DD and return YYYY-MM-DD.
 */
function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}
