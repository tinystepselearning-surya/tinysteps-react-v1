/**
 * Brick 6: read-only controlled rollout certification.
 *
 * This callable does not mutate Firestore. It combines the pointer-independent
 * integrity scan, Brick 4 repair plan, Brick 5 execution hardening, and the
 * server-side live-write gate into one rollout-readiness report.
 */
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {
  FirestoreScheduleIntegrityStore,
  runScheduleIntegrityEngineWithStore,
  type ScheduleIntegritySummary,
} from './scheduleIntegrityEngine';
import {
  runSafeRepairPlannerWithStore,
  type SafeRepairPlannerSummary,
} from './safeRepairPlanner';
import {
  hardenSafeRepairPlanForExecution,
  fingerprintControlledRepairPlan,
  type ControlledRepairEnrollmentPlan,
} from './controlledRepairExecutor';
import {
  resolveControlledRepairWriteGate,
  type ControlledRepairWriteGateState,
} from './controlledRepairRolloutGate';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const CONTROLLED_REPAIR_CERTIFICATION_REGION = 'asia-south1';
export const CONTROLLED_REPAIR_CERTIFICATION_MAX_CANDIDATES = 50;

export type ControlledRepairCertificationCandidate = {
  enrollmentId: string;
  safeCreateSessions: number;
  metadataAction: ControlledRepairEnrollmentPlan['metadataAction'];
  exceptionsPreserved: number;
  planFingerprint: string;
};

export type ControlledRepairCertificationState =
  | 'READY_FOR_EXPLICIT_PILOT_SELECTION'
  | 'NO_SAFE_PILOT_CANDIDATE'
  | 'LIVE_WRITE_GATE_ARMED';

export type ControlledRepairRolloutCertification = {
  mode: 'READ_ONLY_ROLLOUT_CERTIFICATION';
  writesPerformed: false;
  anchorYmd: string;
  horizonEndYmd: string;
  certificationState: ControlledRepairCertificationState;
  liveWriteGate: ControlledRepairWriteGateState;
  operationalEnrollments: number;
  eligibleEnrollments: number;
  invalidEnrollments: number;
  expectedOccurrences: number;
  healthyOccurrences: number;
  scheduleExceptions: number;
  missingOccurrences: number;
  missingToday: number;
  identityMismatches: number;
  scheduleMismatches: number;
  staleRevisionOccurrences: number;
  zeroCoveredEnrollments: number;
  missingMaterializationMetadata: number;
  plannerSafeCreateSessions: number;
  plannerMetadataInitializations: number;
  plannerMetadataSynchronizations: number;
  plannerBlockedEnrollments: number;
  pilotEligibleEnrollments: number;
  pilotCandidates: ControlledRepairCertificationCandidate[];
  blockerSummary: {
    invalidEnrollments: number;
    plannerBlockedEnrollments: number;
    pastDueHardenedEnrollments: number;
  };
};

