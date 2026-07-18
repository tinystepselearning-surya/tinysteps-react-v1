import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

export type CreateEnrollmentPayload = {
  operationId: string;
  kidId: string;
  courseId: string;
  feePerClass?: number;
  ratePerSession: number;
  teacherPayPerSession?: number;
  currency?: string;
  billingCycle: string;
  creditsTotal: number;
};

type CreateEnrollmentResult = {
  ok: true;
  enrollmentId: string;
  idempotentReplay?: boolean;
};

export async function createEnrollment(payload: CreateEnrollmentPayload): Promise<CreateEnrollmentResult> {
  const callable = httpsCallable<CreateEnrollmentPayload, CreateEnrollmentResult>(
    functions,
    'createEnrollment',
  );
  const result = await callable(payload);
  return result.data;
}

function normalizeCallableCode(error: unknown): string {
  const rawCode =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  return rawCode.replace(/^functions\//, '');
}

export function getCreateEnrollmentErrorMessage(error: unknown): string {
  const code = normalizeCallableCode(error);
  const serverMessage =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message || '').trim()
      : '';

  switch (code) {
    case 'unauthenticated':
      return 'Your session has expired. Please sign in again.';
    case 'permission-denied':
      return 'You do not have permission to assign this course.';
    case 'already-exists':
      return 'This student already has an active enrollment for the selected course.';
    case 'invalid-argument':
    case 'failed-precondition':
    case 'not-found':
      return serverMessage || 'The enrollment details are invalid. Please review them and try again.';
    case 'unavailable':
      return 'The service is temporarily unavailable. Please try again.';
    default:
      return 'Failed to assign the course. Please try again.';
  }
}
