import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import { bindTeacherIdentityFromFreshEvidence } from './automaticTeacherIdentity';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import {
  AvsEvidenceInfrastructureError,
  avsFailureHttpsError,
  avsFailureLogFields,
  classifyAvsFailure,
  firstBlockingEvidenceFailure,
  summarizeAvsEvidenceIssues,
} from './errorTaxonomy';
import { buildFreshEvidenceSessionSnapshot } from './freshEvidenceSession';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import { createOccurrenceSelectingTeamsEvidenceGraphClient } from './occurrenceSelectingGraphClient';
import {
  AvsOrganizerResolutionError,
  resolveAttendanceValidationOrganizerUserId,
  type AvsOrganizerResolution,
} from './organizerConfig';
import {
  collectTeamsEvidence,
  type AttendanceValidationEvidenceDocument,
  type TeamsEvidenceGraphClient,
} from './teamsEvidenceCollector';
import {
  ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION,
} from './dirtySessionMarker';
import { runAv53ShadowWithFirestore } from './shadowRunner';
import type { Av3StaffRegistrySnapshot } from './staffIdentityRegistry';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
export const MICROSOFT_TENANT_ID = defineSecret('MICROSOFT_TENANT_ID');
export const MICROSOFT_CLIENT_ID = defineSecret('MICROSOFT_CLIENT_ID');
export const MICROSOFT_CLIENT_SECRET = defineSecret('MICROSOFT_CLIENT_SECRET');

function cleanId(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.includes('/') || normalized.length > 240) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return normalized;
}

