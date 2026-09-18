import {describe, expect, it} from 'vitest';
import {
  assertControlledRepairLiveWriteAllowed,
  resolveControlledRepairWriteGate,
} from '../src/scheduling/controlledRepairRolloutGate';
import {
  buildControlledRepairRolloutCertification,
} from '../src/scheduling/controlledRepairRolloutCertification';
import type {
  ScheduleIntegritySummary,
} from '../src/scheduling/scheduleIntegrityEngine';
import type {
  SafeRepairPlannerSummary,
} from '../src/scheduling/safeRepairPlanner';

const integrity = (
  overrides: Partial<ScheduleIntegritySummary> = {},
): ScheduleIntegritySummary => ({
  mode: 'READ_ONLY',
  pointerIndependentScan: true,
  anchorYmd: '2026-09-18',
  horizonEndYmd: '2026-10-02',
  horizonDays: 14,
  operationalEnrollments: 3,
  eligibleEnrollments: 3,
  invalidEnrollments: 0,
  expectedOccurrences: 9,
  healthyOccurrences: 6,
  scheduleExceptions: 1,
  missingOccurrences: 2,
  identityMismatches: 0,
  scheduleMismatches: 0,
  staleRevisionOccurrences: 0,
  missingToday: 0,
  affectedEnrollments: 1,
  zeroCoveredEnrollments: 0,
  enrollmentsMissingMaterializationMetadata: 1,
  invalidByReason: {
    invalid_schedule: 0,
    missing_teacher: 0,
    ambiguous_teacher: 0,
    missing_child_identity: 0,
  },
  defectsByDate: {'2026-09-25': 2},
  details: [],
  invalidDetails: [],
  ...overrides,
});

const planner = (
  overrides: Partial<SafeRepairPlannerSummary> = {},
): SafeRepairPlannerSummary => ({
  mode: 'READ_ONLY_REPAIR_PLAN',
  writesAllowed: false,
  autoRepairEnabled: false,
  anchorYmd: '2026-09-18',
  horizonEndYmd: '2026-10-02',
  horizonDays: 14,
  operationalEnrollments: 3,
  eligibleEnrollments: 3,
  invalidEnrollments: 0,
  expectedOccurrences: 9,
  safeCreateSessions: 2,
  exceptionsPreserved: 1,
  noActionOccurrences: 6,
  blockedOccurrences: 0,
  metadataInitializations: 1,
  metadataSynchronizations: 0,
  blockedEnrollments: 0,
  actionableEnrollments: 1,
  invalidByReason: {
    invalid_schedule: 0,
    missing_teacher: 0,
    ambiguous_teacher: 0,
    missing_child_identity: 0,
  },
  actionCounts: {
    SAFE_CREATE_MISSING_SESSION: 2,
    SAFE_INITIALIZE_MATERIALIZATION: 1,
    SAFE_SYNC_MATERIALIZATION: 0,
    PRESERVE_EXCEPTION: 1,
    NO_ACTION: 6,
    BLOCK_INVALID_SOURCE: 0,
    BLOCK_IDENTITY_CONFLICT: 0,
    BLOCK_SCHEDULE_CONFLICT: 0,
    BLOCK_STALE_REVISION: 0,
    BLOCK_UNSAFE_SESSION_PAYLOAD: 0,
  },
  plans: [{
    enrollmentId: 'enr-safe',
    expectedOccurrences: 3,
    safeCreates: 2,
    exceptionsPreserved: 0,
    blockers: 0,
    metadataAction: 'INITIALIZE',
    actions: [
      {
        type: 'SAFE_CREATE_MISSING_SESSION',
        enrollmentId: 'enr-safe',
        sessionId: 's1',
        date: '2026-09-25',
        startTime: '10:00',
        durationMinutes: 35,
      },
      {
        type: 'SAFE_CREATE_MISSING_SESSION',
        enrollmentId: 'enr-safe',
        sessionId: 's2',
        date: '2026-10-02',
        startTime: '10:00',
        durationMinutes: 35,
      },
      {
        type: 'SAFE_INITIALIZE_MATERIALIZATION',
        enrollmentId: 'enr-safe',
      },
    ],
  }],
  ...overrides,
});

