import { describe, expect, it } from 'vitest';
import {
  applyAttendanceContribution,
  rememberProcessedEvent,
  resolveSessionAttendanceTarget,
  resolveSessionMonthKey,
  shouldRefreshParentMonthAttendance,
} from '../src/parentMonthlyAttendanceProjection';

const emptyState = () => ({
  totals: {
    total: 0,
    completed: 0,
    in_progress: 0,
    scheduled: 0,
    cancelled: 0,
    no_show: 0,
    reschedule_requested: 0,
    other: 0,
    upcoming: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceMarked: 0,
    attendancePct: 0,
  },
  byKid: {},
});

describe('parent monthly attendance projection', () => {
  it('derives the session month from canonical date/startAt and never from updatedAt', () => {
    expect(resolveSessionMonthKey({ date: '2026-08-23' })).toBe('2026-08');
    expect(resolveSessionMonthKey({ startAt: '2026-09-01T00:00:00+05:30' })).toBe('2026-09');
    expect(resolveSessionMonthKey({ updatedAt: '2027-01-01T00:00:00+05:30' })).toBeNull();
  });

  it('builds a parent-month target only when both canonical parent and month are present', () => {
    expect(resolveSessionAttendanceTarget({ parentId: 'parent-1', date: '2026-08-20' })).toEqual({
      parentId: 'parent-1',
      monthKey: '2026-08',
    });
    expect(resolveSessionAttendanceTarget({ date: '2026-08-20' })).toBeNull();
  });

  it('skips metadata-only classSession writes', () => {
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

  it('refreshes when attendance, lifecycle, time, kid or parent/month inputs change', () => {
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
    expect(shouldRefreshParentMonthAttendance(base, { ...base, date: '2026-09-01' })).toBe(true);
    expect(shouldRefreshParentMonthAttendance(base, { ...base, parentId: 'parent-2' })).toBe(true);
  });

  it('applies a before-to-after delta without inflating the total session count', () => {
    const state = emptyState();
    const scheduled = {
      status: 'scheduled',
      kidIds: ['kid-1'],
      startMs: Date.now() + 60_000,
      upcoming: true,
      attendanceByKid: { 'kid-1': '' },
    };
    const completedPresent = {
      status: 'completed',
      kidIds: ['kid-1'],
      startMs: Date.now() - 60_000,
      upcoming: false,
      attendanceByKid: { 'kid-1': 'present' },
    };

    applyAttendanceContribution(state, scheduled, 1);
    applyAttendanceContribution(state, scheduled, -1);
    applyAttendanceContribution(state, completedPresent, 1);

    expect(state.totals).toMatchObject({
      total: 1,
      scheduled: 0,
      upcoming: 0,
      completed: 1,
      present: 1,
      attendanceMarked: 1,
      attendancePct: 100,
    });
    expect(state.byKid['kid-1']).toMatchObject({
      total: 1,
      completed: 1,
      present: 1,
      attendancePct: 100,
    });
  });

  it('preserves group-session counting semantics and removes zeroed kid buckets', () => {
    const state = emptyState();
    const contribution = {
      status: 'completed',
      kidIds: ['kid-1', 'kid-2'],
      startMs: Date.now() - 60_000,
      upcoming: false,
      attendanceByKid: {
        'kid-1': 'present',
        'kid-2': 'absent',
      },
    };

    applyAttendanceContribution(state, contribution, 1);
    expect(state.totals).toMatchObject({ total: 2, completed: 2, present: 1, absent: 1 });

    applyAttendanceContribution(state, contribution, -1);
    expect(state.totals).toMatchObject({ total: 0, completed: 0, present: 0, absent: 0 });
    expect(state.byKid).toEqual({});
  });

  it('keeps a bounded replay-id window for idempotent Eventarc retries', () => {
    let ids: string[] = [];
    for (let i = 0; i < 140; i += 1) ids = rememberProcessedEvent(ids, `event-${i}`);

    expect(ids).toHaveLength(128);
    expect(ids[0]).toBe('event-12');
    expect(ids.at(-1)).toBe('event-139');
    expect(rememberProcessedEvent(ids, 'event-139')).toEqual(ids);
  });
});
