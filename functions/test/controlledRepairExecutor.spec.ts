import {describe, expect, it} from 'vitest';
import {
  CONTROLLED_REPAIR_AUTO_EXECUTION_ENABLED,
  CONTROLLED_REPAIR_CONFIRMATION,
  CONTROLLED_REPAIR_MAX_ENROLLMENTS_PER_EXECUTION,
  deriveControlledRepairFromCurrentState,
  fingerprintControlledRepairPlan,
  hardenSafeRepairPlanForExecution,
} from '../src/scheduling/controlledRepairExecutor';
import {
  buildRollingMaterializationPlan,
  type RollingMaterializationOccurrence,
} from '../src/scheduling/rollingScheduleMaterializer';
import type {SafeRepairEnrollmentPlan} from '../src/scheduling/safeRepairPlanner';

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

describe('Brick 5 controlled repair executor', () => {
  it('is manual-only and one enrollment per execution', () => {
    expect(CONTROLLED_REPAIR_AUTO_EXECUTION_ENABLED).toBe(false);
    expect(CONTROLLED_REPAIR_MAX_ENROLLMENTS_PER_EXECUTION).toBe(1);
    expect(CONTROLLED_REPAIR_CONFIRMATION).toBe(
      'EXECUTE_CONTROLLED_SCHEDULE_REPAIR',
    );
  });

  it('derives future missing sessions as safe creates while preserving healthy sessions', () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const sessions = new Map<string, Record<string, unknown>>();
    sessions.set(
      rolling.occurrences[0].sessionId,
      healthySession('enr-1', enrollment, rolling.occurrences[0]),
    );

    const derived = deriveControlledRepairFromCurrentState({
      enrollmentId: 'enr-1',
      enrollment,
      anchorYmd: '2026-09-18',
      sessions,
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });

    expect(derived.plan.blockers).toBe(0);
    expect(derived.plan.safeCreates).toBe(2);
    expect(derived.createPayloads).toHaveLength(2);
    expect(derived.healthySessionsPreserved).toBe(1);
    expect(derived.plan.metadataAction).toBe('INITIALIZE');
  });

  it('fails closed for past-due missing occurrences instead of creating retroactive sessions', () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const sessions = new Map<string, Record<string, unknown>>();

    rolling.occurrences.slice(1).forEach((occurrence) => {
      sessions.set(
        occurrence.sessionId,
        healthySession('enr-1', enrollment, occurrence),
      );
    });

    const derived = deriveControlledRepairFromCurrentState({
      enrollmentId: 'enr-1',
      enrollment,
      anchorYmd: '2026-09-18',
      sessions,
      nowMs: rolling.occurrences[0].startAtUtcMs + 1,
    });

    expect(derived.plan.blockers).toBe(1);
    expect(derived.plan.metadataAction).toBe('BLOCKED');
    expect(derived.plan.actions[0].type).toBe('BLOCK_PAST_DUE_OCCURRENCE');
    expect(derived.createPayloads).toHaveLength(0);
  });

  it('preserves cancellations and linked replacements', () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const sessions = new Map<string, Record<string, unknown>>();

    sessions.set(rolling.occurrences[0].sessionId, {
      ...healthySession('enr-1', enrollment, rolling.occurrences[0]),
      status: 'cancelled',
    });
    sessions.set('replacement', {
      enrollmentId: 'enr-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      date: '2026-09-22',
      startTime: '11:00',
      durationMinutes: 35,
      status: 'scheduled',
      isMakeup: true,
      makeupForSessionId: rolling.occurrences[1].sessionId,
    });
    sessions.set(
      rolling.occurrences[2].sessionId,
      healthySession('enr-1', enrollment, rolling.occurrences[2]),
    );

    const derived = deriveControlledRepairFromCurrentState({
      enrollmentId: 'enr-1',
      enrollment,
      anchorYmd: '2026-09-18',
      sessions,
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });

    expect(derived.plan.blockers).toBe(0);
    expect(derived.plan.safeCreates).toBe(0);
    expect(derived.plan.exceptionsPreserved).toBe(2);
    expect(derived.plan.actions.filter(
      (action) => action.type === 'PRESERVE_EXCEPTION',
    )).toHaveLength(2);
  });

  it('blocks identity conflict and suppresses metadata write planning', () => {
    const enrollment = baseEnrollment();
    const rolling = planFor('enr-1', enrollment);
    const sessions = new Map<string, Record<string, unknown>>();

    rolling.occurrences.forEach((occurrence, index) => {
      sessions.set(
        occurrence.sessionId,
        index === 0
          ? {
              ...healthySession('enr-1', enrollment, occurrence),
              teacherId: 'wrong-teacher',
            }
          : healthySession('enr-1', enrollment, occurrence),
      );
    });

    const derived = deriveControlledRepairFromCurrentState({
      enrollmentId: 'enr-1',
      enrollment,
      anchorYmd: '2026-09-18',
      sessions,
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });

    expect(derived.plan.blockers).toBe(1);
    expect(derived.plan.metadataAction).toBe('BLOCKED');
    expect(derived.plan.actions[0].type).toBe('BLOCK_IDENTITY_CONFLICT');
  });

  it('blocks invalid source and unsafe billing payloads', () => {
    const invalid = baseEnrollment({teacherId: ''});
    const invalidDerived = deriveControlledRepairFromCurrentState({
      enrollmentId: 'invalid',
      enrollment: invalid,
      anchorYmd: '2026-09-18',
      sessions: new Map(),
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });
    expect(invalidDerived.plan.actions[0].type).toBe('BLOCK_INVALID_SOURCE');

    const unsafeBilling = baseEnrollment({
      feePerClass: 0,
      billingRateSnapshot: 0,
      parentChargePerSession: 0,
    });
    const unsafeDerived = deriveControlledRepairFromCurrentState({
      enrollmentId: 'unsafe',
      enrollment: unsafeBilling,
      anchorYmd: '2026-09-18',
      sessions: new Map(),
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });
    expect(unsafeDerived.plan.actions.every(
      (action) =>
        action.type === 'BLOCK_UNSAFE_SESSION_PAYLOAD' ||
        action.type === 'BLOCK_PAST_DUE_OCCURRENCE',
    )).toBe(true);
    expect(unsafeDerived.createPayloads).toHaveLength(0);
  });

  it('hardens Brick 4 plan against a missing occurrence whose start time has passed', () => {
    const plan: SafeRepairEnrollmentPlan = {
      enrollmentId: 'enr-1',
      expectedOccurrences: 1,
      safeCreates: 1,
      exceptionsPreserved: 0,
      blockers: 0,
      metadataAction: 'INITIALIZE',
      actions: [
        {
          type: 'SAFE_CREATE_MISSING_SESSION',
          enrollmentId: 'enr-1',
          sessionId: 'enr-1_20260918_1000',
          date: '2026-09-18',
          startTime: '10:00',
          durationMinutes: 35,
        },
        {
          type: 'SAFE_INITIALIZE_MATERIALIZATION',
          enrollmentId: 'enr-1',
        },
      ],
    };

    const hardened = hardenSafeRepairPlanForExecution(
      plan,
      Date.UTC(2026, 8, 18, 5, 0, 1),
    );

    expect(hardened.safeCreates).toBe(0);
    expect(hardened.blockers).toBe(1);
    expect(hardened.metadataAction).toBe('BLOCKED');
    expect(hardened.actions[0].type).toBe('BLOCK_PAST_DUE_OCCURRENCE');
    expect(hardened.actions.some(
      (action) => action.type === 'SAFE_INITIALIZE_MATERIALIZATION',
    )).toBe(false);
  });

  it('produces deterministic plan fingerprints and changes them when the actionable state changes', () => {
    const base: SafeRepairEnrollmentPlan = {
      enrollmentId: 'enr-1',
      expectedOccurrences: 1,
      safeCreates: 1,
      exceptionsPreserved: 0,
      blockers: 0,
      metadataAction: 'INITIALIZE',
      actions: [{
        type: 'SAFE_CREATE_MISSING_SESSION',
        enrollmentId: 'enr-1',
        sessionId: 's1',
        date: '2026-09-20',
        startTime: '10:00',
        durationMinutes: 35,
      }],
    };
    const first = hardenSafeRepairPlanForExecution(
      base,
      Date.UTC(2026, 8, 18, 0, 0, 0),
    );
    const reordered = {
      ...first,
      actions: [...first.actions].reverse(),
    };
    expect(fingerprintControlledRepairPlan(first)).toBe(
      fingerprintControlledRepairPlan(reordered),
    );

    const changed = {
      ...first,
      safeCreates: 0,
      blockers: 1,
      metadataAction: 'BLOCKED' as const,
      actions: [{
        ...first.actions[0],
        type: 'BLOCK_SCHEDULE_CONFLICT' as const,
      }],
    };
    expect(fingerprintControlledRepairPlan(first)).not.toBe(
      fingerprintControlledRepairPlan(changed),
    );
  });
});