describe('Brick 6 controlled repair rollout gate', () => {
  it('fails closed by default', () => {
    const gate = resolveControlledRepairWriteGate({});
    expect(gate.enabled).toBe(false);
    expect(gate.allowedEnrollmentIds).toEqual([]);
    expect(gate.configurationValid).toBe(true);

    expect(() =>
      assertControlledRepairLiveWriteAllowed('enr-safe', {}),
    ).toThrow(/live writes are disabled/i);
  });

  it('requires exactly one allowlisted pilot when live writes are enabled', () => {
    const missingPilot = resolveControlledRepairWriteGate({
      CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED: 'true',
    });
    expect(missingPilot.configurationValid).toBe(false);

    const tooMany = resolveControlledRepairWriteGate({
      CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED: 'true',
      CONTROLLED_SCHEDULE_REPAIR_ALLOWED_ENROLLMENTS: 'a,b',
    });
    expect(tooMany.configurationValid).toBe(false);

    const valid = resolveControlledRepairWriteGate({
      CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED: 'true',
      CONTROLLED_SCHEDULE_REPAIR_ALLOWED_ENROLLMENTS: 'enr-safe',
    });
    expect(valid.configurationValid).toBe(true);
    expect(valid.enabled).toBe(true);
    expect(valid.allowedEnrollmentIds).toEqual(['enr-safe']);
  });

  it('rejects a non-allowlisted enrollment even when the pilot gate is armed', () => {
    const env = {
      CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED: 'true',
      CONTROLLED_SCHEDULE_REPAIR_ALLOWED_ENROLLMENTS: 'enr-safe',
    };
    expect(() =>
      assertControlledRepairLiveWriteAllowed('enr-other', env),
    ).toThrow(/not the explicitly allowlisted/i);
    expect(
      assertControlledRepairLiveWriteAllowed('enr-safe', env).enabled,
    ).toBe(true);
  });
});

describe('Brick 6 read-only rollout certification', () => {
  it('reports a safe future candidate while keeping the live-write gate disabled', () => {
    const result = buildControlledRepairRolloutCertification({
      integrity: integrity(),
      planner: planner(),
      gate: resolveControlledRepairWriteGate({}),
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });

    expect(result.mode).toBe('READ_ONLY_ROLLOUT_CERTIFICATION');
    expect(result.writesPerformed).toBe(false);
    expect(result.certificationState).toBe(
      'READY_FOR_EXPLICIT_PILOT_SELECTION',
    );
    expect(result.pilotEligibleEnrollments).toBe(1);
    expect(result.pilotCandidates[0].enrollmentId).toBe('enr-safe');
    expect(result.pilotCandidates[0].safeCreateSessions).toBe(2);
    expect(result.liveWriteGate.enabled).toBe(false);
  });

  it('removes a plan from pilot eligibility when execution hardening detects a past-due occurrence', () => {
    const p = planner();
    p.plans[0].actions[0] = {
      type: 'SAFE_CREATE_MISSING_SESSION',
      enrollmentId: 'enr-safe',
      sessionId: 's1',
      date: '2026-09-18',
      startTime: '10:00',
      durationMinutes: 35,
    };

    const result = buildControlledRepairRolloutCertification({
      integrity: integrity(),
      planner: p,
      gate: resolveControlledRepairWriteGate({}),
      nowMs: Date.UTC(2026, 8, 18, 10, 0, 0),
    });

    expect(result.pilotEligibleEnrollments).toBe(0);
    expect(result.certificationState).toBe('NO_SAFE_PILOT_CANDIDATE');
    expect(result.blockerSummary.pastDueHardenedEnrollments).toBe(1);
  });

  it('reports when the live-write gate is armed without performing writes', () => {
    const result = buildControlledRepairRolloutCertification({
      integrity: integrity(),
      planner: planner(),
      gate: resolveControlledRepairWriteGate({
        CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED: 'true',
        CONTROLLED_SCHEDULE_REPAIR_ALLOWED_ENROLLMENTS: 'enr-safe',
      }),
      nowMs: Date.UTC(2026, 8, 18, 0, 0, 0),
    });

    expect(result.certificationState).toBe('LIVE_WRITE_GATE_ARMED');
    expect(result.writesPerformed).toBe(false);
    expect(result.liveWriteGate.allowedEnrollmentIds).toEqual(['enr-safe']);
  });
});
