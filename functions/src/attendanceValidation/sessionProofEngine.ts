import {
  calculatePairOverlapMetrics,
  type PairOverlapMetrics,
} from './evidenceIntervals';
import type { GraphAttendanceInterval } from './microsoftGraphClient';
import type {
  AttendanceParticipantEvidence,
  AttendanceValidationEvidenceDocument,
} from './teamsEvidenceCollector';
import type {
  Av3EnrollmentIdentityResult,
  Av3ParticipantIdentityResult,
} from './enrollmentIdentityBridge';

export const AV4_PROOF_SCHEMA_VERSION = 1;

export type Av4ProofIssueKind =
  | 'session_reference_incomplete'
  | 'occurrence_not_resolved'
  | 'unexpected_attendance_report_count'
  | 'expected_teacher_missing'
  | 'learner_side_missing'
  | 'identity_requires_review'
  | 'attendance_evidence_incomplete'
  | 'overlap_threshold_not_configured'
  | 'meaningful_overlap_not_met';

export interface Av4SessionProofConfig {
  meaningfulOverlapSeconds: number | null;
}

export interface Av4TeacherLearnerPairProof {
  teacherParticipantRecordId: string;
  learnerParticipantRecordId: string;
  overlap: PairOverlapMetrics;
}

export interface Av4SessionProofResult {
  schemaVersion: typeof AV4_PROOF_SCHEMA_VERSION;
  brick: 'AV4';
  classSessionId: string;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  correctSessionReference: boolean;
  correctOccurrenceResolved: boolean;
  expectedTeacherPresent: boolean;
  learnerSidePresent: boolean;
  attendanceEvidenceComplete: boolean;
  teacherScheduledSeconds: number;
  learnerSideScheduledSeconds: number;
  maxTeacherLearnerOverlapSeconds: number;
  maxTeacherLearnerScheduledOverlapPercentage: number;
  meaningfulOverlapThresholdSeconds: number | null;
  meaningfulTeacherLearnerOverlap: boolean | null;
  pairProofs: Av4TeacherLearnerPairProof[];
  issues: Av4ProofIssueKind[];
  operationalMutationAllowed: false;
}

function uniqueIssues(issues: Av4ProofIssueKind[]): Av4ProofIssueKind[] {
  return [...new Set(issues)];
}

function participantsByClassification(
  evidence: AttendanceValidationEvidenceDocument,
  identity: Av3EnrollmentIdentityResult,
  classification: Av3ParticipantIdentityResult['classification'],
): AttendanceParticipantEvidence[] {
  const wantedIds = new Set(
    identity.participantClassifications
      .filter((item) => item.classification === classification)
      .map((item) => item.participantRecordId),
  );

  return evidence.attendanceReports
    .flatMap((report) => report.participantRecords)
    .filter((participant) => wantedIds.has(participant.participantRecordId));
}

function sumScheduledSeconds(participants: readonly AttendanceParticipantEvidence[]): number {
  return Math.round(
    participants.reduce((sum, participant) => sum + participant.metrics.scheduledSeconds, 0) * 1000,
  ) / 1000;
}

function toGraphIntervals(participant: AttendanceParticipantEvidence): GraphAttendanceInterval[] {
  return participant.rawAttendanceIntervals.map((interval) => ({
    joinDateTime: interval.joinDateTime ?? undefined,
    leaveDateTime: interval.leaveDateTime ?? undefined,
    durationInSeconds: interval.durationInSeconds ?? undefined,
  }));
}

function evidenceComplete(evidence: AttendanceValidationEvidenceDocument): boolean {
  return evidence.collectionStatus === 'complete'
    && evidence.completeness.attendanceReportsComplete
    && evidence.completeness.attendanceRecordsComplete
    && evidence.issues.length === 0;
}

/**
 * AV4 computes session proof from AV2/AV2.1 evidence plus the deterministic AV3 identity bridge.
 *
 * It does not decide Present/Absent. The overlap threshold is explicitly injected so AV8 can
 * calibrate it using real classes before AV5 relies on it. A null threshold intentionally leaves
 * meaningfulTeacherLearnerOverlap undecided instead of guessing.
 */
