import {describe, expect, it} from 'vitest';
import {
  inspectFutureScheduleEnrollment,
  type FutureScheduleSessionEvidence,
} from '../src/scheduling/futureScheduleInspection';
import {
  buildFutureScheduleReconciliationPlan,
} from '../src/scheduling/futureSchedulePlan';

function enrollment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: 'active',
    kidId: 'kid-1',
    kidIds: ['kid-1'],
    studentId: 'kid-1',
    childId: 'kid-1',
    parentId: 'parent-1',
    parentIds: ['parent-1'],
    teacherId: 'teacher-1',
    courseId: 'course-1',
    feePerClass: 400,
    currency: 'INR',
    classesStartDateYmd: '2026-09-01',
    schedule: {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 7,
      weeklySlots: [
        {weekday: 1, time: '17:30', durationMinutes: 35},
        {weekday: 3, time: '17:30', durationMinutes: 35},
        {weekday: 5, time: '17:30', durationMinutes: 35},
      ],
    },
    ...overrides,
  };
}

function regular(args: {
  id: string;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  status?: string;
  source?: string;
  teacherId?: string;
  scheduleRevision?: number;
}): FutureScheduleSessionEvidence {
  return {
    id: args.id,
    data: {
      enrollmentId: 'enrollment-1',
      kidId: 'kid-1',
      kidIds: ['kid-1'],
      studentId: 'kid-1',
      childId: 'kid-1',
      parentId: 'parent-1',
      parentIds: ['parent-1'],
      teacherId: args.teacherId ?? 'teacher-1',
      courseId: 'course-1',
      date: args.date,
      startTime: args.startTime ?? '17:30',
      durationMinutes: args.durationMinutes ?? 35,
      status: args.status ?? 'scheduled',
      source: args.source ?? 'rolling_schedule',
      scheduleRevision: args.scheduleRevision ?? 7,
    },
  };
}

function planFor(
  sessions: FutureScheduleSessionEvidence[],
  enrollmentOverrides: Record<string, unknown> = {},
) {
  const inspected = inspectFutureScheduleEnrollment({
    enrollmentId: 'enrollment-1',
    enrollment: enrollment(enrollmentOverrides),
    todayYmd: '2026-09-19',
    sessions,
  });
  return buildFutureScheduleReconciliationPlan(inspected);
}

