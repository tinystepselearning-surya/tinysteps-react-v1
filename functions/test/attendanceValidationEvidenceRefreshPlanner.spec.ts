import { describe, expect, it } from 'vitest';
import {
  AVS_EVIDENCE_REFRESH_DISCOVERY_LIMIT,
  AVS_EVIDENCE_REFRESH_GRAPH_BATCH_LIMIT,
  AVS_EVIDENCE_REFRESH_MAX_RANGE_DAYS,
  buildAvsEvidenceSessionSnapshot,
  stableAvsEvidenceRefreshStateId,
  stableAvsEvidenceRunId,
} from '../src/attendanceValidation/evidenceRefreshPlanner';

describe('AVS evidence refresh planner', () => {
  it('builds a canonical completed-session Teams snapshot without extra lookups', () => {
    const result = buildAvsEvidenceSessionSnapshot(
      'session-1',
      {
        date: '2026-09-18',
        startTime: '15:30',
        durationMinutes: 35,
        enrollmentId: 'enrollment-1',
        teacherId: 'teacher-1',
        kidId: 'kid-1',
        courseId: 'course-1',
        joinUrl: 'https://teams.example/class',
        attendance: { 'kid-1': { status: 'late' } },
        status: 'completed',
      },
      Date.parse('2026-09-18T12:00:00.000Z'),
    );

    expect(result).toEqual({
      kind: 'eligible',
      serviceDateYmd: '2026-09-18',
      snapshot: {
        classSessionId: 'session-1',
        enrollmentId: 'enrollment-1',
        teacherId: 'teacher-1',
        kidId: 'kid-1',
        courseId: 'course-1',
        scheduledStartDateTime: '2026-09-18T10:00:00.000Z',
        scheduledEndDateTime: '2026-09-18T10:35:00.000Z',
        joinUrl: 'https://teams.example/class',
        existingAttendanceStatus: 'present',
      },
    });
  });

  it('falls back to persisted timestamps and meeting-link aliases', () => {
    const result = buildAvsEvidenceSessionSnapshot(
      'session-2',
      {
        startAt: { seconds: Date.parse('2026-09-18T10:00:00.000Z') / 1000 },
        endAt: { seconds: Date.parse('2026-09-18T10:40:00.000Z') / 1000 },
        kidIds: ['kid-2'],
        meetingLink: 'https://teams.example/legacy',
        attendance: { 'kid-2': { status: 'no_show' } },
      },
      Date.parse('2026-09-18T11:00:00.000Z'),
    );

    expect(result.kind).toBe('eligible');
    if (result.kind !== 'eligible') return;
    expect(result.serviceDateYmd).toBe('2026-09-18');
    expect(result.snapshot.joinUrl).toBe('https://teams.example/legacy');
    expect(result.snapshot.existingAttendanceStatus).toBe('absent');
  });

  it('fails closed for future, cancelled, or unresolved session timing', () => {
    expect(buildAvsEvidenceSessionSnapshot(
      'future',
      { date: '2026-09-18', startTime: '15:30', durationMinutes: 35 },
      Date.parse('2026-09-18T09:00:00.000Z'),
    )).toMatchObject({ kind: 'skip', reason: 'session_not_finished' });

    expect(buildAvsEvidenceSessionSnapshot(
      'cancelled',
      {
        date: '2026-09-18',
        startTime: '15:30',
        durationMinutes: 35,
        status: 'cancelled',
      },
      Date.parse('2026-09-18T12:00:00.000Z'),
    )).toMatchObject({ kind: 'skip', reason: 'cancelled_or_rescheduled' });

    expect(buildAvsEvidenceSessionSnapshot(
      'unresolved',
      { date: '2026-09-18' },
      Date.parse('2026-09-18T12:00:00.000Z'),
    )).toMatchObject({ kind: 'skip', reason: 'session_start_unresolved' });
  });

  it('uses stable hashed IDs so repeated fresh runs do not create ID churn', () => {
    expect(stableAvsEvidenceRunId('session-1'))
      .toBe(stableAvsEvidenceRunId('session-1'));
    expect(stableAvsEvidenceRunId('session-1'))
      .not.toBe(stableAvsEvidenceRunId('session-2'));

    expect(
      stableAvsEvidenceRefreshStateId('missing_only', '2026-09-01', '2026-09-10'),
    ).toBe(
      stableAvsEvidenceRefreshStateId('missing_only', '2026-09-01', '2026-09-10'),
    );
    expect(
      stableAvsEvidenceRefreshStateId('force_fresh', '2026-09-01', '2026-09-10'),
    ).not.toBe(
      stableAvsEvidenceRefreshStateId('missing_only', '2026-09-01', '2026-09-10'),
    );
  });

  it('keeps discovery and Graph execution explicitly bounded', () => {
    expect(AVS_EVIDENCE_REFRESH_MAX_RANGE_DAYS).toBe(31);
    expect(AVS_EVIDENCE_REFRESH_DISCOVERY_LIMIT).toBe(500);
    expect(AVS_EVIDENCE_REFRESH_GRAPH_BATCH_LIMIT).toBe(10);
  });
});
