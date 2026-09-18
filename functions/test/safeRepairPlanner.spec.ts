import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  materializationMatchesPlan,
  runSafeRepairPlannerWithStore,
  type SafeRepairActionType,
} from '../src/scheduling/safeRepairPlanner';
import {
  buildRollingMaterializationPlan,
  type RollingMaterializationOccurrence,
} from '../src/scheduling/rollingScheduleMaterializer';
import type {ScheduleIntegrityStore} from '../src/scheduling/scheduleIntegrityEngine';

const baseEnrollment = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  status: 'active',
  kidId: 'kid-1',
  kidIds: ['kid-1'],
  studentId: 'kid-1',
  childId: 'kid-1',
  parentId: 'parent-1',
  teacherId: 'teacher-1',
  courseId: 'course-1',
  feePerClass: 400,
  teacherPayPerSession: 175,
  currency: 'INR',
  classesStartDateYmd: '2026-09-01',
  schedule: {
    timezone: 'Asia/Kolkata',
    revision: 1,
    weeklySlots: [
      {weekday: 5, time: '10:00', durationMinutes: 35},
    ],
  },
  ...overrides,
});

const planFor = (
  enrollmentId: string,
  enrollment: Record<string, unknown>,
) => buildRollingMaterializationPlan({
  enrollmentId,
  enrollment,
  anchorYmd: '2026-09-18',
});

const healthySession = (
  enrollmentId: string,
  enrollment: Record<string, unknown>,
  occurrence: RollingMaterializationOccurrence,
): Record<string, unknown> => ({
  enrollmentId,
  courseId: enrollment.courseId,
  teacherId: enrollment.teacherId,
  kidId: enrollment.kidId,
  kidIds: enrollment.kidIds,
  date: occurrence.date,
  startTime: occurrence.startTime,
  durationMinutes: occurrence.durationMinutes,
  status: 'scheduled',
  scheduleRevision: 1,
});

class MemoryStore implements ScheduleIntegrityStore {
  enrollments: Array<{id: string; data: Record<string, unknown>}>;
  sessions = new Map<string, Record<string, unknown>>();
  referencedExceptions = new Map<string, Record<string, unknown>>();

  constructor(
    enrollments: Array<{id: string; data: Record<string, unknown>}>,
  ) {
    this.enrollments = enrollments;
  }

  async listEnrollments() {
    return this.enrollments;
  }

  async getSessionsByIds(sessionIds: string[]) {
    const result = new Map<string, Record<string, unknown>>();
    sessionIds.forEach((sessionId) => {
      const session = this.sessions.get(sessionId);
      if (session) result.set(sessionId, session);
    });
    return result;
  }

  async listSessionsInWindow() {
    return new Map(this.sessions);
  }

  async listExceptionSessionsReferencingIds() {
    return new Map(this.referencedExceptions);
  }
}

const actionTypes = (actions: Array<{type: SafeRepairActionType}>) =>
  actions.map((action) => action.type);

