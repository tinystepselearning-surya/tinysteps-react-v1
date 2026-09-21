import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import {
  ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION,
} from './dirtySessionMarker';
import {
  AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS,
  normalizeAvsLatestCheckRange,
  planAvsLatestCheck,
} from './latestCheckPlanner';
import {
  ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION,
  loadProductionStaffIdentityRegistry,
} from './staffIdentityRegistry';
import {
  runAv53ShadowWithFirestore,
} from './shadowRunner';
import type {
  AttendanceValidationEvidenceDocument,
} from './teamsEvidenceCollector';
import {
  AVS_IDENTITY_ROLLOUT_CASE_LIMIT,
  planCachedTeacherIdentityRollout,
  registryWithAppliedIdentityMappings,
  type CachedIdentityRolloutCase,
  type TeacherIdentityRolloutStatus,
} from './teacherIdentityRollout';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

interface LatestCheckRequest {
  fromDate?: unknown;
  toDate?: unknown;
  mode?: unknown;
}

type LatestCheckMode = 'dirty' | 'identity_rollout';

const SHA256_HEX = /^[a-f0-9]{64}$/;
const AV53_CHUNK_SIZE = 100;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function latestCheckMode(value: unknown): LatestCheckMode {
  const normalized = text(value);
  if (!normalized || normalized === 'dirty') return 'dirty';
  if (normalized === 'identity_rollout') return 'identity_rollout';
  throw new TypeError('mode must be dirty or identity_rollout.');
}

function normalizedHashArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((item) => text(item).toLowerCase())
      .filter((item) => SHA256_HEX.test(item)),
  )].sort();
}

function disabledOverrideStatus(value: unknown): boolean {
  return ['inactive', 'disabled', 'archived', 'deleted']
    .includes(text(value).toLowerCase());
}

function rolloutDecisionCounts(
  decisions: readonly { status: TeacherIdentityRolloutStatus }[],
): Record<TeacherIdentityRolloutStatus, number> {
  const counts: Record<TeacherIdentityRolloutStatus, number> = {
    ready: 0,
    already_mapped: 0,
    teacher_not_registered: 0,
    teacher_email_missing: 0,
    teacher_email_ambiguous: 0,
    no_cached_identity_candidate: 0,
    multiple_cached_identity_candidates: 0,
    existing_identity_differs: 0,
    identity_owned_by_other_staff: 0,
  };
  for (const decision of decisions) counts[decision.status] += 1;
  return counts;
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid latest-check request.';
}


