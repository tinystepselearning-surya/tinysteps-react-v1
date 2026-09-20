import {
  AV4_PROOF_SCHEMA_VERSION,
  type Av4ProofIssueKind,
  type Av4SessionProofResult,
} from './sessionProofEngine';

export const AV5_CLASSIFICATION_SCHEMA_VERSION = 1;

export const AV5_CLASSIFICATION_DECISIONS = [
  'present',
  'absent',
  'not_occurred',
  'review',
] as const;

export type Av5ClassificationDecision =
  (typeof AV5_CLASSIFICATION_DECISIONS)[number];

export type Av5ClassificationReason =
  | 'verified_teacher_learner_overlap'
  | 'verified_no_learner_side_participant'
  | 'verified_no_teams_occurrence'
  | 'session_reference_not_verified'
  | 'occurrence_not_verified'
  | 'identity_requires_review'
  | 'expected_teacher_not_verified'
  | 'attendance_evidence_incomplete'
  | 'overlap_threshold_not_configured'
  | 'meaningful_overlap_not_met'
  | 'unsupported_av4_schema';

export interface Av5ClassificationResult {
  schemaVersion: typeof AV5_CLASSIFICATION_SCHEMA_VERSION;
  brick: 'AV5';
  sourceProofSchemaVersion: number;
  classSessionId: string;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  decision: Av5ClassificationDecision;
  recommendedAttendanceOutcome: 'present' | 'absent' | null;
  requiresHumanReview: boolean;
  reasons: Av5ClassificationReason[];
  proofIssues: Av4ProofIssueKind[];
  operationalMutationAllowed: false;
}

function result(
  proof: Av4SessionProofResult,
  decision: Av5ClassificationDecision,
  reasons: Av5ClassificationReason[],
): Av5ClassificationResult {
  return {
    schemaVersion: AV5_CLASSIFICATION_SCHEMA_VERSION,
    brick: 'AV5',
    sourceProofSchemaVersion: proof.schemaVersion,
    classSessionId: proof.classSessionId,
    enrollmentId: proof.enrollmentId,
    kidId: proof.kidId,
    teacherId: proof.teacherId,
    decision,
    recommendedAttendanceOutcome:
      decision === 'present' || decision === 'absent' ? decision : null,
    requiresHumanReview: decision === 'review',
    reasons: [...new Set(reasons)],
    proofIssues: [...proof.issues],
    operationalMutationAllowed: false,
  };
}

/**
 * AV5 converts an AV4 session proof into one deterministic validation decision.
 *
 * Decision order intentionally fails closed:
 * - unsafe/mismatched session identity -> REVIEW
 * - unresolved recurring occurrence -> REVIEW
 * - identity uncertainty -> REVIEW
 * - expected teacher missing -> REVIEW
 * - incomplete attendance evidence -> REVIEW
 * - complete teacher-side evidence with no learner-side participant -> ABSENT
 * - learner-side participant present but overlap threshold unavailable -> REVIEW
 * - learner-side participant present but meaningful overlap not met -> REVIEW
 * - verified teacher + learner-side meaningful overlap -> PRESENT
 *
 * PRESENT/ABSENT are validation recommendations only. This function never writes
 * operational attendance, finance, teacher earnings, credits, or reschedule data.
 */
export function classifySessionProof(
  proof: Av4SessionProofResult,
): Av5ClassificationResult {
  if (proof.schemaVersion !== AV4_PROOF_SCHEMA_VERSION) {
    return result(proof, 'review', ['unsupported_av4_schema']);
  }

  if (!proof.correctSessionReference || !proof.identitySessionReferenceMatches) {
    return result(proof, 'review', ['session_reference_not_verified']);
  }

  if (proof.confirmedNoTeamsOccurrence) {
    return result(proof, 'not_occurred', ['verified_no_teams_occurrence']);
  }

  if (
    !proof.correctOccurrenceResolved
    || !proof.attendanceReportMatchesScheduledWindow
  ) {
    return result(proof, 'review', ['occurrence_not_verified']);
  }

  if (proof.issues.includes('identity_requires_review')) {
    return result(proof, 'review', ['identity_requires_review']);
  }

  if (!proof.expectedTeacherPresent) {
    return result(proof, 'review', ['expected_teacher_not_verified']);
  }

  if (!proof.attendanceEvidenceComplete) {
    return result(proof, 'review', ['attendance_evidence_incomplete']);
  }

  // Once session, occurrence, identity, teacher and attendance completeness are
  // verified, the absence of any learner-side participant is deterministic
  // learner-side non-participation for this selected occurrence. No overlap
  // threshold is needed because there is no learner-side interval to calibrate.
  if (!proof.learnerSidePresent) {
    return result(proof, 'absent', ['verified_no_learner_side_participant']);
  }

  if (
    proof.meaningfulOverlapThresholdSeconds === null
    || proof.meaningfulTeacherLearnerOverlap === null
  ) {
    return result(proof, 'review', ['overlap_threshold_not_configured']);
  }

  if (!proof.meaningfulTeacherLearnerOverlap) {
    return result(proof, 'review', ['meaningful_overlap_not_met']);
  }

  return result(proof, 'present', ['verified_teacher_learner_overlap']);
}