function cleanFingerprint(value: unknown): string {
  const normalized = String(value ?? '').trim();
  if (!/^[a-f0-9]{64}$/i.test(normalized)) {
    throw new HttpsError('invalid-argument', 'inputFingerprint is invalid.');
  }
  return normalized.toLowerCase();
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

export class ForceFreshCaseRefreshError extends Error {
  constructor(
    readonly causeError: unknown,
    readonly graphLogicalCalls: number,
  ) {
    super(
      causeError instanceof Error
        ? causeError.message
        : 'Force Fresh Teams Evidence failed.',
    );
    this.name = 'ForceFreshCaseRefreshError';
  }
}

export interface ForceFreshCaseRefreshDependencies {
  db: Firestore;
  caseId: string;
  inputFingerprint?: string;
  organizerResolution?: AvsOrganizerResolution;
  graphClient: TeamsEvidenceGraphClient;
  staffRegistry?: Av3StaffRegistrySnapshot;
}

/**
 * The one canonical Force Fresh pipeline used by both single-case and range actions.
 * It writes only AVS evidence/case sidecars plus guarded AVS dirty-marker cleanup.
 */
export async function refreshAttendanceValidationCaseEvidence(
  deps: ForceFreshCaseRefreshDependencies,
) {
  const counted = countingGraphClient(deps.graphClient);

  try {
    const { db } = deps;
    const caseId = cleanId(deps.caseId, 'caseId');
    const caseRef = db.collection('attendanceValidationCases').doc(caseId);
    const caseSnapshot = await caseRef.get();
    if (!caseSnapshot.exists) {
      throw new HttpsError('not-found', 'Attendance validation case not found.');
    }

    const validationCase = (caseSnapshot.data() || {}) as Record<string, unknown>;
    if (deps.inputFingerprint) {
      const inputFingerprint = cleanFingerprint(deps.inputFingerprint);
      const storedFingerprint = String(
        validationCase.inputFingerprint || '',
      ).trim().toLowerCase();
      if (!storedFingerprint || storedFingerprint !== inputFingerprint) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance validation case changed. Reload saved results before forcing fresh evidence.',
        );
      }
    }

    const classSessionId = cleanId(
      validationCase.classSessionId,
      'classSessionId',
    );
    if (classSessionId !== caseId) {
      throw new HttpsError(
        'failed-precondition',
        'Force Fresh Teams Evidence supports session-backed AVS cases only.',
      );
    }

    const previousEvidenceId = cleanId(
      validationCase.evidenceId,
      'evidenceId',
    );
    const sessionRef = db.collection('classSessions').doc(classSessionId);
    const previousEvidenceRef = db
      .collection('attendanceValidationEvidence')
      .doc(previousEvidenceId);
    const dirtyRef = db
      .collection(ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION)
      .doc(classSessionId);

    const [sessionSnapshot, previousEvidenceSnapshot, dirtySnapshot] =
      await db.getAll(sessionRef, previousEvidenceRef, dirtyRef);

    if (!sessionSnapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'Operational class session no longer exists.',
      );
    }
    if (!previousEvidenceSnapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'Previous Teams evidence is missing. A first-time baseline run is required.',
      );
    }

    const previousEvidence =
      previousEvidenceSnapshot.data() as AttendanceValidationEvidenceDocument;
    let organizerResolution = deps.organizerResolution;
    if (!organizerResolution) {
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
    const organizerUserId = organizerResolution.organizerUserId;
    logger.info('AVS force-fresh canonical organizer resolved', {
      caseId,
      classSessionId,
      organizerSource: organizerResolution.source,
    });

    const currentSession =
      (sessionSnapshot.data() || {}) as Record<string, unknown>;
    const expectedSession = buildFreshEvidenceSessionSnapshot(
      classSessionId,
      currentSession,
      previousEvidence,
    );

    const runId = `fresh_${Date.now().toString(36)}_${caseId.slice(0, 24)}`;
    const graphClient = createOccurrenceSelectingTeamsEvidenceGraphClient(
      counted.client,
      expectedSession,
    );
    const evidenceResult = await collectTeamsEvidence(
      {
        runId,
        organizerUserId,
        session: expectedSession,
      },
      {
        graphClient,
        store: new FirestoreAttendanceValidationEvidenceStore(db),
      },
    );

    const evidenceIssueSummary =
      summarizeAvsEvidenceIssues(evidenceResult.evidence.issues);
    const blockingEvidenceFailure =
      firstBlockingEvidenceFailure(evidenceResult.evidence.issues);
    if (blockingEvidenceFailure) {
      throw new AvsEvidenceInfrastructureError(
        blockingEvidenceFailure,
        evidenceIssueSummary,
      );
    }

    const identityBinding = await bindTeacherIdentityFromFreshEvidence({
      db,
      evidence: evidenceResult.evidence,
      staffRegistry: deps.staffRegistry,
    });

    const av53Result = await runAv53ShadowWithFirestore(
      db,
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
        'Fresh Teams evidence was stored but the AVS case could not be rebuilt safely.',
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
        logger.warn('AVS force-fresh kept a newer dirty marker', {
          caseId,
          classSessionId,
          errorName: error instanceof Error ? error.name : 'unknown',
        });
      }
    }

    return {
      ok: true,
      caseId,
      classSessionId,
      evidenceId: evidenceResult.evidence.id,
      collectionStatus: evidenceResult.evidence.collectionStatus,
      issueKinds: evidenceResult.evidence.issues.map((issue) => issue.kind),
      issueDetails: evidenceResult.evidence.issues.map((issue) => ({
        stage: issue.stage,
        kind: issue.kind,
        httpStatus: issue.httpStatus,
        graphCode: issue.graphCode,
        innerCode: issue.innerCode,
        reportId: issue.reportId,
      })),
      selectedTranscriptCount: evidenceResult.evidence.transcripts.length,
      selectedAttendanceReportCount:
        evidenceResult.evidence.attendanceReports.length,
      selectedAttendanceRecordCount:
        evidenceResult.evidence.attendanceReports.reduce(
          (sum, report) => sum + report.participantRecords.length,
          0,
        ),
      graphLogicalCalls: counted.count(),
      evidenceIssueSummary,
      teacherIdentityDecision: identityBinding.decision?.status ?? null,
      teacherIdentityBinding: identityBinding.bindingStatus,
      teacherIdentityMappingWritten: identityBinding.overrideWrite,
      teacherIdentityClaimWritten: identityBinding.claimWrite,
      operationalMutationAllowed: false as const,
      dirtyMarkerCleared,
      concurrentMarkerChangeDetected,
      readBudget: {
        validationCaseReads: 1,
        sessionReads: 1,
        previousEvidenceReads: 1,
        dirtyMarkerReads: 1,
        organizerConfigReads: organizerResolution.firestoreReadCount,
        av53PointReads: av53Result.pointReadDocumentBudget,
        sameDayContextReads: av53Result.sameDayContextReadDocumentBudget,
        teacherIdentityTransactionReads: identityBinding.transactionReadCount,
        sharedStaffRegistryLoaded: true,
        boundedReadsExcludingStaffRegistry:
          4
          + organizerResolution.firestoreReadCount
          + identityBinding.transactionReadCount
          + av53Result.pointReadDocumentBudget
          + av53Result.sameDayContextReadDocumentBudget,
      },
    };
  } catch (error) {
    throw new ForceFreshCaseRefreshError(error, counted.count());
  }
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

export const forceRefreshAttendanceValidationEvidence = onCall(
  {
    region: REGION,
    memory: '256MiB',
    invoker: 'public',
    labels: { 'avs-public-invoker': 'true' },
    timeoutSeconds: 120,
    maxInstances: 2,
    secrets: [
      MICROSOFT_TENANT_ID,
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
    ],
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const caseId = cleanId(request.data?.caseId, 'caseId');
    const inputFingerprint = cleanFingerprint(request.data?.inputFingerprint);
    const db = admin.firestore();
    try {
      return await refreshAttendanceValidationCaseEvidence({
        db,
        caseId,
        inputFingerprint,
        graphClient: graphClientFromSecrets(),
      });
    } catch (error) {
      const graphLogicalCalls =
        error instanceof ForceFreshCaseRefreshError
          ? error.graphLogicalCalls
          : 0;
      const failure = classifyAvsFailure(error);
      logger.error('AVS case re-fetch failed', {
        caseId,
        graphLogicalCalls,
        ...avsFailureLogFields(failure),
      });
      throw avsFailureHttpsError(failure, { graphLogicalCalls });
    }
  },
);
