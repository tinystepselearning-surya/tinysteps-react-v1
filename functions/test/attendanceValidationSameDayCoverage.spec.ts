import { describe, expect, it } from 'vitest';
import type { Av3EnrollmentIdentityResult } from '../src/attendanceValidation/enrollmentIdentityBridge';
import {
  aggregateSameDayCoverage,
  buildSameDayCoverageObservation,
  serviceDayWindowUtc,
} from '../src/attendanceValidation/sameDayCoverageEngine';
import type {
  AttendanceParticipantEvidence,
  AttendanceReportEvidence,
  AttendanceValidationEvidenceDocument,
} from '../src/attendanceValidation/teamsEvidenceCollector';

function participant(
  id: string,
  start: string,
  end: string,
): AttendanceParticipantEvidence {
  return {
    participantRecordId: id,
    role: 'Attendee',
    emailAddressHash: null,
    identityHints: [],
    microsoftTotalAttendanceInSeconds:
      (Date.parse(end) - Date.parse(start)) / 1000,
    rawAttendanceIntervals: [{
      joinDateTime: start,
      leaveDateTime: end,
      durationInSeconds: (Date.parse(end) - Date.parse(start)) / 1000,
    }],
    metrics: {} as AttendanceParticipantEvidence['metrics'],
  };
}

function report(
  id: string,
  start: string,
  end: string,
): AttendanceReportEvidence {
  return {
    reportId: id,
    meetingStartDateTime: start,
    meetingEndDateTime: end,
    totalParticipantCount: 2,
    recordsComplete: true,
    nextRecordsPagePresent: false,
    recordsIssue: null,
    participantRecords: [
      participant('teacher-record', start, end),
      participant('learner-record', start, end),
    ],
  };
}

function evidence(
  reports: AttendanceReportEvidence[],
  overrides: Partial<AttendanceValidationEvidenceDocument> = {},
): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 2,
    id: 'evidence-1',
    runId: 'run-1',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-18T18:00:00.000Z',
    organizerUserId: 'organizer-1',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-18T09:30:00.000Z',
      scheduledEndDateTime: '2026-09-18T10:05:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: 'present',
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: null,
      endDateTime: null,
      creationDateTime: null,
      meetingType: 'recurring',
    },
    transcripts: [],
    attendanceReports: reports,
    completeness: {
      transcriptsComplete: false,
      attendanceReportsComplete: true,
      attendanceRecordsComplete: true,
      nextTranscriptPagePresent: true,
      nextAttendanceReportPagePresent: false,
    },
    artifactAvailability: {
      transcriptAvailable: false,
      attendanceReportAvailable: reports.length > 0,
      recordingAvailable: null,
    },
    issues: [],
    ...overrides,
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

describe('AVS same-day attendance coverage', () => {
  it('uses exact IST service-day boundaries', () => {
    expect(serviceDayWindowUtc('2026-09-18')).toEqual({
      startDateTime: '2026-09-17T18:30:00.000Z',
      endDateTime: '2026-09-18T18:30:00.000Z',
    });
  });

  it('measures teacher-learner overlap anywhere on the service date and ignores transcript pagination', () => {
    const observation = buildSameDayCoverageObservation(
      evidence([
        report(
          'report-shifted',
          '2026-09-18T15:00:00.000Z',
          '2026-09-18T15:35:00.000Z',
        ),
      ]),
      identity(),
      '2026-09-18',
    );
    const aggregate = aggregateSameDayCoverage([observation]);

    expect(observation.status).toBe('measured');
    expect(aggregate.totalOverlapSeconds).toBe(2100);
    expect(aggregate.occurrenceCount).toBe(1);
  });

  it('unions overlapping reports so time is never double-counted', () => {
    const observation = buildSameDayCoverageObservation(
      evidence([
        report(
          'report-a',
          '2026-09-18T10:00:00.000Z',
          '2026-09-18T10:35:00.000Z',
        ),
        report(
          'report-b',
          '2026-09-18T10:30:00.000Z',
          '2026-09-18T11:05:00.000Z',
        ),
      ]),
      identity(),
      '2026-09-18',
    );
    const aggregate = aggregateSameDayCoverage([observation]);

    expect(aggregate.totalOverlapSeconds).toBe(3900);
    expect(aggregate.occurrenceCount).toBe(2);
  });

  it('deduplicates repeated copies of the same Teams report across evidence documents', () => {
    const first = buildSameDayCoverageObservation(
      evidence([
        report(
          'report-shared',
          '2026-09-18T10:00:00.000Z',
          '2026-09-18T11:05:00.000Z',
        ),
      ]),
      identity(),
      '2026-09-18',
    );
    const secondEvidence = evidence([
      report(
        'report-shared',
        '2026-09-18T10:00:00.000Z',
        '2026-09-18T11:05:00.000Z',
      ),
    ], { id: 'evidence-2' });
    const second = buildSameDayCoverageObservation(
      secondEvidence,
      identity(),
      '2026-09-18',
    );
    const aggregate = aggregateSameDayCoverage([first, second]);

    expect(aggregate.totalOverlapSeconds).toBe(3900);
    expect(aggregate.occurrenceCount).toBe(1);
  });

  it('does not silently treat calculation-version-1 evidence as full-day evidence', () => {
    const observation = buildSameDayCoverageObservation(
      evidence([
        report(
          'report-old',
          '2026-09-18T10:00:00.000Z',
          '2026-09-18T10:35:00.000Z',
        ),
      ], { calculationVersion: 1 }),
      identity(),
      '2026-09-18',
    );

    expect(observation.status).toBe('review');
    expect(observation.attendanceEvidenceComplete).toBe(false);
    expect(observation.issues).toContain(
      'same_day_attendance_evidence_incomplete',
    );
  });

  it('treats complete teacher evidence with no learner participant as measurable zero overlap', () => {
    const absentIdentity = identity();
    absentIdentity.learnerSidePresent = false;
    absentIdentity.learnerSideParticipantCount = 0;
    absentIdentity.participantClassifications =
      absentIdentity.participantClassifications.filter(
        (item) => item.classification !== 'learner_side',
      );

    const noLearnerReport = report(
      'report-no-learner',
      '2026-09-18T10:00:00.000Z',
      '2026-09-18T10:35:00.000Z',
    );
    noLearnerReport.participantRecords =
      noLearnerReport.participantRecords.filter(
        (item) => item.participantRecordId !== 'learner-record',
      );

    const observation = buildSameDayCoverageObservation(
      evidence([noLearnerReport]),
      absentIdentity,
      '2026-09-18',
    );
    const aggregate = aggregateSameDayCoverage([observation]);

    expect(observation.status).toBe('measured');
    expect(aggregate.totalOverlapSeconds).toBe(0);
    expect(aggregate.occurrenceCount).toBe(1);
  });

  it('requires verified teacher and learner identity before measuring coverage', () => {
    const unresolvedIdentity = identity();
    unresolvedIdentity.identityConfidence = 'review';
    unresolvedIdentity.expectedTeacherPresent = false;

    const observation = buildSameDayCoverageObservation(
      evidence([
        report(
          'report-identity',
          '2026-09-18T10:00:00.000Z',
          '2026-09-18T10:35:00.000Z',
        ),
      ]),
      unresolvedIdentity,
      '2026-09-18',
    );

    expect(observation.status).toBe('review');
    expect(observation.issues).toContain('same_day_identity_not_verified');
  });
});
