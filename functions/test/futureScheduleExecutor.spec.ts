import {describe, expect, it} from 'vitest';
import {
  executeFutureScheduleReconciliation,
  prepareFutureScheduleExecution,
  FutureScheduleExecutionError,
  type FutureScheduleExecutionReadStore,
  type FutureScheduleExecutionTransaction,
  type FutureScheduleExecutorStore,
} from '../src/scheduling/futureScheduleExecutor';
import type {FutureScheduleSessionEvidence} from '../src/scheduling/futureScheduleInspection';

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
  feePerClass?: number;
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
      feePerClass: args.feePerClass ?? 350,
      financialTermsSnapshot: {
        billingRateSnapshot: args.feePerClass ?? 350,
      },
    },
  };
}

const linkFields = [
  'makeupForSessionId',
  'rescheduledFromSessionId',
  'originalSessionId',
  'sourceSessionId',
  'replacementForSessionId',
] as const;

class InMemoryFutureScheduleStore
  implements FutureScheduleExecutorStore {
  enrollmentDoc: Record<string, unknown> | null;
  now = new Date('2026-09-19T06:00:00.000Z');
  sessions = new Map<string, Record<string, unknown>>();
  externalFinanceLinks = new Set<string>();
  writeCount = 0;
  failCreateId: string | null = null;
  failPatchId: string | null = null;

  constructor(
    enrollmentDoc: Record<string, unknown>,
    sessionRows: FutureScheduleSessionEvidence[] = [],
  ) {
    this.enrollmentDoc = {...enrollmentDoc};
    sessionRows.forEach((row) => this.sessions.set(row.id, {...row.data}));
  }

  private makeReader(
    sessions: Map<string, Record<string, unknown>>,
    enrollmentDoc: Record<string, unknown> | null,
  ): FutureScheduleExecutionReadStore {
    return {
      getNow: () => new Date(this.now.getTime()),
      getEnrollment: async () => enrollmentDoc ? {...enrollmentDoc} : null,
      getExternallyFinanceLinkedSessionIds: async (sessionIds) =>
        sessionIds.filter((id) => this.externalFinanceLinks.has(id)),
      getSessionsByIds: async (sessionIds) =>
        sessionIds
          .filter((id) => sessions.has(id))
          .map((id) => ({id, data: {...sessions.get(id)!}})),
      listSessionsForEnrollmentWindow: async ({enrollmentId, fromYmd, throughYmd}) =>
        Array.from(sessions.entries())
          .filter(([, data]) =>
            String(data.enrollmentId || '') === enrollmentId &&
            typeof data.date === 'string' &&
            data.date >= fromYmd &&
            data.date <= throughYmd
          )
          .map(([id, data]) => ({id, data: {...data}})),
      listExceptionSessionsReferencingIds: async (sessionIds) => {
        const expected = new Set(sessionIds);
        return Array.from(sessions.entries())
          .filter(([, data]) =>
            linkFields.some((field) => expected.has(String(data[field] || '')))
          )
          .map(([id, data]) => ({id, data: {...data}}));
      },
    };
  }

  getNow() {
    return new Date(this.now.getTime());
  }

  async getEnrollment(enrollmentId: string) {
    return this.makeReader(this.sessions, this.enrollmentDoc).getEnrollment(enrollmentId);
  }

  async getExternallyFinanceLinkedSessionIds(sessionIds: string[]) {
    return this.makeReader(this.sessions, this.enrollmentDoc)
      .getExternallyFinanceLinkedSessionIds(sessionIds);
  }

  async getSessionsByIds(sessionIds: string[]) {
    return this.makeReader(this.sessions, this.enrollmentDoc).getSessionsByIds(sessionIds);
  }

  async listSessionsForEnrollmentWindow(args: {
    enrollmentId: string;
    fromYmd: string;
    throughYmd: string;
  }) {
    return this.makeReader(this.sessions, this.enrollmentDoc)
      .listSessionsForEnrollmentWindow(args);
  }

  async listExceptionSessionsReferencingIds(sessionIds: string[]) {
    return this.makeReader(this.sessions, this.enrollmentDoc)
      .listExceptionSessionsReferencingIds(sessionIds);
  }

  async runTransaction<T>(
    handler: (tx: FutureScheduleExecutionTransaction) => Promise<T>,
  ): Promise<T> {
    const workingEnrollment = this.enrollmentDoc ? {...this.enrollmentDoc} : null;
    const workingSessions = new Map(
      Array.from(this.sessions.entries()).map(([id, data]) => [id, {...data}]),
    );
    let localWrites = 0;
    const reader = this.makeReader(workingSessions, workingEnrollment);

    const tx: FutureScheduleExecutionTransaction = {
      ...reader,
      createSession: async (sessionId, payload) => {
        if (this.failCreateId === sessionId) throw new Error('simulated create failure');
        if (workingSessions.has(sessionId)) throw new Error('already exists');
        workingSessions.set(sessionId, {...payload});
        localWrites += 1;
      },
      patchSession: async (sessionId, patch) => {
        if (this.failPatchId === sessionId) throw new Error('simulated patch failure');
        const current = workingSessions.get(sessionId);
        if (!current) throw new Error(`missing session ${sessionId}`);
        workingSessions.set(sessionId, {...current, ...patch});
        localWrites += 1;
      },
    };

    const result = await handler(tx);
    this.sessions = workingSessions;
    this.writeCount += localWrites;
    return result;
  }
}

