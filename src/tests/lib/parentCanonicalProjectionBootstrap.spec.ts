import { beforeEach, describe, expect, it, vi } from 'vitest';

const { callFunctionMock, authMock } = vi.hoisted(() => ({
  callFunctionMock: vi.fn(),
  authMock: { currentUser: { uid: 'parent-1' } as { uid: string } | null },
}));

vi.mock('../../lib/callFunctions', () => ({ default: callFunctionMock }));
vi.mock('../../lib/firebaseConfig', () => ({ auth: authMock }));

import {
  attendanceBootstrapRequestId,
  courseBootstrapRequestId,
  currentIndiaMonthKey,
  normalizeBootstrapCourseId,
  requestCourseProgressBootstrap,
} from '../../lib/parentCanonicalProjectionBootstrap';

describe('parent canonical projection bootstrap client contract', () => {
  beforeEach(() => {
    callFunctionMock.mockReset();
    authMock.currentUser = { uid: 'parent-1' };
    callFunctionMock.mockResolvedValue({ mode: 'bootstrapped', completedTopics: 6, totalTopics: 40 });
  });

  it('canonicalizes legacy course aliases before building the saved-lesson repair request id', () => {
    expect(normalizeBootstrapCourseId('EARLY-PHONICS')).toBe('early-phonics');
    expect(normalizeBootstrapCourseId('phonics-early')).toBe('early-phonics');
    expect(normalizeBootstrapCourseId('foundation')).toBe('phonics-foundations');
    expect(courseBootstrapRequestId('phonics-early')).toBe('v2-course-early-phonics');
  });

  it('rejects unsafe course ids instead of creating arbitrary document paths', () => {
    expect(courseBootstrapRequestId('early phonics')).toBeNull();
    expect(courseBootstrapRequestId('early/phonics')).toBeNull();
    expect(courseBootstrapRequestId('x'.repeat(101))).toBeNull();
  });

  it('builds deterministic attendance request ids only for month keys', () => {
    expect(attendanceBootstrapRequestId('2026-08')).toBe('v1-attendance-2026-08');
    expect(attendanceBootstrapRequestId('2026-8')).toBeNull();
    expect(attendanceBootstrapRequestId('2026-08-25')).toBeNull();
  });

  it('uses the IST calendar month at UTC month boundaries', () => {
    expect(currentIndiaMonthKey(Date.parse('2026-08-31T17:00:00Z'))).toBe('2026-08');
    expect(currentIndiaMonthKey(Date.parse('2026-08-31T20:00:00Z'))).toBe('2026-09');
  });

  it('bypasses an existing failed or stale request document through the retry-safe callable', async () => {
    await expect(requestCourseProgressBootstrap('kid-1', 'early-phonics')).resolves.toMatchObject({
      mode: 'bootstrapped',
      completedTopics: 6,
    });
    callFunctionMock.mockResolvedValueOnce({ mode: 'already_current', completedTopics: 6, totalTopics: 40 });
    await expect(requestCourseProgressBootstrap('kid-1', 'early-phonics')).resolves.toMatchObject({
      mode: 'already_current',
    });

    expect(callFunctionMock).toHaveBeenCalledTimes(2);
    expect(callFunctionMock).toHaveBeenLastCalledWith('bootstrapParentCourseProgress', {
      kidId: 'kid-1',
      courseId: 'early-phonics',
    });
  });

  it('deduplicates concurrent React effects but permits a later retry after failure', async () => {
    let rejectFirst: ((error: Error) => void) | undefined;
    callFunctionMock.mockImplementationOnce(() => new Promise((_resolve, reject) => {
      rejectFirst = reject;
    }));

    const first = requestCourseProgressBootstrap('kid-1', 'early-phonics');
    await expect(requestCourseProgressBootstrap('kid-1', 'early-phonics')).resolves.toEqual({ mode: 'in_flight' });
    expect(callFunctionMock).toHaveBeenCalledTimes(1);

    rejectFirst?.(new Error('transient'));
    await expect(first).rejects.toThrow('transient');

    callFunctionMock.mockResolvedValueOnce({ mode: 'bootstrapped' });
    await expect(requestCourseProgressBootstrap('kid-1', 'early-phonics')).resolves.toEqual({
      mode: 'bootstrapped',
    });
    expect(callFunctionMock).toHaveBeenCalledTimes(2);
  });
});