async function runCachedTeacherIdentityRollout(
  db: Firestore,
  range: { fromDate: string; toDate: string },
  actorUid: string,
) {
  const caseSnapshot = await db
    .collection('attendanceValidationCases')
    .where('serviceDateYmd', '>=', range.fromDate)
    .where('serviceDateYmd', '<=', range.toDate)
    .orderBy('serviceDateYmd', 'asc')
    .limit(AVS_IDENTITY_ROLLOUT_CASE_LIMIT + 1)
    .get();

  if (caseSnapshot.size > AVS_IDENTITY_ROLLOUT_CASE_LIMIT) {
    throw new HttpsError(
      'failed-precondition',
      `Teacher identity rollout supports at most ${AVS_IDENTITY_ROLLOUT_CASE_LIMIT} cached AVS cases per run. Narrow the date range and try again.`,
    );
  }

  const cachedCases: CachedIdentityRolloutCase[] = caseSnapshot.docs.map(
    (docSnapshot) => {
      const data = (docSnapshot.data() || {}) as Record<string, unknown>;
      return {
        caseId: docSnapshot.id,
        classSessionId: text(data.classSessionId) || null,
        teacherId: text(data.teacherId) || null,
        evidenceId: text(data.evidenceId) || null,
        resolutionStatus: text(data.resolutionStatus) || null,
      };
    },
  );

  const evidenceIds = [...new Set(
    cachedCases
      .map((item) => item.evidenceId)
      .filter((value): value is string => Boolean(value)),
  )];
  const evidenceRefs = evidenceIds.map((evidenceId) =>
    db.collection('attendanceValidationEvidence').doc(evidenceId),
  );
  const evidenceSnapshots = evidenceRefs.length > 0
    ? await db.getAll(...evidenceRefs)
    : [];
  const evidenceById = new Map<string, AttendanceValidationEvidenceDocument>();
  evidenceSnapshots.forEach((snapshot, index) => {
    if (!snapshot.exists) return;
    evidenceById.set(
      evidenceIds[index],
      snapshot.data() as AttendanceValidationEvidenceDocument,
    );
  });

  const registry = await loadProductionStaffIdentityRegistry(db);
  const plan = planCachedTeacherIdentityRollout(
    cachedCases,
    evidenceById,
    registry,
  );

  const overrideRefs = plan.readyMappings.map((mapping) =>
    db
      .collection(ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION)
      .doc(mapping.teacherId),
  );
  const overrideSnapshots = overrideRefs.length > 0
    ? await db.getAll(...overrideRefs)
    : [];

  const acceptedMappings: typeof plan.readyMappings = [];
  let disabledOverrideCount = 0;
  let existingOverrideConflictCount = 0;

  plan.readyMappings.forEach((mapping, index) => {
    const snapshot = overrideSnapshots[index];
    if (!snapshot?.exists) {
      acceptedMappings.push(mapping);
      return;
    }

    const data = (snapshot.data() || {}) as Record<string, unknown>;
    if (disabledOverrideStatus(data.status)) {
      disabledOverrideCount += 1;
      return;
    }

    const existingHashes = normalizedHashArray(
      data.microsoftIdentityIdHashes,
    );
    if (
      existingHashes.length === 0
      || (
        existingHashes.length === 1
        && existingHashes[0] === mapping.microsoftIdentityIdHash
      )
    ) {
      acceptedMappings.push(mapping);
      return;
    }

    existingOverrideConflictCount += 1;
  });

  if (acceptedMappings.length > 0) {
    const writeBatch = db.batch();
    for (const mapping of acceptedMappings) {
      const ref = db
        .collection(ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION)
        .doc(mapping.teacherId);
      writeBatch.set(ref, {
        staffId: mapping.teacherId,
        microsoftIdentityIdHashes: [mapping.microsoftIdentityIdHash],
        source: 'cached_avs_evidence_email_bound',
        supportingCaseCount: mapping.supportingCaseCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        operationalMutationAllowed: false,
      }, { merge: true });
    }
    await writeBatch.commit();
  }

  const updatedRegistry = registryWithAppliedIdentityMappings(
    registry,
    acceptedMappings.map((mapping) => ({
      teacherId: mapping.teacherId,
      microsoftIdentityIdHash: mapping.microsoftIdentityIdHash,
    })),
  );

  const resolvedCasesSkippedCount = cachedCases.filter(
    (item) => item.resolutionStatus === 'resolved',
  ).length;
  const workItems = cachedCases
    .filter((item) =>
      item.resolutionStatus !== 'resolved'
      && item.classSessionId
      && item.classSessionId === item.caseId
      && item.evidenceId
      && evidenceById.has(item.evidenceId))
    .map((item) => ({
      classSessionId: item.classSessionId!,
      evidenceId: item.evidenceId!,
    }));

  let revalidatedCount = 0;
  let skippedCount = 0;
  let av53PointReads = 0;
  let sameDayContextReads = 0;
  const nowToken = Date.now().toString(36);

  for (const [index, batch] of chunks(workItems, AV53_CHUNK_SIZE).entries()) {
    const result = await runAv53ShadowWithFirestore(
      db,
      {
        runId: `identity_${nowToken}_${actorUid.slice(0, 12)}_${index + 1}`,
        workItems: batch,
      },
      () => new Date(),
      updatedRegistry,
    );
    revalidatedCount += result.persistedCaseCount;
    skippedCount += result.skippedCount;
    av53PointReads += result.pointReadDocumentBudget;
    sameDayContextReads += result.sameDayContextReadDocumentBudget;
  }

  const decisionCounts = rolloutDecisionCounts(plan.decisions);
  logger.info('AVS cached teacher identity rollout completed', {
    fromDate: range.fromDate,
    toDate: range.toDate,
    cachedCaseCount: cachedCases.length,
    evidenceDocumentCount: evidenceById.size,
    teacherCount: plan.decisions.length,
    identityConfigWrites: acceptedMappings.length,
    disabledOverrideCount,
    existingOverrideConflictCount,
    revalidatedCount,
    resolvedCasesSkippedCount,
    graphCalls: 0,
  });

  return {
    ok: true,
    mode: 'identity_rollout' as const,
    ...range,
    caseCountScanned: cachedCases.length,
    evidenceDocumentCount: evidenceById.size,
    teacherCount: plan.decisions.length,
    identityConfigWrites: acceptedMappings.length,
    disabledOverrideCount,
    existingOverrideConflictCount,
    decisionCounts,
    revalidatedCount,
    skippedCount,
    resolvedCasesSkippedCount,
    graphCalls: 0,
    operationalMutationAllowed: false,
    readBudget: {
      validationCaseReads: caseSnapshot.size,
      evidenceDocumentReads: evidenceSnapshots.length,
      identityOverrideReads: overrideSnapshots.length,
      av53PointReads,
      sameDayContextReads,
      sharedStaffRegistryLoaded: true,
      boundedReadsExcludingStaffRegistry:
        caseSnapshot.size
        + evidenceSnapshots.length
        + overrideSnapshots.length
        + av53PointReads
        + sameDayContextReads,
    },
  };
}

