import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import { buildFreshEvidenceSessionSnapshot } from './freshEvidenceSession';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import { createOccurrenceSelectingTeamsEvidenceGraphClient } from './occurrenceSelectingGraphClient';
import {
  AvsOrganizerResolutionError,
  resolveAttendanceValidationOrganizerUserId,
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

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MICROSOFT_TENANT_ID = defineSecret('MICROSOFT_TENANT_ID');
const MICROSOFT_CLIENT_ID = defineSecret('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = defineSecret('MICROSOFT_CLIENT_SECRET');

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

export const forceRefreshAttendanceValidationEvidence = onCall(
  {
    region: REGION,
    memory: '256MiB',
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

    const caseRef = db.collection('attendanceValidationCases').doc(caseId);
    const caseSnapshot = await caseRef.get();
    if (!caseSnapshot.exists) {
      throw new HttpsError('not-found', 'Attendance validation case not found.');
    }

    const validationCase = (caseSnapshot.data() || {}) as Record<string, unknown>;
    const storedFingerprint = String(
      validationCase.inputFingerprint || '',
    ).trim().toLowerCase();
    if (!storedFingerprint || storedFingerprint !== inputFingerprint) {
      throw new HttpsError(
        'failed-precondition',
        'Attendance validation case changed. Reload saved results before forcing fresh evidence.',
      );
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
    let organizerResolution;
    try {
      organizerResolution = await resolveAttendanceValidationOrganizerUserId(db);
    } catch (error) {
      if (error instanceof AvsOrganizerResolutionError) {
        throw new HttpsError('failed-precondition', error.reason);
      }
      throw error;
    }
    const organizerUserId = organizerResolution.organizerUserId;

    const currentSession =
      (sessionSnapshot.data() || {}) as Record<string, unknown>;
    const expectedSession = buildFreshEvidenceSessionSnapshot(
      classSessionId,
      currentSession,
      previousEvidence,
    );

    const runId = `fresh_${Date.now().toString(36)}_${caseId.slice(0, 24)}`;
    const baseGraphClient = new MicrosoftGraphClient({
      credentials: {
        tenantId: MICROSOFT_TENANT_ID.value(),
        clientId: MICROSOFT_CLIENT_ID.value(),
        clientSecret: MICROSOFT_CLIENT_SECRET.value(),
      },
    });
    const counted = countingGraphClient(baseGraphClient);
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

    const av53Result = await runAv53ShadowWithFirestore(db, {
      runId: `${runId}_case`,
      workItems: [{
        classSessionId,
        evidenceId: evidenceResult.evidence.id,
      }],
    });

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
          errorMessage: error instanceof Error ? error.message : 'unknown',
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
      operationalMutationAllowed: false,
      dirtyMarkerCleared,
      concurrentMarkerChangeDetected,
      readBudget: {
        validationCaseReads: 1,
        sessionReads: 1,
        previousEvidenceReads: 1,
        dirtyMarkerReads: 1,
        organizerConfigReads: organizerResolution.firestoreReadCount,
        av53PointReads: av53Result.pointReadDocumentBudget,
        sharedStaffRegistryLoaded: true,
        boundedReadsExcludingStaffRegistry:
          4
          + organizerResolution.firestoreReadCount
          + av53Result.pointReadDocumentBudget,
      },
    };
  },
);
