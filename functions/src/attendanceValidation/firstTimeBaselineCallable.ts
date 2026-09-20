import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { createHash } from 'crypto';
import { FieldPath } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import {
  ATTENDANCE_VALIDATION_BASELINE_RANGES_COLLECTION,
  AVS_BASELINE_QUERY_LIMIT,
  avsBaselineRangeId,
  baselineBatchFromQueryRows,
  normalizeAvsBaselineRange,
  type AvsBaselineCursor,
} from './baselinePlanner';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import { buildBaselineEvidenceSessionSnapshot } from './freshEvidenceSession';
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

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MICROSOFT_TENANT_ID = defineSecret('MICROSOFT_TENANT_ID');
const MICROSOFT_CLIENT_ID = defineSecret('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = defineSecret('MICROSOFT_CLIENT_SECRET');

interface BaselineRangeState {
  schemaVersion?: unknown;
  fromDate?: unknown;
  toDate?: unknown;
  status?: unknown;
  cursorDate?: unknown;
  cursorSessionId?: unknown;
  scannedSessionCount?: unknown;
  existingCaseCount?: unknown;
  freshEvidenceCount?: unknown;
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

function missingEvidenceId(sessionId: string): string {
  const digest = createHash('sha256').update(sessionId).digest('hex').slice(0, 40);
  return `baseline_missing_${digest}`;
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

export const runAttendanceValidationFirstTimeBaseline = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
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
    const rangeId = avsBaselineRangeId(range);
    const rangeRef = db
      .collection(ATTENDANCE_VALIDATION_BASELINE_RANGES_COLLECTION)
      .doc(rangeId);
    const stateSnapshot = await rangeRef.get();
    const state = stateSnapshot.exists
      ? (stateSnapshot.data() || {}) as BaselineRangeState
      : {};

    if (
      stateSnapshot.exists
      && text(state.status) === 'complete'
      && text(state.fromDate) === range.fromDate
      && text(state.toDate) === range.toDate
    ) {
      return {
        ok: true,
        ...range,
        rangeId,
        alreadyComplete: true,
        complete: true,
        batchSessionCount: 0,
        existingCaseCount: 0,
        freshEvidenceCount: 0,
        blockedCount: 0,
        blocked: [],
        graphLogicalCalls: 0,
        operationalMutationAllowed: false,
        cumulative: {
          scannedSessionCount: count(state.scannedSessionCount),
          existingCaseCount: count(state.existingCaseCount),
          freshEvidenceCount: count(state.freshEvidenceCount),
          blockedCount: count(state.blockedCount),
        },
        readBudget: {
          baselineStateReads: 1,
          sessionQueryReads: 0,
          validationCaseReads: 0,
          teacherUserReads: 0,
          organizerEvidenceLookupQueries: 0,
          organizerConfigReads: 0,
          av53PointReads: 0,
          sharedStaffRegistryLoaded: false,
          boundedReadsExcludingStaffRegistry: 1,
        },
      };
    }

    const cursor = cursorFromState(state);
    let sessionsQuery = db
      .collection('classSessions')
      .where('date', '>=', range.fromDate)
      .where('date', '<=', range.toDate)
      .orderBy('date', 'asc')
      .orderBy(FieldPath.documentId(), 'asc')
      .limit(AVS_BASELINE_QUERY_LIMIT);

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
    const batchPlan = baselineBatchFromQueryRows(rows);

    if (batchPlan.batch.length === 0) {
      await rangeRef.set({
        schemaVersion: 1,
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
        alreadyComplete: false,
        complete: true,
        batchSessionCount: 0,
        existingCaseCount: 0,
        freshEvidenceCount: 0,
        blockedCount: 0,
        blocked: [],
        graphLogicalCalls: 0,
        operationalMutationAllowed: false,
        cumulative: {
          scannedSessionCount: count(state.scannedSessionCount),
          existingCaseCount: count(state.existingCaseCount),
          freshEvidenceCount: count(state.freshEvidenceCount),
          blockedCount: count(state.blockedCount),
        },
        readBudget: {
          baselineStateReads: 1,
          sessionQueryReads: sessionQuerySnapshot.docs.length,
          validationCaseReads: 0,
          teacherUserReads: 0,
          organizerEvidenceLookupQueries: 0,
          organizerConfigReads: 0,
          av53PointReads: 0,
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

    const missingCaseRows = batchPlan.batch.filter(
      (_item, index) => !caseSnapshots[index].exists,
    );
    const existingCaseCount = batchPlan.batch.length - missingCaseRows.length;

    const snapshots = new Map<string, ReturnType<typeof buildBaselineEvidenceSessionSnapshot>>();
    const blocked: Array<{ sessionId: string; reason: string }> = [];

    for (const item of missingCaseRows) {
      try {
        const sessionSnapshot = buildBaselineEvidenceSessionSnapshot(
          item.id,
          item.data,
        );
        snapshots.set(item.id, sessionSnapshot);
      } catch (error) {
        blocked.push({
          sessionId: item.id,
          reason: error instanceof Error
            ? error.message
            : 'session_snapshot_invalid',
        });
      }
    }

    let organizerUserId: string | null = null;
    let organizerResolutionFailure = 'organizer_identity_unresolved';
    let organizerConfigReads = 0;
    if (snapshots.size > 0) {
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
    const workItems: Array<{ classSessionId: string; evidenceId: string }> = blocked.map(
      (item) => ({
        classSessionId: item.sessionId,
        evidenceId: missingEvidenceId(item.sessionId),
      }),
    );
    let freshEvidenceCount = 0;

    for (const item of missingCaseRows) {
      const expectedSession = snapshots.get(item.id);
      if (!expectedSession) continue;

      if (!organizerUserId) {
        blocked.push({
          sessionId: item.id,
          reason: organizerResolutionFailure,
        });
        workItems.push({
          classSessionId: item.id,
          evidenceId: missingEvidenceId(item.id),
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

      freshEvidenceCount += 1;
      workItems.push({
        classSessionId: item.id,
        evidenceId: evidenceResult.evidence.id,
      });
    }

    const caseRunId =
      `baseline_cases_${Date.now().toString(36)}_${rangeId.slice(-12)}`;
    const av53Result = workItems.length > 0
      ? await runAv53ShadowWithFirestore(db, {
          runId: caseRunId,
          workItems,
        })
      : null;

    const complete = !batchPlan.hasMore;
    const cumulative = {
      scannedSessionCount:
        count(state.scannedSessionCount) + batchPlan.batch.length,
      existingCaseCount:
        count(state.existingCaseCount) + existingCaseCount,
      freshEvidenceCount:
        count(state.freshEvidenceCount) + freshEvidenceCount,
      blockedCount:
        count(state.blockedCount) + blocked.length,
    };

    await rangeRef.set({
      schemaVersion: 1,
      fromDate: range.fromDate,
      toDate: range.toDate,
      status: complete ? 'complete' : 'in_progress',
      cursorDate: batchPlan.nextCursor?.serviceDateYmd ?? null,
      cursorSessionId: batchPlan.nextCursor?.sessionId ?? null,
      ...cumulative,
      lastBatchSessionCount: batchPlan.batch.length,
      lastExistingCaseCount: existingCaseCount,
      lastFreshEvidenceCount: freshEvidenceCount,
      lastBlockedCount: blocked.length,
      lastGraphLogicalCalls: counted.count(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(complete
        ? { completedAt: admin.firestore.FieldValue.serverTimestamp() }
        : {}),
      operationalMutationAllowed: false,
    }, { merge: true });

    const baselineStateReads = 1;
    const sessionQueryReads = sessionQuerySnapshot.docs.length;
    const validationCaseReads = caseRefs.length;
    const av53PointReads = av53Result?.pointReadDocumentBudget ?? 0;

    return {
      ok: true,
      ...range,
      rangeId,
      alreadyComplete: false,
      complete,
      hasMore: batchPlan.hasMore,
      batchSessionCount: batchPlan.batch.length,
      existingCaseCount,
      freshEvidenceCount,
      persistedCaseCount: av53Result?.persistedCaseCount ?? 0,
      skippedCount: av53Result?.skippedCount ?? 0,
      blockedCount: blocked.length,
      blocked,
      graphLogicalCalls: counted.count(),
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
        sharedStaffRegistryLoaded: workItems.length > 0,
        boundedReadsExcludingStaffRegistry:
          baselineStateReads
          + sessionQueryReads
          + validationCaseReads
          + organizerConfigReads
          + av53PointReads,
      },
    };
  },
);