export function buildControlledRepairRolloutCertification(args: {
  integrity: ScheduleIntegritySummary;
  planner: SafeRepairPlannerSummary;
  gate: ControlledRepairWriteGateState;
  nowMs?: number;
}): ControlledRepairRolloutCertification {
  const nowMs = args.nowMs ?? Date.now();
  const candidates: ControlledRepairCertificationCandidate[] = [];
  let pastDueHardenedEnrollments = 0;

  args.planner.plans.forEach((plan) => {
    const hardened = hardenSafeRepairPlanForExecution(plan, nowMs);
    const hadPastDueBlocker = hardened.actions.some(
      (action) => action.type === 'BLOCK_PAST_DUE_OCCURRENCE',
    );
    if (hadPastDueBlocker) pastDueHardenedEnrollments += 1;

    const actionable =
      hardened.safeCreates > 0 ||
      hardened.metadataAction === 'INITIALIZE' ||
      hardened.metadataAction === 'SYNC';

    if (hardened.blockers === 0 && actionable) {
      candidates.push({
        enrollmentId: hardened.enrollmentId,
        safeCreateSessions: hardened.safeCreates,
        metadataAction: hardened.metadataAction,
        exceptionsPreserved: hardened.exceptionsPreserved,
        planFingerprint: fingerprintControlledRepairPlan(hardened),
      });
    }
  });

  candidates.sort((left, right) =>
    left.enrollmentId.localeCompare(right.enrollmentId),
  );

  const certificationState: ControlledRepairCertificationState =
    args.gate.enabled
      ? 'LIVE_WRITE_GATE_ARMED'
      : candidates.length > 0
        ? 'READY_FOR_EXPLICIT_PILOT_SELECTION'
        : 'NO_SAFE_PILOT_CANDIDATE';

  return {
    mode: 'READ_ONLY_ROLLOUT_CERTIFICATION',
    writesPerformed: false,
    anchorYmd: args.integrity.anchorYmd,
    horizonEndYmd: args.integrity.horizonEndYmd,
    certificationState,
    liveWriteGate: args.gate,
    operationalEnrollments: args.integrity.operationalEnrollments,
    eligibleEnrollments: args.integrity.eligibleEnrollments,
    invalidEnrollments: args.integrity.invalidEnrollments,
    expectedOccurrences: args.integrity.expectedOccurrences,
    healthyOccurrences: args.integrity.healthyOccurrences,
    scheduleExceptions: args.integrity.scheduleExceptions,
    missingOccurrences: args.integrity.missingOccurrences,
    missingToday: args.integrity.missingToday,
    identityMismatches: args.integrity.identityMismatches,
    scheduleMismatches: args.integrity.scheduleMismatches,
    staleRevisionOccurrences: args.integrity.staleRevisionOccurrences,
    zeroCoveredEnrollments: args.integrity.zeroCoveredEnrollments,
    missingMaterializationMetadata:
      args.integrity.enrollmentsMissingMaterializationMetadata,
    plannerSafeCreateSessions: args.planner.safeCreateSessions,
    plannerMetadataInitializations: args.planner.metadataInitializations,
    plannerMetadataSynchronizations: args.planner.metadataSynchronizations,
    plannerBlockedEnrollments: args.planner.blockedEnrollments,
    pilotEligibleEnrollments: candidates.length,
    pilotCandidates: candidates.slice(
      0,
      CONTROLLED_REPAIR_CERTIFICATION_MAX_CANDIDATES,
    ),
    blockerSummary: {
      invalidEnrollments: args.integrity.invalidEnrollments,
      plannerBlockedEnrollments: args.planner.blockedEnrollments,
      pastDueHardenedEnrollments,
    },
  };
}

export async function runControlledRepairRolloutCertification(
  db: admin.firestore.Firestore,
  input: {anchorYmd?: string; maxEnrollments?: number} = {},
): Promise<ControlledRepairRolloutCertification> {
  const store = new FirestoreScheduleIntegrityStore(db);
  const [integrity, planner] = await Promise.all([
    runScheduleIntegrityEngineWithStore(store, input),
    runSafeRepairPlannerWithStore(store, input),
  ]);

  return buildControlledRepairRolloutCertification({
    integrity,
    planner,
    gate: resolveControlledRepairWriteGate(),
  });
}

export const adminCertifyControlledScheduleRepairRollout = onCall(
  {
    region: CONTROLLED_REPAIR_CERTIFICATION_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);
    const certification = await runControlledRepairRolloutCertification(
      admin.firestore(),
      (request.data || {}) as {
        anchorYmd?: string;
        maxEnrollments?: number;
      },
    );

    logger.info('controlledRepairRolloutCertification: read-only certification complete', {
      anchorYmd: certification.anchorYmd,
      horizonEndYmd: certification.horizonEndYmd,
      certificationState: certification.certificationState,
      operationalEnrollments: certification.operationalEnrollments,
      missingOccurrences: certification.missingOccurrences,
      missingToday: certification.missingToday,
      zeroCoveredEnrollments: certification.zeroCoveredEnrollments,
      pilotEligibleEnrollments: certification.pilotEligibleEnrollments,
      liveWriteGateEnabled: certification.liveWriteGate.enabled,
      liveWriteGateConfigurationValid:
        certification.liveWriteGate.configurationValid,
      writesPerformed: certification.writesPerformed,
    });

    return certification;
  },
);
