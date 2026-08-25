import { describe, expect, it } from 'vitest';

import {
  materializeParentChildMonthClassAttendance,
  parentChildClassAttendanceInvariantErrors,
  selectCanonicalParentChildMonthClassAttendance,
} from '../../lib/parentClassAttendanceProjection';

describe('parent class attendance projection selector', () => {
  const baseRow = {
    kidId: 'kid-1',
    monthKey: '2026-08',
    totalSessions: 6,
    completedSessions: 2,
    scheduledSessions: 2,
    inProgressSessions: 1,
    cancelledSessions: 1,
    noShowSessions: 0,
    rescheduleRequestedSessions: 0,
    rescheduledSessions: 0,
    otherSessions: 0,
    upcomingSessions: 3,
    unresolvedPastSessions: 0,
    pendingTimeUnknownSessions: 1,
    presentSessions: 1,
    lateSessions: 0,
    absentSessions: 1,
    attendanceMarkedSessions: 2,
    attendanceUnmarkedCompletedSessions: 0,
    attendancePct: 50,
    pendingSessionStartAtMs: [
      Date.parse('2026-08-20T10:00:00Z'),
      Date.parse('2026-08-20T14:00:00Z'),
    ],
  };

  it('never falls back from a missing child row to parent totals', () => {
    const model = {
      schemaVersion: 3,
      modelType: 'class_attendance_v3',
      childRowsAuthoritative: true,
      totals: { ...baseRow, kidId: 'parent-total' },
      byKid: { 'kid-1': baseRow },
    };

    expect(
      selectCanonicalParentChildMonthClassAttendance(
        model,
        'kid-missing',
        Date.parse('2026-08-20T12:00:00Z'),
      ),
    ).toBeNull();
  });

  it('rejects legacy/non-authoritative read models instead of guessing', () => {
    expect(
      selectCanonicalParentChildMonthClassAttendance(
        {
          schemaVersion: 2,
          modelType: 'attendance_v2_bounded',
          childRowsAuthoritative: true,
          byKid: { 'kid-1': baseRow },
        },
        'kid-1',
        Date.now(),
      ),
    ).toBeNull();

    expect(
      selectCanonicalParentChildMonthClassAttendance(
        {
          schemaVersion: 3,
          modelType: 'class_attendance_v3',
          childRowsAuthoritative: false,
          byKid: { 'kid-1': baseRow },
        },
        'kid-1',
        Date.now(),
      ),
    ).toBeNull();
  });

  it('recomputes upcoming vs unresolved past from stored pending start times with no extra reads', () => {
    const materialized = materializeParentChildMonthClassAttendance(
      baseRow,
      Date.parse('2026-08-20T12:00:00Z'),
    );

    expect(materialized.upcomingSessions).toBe(1);
    expect(materialized.unresolvedPastSessions).toBe(1);
    expect(materialized.pendingTimeUnknownSessions).toBe(1);
    expect(parentChildClassAttendanceInvariantErrors(materialized)).toEqual([]);
  });

  it('keeps attendance percentage tied only to marked completed attendance', () => {
    const materialized = materializeParentChildMonthClassAttendance(
      {
        ...baseRow,
        presentSessions: 1,
        lateSessions: 1,
        absentSessions: 2,
        attendanceMarkedSessions: 999,
        completedSessions: 4,
        attendanceUnmarkedCompletedSessions: 0,
        attendancePct: 99,
      },
      Date.parse('2026-08-20T12:00:00Z'),
    );

    expect(materialized.attendanceMarkedSessions).toBe(4);
    expect(materialized.attendancePct).toBe(50);
  });
});