describe('Brick 3 deterministic future schedule reconciliation plan', () => {
  it('produces a true no-op when Brick 2 is fully converged', () => {
    const sessions = [
      regular({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regular({id: 'enrollment-1_20260923_1730', date: '2026-09-23'}),
      regular({id: 'enrollment-1_20260925_1730', date: '2026-09-25'}),
      regular({id: 'enrollment-1_20260928_1730', date: '2026-09-28'}),
      regular({id: 'enrollment-1_20260930_1730', date: '2026-09-30'}),
      regular({id: 'enrollment-1_20261002_1730', date: '2026-10-02'}),
    ];

    const plan = planFor(sessions);

    expect(plan.actions).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.readyToApply).toBe(true);
    expect(plan.isNoop).toBe(true);
    expect(plan.managedFromYmd).toBe('2026-09-20');
    expect(plan.managedThroughYmd).toBe('2026-10-03');
  });

  it('plans deterministic creates for every missing expected occurrence', () => {
    const plan = planFor([
      regular({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
    ]);

    expect(plan.actions.filter((row) => row.kind === 'CREATE_EXPECTED_REGULAR'))
      .toEqual([
        expect.objectContaining({actionId: 'create:enrollment-1_20260923_1730'}),
        expect.objectContaining({actionId: 'create:enrollment-1_20260925_1730'}),
        expect.objectContaining({actionId: 'create:enrollment-1_20260928_1730'}),
        expect.objectContaining({actionId: 'create:enrollment-1_20260930_1730'}),
        expect.objectContaining({actionId: 'create:enrollment-1_20261002_1730'}),
      ]);
    expect(plan.summary.creates).toBe(5);
    expect(plan.blockers).toEqual([]);
    expect(plan.readyToApply).toBe(true);
  });

  it('retires only non-canonical safe duplicates and keeps the deterministic occurrence', () => {
    const plan = planFor([
      regular({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regular({id: 'legacy-duplicate', date: '2026-09-21', source: 'enrollmentSchedule'}),
    ]);

    expect(plan.actions).toContainEqual({
      kind: 'RETIRE_DUPLICATE_REGULAR',
      actionId: 'retire-duplicate:legacy-duplicate',
      sessionId: 'legacy-duplicate',
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      keepSessionId: 'enrollment-1_20260921_1730',
      reasons: ['duplicate_regular_session'],
    });
    expect(plan.blockers).toEqual([]);
  });

  it('retires an obsolete old-teacher occurrence when teacher and schedule change together', () => {
    const plan = planFor([
      regular({
        id: 'old-teacher-old-time',
        date: '2026-09-22',
        startTime: '17:30',
        teacherId: 'teacher-2',
        source: 'enrollmentSchedule',
      }),
    ]);

    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'RETIRE_UNEXPECTED_REGULAR',
      sessionId: 'old-teacher-old-time',
    }));
    expect(plan.blockers.some((blocker) =>
      blocker.sessionId === 'old-teacher-old-time'
    )).toBe(false);
    expect(plan.readyToApply).toBe(true);
  });

  it('plans old-schedule retirement and missing canonical creation for a schedule change', () => {
    const plan = planFor([
      regular({
        id: 'old-tuesday',
        date: '2026-09-22',
        startTime: '17:30',
        source: 'enrollmentSchedule',
      }),
    ]);

    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'RETIRE_UNEXPECTED_REGULAR',
      actionId: 'retire-unexpected:old-tuesday',
      sessionId: 'old-tuesday',
    }));
    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'CREATE_EXPECTED_REGULAR',
      actionId: 'create:enrollment-1_20260921_1730',
    }));
    expect(plan.readyToApply).toBe(true);
  });

  it('restores an expected deterministic occurrence that was system-cancelled', () => {
    const row = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
    });
    row.data.cancelledReason = 'rolling_schedule_reconciled';

    const plan = planFor([row]);

    expect(plan.actions).toContainEqual({
      kind: 'RESTORE_EXPECTED_REGULAR',
      actionId: 'restore:enrollment-1_20260921_1730',
      sessionId: 'enrollment-1_20260921_1730',
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      reasons: ['system_cancelled_expected_session_requires_restore'],
    });
    expect(plan.blockers).toEqual([]);
  });

  it('ignores a retired legacy system row and creates the missing canonical occurrence', () => {
    const row = regular({
      id: 'legacy-system-cancelled',
      date: '2026-09-21',
      status: 'cancelled',
      source: 'enrollmentSchedule',
    });
    row.data.cancelledReason = 'rolling_schedule_reconciled';

    const plan = planFor([row]);

    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'CREATE_EXPECTED_REGULAR',
      actionId: 'create:enrollment-1_20260921_1730',
      reasons: ['missing_regular_session'],
    }));
    expect(plan.blockers).toEqual([]);
  });

  it('rewrites an exact deterministic row when only teacher/duration drift is actionable', () => {
    const wrongTeacher = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    const wrongDuration = regular({
      id: 'enrollment-1_20260923_1730',
      date: '2026-09-23',
      durationMinutes: 40,
    });

    const plan = planFor([wrongTeacher, wrongDuration]);

    expect(plan.actions).toContainEqual({
      kind: 'REWRITE_EXPECTED_REGULAR',
      actionId: 'rewrite:enrollment-1_20260921_1730',
      sessionId: 'enrollment-1_20260921_1730',
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      reasons: ['teacher_identity_mismatch'],
    });
    expect(plan.actions).toContainEqual({
      kind: 'REWRITE_EXPECTED_REGULAR',
      actionId: 'rewrite:enrollment-1_20260923_1730',
      sessionId: 'enrollment-1_20260923_1730',
      occurrenceSessionId: 'enrollment-1_20260923_1730',
      reasons: ['duration_mismatch'],
    });
    expect(plan.blockers).toEqual([]);
  });

  it('canonicalizes a safe non-deterministic teacher/time-slot mismatch using retire + create', () => {
    const legacy = regular({
      id: 'legacy-wrong-teacher',
      date: '2026-09-21',
      teacherId: 'teacher-2',
      source: 'enrollmentSchedule',
    });

    const plan = planFor([legacy]);

    expect(plan.actions).toContainEqual({
      kind: 'RETIRE_MISMATCHED_REGULAR',
      actionId: 'retire-mismatch:legacy-wrong-teacher',
      sessionId: 'legacy-wrong-teacher',
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      reasons: ['teacher_identity_mismatch'],
    });
    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'CREATE_EXPECTED_REGULAR',
      actionId: 'create:enrollment-1_20260921_1730',
      reasons: ['teacher_identity_mismatch'],
    }));
  });

  it('plans metadata synchronization without calling physical coverage missing', () => {
    const stale = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      scheduleRevision: 5,
    });
    stale.data.parentId = 'stale-parent';

    const plan = planFor([stale]);

    expect(plan.actions).toContainEqual({
      kind: 'SYNC_REGULAR_METADATA',
      actionId: 'sync:enrollment-1_20260921_1730',
      sessionId: 'enrollment-1_20260921_1730',
      reasons: ['parent_identity_drift', 'stale_schedule_revision'],
    });
    expect(plan.summary.metadataSyncs).toBe(1);
  });

  it('preserves valid intentional exceptions with no repair action', () => {
    const cancelled = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
    });
    cancelled.data.cancelledReason = 'parent_requested';

    const plan = planFor([cancelled]);

    expect(plan.actions.some((action) =>
      'occurrenceSessionId' in action &&
      action.occurrenceSessionId === 'enrollment-1_20260921_1730'
    )).toBe(false);
    expect(plan.blockers).toEqual([]);
  });

  it('blocks rather than plans a rewrite when a mismatched future row carries attendance', () => {
    const row = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    row.data.attendance = {'kid-1': {status: 'present'}};

    const plan = planFor([row]);

    expect(plan.actions.some((action) =>
      action.kind === 'REWRITE_EXPECTED_REGULAR' &&
      action.sessionId === 'enrollment-1_20260921_1730'
    )).toBe(false);
    expect(plan.blockers.some((blocker) =>
      blocker.reasons.includes('future_regular_session_contains_protected_state')
    )).toBe(true);
    expect(plan.readyToApply).toBe(false);
  });

  it('blocks active-original plus linked replacement conflicts', () => {
    const active = regular({
      id: 'enrollment-1_20260923_1730',
      date: '2026-09-23',
    });
    const replacement: FutureScheduleSessionEvidence = {
      id: 'replacement-1',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        courseId: 'course-1',
        teacherId: 'teacher-2',
        date: '2026-10-10',
        startTime: '18:00',
        status: 'scheduled',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const plan = planFor([active, replacement]);

    expect(plan.blockers.some((blocker) =>
      blocker.reasons.includes('active_and_linked_exception_conflict')
    )).toBe(true);
    expect(plan.readyToApply).toBe(false);
  });

  it('returns a blocked plan for unusable enrollment source data and performs no speculative action', () => {
    const plan = planFor([], {teacherId: undefined});

    expect(plan.actions).toEqual([]);
    expect(plan.readyToApply).toBe(false);
    expect(plan.isNoop).toBe(false);
    expect(plan.blockers).toEqual([
      expect.objectContaining({
        reasons: ['source:missing_or_ambiguous_teacher'],
      }),
    ]);
  });

  it('retains non-write-critical source metadata warnings without turning them into scheduling blockers', () => {
    const plan = planFor([], {
      parentId: undefined,
      parentIds: [],
      courseId: undefined,
    });

    expect(plan.sourceWarnings).toEqual([
      'missing_course_identity',
      'missing_parent_identity',
    ]);
    expect(plan.blockers).toEqual([]);
    expect(plan.readyToApply).toBe(true);
  });

  it('blocks a plan that needs session creation/rewrite when billing terms are missing', () => {
    const plan = planFor([], {
      feePerClass: undefined,
    });

    expect(plan.sourceWarnings).toContain('missing_billing_rate');
    expect(plan.actions.some((action) => action.kind === 'CREATE_EXPECTED_REGULAR')).toBe(true);
    expect(plan.blockers).toContainEqual(expect.objectContaining({
      reasons: ['source:missing_billing_rate_for_session_write'],
    }));
    expect(plan.readyToApply).toBe(false);
  });

  it('produces identical action ordering and fingerprint regardless of evidence input order', () => {
    const rows = [
      regular({id: 'legacy-dup', date: '2026-09-21', source: 'enrollmentSchedule'}),
      regular({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regular({id: 'old-tuesday', date: '2026-09-22', source: 'enrollmentSchedule'}),
    ];

    const first = planFor(rows);
    const second = planFor([...rows].reverse());

    expect(second.actions).toEqual(first.actions);
    expect(second.blockers).toEqual(first.blockers);
    expect(second.planFingerprint).toBe(first.planFingerprint);
  });

  it('never plans an action for today or history because Brick 1/2 exclude them from the managed window', () => {
    const today = regular({
      id: 'today-row',
      date: '2026-09-19',
      source: 'enrollmentSchedule',
    });
    const past = regular({
      id: 'past-row',
      date: '2026-09-18',
      source: 'enrollmentSchedule',
    });

    const plan = planFor([today, past]);

    expect(plan.actions.some((action) =>
      ('sessionId' in action && ['today-row', 'past-row'].includes(action.sessionId))
    )).toBe(false);
    expect(plan.managedFromYmd).toBe('2026-09-20');
  });
});
