import { describe, expect, it } from 'vitest';
import {
  classifySessionProof,
  type Av5ClassificationDecision,
} from '../src/attendanceValidation/classificationEngine';
import type { Av4SessionProofResult } from '../src/attendanceValidation/sessionProofEngine';

function proof(overrides: Partial<Av4SessionProofResult> = {}): Av4SessionProofResult {
  return {
    schemaVersion: 1,
    brick: 'AV4',
    classSessionId: 'session-1',
    enrollmentId: 'enrollment-1',
    kidId: 'kid-1',
    teacherId: 'teacher-1',
    identitySessionReferenceMatches: true,
    correctSessionReference: true,
    attendanceReportMatchesScheduledWindow: true,
    correctOccurrenceResolved: true,
    confirmedNoTeamsOccurrence: false,
    expectedTeacherPresent: true,
    learnerSidePresent: true,
    attendanceEvidenceComplete: true,
    teacherScheduledSeconds: 2100,
    learnerSideScheduledSeconds: 1500,
    maxTeacherLearnerOverlapSeconds: 1500,
    maxTeacherLearnerScheduledOverlapPercentage: 71.43,
    meaningfulOverlapThresholdSeconds: 600,
    meaningfulTeacherLearnerOverlap: true,
    pairProofs: [],
    issues: [],
    operationalMutationAllowed: false,
    ...overrides,
  };
}

function expectDecision(
  value: Av4SessionProofResult,
  decision: Av5ClassificationDecision,
  reason: string,
) {
  const result = classifySessionProof(value);
  expect(result.decision).toBe(decision);
  expect(result.reasons).toContain(reason);
  expect(result.operationalMutationAllowed).toBe(false);
  expect(result.recommendedAttendanceOutcome).toBe(
    decision === 'present' || decision === 'absent' ? decision : null,
  );
  expect(result.requiresHumanReview).toBe(decision === 'review');
}

describe('AV5 classification engine', () => {
  it('classifies PRESENT only after verified teacher and learner-side meaningful overlap', () => {
    expectDecision(
      proof(),
      'present',
      'verified_teacher_learner_overlap',
    );
  });

  it('classifies ABSENT when complete verified occurrence has teacher but no learner-side participant', () => {
    expectDecision(
      proof({
        learnerSidePresent: false,
        learnerSideScheduledSeconds: 0,
        maxTeacherLearnerOverlapSeconds: 0,
        maxTeacherLearnerScheduledOverlapPercentage: 0,
        meaningfulTeacherLearnerOverlap: false,
        issues: ['learner_side_missing'],
      }),
      'absent',
      'verified_no_learner_side_participant',
    );
  });

  it('routes missing teacher to REVIEW rather than calling learner absent', () => {
    expectDecision(
      proof({
        expectedTeacherPresent: false,
        issues: ['expected_teacher_missing'],
      }),
      'review',
      'expected_teacher_not_verified',
    );
  });

  it('routes incomplete attendance evidence to REVIEW', () => {
    expectDecision(
      proof({
        attendanceEvidenceComplete: false,
        issues: ['attendance_evidence_incomplete'],
      }),
      'review',
      'attendance_evidence_incomplete',
    );
  });

  it('routes session identity mismatch to REVIEW', () => {
    expectDecision(
      proof({
        identitySessionReferenceMatches: false,
        correctSessionReference: false,
        issues: ['identity_session_mismatch'],
      }),
      'review',
      'session_reference_not_verified',
    );
  });

  it('classifies NOT_OCCURRED when Graph completely proves no matching Teams occurrence', () => {
    expectDecision(
      proof({
        attendanceReportMatchesScheduledWindow: false,
        correctOccurrenceResolved: false,
        confirmedNoTeamsOccurrence: true,
        expectedTeacherPresent: false,
        learnerSidePresent: false,
        attendanceEvidenceComplete: false,
        teacherScheduledSeconds: 0,
        learnerSideScheduledSeconds: 0,
        maxTeacherLearnerOverlapSeconds: 0,
        maxTeacherLearnerScheduledOverlapPercentage: 0,
        meaningfulTeacherLearnerOverlap: null,
        issues: ['no_teams_occurrence_confirmed'],
      }),
      'not_occurred',
      'verified_no_teams_occurrence',
    );
  });

  it('routes wrong or unresolved recurring occurrence to REVIEW', () => {
    expectDecision(
      proof({
        attendanceReportMatchesScheduledWindow: false,
        correctOccurrenceResolved: false,
        issues: ['attendance_report_window_mismatch', 'occurrence_not_resolved'],
      }),
      'review',
      'occurrence_not_verified',
    );
  });

  it('routes AV3 identity conflicts to REVIEW', () => {
    expectDecision(
      proof({
        issues: ['identity_requires_review'],
      }),
      'review',
      'identity_requires_review',
    );
  });

  it('routes uncalibrated meaningful-overlap threshold to REVIEW', () => {
    expectDecision(
      proof({
        meaningfulOverlapThresholdSeconds: null,
        meaningfulTeacherLearnerOverlap: null,
        issues: ['overlap_threshold_not_configured'],
      }),
      'review',
      'overlap_threshold_not_configured',
    );
  });

  it('routes too-short teacher learner overlap to REVIEW rather than ABSENT', () => {
    expectDecision(
      proof({
        maxTeacherLearnerOverlapSeconds: 60,
        meaningfulTeacherLearnerOverlap: false,
        issues: ['meaningful_overlap_not_met'],
      }),
      'review',
      'meaningful_overlap_not_met',
    );
  });

  it('keeps all decisions validation-only and never grants operational mutation', () => {
    for (const value of [
      proof(),
      proof({
        learnerSidePresent: false,
        meaningfulTeacherLearnerOverlap: false,
        issues: ['learner_side_missing'],
      }),
      proof({
        attendanceEvidenceComplete: false,
        issues: ['attendance_evidence_incomplete'],
      }),
    ]) {
      expect(classifySessionProof(value).operationalMutationAllowed).toBe(false);
    }
  });
});
