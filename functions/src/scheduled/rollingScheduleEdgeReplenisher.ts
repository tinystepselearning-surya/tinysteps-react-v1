import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {FieldValue} from 'firebase-admin/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {
  MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN,
  buildRollingScheduleDueEdgePlan,
} from '../scheduling/rollingScheduleEdgeWorker';
import {
  buildRollingScheduledSessionPayload,
  type RollingScheduleMaterializationState,
} from '../scheduling/rollingScheduleMaterializer';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const ROLLING_EDGE_REPLENISHER_REGION = 'asia-south1';
export const ROLLING_EDGE_REPLENISHER_TIME_ZONE = 'Asia/Kolkata';
export const ROLLING_EDGE_REPLENISHER_SCHEDULE = '15 0 * * *';
export const MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN = 500;
export const MAX_ROLLING_EDGE_SESSION_CANDIDATES_PER_RUN = 750;

const IST_OFFSET_MINUTES = 330;
const WORKER_ACTOR = 'system:rolling_schedule_edge_worker';

class RollingEdgeSessionBudgetExceededError extends Error {
  constructor() {
    super('Rolling schedule session candidate budget exhausted');
    this.name = 'RollingEdgeSessionBudgetExceededError';
  }
}

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

type TransactionalEdgeResult = {
  edgeDates: string[];
  expectedCount: number;
  existingCount: number;
  createdCount: number;
  metadataUpdated: boolean;
  backlogRemaining: boolean;
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

function buildMaterializationPatch(materialization: RollingScheduleMaterializationState) {
  return {
    'scheduleMaterialization.schemaVersion': materialization.schemaVersion,
    'scheduleMaterialization.horizonDays': materialization.horizonDays,
    'scheduleMaterialization.scheduleRevision': materialization.scheduleRevision,
    'scheduleMaterialization.materializedThroughYmd': materialization.materializedThroughYmd,
    'scheduleMaterialization.nextOccurrenceYmd': materialization.nextOccurrenceYmd,
    'scheduleMaterialization.nextMaterializationDueYmd': materialization.nextMaterializationDueYmd,
    'scheduleMaterialization.updatedAt': FieldValue.serverTimestamp(),
    'scheduleMaterialization.updatedBy': WORKER_ACTOR,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: WORKER_ACTOR,
  };
}

/**
 * Atomically re-reads the enrollment, validates its current lifecycle/revision/pointer,
 * reads the exact deterministic edge session IDs, creates only missing sessions, and
 * advances the pointer in one Firestore transaction.
 *
 * Any concurrent Pause, Discontinue, or schedule edit mutates the enrollment document.
 * Firestore then retries this transaction against the new document version; the rebuilt
 * due-edge plan either reflects the new schedule or fails closed because the enrollment
 * is no longer operational. A stale worker therefore cannot commit sessions or a pointer
 * after a lifecycle/revision change.
 */
export async function materializeRollingDueEdgeTransaction(
  db: admin.firestore.Firestore,
  args: {
    enrollmentId: string;
    todayYmd: string;
    remainingSessionBudget: number;
    dryRun?: boolean;
  },
): Promise<TransactionalEdgeResult | null> {
  const enrollmentRef = db.collection('enrollments').doc(args.enrollmentId);

  return db.runTransaction(async (tx) => {
    const enrollmentSnap = await tx.get(enrollmentRef);
    if (!enrollmentSnap.exists) return null;
    const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;

    const plan = buildRollingScheduleDueEdgePlan({
      enrollmentId: args.enrollmentId,
      enrollment,
      todayYmd: args.todayYmd,
    });
    if (!plan.isDue) return null;

    if (plan.occurrences.length > MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN) {
      throw new Error('Per-enrollment rolling edge occurrence safety cap was exceeded');
    }
    if (plan.occurrences.length > args.remainingSessionBudget) {
      throw new RollingEdgeSessionBudgetExceededError();
    }

    const sessionRefs = plan.occurrences.map((occurrence) =>
      db.collection('classSessions').doc(occurrence.sessionId),
    );
    // All reads precede all writes. Reading the enrollment and deterministic session
    // documents in this transaction supplies the compare-and-set fence for both the
    // lifecycle/revision token and every candidate session identity.
    const sessionSnaps = await Promise.all(sessionRefs.map((ref) => tx.get(ref)));
    const existingIds = new Set(
      sessionSnaps.filter((snap) => snap.exists).map((snap) => snap.id),
    );
    const missingOccurrences = plan.occurrences.filter(
      (occurrence) => !existingIds.has(occurrence.sessionId),
    );

    // Build all payloads before the first write. Missing/invalid financial terms fail
    // the transaction without partially creating sessions or advancing the pointer.
    const preparedCreates = missingOccurrences.map((occurrence) => ({
      occurrence,
      payload: buildRollingScheduledSessionPayload({
        enrollmentId: args.enrollmentId,
        enrollment,
        occurrence,
        scheduleRevision: plan.scheduleRevision,
        actorId: WORKER_ACTOR,
      }),
    }));

    if (args.dryRun) {
      return {
        edgeDates: [...plan.edgeDates],
        expectedCount: plan.occurrences.length,
        existingCount: existingIds.size,
        createdCount: 0,
        metadataUpdated: false,
        backlogRemaining: plan.backlogRemaining,
      };
    }

    preparedCreates.forEach(({occurrence, payload}) => {
      tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload);
    });
    tx.update(enrollmentRef, buildMaterializationPatch(plan.finalMaterialization));

    return {
      edgeDates: [...plan.edgeDates],
      expectedCount: plan.occurrences.length,
      existingCount: existingIds.size,
      createdCount: preparedCreates.length,
      metadataUpdated: true,
      backlogRemaining: plan.backlogRemaining,
    };
  });
}

