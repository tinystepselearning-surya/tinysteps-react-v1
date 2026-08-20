import { describe, expect, it } from 'vitest';
import {
  isHistoricalTerminalEnrollmentStatus,
  isTeacherValidForHistoricalSession,
  resolveHistoricalEnrollmentCutoffMs,
  resolveHistoricalEnrollmentStartMs,
} from '../src/helpers/historicalAttendanceCorrection';

describe('historical attendance correction guards', () => {
  it('recognizes terminal enrollment states without treating paused as terminal', () => {
    expect(isHistoricalTerminalEnrollmentStatus('completed')).toBe(true);
    expect(isHistoricalTerminalEnrollmentStatus('discontinued')).toBe(true);
    expect(isHistoricalTerminalEnrollmentStatus('archived')).toBe(true);
    expect(isHistoricalTerminalEnrollmentStatus('paused')).toBe(false);
    expect(isHistoricalTerminalEnrollmentStatus('active')).toBe(false);
  });

  it('uses the earliest lifecycle end marker as the historical course cutoff', () => {
    const completedAt = new Date('2026-08-10T10:00:00.000Z');
    const archivedAt = new Date('2026-08-20T10:00:00.000Z');
    expect(resolveHistoricalEnrollmentCutoffMs({ completedAt, archivedAt })).toBe(completedAt.getTime());
  });

  it('resolves the historical enrollment start in IST and prefers explicit class metadata', () => {
    expect(resolveHistoricalEnrollmentStartMs({
      classesStartDate: '2026-08-10',
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
    })).toBe(new Date('2026-08-10T00:00:00+05:30').getTime());
  });

  it('keeps the previous teacher valid only before reassignment when fallback metadata is used', () => {
    const reassignedAtMs = new Date('2026-08-10T10:00:00.000Z').getTime();
    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: new Date('2026-08-05T10:00:00.000Z').getTime(),
      requestedTeacherIds: ['teacher-a'],
      currentTeacherIds: ['teacher-b'],
      previousTeacherIds: ['teacher-a'],
      fallbackReassignedAtMs: reassignedAtMs,
    })).toBe(true);
    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: new Date('2026-08-15T10:00:00.000Z').getTime(),
      requestedTeacherIds: ['teacher-a'],
      currentTeacherIds: ['teacher-b'],
      previousTeacherIds: ['teacher-a'],
      fallbackReassignedAtMs: reassignedAtMs,
    })).toBe(false);
  });

  it('reconstructs repeated teacher intervals from reassignment audit history', () => {
    const t1 = new Date('2026-06-01T00:00:00.000Z').getTime();
    const t2 = new Date('2026-07-01T00:00:00.000Z').getTime();
    const t3 = new Date('2026-08-01T00:00:00.000Z').getTime();
    const events = [
      { changedAtMs: t1, oldTeacherId: 'teacher-a', newTeacherId: 'teacher-b' },
      { changedAtMs: t2, oldTeacherId: 'teacher-b', newTeacherId: 'teacher-a' },
      { changedAtMs: t3, oldTeacherId: 'teacher-a', newTeacherId: 'teacher-c' },
    ];

    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: new Date('2026-05-20T00:00:00.000Z').getTime(),
      requestedTeacherIds: ['teacher-a'],
      currentTeacherIds: ['teacher-c'],
      reassignmentEvents: events,
    })).toBe(true);
    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: new Date('2026-06-20T00:00:00.000Z').getTime(),
      requestedTeacherIds: ['teacher-a'],
      currentTeacherIds: ['teacher-c'],
      reassignmentEvents: events,
    })).toBe(false);
    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: new Date('2026-07-20T00:00:00.000Z').getTime(),
      requestedTeacherIds: ['teacher-a'],
      currentTeacherIds: ['teacher-c'],
      reassignmentEvents: events,
    })).toBe(true);
  });

  it('supports A to B and A to B to C ownership intervals without guessing', () => {
    const t1 = new Date('2026-06-01T00:00:00.000Z').getTime();
    const t2 = new Date('2026-07-01T00:00:00.000Z').getTime();
    const events = [
      { changedAtMs: t1, oldTeacherId: 'teacher-a', newTeacherId: 'teacher-b' },
      { changedAtMs: t2, oldTeacherId: 'teacher-b', newTeacherId: 'teacher-c' },
    ];

    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: t1 - 1,
      requestedTeacherIds: ['teacher-a'],
      currentTeacherIds: ['teacher-c'],
      reassignmentEvents: events,
    })).toBe(true);
    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: t1 + 1,
      requestedTeacherIds: ['teacher-b'],
      currentTeacherIds: ['teacher-c'],
      reassignmentEvents: events,
    })).toBe(true);
    expect(isTeacherValidForHistoricalSession({
      sessionStartMs: t2 + 1,
      requestedTeacherIds: ['teacher-b'],
      currentTeacherIds: ['teacher-c'],
      reassignmentEvents: events,
    })).toBe(false);
  });

  it('fails closed when previous-teacher metadata has no dated transfer evidence', () => {
    const input = {
      sessionStartMs: new Date('2026-08-05T10:00:00.000Z').getTime(),
      currentTeacherIds: ['teacher-b'],
      previousTeacherIds: ['teacher-a'],
    };
    expect(isTeacherValidForHistoricalSession({
      ...input,
      requestedTeacherIds: ['teacher-a'],
    })).toBe(false);
    expect(isTeacherValidForHistoricalSession({
      ...input,
      requestedTeacherIds: ['teacher-b'],
    })).toBe(false);
  });
});
