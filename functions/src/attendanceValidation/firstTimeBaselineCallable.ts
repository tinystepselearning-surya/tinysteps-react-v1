import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FieldPath, type Firestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import { bindTeacherIdentityFromFreshEvidence } from './automaticTeacherIdentity';
import {
  AVS_BUSINESS_CASE_SCHEMA_VERSION,
  isCurrentAvsBusinessCaseDocument,
} from './businessOutcomeEngine';
import {
  ATTENDANCE_VALIDATION_BASELINE_RANGES_COLLECTION,
  AVS_BASELINE_MAX_SESSIONS_PER_RUN,
  AVS_BASELINE_QUERY_LIMIT,
  avsBaselineRangeId,
  baselineBatchFromQueryRows,
  normalizeAvsBaselineRange,
  type AvsBaselineCursor,
} from './baselinePlanner';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import {
  classifyAvsFailure,
  classifyAvsReason,
  emptyAvsFailureSummary,
  firstBlockingEvidenceFailure,
  mergeAvsFailureSummaries,
  summarizeAvsEvidenceIssues,
  summarizeAvsFailures,
  type AvsFailureDescriptor,
} from './errorTaxonomy';
import { buildBaselineEvidenceSessionSnapshot } from './freshEvidenceSession';
import { markAttendanceValidationDirtySession } from './dirtySessionMarker';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import { createOccurrenceSelectingTeamsEvidenceGraphClient } from './occurrenceSelectingGraphClient';
import {
  AvsOrganizerResolutionError,
  resolveAttendanceValidationOrganizerUserId,
} from './organizerConfig';
import {
  collectTeamsEvidence,
  type TeamsEvidenceGraphClient,
} from './teamsEvidenceCollector';
import { runAv53ShadowWithFirestore } from './shadowRunner';
import {
  loadProductionStaffIdentityRegistry,
  type Av3StaffRegistrySnapshot,
} from './staffIdentityRegistry';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MICROSOFT_TENANT_ID = defineSecret('MICROSOFT_TENANT_ID');
const MICROSOFT_CLIENT_ID = defineSecret('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = defineSecret('MICROSOFT_CLIENT_SECRET');

interface BaselineRangeState {
  schemaVersion?: unknown;
  businessCaseSchemaVersion?: unknown;
  fromDate?: unknown;
  toDate?: unknown;
  status?: unknown;
  cursorDate?: unknown;
  cursorSessionId?: unknown;
  scannedSessionCount?: unknown;
  existingCaseCount?: unknown;
  freshEvidenceCount?: unknown;
  migratedLegacyCaseCount?: unknown;
  blockedCount?: unknown;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function currentIstYmd(now = new Date()): string {
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
    .toISOString()
    .slice(0, 10);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid baseline request.';
}

function countingGraphClient(base: TeamsEvidenceGraphClient): {
  client: TeamsEvidenceGraphClient;
  count: () => number;
} {
  let logicalCalls = 0;
  return {
    count: () => logicalCalls,
    client: {
      async resolveOnlineMeetingByJoinUrl(organizerUserId, joinWebUrl) {
        logicalCalls += 1;
        return base.resolveOnlineMeetingByJoinUrl(organizerUserId, joinWebUrl);
      },
      async listTranscripts(organizerUserId, onlineMeetingId, top) {
        logicalCalls += 1;
        return base.listTranscripts(organizerUserId, onlineMeetingId, top);
      },
      async listAttendanceReports(organizerUserId, onlineMeetingId) {
        logicalCalls += 1;
        return base.listAttendanceReports(organizerUserId, onlineMeetingId);
      },
      async listAttendanceRecords(organizerUserId, onlineMeetingId, reportId) {
        logicalCalls += 1;
        return base.listAttendanceRecords(
          organizerUserId,
          onlineMeetingId,
          reportId,
        );
      },
    },
  };
}

function cursorFromState(state: BaselineRangeState): AvsBaselineCursor | null {
  const serviceDateYmd = text(state.cursorDate);
  const sessionId = text(state.cursorSessionId);
  return serviceDateYmd && sessionId
    ? { serviceDateYmd, sessionId }
    : null;
}


export async function runAttendanceValidationFirstTimeBaselineBatch(
  db: Firestore,
  range: { fromDate: string; toDate: string },
  options: {
    maxSessions?: number;
    allowFreshEvidence?: boolean;
  } = {},
) {
  const maxSessions =
    options.maxSessions ?? AVS_BASELINE_MAX_SESSIONS_PER_RUN;
  const allowFreshEvidence = options.allowFreshEvidence ?? true;
  if (
    !Number.isInteger(maxSessions)
    || maxSessions < 1
    || maxSessions > AVS_BASELINE_MAX_SESSIONS_PER_RUN
  ) {
    throw new RangeError(
      `maxSessions must be an integer from 1 to ${AVS_BASELINE_MAX_SESSIONS_PER_RUN}.`,
    );
  }
    const rangeId = avsBaselineRangeId(range);
    const rangeRef = db
      .collection(ATTENDANCE_VALIDATION_BASELINE_RANGES_COLLECTION)
      .doc(rangeId);
    const stateSnapshot = await rangeRef.get();
    const state = stateSnapshot.exists
      ? (stateSnapshot.data() || {}) as BaselineRangeState
      : {};
    const checkpointMatchesCurrentBusinessSchema =
      stateSnapshot.exists
      && text(state.fromDate) === range.fromDate
      && text(state.toDate) === range.toDate
      && count(state.businessCaseSchemaVersion)
        === AVS_BUSINESS_CASE_SCHEMA_VERSION;
    // A completed pre-three-outcome checkpoint must not suppress migration.
    // Reset its cursor/counters and rescan the bounded range once using cached
    // evidence wherever possible.
    const activeState = checkpointMatchesCurrentBusinessSchema
      ? state
      : {};

    if (
      checkpointMatchesCurrentBusinessSchema
      && text(state.status) === 'complete'
    ) {
      return {
        ok: true,
        ...range,
        rangeId,
        businessCaseSchemaVersion: AVS_BUSINESS_CASE_SCHEMA_VERSION,
        alreadyComplete: true,
        complete: true,
        hasMore: false,
        batchSessionCount: 0,
        existingCaseCount: 0,
        freshEvidenceCount: 0,
        blockedCount: 0,
        blocked: [],
        failureSummary: emptyAvsFailureSummary(),
        graphLogicalCalls: 0,
        identityMappingsWritten: 0,
        identityClaimsWritten: 0,
        operationalMutationAllowed: false,
        cumulative: {
          scannedSessionCount: count(activeState.scannedSessionCount),
          existingCaseCount: count(activeState.existingCaseCount),
          freshEvidenceCount: count(activeState.freshEvidenceCount),
          blockedCount: count(activeState.blockedCount),
        },
        readBudget: {
          baselineStateReads: 1,
          sessionQueryReads: 0,
          validationCaseReads: 0,
          teacherUserReads: 0,
          organizerEvidenceLookupQueries: 0,
          organizerConfigReads: 0,
          av53PointReads: 0,
          sameDayContextReads: 0,
          sharedStaffRegistryLoaded: false,
          boundedReadsExcludingStaffRegistry: 1,
        },
      };
    }

    const cursor = cursorFromState(activeState);
    let sessionsQuery = db
      .collection('classSessions')
      .where('date', '>=', range.fromDate)
      .where('date', '<=', range.toDate)
      .orderBy('date', 'asc')
      .orderBy(FieldPath.documentId(), 'asc')
      .limit(
        maxSessions === AVS_BASELINE_MAX_SESSIONS_PER_RUN
          ? AVS_BASELINE_QUERY_LIMIT
          : maxSessions + 1,
      );

    if (cursor) {
      sessionsQuery = sessionsQuery.startAfter(
        cursor.serviceDateYmd,
        cursor.sessionId,
      );
    }

    const sessionQuerySnapshot = await sessionsQuery.get();
    const rows = sessionQuerySnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      serviceDateYmd: text(docSnapshot.data().date),
      data: (docSnapshot.data() || {}) as Record<string, unknown>,
    }));
    const batchPlan = baselineBatchFromQueryRows(rows, maxSessions);

    if (batchPlan.batch.length === 0) {
      await rangeRef.set({
        schemaVersion: 1,
        businessCaseSchemaVersion: AVS_BUSINESS_CASE_SCHEMA_VERSION,
        fromDate: range.fromDate,
        toDate: range.toDate,
        status: 'complete',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        operationalMutationAllowed: false,
      }, { merge: true });

      return {
        ok: true,
        ...range,
        rangeId,
        businessCaseSchemaVersion: AVS_BUSINESS_CASE_SCHEMA_VERSION,
        alreadyComplete: false,
        complete: true,
        hasMore: false,
        batchSessionCount: 0,
        existingCaseCount: 0,
        freshEvidenceCount: 0,
        blockedCount: 0,
        blocked: [],
        failureSummary: emptyAvsFailureSummary(),
        graphLogicalCalls: 0,
        identityMappingsWritten: 0,
        identityClaimsWritten: 0,
        operationalMutationAllowed: false,
        cumulative: {
          scannedSessionCount: count(activeState.scannedSessionCount),
          existingCaseCount: count(activeState.existingCaseCount),
          freshEvidenceCount: count(activeState.freshEvidenceCount),
          blockedCount: count(activeState.blockedCount),
        },
        readBudget: {
          baselineStateReads: 1,
          sessionQueryReads: sessionQuerySnapshot.docs.length,
          validationCaseReads: 0,
          teacherUserReads: 0,
          organizerEvidenceLookupQueries: 0,
          organizerConfigReads: 0,
          av53PointReads: 0,
          sameDayContextReads: 0,
          sharedStaffRegistryLoaded: false,
          boundedReadsExcludingStaffRegistry:
            1 + sessionQuerySnapshot.docs.length,
        },
      };
    }

    const caseRefs = batchPlan.batch.map((item) =>
      db.collection('attendanceValidationCases').doc(item.id),
    );
    const caseSnapshots = await db.getAll(...caseRefs);

    const caseRows = batchPlan.batch.map((item, index) => {
      const snapshot = caseSnapshots[index];
      const data = snapshot.exists
        ? (snapshot.data() || {}) as Record<string, unknown>
        : null;
      return { item, snapshot, data };
    });
    const missingCaseRows = caseRows
      .filter((row) => !row.snapshot.exists)
      .map((row) => row.item);
    const legacyCaseRows = caseRows.filter((row) =>
      row.snapshot.exists
      && row.data
      && !isCurrentAvsBusinessCaseDocument(row.data));
    const existingCaseCount = caseRows.filter((row) =>
      row.snapshot.exists
      && row.data
      && isCurrentAvsBusinessCaseDocument(row.data)).length;
    const cachedLegacyRows = legacyCaseRows.filter((row) =>
      Boolean(text(row.data?.evidenceId)));
    const legacyWithoutCachedEvidenceRows = legacyCaseRows
      .filter((row) => !text(row.data?.evidenceId))
      .map((row) => row.item);
    const freshCollectionRows = [
      ...missingCaseRows,
      ...legacyWithoutCachedEvidenceRows,
    ];

    const snapshots = new Map<string, ReturnType<typeof buildBaselineEvidenceSessionSnapshot>>();
    const blocked: Array<{
      sessionId: string;
      reason: string;
      failure: AvsFailureDescriptor;
    }> = [];
    const failureSummaries = [];

    for (const item of freshCollectionRows) {
      try {
        const sessionSnapshot = buildBaselineEvidenceSessionSnapshot(
          item.id,
          item.data,
        );
        snapshots.set(item.id, sessionSnapshot);
      } catch (error) {
        const failure = classifyAvsFailure(error);
        blocked.push({
          sessionId: item.id,
          reason: failure.code,
          failure,
        });
        failureSummaries.push(summarizeAvsFailures([failure]));
      }
    }

    let organizerUserId: string | null = null;
    let organizerResolutionFailure = 'organizer_identity_unresolved';
    let organizerConfigReads = 0;
    if (allowFreshEvidence && snapshots.size > 0) {
      try {
        const organizerResolution =
          await resolveAttendanceValidationOrganizerUserId(db);
        organizerUserId = organizerResolution.organizerUserId;
        organizerConfigReads = organizerResolution.firestoreReadCount;
        logger.info('AVS baseline canonical organizer resolved', {
          rangeId,
          organizerSource: organizerResolution.source,
        });
      } catch (error) {
        if (error instanceof AvsOrganizerResolutionError) {
          organizerResolutionFailure = error.reason;
          organizerConfigReads = error.firestoreReadCount;
        } else {
          throw error;
        }
      }
    }

    const baseGraphClient = new MicrosoftGraphClient({
      credentials: {
        tenantId: MICROSOFT_TENANT_ID.value(),
        clientId: MICROSOFT_CLIENT_ID.value(),
        clientSecret: MICROSOFT_CLIENT_SECRET.value(),
      },
    });
    const counted = countingGraphClient(baseGraphClient);
    const evidenceStore = new FirestoreAttendanceValidationEvidenceStore(db);
    const workItems: Array<{ classSessionId: string; evidenceId: string }> =
      cachedLegacyRows.map((row) => ({
        classSessionId: row.item.id,
        evidenceId: text(row.data?.evidenceId),
      }));
    let freshEvidenceCount = 0;
    let staffRegistry: Av3StaffRegistrySnapshot | null = null;
    let identityMappingsWritten = 0;
    let identityClaimsWritten = 0;
    let teacherIdentityTransactionReads = 0;

    const ensureStaffRegistry = async () => {
      if (!staffRegistry) {
        staffRegistry = await loadProductionStaffIdentityRegistry(db);
      }
      return staffRegistry;
    };

    const deferredFreshRows = allowFreshEvidence
      ? []
      : freshCollectionRows;
    for (const item of deferredFreshRows) {
      await markAttendanceValidationDirtySession(db, {
        sessionId: item.id,
        session: item.data,
        reason: 'validation_infrastructure_retry',
      });
    }

    for (const item of allowFreshEvidence ? freshCollectionRows : []) {
      const expectedSession = snapshots.get(item.id);
      if (!expectedSession) continue;

      if (!organizerUserId) {
        const failure = classifyAvsReason(organizerResolutionFailure);
        blocked.push({
          sessionId: item.id,
          reason: failure.code,
          failure,
        });
        failureSummaries.push(summarizeAvsFailures([failure]));
        await markAttendanceValidationDirtySession(db, {
          sessionId: item.id,
          session: item.data,
          reason: 'validation_infrastructure_retry',
        });
        continue;
      }

      const evidenceRunId =
        `baseline_${Date.now().toString(36)}_${item.id.slice(0, 20)}`;
      const graphClient = createOccurrenceSelectingTeamsEvidenceGraphClient(
        counted.client,
        expectedSession,
      );
      const evidenceResult = await collectTeamsEvidence(
        {
          runId: evidenceRunId,
          organizerUserId,
          session: expectedSession,
        },
        {
          graphClient,
          store: evidenceStore,
        },
      );

      const evidenceIssueSummary =
        summarizeAvsEvidenceIssues(evidenceResult.evidence.issues);
      const blockingEvidenceFailure =
        firstBlockingEvidenceFailure(evidenceResult.evidence.issues);
      if (blockingEvidenceFailure) {
        blocked.push({
          sessionId: item.id,
          reason: blockingEvidenceFailure.code,
          failure: blockingEvidenceFailure,
        });
        failureSummaries.push(evidenceIssueSummary);
        await markAttendanceValidationDirtySession(db, {
          sessionId: item.id,
          session: item.data,
          reason: 'validation_infrastructure_retry',
        });
        continue;
      }

      const identityBinding = await bindTeacherIdentityFromFreshEvidence({
        db,
        evidence: evidenceResult.evidence,
        staffRegistry: await ensureStaffRegistry(),
      });
      staffRegistry = identityBinding.staffRegistry;
      if (identityBinding.overrideWrite) identityMappingsWritten += 1;
      if (identityBinding.claimWrite) identityClaimsWritten += 1;
      teacherIdentityTransactionReads += identityBinding.transactionReadCount;

      freshEvidenceCount += 1;
      workItems.push({
        classSessionId: item.id,
        evidenceId: evidenceResult.evidence.id,
      });
    }

    const caseRunId =
      `baseline_cases_${Date.now().toString(36)}_${rangeId.slice(-12)}`;
    const av53Registry = workItems.length > 0
      ? await ensureStaffRegistry()
      : null;
    const av53Result = workItems.length > 0
      ? await runAv53ShadowWithFirestore(
          db,
          {
            runId: caseRunId,
            workItems,
            missingEvidenceRequiresFresh: true,
          },
          () => new Date(),
          av53Registry!,
        )
      : null;

    const legacyCaseIds = new Set(
      legacyCaseRows.map((row) => row.item.id),
    );
    const migratedLegacyCaseCount = (av53Result?.caseIds ?? [])
      .filter((caseId) => legacyCaseIds.has(caseId)).length;
    const migrationDeferredIds = legacyCaseRows
      .map((row) => row.item.id)
      .filter((sessionId) =>
        !(av53Result?.caseIds ?? []).includes(sessionId));
    for (const sessionId of migrationDeferredIds) {
      const row = legacyCaseRows.find((item) => item.item.id === sessionId);
      if (!row) continue;
      await markAttendanceValidationDirtySession(db, {
        sessionId,
        session: row.item.data,
        reason: 'validation_infrastructure_retry',
      });
    }

    const deferredFreshCount = deferredFreshRows.length;
    const migrationDeferredCount = migrationDeferredIds.length;
    const hasMore =
      batchPlan.hasMore
      || deferredFreshCount > 0
      || migrationDeferredCount > 0;
    const complete = !hasMore;
    const cumulative = {
      scannedSessionCount:
        count(activeState.scannedSessionCount) + batchPlan.batch.length,
      existingCaseCount:
        count(activeState.existingCaseCount) + existingCaseCount,
      freshEvidenceCount:
        count(activeState.freshEvidenceCount) + freshEvidenceCount,
      migratedLegacyCaseCount:
        count(activeState.migratedLegacyCaseCount) + migratedLegacyCaseCount,
      blockedCount:
        count(activeState.blockedCount) + blocked.length,
    };

    await rangeRef.set({
      schemaVersion: 1,
      businessCaseSchemaVersion: AVS_BUSINESS_CASE_SCHEMA_VERSION,
      fromDate: range.fromDate,
      toDate: range.toDate,
      status: complete ? 'complete' : 'in_progress',
      cursorDate: batchPlan.nextCursor?.serviceDateYmd ?? null,
      cursorSessionId: batchPlan.nextCursor?.sessionId ?? null,
      ...cumulative,
      lastBatchSessionCount: batchPlan.batch.length,
      lastExistingCaseCount: existingCaseCount,
      lastLegacyCaseCount: legacyCaseRows.length,
      lastMigratedLegacyCaseCount: migratedLegacyCaseCount,
      lastMigrationDeferredCount: migrationDeferredCount,
      lastDeferredFreshCount: deferredFreshCount,
      lastFreshEvidenceCount: freshEvidenceCount,
      lastBlockedCount: blocked.length,
      lastGraphLogicalCalls: counted.count(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: complete
        ? admin.firestore.FieldValue.serverTimestamp()
        : null,
      operationalMutationAllowed: false,
    }, { merge: true });

    const baselineStateReads = 1;
    const sessionQueryReads = sessionQuerySnapshot.docs.length;
    const validationCaseReads = caseRefs.length;
    const av53PointReads = av53Result?.pointReadDocumentBudget ?? 0;
    const sameDayContextReads =
      av53Result?.sameDayContextReadDocumentBudget ?? 0;

    return {
      ok: true,
      ...range,
      rangeId,
      businessCaseSchemaVersion: AVS_BUSINESS_CASE_SCHEMA_VERSION,
      alreadyComplete: false,
      complete,
      hasMore,
      batchSessionCount: batchPlan.batch.length,
      existingCaseCount,
      legacyCaseCount: legacyCaseRows.length,
      migratedLegacyCaseCount,
      migrationDeferredCount,
      deferredFreshCount,
      freshEvidenceCount,
      persistedCaseCount: av53Result?.persistedCaseCount ?? 0,
      skippedCount: av53Result?.skippedCount ?? 0,
      blockedCount: blocked.length,
      blocked,
      failureSummary: mergeAvsFailureSummaries(...failureSummaries),
      graphLogicalCalls: counted.count(),
      identityMappingsWritten,
      identityClaimsWritten,
      operationalMutationAllowed: false,
      cumulative,
      readBudget: {
        baselineStateReads,
        sessionQueryReads,
        validationCaseReads,
        teacherUserReads: 0,
        organizerEvidenceLookupQueries: 0,
        organizerConfigReads,
        av53PointReads,
        sameDayContextReads,
        teacherIdentityTransactionReads,
        sharedStaffRegistryLoaded: Boolean(av53Registry),
        boundedReadsExcludingStaffRegistry:
          baselineStateReads
          + sessionQueryReads
          + validationCaseReads
          + organizerConfigReads
          + teacherIdentityTransactionReads
          + av53PointReads
          + sameDayContextReads,
      },
    };
}

export const runAttendanceValidationFirstTimeBaseline = onCall(
  {
    region: REGION,
    memory: '512MiB',
    invoker: 'private',
    timeoutSeconds: 540,
    maxInstances: 1,
    secrets: [
      MICROSOFT_TENANT_ID,
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
    ],
  },
  async (request) => {
    await ensureAdmin(request.auth);

    let range: { fromDate: string; toDate: string };
    try {
      range = normalizeAvsBaselineRange(
        request.data?.fromDate,
        request.data?.toDate,
      );
    } catch (error) {
      throw new HttpsError('invalid-argument', errorMessage(error));
    }

    const todayIst = currentIstYmd();
    if (range.toDate >= todayIst) {
      throw new HttpsError(
        'failed-precondition',
        'First-time baseline can include only completed service dates through yesterday IST.',
      );
    }

    const db = admin.firestore();
    return runAttendanceValidationFirstTimeBaselineBatch(db, range);
  },
);