export function buildSessionProof(
  evidence: AttendanceValidationEvidenceDocument,
  identity: Av3EnrollmentIdentityResult,
  config: Av4SessionProofConfig = { meaningfulOverlapSeconds: null },
): Av4SessionProofResult {
  const issues: Av4ProofIssueKind[] = [];

  const correctSessionReference = Boolean(
    evidence.session.classSessionId
      && evidence.session.enrollmentId
      && evidence.session.kidId
      && evidence.session.teacherId,
  );
  if (!correctSessionReference) issues.push('session_reference_incomplete');

  const correctOccurrenceResolved = Boolean(
    evidence.meeting
      && evidence.attendanceReports.length === 1,
  );
  if (!evidence.meeting) issues.push('occurrence_not_resolved');
  if (evidence.attendanceReports.length !== 1) {
    issues.push('unexpected_attendance_report_count');
  }

  const expectedTeacherPresent = identity.expectedTeacherPresent;
  const learnerSidePresent = identity.learnerSidePresent;
  if (!expectedTeacherPresent) issues.push('expected_teacher_missing');
  if (!learnerSidePresent) issues.push('learner_side_missing');
  if (identity.identityConfidence !== 'verified') issues.push('identity_requires_review');

  const attendanceEvidenceComplete = evidenceComplete(evidence);
  if (!attendanceEvidenceComplete) issues.push('attendance_evidence_incomplete');

  const teacherParticipants = participantsByClassification(
    evidence,
    identity,
    'expected_teacher',
  );
  const learnerParticipants = participantsByClassification(
    evidence,
    identity,
    'learner_side',
  );

  const pairProofs: Av4TeacherLearnerPairProof[] = [];
  for (const teacher of teacherParticipants) {
    for (const learner of learnerParticipants) {
      const overlap = calculatePairOverlapMetrics(
        toGraphIntervals(teacher),
        toGraphIntervals(learner),
        evidence.session.scheduledStartDateTime,
        evidence.session.scheduledEndDateTime,
      );
      pairProofs.push({
        teacherParticipantRecordId: teacher.participantRecordId,
        learnerParticipantRecordId: learner.participantRecordId,
        overlap,
      });
    }
  }

  const maxTeacherLearnerOverlapSeconds = pairProofs.reduce(
    (max, pair) => Math.max(max, pair.overlap.scheduledOverlapSeconds),
    0,
  );
  const maxTeacherLearnerScheduledOverlapPercentage = pairProofs.reduce(
    (max, pair) => Math.max(max, pair.overlap.scheduledOverlapPercentage),
    0,
  );

  let meaningfulTeacherLearnerOverlap: boolean | null = null;
  const threshold = config.meaningfulOverlapSeconds;
  if (threshold === null) {
    issues.push('overlap_threshold_not_configured');
  } else {
    if (!Number.isFinite(threshold) || threshold < 0) {
      throw new RangeError('meaningfulOverlapSeconds must be null or a finite non-negative number.');
    }
    meaningfulTeacherLearnerOverlap = maxTeacherLearnerOverlapSeconds >= threshold;
    if (!meaningfulTeacherLearnerOverlap) issues.push('meaningful_overlap_not_met');
  }

  return {
    schemaVersion: AV4_PROOF_SCHEMA_VERSION,
    brick: 'AV4',
    classSessionId: evidence.session.classSessionId,
    enrollmentId: evidence.session.enrollmentId,
    kidId: evidence.session.kidId,
    teacherId: evidence.session.teacherId,
    correctSessionReference,
    correctOccurrenceResolved,
    expectedTeacherPresent,
    learnerSidePresent,
    attendanceEvidenceComplete,
    teacherScheduledSeconds: sumScheduledSeconds(teacherParticipants),
    learnerSideScheduledSeconds: sumScheduledSeconds(learnerParticipants),
    maxTeacherLearnerOverlapSeconds,
    maxTeacherLearnerScheduledOverlapPercentage,
    meaningfulOverlapThresholdSeconds: threshold,
    meaningfulTeacherLearnerOverlap,
    pairProofs,
    issues: uniqueIssues(issues),
    operationalMutationAllowed: false,
  };
}
