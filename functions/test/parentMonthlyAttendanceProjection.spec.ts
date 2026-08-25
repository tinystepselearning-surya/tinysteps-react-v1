import { describe, expect, it } from 'vitest';
import {
  MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS,
  MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
  buildParentMonthAttendanceProjection,
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
  collectParentMonthAttendanceTargets,
  isMissingAttendanceIndexError,
  normalizeCanonicalClassSessionStatus,
  resolveCanonicalSessionKidIds,
  resolveSessionAttendanceTarget,
  resolveSessionMonthKey,
  resolveSessionStartMs,
  shouldRefreshParentMonthAttendance,
} from '../src/parentMonthlyAttendanceProjection';

describe('parent monthly class + attendance projection v3', () => {
  it('derives class month from scheduled date/startAt and never generic updatedAt', () => {
    expect(resolveSessionMonthKey({ date: '2026-08-23' })).toBe('2026-08');
    expect(resolveSessionMonthKey({ startAt: '2026-09-01T00:00:00+05:30' })).toBe('2026-09');
    expect(resolveSessionMonthKey({ monthKey: '2026-10' })).toBe('2026-10');
    expect(resolveSessionMonthKey({ updatedAt: '2027-01-01T00:00:00+05:30' })).toBeNull();
  });

  it('resolves date + startTime as IST when startAt is absent', () => {
    expect(resolveSessionStartMs({ date: '2026-08-20', startTime: '17:30' })).toBe(
      Date.parse('2026-08-20T17:30:00+05:30'),
    );
    expect(resolveSessionStartMs({ date: '2026-08-20' })).toBeNull();
  });

  it('normalizes operational legacy statuses into one canonical class lifecycle', () => {
    expect(normalizeCanonicalClassSessionStatus(undefined)).toBe('scheduled');
    expect(normalizeCanonicalClassSessionStatus('upcoming')).toBe('scheduled');
    expect(normalizeCanonicalClassSessionStatus('inprogress')).toBe('in_progress');
    expect(normalizeCanonicalClassSessionStatus('canceled')).toBe('cancelled');
    expect(normalizeCanonicalClassSessionStatus('noshow')).toBe('no_show');
    expect(normalizeCanonicalClassSessionStatus('reschedule-requested')).toBe('reschedule_requested');
    expect(normalizeCanonicalClassSessionStatus('rescheduled')).toBe('rescheduled');
    expect(normalizeCanonicalClassSessionStatus('mystery')).toBe('other');
  });

  it('builds a parent-month target only when parent and scheduled month are resolvable', () => {
    expect(resolveSessionAttendanceTarget({ parentId: 'parent-1', date: '2026-08-20' })).toEqual({
      parentId: 'parent-1',
      monthKey: '2026-08',
    });
    expect(resolveSessionAttendanceTarget({ date: '2026-08-20' })).toBeNull();
    expect(resolveSessionAttendanceTarget({ parentId: 'parent-1', updatedAt: '2026-08-20' })).toBeNull();
  });

  it('uses only canonical kidId/kidIds for child rows', () => {
    expect(resolveCanonicalSessionKidIds({ kidId: 'kid-1', kidIds: ['kid-1', 'kid-2'] })).toEqual([
      'kid-1',
      'kid-2',
    ]);
    expect(resolveCanonicalSessionKidIds({ studentId: 'legacy-student-1' })).toEqual([]);
  });

  it('skips metadata-only classSession writes before any projection query is needed', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-08-20',
      startAt: '2026-08-20T17:00:00+05:30',
      status: 'scheduled',
      kidIds: ['kid-1'],
      teacherRemark: 'old',
      updatedAt: '2026-08-20T12:00:00Z',
    };
    const after = {
      ...before,
      teacherRemark: 'new',
      zoomJoinUrl: 'https://example.test/new',
      updatedAt: '2026-08-20T12:05:00Z',
    };

    expect(shouldRefreshParentMonthAttendance(before, after)).toBe(false);
  });

  it('refreshes when attendance, lifecycle, time, kid or parent/month ownership changes', () => {
    const base = {
      parentId: 'parent-1',
      date: '2026-08-20',
      startAt: '2026-08-20T17:00:00+05:30',
      status: 'scheduled',
      kidIds: ['kid-1'],
      attendance: {},
    };

    expect(shouldRefreshParentMonthAttendance(base, { ...base, status: 'completed' })).toBe(true);
    expect(
      shouldRefreshParentMonthAttendance(base, {
        ...base,
        attendance: { 'kid-1': { status: 'present' } },
      }),
    ).toBe(true);
    expect(shouldRefreshParentMonthAttendance(base, { ...base, kidIds: ['kid-2'] })).toBe(true);
    expect(
      shouldRefreshParentMonthAttendance(base, {
        ...base,
        startAt: '2026-08-20T18:00:00+05:30',
      }),
    ).toBe(true);
    expect(shouldRefreshParentMonthAttendance(base, { ...base, date: '2026-09-01' })).toBe(true);
    expect(shouldRefreshParentMonthAttendance(base, { ...base, parentId: 'parent-2' })).toBe(true);
  });

  it('recomputes both old and new parent-months when a session moves', () => {
    expect(
      collectParentMonthAttendanceTargets(
        { parentId: 'parent-1', date: '2026-08-31' },
        { parentId: 'parent-2', date: '2026-09-01' },
      ),
    ).toEqual([
      { parentId: 'parent-1', monthKey: '2026-08' },
      { parentId: 'parent-2', monthKey: '2026-09' },
    ]);
  });

  it('marks legacy no-date targets for the bounded compatibility path', () => {
    expect(
      collectParentMonthAttendanceTargets(
        null,
        {
          parentId: 'parent-1',
          startAt: '2026-08-20T17:00:00+05:30',
          status: 'completed',
        },
      ),
    ).toEqual([
      {
        parentId: 'parent-1',
        monthKey: '2026-08',
        requiresCompatibility: true,
      },
    ]);
  });

  it('builds canonical child/month class states and reconciles every session exactly once', () => {
    const nowMs = Date.parse('2026-08-20T12:00:00Z');
    const projection = buildParentMonthClassAttendanceProjection(
      [
        {
          date: '2026-08-18',
          startAt: '2026-08-18T17:00:00+05:30',
          status: 'completed',
          kidId: 'kid-1',
          attendance: { 'kid-1': { status: 'present' } },
        },
        {
          date: '2026-08-19',
          startAt: '2026-08-19T17:00:00+05:30',
          status: 'completed',
          kidId: 'kid-1',
          attendance: {},
        },
        {
          date: '2026-08-20',
          startAt: '2026-08-20T10:00:00+05:30',
          status: 'scheduled',
          kidId: 'kid-1',
        },
        {
          date: '2026-08-20',
          startAt: '2026-08-20T19:00:00+05:30',
          status: 'scheduled',
          kidId: 'kid-1',
        },
        {
          date: '2026-08-21',
          status: 'in_progress',
          kidId: 'kid-1',
        },
        { date: '2026-08-22', status: 'cancelled', kidId: 'kid-1' },
        { date: '2026-08-23', status: 'no_show', kidId: 'kid-1' },
        { date: '2026-08-24', status: 'reschedule_requested', kidId: 'kid-1' },
        { date: '2026-08-25', status: 'rescheduled', kidId: 'kid-1' },
        { date: '2026-08-26', status: 'paused', kidId: 'kid-1' },
      ],
      '2026-08',
      nowMs,
    );

    const kid = projection.byKid['kid-1'];
    expect(kid).toMatchObject({
      kidId: 'kid-1',
      monthKey: '2026-08',
      totalSessions: 10,
      completedSessions: 2,
      scheduledSessions: 2,
      inProgressSessions: 1,
      cancelledSessions: 1,
      noShowSessions: 1,
      rescheduleRequestedSessions: 1,
      rescheduledSessions: 1,
      otherSessions: 1,
      upcomingSessions: 1,
      unresolvedPastSessions: 1,
      pendingTimeUnknownSessions: 1,
      presentSessions: 1,
      attendanceMarkedSessions: 1,
      attendanceUnmarkedCompletedSessions: 1,
      attendancePct: 100,
    });
    expect(kid.pendingSessionStartAtMs).toHaveLength(2);
    expect(classAttendanceProjectionInvariantErrors(projection)).toEqual([]);
  });

  it('preserves V2 compatibility aliases without creating a second calculation', () => {
    const projection = buildParentMonthAttendanceProjection(
      [
        {
          date: '2026-08-19',
          status: 'completed',
          kidId: 'kid-1',
          attendance: { 'kid-1': { status: 'late' } },
        },
        { date: '2026-08-20', status: 'rescheduled', kidId: 'kid-1' },
      ],
      '2026-08',
      Date.parse('2026-08-20T12:00:00Z'),
    );

    const row = projection.byKid['kid-1'];
    expect(row.completed).toBe(row.completedSessions);
    expect(row.rescheduled).toBe(row.rescheduledSessions);
    expect(row.attendanceMarked).toBe(row.attendanceMarkedSessions);
    expect(row.total).toBe(row.totalSessions);
  });

  it('counts group sessions once per child row while parent totals represent child-session instances', () => {
    const projection = buildParentMonthClassAttendanceProjection(
      [
        {
          date: '2026-08-19',
          status: 'completed',
          kidIds: ['kid-1', 'kid-2'],
          attendance: {
            'kid-1': { status: 'present' },
            'kid-2': { status: 'absent' },
          },
        },
      ],
      '2026-08',
      Date.now(),
    );

    expect(projection.sourceSessionRecords).toBe(1);
    expect(projection.totals.totalSessions).toBe(2);
    expect(projection.byKid['kid-1'].totalSessions).toBe(1);
    expect(projection.byKid['kid-2'].totalSessions).toBe(1);
    expect(projection.totals.attendancePct).toBe(50);
  });

  it('does not fabricate _unassigned or legacy-alias child rows', () => {
    const projection = buildParentMonthClassAttendanceProjection(
      [
        { date: '2026-08-19', status: 'completed' },
        { date: '2026-08-20', status: 'completed', studentId: 'legacy-student-1' },
        { date: '2026-08-21', status: 'completed', kidId: 'kid-1' },
      ],
      '2026-08',
      Date.now(),
    );

    expect(projection.byKid._unassigned).toBeUndefined();
    expect(projection.byKid['legacy-student-1']).toBeUndefined();
    expect(projection.byKid['kid-1'].totalSessions).toBe(1);
    expect(projection.sourceSessionRecords).toBe(3);
    expect(projection.unassignedSessionRecords).toBe(2);
    expect(projection.legacyKidAliasOnlySessionRecords).toBe(1);
  });

  it('keeps attendance independent from non-completed class lifecycle states', () => {
    const projection = buildParentMonthClassAttendanceProjection(
      [
        {
          date: '2026-08-19',
          status: 'no_show',
          kidId: 'kid-1',
          attendance: { 'kid-1': { status: 'absent' } },
        },
        {
          date: '2026-08-20',
          status: 'completed',
          kidId: 'kid-1',
          attendance: { 'kid-1': { status: 'no_show' } },
        },
      ],
      '2026-08',
      Date.now(),
    );

    expect(projection.byKid['kid-1']).toMatchObject({
      noShowSessions: 1,
      completedSessions: 1,
      absentSessions: 1,
      attendanceMarkedSessions: 1,
      attendanceUnmarkedCompletedSessions: 0,
    });
  });

  it('ignores records from a different month even when supplied to the pure aggregator', () => {
    const projection = buildParentMonthClassAttendanceProjection(
      [
        { date: '2026-08-31', status: 'completed', kidId: 'kid-1' },
        { date: '2026-09-01', status: 'completed', kidId: 'kid-1' },
      ],
      '2026-08',
      Date.now(),
    );

    expect(projection.sourceSessionRecords).toBe(1);
    expect(projection.byKid['kid-1'].completedSessions).toBe(1);
  });

  it('uses compatibility reads only for a real missing-index failure', () => {
    expect(
      isMissingAttendanceIndexError({
        code: 9,
        message: 'FAILED_PRECONDITION: The query requires an index.',
      }),
    ).toBe(true);
    expect(
      isMissingAttendanceIndexError({
        code: 'failed-precondition',
        message: 'The query requires a composite index.',
      }),
    ).toBe(true);
    expect(isMissingAttendanceIndexError({ message: 'The query requires an index.' })).toBe(true);
    expect(isMissingAttendanceIndexError({ code: 9, message: 'some other precondition' })).toBe(false);
    expect(isMissingAttendanceIndexError({ code: 'permission-denied' })).toBe(false);
    expect(isMissingAttendanceIndexError(new Error('network timeout'))).toBe(false);
  });

  it('keeps explicit hard caps on parent-month and compatibility source queries', () => {
    expect(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS).toBeGreaterThanOrEqual(100);
    expect(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS).toBeLessThanOrEqual(500);
    expect(MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS).toBeGreaterThanOrEqual(
      MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
    );
    expect(MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS).toBeLessThanOrEqual(500);
  });
});
