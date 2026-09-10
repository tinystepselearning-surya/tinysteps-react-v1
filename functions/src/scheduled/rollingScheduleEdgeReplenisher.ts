import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {
  MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN,
  buildRollingScheduleDueEdgePlan,
  materializeRollingDueEdgePlanWithStore,
} from '../scheduling/rollingScheduleEdgeWorker';
import {createFirestoreRollingScheduleMaterializerStore} from '../scheduling/rollingScheduleMaterializer';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const ROLLING_EDGE_REPLENISHER_REGION = 'asia-south1';
export const ROLLING_EDGE_REPLENISHER_TIME_ZONE = 'Asia/Kolkata';
export const ROLLING_EDGE_REPLENISHER_SCHEDULE = '15 0 * * *';
export const MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN = 500;
export const MAX_ROLLING_EDGE_SESSION_CANDIDATES_PER_RUN = 750;

const IST_OFFSET_MINUTES = 330;

export type RollingScheduleEdgeWorkerSummary = {
  todayYmd: string;
  dueEnrollmentsRead: number;
  processedEnrollments: number;
  failedEnrollments: number;
  skippedForSessionBudget: number;
  edgeDatesProcessed: number;
  sessionCandidates: number;
  existingSessionsPreserved: number;
  sessionsCreated: number;
  createRacesPreserved: number;
  metadataUpdates: number;
  enrollmentsWithCatchupBacklog: number;
  enrollmentQueryLimitReached: boolean;
  sessionCandidateBudgetReached: boolean;
  failedEnrollmentIds: string[];
};

function toIndiaYmd(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveRollingEdgeWorkerTodayYmd(now = new Date()): string {
  return toIndiaYmd(now);
}

export async function runRollingScheduleEdgeReplenisher(
  db: admin.firestore.Firestore,
  args: {todayYmd?: string; dryRun?: boolean} = {},
): Promise<RollingScheduleEdgeWorkerSummary> {
  const todayYmd = args.todayYmd || resolveRollingEdgeWorkerTodayYmd();

  // Brick 4's only enrollment discovery read is the due pointer. The query is
  // bounded and ordered oldest-first so delayed work is drained before newer
  // due dates. It does not inspect classSessions to discover work.
  const dueSnap = await db
    .collection('enrollments')
    .where('scheduleMaterialization.nextMaterializationDueYmd', '<=', todayYmd)
    .orderBy('scheduleMaterialization.nextMaterializationDueYmd', 'asc')
    .limit(MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN)
    .get();

  const store = createFirestoreRollingScheduleMaterializerStore(db);
  const summary: RollingScheduleEdgeWorkerSummary = {
    todayYmd,
    dueEnrollmentsRead: dueSnap.size,
    processedEnrollments: 0,
    failedEnrollments: 0,
    skippedForSessionBudget: 0,
    edgeDatesProcessed: 0,
    sessionCandidates: 0,
    existingSessionsPreserved: 0,
    sessionsCreated: 0,
    createRacesPreserved: 0,
    metadataUpdates: 0,
    enrollmentsWithCatchupBacklog: 0,
    enrollmentQueryLimitReached: dueSnap.size >= MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN,
    sessionCandidateBudgetReached: false,
    failedEnrollmentIds: [],
  };

  for (let index = 0; index < dueSnap.docs.length; index += 1) {
    const enrollmentDoc = dueSnap.docs[index];
    const enrollmentId = enrollmentDoc.id;
    const enrollment = enrollmentDoc.data() as Record<string, unknown>;

    try {
      const plan = buildRollingScheduleDueEdgePlan({
        enrollmentId,
        enrollment,
        todayYmd,
      });
      if (!plan.isDue) continue;

      if (plan.occurrences.length > MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN) {
        throw new Error('Per-enrollment rolling edge occurrence safety cap was exceeded');
      }

      if (
        summary.sessionCandidates + plan.occurrences.length >
        MAX_ROLLING_EDGE_SESSION_CANDIDATES_PER_RUN
      ) {
        summary.sessionCandidateBudgetReached = true;
        summary.skippedForSessionBudget = dueSnap.docs.length - index;
        break;
      }

      const result = await materializeRollingDueEdgePlanWithStore(store, {
        enrollment,
        plan,
        actorId: 'system:rolling_schedule_edge_worker',
        dryRun: args.dryRun,
      });

      summary.processedEnrollments += 1;
      summary.edgeDatesProcessed += result.edgeDates.length;
      summary.sessionCandidates += result.expectedCount;
      summary.existingSessionsPreserved += result.existingCount;
      summary.sessionsCreated += result.createdCount;
      summary.createRacesPreserved += result.raceAlreadyExistsCount;
      if (result.metadataUpdated) summary.metadataUpdates += 1;
      if (result.backlogRemaining) summary.enrollmentsWithCatchupBacklog += 1;
    } catch (error) {
      summary.failedEnrollments += 1;
      summary.failedEnrollmentIds.push(enrollmentId);
      logger.error('rollingScheduleEdgeReplenisher: enrollment failed closed', {
        enrollmentId,
        todayYmd,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}

export const rollingScheduleEdgeReplenisherDaily = onSchedule(
  {
    schedule: ROLLING_EDGE_REPLENISHER_SCHEDULE,
    timeZone: ROLLING_EDGE_REPLENISHER_TIME_ZONE,
    region: ROLLING_EDGE_REPLENISHER_REGION,
    memory: '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const summary = await runRollingScheduleEdgeReplenisher(admin.firestore());
    const logPayload = {
      ...summary,
      schedule: ROLLING_EDGE_REPLENISHER_SCHEDULE,
      timeZone: ROLLING_EDGE_REPLENISHER_TIME_ZONE,
    };

    if (summary.failedEnrollments > 0 || summary.sessionCandidateBudgetReached) {
      logger.warn('rollingScheduleEdgeReplenisher: completed with deferred or failed work', logPayload);
      return;
    }
    logger.info('rollingScheduleEdgeReplenisher: completed', logPayload);
  },
);
