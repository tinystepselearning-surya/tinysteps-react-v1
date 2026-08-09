import { describe, expect, it, vi } from 'vitest';
import {
  AttendanceCorrectionAfterCreateError,
  collectKidIds,
  createMissingSessionAndSaveAttendance,
  normalizeEnrollmentStatus,
  normalizeTimeForLabel,
  toIstDateLabel,
  toIstTimeLabel,
} from '../../pages/admin/attendanceCorrectionWorkflow';

describe('attendance correction workflow helpers', () => {
  it('matches backend enrollment lifecycle normalization', () => {
    expect(normalizeEnrollmentStatus(undefined)).toBe('active');
    expect(normalizeEnrollmentStatus('pending_teacher')).toBe('trial');
    expect(normalizeEnrollmentStatus('pending_payment')).toBe('active');
    expect(normalizeEnrollmentStatus('ongoing')).toBe('active');
    expect(normalizeEnrollmentStatus('canceled')).toBe('cancelled');
  });

  it('collects canonical and legacy child identities without duplicates', () => {
    expect(collectKidIds({ kidIds: ['kid-a', 'kid-b'], kidId: 'kid-a', studentId: 'kid-c', childId: 'kid-d' }))
      .toEqual(['kid-a', 'kid-b', 'kid-c', 'kid-d']);
  });

  it('normalizes display times and converts timestamps at IST midnight boundaries', () => {
    expect(normalizeTimeForLabel('7:05:00')).toBe('07:05');
    expect(normalizeTimeForLabel('25:00')).toBe('');
    const instant = new Date('2026-07-28T18:30:00.000Z');
    expect(toIstDateLabel(instant)).toBe('2026-07-29');
    expect(toIstTimeLabel(instant)).toBe('00:00');
  });

  it('creates before correcting and returns the deterministic session identity', async () => {
    const calls: string[] = [];
    const result = await createMissingSessionAndSaveAttendance({
      createSession: async () => {
        calls.push('create');
        return { sessionId: 'manual-session', alreadyExisted: true };
      },
      saveAttendance: async (sessionId) => {
        calls.push(`correct:${sessionId}`);
      },
    });

    expect(calls).toEqual(['create', 'correct:manual-session']);
    expect(result).toEqual({ sessionId: 'manual-session', alreadyExisted: true });
  });

  it('preserves the created session identity when attendance correction fails', async () => {
    const createSession = vi.fn().mockResolvedValue({ sessionId: 'manual-session' });
    const correctionError = new Error('correction failed');

    await expect(createMissingSessionAndSaveAttendance({
      createSession,
      saveAttendance: vi.fn().mockRejectedValue(correctionError),
    })).rejects.toMatchObject({
      name: 'AttendanceCorrectionAfterCreateError',
      sessionId: 'manual-session',
      originalError: correctionError,
    });
    expect(createSession).toHaveBeenCalledTimes(1);
  });
});
