import { describe, expect, it } from 'vitest';
import { buildSessionProof } from '../src/attendanceValidation/sessionProofEngine';
import type { AttendanceValidationEvidenceDocument } from '../src/attendanceValidation/teamsEvidenceCollector';
import type { Av3EnrollmentIdentityResult } from '../src/attendanceValidation/enrollmentIdentityBridge';

function participant(
  id: string,
  start: string,
  end: string,
  scheduledSeconds: number,
) {
  return {
    participantRecordId: id,
    role: 'attendee',
    emailAddressHash: null,
    identityHints: [],
    microsoftTotalAttendanceInSeconds: scheduledSeconds,
    rawAttendanceIntervals: [
      {
        joinDateTime: start,
        leaveDateTime: end,
        durationInSeconds: scheduledSeconds,
      },
    ],
    metrics: {
      sourceIntervalCount: 1,
      validSourceIntervalCount: 1,
      invalidSourceIntervalCount: 0,
      normalizedIntervalCount: 1,
      normalizedIntervals: [
        {
          startDateTime: start,
          endDateTime: end,
          durationInSeconds: scheduledSeconds,
        },
      ],
      observedSeconds: scheduledSeconds,
      scheduledSeconds,
      scheduledDwellPercentage: Math.round((scheduledSeconds / 2100) * 10000) / 100,
      firstJoinDateTime: start,
      lastLeaveDateTime: end,
      invalidReasons: {
        missing_join: 0,
        missing_leave: 0,
        invalid_join: 0,
        invalid_leave: 0,
        non_positive_interval: 0,
      },
    },
  };
}

function evidence(): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 1,
    id: 'evidence-1',
    runId: 'run-1',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-17T10:00:00.000Z',
    organizerUserId: 'organizer',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-17T09:00:00.000Z',
      scheduledEndDateTime: '2026-09-17T09:35:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: null,
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: '2026-09-17T09:00:00.000Z',
      endDateTime: '2026-09-17T09:35:00.000Z',
      creationDateTime: '2026-09-01T00:00:00.000Z',
      meetingType: 'recurring',
    },
    transcripts: [],
    attendanceReports: [
      {
        reportId: 'report-1',
        meetingStartDateTime: '2026-09-17T09:00:00.000Z',
        meetingEndDateTime: '2026-09-17T09:35:00.000Z',
        totalParticipantCount: 2,
        recordsComplete: true,
        nextRecordsPagePresent: false,
        recordsIssue: null,
        participantRecords: [
          participant(
            'teacher-record',
            '2026-09-17T09:00:00.000Z',
            '2026-09-17T09:35:00.000Z',
            2100,
          ),
          participant(
            'learner-record',
            '2026-09-17T09:05:00.000Z',
            '2026-09-17T09:30:00.000Z',
            1500,
          ),
        ],
      },
    ],
    completeness: {
      transcriptsComplete: true,
      attendanceReportsComplete: true,
      attendanceRecordsComplete: true,
      nextTranscriptPagePresent: false,
      nextAttendanceReportPagePresent: false,
    },
    artifactAvailability: {
      transcriptAvailable: false,
      attendanceReportAvailable: true,
      recordingAvailable: null,
    },
    issues: [],
  };
}

function identity(): Av3EnrollmentIdentityResult {
  return {
    schemaVersion: 1,
    brick: 'AV3',
    classSessionId: 'session-1',
    enrollmentId: 'enrollment-1',
    kidId: 'kid-1',
    teacherId: 'teacher-1',
    expectedTeacherPresent: true,
    learnerSidePresent: true,
    unexpectedStaffPresent: false,
    unexpectedStaffCount: 0,
    learnerSideParticipantCount: 1,
    identityConfidence: 'verified',
    issues: [],
    participantClassifications: [
      {
        participantRecordId: 'teacher-record',
        classification: 'expected_teacher',
        matchedStaffIds: ['teacher-1'],
      },
      {
        participantRecordId: 'learner-record',
        classification: 'learner_side',
        matchedStaffIds: [],
      },
    ],
  };
}

