import {describe, expect, it} from 'vitest';
import {
  futureScheduleEnrollmentComparable,
  futureScheduleWritesEnabled,
  reconcileFutureScheduleEnrollmentAutomatically,
  resolveFutureScheduleSweepCursor,
  runFutureScheduleSweepBatch,
  shouldReconcileFutureScheduleEnrollmentWrite,
  shouldWrapFutureScheduleSweep,
} from '../src/scheduling/futureScheduleOrchestration';
import type {
  FutureScheduleExecutionTransaction,
  FutureScheduleExecutorStore,
} from '../src/scheduling/futureScheduleExecutor';
import type {
  FutureScheduleSessionEvidence,
} from '../src/scheduling/futureScheduleInspection';

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
    joinUrl: 'https://teams.example/class',
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

const linkFields = [
  'makeupForSessionId',
  'rescheduledFromSessionId',
  'originalSessionId',
  'sourceSessionId',
  'replacementForSessionId',
] as const;

function correctRegular(
  id: string,
  date: string,
): FutureScheduleSessionEvidence {
  return {
    id,
    data: {
      enrollmentId: 'enrollment-1',
      kidId: 'kid-1',
      kidIds: ['kid-1'],
      studentId: 'kid-1',
      childId: 'kid-1',
      parentId: 'parent-1',
      parentIds: ['parent-1'],
      teacherId: 'teacher-1',
      courseId: 'course-1',
      date,
      startTime: '17:30',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'rolling_schedule',
      scheduleRevision: 7,
      joinUrl: 'https://teams.example/class',
    },
  };
}

function seedConvergedWindow(store: AutomaticStore): void {
  [
    ['enrollment-1_20260921_1730', '2026-09-21'],
    ['enrollment-1_20260923_1730', '2026-09-23'],
    ['enrollment-1_20260925_1730', '2026-09-25'],
    ['enrollment-1_20260928_1730', '2026-09-28'],
    ['enrollment-1_20260930_1730', '2026-09-30'],
    ['enrollment-1_20261002_1730', '2026-10-02'],
  ].forEach(([id, date]) => {
    const row = correctRegular(id, date);
    store.sessions.set(row.id, row.data);
  });
}

class AutomaticStore implements FutureScheduleExecutorStore {
  now = new Date('2026-09-19T06:00:00.000Z');
  enrollmentDoc: Record<string, unknown> | null;
  sessions = new Map<string, Record<string, unknown>>();
  externalFinanceLinks = new Set<string>();
  writes = 0;
  mutateBeforeFirstTransaction: (() => void) | null = null;
  private transactionCount = 0;

  constructor(enrollmentDoc: Record<string, unknown>) {
    this.enrollmentDoc = {...enrollmentDoc};
  }

  getNow() {
    return new Date(this.now.getTime());
  }

  async getEnrollment() {
    return this.enrollmentDoc ? {...this.enrollmentDoc} : null;
  }

  async getSessionsByIds(sessionIds: string[]) {
    return sessionIds
      .filter((id) => this.sessions.has(id))
      .map((id) => ({id, data: {...this.sessions.get(id)!}}));
  }

  async listSessionsForEnrollmentWindow(args: {
    enrollmentId: string;
    fromYmd: string;
    throughYmd: string;
  }): Promise<FutureScheduleSessionEvidence[]> {
    return Array.from(this.sessions.entries())
      .filter(([, data]) =>
        String(data.enrollmentId || '') === args.enrollmentId &&
        typeof data.date === 'string' &&
        data.date >= args.fromYmd &&
        data.date <= args.throughYmd
      )
      .map(([id, data]) => ({id, data: {...data}}));
  }

  async listExceptionSessionsReferencingIds(sessionIds: string[]) {
    const expected = new Set(sessionIds);
    return Array.from(this.sessions.entries())
      .filter(([, data]) =>
        linkFields.some((field) => expected.has(String(data[field] || '')))
      )
      .map(([id, data]) => ({id, data: {...data}}));
  }

  async getExternallyFinanceLinkedSessionIds(sessionIds: string[]) {
    return sessionIds.filter((id) => this.externalFinanceLinks.has(id));
  }

