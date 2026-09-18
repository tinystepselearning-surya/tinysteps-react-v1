/**
 * Brick 3: automatic shadow schedule guard.
 *
 * This scheduled function is observation-only. It reuses the Brick 2 integrity engine,
 * performs no repair/self-heal, and never writes enrollment/session/finance state.
 */
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {
  FirestoreScheduleIntegrityStore,
  MAX_SCHEDULE_INTEGRITY_ENROLLMENTS,
  runScheduleIntegrityEngineWithStore,
  type ScheduleIntegritySummary,
} from '../scheduling/scheduleIntegrityEngine';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const SHADOW_SCHEDULE_GUARD_REGION = 'asia-south1';
export const SHADOW_SCHEDULE_GUARD_TIME_ZONE = 'Asia/Kolkata';
export const SHADOW_SCHEDULE_GUARD_SCHEDULE = '0 */6 * * *';
export const SHADOW_SCHEDULE_GUARD_MAX_ENROLLMENTS =
  MAX_SCHEDULE_INTEGRITY_ENROLLMENTS;
export const SHADOW_SCHEDULE_GUARD_MAX_LOG_IDS = 25;
export const SHADOW_SCHEDULE_GUARD_NOTIFICATIONS_ENABLED = false;

export type ShadowScheduleGuardSeverity =
  | 'healthy'
  | 'warning'
  | 'critical';

export type ShadowScheduleGuardAssessment = {
  shadowMode: true;
  autoRepairEnabled: false;
  severity: ShadowScheduleGuardSeverity;
  reasons: string[];
  operationalEnrollments: number;
  eligibleEnrollments: number;
  invalidEnrollments: number;
  expectedOccurrences: number;
  coveredOccurrences: number;
  missingOccurrences: number;
  missingToday: number;
  identityMismatches: number;
  scheduleMismatches: number;
  staleRevisionOccurrences: number;
  duplicateRegularSessions: number;
  unexpectedRegularSessions: number;
  zeroCoveredEnrollments: number;
  enrollmentsMissingMaterializationMetadata: number;
  affectedEnrollmentIds: string[];
  invalidEnrollmentIds: string[];
};

const dedupe = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean)));

export function buildShadowScheduleGuardAssessment(
  summary: ScheduleIntegritySummary,
): ShadowScheduleGuardAssessment {
  const reasons: string[] = [];

  if (summary.missingToday > 0) {
    reasons.push('missing_today');
  }
  if (summary.zeroCoveredEnrollments > 0) {
    reasons.push('zero_covered_enrollment');
  }
  if (summary.missingOccurrences > 0) {
    reasons.push('missing_occurrence');
  }
  if (summary.identityMismatches > 0) {
    reasons.push('identity_mismatch');
  }
  if (summary.scheduleMismatches > 0) {
    reasons.push('schedule_mismatch');
  }
  if (summary.staleRevisionOccurrences > 0) {
    reasons.push('stale_revision');
  }
  if (summary.duplicateRegularSessions > 0) {
    reasons.push('duplicate_regular_session');
  }
  if (summary.unexpectedRegularSessions > 0) {
    reasons.push('unexpected_regular_session');
  }
  if (summary.invalidEnrollments > 0) {
    reasons.push('invalid_enrollment_source');
  }
  if (summary.enrollmentsMissingMaterializationMetadata > 0) {
    reasons.push('missing_materialization_metadata');
  }

  const critical =
    summary.missingToday > 0 ||
    summary.zeroCoveredEnrollments > 0;

  const warning =
    summary.missingOccurrences > 0 ||
    summary.identityMismatches > 0 ||
    summary.scheduleMismatches > 0 ||
    summary.staleRevisionOccurrences > 0 ||
    summary.duplicateRegularSessions > 0 ||
    summary.unexpectedRegularSessions > 0 ||
    summary.invalidEnrollments > 0 ||
    summary.enrollmentsMissingMaterializationMetadata > 0;

  const severity: ShadowScheduleGuardSeverity =
    critical ? 'critical' : warning ? 'warning' : 'healthy';

  const affectedEnrollmentIds = dedupe(
    summary.details.map((row) => row.enrollmentId),
  ).slice(0, SHADOW_SCHEDULE_GUARD_MAX_LOG_IDS);
  const invalidEnrollmentIds = dedupe(
    summary.invalidDetails.map((row) => row.enrollmentId),
  ).slice(0, SHADOW_SCHEDULE_GUARD_MAX_LOG_IDS);

  return {
    shadowMode: true,
    autoRepairEnabled: false,
    severity,
    reasons,
    operationalEnrollments: summary.operationalEnrollments,
    eligibleEnrollments: summary.eligibleEnrollments,
    invalidEnrollments: summary.invalidEnrollments,
    expectedOccurrences: summary.expectedOccurrences,
    coveredOccurrences:
      summary.healthyOccurrences +
      summary.scheduleExceptions +
      summary.staleRevisionOccurrences,
    missingOccurrences: summary.missingOccurrences,
    missingToday: summary.missingToday,
    identityMismatches: summary.identityMismatches,
    scheduleMismatches: summary.scheduleMismatches,
    staleRevisionOccurrences: summary.staleRevisionOccurrences,
    duplicateRegularSessions: summary.duplicateRegularSessions,
    unexpectedRegularSessions: summary.unexpectedRegularSessions,
    zeroCoveredEnrollments: summary.zeroCoveredEnrollments,
    enrollmentsMissingMaterializationMetadata:
      summary.enrollmentsMissingMaterializationMetadata,
    affectedEnrollmentIds,
    invalidEnrollmentIds,
  };
}

export async function runShadowScheduleGuard(
  db: admin.firestore.Firestore,
): Promise<{
  summary: ScheduleIntegritySummary;
  assessment: ShadowScheduleGuardAssessment;
}> {
  const summary = await runScheduleIntegrityEngineWithStore(
    new FirestoreScheduleIntegrityStore(db),
    {maxEnrollments: SHADOW_SCHEDULE_GUARD_MAX_ENROLLMENTS},
  );
  return {
    summary,
    assessment: buildShadowScheduleGuardAssessment(summary),
  };
}

export const shadowScheduleGuardEverySixHours = onSchedule(
  {
    schedule: SHADOW_SCHEDULE_GUARD_SCHEDULE,
    timeZone: SHADOW_SCHEDULE_GUARD_TIME_ZONE,
    region: SHADOW_SCHEDULE_GUARD_REGION,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    try {
      const {summary, assessment} = await runShadowScheduleGuard(
        admin.firestore(),
      );
      const logPayload = {
        ...assessment,
        anchorYmd: summary.anchorYmd,
        horizonEndYmd: summary.horizonEndYmd,
        schedule: SHADOW_SCHEDULE_GUARD_SCHEDULE,
        timeZone: SHADOW_SCHEDULE_GUARD_TIME_ZONE,
      };

      if (assessment.severity === 'critical') {
        logger.error(
          'shadowScheduleGuard: critical schedule integrity defects observed',
          logPayload,
        );
        return;
      }
      if (assessment.severity === 'warning') {
        logger.warn(
          'shadowScheduleGuard: schedule integrity warnings observed',
          logPayload,
        );
        return;
      }
      logger.info('shadowScheduleGuard: schedule integrity healthy', logPayload);
    } catch (error) {
      logger.error('shadowScheduleGuard: integrity scan failed', {
        shadowMode: true,
        autoRepairEnabled: false,
        schedule: SHADOW_SCHEDULE_GUARD_SCHEDULE,
        timeZone: SHADOW_SCHEDULE_GUARD_TIME_ZONE,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);
