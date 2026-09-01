import { describe, expect, it } from 'vitest';
import {
  buildParentMonthClassAttendanceProjection,
} from '../src/parentMonthlyClassAttendanceProjectionV3';
import {
  applyParentClassAttendanceRollupOperation,
  planParentClassAttendanceRollupChange,
} from '../src/helpers/parentClassAttendanceRollupDelta';

const NOW = Date.parse('2026-09-01T06:00:00+05:30');

const projection = (
  sessions: Array<Record<string, unknown>>,
  monthKey = '2026-09',
) => buildParentMonthClassAttendanceProjection(sessions, monthKey, NOW);

describe('parent class-attendance incremental rollup delta', () => {
  it('matches authoritative recompute for a scheduled -> completed attendance update', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-01',
      startAt: '2026-09-01T09:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
      attendance: {},
    };
    const after = {
      ...before,
      status: 'completed',
      attendance: { 'kid-1': { status: 'present' } },
    };
    const unchanged = {
      parentId: 'parent-1',
      date: '2026-09-02',
      startAt: '2026-09-02T09:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };

    const plan = planParentClassAttendanceRollupChange({ before, after, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;
    expect(plan.operations).toHaveLength(1);

    const next = applyParentClassAttendanceRollupOperation({
      base: projection([before, unchanged]),
      operation: plan.operations[0],
      nowMs: NOW,
    });

    expect(next).toEqual(projection([after, unchanged]));
  });

  it('matches authoritative recompute for a create', () => {
    const existing = {
      parentId: 'parent-1',
      date: '2026-09-02',
      status: 'completed',
      kidId: 'kid-1',
      attendance: { 'kid-1': { status: 'late' } },
    };
    const created = {
      parentId: 'parent-1',
      date: '2026-09-03',
      startAt: '2026-09-03T18:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };

    const plan = planParentClassAttendanceRollupChange({ before: null, after: created, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;

    const next = applyParentClassAttendanceRollupOperation({
      base: projection([existing]),
      operation: plan.operations[0],
      nowMs: NOW,
    });
    expect(next).toEqual(projection([existing, created]));
  });

  it('matches authoritative recompute for a delete', () => {
    const deleted = {
      parentId: 'parent-1',
      date: '2026-09-02',
      status: 'completed',
      kidId: 'kid-1',
      attendance: { 'kid-1': { status: 'absent' } },
    };
    const remaining = {
      parentId: 'parent-1',
      date: '2026-09-03',
      status: 'completed',
      kidId: 'kid-1',
      attendance: { 'kid-1': { status: 'present' } },
    };

    const plan = planParentClassAttendanceRollupChange({ before: deleted, after: null, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;

    const next = applyParentClassAttendanceRollupOperation({
      base: projection([deleted, remaining]),
      operation: plan.operations[0],
      nowMs: NOW,
    });
    expect(next).toEqual(projection([remaining]));
  });

  it('updates group child membership without double counting parent totals', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-04',
      status: 'completed',
      kidIds: ['kid-1', 'kid-2'],
      attendance: {
        'kid-1': { status: 'present' },
        'kid-2': { status: 'absent' },
      },
    };
    const after = {
      ...before,
      kidIds: ['kid-1', 'kid-3'],
      attendance: {
        'kid-1': { status: 'present' },
        'kid-3': { status: 'late' },
      },
    };

    const plan = planParentClassAttendanceRollupChange({ before, after, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;

    const next = applyParentClassAttendanceRollupOperation({
      base: projection([before]),
      operation: plan.operations[0],
      nowMs: NOW,
    });
    expect(next).toEqual(projection([after]));
    expect(next?.byKid['kid-2']).toBeUndefined();
    expect(next?.byKid['kid-3'].lateSessions).toBe(1);
  });

  it('produces exact old-month subtraction and new-month addition when a session moves', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-08-31',
      status: 'completed',
      kidId: 'kid-1',
      attendance: { 'kid-1': { status: 'present' } },
    };
    const after = {
      ...before,
      parentId: 'parent-2',
      date: '2026-09-01',
    };
    const oldMonthOther = {
      parentId: 'parent-1',
      date: '2026-08-30',
      status: 'completed',
      kidId: 'kid-1',
    };
    const newMonthOther = {
      parentId: 'parent-2',
      date: '2026-09-02',
      status: 'scheduled',
      kidId: 'kid-1',
      startAt: '2026-09-02T10:00:00+05:30',
    };

    const plan = planParentClassAttendanceRollupChange({ before, after, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;
    expect(plan.operations.map((item) => item.target)).toEqual([
      { parentId: 'parent-1', monthKey: '2026-08' },
      { parentId: 'parent-2', monthKey: '2026-09' },
    ]);

    const oldOperation = plan.operations[0];
    const newOperation = plan.operations[1];

    const oldNext = applyParentClassAttendanceRollupOperation({
      base: projection([before, oldMonthOther], '2026-08'),
      operation: oldOperation,
      nowMs: NOW,
    });
    const newNext = applyParentClassAttendanceRollupOperation({
      base: projection([newMonthOther], '2026-09'),
      operation: newOperation,
      nowMs: NOW,
    });

    expect(oldNext).toEqual(projection([oldMonthOther], '2026-08'));
    expect(newNext).toEqual(projection([newMonthOther, after], '2026-09'));
  });

  it('keeps source diagnostics exact when an unassigned session gains canonical kid identity', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-05',
      status: 'completed',
      studentId: 'legacy-student-1',
    };
    const after = {
      ...before,
      kidId: 'kid-1',
    };

    const plan = planParentClassAttendanceRollupChange({ before, after, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;

    const next = applyParentClassAttendanceRollupOperation({
      base: projection([before]),
      operation: plan.operations[0],
      nowMs: NOW,
    });
    expect(next).toEqual(projection([after]));
    expect(next?.unassignedSessionRecords).toBe(0);
    expect(next?.legacyKidAliasOnlySessionRecords).toBe(0);
  });

  it('turns projection-equivalent metadata changes into a noop', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-05',
      status: 'scheduled',
      kidId: 'kid-1',
      teacherRemark: 'before',
    };
    const after = {
      ...before,
      teacherRemark: 'after',
      meetingLink: 'https://example.test/new',
    };

    expect(planParentClassAttendanceRollupChange({ before, after, nowMs: NOW })).toEqual({
      mode: 'noop',
      targets: [{ parentId: 'parent-1', monthKey: '2026-09' }],
    });
  });

  it('fails closed when either side has unresolved parent/month ownership', () => {
    const plan = planParentClassAttendanceRollupChange({
      before: {
        parentId: 'parent-1',
        status: 'scheduled',
        kidId: 'kid-1',
      },
      after: {
        parentId: 'parent-1',
        date: '2026-09-05',
        status: 'scheduled',
        kidId: 'kid-1',
      },
      nowMs: NOW,
    });

    expect(plan).toEqual({
      mode: 'recompute',
      targets: [{ parentId: 'parent-1', monthKey: '2026-09' }],
      reason: 'before_target_unresolved',
    });
  });

  it('fails closed instead of producing negative aggregates from a stale baseline', () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-05',
      status: 'completed',
      kidId: 'kid-1',
      attendance: { 'kid-1': { status: 'present' } },
    };
    const after = {
      ...before,
      attendance: { 'kid-1': { status: 'late' } },
    };
    const plan = planParentClassAttendanceRollupChange({ before, after, nowMs: NOW });
    expect(plan.mode).toBe('delta');
    if (plan.mode !== 'delta') return;

    const staleBase = projection([]);
    expect(
      applyParentClassAttendanceRollupOperation({
        base: staleBase,
        operation: plan.operations[0],
        nowMs: NOW,
      }),
    ).toBeNull();
  });
});