  async runTransaction<T>(
    handler: (tx: FutureScheduleExecutionTransaction) => Promise<T>,
  ): Promise<T> {
    this.transactionCount += 1;
    if (this.transactionCount === 1 && this.mutateBeforeFirstTransaction) {
      this.mutateBeforeFirstTransaction();
    }

    const workingSessions = new Map(
      Array.from(this.sessions.entries()).map(([id, data]) => [id, {...data}]),
    );
    const workingEnrollment = this.enrollmentDoc
      ? {...this.enrollmentDoc}
      : null;
    let localWrites = 0;

    const tx: FutureScheduleExecutionTransaction = {
      getNow: () => new Date(this.now.getTime()),
      getEnrollment: async () => workingEnrollment ? {...workingEnrollment} : null,
      getSessionsByIds: async (ids) =>
        ids
          .filter((id) => workingSessions.has(id))
          .map((id) => ({id, data: {...workingSessions.get(id)!}})),
      listSessionsForEnrollmentWindow: async (args) =>
        Array.from(workingSessions.entries())
          .filter(([, data]) =>
            String(data.enrollmentId || '') === args.enrollmentId &&
            typeof data.date === 'string' &&
            data.date >= args.fromYmd &&
            data.date <= args.throughYmd
          )
          .map(([id, data]) => ({id, data: {...data}})),
      listExceptionSessionsReferencingIds: async (ids) => {
        const expected = new Set(ids);
        return Array.from(workingSessions.entries())
          .filter(([, data]) =>
            linkFields.some((field) => expected.has(String(data[field] || '')))
          )
          .map(([id, data]) => ({id, data: {...data}}));
      },
      getExternallyFinanceLinkedSessionIds: async (ids) =>
        ids.filter((id) => this.externalFinanceLinks.has(id)),
      createSession: async (id, payload) => {
        if (workingSessions.has(id)) throw new Error('already exists');
        workingSessions.set(id, {...payload});
        localWrites += 1;
      },
      patchSession: async (id, patch) => {
        const current = workingSessions.get(id);
        if (!current) throw new Error(`missing session ${id}`);
        workingSessions.set(id, {...current, ...patch});
        localWrites += 1;
      },
    };

    const result = await handler(tx);
    this.sessions = workingSessions;
    this.writes += localWrites;
    return result;
  }
}

