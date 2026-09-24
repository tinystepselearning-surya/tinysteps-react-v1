import * as admin from 'firebase-admin';
import {
  FieldPath,
  FieldValue,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Query,
} from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import {
  ForceFreshCaseRefreshError,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID,
  refreshAttendanceValidationCaseEvidence,
} from './forceFreshEvidenceCallable';
import {
  ATTENDANCE_VALIDATION_FORCE_FRESH_RUNS_COLLECTION,
  ATTENDANCE_VALIDATION_FORCE_FRESH_RUN_CASES_SUBCOLLECTION,
  AVS_FORCE_FRESH_RANGE_CONCURRENCY,
  AVS_FORCE_FRESH_RANGE_MAX_CASES,
  AVS_FORCE_FRESH_RANGE_QUERY_LIMIT,
  cleanAvsForceFreshRunId,
  forceFreshCounterDelta,
  forceFreshRangeBatchFromQueryRows,
  forceFreshRunStatus,
  mapWithConcurrency,
  normalizeAvsForceFreshRange,
  type AvsForceFreshRangeCursor,
  type AvsForceFreshTerminalStatus,
} from './forceFreshRangePlanner';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import {
  avsFailureHttpsError,
  avsFailureLogFields,
  classifyAvsFailure,
  classifyAvsReason,
  summarizeAvsFailures,
  type AvsFailureDescriptor,
} from './errorTaxonomy';
import {
  AvsOrganizerResolutionError,
  resolveAttendanceValidationOrganizerUserId,
} from './organizerConfig';
import { loadProductionStaffIdentityRegistry } from './staffIdentityRegistry';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const RUN_SCHEMA_VERSION = 2;
const CHECKPOINT_SCHEMA_VERSION = 1;

interface ForceFreshRunState {
  schemaVersion?: unknown;
  runId?: unknown;
  fromDate?: unknown;
  toDate?: unknown;
  status?: unknown;
  cursorDate?: unknown;
  cursorCaseId?: unknown;
  retryCursorCaseId?: unknown;
  retryPass?: unknown;
  processedCount?: unknown;
  attemptedCount?: unknown;
  refreshedCount?: unknown;
  skippedCount?: unknown;
  failedCount?: unknown;
  graphLogicalCalls?: unknown;
  identityMappingsWritten?: unknown;
  identityClaimsWritten?: unknown;
  remainingCases?: unknown;
  retryableFailureCount?: unknown;
  actionRequiredFailureCount?: unknown;
}

type RangeOutcome = {
  caseId: string;
  serviceDateYmd: string;
  status: AvsForceFreshTerminalStatus;
  graphLogicalCalls: number;
  identityMappingWritten: boolean;
  identityClaimWritten: boolean;
  failure: AvsFailureDescriptor | null;
};

