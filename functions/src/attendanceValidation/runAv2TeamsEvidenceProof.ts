import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import { MicrosoftGraphClient } from './microsoftGraphClient';
import { createOccurrenceSelectingTeamsEvidenceGraphClient } from './occurrenceSelectingGraphClient';
import {
  collectTeamsEvidence,
  type CanonicalAttendanceStatus,
  type ExpectedClassSessionSnapshot,
  type TeamsEvidenceCollectionRequest,
} from './teamsEvidenceCollector';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const AV2_PROOF_CONTRACT_VERSION = 1;
const MICROSOFT_TENANT_ID = defineSecret('MICROSOFT_TENANT_ID');
const MICROSOFT_CLIENT_ID = defineSecret('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = defineSecret('MICROSOFT_CLIENT_SECRET');

function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${name} is required.`);
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function attendanceStatus(value: unknown): CanonicalAttendanceStatus | null {
  if (value === null || value === undefined || value === '') return null;
  if (value === 'present' || value === 'absent' || value === 'rescheduled') return value;
  throw new TypeError('session.existingAttendanceStatus must be present, absent, rescheduled, or null.');
}

function parseSession(value: unknown): ExpectedClassSessionSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('session must be an object.');
  }
  const input = value as Record<string, unknown>;
  return {
    classSessionId: requiredText(input.classSessionId, 'session.classSessionId'),
    enrollmentId: optionalText(input.enrollmentId),
    teacherId: optionalText(input.teacherId),
    kidId: optionalText(input.kidId),
    courseId: optionalText(input.courseId),
    scheduledStartDateTime: requiredText(
      input.scheduledStartDateTime,
      'session.scheduledStartDateTime',
    ),
    scheduledEndDateTime: requiredText(
      input.scheduledEndDateTime,
      'session.scheduledEndDateTime',
    ),
    joinUrl: requiredText(input.joinUrl, 'session.joinUrl'),
    existingAttendanceStatus: attendanceStatus(input.existingAttendanceStatus),
  };
}

function parseRequestBody(value: unknown): TeamsEvidenceCollectionRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('JSON request body is required.');
  }
  const input = value as Record<string, unknown>;
  return {
    runId: requiredText(input.runId, 'runId'),
    organizerUserId: requiredText(input.organizerUserId, 'organizerUserId'),
    session: parseSession(input.session),
  };
}

/**
 * Private, manually invoked AV2.1 production-proof endpoint.
 *
 * IAM is private, the Microsoft credentials are bound only as Secret Manager secrets,
 * and the collector can write only through FirestoreAttendanceValidationEvidenceStore,
 * whose contract is limited to attendanceValidationRuns + attendanceValidationEvidence.
 * No transcript body, Teams join URL, participant email address, or Microsoft identity ID
 * is returned by this endpoint.
 */
export const runAv2TeamsEvidenceProof = onRequest({
  region: REGION,
  invoker: 'private',
  cors: false,
  timeoutSeconds: 60,
  maxInstances: 1,
  secrets: [
    MICROSOFT_TENANT_ID,
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
  ],
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  try {
    const request = parseRequestBody(req.body);
    const baseGraphClient = new MicrosoftGraphClient({
      credentials: {
        tenantId: MICROSOFT_TENANT_ID.value(),
        clientId: MICROSOFT_CLIENT_ID.value(),
        clientSecret: MICROSOFT_CLIENT_SECRET.value(),
      },
    });
    const graphClient = createOccurrenceSelectingTeamsEvidenceGraphClient(
      baseGraphClient,
      request.session,
    );
    const store = new FirestoreAttendanceValidationEvidenceStore(admin.firestore());
    const result = await collectTeamsEvidence(request, { graphClient, store });

    res.status(200).json({
      proofContractVersion: AV2_PROOF_CONTRACT_VERSION,
      ok: result.evidence.collectionStatus === 'complete',
      classSessionId: request.session.classSessionId,
      runId: result.run.id,
      evidenceId: result.evidence.id,
      collectionStatus: result.evidence.collectionStatus,
      meetingResolved: result.evidence.meeting !== null,
      selectedTranscriptCount: result.evidence.transcripts.length,
      selectedAttendanceReportCount: result.evidence.attendanceReports.length,
      selectedAttendanceRecordCount: result.evidence.attendanceReports.reduce(
        (sum, report) => sum + report.participantRecords.length,
        0,
      ),
      transcriptsComplete: result.evidence.completeness.transcriptsComplete,
      attendanceReportsComplete: result.evidence.completeness.attendanceReportsComplete,
      attendanceRecordsComplete: result.evidence.completeness.attendanceRecordsComplete,
      issueKinds: result.evidence.issues.map((issue) => issue.kind),
      operationalMutationAllowed: result.run.operationalMutationAllowed,
    });
  } catch (error) {
    logger.error('AV2.1 production proof failed.', {
      errorName: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : 'unknown',
    });
    res.status(500).json({ ok: false, error: 'av2_proof_failed' });
  }
});