describe('AV4 session proof engine', () => {
  it('computes teacher learner overlap without deciding attendance', () => {
    const result = buildSessionProof(evidence(), identity(), {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.identitySessionReferenceMatches).toBe(true);
    expect(result.correctSessionReference).toBe(true);
    expect(result.attendanceReportMatchesScheduledWindow).toBe(true);
    expect(result.correctOccurrenceResolved).toBe(true);
    expect(result.expectedTeacherPresent).toBe(true);
    expect(result.learnerSidePresent).toBe(true);
    expect(result.attendanceEvidenceComplete).toBe(true);
    expect(result.teacherScheduledSeconds).toBe(2100);
    expect(result.learnerSideScheduledSeconds).toBe(1500);
    expect(result.maxTeacherLearnerOverlapSeconds).toBe(1500);
    expect(result.maxTeacherLearnerScheduledOverlapPercentage).toBeCloseTo(71.43, 2);
    expect(result.meaningfulTeacherLearnerOverlap).toBe(true);
    expect(result.operationalMutationAllowed).toBe(false);
    expect(result.issues).toEqual([]);
  });

  it('rejects an AV3 identity result from a different session or enrollment', () => {
    const mismatchedIdentity = identity();
    mismatchedIdentity.classSessionId = 'session-other';
    mismatchedIdentity.enrollmentId = 'enrollment-other';

    const result = buildSessionProof(evidence(), mismatchedIdentity, {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.identitySessionReferenceMatches).toBe(false);
    expect(result.correctSessionReference).toBe(false);
    expect(result.issues).toContain('identity_session_mismatch');
  });

  it('requires the selected attendance report to overlap the scheduled class window', () => {
    const wrongOccurrenceEvidence = evidence();
    wrongOccurrenceEvidence.attendanceReports[0].meetingStartDateTime =
      '2026-09-17T11:00:00.000Z';
    wrongOccurrenceEvidence.attendanceReports[0].meetingEndDateTime =
      '2026-09-17T11:35:00.000Z';

    const result = buildSessionProof(wrongOccurrenceEvidence, identity(), {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.attendanceReportMatchesScheduledWindow).toBe(false);
    expect(result.correctOccurrenceResolved).toBe(false);
    expect(result.issues).toContain('attendance_report_window_mismatch');
    expect(result.issues).toContain('occurrence_not_resolved');
  });

  it('requires exactly one selected attendance report and treats missing selection as incomplete', () => {
    const noReportEvidence = evidence();
    noReportEvidence.attendanceReports = [];

    const result = buildSessionProof(noReportEvidence, identity(), {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.correctOccurrenceResolved).toBe(false);
    expect(result.attendanceEvidenceComplete).toBe(false);
    expect(result.issues).toContain('unexpected_attendance_report_count');
    expect(result.issues).toContain('attendance_evidence_incomplete');
  });

  it('does not make transcript-only collection issues invalidate attendance completeness', () => {
    const transcriptIssueEvidence = evidence();
    transcriptIssueEvidence.collectionStatus = 'partial';
    transcriptIssueEvidence.completeness.transcriptsComplete = false;
    transcriptIssueEvidence.issues.push({
      stage: 'transcripts',
      reportId: null,
      kind: 'unexpected_error',
      httpStatus: null,
      graphCode: null,
      innerCode: null,
      retryAfterMs: null,
    });

    const result = buildSessionProof(transcriptIssueEvidence, identity(), {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.attendanceEvidenceComplete).toBe(true);
    expect(result.issues).not.toContain('attendance_evidence_incomplete');
  });

  it('marks attendance incomplete when attendance records are incomplete', () => {
    const incompleteEvidence = evidence();
    incompleteEvidence.collectionStatus = 'partial';
    incompleteEvidence.completeness.attendanceRecordsComplete = false;
    incompleteEvidence.attendanceReports[0].recordsComplete = false;

    const result = buildSessionProof(incompleteEvidence, identity(), {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.attendanceEvidenceComplete).toBe(false);
    expect(result.issues).toContain('attendance_evidence_incomplete');
  });

  it('routes identity-conflicted evidence toward review signals', () => {
    const reviewIdentity = identity();
    reviewIdentity.identityConfidence = 'review';
    reviewIdentity.expectedTeacherPresent = false;

    const result = buildSessionProof(evidence(), reviewIdentity, {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.expectedTeacherPresent).toBe(false);
    expect(result.issues).toContain('expected_teacher_missing');
    expect(result.issues).toContain('identity_requires_review');
  });

  it('leaves meaningful overlap undecided until calibration supplies a threshold', () => {
    const result = buildSessionProof(evidence(), identity());

    expect(result.meaningfulOverlapThresholdSeconds).toBeNull();
    expect(result.meaningfulTeacherLearnerOverlap).toBeNull();
    expect(result.issues).toContain('overlap_threshold_not_configured');
  });

  it('flags too-short teacher learner overlap against an injected threshold', () => {
    const shortEvidence = evidence();
    shortEvidence.attendanceReports[0].participantRecords[1] = participant(
      'learner-record',
      '2026-09-17T09:34:00.000Z',
      '2026-09-17T09:35:00.000Z',
      60,
    );

    const result = buildSessionProof(shortEvidence, identity(), {
      meaningfulOverlapSeconds: 600,
    });

    expect(result.maxTeacherLearnerOverlapSeconds).toBe(60);
    expect(result.meaningfulTeacherLearnerOverlap).toBe(false);
    expect(result.issues).toContain('meaningful_overlap_not_met');
  });

  it('rejects an invalid calibrated overlap threshold', () => {
    expect(() => buildSessionProof(evidence(), identity(), {
      meaningfulOverlapSeconds: -1,
    })).toThrow(RangeError);
  });
});