export async function runRollingScheduleEdgeReplenisher(
  db: admin.firestore.Firestore,
  args: {todayYmd?: string; dryRun?: boolean} = {},
): Promise<RollingScheduleEdgeWorkerSummary> {
  const todayYmd = args.todayYmd || resolveRollingEdgeWorkerTodayYmd();

  // The only discovery read is the indexed due pointer. The query is bounded and
  // oldest-first; classSessions are never scanned to discover work.
  const dueSnap = await db
    .collection('enrollments')
    .where('scheduleMaterialization.nextMaterializationDueYmd', '<=', todayYmd)
    .orderBy('scheduleMaterialization.nextMaterializationDueYmd', 'asc')
    .limit(MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN)
    .get();

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
    // Transaction retries turn a concurrent deterministic create into an existing
    // document on the retry, so it is counted under existingSessionsPreserved.
    createRacesPreserved: 0,
    metadataUpdates: 0,
    enrollmentsWithCatchupBacklog: 0,
    enrollmentQueryLimitReached: dueSnap.size >= MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN,
    sessionCandidateBudgetReached: false,
    failedEnrollmentIds: [],
  };

  for (let index = 0; index < dueSnap.docs.length; index += 1) {
    const enrollmentId = dueSnap.docs[index].id;
    try {
      const result = await materializeRollingDueEdgeTransaction(db, {
        enrollmentId,
        todayYmd,
        remainingSessionBudget:
          MAX_ROLLING_EDGE_SESSION_CANDIDATES_PER_RUN - summary.sessionCandidates,
        dryRun: args.dryRun,
      });
      if (!result) continue;

      summary.processedEnrollments += 1;
      summary.edgeDatesProcessed += result.edgeDates.length;
      summary.sessionCandidates += result.expectedCount;
      summary.existingSessionsPreserved += result.existingCount;
      summary.sessionsCreated += result.createdCount;
      if (result.metadataUpdated) summary.metadataUpdates += 1;
      if (result.backlogRemaining) summary.enrollmentsWithCatchupBacklog += 1;
    } catch (error) {
      if (error instanceof RollingEdgeSessionBudgetExceededError) {
        summary.sessionCandidateBudgetReached = true;
        summary.skippedForSessionBudget = dueSnap.docs.length - index;
        break;
      }
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