describe('Brick 4 read-only safe repair planner', () => {
  it('plans deterministic creates for only genuinely missing unexceptioned sessions', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);

    store.sessions.set(
      rolling.occurrences[0].sessionId,
      healthySession('enr-1', enrollment, rolling.occurrences[0]),
    );

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.mode).toBe('READ_ONLY_REPAIR_PLAN');
    expect(summary.writesAllowed).toBe(false);
    expect(summary.autoRepairEnabled).toBe(false);
    expect(summary.safeCreateSessions).toBe(2);
    expect(summary.metadataInitializations).toBe(1);
    expect(summary.blockedOccurrences).toBe(0);

    const plan = summary.plans[0];
    expect(plan.safeCreates).toBe(2);
    expect(plan.metadataAction).toBe('INITIALIZE');
    expect(actionTypes(plan.actions)).toEqual([
      'NO_ACTION',
      'SAFE_CREATE_MISSING_SESSION',
      'SAFE_CREATE_MISSING_SESSION',
      'SAFE_INITIALIZE_MATERIALIZATION',
    ]);
  });

  it('preserves cancellation/reschedule semantics instead of recreating the occurrence', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);

    rolling.occurrences.forEach((occurrence, index) => {
      store.sessions.set(
        occurrence.sessionId,
        index === 0
          ? {
              ...healthySession('enr-1', enrollment, occurrence),
              status: 'cancelled',
            }
          : healthySession('enr-1', enrollment, occurrence),
      );
    });

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.safeCreateSessions).toBe(0);
    expect(summary.exceptionsPreserved).toBe(1);
    expect(summary.actionCounts.PRESERVE_EXCEPTION).toBe(1);
    expect(summary.plans[0].actions[0].type).toBe('PRESERVE_EXCEPTION');
  });

  it('recognizes a linked replacement and does not plan the original session for recreation', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);

    rolling.occurrences.slice(1).forEach((occurrence) => {
      store.sessions.set(
        occurrence.sessionId,
        healthySession('enr-1', enrollment, occurrence),
      );
    });
    store.sessions.set('replacement-1', {
      enrollmentId: 'enr-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      date: '2026-09-20',
      startTime: '11:00',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'teacher_makeup_from_reschedule',
      isMakeup: true,
      makeupForSessionId: rolling.occurrences[0].sessionId,
    });

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.safeCreateSessions).toBe(0);
    expect(summary.exceptionsPreserved).toBe(1);
    expect(summary.plans[0].actions[0].type).toBe('PRESERVE_EXCEPTION');
  });

  it('blocks a foreign linked replacement instead of suppressing a real missing occurrence', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-foreign-replacement', enrollment);
    const store = new MemoryStore([
      {id: 'enr-foreign-replacement', data: enrollment},
    ]);

    rolling.occurrences.slice(1).forEach((occurrence) => {
      store.sessions.set(
        occurrence.sessionId,
        healthySession('enr-foreign-replacement', enrollment, occurrence),
      );
    });
    store.referencedExceptions.set('foreign-replacement', {
      enrollmentId: 'other-enrollment',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      kidId: 'other-kid',
      date: '2026-10-10',
      startTime: '11:00',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'teacher_makeup_from_reschedule',
      isMakeup: true,
      makeupForSessionId: rolling.occurrences[0].sessionId,
    });

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.safeCreateSessions).toBe(0);
    expect(summary.blockedOccurrences).toBe(1);
    expect(summary.plans[0].blockers).toBe(1);
    expect(summary.plans[0].metadataAction).toBe('BLOCKED');
    expect(summary.plans[0].actions[0].type).toBe(
      'BLOCK_IDENTITY_CONFLICT',
    );
  });

  it('fails closed when duplicate or unexpected regular sessions exist', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-surplus', enrollment);
    const store = new MemoryStore([{id: 'enr-surplus', data: enrollment}]);

    rolling.occurrences.forEach((occurrence) => {
      store.sessions.set(
        occurrence.sessionId,
        healthySession('enr-surplus', enrollment, occurrence),
      );
    });
    store.sessions.set('duplicate-legacy', {
      ...healthySession('enr-surplus', enrollment, rolling.occurrences[0]),
    });
    store.sessions.set('unexpected-legacy', {
      enrollmentId: 'enr-surplus',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      kidIds: ['kid-1'],
      date: '2026-09-21',
      startTime: '10:00',
      durationMinutes: 35,
      status: 'scheduled',
      scheduleRevision: 1,
    });

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.blockedOccurrences).toBe(2);
    expect(summary.blockedEnrollments).toBe(1);
    expect(summary.plans[0].blockers).toBe(2);
    expect(summary.plans[0].metadataAction).toBe('BLOCKED');
    expect(actionTypes(summary.plans[0].actions)).toContain(
      'BLOCK_DUPLICATE_REGULAR_SESSION',
    );
    expect(actionTypes(summary.plans[0].actions)).toContain(
      'BLOCK_UNEXPECTED_REGULAR_SESSION',
    );
  });

  it('blocks identity and schedule conflicts while preserving stale-revision sessions', async () => {
    const enrollment = baseEnrollment({
      schedule: {
        timezone: 'Asia/Kolkata',
        revision: 2,
        weeklySlots: [
          {weekday: 5, time: '10:00', durationMinutes: 35},
        ],
      },
    });
    const rolling = planFor('enr-1', enrollment);
    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);

    store.sessions.set(
      rolling.occurrences[0].sessionId,
      {
        ...healthySession('enr-1', enrollment, rolling.occurrences[0]),
        teacherId: 'wrong-teacher',
        scheduleRevision: 2,
      },
    );
    store.sessions.set(
      rolling.occurrences[1].sessionId,
      {
        ...healthySession('enr-1', enrollment, rolling.occurrences[1]),
        startTime: '10:30',
        scheduleRevision: 2,
      },
    );
    store.sessions.set(
      rolling.occurrences[2].sessionId,
      {
        ...healthySession('enr-1', enrollment, rolling.occurrences[2]),
        scheduleRevision: 1,
      },
    );

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.safeCreateSessions).toBe(0);
    expect(summary.blockedOccurrences).toBe(2);
    expect(summary.blockedEnrollments).toBe(1);
    expect(summary.plans[0].metadataAction).toBe('BLOCKED');
    expect(actionTypes(summary.plans[0].actions)).toEqual([
      'BLOCK_IDENTITY_CONFLICT',
      'BLOCK_SCHEDULE_CONFLICT',
      'PRESERVE_STALE_REVISION_SESSION',
    ]);
  });

  it('allows safe creates and metadata initialization alongside a stale-revision legacy session', async () => {
    const enrollment = baseEnrollment({
      schedule: {
        timezone: 'Asia/Kolkata',
        revision: 2,
        weeklySlots: [
          {weekday: 5, time: '10:00', durationMinutes: 35},
        ],
      },
    });
    const rolling = planFor('enr-stale-safe', enrollment);
    const store = new MemoryStore([
      {id: 'enr-stale-safe', data: enrollment},
    ]);

    store.sessions.set(
      rolling.occurrences[0].sessionId,
      {
        ...healthySession(
          'enr-stale-safe',
          enrollment,
          rolling.occurrences[0],
        ),
        scheduleRevision: 1,
      },
    );
    store.sessions.set(
      rolling.occurrences[2].sessionId,
      {
        ...healthySession(
          'enr-stale-safe',
          enrollment,
          rolling.occurrences[2],
        ),
        scheduleRevision: 2,
      },
    );

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.blockedOccurrences).toBe(0);
    expect(summary.safeCreateSessions).toBe(1);
    expect(summary.metadataInitializations).toBe(1);
    expect(summary.plans[0].blockers).toBe(0);
    expect(summary.plans[0].metadataAction).toBe('INITIALIZE');
    expect(actionTypes(summary.plans[0].actions)).toEqual([
      'PRESERVE_STALE_REVISION_SESSION',
      'SAFE_CREATE_MISSING_SESSION',
      'NO_ACTION',
      'SAFE_INITIALIZE_MATERIALIZATION',
    ]);
  });

  it('preserves a linked replacement outside the rolling window instead of recreating the source occurrence', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-external', enrollment);
    const store = new MemoryStore([{id: 'enr-external', data: enrollment}]);

    rolling.occurrences.slice(1).forEach((occurrence) => {
      store.sessions.set(
        occurrence.sessionId,
        healthySession('enr-external', enrollment, occurrence),
      );
    });

    store.referencedExceptions.set('replacement-outside-window', {
      enrollmentId: 'enr-external',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      date: '2026-10-10',
      startTime: '11:00',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'teacher_makeup_from_reschedule',
      isMakeup: true,
      makeupForSessionId: rolling.occurrences[0].sessionId,
    });

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.safeCreateSessions).toBe(0);
    expect(summary.exceptionsPreserved).toBe(1);
    expect(summary.plans[0].actions[0].type).toBe('PRESERVE_EXCEPTION');
  });

  it('blocks invalid source data and unsafe session payloads', async () => {
    const invalid = baseEnrollment({teacherId: ''});
    const unsafeBilling = baseEnrollment({
      feePerClass: 0,
      billingRateSnapshot: 0,
      parentChargePerSession: 0,
    });
    const store = new MemoryStore([
      {id: 'invalid', data: invalid},
      {id: 'unsafe-billing', data: unsafeBilling},
    ]);

    const summary = await runSafeRepairPlannerWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    const invalidPlan = summary.plans.find((plan) => plan.enrollmentId === 'invalid');
    const unsafePlan = summary.plans.find((plan) => plan.enrollmentId === 'unsafe-billing');

    expect(invalidPlan?.actions[0].type).toBe('BLOCK_INVALID_SOURCE');
    expect(unsafePlan?.actions.some(
      (action) => action.type === 'BLOCK_UNSAFE_SESSION_PAYLOAD',
    )).toBe(true);
    expect(summary.safeCreateSessions).toBe(0);
  });

  it('plans metadata initialization and synchronization only when no occurrence blockers exist', async () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);

    const missingMetadataStore = new MemoryStore([
      {id: 'enr-1', data: enrollment},
    ]);
    rolling.occurrences.forEach((occurrence) => {
      missingMetadataStore.sessions.set(
        occurrence.sessionId,
        healthySession('enr-1', enrollment, occurrence),
      );
    });

    const initialize = await runSafeRepairPlannerWithStore(
      missingMetadataStore,
      {anchorYmd: '2026-09-18'},
    );
    expect(initialize.metadataInitializations).toBe(1);
    expect(initialize.plans[0].metadataAction).toBe('INITIALIZE');

    const staleMetadataEnrollment = {
      ...enrollment,
      scheduleMaterialization: {
        ...rolling.materialization,
        materializedThroughYmd: '2026-09-25',
      },
    };
    const staleMetadataStore = new MemoryStore([
      {id: 'enr-1', data: staleMetadataEnrollment},
    ]);
    rolling.occurrences.forEach((occurrence) => {
      staleMetadataStore.sessions.set(
        occurrence.sessionId,
        healthySession('enr-1', enrollment, occurrence),
      );
    });

    const sync = await runSafeRepairPlannerWithStore(
      staleMetadataStore,
      {anchorYmd: '2026-09-18'},
    );
    expect(sync.metadataSynchronizations).toBe(1);
    expect(sync.plans[0].metadataAction).toBe('SYNC');
  });

  it('matches deterministic materialization state exactly', () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);

    expect(materializationMatchesPlan(
      rolling.materialization,
      rolling.materialization,
    )).toBe(true);
    expect(materializationMatchesPlan(
      {
        ...rolling.materialization,
        scheduleRevision: 99,
      },
      rolling.materialization,
    )).toBe(false);
    expect(materializationMatchesPlan(null, rolling.materialization)).toBe(false);
  });

  it('contains no Firestore mutation, repair executor, or self-heal path', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/safeRepairPlanner.ts'),
      'utf8',
    );

    expect(source).toContain('READ_ONLY_REPAIR_PLAN');
    expect(source).not.toContain('runTransaction(');
    expect(source).not.toContain('.create(');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain('.delete(');
    expect(source).not.toContain('FieldValue');
    expect(source).not.toContain('adminRepairRollingScheduleMaterialization');
    expect(source).not.toContain('materializeRollingEnrollmentWithStore');
  });
});
