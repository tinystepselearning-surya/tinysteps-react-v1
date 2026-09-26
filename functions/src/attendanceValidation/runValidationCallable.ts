import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID } from './forceFreshEvidenceCallable';
import { normalizeAvsLatestCheckRange } from './latestCheckPlanner';
import { normalizeAvsParentId, resolveAvsParentEnrollments } from './parentScope';
import { discoverAvsRangeGroups, loadAvsGroupEvidence, normalizeAvsRangeCursor, validateAvsBusinessGroup, persistAvsGroupCases } from './groupValidation';
import { loadProductionStaffIdentityRegistry } from './staffIdentityRegistry';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import { resolveAttendanceValidationOrganizerUserId } from './organizerConfig';
import { buildBaselineEvidenceSessionSnapshot } from './freshEvidenceSession';
import { createOccurrenceSelectingTeamsEvidenceGraphClient } from './occurrenceSelectingGraphClient';
import { collectTeamsEvidence, type TeamsEvidenceGraphClient } from './teamsEvidenceCollector';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import { bindTeacherIdentityFromFreshEvidence } from './automaticTeacherIdentity';
import { AvsEvidenceInfrastructureError, classifyAvsFailure, emptyAvsFailureSummary, firstBlockingEvidenceFailure, mergeAvsFailureSummaries, summarizeAvsEvidenceIssues, summarizeAvsFailures, type AvsFailureDescriptor } from './errorTaxonomy';

if (!admin.apps.length) admin.initializeApp();

