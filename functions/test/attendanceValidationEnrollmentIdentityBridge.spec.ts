import { describe, expect, it } from 'vitest';
import {
  bridgeEnrollmentIdentity,
  type StaffIdentityRegistryEntry,
} from '../src/attendanceValidation/enrollmentIdentityBridge';
import {
  hashAttendanceEvidenceValue,
  type AttendanceValidationEvidenceDocument,
} from '../src/attendanceValidation/teamsEvidenceCollector';

function evidence(): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 1,
    id: 'av2-evidence-1',
    runId: 'run-1',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-17T07:00:00.000Z',
    organizerUserId: 'organizer-1',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-hansa',
      kidId: 'kid-dira',
      courseId: 'early-phonics',
      scheduledStartDateTime: '2026-09-16T14:30:00.000Z',
      scheduledEndDateTime: '2026-09-16T15:05:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: 'present',
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: '2026-09-16T14:30:00.000Z',
      endDateTime: '2026-09-16T15:05:00.000Z',
      creationDateTime: '2026-09-07T14:18:29.000Z',
      meetingType: 'recurring',
    },
    transcripts: [],
    attendanceReports: [
      {
        reportId: 'report-1',
        meetingStartDateTime: '2026-09-16T14:30:00.000Z',
        meetingEndDateTime: '2026-09-16T15:05:00.000Z',
        totalParticipantCount: 2,
        recordsComplete: true,
        nextRecordsPagePresent: false,
        recordsIssue: null,
        participantRecords: [
          {
            participantRecordId: 'teacher-record',
            role: 'Presenter',
            emailAddressHash: hashAttendanceEvidenceValue('hansa@tinystepslearning.com'),
            identityHints: [
              {
                kind: 'user',
                idHash: hashAttendanceEvidenceValue(
                  '7b27d0bc-25da-42c7-9fda-84a558112f45',
                ),
              },
            ],
            microsoftTotalAttendanceInSeconds: 2100,
            rawAttendanceIntervals: [],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-16T14:30:00.000Z',
              lastLeaveDateTime: '2026-09-16T15:05:00.000Z',
              totalDwellSeconds: 2100,
              scheduledOverlapSeconds: 2100,
              scheduledDwellPercentage: 100,
            },
          },
          {
            participantRecordId: 'family-record',
            role: 'Attendee',
            emailAddressHash: hashAttendanceEvidenceValue('parent@example.com'),
            identityHints: [],
            microsoftTotalAttendanceInSeconds: 1800,
            rawAttendanceIntervals: [],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-16T14:32:00.000Z',
              lastLeaveDateTime: '2026-09-16T15:02:00.000Z',
              totalDwellSeconds: 1800,
              scheduledOverlapSeconds: 1800,
              scheduledDwellPercentage: 85.71,
            },
          },
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

const staffRegistry: StaffIdentityRegistryEntry[] = [
  {
    staffId: 'teacher-hansa',
    role: 'teacher',
    emailAddressHash: hashAttendanceEvidenceValue('hansa@tinystepslearning.com'),
    microsoftIdentityIdHashes: [
      hashAttendanceEvidenceValue('7b27d0bc-25da-42c7-9fda-84a558112f45'),
    ],
  },
  {
    staffId: 'admin-priya',
    role: 'admin',
    emailAddressHash: hashAttendanceEvidenceValue('ravalipriyavannala@tinystepslearning.com'),
    microsoftIdentityIdHashes: [
      hashAttendanceEvidenceValue('f0f84eef-5cc2-4ece-8356-df08c2f113bb'),
    ],
  },
];

describe('AV3 enrollment identity bridge', () => {
  it('classifies the registered expected teacher and all non-staff as learner side', () => {
    const result = bridgeEnrollmentIdentity(evidence(), staffRegistry);

    expect(result.identityConfidence).toBe('verified');
    expect(result.expectedTeacherPresent).toBe(true);
    expect(result.learnerSidePresent).toBe(true);
    expect(result.unexpectedStaffPresent).toBe(false);
    expect(result.participantClassifications).toEqual([
      {
        participantRecordId: 'teacher-record',
        classification: 'expected_teacher',
        matchedStaffIds: ['teacher-hansa'],
      },
      {
        participantRecordId: 'family-record',
        classification: 'learner_side',
        matchedStaffIds: [],
      },
    ]);
  });

  it('keeps another recognized Tiny Steps staff participant out of learner side', () => {
    const input = evidence();
    input.attendanceReports[0].participantRecords.push({
      participantRecordId: 'admin-record',
      role: 'Presenter',
      emailAddressHash: hashAttendanceEvidenceValue('ravalipriyavannala@tinystepslearning.com'),
      identityHints: [
        {
          kind: 'user',
          idHash: hashAttendanceEvidenceValue('f0f84eef-5cc2-4ece-8356-df08c2f113bb'),
        },
      ],
      microsoftTotalAttendanceInSeconds: 300,
      rawAttendanceIntervals: [],
      metrics: {
        sourceIntervalCount: 1,
        validIntervalCount: 1,
        mergedIntervalCount: 1,
        firstJoinDateTime: '2026-09-16T14:40:00.000Z',
        lastLeaveDateTime: '2026-09-16T14:45:00.000Z',
        totalDwellSeconds: 300,
        scheduledOverlapSeconds: 300,
        scheduledDwellPercentage: 14.29,
      },
    });

    const result = bridgeEnrollmentIdentity(input, staffRegistry);

    expect(result.expectedTeacherPresent).toBe(true);
    expect(result.learnerSideParticipantCount).toBe(1);
    expect(result.unexpectedStaffPresent).toBe(true);
    expect(result.unexpectedStaffCount).toBe(1);
    expect(result.identityConfidence).toBe('verified');
    expect(result.participantClassifications[2].classification).toBe('other_staff');
  });

  it('requires review if the expected teacher has no registered Microsoft identity', () => {
    const result = bridgeEnrollmentIdentity(evidence(), [
      {
        staffId: 'teacher-hansa',
        role: 'teacher',
        emailAddressHash: null,
        microsoftIdentityIdHashes: [],
      },
    ]);

    expect(result.identityConfidence).toBe('review');
    expect(result.issues).toContain('expected_teacher_identity_missing');
    expect(result.expectedTeacherPresent).toBe(false);
  });

  it('lets a unique stable Microsoft identity override duplicate email fallback matches', () => {
    const duplicatedEmailRegistry: StaffIdentityRegistryEntry[] = [
      ...staffRegistry,
      {
        staffId: 'other-staff',
        role: 'teacher',
        emailAddressHash: hashAttendanceEvidenceValue('hansa@tinystepslearning.com'),
        microsoftIdentityIdHashes: [],
      },
    ];

    const result = bridgeEnrollmentIdentity(evidence(), duplicatedEmailRegistry);

    expect(result.expectedTeacherPresent).toBe(true);
    expect(result.participantClassifications[0]).toEqual({
      participantRecordId: 'teacher-record',
      classification: 'expected_teacher',
      matchedStaffIds: ['teacher-hansa'],
    });
    expect(result.issues).toContain('identity_email_conflict');
    expect(result.identityConfidence).toBe('review');
  });

  it('uses email only as fallback when Graph supplies no stable Microsoft identity', () => {
    const input = evidence();
    input.attendanceReports[0].participantRecords[0].identityHints = [];

    const result = bridgeEnrollmentIdentity(input, staffRegistry);

    expect(result.expectedTeacherPresent).toBe(true);
    expect(result.identityConfidence).toBe('verified');
    expect(result.participantClassifications[0]).toEqual({
      participantRecordId: 'teacher-record',
      classification: 'expected_teacher',
      matchedStaffIds: ['teacher-hansa'],
    });
  });

  it('requires review when stable Microsoft identity and email identify different staff', () => {
    const input = evidence();
    input.attendanceReports[0].participantRecords[0].emailAddressHash =
      hashAttendanceEvidenceValue('ravalipriyavannala@tinystepslearning.com');

    const result = bridgeEnrollmentIdentity(input, staffRegistry);

    expect(result.expectedTeacherPresent).toBe(true);
    expect(result.participantClassifications[0]).toEqual({
      participantRecordId: 'teacher-record',
      classification: 'expected_teacher',
      matchedStaffIds: ['teacher-hansa'],
    });
    expect(result.issues).toContain('identity_email_conflict');
    expect(result.identityConfidence).toBe('review');
  });

  it('does not let a staff email override an unknown stable Microsoft identity', () => {
    const input = evidence();
    input.attendanceReports[0].participantRecords[0].identityHints = [
      {
        kind: 'user',
        idHash: hashAttendanceEvidenceValue('unknown-stable-microsoft-id'),
      },
    ];

    const result = bridgeEnrollmentIdentity(input, staffRegistry);

    expect(result.expectedTeacherPresent).toBe(false);
    expect(result.participantClassifications[0]).toEqual({
      participantRecordId: 'teacher-record',
      classification: 'ambiguous_staff',
      matchedStaffIds: ['teacher-hansa'],
    });
    expect(result.issues).toContain('identity_email_conflict');
    expect(result.identityConfidence).toBe('review');
  });

  it('requires review when the same stable Microsoft identity is registered to multiple staff', () => {
    const duplicatedStableRegistry: StaffIdentityRegistryEntry[] = [
      ...staffRegistry,
      {
        staffId: 'other-staff',
        role: 'teacher',
        emailAddressHash: null,
        microsoftIdentityIdHashes: [
          hashAttendanceEvidenceValue('7b27d0bc-25da-42c7-9fda-84a558112f45'),
        ],
      },
    ];

    const result = bridgeEnrollmentIdentity(evidence(), duplicatedStableRegistry);

    expect(result.identityConfidence).toBe('review');
    expect(result.issues).toContain('ambiguous_staff_match');
    expect(result.participantClassifications[0].classification).toBe('ambiguous_staff');
  });
});
