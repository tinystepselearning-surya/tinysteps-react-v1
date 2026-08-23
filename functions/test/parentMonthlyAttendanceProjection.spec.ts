import { describe, expect, it } from 'vitest';
import {
  MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS,
  MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
  buildParentMonthAttendanceProjection,
  collectParentMonthAttendanceTargets,
  isMissingAttendanceIndexError,
  resolveSessionAttendanceTarget,
  resolveSessionMonthKey,
  shouldRefreshParentMonthAttendance,
} from '../src/parentMonthlyAttendanceProjection';

describe('parent monthly attendance projection', () => {
  it('derives class month from canonical date/startAt and never from generic updatedAt', () => {
    expect(resolveSessionMonthKey({ date: '2026-08-23' })).toBe('2026-08');
    expect(resolveSessionMonthKey({ startAt: '2026-09-01T00:00:00+05:30' })).toBe('2026-09');
    expect(resolveSessionMonthKey({ monthKey: '2026-10' })).toBe('2026-10');
    expect(resolveSessionMonthKey({ updatedAt: '2027-01-01T00:00:00+05:30' })).toBeNull();
  });

  it('builds a parent-month target only when parent and scheduled month are resolvable', () => {
    expect(resolveSessionAttendanceTarget({ parentId: 'parent-1', date: '2026-08-20' })).toEqual({
      parentId: 'parent-1',
      monthKey: '2026-08',
    });
    expect(resolveSessionAttendanceTarget({ date: '2026-08-20' })).toBeNull();
    expect(resolveSessionAttendanceTarget({ parentId: 'parent-1', updatedAt: '2026-08-20' })).toBeNull();
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

  it('deduplicates the target when a relevant change remains in the same parent-month', () => {
    expect(
      collectParentMonthAttendanceTargets(
        { parentId: 'parent-1', date: '2026-08-20', status: 'scheduled' },
        { parentId: 'parent-1', date: '2026-08-20', status: 'completed' },
      ),
    ).toEqual([{ parentId: 'parent-1', monthKey: '2026-08' }]);
  });

  it('preserves completed attendance and group-session counting semantics', () => {
    const nowMs = Date.parse('2026-08-20T12:00:00Z');
    const projection = buildParentMonthAttendanceProjection(
      [
        {
          date: '2026-08-19',
          startAt: '2026-08-19T17:00:00+05:30',
          status: 'completed',
          kidIds: ['kid-1', 'kid-2'],
          attendance: {
            'kid-1': { status: 'present' },
            'kid-2': { status: 'absent' },
          },
        },
      ],
      '2026-08',
      nowMs,
    );

    expect(projection.totals).toMatchObject({
      total: 2,
      completed: 2,
      present: 1,
      absent: 1,
      attendanceMarked: 2,
      attendancePct: 50,
    });
    expect(projection.byKid['kid-1']).toMatchObject({
      total: 1,
      completed: 1,
      present: 1,
      attendancePct: 100,
    });
    expect(projection.byKid['kid-2']).toMatchObject({
      total: 1,
      completed: 1,
      absent: 1,
      attendancePct: 0,
    });
  });

  it('counts only future scheduled/in-progress sessions as upcoming', () => {
    const nowMs = Date.parse('2026-08-20T12:00:00Z');
    const projection = buildParentMonthAttendanceProjection(
      [
        {
          date: '2026-08-20',
          startAt: '2026-08-20T19:00:00+05:30',
          status: 'scheduled',
          kidId: 'kid-1',
        },
        {
          date: '2026-08-20',
          startAt: '2026-08-20T10:00:00+05:30',
          status: 'scheduled',
          kidId: 'kid-1',
        },
        {
          date: '2026-08-21',
          startAt: '2026-08-21T18:00:00+05:30',
          status: 'in_progress',
          kidId: 'kid-1',
        },
      ],
      '2026-08',
      nowMs,
    );

    expect(projection.totals).toMatchObject({
      total: 3,
      scheduled: 2,
      in_progress: 1,
      upcoming: 2,
    });
  });

  it('ignores records from a different month even if supplied to the pure aggregator', () => {
    const projection = buildParentMonthAttendanceProjection(
      [
        { date: '2026-08-31', status: 'completed', kidId: 'kid-1' },
        { date: '2026-09-01', status: 'completed', kidId: 'kid-1' },
      ],
      '2026-08',
      Date.now(),
    );

    expect(projection.totals.total).toBe(1);
    expect(projection.totals.completed).toBe(1);
  });

  it('uses compatibility reads only for a missing composite-index failure', () => {
    expect(isMissingAttendanceIndexError({ code: 9, message: 'FAILED_PRECONDITION' })).toBe(true);
    expect(isMissingAttendanceIndexError({ code: 'failed-precondition' })).toBe(true);
    expect(isMissingAttendanceIndexError({ message: 'The query requires an index.' })).toBe(true);
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
