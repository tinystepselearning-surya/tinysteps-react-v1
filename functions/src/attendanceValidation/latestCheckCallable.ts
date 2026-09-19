import * as admin from 'firebase-admin';
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
import { runAv53ShadowWithFirestore } from './shadowRunner';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

interface LatestCheckRequest {
  fromDate?: unknown;
  toDate?: unknown;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid latest-check request.';
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
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    let range: { fromDate: string; toDate: string };
    try {
      const data = (request.data || {}) as LatestCheckRequest;
      range = normalizeAvsLatestCheckRange(data.fromDate, data.toDate);
    } catch (error) {
      throw new HttpsError('invalid-argument', errorMessage(error));
    }

    const db = admin.firestore();
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
        sharedStaffRegistryLoaded: plan.workItems.length > 0,
        boundedReadsExcludingStaffRegistry:
          dirtyMarkerReads + validationCaseReads + av53PointReads,
      },
    };
  },
);