/**
 * Admin-only changed-session AVS reconciliation.
 *
 * This callable never scans classSessions and never calls Microsoft Graph.
 * It consumes only backend-created dirty markers, reuses each session's cached
 * attendanceValidationEvidence document, and reruns AV3/AV4/AV5 through AV5.3.
 */
export const runAttendanceValidationLatestCheck = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    let range: { fromDate: string; toDate: string };
    let mode: LatestCheckMode;
    try {
      const data = (request.data || {}) as LatestCheckRequest;
      range = normalizeAvsLatestCheckRange(data.fromDate, data.toDate);
      mode = latestCheckMode(data.mode);
    } catch (error) {
      throw new HttpsError('invalid-argument', errorMessage(error));
    }

    const db = admin.firestore();

    if (mode === 'identity_rollout') {
      return runCachedTeacherIdentityRollout(
        db,
        range,
        request.auth?.uid || 'admin',
      );
    }
    const dirtySnapshot = await db
      .collection(ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION)
      .where('serviceDateYmd', '>=', range.fromDate)
      .where('serviceDateYmd', '<=', range.toDate)
      .orderBy('serviceDateYmd', 'asc')
      .limit(AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS)
      .get();

    const dirtyDocs = dirtySnapshot.docs;
    if (dirtyDocs.length === 0) {
      return {
        ok: true,
        ...range,
        dirtyFoundCount: 0,
        revalidatedCount: 0,
        baselineRequiredCount: 0,
        baselineRequiredSessionIds: [],
        skippedCount: 0,
        dirtyMarkersClearedCount: 0,
        dirtyBatchAtLimit: false,
        graphCalls: 0,
        operationalMutationAllowed: false,
        readBudget: {
          dirtyMarkerReads: 0,
          validationCaseReads: 0,
          av53PointReads: 0,
          sameDayContextReads: 0,
          sharedStaffRegistryLoaded: false,
          boundedReadsExcludingStaffRegistry: 0,
        },
      };
    }

    const dirtySessions = dirtyDocs.map((docSnapshot) => ({
      sessionId: docSnapshot.id,
      serviceDateYmd: String(docSnapshot.data().serviceDateYmd || '').trim(),
    }));

    const caseRefs = dirtyDocs.map((docSnapshot) =>
      db.collection('attendanceValidationCases').doc(docSnapshot.id),
    );
    const caseSnapshots = await db.getAll(...caseRefs);
    const existingCases = caseSnapshots.map((caseSnapshot, index) => {
      const caseData = caseSnapshot.exists
        ? (caseSnapshot.data() || {}) as Record<string, unknown>
        : {};
      const reasons = Array.isArray(caseData.reasons)
        ? caseData.reasons.map((value) => String(value || '').trim())
        : [];
      const evidenceDocumentMissing = reasons.includes('evidence_document_missing');

      return {
        sessionId: dirtyDocs[index].id,
        caseExists: caseSnapshot.exists,
        evidenceId: caseSnapshot.exists && !evidenceDocumentMissing
          ? String(caseData.evidenceId || '').trim() || null
          : null,
      };
    });

    const plan = planAvsLatestCheck(dirtySessions, existingCases);
    const runId = `latest_${Date.now().toString(36)}_${request.auth?.uid?.slice(0, 12) || 'admin'}`;

    const av53Result = plan.workItems.length > 0
      ? await runAv53ShadowWithFirestore(db, {
          runId,
          workItems: plan.workItems,
        })
      : null;

    const skippedSessionIds = new Set(
      (av53Result?.skipped ?? []).map((item) => item.classSessionId),
    );
    const successfullyRevalidatedSessionIds = plan.workItems
      .map((item) => item.classSessionId)
      .filter((sessionId) => !skippedSessionIds.has(sessionId));

    let dirtyMarkersClearedCount = 0;
    let concurrentMarkerChangeDetected = false;

    if (successfullyRevalidatedSessionIds.length > 0) {
      const successfulIds = new Set(successfullyRevalidatedSessionIds);
      const deleteBatch = db.batch();

      for (const dirtyDoc of dirtyDocs) {
        if (!successfulIds.has(dirtyDoc.id)) continue;
        deleteBatch.delete(
          dirtyDoc.ref,
          { lastUpdateTime: dirtyDoc.updateTime },
        );
      }

      try {
        await deleteBatch.commit();
        dirtyMarkersClearedCount = successfullyRevalidatedSessionIds.length;
      } catch (error) {
        // A newer attendance change may have replaced one of the markers while
        // this run was validating. Keeping all markers is the fail-safe outcome.
        concurrentMarkerChangeDetected = true;
        logger.warn('AVS latest check kept dirty markers after guarded delete failure', {
          fromDate: range.fromDate,
          toDate: range.toDate,
          attemptedDeleteCount: successfullyRevalidatedSessionIds.length,
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    const dirtyMarkerReads = dirtyDocs.length;
    const validationCaseReads = caseRefs.length;
    const av53PointReads = av53Result?.pointReadDocumentBudget ?? 0;
    const sameDayContextReads =
      av53Result?.sameDayContextReadDocumentBudget ?? 0;

    return {
      ok: true,
      ...range,
      runId: av53Result?.runId ?? null,
      dirtyFoundCount: dirtyDocs.length,
      revalidatedCount: successfullyRevalidatedSessionIds.length,
      baselineRequiredCount: plan.baselineRequiredSessionIds.length,
      baselineRequiredSessionIds: plan.baselineRequiredSessionIds,
      skippedCount: av53Result?.skippedCount ?? 0,
      skipped: av53Result?.skipped ?? [],
      dirtyMarkersClearedCount,
      concurrentMarkerChangeDetected,
      dirtyBatchAtLimit:
        dirtyDocs.length === AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS,
      graphCalls: 0,
      operationalMutationAllowed: false,
      readBudget: {
        dirtyMarkerReads,
        validationCaseReads,
        av53PointReads,
        sameDayContextReads,
        sharedStaffRegistryLoaded: plan.workItems.length > 0,
        boundedReadsExcludingStaffRegistry:
          dirtyMarkerReads
          + validationCaseReads
          + av53PointReads
          + sameDayContextReads,
      },
    };
  },
);
