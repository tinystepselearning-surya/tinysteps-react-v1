import * as admin from 'firebase-admin';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
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
  ATTENDANCE_VALIDATION_FORCE_FRESH_RANGES_COLLECTION,
  AVS_FORCE_FRESH_RANGE_CONCURRENCY,
  AVS_FORCE_FRESH_RANGE_QUERY_LIMIT,
  avsForceFreshRangeId,
  forceFreshRangeBatchFromQueryRows,
  mapWithConcurrency,
  normalizeAvsForceFreshRange,
  type AvsForceFreshRangeCursor,
} from './forceFreshRangePlanner';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import { loadProductionStaffIdentityRegistry } from './staffIdentityRegistry';
import {
  AvsOrganizerResolutionError,
  resolveAttendanceValidationOrganizerUserId,
} from './organizerConfig';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

interface ForceFreshRangeState {
  fromDate?: unknown;
  toDate?: unknown;
  status?: unknown;
  cursorDate?: unknown;
  cursorCaseId?: unknown;
  completedCaseIds?: unknown;
  processedCount?: unknown;
  refreshedCount?: unknown;
  skippedCount?: unknown;
  failedCount?: unknown;
  graphLogicalCalls?: unknown;
}

type RangeOutcome = {
  caseId: string;
  status: 'refreshed' | 'skipped' | 'failed';
  graphLogicalCalls: number;
  identityMappingWritten: boolean;
  identityClaimWritten: boolean;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function completedCaseIds(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.map(text).filter(Boolean));
}