async function preview(store: InMemoryFutureScheduleStore) {
  return prepareFutureScheduleExecution(store, {
    enrollmentId: 'enrollment-1',
  });
}

describe('Brick 4 transactional future schedule executor', () => {
  it('executes a no-op transaction with zero writes when the schedule is already converged', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment(), [
      regular({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regular({id: 'enrollment-1_20260923_1730', date: '2026-09-23'}),
      regular({id: 'enrollment-1_20260925_1730', date: '2026-09-25'}),
      regular({id: 'enrollment-1_20260928_1730', date: '2026-09-28'}),
      regular({id: 'enrollment-1_20260930_1730', date: '2026-09-30'}),
      regular({id: 'enrollment-1_20261002_1730', date: '2026-10-02'}),
    ]);
    const approved = await preview(store);

    const result = await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(result.status).toBe('noop');
    expect(result.appliedActions).toBe(0);
    expect(store.writeCount).toBe(0);
  });

  it('creates all missing canonical future occurrences in one transaction', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());
    const approved = await preview(store);

    const result = await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(result.status).toBe('applied');
    expect(result.appliedActions).toBe(6);
    expect(store.sessions.has('enrollment-1_20260921_1730')).toBe(true);
    expect(store.sessions.has('enrollment-1_20261002_1730')).toBe(true);
    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      date: '2026-09-21',
      startTime: '17:30',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'rolling_schedule',
      scheduleRevision: 7,
      feePerClass: 400,
    });
  });

  it('recomputes the IST day boundary at execution and rejects an approval that crossed midnight', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());
    store.now = new Date('2026-09-19T18:29:59.000Z');
    const approved = await preview(store);
    expect(approved.todayYmd).toBe('2026-09-19');

    store.now = new Date('2026-09-19T18:30:00.000Z');

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'STALE_APPROVAL'});
    expect(store.writeCount).toBe(0);
  });

  it('rejects stale approval when enrollment state changes after preview', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());
    const approved = await preview(store);
    store.enrollmentDoc = {...store.enrollmentDoc!, feePerClass: 450};

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({
      name: 'FutureScheduleExecutionError',
      code: 'STALE_APPROVAL',
    });
    expect(store.writeCount).toBe(0);
  });

  it('rejects stale approval when session evidence changes after preview', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());
    const approved = await preview(store);
    store.sessions.set(
      'enrollment-1_20260921_1730',
      regular({
        id: 'enrollment-1_20260921_1730',
        date: '2026-09-21',
      }).data,
    );

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'STALE_APPROVAL'});
    expect(store.writeCount).toBe(0);
  });

  it('retires safe duplicates and converges on the next preview without resurrecting them', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment(), [
      regular({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regular({
        id: 'legacy-dup',
        date: '2026-09-21',
        source: 'enrollmentSchedule',
      }),
    ]);
    const approved = await preview(store);

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('legacy-dup')).toMatchObject({
      status: 'cancelled',
      cancelledReason: 'rolling_schedule_reconciled',
    });

    const next = await preview(store);
    expect(next.plan.actions.some((action) =>
      'sessionId' in action && action.sessionId === 'legacy-dup'
    )).toBe(false);
    expect(next.plan.blockers.some((blocker) =>
      blocker.sessionId === 'legacy-dup'
    )).toBe(false);
  });

  it('rewrites future teacher/duration drift without touching the existing financial snapshot', async () => {
    const wrongTeacher = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
      feePerClass: 350,
    });
    wrongTeacher.data.teacherName = 'Old Teacher';
    wrongTeacher.data.teacherEmail = 'old@example.com';
    wrongTeacher.data.parentId = 'old-parent';
    wrongTeacher.data.parentIds = ['old-parent'];
    const store = new InMemoryFutureScheduleStore(
      enrollment({
        teacherName: 'New Teacher',
        teacherEmail: 'new@example.com',
      }),
      [wrongTeacher],
    );
    const approved = await preview(store);

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      teacherId: 'teacher-1',
      teacherName: 'New Teacher',
      teacherEmail: 'new@example.com',
      parentId: 'parent-1',
      parentIds: ['parent-1'],
      date: '2026-09-21',
      durationMinutes: 35,
      feePerClass: 350,
      financialTermsSnapshot: {
        billingRateSnapshot: 350,
      },
    });
  });

  it('preserves existing teacher metadata when rewriting without enrollment teacher metadata', async () => {
    const wrongTeacher = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
      feePerClass: 350,
    });
    wrongTeacher.data.teacherName = 'Existing Teacher';
    wrongTeacher.data.teacherEmail = 'existing.teacher@example.com';

    const store = new InMemoryFutureScheduleStore(enrollment(), [wrongTeacher]);
    const approved = await preview(store);

    expect(approved.plan.actions).toContainEqual({
      kind: 'REWRITE_EXPECTED_REGULAR',
      actionId: 'rewrite:enrollment-1_20260921_1730',
      sessionId: 'enrollment-1_20260921_1730',
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      reasons: ['teacher_identity_mismatch'],
    });

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      teacherId: 'teacher-1',
      teacherName: 'Existing Teacher',
      teacherEmail: 'existing.teacher@example.com',
      date: '2026-09-21',
      durationMinutes: 35,
      feePerClass: 350,
      financialTermsSnapshot: {
        billingRateSnapshot: 350,
      },
    });
  });

  it('refuses to resurrect a session cancelled by terminal enrollment discontinuation', async () => {
    const discontinued = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
    });
    discontinued.data.cancelledReason = 'enrollment_discontinued';
    discontinued.data.rollingLifecycleCancellation = {
      source: 'rolling_schedule_lifecycle',
      reason: 'enrollment_discontinued',
    };

    const store = new InMemoryFutureScheduleStore(enrollment(), [discontinued]);
    const approved = await preview(store);

    expect(approved.plan.readyToApply).toBe(false);
    expect(approved.plan.blockers.some((blocker) =>
      blocker.reasons.includes('non_restorable_system_cancelled_expected_session')
    )).toBe(true);

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'PLAN_BLOCKED'});
    expect(store.sessions.get('enrollment-1_20260921_1730')?.status).toBe('cancelled');
    expect(store.writeCount).toBe(0);
  });

  it('restores only a system-cancelled deterministic occurrence and clears cancellation state', async () => {
    const cancelled = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
    });
    cancelled.data.cancelledReason = 'rolling_schedule_reconciled';
    cancelled.data.cancelledBy = 'old-worker';
    cancelled.data.rollingScheduleReconciliationCancellation = {
      source: 'rolling_schedule_reconciliation',
    };
    cancelled.data.teacherName = 'Existing Teacher';
    cancelled.data.teacherEmail = 'existing.teacher@example.com';

    const store = new InMemoryFutureScheduleStore(enrollment(), [cancelled]);
    const approved = await preview(store);

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      status: 'scheduled',
      cancelledReason: null,
      cancelledBy: null,
      rollingScheduleReconciliationCancellation: null,
      teacherName: 'Existing Teacher',
      teacherEmail: 'existing.teacher@example.com',
    });
  });

  it('canonicalizes a safe legacy teacher mismatch using retire + create', async () => {
    const legacy = regular({
      id: 'legacy-wrong-teacher',
      date: '2026-09-21',
      teacherId: 'teacher-2',
      source: 'enrollmentSchedule',
    });
    const store = new InMemoryFutureScheduleStore(enrollment(), [legacy]);
    const approved = await preview(store);

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('legacy-wrong-teacher')).toMatchObject({
      status: 'cancelled',
      cancelledReason: 'rolling_schedule_reconciled',
    });
    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      status: 'scheduled',
      teacherId: 'teacher-1',
    });
  });

  it('synchronizes a future session join link as safe metadata drift', async () => {
    const row = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    row.data.joinUrl = 'https://old.example/class';

    const store = new InMemoryFutureScheduleStore(
      enrollment({joinUrl: 'https://new.example/class'}),
      [row],
    );
    const approved = await preview(store);

    expect(approved.plan.actions).toContainEqual({
      kind: 'SYNC_REGULAR_METADATA',
      actionId: 'sync:enrollment-1_20260921_1730',
      sessionId: 'enrollment-1_20260921_1730',
      reasons: ['join_url_drift'],
    });

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('enrollment-1_20260921_1730')?.joinUrl)
      .toBe('https://new.example/class');
  });

  it('synchronizes missing teacher name without rewriting financial terms', async () => {
    const row = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      feePerClass: 350,
    });
    row.data.teacherName = null;

    const store = new InMemoryFutureScheduleStore(
      enrollment({teacherName: 'Teacher One'}),
      [row],
    );

    const approved = await preview(store);

    expect(approved.plan.actions).toContainEqual({
      kind: 'SYNC_REGULAR_METADATA',
      actionId: 'sync:enrollment-1_20260921_1730',
      sessionId: 'enrollment-1_20260921_1730',
      reasons: ['teacher_name_drift'],
    });

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      teacherId: 'teacher-1',
      teacherName: 'Teacher One',
      feePerClass: 350,
      financialTermsSnapshot: {
        billingRateSnapshot: 350,
      },
    });
  });

  it('synchronizes schedule revision and parent metadata without rewriting financial terms', async () => {
    const stale = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      scheduleRevision: 5,
      feePerClass: 350,
    });
    stale.data.parentId = 'old-parent';
    stale.data.parentIds = ['old-parent'];

    const store = new InMemoryFutureScheduleStore(enrollment(), [stale]);
    const approved = await preview(store);

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('enrollment-1_20260921_1730')).toMatchObject({
      scheduleRevision: 7,
      parentId: 'parent-1',
      parentIds: ['parent-1'],
      feePerClass: 350,
    });
  });

  it('blocks creation when an expected session document is missing but finance evidence already exists for its deterministic ID', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());
    store.externalFinanceLinks.add('enrollment-1_20260921_1730');

    const approved = await preview(store);

    expect(approved.plan.actions).toContainEqual(expect.objectContaining({
      kind: 'CREATE_EXPECTED_REGULAR',
      occurrenceSessionId: 'enrollment-1_20260921_1730',
    }));
    expect(approved.executorBlockers).toEqual([
      'external_finance_without_session:enrollment-1_20260921_1730',
    ]);

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'PLAN_BLOCKED'});
    expect(store.sessions.has('enrollment-1_20260921_1730')).toBe(false);
    expect(store.writeCount).toBe(0);
  });

  it('blocks a future mutation when external billing/teacher-earning evidence exists', async () => {
    const wrongTeacher = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    const store = new InMemoryFutureScheduleStore(enrollment(), [wrongTeacher]);
    store.externalFinanceLinks.add('enrollment-1_20260921_1730');

    const approved = await preview(store);

    expect(approved.externallyFinanceLinkedSessionIds)
      .toEqual(['enrollment-1_20260921_1730']);
    expect(approved.plan.readyToApply).toBe(false);
    expect(approved.plan.blockers.some((blocker) =>
      blocker.reasons.includes('future_regular_session_contains_protected_state')
    )).toBe(true);

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'PLAN_BLOCKED'});
    expect(store.writeCount).toBe(0);
  });

  it('treats new external finance evidence after preview as stale approval', async () => {
    const wrongTeacher = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    const store = new InMemoryFutureScheduleStore(enrollment(), [wrongTeacher]);
    const approved = await preview(store);

    store.externalFinanceLinks.add('enrollment-1_20260921_1730');

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'STALE_APPROVAL'});
    expect(store.writeCount).toBe(0);
  });

  it('refuses any blocked plan before the first write', async () => {
    const protectedRow = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    protectedRow.data.attendance = {'kid-1': {status: 'present'}};
    const store = new InMemoryFutureScheduleStore(enrollment(), [protectedRow]);
    const approved = await preview(store);

    expect(approved.plan.readyToApply).toBe(false);
    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'PLAN_BLOCKED'});
    expect(store.writeCount).toBe(0);
  });

  it('refuses source-blocked enrollment configuration before any write', async () => {
    const store = new InMemoryFutureScheduleStore(
      enrollment({teacherId: undefined}),
    );
    const approved = await preview(store);

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'SOURCE_BLOCKED'});
    expect(store.writeCount).toBe(0);
  });

  it('refuses a write plan that lacks billing terms', async () => {
    const store = new InMemoryFutureScheduleStore(
      enrollment({feePerClass: undefined}),
    );
    const approved = await preview(store);

    expect(approved.plan.blockers.some((blocker) =>
      blocker.reasons.includes('source:missing_billing_rate_for_session_write')
    )).toBe(true);

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'PLAN_BLOCKED'});
    expect(store.writeCount).toBe(0);
  });

  it('fails closed before writes when one enrollment produces an unexpectedly large mutation set', async () => {
    const rows: FutureScheduleSessionEvidence[] = [];
    for (let index = 0; index < 129; index += 1) {
      const hour = String(Math.floor(index / 60) % 24).padStart(2, '0');
      const minute = String(index % 60).padStart(2, '0');
      rows.push(regular({
        id: `unexpected-${index}`,
        date: '2026-09-22',
        startTime: `${hour}:${minute}`,
        source: 'enrollmentSchedule',
      }));
    }

    const store = new InMemoryFutureScheduleStore(enrollment(), rows);
    const approved = await preview(store);
    expect(approved.plan.actions.length).toBeGreaterThan(128);

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toMatchObject({code: 'UNSAFE_ACTION'});
    expect(store.writeCount).toBe(0);
  });

  it('rolls back earlier mutations when a later action fails inside the transaction', async () => {
    const canonical = regular({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    const duplicate = regular({
      id: 'legacy-dup',
      date: '2026-09-21',
      source: 'enrollmentSchedule',
    });
    const store = new InMemoryFutureScheduleStore(enrollment(), [
      canonical,
      duplicate,
    ]);
    const approved = await preview(store);
    store.failCreateId = 'enrollment-1_20260923_1730';

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    })).rejects.toThrow(/simulated create failure/i);

    expect(store.sessions.get('legacy-dup')?.status).toBe('scheduled');
    expect(store.sessions.has('enrollment-1_20260923_1730')).toBe(false);
    expect(store.writeCount).toBe(0);
  });

  it('is idempotent: after a successful repair, a fresh preview executes as no-op', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());
    const first = await preview(store);

    const applied = await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: first.approvalFingerprint,
      actorId: 'test',
    });
    expect(applied.status).toBe('applied');

    const second = await preview(store);
    expect(second.plan.isNoop).toBe(true);

    const beforeWrites = store.writeCount;
    const noop = await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: second.approvalFingerprint,
      actorId: 'test',
    });
    expect(noop.status).toBe('noop');
    expect(store.writeCount).toBe(beforeWrites);
  });

  it('never touches today or historical rows', async () => {
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
    const store = new InMemoryFutureScheduleStore(enrollment(), [today, past]);
    const approved = await preview(store);

    await executeFutureScheduleReconciliation(store, {
      enrollmentId: 'enrollment-1',
      expectedApprovalFingerprint: approved.approvalFingerprint,
      actorId: 'test',
    });

    expect(store.sessions.get('today-row')?.status).toBe('scheduled');
    expect(store.sessions.get('past-row')?.status).toBe('scheduled');
  });

  it('fingerprints Firestore-reference-like enrollment metadata without recursive serialization', async () => {
    const fakeReference: Record<string, unknown> = {
      path: 'kids/kid-1',
      id: 'kid-1',
      get: () => undefined,
    };
    fakeReference.self = fakeReference;

    const store = new InMemoryFutureScheduleStore(
      enrollment({kidRef: fakeReference}),
    );

    const approved = await preview(store);

    expect(approved.approvalFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces a stable approval fingerprint for identical state regardless of evidence read order', async () => {
    const a = regular({id: 'a', date: '2026-09-21', source: 'enrollmentSchedule'});
    const b = regular({id: 'b', date: '2026-09-22', source: 'enrollmentSchedule'});
    const first = new InMemoryFutureScheduleStore(enrollment(), [a, b]);
    const second = new InMemoryFutureScheduleStore(enrollment(), [b, a]);

    expect((await preview(first)).approvalFingerprint)
      .toBe((await preview(second)).approvalFingerprint);
  });

  it('exposes a typed execution error for invalid input', async () => {
    const store = new InMemoryFutureScheduleStore(enrollment());

    await expect(executeFutureScheduleReconciliation(store, {
      enrollmentId: '',
      expectedApprovalFingerprint: 'x',
      actorId: 'test',
    })).rejects.toBeInstanceOf(FutureScheduleExecutionError);
  });
});
