import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import {
  runAttendanceValidationFirstTimeBaselineBatch,
} from './firstTimeBaselineCallable';
import {
  ForceFreshCaseRefreshError,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID,
  refreshAttendanceValidationCaseEvidence,
} from './forceFreshEvidenceCallable';
import {
  AVS_FORCE_FRESH_RANGE_CONCURRENCY,
  mapWithConcurrency,
} from './forceFreshRangePlanner';
import {
  runAttendanceValidationLatestCheckBatch,
} from './latestCheckCallable';
import {
  MissingCaseFreshCollectionError,
  collectMissingAttendanceValidationCase,
} from './missingCaseFreshCollector';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import {
  AvsOrganizerResolutionError,
  resolveAttendanceValidationOrganizerUserId,
} from './organizerConfig';
import { loadProductionStaffIdentityRegistry } from './staffIdentityRegistry';
import {
  AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN,
  remainingUnifiedValidationCapacity,
  uniqueFreshValidationTargets,
} from './validationRangePlanner';
import {
  normalizeAvsLatestCheckRange,
} from './latestCheckPlanner';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

function currentIstYmd(now = new Date()): string {
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
    .toISOString()
    .slice(0, 10);
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Invalid attendance validation request.';
}

type FreshOutcome = {
  sessionId: string;
  kind: 'stale' | 'missing';
  status: 'refreshed' | 'collected' | 'existing_case' | 'failed' | 'blocked';
  graphLogicalCalls: number;
  identityMappingWritten: boolean;
  identityClaimWritten: boolean;
  dirtyMarkerCleared: boolean;
  concurrentMarkerChangeDetected: boolean;
  errorMessage: string | null;
};

