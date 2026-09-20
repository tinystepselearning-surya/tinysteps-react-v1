import type { Av5ClassificationResult } from './classificationEngine';

export const AV5_RECONCILIATION_SCHEMA_VERSION = 1;

export const AV5_RECONCILIATION_CLASSIFICATIONS = [
  'VERIFIED',
  'MISSING_ATTENDANCE',
  'ATTENDANCE_CONFLICT',
  'POSSIBLE_FALSE_PRESENT',
  'NO_CLASS_OCCURRED',
  'MISSING_TEAMS_EVIDENCE',
  'AMBIGUOUS',
] as const;

export type Av5ReconciliationClassification =
  (typeof AV5_RECONCILIATION_CLASSIFICATIONS)[number];

export type CanonicalTinyStepsAttendance =
  | 'present'
  | 'absent'
  | 'rescheduled';

export type Av5RecommendedAction =
  | 'none'
  | 'review'
  | 'correct_to_present'
  | 'correct_to_absent';

export type Av5ReconciliationStatus =
  | 'verified'
  | 'needs_review';

export type Av5ReconciliationReason =
  | 'stored_attendance_matches_validation'
  | 'stored_attendance_missing'
  | 'stored_attendance_conflicts_with_validation'
  | 'stored_reschedule_requires_review'
  | 'stored_present_not_supported_by_verified_evidence'
  | 'verified_no_class_occurrence'
  | 'stored_reschedule_consistent_with_no_occurrence'
  | 'teams_attendance_evidence_incomplete'
  | 'classification_requires_review';

export interface Av5ReconciliationResult {
  schemaVersion: typeof AV5_RECONCILIATION_SCHEMA_VERSION;
  brick: 'AV5.2';
  classSessionId: string;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  validationDecision: Av5ClassificationResult['decision'];
  tinyStepsAttendance: CanonicalTinyStepsAttendance | null;
  classification: Av5ReconciliationClassification;
  recommendedAction: Av5RecommendedAction;
  resolutionStatus: Av5ReconciliationStatus;
  reasons: Av5ReconciliationReason[];
  sourceClassificationReasons: Av5ClassificationResult['reasons'];
  operationalMutationAllowed: false;
}

function normalizeToken(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
}

function resolveStatusValue(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return (value as { status?: unknown }).status;
  }
  return value;
}

/**
 * Mirrors the AV0 canonical attendance vocabulary without mutating old records.
 *
 * - Late -> Present
 * - No show -> Absent
 * - Reschedule variants -> Rescheduled
 * - lifecycle values such as completed/scheduled/cancelled -> no attendance mark
 */
export function normalizeTinyStepsAttendance(
  value: unknown,
): CanonicalTinyStepsAttendance | null {
  const status = normalizeToken(resolveStatusValue(value));
  if (status === 'present' || status === 'late') return 'present';
  if (status === 'absent' || status === 'no_show' || status === 'noshow') {
    return 'absent';
  }
  if (
    status === 'rescheduled'
    || status === 'reschedule'
    || status === 'reschedule_requested'
    || status === 'rescheduled_requested'
  ) {
    return 'rescheduled';
  }
  return null;
}

function buildResult(
  classification: Av5ClassificationResult,
  tinyStepsAttendance: CanonicalTinyStepsAttendance | null,
  caseClassification: Av5ReconciliationClassification,
  recommendedAction: Av5RecommendedAction,
  resolutionStatus: Av5ReconciliationStatus,
  reasons: Av5ReconciliationReason[],
): Av5ReconciliationResult {
  return {
    schemaVersion: AV5_RECONCILIATION_SCHEMA_VERSION,
    brick: 'AV5.2',
    classSessionId: classification.classSessionId,
    enrollmentId: classification.enrollmentId,
    kidId: classification.kidId,
    teacherId: classification.teacherId,
    validationDecision: classification.decision,
    tinyStepsAttendance,
    classification: caseClassification,
    recommendedAction,
    resolutionStatus,
    reasons: [...new Set(reasons)],
    sourceClassificationReasons: [...classification.reasons],
    operationalMutationAllowed: false,
  };
}

function reviewHasPresentConcern(
  classification: Av5ClassificationResult,
): boolean {
  const unresolvedEvidence =
    classification.reasons.includes('occurrence_not_verified')
    || classification.reasons.includes('attendance_evidence_incomplete');
  if (unresolvedEvidence) return false;

  return classification.reasons.some((reason) =>
    reason === 'expected_teacher_not_verified'
    || reason === 'meaningful_overlap_not_met');
}

function reviewIsMissingTeamsEvidence(
  classification: Av5ClassificationResult,
): boolean {
  return classification.reasons.includes('occurrence_not_verified')
    || classification.reasons.includes('attendance_evidence_incomplete');
}

