import { beforeEach, describe, expect, it, vi } from 'vitest';

const { callableMock, httpsCallableMock, functionsInstance } = vi.hoisted(() => ({
  callableMock: vi.fn(),
  httpsCallableMock: vi.fn(),
  functionsInstance: { region: 'asia-south1' },
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: httpsCallableMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  functions: functionsInstance,
}));

import {
  createEnrollment,
  getCreateEnrollmentErrorMessage,
} from '../../lib/createEnrollmentCallable';

describe('createEnrollment callable integration', () => {
  beforeEach(() => {
    callableMock.mockReset();
    httpsCallableMock.mockReset();
    callableMock.mockResolvedValue({ data: { ok: true, enrollmentId: 'enrollment-1' } });
    httpsCallableMock.mockReturnValue(callableMock);
  });

  it('uses the shared regional Functions instance and forwards the validated payload', async () => {
    const payload = {
      operationId: 'assign-course-operation-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      feePerClass: 599,
      ratePerSession: 599,
      teacherPayPerSession: 300,
      currency: 'INR',
      billingCycle: 'monthly',
      creditsTotal: 4,
    };

    await expect(createEnrollment(payload)).resolves.toEqual({ ok: true, enrollmentId: 'enrollment-1' });
    expect(httpsCallableMock).toHaveBeenCalledWith(functionsInstance, 'createEnrollment');
    expect(callableMock).toHaveBeenCalledWith(payload);
  });

  it.each([
    ['functions/unauthenticated', 'Your session has expired. Please sign in again.'],
    ['functions/permission-denied', 'You do not have permission to assign this course.'],
    ['functions/already-exists', 'This student already has an active enrollment for the selected course.'],
    ['functions/unavailable', 'The service is temporarily unavailable. Please try again.'],
  ])('maps %s to a safe useful message', (code, expected) => {
    expect(getCreateEnrollmentErrorMessage({ code, message: 'internal detail' })).toBe(expected);
  });

  it('preserves safe structured validation messages', () => {
    expect(getCreateEnrollmentErrorMessage({
      code: 'functions/invalid-argument',
      message: 'fee per class must be a positive number',
    })).toBe('fee per class must be a positive number');
  });

  it('does not expose unexpected internal error details', () => {
    expect(getCreateEnrollmentErrorMessage({
      code: 'functions/internal',
      message: 'private stack or database detail',
    })).toBe('Failed to assign the course. Please try again.');
  });
});