export const runAttendanceValidationRange = onCall(
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
      range = normalizeAvsLatestCheckRange(
        request.data?.fromDate,
        request.data?.toDate,
      );
    } catch (error) {
      throw new HttpsError('invalid-argument', errorMessage(error));
    }

    if (range.toDate >= currentIstYmd()) {
      throw new HttpsError(
        'failed-precondition',
        'Run Validation can include only completed service dates through yesterday IST.',
      );
    }

    const db = admin.firestore();
    const actorUid = request.auth?.uid || 'admin';

    const latest = await runAttendanceValidationLatestCheckBatch(
      db,
      range,
      actorUid,
    );

    const freshTargets = uniqueFreshValidationTargets({
      staleCaseSessionIds: latest.freshEvidenceRequiredSessionIds,
      missingCaseSessionIds: latest.baselineRequiredSessionIds,
    });

    let organizerBlockedReason: string | null = null;
    let freshOutcomes: FreshOutcome[] = [];

    if (freshTargets.length > 0) {
      let organizerResolution = null;
      try {
        organizerResolution =
          await resolveAttendanceValidationOrganizerUserId(db);
      } catch (error) {
        if (error instanceof AvsOrganizerResolutionError) {
          organizerBlockedReason = error.reason;
        } else {
          throw error;
        }
      }

      if (!organizerResolution) {
        freshOutcomes = freshTargets.map((target) => ({
          sessionId: target.sessionId,
          kind: target.kind,
          status: 'blocked' as const,
          graphLogicalCalls: 0,
          identityMappingWritten: false,
          identityClaimWritten: false,
          dirtyMarkerCleared: false,
          concurrentMarkerChangeDetected: false,
          errorMessage:
            organizerBlockedReason || 'organizer_identity_unresolved',
        }));
      } else {
        const graphClient = new MicrosoftGraphClient({
          credentials: {
            tenantId: MICROSOFT_TENANT_ID.value(),
            clientId: MICROSOFT_CLIENT_ID.value(),
            clientSecret: MICROSOFT_CLIENT_SECRET.value(),
          },
        });
        const staffRegistry = await loadProductionStaffIdentityRegistry(db);

        freshOutcomes = await mapWithConcurrency(
          freshTargets,
          AVS_FORCE_FRESH_RANGE_CONCURRENCY,
          async (target): Promise<FreshOutcome> => {
            try {
              if (target.kind === 'stale') {
                const result =
                  await refreshAttendanceValidationCaseEvidence({
                    db,
                    caseId: target.sessionId,
                    organizerResolution,
                    graphClient,
                    staffRegistry,
                  });
                return {
                  sessionId: target.sessionId,
                  kind: target.kind,
                  status: 'refreshed',
                  graphLogicalCalls: result.graphLogicalCalls,
                  identityMappingWritten:
                    result.teacherIdentityMappingWritten,
                  identityClaimWritten:
                    result.teacherIdentityClaimWritten,
                  dirtyMarkerCleared: result.dirtyMarkerCleared,
                  concurrentMarkerChangeDetected:
                    result.concurrentMarkerChangeDetected,
                  errorMessage: null,
                };
              }

              const result = await collectMissingAttendanceValidationCase({
                db,
                classSessionId: target.sessionId,
                organizerResolution,
                graphClient,
                staffRegistry,
              });
              return {
                sessionId: target.sessionId,
                kind: target.kind,
                status: result.status,
                graphLogicalCalls: result.graphLogicalCalls,
                identityMappingWritten:
                  result.teacherIdentityMappingWritten,
                identityClaimWritten:
                  result.teacherIdentityClaimWritten,
                dirtyMarkerCleared: result.dirtyMarkerCleared,
                concurrentMarkerChangeDetected:
                  result.concurrentMarkerChangeDetected,
                errorMessage: null,
              };
            } catch (error) {
              const graphLogicalCalls =
                error instanceof ForceFreshCaseRefreshError
                  || error instanceof MissingCaseFreshCollectionError
                  ? error.graphLogicalCalls
                  : 0;
              logger.error('AVS unified validation fresh work failed', {
                sessionId: target.sessionId,
                kind: target.kind,
                errorName: error instanceof Error ? error.name : 'unknown',
                errorMessage:
                  error instanceof Error ? error.message : 'unknown',
              });
              return {
                sessionId: target.sessionId,
                kind: target.kind,
                status: 'failed',
                graphLogicalCalls,
                identityMappingWritten: false,
                identityClaimWritten: false,
                dirtyMarkerCleared: false,
                concurrentMarkerChangeDetected: false,
                errorMessage:
                  error instanceof Error ? error.message : 'unknown',
              };
            }
          },
        );
      }
    }

    const freshFailedCount = freshOutcomes.filter(
      (item) => item.status === 'failed' || item.status === 'blocked',
    ).length;
    const remainingCapacity = remainingUnifiedValidationCapacity(
      latest.dirtyFoundCount,
    );

    const baseline =
      remainingCapacity > 0 && freshFailedCount === 0
        ? await runAttendanceValidationFirstTimeBaselineBatch(
            db,
            range,
            { maxSessions: remainingCapacity },
          )
        : null;

    const freshGraphLogicalCalls = freshOutcomes.reduce(
      (sum, item) => sum + item.graphLogicalCalls,
      0,
    );
    const baselineGraphLogicalCalls =
      baseline?.graphLogicalCalls ?? 0;
    const graphLogicalCalls =
      freshGraphLogicalCalls + baselineGraphLogicalCalls;

    const processedSessionCount =
      latest.dirtyFoundCount + (baseline?.batchSessionCount ?? 0);
    const baselineDeferred =
      remainingCapacity === 0 || freshFailedCount > 0;
    const hasMore =
      latest.dirtyBatchAtLimit
      || Boolean(baseline?.hasMore)
      || (
        baselineDeferred
        && !baseline?.complete
        && latest.dirtyFoundCount > 0
      )
      || freshFailedCount > 0;

    const response = {
      ok: true,
      ...range,
      maxSessionsPerInvocation:
        AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN,
      processedSessionCount,
      dirtyFoundCount: latest.dirtyFoundCount,
      cachedRevalidatedCount: latest.revalidatedCount,
      staleEvidenceCount:
        latest.freshEvidenceRequiredSessionIds.length,
      missingEvidenceCaseCount:
        latest.baselineRequiredSessionIds.length,
      freshnessUnsafeCount: latest.freshnessUnsafeCount,
      freshnessUnsafeSessionIds: latest.freshnessUnsafeSessionIds,
      freshWorkCount: freshOutcomes.length,
      freshRefreshedCount: freshOutcomes.filter(
        (item) => item.status === 'refreshed',
      ).length,
      firstEvidenceCollectedCount: freshOutcomes.filter(
        (item) => item.status === 'collected',
      ).length,
      freshExistingRaceCount: freshOutcomes.filter(
        (item) => item.status === 'existing_case',
      ).length,
      freshFailedCount,
      freshOutcomes,
      organizerBlockedReason,
      baselineAttempted: Boolean(baseline),
      baselineComplete: baseline?.complete ?? false,
      baselineAlreadyComplete: baseline?.alreadyComplete ?? false,
      baselineBatchSessionCount: baseline?.batchSessionCount ?? 0,
      baselineFreshEvidenceCount: baseline?.freshEvidenceCount ?? 0,
      baselineBlockedCount: baseline?.blockedCount ?? 0,
      baselineDeferred,
      graphLogicalCalls,
      identityMappingsWritten:
        freshOutcomes.filter((item) => item.identityMappingWritten).length
        + (baseline?.identityMappingsWritten ?? 0),
      identityClaimsWritten:
        freshOutcomes.filter((item) => item.identityClaimWritten).length
        + (baseline?.identityClaimsWritten ?? 0),
      concurrentMarkerChangeDetected:
        latest.concurrentMarkerChangeDetected
        || freshOutcomes.some(
          (item) => item.concurrentMarkerChangeDetected,
        ),
      hasMore,
      continueValidation: hasMore,
      operationalMutationAllowed: false as const,
      readBudget: {
        latest: latest.readBudget,
        baseline: baseline?.readBudget ?? null,
      },
    };

    logger.info('AVS unified validation completed', {
      fromDate: range.fromDate,
      toDate: range.toDate,
      processedSessionCount,
      dirtyFoundCount: latest.dirtyFoundCount,
      freshWorkCount: freshOutcomes.length,
      freshFailedCount,
      baselineBatchSessionCount:
        baseline?.batchSessionCount ?? 0,
      graphLogicalCalls,
      hasMore,
    });

    return response;
  },
);
