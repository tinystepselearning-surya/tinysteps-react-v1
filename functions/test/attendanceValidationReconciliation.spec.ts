import { describe, expect, it } from 'vitest';
import {
  normalizeTinyStepsAttendance,
  reconcileAttendanceClassification,
} from '../src/attendanceValidation/reconciliationEngine';
import type { Av5ClassificationResult } from '../src/attendanceValidation/classificationEngine';

function classification(
  decision: Av5ClassificationResult['decision'],
  reason: Av5ClassificationResult['reasons'][number],
): Av5ClassificationResult {
  return {
    schemaVersion: 1,
    brick: 'AV5',
    sourceProofSchemaVersion: 1,
    classSessionId: 'session-1',
    enrollmentId: 'enrollment-1',
    kidId: 'kid-1',
    teacherId: 'teacher-1',
    decision,
    recommendedAttendanceOutcome: decision === 'review' ? null : decision,
    requiresHumanReview: decision === 'review',
    reasons: [reason],
    proofIssues: [],
    operationalMutationAllowed: false,
  };
}

describe('AV5.2 reconciliation engine', () => {
  it('normalizes the AV0 canonical attendance vocabulary without rewriting data', () => {
    expect(normalizeTinyStepsAttendance('present')).toBe('present');
    expect(normalizeTinyStepsAttendance('late')).toBe('present');
    expect(normalizeTinyStepsAttendance({ status: 'late' })).toBe('present');
    expect(normalizeTinyStepsAttendance('absent')).toBe('absent');
    expect(normalizeTinyStepsAttendance('no_show')).toBe('absent');
    expect(normalizeTinyStepsAttendance('rescheduled')).toBe('rescheduled');
    expect(normalizeTinyStepsAttendance('reschedule_requested')).toBe('rescheduled');
    expect(normalizeTinyStepsAttendance('completed')).toBeNull();
    expect(normalizeTinyStepsAttendance('scheduled')).toBeNull();
  });

  it('VERIFIED when stored Present matches verified AV5 Present', () => {
    const result = reconcileAttendanceClassification(
      classification('present', 'verified_teacher_learner_overlap'),
      'present',
    );

    expect(result.classification).toBe('VERIFIED');
    expect(result.recommendedAction).toBe('none');
    expect(result.resolutionStatus).toBe('verified');
    expect(result.operationalMutationAllowed).toBe(false);
  });

  it('VERIFIED when historical Late matches verified AV5 Present', () => {
    const result = reconcileAttendanceClassification(
      classification('present', 'verified_teacher_learner_overlap'),
      'late',
    );

    expect(result.tinyStepsAttendance).toBe('present');
    expect(result.classification).toBe('VERIFIED');
  });

  it('MISSING_ATTENDANCE with correction recommendation when AV5 proves Present but Tiny Steps is unmarked', () => {
    const result = reconcileAttendanceClassification(
      classification('present', 'verified_teacher_learner_overlap'),
      null,
    );

    expect(result.classification).toBe('MISSING_ATTENDANCE');
    expect(result.recommendedAction).toBe('correct_to_present');
    expect(result.resolutionStatus).toBe('needs_review');
  });

  it('ATTENDANCE_CONFLICT when AV5 proves Present but Tiny Steps says Absent', () => {
    const result = reconcileAttendanceClassification(
      classification('present', 'verified_teacher_learner_overlap'),
      'absent',
    );

    expect(result.classification).toBe('ATTENDANCE_CONFLICT');
    expect(result.recommendedAction).toBe('correct_to_present');
  });

  it('does not override Rescheduled when AV5 evidence suggests Present', () => {
    const result = reconcileAttendanceClassification(
      classification('present', 'verified_teacher_learner_overlap'),
      'rescheduled',
    );

    expect(result.classification).toBe('ATTENDANCE_CONFLICT');
    expect(result.recommendedAction).toBe('review');
    expect(result.reasons).toContain('stored_reschedule_requires_review');
  });

  it('VERIFIED when stored Absent matches verified AV5 Absent', () => {
    const result = reconcileAttendanceClassification(
      classification('absent', 'verified_no_learner_side_participant'),
      'absent',
    );

    expect(result.classification).toBe('VERIFIED');
    expect(result.recommendedAction).toBe('none');
    expect(result.resolutionStatus).toBe('verified');
  });

  it('MISSING_ATTENDANCE when AV5 proves Absent but Tiny Steps is unmarked', () => {
    const result = reconcileAttendanceClassification(
      classification('absent', 'verified_no_learner_side_participant'),
      undefined,
    );

    expect(result.classification).toBe('MISSING_ATTENDANCE');
    expect(result.recommendedAction).toBe('correct_to_absent');
  });

  it('POSSIBLE_FALSE_PRESENT when Tiny Steps says Present but AV5 safely proves Absent', () => {
    const result = reconcileAttendanceClassification(
      classification('absent', 'verified_no_learner_side_participant'),
      'present',
    );

    expect(result.classification).toBe('POSSIBLE_FALSE_PRESENT');
    expect(result.recommendedAction).toBe('correct_to_absent');
    expect(result.resolutionStatus).toBe('needs_review');
  });

  it('does not auto-change a stored Rescheduled value when AV5 proves Absent', () => {
    const result = reconcileAttendanceClassification(
      classification('absent', 'verified_no_learner_side_participant'),
      'rescheduled',
    );

    expect(result.classification).toBe('ATTENDANCE_CONFLICT');
    expect(result.recommendedAction).toBe('review');
  });

  it('MISSING_TEAMS_EVIDENCE when stored Present exists but Teams evidence is incomplete', () => {
    const result = reconcileAttendanceClassification(
      classification('review', 'attendance_evidence_incomplete'),
      'present',
    );

    expect(result.classification).toBe('MISSING_TEAMS_EVIDENCE');
    expect(result.recommendedAction).toBe('review');
  });

  it('MISSING_TEAMS_EVIDENCE when attendance evidence is incomplete and stored attendance is not Present', () => {
    const result = reconcileAttendanceClassification(
      classification('review', 'attendance_evidence_incomplete'),
      'absent',
    );

    expect(result.classification).toBe('MISSING_TEAMS_EVIDENCE');
    expect(result.recommendedAction).toBe('review');
  });

  it('MISSING_TEAMS_EVIDENCE when the Teams occurrence is unresolved even if Tiny Steps says Present', () => {
    const result = reconcileAttendanceClassification(
      classification('review', 'occurrence_not_verified'),
      'present',
    );

    expect(result.classification).toBe('MISSING_TEAMS_EVIDENCE');
    expect(result.recommendedAction).toBe('review');
  });

  it('routes identity uncertainty to AMBIGUOUS without correction recommendation', () => {
    const result = reconcileAttendanceClassification(
      classification('review', 'identity_requires_review'),
      'present',
    );

    expect(result.classification).toBe('AMBIGUOUS');
    expect(result.recommendedAction).toBe('review');
    expect(result.resolutionStatus).toBe('needs_review');
  });

  it('routes short overlap with stored Present to POSSIBLE_FALSE_PRESENT, never automatic Absent', () => {
    const result = reconcileAttendanceClassification(
      classification('review', 'meaningful_overlap_not_met'),
      'present',
    );

    expect(result.classification).toBe('POSSIBLE_FALSE_PRESENT');
    expect(result.recommendedAction).toBe('review');
    expect(result.validationDecision).toBe('review');
  });

  it('preserves source classification reasons and never permits operational mutation', () => {
    const input = classification('review', 'occurrence_not_verified');
    const result = reconcileAttendanceClassification(input, 'present');

    expect(result.sourceClassificationReasons).toEqual(['occurrence_not_verified']);
    expect(result.operationalMutationAllowed).toBe(false);
  });
});
