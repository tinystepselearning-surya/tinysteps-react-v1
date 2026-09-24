import type { Firestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';
import { bindTeacherIdentityFromFreshEvidence } from './automaticTeacherIdentity';
import {
  ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION,
} from './dirtySessionMarker';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import { buildBaselineEvidenceSessionSnapshot } from './freshEvidenceSession';
import {
  createOccurrenceSelectingTeamsEvidenceGraphClient,
} from './occurrenceSelectingGraphClient';
import type { AvsOrganizerResolution } from './organizerConfig';
import { runAv53ShadowWithFirestore } from './shadowRunner';
import type { Av3StaffRegistrySnapshot } from './staffIdentityRegistry';
import {
  collectTeamsEvidence,
  type TeamsEvidenceGraphClient,
} from './teamsEvidenceCollector';

function cleanId(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.includes('/') || normalized.length > 240) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return normalized;
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

export class MissingCaseFreshCollectionError extends Error {
  constructor(
    readonly causeError: unknown,
    readonly graphLogicalCalls: number,
  ) {
    super(
      causeError instanceof Error
        ? causeError.message
        : 'First Teams evidence collection failed.',
    );
    this.name = 'MissingCaseFreshCollectionError';
  }
}

export async function collectMissingAttendanceValidationCase(params: {
  db: Firestore;
  classSessionId: string;
  organizerResolution: AvsOrganizerResolution;
  graphClient: TeamsEvidenceGraphClient;
  staffRegistry?: Av3StaffRegistrySnapshot;
}) {
  const counted = countingGraphClient(params.graphClient);

  try {
    const classSessionId = cleanId(
      params.classSessionId,
      'classSessionId',
    );
    const caseRef = params.db
      .collection('attendanceValidationCases')
      .doc(classSessionId);
    const sessionRef = params.db
      .collection('classSessions')
      .doc(classSessionId);
    const dirtyRef = params.db
      .collection(ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION)
      .doc(classSessionId);

    const [caseSnapshot, sessionSnapshot, dirtySnapshot] =
      await params.db.getAll(caseRef, sessionRef, dirtyRef);

    if (caseSnapshot.exists) {
      const data = (caseSnapshot.data() || {}) as Record<string, unknown>;
      const evidenceId = String(data.evidenceId || '').trim();
      if (evidenceId) {
        return {
          ok: true,
          status: 'existing_case' as const,
          classSessionId,
          evidenceId,
          graphLogicalCalls: 0,
          dirtyMarkerCleared: false,
          concurrentMarkerChangeDetected: false,
          teacherIdentityMappingWritten: false,
          teacherIdentityClaimWritten: false,
          operationalMutationAllowed: false as const,
          readBudget: {
            validationCaseReads: 1,
            sessionReads: 1,
            dirtyMarkerReads: 1,
            av53PointReads: 0,
            sameDayContextReads: 0,
            teacherIdentityTransactionReads: 0,
            boundedReadsExcludingStaffRegistry: 3,
          },
        };
      }
    }

    if (!sessionSnapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'Operational class session no longer exists.',
      );
    }

    const session =
      (sessionSnapshot.data() || {}) as Record<string, unknown>;
    const expectedSession = buildBaselineEvidenceSessionSnapshot(
      classSessionId,
      session,
    );

    const runId =
      `validate_missing_${Date.now().toString(36)}_${classSessionId.slice(0, 20)}`;
    const graphClient = createOccurrenceSelectingTeamsEvidenceGraphClient(
      counted.client,
      expectedSession,
    );
    const evidenceResult = await collectTeamsEvidence(
      {
        runId,
        organizerUserId: params.organizerResolution.organizerUserId,
        session: expectedSession,
      },
      {
        graphClient,
        store: new FirestoreAttendanceValidationEvidenceStore(params.db),
      },
    );

    const identityBinding = await bindTeacherIdentityFromFreshEvidence({
      db: params.db,
      evidence: evidenceResult.evidence,
      staffRegistry: params.staffRegistry,
    });

    const av53Result = await runAv53ShadowWithFirestore(
      params.db,
      {
        runId: `${runId}_case`,
        workItems: [{
          classSessionId,
          evidenceId: evidenceResult.evidence.id,
        }],
      },
      () => new Date(),
      identityBinding.staffRegistry,
    );

    if (
      av53Result.persistedCaseCount !== 1
      || av53Result.skippedCount !== 0
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Fresh Teams evidence was stored but the AVS case could not be built safely.',
      );
    }

    let dirtyMarkerCleared = false;
    let concurrentMarkerChangeDetected = false;
    if (dirtySnapshot.exists && dirtySnapshot.updateTime) {
      try {
        await dirtyRef.delete({
          lastUpdateTime: dirtySnapshot.updateTime,
        });
        dirtyMarkerCleared = true;
      } catch (error) {
        concurrentMarkerChangeDetected = true;
        logger.warn('AVS unified validation kept a newer dirty marker', {
          classSessionId,
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    return {
      ok: true,
      status: 'collected' as const,
      classSessionId,
      evidenceId: evidenceResult.evidence.id,
      graphLogicalCalls: counted.count(),
      dirtyMarkerCleared,
      concurrentMarkerChangeDetected,
      teacherIdentityMappingWritten: identityBinding.overrideWrite,
      teacherIdentityClaimWritten: identityBinding.claimWrite,
      operationalMutationAllowed: false as const,
      readBudget: {
        validationCaseReads: 1,
        sessionReads: 1,
        dirtyMarkerReads: 1,
        av53PointReads: av53Result.pointReadDocumentBudget,
        sameDayContextReads: av53Result.sameDayContextReadDocumentBudget,
        teacherIdentityTransactionReads:
          identityBinding.transactionReadCount,
        boundedReadsExcludingStaffRegistry:
          3
          + identityBinding.transactionReadCount
          + av53Result.pointReadDocumentBudget
          + av53Result.sameDayContextReadDocumentBudget,
      },
    };
  } catch (error) {
    throw new MissingCaseFreshCollectionError(
      error,
      counted.count(),
    );
  }
}