function cursorFromState(
  state: ForceFreshRangeState,
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

export const forceRefreshAttendanceValidationRange = onCall(
  {
    region: REGION,
    memory: '1GiB',
    invoker: 'public',
    labels: { 'avs-public-invoker': 'true' },
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
      range = normalizeAvsForceFreshRange(
        request.data?.fromDate,
        request.data?.toDate,
      );
    } catch (error) {
      throw new HttpsError('invalid-argument', errorMessage(error));
    }

    const db = admin.firestore();
    const rangeId = avsForceFreshRangeId(range);
    const rangeRef = db
      .collection(ATTENDANCE_VALIDATION_FORCE_FRESH_RANGES_COLLECTION)
      .doc(rangeId);
    const stateSnapshot = await rangeRef.get();
    const state = stateSnapshot.exists
      ? (stateSnapshot.data() || {}) as ForceFreshRangeState
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
        casesProcessed: 0,
        refreshed: 0,
        skipped: 0,
        failed: 0,
        graphLogicalCalls: 0,
        remainingCases: 0,
        concurrency: AVS_FORCE_FRESH_RANGE_CONCURRENCY,
        cumulative: {
          casesProcessed: count(state.processedCount),
          refreshed: count(state.refreshedCount),
          skipped: count(state.skippedCount),
          failed: count(state.failedCount),
          graphLogicalCalls: count(state.graphLogicalCalls),
        },
        operationalMutationAllowed: false,
      };
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
    const rows = querySnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      serviceDateYmd: text(docSnapshot.data().serviceDateYmd),
      data: (docSnapshot.data() || {}) as Record<string, unknown>,
    }));
    const plan = forceFreshRangeBatchFromQueryRows(
      rows,
      completedCaseIds(state.completedCaseIds),
    );

    await rangeRef.set({
      schemaVersion: 1,
      fromDate: range.fromDate,
      toDate: range.toDate,
      status: 'in_progress',
      concurrency: AVS_FORCE_FRESH_RANGE_CONCURRENCY,
      updatedAt: FieldValue.serverTimestamp(),
      operationalMutationAllowed: false,
    }, { merge: true });

    const hasEligibleCase = plan.batch.some((item) =>
      text(item.data.classSessionId) === item.id
      && Boolean(text(item.data.evidenceId)));
    let organizerResolution = null;
    if (hasEligibleCase) {
      try {
        organizerResolution =
          await resolveAttendanceValidationOrganizerUserId(db);
      } catch (error) {
        if (error instanceof AvsOrganizerResolutionError) {
          throw new HttpsError('failed-precondition', error.reason);
        }
        throw error;
      }
    }
    const graphClient = hasEligibleCase ? graphClientFromSecrets() : null;
    const staffRegistry = hasEligibleCase
      ? await loadProductionStaffIdentityRegistry(db)
      : null;

    const outcomes = await mapWithConcurrency(
      plan.batch,
      AVS_FORCE_FRESH_RANGE_CONCURRENCY,
      async (item): Promise<RangeOutcome> => {
        let outcome: RangeOutcome;
        if (
          text(item.data.classSessionId) !== item.id
          || !text(item.data.evidenceId)
        ) {
          outcome = {
            caseId: item.id,
            status: 'skipped',
            graphLogicalCalls: 0,
            identityMappingWritten: false,
            identityClaimWritten: false,
          };
        } else {
          try {
            const result = await refreshAttendanceValidationCaseEvidence({
              db,
              caseId: item.id,
              organizerResolution: organizerResolution!,
              graphClient: graphClient!,
              staffRegistry: staffRegistry!,
            });
            outcome = {
              caseId: item.id,
              status: 'refreshed',
              graphLogicalCalls: result.graphLogicalCalls,
              identityMappingWritten: result.teacherIdentityMappingWritten,
              identityClaimWritten: result.teacherIdentityClaimWritten,
            };
          } catch (error) {
            outcome = {
              caseId: item.id,
              status: 'failed',
              graphLogicalCalls: error instanceof ForceFreshCaseRefreshError
                ? error.graphLogicalCalls
                : 0,
              identityMappingWritten: false,
              identityClaimWritten: false,
            };
            logger.error('AVS Force Fresh selected-range case failed', {
              rangeId,
              caseId: item.id,
              errorName: error instanceof Error ? error.name : 'unknown',
              errorMessage: error instanceof Error ? error.message : 'unknown',
            });
          }
        }

        await rangeRef.set({
          completedCaseIds: FieldValue.arrayUnion(item.id),
          processedCount: FieldValue.increment(1),
          ...(outcome.status === 'refreshed'
            ? { refreshedCount: FieldValue.increment(1) }
            : outcome.status === 'skipped'
              ? { skippedCount: FieldValue.increment(1) }
              : { failedCount: FieldValue.increment(1) }),
          graphLogicalCalls: FieldValue.increment(outcome.graphLogicalCalls),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return outcome;
      },
    );

    const nextCursor = plan.nextCursor;
    let remainingCases = 0;
    if (nextCursor && plan.hasMore) {
      const remainingSnapshot = await db
        .collection('attendanceValidationCases')
        .where('serviceDateYmd', '>=', range.fromDate)
        .where('serviceDateYmd', '<=', range.toDate)
        .orderBy('serviceDateYmd', 'asc')
        .orderBy(FieldPath.documentId(), 'asc')
        .startAfter(nextCursor.serviceDateYmd, nextCursor.caseId)
        .count()
        .get();
      remainingCases = remainingSnapshot.data().count;
    }

    const complete = remainingCases === 0;
    await rangeRef.set({
      status: complete ? 'complete' : 'in_progress',
      cursorDate: nextCursor?.serviceDateYmd ?? null,
      cursorCaseId: nextCursor?.caseId ?? null,
      remainingCases,
      lastBatchCaseCount: plan.batch.length,
      updatedAt: FieldValue.serverTimestamp(),
      ...(complete ? { completedAt: FieldValue.serverTimestamp() } : {}),
    }, { merge: true });

    const finalStateSnapshot = await rangeRef.get();
    const finalState =
      (finalStateSnapshot.data() || {}) as ForceFreshRangeState;
    const refreshed = outcomes.filter((item) => item.status === 'refreshed').length;
    const skipped = outcomes.filter((item) => item.status === 'skipped').length;
    const failed = outcomes.filter((item) => item.status === 'failed').length;
    const graphLogicalCalls = outcomes.reduce(
      (sum, item) => sum + item.graphLogicalCalls,
      0,
    );
    const identityMappingsWritten = outcomes.filter(
      (item) => item.identityMappingWritten,
    ).length;
    const identityClaimsWritten = outcomes.filter(
      (item) => item.identityClaimWritten,
    ).length;

    return {
      ok: true,
      ...range,
      rangeId,
      alreadyComplete: false,
      complete,
      casesProcessed: outcomes.length,
      refreshed,
      skipped,
      failed,
      graphLogicalCalls,
      identityMappingsWritten,
      identityClaimsWritten,
      remainingCases,
      concurrency: AVS_FORCE_FRESH_RANGE_CONCURRENCY,
      cumulative: {
        casesProcessed: count(finalState.processedCount),
        refreshed: count(finalState.refreshedCount),
        skipped: count(finalState.skippedCount),
        failed: count(finalState.failedCount),
        graphLogicalCalls: count(finalState.graphLogicalCalls),
      },
      operationalMutationAllowed: false,
    };
  },
);
