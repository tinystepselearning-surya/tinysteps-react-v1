import { isDeepStrictEqual } from 'node:util';

import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { onStudentProgressReadModelWrite as transactionalWriter } from './childCourseProgressProjectionTransactional';

const REGION = 'asia-south1';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isEnrollmentIdentityOnlyBackfill(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): boolean {
  if (!beforeData || !afterData) return false;
  if (text(beforeData.enrollmentId)) return false;
  if (!text(afterData.enrollmentId)) return false;

  const beforeWithoutEnrollment = { ...beforeData };
  const afterWithoutEnrollment = { ...afterData };
  delete beforeWithoutEnrollment.enrollmentId;
  delete afterWithoutEnrollment.enrollmentId;

  return isDeepStrictEqual(beforeWithoutEnrollment, afterWithoutEnrollment);
}

/**
 * Migration-aware compatibility wrapper for the canonical progress projection trigger.
 *
 * Adding only the canonical enrollmentId is authorization metadata repair, not a teacher
 * progress save. Such writes must not create synthetic progress events or mutate educational
 * completion history. Every other source write delegates to the existing transactional writer.
 */
export const onStudentProgressReadModelWrite = onDocumentWritten(
  {
    document: 'students/{kidId}/progress/{topicId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.exists
      ? (change.before.data() as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? (change.after.data() as Record<string, unknown>)
      : null;

    if (isEnrollmentIdentityOnlyBackfill(beforeData, afterData)) {
      logger.info('Skipped canonical projection event for enrollment identity-only backfill', {
        eventId: event.id || null,
        kidId: String(event.params.kidId || ''),
        topicId: String(event.params.topicId || ''),
      });
      return;
    }

    await transactionalWriter(event);
  },
);