type RangeItem = {
  id: string;
  serviceDateYmd: string;
  data: Record<string, unknown>;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function cursorFromState(
  state: ForceFreshRunState,
): AvsForceFreshRangeCursor | null {
  const serviceDateYmd = text(state.cursorDate);
  const caseId = text(state.cursorCaseId);
  return serviceDateYmd && caseId ? { serviceDateYmd, caseId } : null;
}

function graphClientFromSecrets(): MicrosoftGraphClient {
  return new MicrosoftGraphClient({
    credentials: {
      tenantId: MICROSOFT_TENANT_ID.value(),
      clientId: MICROSOFT_CLIENT_ID.value(),
      clientSecret: MICROSOFT_CLIENT_SECRET.value(),
    },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Invalid Force Fresh selected-range request.';
}

function runCasesCollection(
  runRef: DocumentReference<DocumentData>,
) {
  return runRef.collection(
    ATTENDANCE_VALIDATION_FORCE_FRESH_RUN_CASES_SUBCOLLECTION,
  );
}

function terminalCheckpointStatus(
  value: unknown,
): AvsForceFreshTerminalStatus | null {
  const status = text(value);
  return status === 'refreshed'
    || status === 'skipped'
    || status === 'failed'
    ? status
    : null;
}

async function loadOrCreateRun(params: {
  db: Firestore;
  range: { fromDate: string; toDate: string };
  requestedRunId: string | null;
  actorUid: string;
}) {
  const runs = params.db.collection(
    ATTENDANCE_VALIDATION_FORCE_FRESH_RUNS_COLLECTION,
  );
  const runRef = params.requestedRunId
    ? runs.doc(params.requestedRunId)
    : runs.doc();
  const runId = runRef.id;
  const snapshot = await runRef.get();

  if (snapshot.exists) {
    const state = (snapshot.data() || {}) as ForceFreshRunState;
    if (
      text(state.fromDate) !== params.range.fromDate
      || text(state.toDate) !== params.range.toDate
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Force Fresh generation belongs to a different date range.',
      );
    }
    return { runRef, runId, state, created: false };
  }

  const state: ForceFreshRunState = {
    schemaVersion: RUN_SCHEMA_VERSION,
    runId,
    fromDate: params.range.fromDate,
    toDate: params.range.toDate,
    status: 'in_progress',
    cursorDate: null,
    cursorCaseId: null,
    retryCursorCaseId: null,
    retryPass: 0,
    processedCount: 0,
    attemptedCount: 0,
    refreshedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    graphLogicalCalls: 0,
    identityMappingsWritten: 0,
    identityClaimsWritten: 0,
    remainingCases: 0,
    retryableFailureCount: 0,
    actionRequiredFailureCount: 0,
  };

  try {
    await runRef.create({
      ...state,
      concurrency: AVS_FORCE_FRESH_RANGE_CONCURRENCY,
      maxCasesPerInvocation: AVS_FORCE_FRESH_RANGE_MAX_CASES,
      createdBy: params.actorUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      operationalMutationAllowed: false,
    });
    return { runRef, runId, state, created: true };
  } catch (error) {
    // A retry can race only with the same explicit generation id. maxInstances=1
    // already serializes normal execution, but re-read keeps this idempotent.
    const raced = await runRef.get();
    if (!raced.exists) throw error;
    const racedState = (raced.data() || {}) as ForceFreshRunState;
    if (
      text(racedState.fromDate) !== params.range.fromDate
      || text(racedState.toDate) !== params.range.toDate
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Force Fresh generation belongs to a different date range.',
      );
    }
    return { runRef, runId, state: racedState, created: false };
  }
}

async function terminalCheckpointIdsForRows(
  db: Firestore,
  runRef: DocumentReference<DocumentData>,
  rows: readonly RangeItem[],
): Promise<Set<string>> {
  if (rows.length === 0) return new Set();
  const refs = rows.map((row) => runCasesCollection(runRef).doc(row.id));
  const snapshots = await db.getAll(...refs);
  return new Set(
    snapshots
      .filter((snapshot) =>
        snapshot.exists
        && terminalCheckpointStatus(snapshot.data()?.status) !== null)
      .map((snapshot) => snapshot.id),
  );
}

async function persistOutcome(params: {
  db: Firestore;
  runRef: DocumentReference<DocumentData>;
  outcome: RangeOutcome;
}) {
  const checkpointRef = runCasesCollection(params.runRef)
    .doc(params.outcome.caseId);

  await params.db.runTransaction(async (transaction) => {
    const checkpointSnapshot = await transaction.get(checkpointRef);
    const checkpointData = checkpointSnapshot.exists
      ? (checkpointSnapshot.data() || {}) as Record<string, unknown>
      : {};
    const previousStatus = terminalCheckpointStatus(checkpointData.status);
    const delta = forceFreshCounterDelta(
      previousStatus,
      params.outcome.status,
    );
    const previousAttempts = count(checkpointData.attemptCount);
    const previousFailed = previousStatus === 'failed';
    const previousRetryable =
      previousFailed && checkpointData.retryable === true;
    const nextFailed = params.outcome.status === 'failed';
    const nextRetryable =
      nextFailed && params.outcome.failure?.retryable === true;
    const retryableFailureDelta =
      Number(nextRetryable) - Number(previousRetryable);
    const actionRequiredFailureDelta =
      Number(nextFailed && !nextRetryable)
      - Number(previousFailed && !previousRetryable);

    transaction.set(checkpointRef, {
      schemaVersion: CHECKPOINT_SCHEMA_VERSION,
      runId: params.runRef.id,
      caseId: params.outcome.caseId,
      serviceDateYmd: params.outcome.serviceDateYmd,
      status: params.outcome.status,
      attemptCount: previousAttempts + 1,
      lastGraphLogicalCalls: params.outcome.graphLogicalCalls,
      lastErrorKind: params.outcome.failure?.code ?? null,
      failureCode: params.outcome.failure?.code ?? null,
      failureCategory: params.outcome.failure?.category ?? null,
      retryDisposition: params.outcome.failure?.retryDisposition ?? null,
      retryable: params.outcome.failure?.retryable ?? false,
      operatorAction: params.outcome.failure?.operatorAction ?? null,
      identityMappingWritten: params.outcome.identityMappingWritten,
      identityClaimWritten: params.outcome.identityClaimWritten,
      ...(checkpointSnapshot.exists
        ? {}
        : { createdAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
      operationalMutationAllowed: false,
    }, { merge: true });

    transaction.set(params.runRef, {
      attemptedCount: FieldValue.increment(1),
      processedCount: FieldValue.increment(delta.processedCount),
      refreshedCount: FieldValue.increment(delta.refreshedCount),
      skippedCount: FieldValue.increment(delta.skippedCount),
      failedCount: FieldValue.increment(delta.failedCount),
      retryableFailureCount:
        FieldValue.increment(retryableFailureDelta),
      actionRequiredFailureCount:
        FieldValue.increment(actionRequiredFailureDelta),
      graphLogicalCalls:
        FieldValue.increment(params.outcome.graphLogicalCalls),
      identityMappingsWritten: FieldValue.increment(
        params.outcome.identityMappingWritten ? 1 : 0,
      ),
      identityClaimsWritten: FieldValue.increment(
        params.outcome.identityClaimWritten ? 1 : 0,
      ),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

async function processItems(params: {
  db: Firestore;
  runRef: DocumentReference<DocumentData>;
  items: readonly RangeItem[];
}) {
  const hasEligibleCase = params.items.some((item) =>
    text(item.data.classSessionId) === item.id
    && Boolean(text(item.data.evidenceId)));

  let organizerResolution = null;
  if (hasEligibleCase) {
    try {
      organizerResolution =
        await resolveAttendanceValidationOrganizerUserId(params.db);
    } catch (error) {
      if (error instanceof AvsOrganizerResolutionError) {
        throw avsFailureHttpsError(classifyAvsReason(error.reason));
      }
      throw error;
    }
  }

  const graphClient = hasEligibleCase ? graphClientFromSecrets() : null;
  const staffRegistry = hasEligibleCase
    ? await loadProductionStaffIdentityRegistry(params.db)
    : null;

  return mapWithConcurrency(
    params.items,
    AVS_FORCE_FRESH_RANGE_CONCURRENCY,
    async (item): Promise<RangeOutcome> => {
      let outcome: RangeOutcome;

      if (
        text(item.data.classSessionId) !== item.id
        || !text(item.data.evidenceId)
      ) {
        outcome = {
          caseId: item.id,
          serviceDateYmd: item.serviceDateYmd,
          status: 'skipped',
          graphLogicalCalls: 0,
          identityMappingWritten: false,
          identityClaimWritten: false,
          failure: null,
        };
      } else {
        try {
          const result = await refreshAttendanceValidationCaseEvidence({
            db: params.db,
            caseId: item.id,
            organizerResolution: organizerResolution!,
            graphClient: graphClient!,
            staffRegistry: staffRegistry!,
          });
          outcome = {
            caseId: item.id,
            serviceDateYmd: item.serviceDateYmd,
            status: 'refreshed',
            graphLogicalCalls: result.graphLogicalCalls,
            identityMappingWritten:
              result.teacherIdentityMappingWritten,
            identityClaimWritten:
              result.teacherIdentityClaimWritten,
            failure: null,
          };
        } catch (error) {
          const failure = classifyAvsFailure(error);
          outcome = {
            caseId: item.id,
            serviceDateYmd: item.serviceDateYmd,
            status: 'failed',
            graphLogicalCalls:
              error instanceof ForceFreshCaseRefreshError
                ? error.graphLogicalCalls
                : 0,
            identityMappingWritten: false,
            identityClaimWritten: false,
            failure,
          };
          logger.error('AVS Teams re-fetch generation case failed', {
            runId: params.runRef.id,
            caseId: item.id,
            ...avsFailureLogFields(failure),
          });
        }
      }

      // The terminal checkpoint is committed before the discovery/retry cursor
      // advances. A timeout can therefore repeat only work that never reached a
      // terminal checkpoint.
      await persistOutcome({
        db: params.db,
        runRef: params.runRef,
        outcome,
      });
      return outcome;
    },
  );
}

async function remainingCasesAfterCursor(params: {
  db: Firestore;
  range: { fromDate: string; toDate: string };
  cursor: AvsForceFreshRangeCursor | null;
  hasMore: boolean;
}): Promise<number> {
  if (!params.cursor || !params.hasMore) return 0;

  const snapshot = await params.db
    .collection('attendanceValidationCases')
    .where('serviceDateYmd', '>=', params.range.fromDate)
    .where('serviceDateYmd', '<=', params.range.toDate)
    .orderBy('serviceDateYmd', 'asc')
    .orderBy(FieldPath.documentId(), 'asc')
    .startAfter(params.cursor.serviceDateYmd, params.cursor.caseId)
    .count()
    .get();
  return snapshot.data().count;
}

async function retryFailedItems(params: {
  db: Firestore;
  runRef: DocumentReference<DocumentData>;
  state: ForceFreshRunState;
}): Promise<{
  outcomes: RangeOutcome[];
  nextRetryCursor: string | null;
  retryPassIncrement: number;
}> {
  const failedCases = runCasesCollection(params.runRef);
  const retryCursor = text(params.state.retryCursorCaseId);

  const baseQuery = () =>
    failedCases
      .where('retryable', '==', true)
      .orderBy(FieldPath.documentId(), 'asc')
      .limit(AVS_FORCE_FRESH_RANGE_MAX_CASES);

  let query: Query<DocumentData> = baseQuery();
  if (retryCursor) query = query.startAfter(retryCursor);

  let snapshot = await query.get();
  let retryPassIncrement = 0;
  if (snapshot.empty && retryCursor) {
    snapshot = await baseQuery().get();
    retryPassIncrement = 1;
  }

  if (snapshot.empty) {
    return {
      outcomes: [],
      nextRetryCursor: null,
      retryPassIncrement,
    };
  }

  const caseRefs = snapshot.docs.map((checkpoint) =>
    params.db.collection('attendanceValidationCases').doc(checkpoint.id));
  const caseSnapshots = await params.db.getAll(...caseRefs);
  const items: RangeItem[] = snapshot.docs.map((checkpoint, index) => ({
    id: checkpoint.id,
    serviceDateYmd: text(checkpoint.data().serviceDateYmd),
    data: caseSnapshots[index].exists
      ? (caseSnapshots[index].data() || {}) as Record<string, unknown>
      : {},
  }));

  const outcomes = await processItems({
    db: params.db,
    runRef: params.runRef,
    items,
  });

  return {
    outcomes,
    nextRetryCursor:
      snapshot.size === AVS_FORCE_FRESH_RANGE_MAX_CASES
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null,
    retryPassIncrement,
  };
}

function responseFromState(params: {
  range: { fromDate: string; toDate: string };
  runId: string;
  state: ForceFreshRunState;
  outcomes: readonly RangeOutcome[];
  remainingCases: number;
  checkpointedCasesSkipped: number;
  alreadyComplete: boolean;
  mode: 'scan' | 'retry_failed' | 'summary';
}) {
  const status = text(params.state.status) || 'in_progress';
  const refreshed = params.outcomes.filter(
    (item) => item.status === 'refreshed',
  ).length;
  const skipped = params.outcomes.filter(
    (item) => item.status === 'skipped',
  ).length;
  const failed = params.outcomes.filter(
    (item) => item.status === 'failed',
  ).length;
  const graphLogicalCalls = params.outcomes.reduce(
    (sum, item) => sum + item.graphLogicalCalls,
    0,
  );
  const currentFailedCases = count(params.state.failedCount);
  const retryableFailureCount =
    count(params.state.retryableFailureCount);
  const actionRequiredFailureCount =
    count(params.state.actionRequiredFailureCount);
  const failureSummary = summarizeAvsFailures(
    params.outcomes
      .map((item) => item.failure)
      .filter((failure): failure is AvsFailureDescriptor => Boolean(failure)),
  );

  return {
    ok: true,
    ...params.range,
    runId: params.runId,
    generationId: params.runId,
    // Compatibility alias for the pre-Brick-4 dashboard response.
    rangeId: params.runId,
    status,
    mode: params.mode,
    alreadyComplete: params.alreadyComplete,
    complete: status === 'complete',
    completeWithFailures: status === 'complete_with_failures',
    hasMore:
      params.remainingCases > 0
      || retryableFailureCount > 0,
    retryableFailures:
      status === 'complete_with_failures'
      && retryableFailureCount > 0,
    actionRequiredFailures:
      status === 'complete_with_failures'
      && actionRequiredFailureCount > 0,
    retryableFailureCount,
    actionRequiredFailureCount,
    failureSummary,
    casesProcessed: params.outcomes.length,
    attempted: params.outcomes.length,
    refreshed,
    skipped,
    failed,
    currentFailedCases,
    checkpointedCasesSkipped: params.checkpointedCasesSkipped,
    graphLogicalCalls,
    remainingCases: params.remainingCases,
    concurrency: AVS_FORCE_FRESH_RANGE_CONCURRENCY,
    cumulative: {
      casesProcessed: count(params.state.processedCount),
      attempted: count(params.state.attemptedCount),
      refreshed: count(params.state.refreshedCount),
      skipped: count(params.state.skippedCount),
      failed: currentFailedCases,
      retryableFailures: retryableFailureCount,
      actionRequiredFailures: actionRequiredFailureCount,
      graphLogicalCalls: count(params.state.graphLogicalCalls),
      identityMappingsWritten:
        count(params.state.identityMappingsWritten),
      identityClaimsWritten:
        count(params.state.identityClaimsWritten),
    },
    operationalMutationAllowed: false as const,
  };
}

export const forceRefreshAttendanceValidationRange = onCall(
  {
    region: REGION,
    memory: '1GiB',
    invoker: 'public',
    labels: { 'avs-public-invoker': 'true' },
    timeoutSeconds: 540,
    maxInstances: 1,
    concurrency: 1,
    secrets: [
      MICROSOFT_TENANT_ID,
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
    ],
  },
  async (request) => {
    await ensureAdmin(request.auth);

    let range: { fromDate: string; toDate: string };
    let requestedRunId: string | null;
    try {
      range = normalizeAvsForceFreshRange(
        request.data?.fromDate,
        request.data?.toDate,
      );
      requestedRunId = cleanAvsForceFreshRunId(request.data?.runId);
    } catch (error) {
      throw new HttpsError('invalid-argument', errorMessage(error));
    }

    const retryFailures = request.data?.retryFailures === true;
    const db = admin.firestore();
    const loaded = await loadOrCreateRun({
      db,
      range,
      requestedRunId,
      actorUid: request.auth?.uid || 'admin',
    });
    const { runRef, runId } = loaded;
    let state = loaded.state;
    const status = text(state.status);

    if (status === 'complete') {
      return responseFromState({
        range,
        runId,
        state,
        outcomes: [],
        remainingCases: 0,
        checkpointedCasesSkipped: 0,
        alreadyComplete: true,
        mode: 'summary',
      });
    }

    if (status === 'complete_with_failures' && !retryFailures) {
      return responseFromState({
        range,
        runId,
        state,
        outcomes: [],
        remainingCases: 0,
        checkpointedCasesSkipped: 0,
        alreadyComplete: true,
        mode: 'summary',
      });
    }

    if (retryFailures) {
      if (status !== 'complete_with_failures') {
        throw new HttpsError(
          'failed-precondition',
          'Failed-case retry is available only after the generation finishes its range scan.',
        );
      }

      const retryResult = await retryFailedItems({
        db,
        runRef,
        state,
      });
      const stateAfterOutcomesSnapshot = await runRef.get();
      const stateAfterOutcomes =
        (stateAfterOutcomesSnapshot.data() || {}) as ForceFreshRunState;
      const currentFailedCases = count(stateAfterOutcomes.failedCount);
      const nextStatus = forceFreshRunStatus({
        remainingCases: 0,
        failedCases: currentFailedCases,
      });

      await runRef.set({
        status: nextStatus,
        retryCursorCaseId: retryResult.nextRetryCursor,
        retryPass: FieldValue.increment(
          retryResult.retryPassIncrement,
        ),
        remainingCases: 0,
        lastBatchCaseCount: retryResult.outcomes.length,
        updatedAt: FieldValue.serverTimestamp(),
        ...(nextStatus === 'complete'
          ? { completedAt: FieldValue.serverTimestamp() }
          : {}),
      }, { merge: true });

      const finalSnapshot = await runRef.get();
      state = (finalSnapshot.data() || {}) as ForceFreshRunState;

      return responseFromState({
        range,
        runId,
        state,
        outcomes: retryResult.outcomes,
        remainingCases: 0,
        checkpointedCasesSkipped: 0,
        alreadyComplete: false,
        mode: 'retry_failed',
      });
    }

    const cursor = cursorFromState(state);
    let casesQuery = db
      .collection('attendanceValidationCases')
      .where('serviceDateYmd', '>=', range.fromDate)
      .where('serviceDateYmd', '<=', range.toDate)
      .orderBy('serviceDateYmd', 'asc')
      .orderBy(FieldPath.documentId(), 'asc')
      .limit(AVS_FORCE_FRESH_RANGE_QUERY_LIMIT);

    if (cursor) {
      casesQuery = casesQuery.startAfter(
        cursor.serviceDateYmd,
        cursor.caseId,
      );
    }

    const querySnapshot = await casesQuery.get();
    const rows: RangeItem[] = querySnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      serviceDateYmd: text(docSnapshot.data().serviceDateYmd),
      data: (docSnapshot.data() || {}) as Record<string, unknown>,
    }));
    const terminalIds = await terminalCheckpointIdsForRows(
      db,
      runRef,
      rows,
    );
    const plan = forceFreshRangeBatchFromQueryRows(
      rows,
      terminalIds,
    );

    await runRef.set({
      status: 'in_progress',
      updatedAt: FieldValue.serverTimestamp(),
      operationalMutationAllowed: false,
    }, { merge: true });

    const outcomes = await processItems({
      db,
      runRef,
      items: plan.batch,
    });

    const remainingCases = await remainingCasesAfterCursor({
      db,
      range,
      cursor: plan.nextCursor,
      hasMore: plan.hasMore,
    });

    const stateAfterOutcomesSnapshot = await runRef.get();
    const stateAfterOutcomes =
      (stateAfterOutcomesSnapshot.data() || {}) as ForceFreshRunState;
    const failedCases = count(stateAfterOutcomes.failedCount);
    const nextStatus = forceFreshRunStatus({
      remainingCases,
      failedCases,
    });

    await runRef.set({
      status: nextStatus,
      cursorDate: plan.nextCursor?.serviceDateYmd ?? null,
      cursorCaseId: plan.nextCursor?.caseId ?? null,
      remainingCases,
      lastBatchCaseCount: plan.batch.length,
      lastCheckpointedCaseCount: plan.checkpointedCaseCount,
      updatedAt: FieldValue.serverTimestamp(),
      ...(nextStatus === 'complete'
        || nextStatus === 'complete_with_failures'
        ? { scanCompletedAt: FieldValue.serverTimestamp() }
        : {}),
      ...(nextStatus === 'complete'
        ? { completedAt: FieldValue.serverTimestamp() }
        : {}),
    }, { merge: true });

    const finalSnapshot = await runRef.get();
    state = (finalSnapshot.data() || {}) as ForceFreshRunState;

    logger.info('AVS Force Fresh generation batch completed', {
      runId,
      fromDate: range.fromDate,
      toDate: range.toDate,
      status: text(state.status),
      batchCaseCount: outcomes.length,
      checkpointedCasesSkipped: plan.checkpointedCaseCount,
      remainingCases,
      currentFailedCases: count(state.failedCount),
    });

    return responseFromState({
      range,
      runId,
      state,
      outcomes,
      remainingCases,
      checkpointedCasesSkipped: plan.checkpointedCaseCount,
      alreadyComplete: false,
      mode: 'scan',
    });
  },
);
