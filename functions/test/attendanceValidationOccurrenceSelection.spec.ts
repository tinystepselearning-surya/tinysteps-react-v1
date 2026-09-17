import { describe, expect, it, vi } from 'vitest';
import {
  createOccurrenceSelectingTeamsEvidenceGraphClient,
  selectAttendanceReportForSession,
  selectTranscriptsForSession,
} from '../src/attendanceValidation/occurrenceSelectingGraphClient';
import {
  collectTeamsEvidence,
  type AttendanceValidationEvidenceStore,
  type TeamsEvidenceGraphClient,
} from '../src/attendanceValidation/teamsEvidenceCollector';

const session = {
  scheduledStartDateTime: '2026-09-16T16:00:00Z',
  scheduledEndDateTime: '2026-09-16T16:35:00Z',
};

describe('AV2.1 recurring Teams occurrence selection', () => {
  it('selects the unique attendance report with the strongest scheduled-window overlap', () => {
    const selected = selectAttendanceReportForSession({
      value: [
        {
          id: 'report-previous',
          meetingStartDateTime: '2026-09-15T16:00:00Z',
          meetingEndDateTime: '2026-09-15T16:35:00Z',
        },
        {
          id: 'report-target',
          meetingStartDateTime: '2026-09-16T15:59:00Z',
          meetingEndDateTime: '2026-09-16T16:36:00Z',
        },
        {
          id: 'report-next',
          meetingStartDateTime: '2026-09-17T16:00:00Z',
          meetingEndDateTime: '2026-09-17T16:35:00Z',
        },
      ],
    }, session);

    expect(selected.value.map((report) => report.id)).toEqual(['report-target']);
  });

  it('returns no attendance report when no occurrence overlaps the scheduled class', () => {
    const selected = selectAttendanceReportForSession({
      value: [{
        id: 'report-other-day',
        meetingStartDateTime: '2026-09-15T16:00:00Z',
        meetingEndDateTime: '2026-09-15T16:35:00Z',
      }],
    }, session);

    expect(selected.value).toEqual([]);
  });

  it('refuses to guess when two reports tie for strongest overlap', () => {
    expect(() => selectAttendanceReportForSession({
      value: [
        {
          id: 'report-a',
          meetingStartDateTime: '2026-09-16T15:55:00Z',
          meetingEndDateTime: '2026-09-16T16:30:00Z',
        },
        {
          id: 'report-b',
          meetingStartDateTime: '2026-09-16T16:05:00Z',
          meetingEndDateTime: '2026-09-16T16:40:00Z',
        },
      ],
    }, session)).toThrow(expect.objectContaining({
      kind: 'ambiguous_result',
      status: 409,
    }));
  });

  it('refuses to select from an incomplete attendance-report page', () => {
    expect(() => selectAttendanceReportForSession({
      value: [{
        id: 'report-target',
        meetingStartDateTime: '2026-09-16T16:00:00Z',
        meetingEndDateTime: '2026-09-16T16:35:00Z',
      }],
      '@odata.nextLink': 'https://graph.microsoft.com/next/reports',
    }, session)).toThrow(expect.objectContaining({
      kind: 'ambiguous_result',
      status: 409,
    }));
  });

  it('keeps only transcript metadata belonging to the scheduled occurrence', () => {
    const selected = selectTranscriptsForSession({
      value: [
        {
          id: 'transcript-previous',
          createdDateTime: '2026-09-15T16:00:00Z',
          endDateTime: '2026-09-15T16:35:00Z',
        },
        {
          id: 'transcript-target',
          createdDateTime: '2026-09-16T16:01:00Z',
          endDateTime: '2026-09-16T16:36:00Z',
        },
        {
          id: 'transcript-next',
          createdDateTime: '2026-09-17T16:00:00Z',
          endDateTime: '2026-09-17T16:35:00Z',
        },
      ],
    }, session);

    expect(selected.value.map((transcript) => transcript.id)).toEqual(['transcript-target']);
  });

  it('fetches attendance records only for the selected recurring-meeting report', async () => {
    const listAttendanceRecords = vi.fn().mockResolvedValue({ value: [] });
    const baseClient: TeamsEvidenceGraphClient = {
      resolveOnlineMeetingByJoinUrl: vi.fn().mockResolvedValue({
        id: 'meeting-recurring',
        meetingType: 'scheduled',
      }),
      listTranscripts: vi.fn().mockResolvedValue({
        value: [{
          id: 'transcript-target',
          createdDateTime: '2026-09-16T16:35:30Z',
        }],
      }),
      listAttendanceReports: vi.fn().mockResolvedValue({
        value: [
          {
            id: 'report-previous',
            meetingStartDateTime: '2026-09-15T16:00:00Z',
            meetingEndDateTime: '2026-09-15T16:35:00Z',
          },
          {
            id: 'report-target',
            meetingStartDateTime: '2026-09-16T16:00:00Z',
            meetingEndDateTime: '2026-09-16T16:35:00Z',
          },
          {
            id: 'report-next',
            meetingStartDateTime: '2026-09-17T16:00:00Z',
            meetingEndDateTime: '2026-09-17T16:35:00Z',
          },
        ],
      }),
      listAttendanceRecords,
    };
    const saveCollectionResult = vi.fn().mockResolvedValue(undefined);
    const store = { saveCollectionResult } as AttendanceValidationEvidenceStore;
    const graphClient = createOccurrenceSelectingTeamsEvidenceGraphClient(baseClient, session);

    const result = await collectTeamsEvidence({
      runId: 'av21_occurrence_test',
      organizerUserId: 'organizer-1',
      session: {
        classSessionId: 'session-1',
        enrollmentId: 'enrollment-1',
        teacherId: 'teacher-1',
        kidId: 'kid-1',
        courseId: 'course-1',
        ...session,
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/example',
        existingAttendanceStatus: 'present',
      },
    }, {
      graphClient,
      store,
      now: () => new Date('2026-09-16T17:00:00Z'),
    });

    expect(result.evidence.collectionStatus).toBe('complete');
    expect(result.evidence.attendanceReports.map((report) => report.reportId)).toEqual([
      'report-target',
    ]);
    expect(listAttendanceRecords).toHaveBeenCalledTimes(1);
    expect(listAttendanceRecords).toHaveBeenCalledWith(
      'organizer-1',
      'meeting-recurring',
      'report-target',
    );
    expect(saveCollectionResult).toHaveBeenCalledOnce();
  });

  it('converts an ambiguous recurring report selection into partial evidence, never absence', async () => {
    const baseClient: TeamsEvidenceGraphClient = {
      resolveOnlineMeetingByJoinUrl: vi.fn().mockResolvedValue({ id: 'meeting-recurring' }),
      listTranscripts: vi.fn().mockResolvedValue({ value: [] }),
      listAttendanceReports: vi.fn().mockResolvedValue({
        value: [{
          id: 'report-target',
          meetingStartDateTime: '2026-09-16T16:00:00Z',
          meetingEndDateTime: '2026-09-16T16:35:00Z',
        }],
        '@odata.nextLink': 'https://graph.microsoft.com/next/reports',
      }),
      listAttendanceRecords: vi.fn().mockResolvedValue({ value: [] }),
    };
    const saveCollectionResult = vi.fn().mockResolvedValue(undefined);
    const store = { saveCollectionResult } as AttendanceValidationEvidenceStore;
    const graphClient = createOccurrenceSelectingTeamsEvidenceGraphClient(baseClient, session);

    const result = await collectTeamsEvidence({
      runId: 'av21_ambiguous_test',
      organizerUserId: 'organizer-1',
      session: {
        classSessionId: 'session-1',
        enrollmentId: null,
        teacherId: null,
        kidId: null,
        courseId: null,
        ...session,
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/example',
        existingAttendanceStatus: null,
      },
    }, { graphClient, store });

    expect(result.evidence.collectionStatus).toBe('partial');
    expect(result.evidence.attendanceReports).toEqual([]);
    expect(result.evidence.issues).toContainEqual(expect.objectContaining({
      stage: 'attendance_reports',
      kind: 'ambiguous_result',
      httpStatus: 409,
    }));
    expect(baseClient.listAttendanceRecords).not.toHaveBeenCalled();
  });
});