export const runAttendanceValidationRange = onCall({
  region: 'asia-south1', memory: '1GiB', invoker: 'public',
  labels: { 'avs-public-invoker': 'true' }, timeoutSeconds: 540, maxInstances: 1,
  secrets: [MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET],
}, async (request) => {
  await ensureAdmin(request.auth);
  let range: { fromDate: string; toDate: string };
  try {
    range = normalizeAvsLatestCheckRange(request.data?.fromDate, request.data?.toDate);
  } catch (error) {
    throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid range.');
  }
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (range.toDate >= today) throw new HttpsError('failed-precondition', 'Run Validation can include only completed service dates through yesterday IST.');
  const parentId = normalizeAvsParentId(request.data?.parentId);
  const cursor = normalizeAvsRangeCursor(request.data?.cursor, range.fromDate, range.toDate);
  const db = admin.firestore();
  const enrollmentIds = await resolveAvsParentEnrollments(db, parentId);
  // Replaces dirty/latest + baseline gating: every selected group is rebuilt,
  // even if a prior baseline checkpoint says complete or no row is dirty.
  const plan = await discoverAvsRangeGroups(db, range, enrollmentIds, cursor);
  const registry = plan.groups.length ? await loadProductionStaffIdentityRegistry(db) : null;
  let graphLogicalCalls = 0;
  let graph: TeamsEvidenceGraphClient | null = null;
  let organizerUserId: string | null = null;
  let identityMappingsWritten = 0;
  let identityClaimsWritten = 0;
  let existingCount = 0;
  let persistedCount = 0;
  let freshCount = 0;
  let cachedCount = 0;
  let unsafeCount = 0;
  let evidenceReads = 0;
  let evidenceIssueSummary = emptyAvsFailureSummary();
  const freshOutcomes: Array<{ sessionId: string; failure: AvsFailureDescriptor | null }> = [];
  const failures: AvsFailureDescriptor[] = [];
  for (const [index, rows] of plan.groups.entries()) {
    const loaded = await loadAvsGroupEvidence(db, rows);
    existingCount += loaded.existingCount;
    evidenceReads += loaded.readCount;
    const result = await validateAvsBusinessGroup({
      rows, evidenceBySession: loaded.evidenceBySession, registry: registry!,
      runId: `group_${Date.now().toString(36)}_${index}`,
      saveCases: (cases) => persistAvsGroupCases(db, rows, cases),
      collectFresh: async (row) => {
        try {
          if (!organizerUserId) organizerUserId = (await resolveAttendanceValidationOrganizerUserId(db)).organizerUserId;
          if (!graph) {
            const base = new MicrosoftGraphClient({ credentials: {
              tenantId: MICROSOFT_TENANT_ID.value(), clientId: MICROSOFT_CLIENT_ID.value(), clientSecret: MICROSOFT_CLIENT_SECRET.value(),
            } });
            graph = {
              resolveOnlineMeetingByJoinUrl: (...args) => { graphLogicalCalls++; return base.resolveOnlineMeetingByJoinUrl(...args); },
              listTranscripts: (...args) => { graphLogicalCalls++; return base.listTranscripts(...args); },
              listAttendanceReports: (...args) => { graphLogicalCalls++; return base.listAttendanceReports(...args); },
              listAttendanceRecords: (...args) => { graphLogicalCalls++; return base.listAttendanceRecords(...args); },
            };
          }
          const session = buildBaselineEvidenceSessionSnapshot(row.id, row.data);
          const result = await collectTeamsEvidence({ runId: `group_fresh_${Date.now().toString(36)}`, organizerUserId, session }, {
            graphClient: createOccurrenceSelectingTeamsEvidenceGraphClient(graph, session),
            store: new FirestoreAttendanceValidationEvidenceStore(db),
          });
          const issues = summarizeAvsEvidenceIssues(result.evidence.issues);
          evidenceIssueSummary = mergeAvsFailureSummaries(evidenceIssueSummary, issues);
          const blocking = firstBlockingEvidenceFailure(result.evidence.issues);
          if (blocking) throw new AvsEvidenceInfrastructureError(blocking, issues);
          const binding = await bindTeacherIdentityFromFreshEvidence({ db, evidence: result.evidence, staffRegistry: registry! });
          registry!.entries = binding.staffRegistry.entries;
          if (binding.overrideWrite) identityMappingsWritten++;
          if (binding.claimWrite) identityClaimsWritten++;
          freshOutcomes.push({ sessionId: row.id, failure: null });
          return result.evidence;
        } catch (error) {
          freshOutcomes.push({ sessionId: row.id, failure: classifyAvsFailure(error) });
          throw error;
        }
      },
    });
    persistedCount += result.cases.length;
    freshCount += result.freshCount;
    if (!result.freshCount && loaded.evidenceBySession.size) cachedCount += result.cases.length;
    unsafeCount += result.unsafeCount;
    failures.push(...result.failures.map((error) => classifyAvsFailure(error)));
  }
  const hasMore = plan.hasMore;
  const failureSummary = summarizeAvsFailures(failures);
  logger.info('AVS group-first validation completed', { ...range, parentId, processedSessionCount: plan.processedSessionCount, persistedCount, graphLogicalCalls, hasMore });
  return {
    ok: true, ...range, parentId, nextCursor: hasMore ? plan.nextCursor : null,
    maxSessionsPerInvocation: 100, processedSessionCount: plan.processedSessionCount,
    dirtyFoundCount: 0, cachedRevalidatedCount: cachedCount,
    staleEvidenceCount: 0, missingEvidenceCaseCount: 0, freshnessUnsafeCount: unsafeCount,
    freshWorkCount: freshOutcomes.length, freshRefreshedCount: freshCount,
    firstEvidenceCollectedCount: 0, freshExistingRaceCount: 0,
    freshFailedCount: failures.length, freshOutcomes, failureSummary, evidenceIssueSummary,
    organizerBlockedReason: null, baselineAttempted: false, baselineComplete: !hasMore,
    baselineAlreadyComplete: false, baselineBatchSessionCount: plan.processedSessionCount,
    baselineExistingCaseCount: existingCount, baselineFreshEvidenceCount: 0,
    baselinePersistedCaseCount: 0, groupRebuiltCount: persistedCount, baselineBlockedCount: 0,
    baselineDeferred: false, graphLogicalCalls, identityMappingsWritten, identityClaimsWritten,
    concurrentMarkerChangeDetected: false, hasMore, continueValidation: hasMore,
    operationalMutationAllowed: false,
    readBudget: { ...plan.readBudget, parentEnrollments: enrollmentIds?.length ?? 0, evidenceReads, sessionGuardReads: plan.processedSessionCount, dirtyMarkerGuardReads: plan.processedSessionCount },
  };
});
