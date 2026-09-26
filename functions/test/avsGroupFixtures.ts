import type { AttendanceValidationEvidenceDocument } from '../src/attendanceValidation/teamsEvidenceCollector';
import type { Av3StaffRegistrySnapshot } from '../src/attendanceValidation/staffIdentityRegistry';
import { hashAttendanceEvidenceValue } from '../src/attendanceValidation/teamsEvidenceCollector';
export const registry: Av3StaffRegistrySnapshot = {
  schemaVersion: 1,
  loadedAt: '2026-09-19T07:00:00.000Z',
  entries: [
    {
      staffId: 'teacher-1',
      role: 'teacher',
      emailAddressHash: hashAttendanceEvidenceValue('teacher@example.com'),
      microsoftIdentityIdHashes: [
        hashAttendanceEvidenceValue('teacher-ms-id'),
      ],
    },
  ],
  issues: [],
};

export function evidence(
  overrides: Partial<AttendanceValidationEvidenceDocument> = {},
): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 2,
    id: 'evidence-1',
    runId: 'av53-test',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-19T06:00:00.000Z',
    organizerUserId: 'organizer',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-18T10:00:00.000Z',
      scheduledEndDateTime: '2026-09-18T10:35:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: null,
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: '2026-09-18T10:00:00.000Z',
      endDateTime: '2026-09-18T10:35:00.000Z',
      creationDateTime: '2026-09-01T10:00:00.000Z',
      meetingType: 'recurring',
    },
    transcripts: [],
    attendanceReports: [
      {
        reportId: 'report-1',
        meetingStartDateTime: '2026-09-18T10:00:00.000Z',
        meetingEndDateTime: '2026-09-18T10:35:00.000Z',
        totalParticipantCount: 2,
        recordsComplete: true,
        nextRecordsPagePresent: false,
        recordsIssue: null,
        participantRecords: [
          {
            participantRecordId: 'teacher-record',
            role: 'Presenter',
            emailAddressHash: hashAttendanceEvidenceValue('teacher@example.com'),
            identityHints: [
              {
                kind: 'user',
                idHash: hashAttendanceEvidenceValue('teacher-ms-id'),
              },
            ],
            microsoftTotalAttendanceInSeconds: 2100,
            rawAttendanceIntervals: [
              {
                joinDateTime: '2026-09-18T10:00:00.000Z',
                leaveDateTime: '2026-09-18T10:35:00.000Z',
                durationInSeconds: 2100,
              },
            ],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-18T10:00:00.000Z',
              lastLeaveDateTime: '2026-09-18T10:35:00.000Z',
              totalDwellSeconds: 2100,
              scheduledOverlapSeconds: 2100,
              scheduledDwellPercentage: 100,
            },
          },
          {
            participantRecordId: 'learner-record',
            role: 'Attendee',
            emailAddressHash: hashAttendanceEvidenceValue('parent@example.com'),
            identityHints: [],
            microsoftTotalAttendanceInSeconds: 1800,
            rawAttendanceIntervals: [
              {
                joinDateTime: '2026-09-18T10:02:00.000Z',
                leaveDateTime: '2026-09-18T10:32:00.000Z',
                durationInSeconds: 1800,
              },
            ],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-18T10:02:00.000Z',
              lastLeaveDateTime: '2026-09-18T10:32:00.000Z',
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
    ...overrides,
  };
}

export function session(
  attendance: unknown = { 'kid-1': { status: 'present' } },
  date = '2026-09-18',
) {
  return {
    date,
    enrollmentId: 'enrollment-1',
    teacherId: 'teacher-1',
    teacherName: 'Teacher One',
    kidId: 'kid-1',
    studentName: 'Student One',
    attendance,
  };
}

export function shiftedSameDayEvidence(
  classSessionId: string,
  evidenceId: string,
  durationSeconds: number,
): AttendanceValidationEvidenceDocument {
  const input = JSON.parse(
    JSON.stringify(evidence()),
  ) as AttendanceValidationEvidenceDocument;
  const actualStartMs = Date.parse('2026-09-18T15:00:00.000Z');
  const actualEnd = new Date(actualStartMs + durationSeconds * 1000).toISOString();

  input.id = evidenceId;
  input.calculationVersion = 2;
  input.session.classSessionId = classSessionId;
  input.meeting = {
    ...input.meeting!,
    onlineMeetingId: 'meeting-same-day',
    startDateTime: '2026-09-18T15:00:00.000Z',
    endDateTime: actualEnd,
  };
  input.attendanceReports[0].reportId = 'report-same-day';
  input.attendanceReports[0].meetingStartDateTime =
    '2026-09-18T15:00:00.000Z';
  input.attendanceReports[0].meetingEndDateTime = actualEnd;

  for (const participant of input.attendanceReports[0].participantRecords) {
    participant.rawAttendanceIntervals = [{
      joinDateTime: '2026-09-18T15:00:00.000Z',
      leaveDateTime: actualEnd,
      durationInSeconds: durationSeconds,
    }];
  }

  return input;
}