/**
 * AV5.2 reconciles an AV5 validation recommendation with the existing Tiny Steps
 * attendance mark. It creates a deterministic sidecar case classification only.
 *
 * It deliberately does not emit ORPHAN_TEAMS_CLASS because this function starts
 * from a matched Tiny Steps classSession. Orphan detection belongs to the batch
 * matching stage that compares Teams artifacts against the expected-session set.
 *
 * Rescheduled is treated conservatively for Present/Absent recommendations. A
 * verified no-occurrence result is consistent with either an unmarked slot or a
 * stored Rescheduled slot and requires no attendance correction. AV5.2 never
 * rewrites reschedule state or credits.
 */
export function reconcileAttendanceClassification(
  classification: Av5ClassificationResult,
  rawTinyStepsAttendance: unknown,
): Av5ReconciliationResult {
  const tinyStepsAttendance = normalizeTinyStepsAttendance(rawTinyStepsAttendance);

  if (classification.decision === 'present') {
    if (tinyStepsAttendance === 'present') {
      return buildResult(
        classification,
        tinyStepsAttendance,
        'VERIFIED',
        'none',
        'verified',
        ['stored_attendance_matches_validation'],
      );
    }

    if (tinyStepsAttendance === null) {
      return buildResult(
        classification,
        null,
        'MISSING_ATTENDANCE',
        'correct_to_present',
        'needs_review',
        ['stored_attendance_missing'],
      );
    }

    if (tinyStepsAttendance === 'rescheduled') {
      return buildResult(
        classification,
        tinyStepsAttendance,
        'ATTENDANCE_CONFLICT',
        'review',
        'needs_review',
        [
          'stored_attendance_conflicts_with_validation',
          'stored_reschedule_requires_review',
        ],
      );
    }

    return buildResult(
      classification,
      tinyStepsAttendance,
      'ATTENDANCE_CONFLICT',
      'correct_to_present',
      'needs_review',
      ['stored_attendance_conflicts_with_validation'],
    );
  }

  if (classification.decision === 'not_occurred') {
    if (tinyStepsAttendance === null) {
      return buildResult(
        classification,
        null,
        'NO_CLASS_OCCURRED',
        'none',
        'verified',
        ['verified_no_class_occurrence'],
      );
    }

    if (tinyStepsAttendance === 'rescheduled') {
      return buildResult(
        classification,
        tinyStepsAttendance,
        'NO_CLASS_OCCURRED',
        'none',
        'verified',
        ['stored_reschedule_consistent_with_no_occurrence'],
      );
    }

    if (tinyStepsAttendance === 'present') {
      return buildResult(
        classification,
        tinyStepsAttendance,
        'POSSIBLE_FALSE_PRESENT',
        'review',
        'needs_review',
        ['stored_present_not_supported_by_verified_evidence'],
      );
    }

    return buildResult(
      classification,
      tinyStepsAttendance,
      'ATTENDANCE_CONFLICT',
      'review',
      'needs_review',
      ['stored_attendance_conflicts_with_validation'],
    );
  }

  if (classification.decision === 'absent') {
    if (tinyStepsAttendance === 'absent') {
      return buildResult(
        classification,
        tinyStepsAttendance,
        'VERIFIED',
        'none',
        'verified',
        ['stored_attendance_matches_validation'],
      );
    }

    if (tinyStepsAttendance === null) {
      return buildResult(
        classification,
        null,
        'MISSING_ATTENDANCE',
        'correct_to_absent',
        'needs_review',
        ['stored_attendance_missing'],
      );
    }

    if (tinyStepsAttendance === 'present') {
      return buildResult(
        classification,
        tinyStepsAttendance,
        'POSSIBLE_FALSE_PRESENT',
        'correct_to_absent',
        'needs_review',
        ['stored_present_not_supported_by_verified_evidence'],
      );
    }

    return buildResult(
      classification,
      tinyStepsAttendance,
      'ATTENDANCE_CONFLICT',
      'review',
      'needs_review',
      [
        'stored_attendance_conflicts_with_validation',
        'stored_reschedule_requires_review',
      ],
    );
  }

  // REVIEW never recommends an attendance correction. It only classifies why
  // the sidecar cannot safely verify the operational status.
  if (
    tinyStepsAttendance === 'present'
    && reviewHasPresentConcern(classification)
  ) {
    return buildResult(
      classification,
      tinyStepsAttendance,
      'POSSIBLE_FALSE_PRESENT',
      'review',
      'needs_review',
      ['stored_present_not_supported_by_verified_evidence'],
    );
  }

  if (reviewIsMissingTeamsEvidence(classification)) {
    return buildResult(
      classification,
      tinyStepsAttendance,
      'MISSING_TEAMS_EVIDENCE',
      'review',
      'needs_review',
      ['teams_attendance_evidence_incomplete'],
    );
  }

  return buildResult(
    classification,
    tinyStepsAttendance,
    'AMBIGUOUS',
    'review',
    'needs_review',
    ['classification_requires_review'],
  );
}