describe('Brick 5 future schedule automatic orchestration', () => {
  it('defaults production writes off unless the rollout flag is explicitly true', () => {
    expect(futureScheduleWritesEnabled({})).toBe(false);
    expect(futureScheduleWritesEnabled({
      FUTURE_SCHEDULE_RECONCILER_WRITES_ENABLED: 'false',
    })).toBe(false);
    expect(futureScheduleWritesEnabled({
      FUTURE_SCHEDULE_RECONCILER_WRITES_ENABLED: 'TRUE',
    })).toBe(true);
  });

  it('keeps the 500-row cursor boundary deterministic and wraps an empty tail', () => {
    expect(resolveFutureScheduleSweepCursor({
      batchSize: 500,
      lastDocumentId: 'enrollment-500',
    })).toEqual({
      cycleCompleted: false,
      cursorAfter: 'enrollment-500',
    });
    expect(resolveFutureScheduleSweepCursor({
      batchSize: 499,
      lastDocumentId: 'enrollment-499',
    })).toEqual({
      cycleCompleted: true,
      cursorAfter: null,
    });
    expect(shouldWrapFutureScheduleSweep('enrollment-500', true)).toBe(true);
    expect(shouldWrapFutureScheduleSweep('enrollment-500', false)).toBe(false);
    expect(shouldWrapFutureScheduleSweep(null, true)).toBe(false);
  });

  it('runs shadow planning with zero session mutations when writes are disabled', async () => {
    const store = new AutomaticStore(enrollment());

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
      {writesEnabled: false},
    );

    expect(outcome.status).toBe('shadow');
    expect(outcome.actions).toBe(6);
    expect(store.sessions.size).toBe(0);
    expect(store.writes).toBe(0);
  });

  it('ignores enrollment writes that only touch operational metadata outside the scheduling contract', () => {
    const before = enrollment({
      updatedAt: 'before',
      scheduleMaterialization: {nextMaterializationDueYmd: '2026-09-20'},
    });
    const after = {
      ...before,
      updatedAt: 'after',
      scheduleMaterialization: {nextMaterializationDueYmd: '2026-09-21'},
    };

    expect(shouldReconcileFutureScheduleEnrollmentWrite({before, after}))
      .toBe(false);
    expect(futureScheduleEnrollmentComparable(before))
      .toEqual(futureScheduleEnrollmentComparable(after));
  });

  it('leaves unrelated legacy enrollment writes on the existing compatibility scheduler path', () => {
    const legacyBefore = enrollment({
      schedule: {
        weekdays: [1, 3, 5],
        timeHHmm: '17:30',
        durationMins: 35,
      },
      teacherId: 'teacher-1',
    });
    const legacyAfter = {
      ...legacyBefore,
      teacherId: 'teacher-2',
    };

    expect(shouldReconcileFutureScheduleEnrollmentWrite({
      before: legacyBefore,
      after: legacyAfter,
    })).toBe(false);

    expect(shouldReconcileFutureScheduleEnrollmentWrite({
      before: enrollment(),
      after: legacyAfter,
    })).toBe(true);
  });

  it('reacts immediately to schedule, teacher, lifecycle, join-link, and rate changes', () => {
    const base = enrollment();

    const variants = [
      enrollment({teacherId: 'teacher-2'}),
      enrollment({status: 'paused'}),
      enrollment({joinUrl: 'https://teams.example/new'}),
      enrollment({feePerClass: 450}),
      enrollment({
        schedule: {
          ...(base.schedule as Record<string, unknown>),
          revision: 8,
          weeklySlots: [{weekday: 2, time: '18:00', durationMinutes: 40}],
        },
      }),
    ];

    variants.forEach((after) => {
      expect(shouldReconcileFutureScheduleEnrollmentWrite({
        before: base,
        after,
      })).toBe(true);
    });
  });

  it('reconciles a new active enrollment automatically without external approval', async () => {
    const store = new AutomaticStore(enrollment());

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('applied');
    expect(outcome.actions).toBe(6);
    expect(outcome.attempts).toBe(1);
    expect(store.sessions.has('enrollment-1_20260921_1730')).toBe(true);
    expect(store.sessions.has('enrollment-1_20261002_1730')).toBe(true);
  });

  it('retries a stale preview and then converges against the new live state', async () => {
    const store = new AutomaticStore(enrollment());
    store.mutateBeforeFirstTransaction = () => {
      store.sessions.set('enrollment-1_20260921_1730', {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        kidIds: ['kid-1'],
        studentId: 'kid-1',
        childId: 'kid-1',
        parentId: 'parent-1',
        parentIds: ['parent-1'],
        teacherId: 'teacher-1',
        courseId: 'course-1',
        date: '2026-09-21',
        startTime: '17:30',
        durationMinutes: 35,
        status: 'scheduled',
        source: 'rolling_schedule',
        scheduleRevision: 7,
        joinUrl: 'https://teams.example/class',
      });
    };

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('applied');
    expect(outcome.attempts).toBe(2);
    expect(store.sessions.has('enrollment-1_20260923_1730')).toBe(true);
  });

  it('coexists with a concurrent daily edge-worker create without duplicating the deterministic session', async () => {
    const store = new AutomaticStore(enrollment());
    store.mutateBeforeFirstTransaction = () => {
      const row = correctRegular(
        'enrollment-1_20260921_1730',
        '2026-09-21',
      );
      store.sessions.set(row.id, {
        ...row.data,
        updatedBy: 'system:rolling_schedule_edge_worker',
      });
    };

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('applied');
    expect(outcome.attempts).toBe(2);
    expect(store.sessions.size).toBe(6);
    expect(
      Array.from(store.sessions.keys())
        .filter((id) => id === 'enrollment-1_20260921_1730'),
    ).toHaveLength(1);
  });

  it('transactionally re-confirms a no-op preview and repairs a race that appeared before commit', async () => {
    const store = new AutomaticStore(enrollment());
    seedConvergedWindow(store);
    store.mutateBeforeFirstTransaction = () => {
      store.sessions.delete('enrollment-1_20260923_1730');
    };

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('applied');
    expect(outcome.attempts).toBe(2);
    expect(store.sessions.has('enrollment-1_20260923_1730')).toBe(true);
  });

  it('transactionally re-confirms a blocked source preview before accepting the block', async () => {
    const store = new AutomaticStore(enrollment({teacherId: undefined}));
    store.mutateBeforeFirstTransaction = () => {
      store.enrollmentDoc = {
        ...store.enrollmentDoc!,
        teacherId: 'teacher-1',
      };
    };

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('applied');
    expect(outcome.attempts).toBe(2);
    expect(store.sessions.size).toBe(6);
  });

  it('skips paused/terminal lifecycle state without creating new sessions', async () => {
    const store = new AutomaticStore(enrollment({status: 'paused'}));

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('skipped_non_operational');
    expect(store.sessions.size).toBe(0);
    expect(store.writes).toBe(0);
  });

  it('surfaces active source configuration defects instead of silently skipping the enrollment', async () => {
    const store = new AutomaticStore(enrollment({teacherId: undefined}));

    const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
      store,
      'enrollment-1',
    );

    expect(outcome.status).toBe('blocked_source');
    expect(outcome.blockers).toContain('source:missing_or_ambiguous_teacher');
    expect(store.writes).toBe(0);
  });

  it('summarizes a sweep batch without allowing one failed enrollment to abort the others', async () => {
    const summary = await runFutureScheduleSweepBatch({
      enrollmentIds: ['a', 'b', 'c', 'd', 'd'],
      concurrency: 2,
      reconcile: async (id) => {
        if (id === 'a') {
          return {
            enrollmentId: id,
            status: 'applied',
            attempts: 1,
            actions: 2,
            planFingerprint: 'a',
            blockers: [],
          };
        }
        if (id === 'b') throw new Error('simulated failure');
        if (id === 'c') {
          return {
            enrollmentId: id,
            status: 'blocked_plan',
            attempts: 1,
            actions: 0,
            planFingerprint: 'c',
            blockers: ['protected'],
          };
        }
        return {
          enrollmentId: id,
          status: 'noop',
          attempts: 1,
          actions: 0,
          planFingerprint: id,
          blockers: [],
        };
      },
    });

    expect(summary).toEqual({
      enrollmentIdsRead: 4,
      applied: 1,
      noop: 1,
      blockedSource: 0,
      blockedPlan: 1,
      skippedNonOperational: 0,
      shadow: 0,
      failed: 1,
      failedEnrollmentIds: ['b'],
    });
  });
});
