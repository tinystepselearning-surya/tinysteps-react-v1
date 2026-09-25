import { describe, expect, it, vi } from 'vitest';
import { MicrosoftGraphError } from '../src/attendanceValidation/microsoftGraphClient';
import {
  collectTeamsEvidence,
  hashAttendanceEvidenceValue,
  type AttendanceValidationEvidenceStore,
  type TeamsEvidenceGraphClient,
} from '../src/attendanceValidation/teamsEvidenceCollector';

function baseRequest() {
  return {
    runId: 'run_20260916_001',
    organizerUserId: 'organizer-1',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-16T16:00:00Z',
      scheduledEndDateTime: '2026-09-16T16:35:00Z',
      joinUrl: 'https://teams.microsoft.com/l/meetup-join/example',
      existingAttendanceStatus: 'present' as const,
    },
  };
}

function makeStore() {
  const saveCollectionResult = vi.fn().mockResolvedValue(undefined);
  return {
    store: { saveCollectionResult } as AttendanceValidationEvidenceStore,
    saveCollectionResult,
  };
}

function makeGraph(overrides: Partial<TeamsEvidenceGraphClient> = {}): TeamsEvidenceGraphClient {
  return {
    resolveOnlineMeetingByJoinUrl: vi.fn().mockResolvedValue({
      id: 'meeting-1',
      startDateTime: '2026-09-16T15:59:00Z',
      endDateTime: '2026-09-16T16:36:00Z',
      meetingType: 'scheduled',
    }),
    listTranscripts: vi.fn().mockResolvedValue({
      value: [{
        id: 'transcript-1',
        createdDateTime: '2026-09-16T16:36:00Z',
        transcriptContentUrl: 'https://graph.microsoft.com/content',
      }],
    }),
    listAttendanceReports: vi.fn().mockResolvedValue({
      value: [{
        id: 'report-1',
        meetingStartDateTime: '2026-09-16T15:59:00Z',
        meetingEndDateTime: '2026-09-16T16:36:00Z',
        totalParticipantCount: 2,
      }],
    }),
    listAttendanceRecords: vi.fn().mockResolvedValue({
      value: [
        {
          id: 'record-a',
          emailAddress: 'Teacher@Example.com',
          role: 'Presenter',
          totalAttendanceInSeconds: 2160,
          identity: { user: { id: 'aad-user-1', displayName: 'Ignored Name' } },
          attendanceIntervals: [{
            joinDateTime: '2026-09-16T16:00:00Z',
            leaveDateTime: '2026-09-16T16:36:00Z',
            durationInSeconds: 2160,
          }],
        },
        {
          id: 'record-b',
          emailAddress: 'ChildAlias@example.com',
          role: 'Attendee',
          totalAttendanceInSeconds: 1920,
          identity: { guest: { id: 'guest-2', displayName: 'Ignored Child Name' } },
          attendanceIntervals: [{
            joinDateTime: '2026-09-16T16:02:00Z',
            leaveDateTime: '2026-09-16T16:34:00Z',
            durationInSeconds: 1920,
          }],
        },
      ],
    }),
    ...overrides,
  };
}

describe('collectTeamsEvidence', () => {
  it('collects evidence without deciding teacher/student identity or attendance outcome', async () => {
    const graphClient = makeGraph();
    const { store, saveCollectionResult } = makeStore();

    const result = await collectTeamsEvidence(baseRequest(), {
      graphClient,
      store,
      now: () => new Date('2026-09-16T17:00:00Z'),
    });

    expect(result.evidence.collectionStatus).toBe('complete');
    expect(result.run.operationalMutationAllowed).toBe(false);
    expect(result.evidence.session.joinUrlHash).toBe(
      hashAttendanceEvidenceValue(baseRequest().session.joinUrl),
    );
    expect(JSON.stringify(result.evidence)).not.toContain(baseRequest().session.joinUrl);
    expect(JSON.stringify(result.evidence)).not.toContain('Teacher@Example.com');
    expect(JSON.stringify(result.evidence)).not.toContain('ChildAlias@example.com');
    expect(JSON.stringify(result.evidence)).not.toContain('Ignored Name');
    expect(JSON.stringify(result.evidence)).not.toContain('Ignored Child Name');

    const participants = result.evidence.attendanceReports[0].participantRecords;
    expect(participants).toHaveLength(2);
    expect(participants[0].emailAddressHash).toBe(
      hashAttendanceEvidenceValue('teacher@example.com'),
    );
    expect(participants[0].identityHints).toEqual([
      { kind: 'user', idHash: hashAttendanceEvidenceValue('aad-user-1') },
    ]);
    expect(participants[0].metrics.scheduledDwellPercentage).toBe(100);
    expect(participants[1].metrics.scheduledDwellPercentage).toBe(91.43);
    expect(graphClient.listTranscripts).not.toHaveBeenCalled();
    expect(result.evidence.transcripts).toEqual([]);
    expect(result.evidence.completeness.transcriptsComplete).toBe(true);
    expect(saveCollectionResult).toHaveBeenCalledOnce();
  });

  it('stores missing join URL as missing evidence instead of absence', async () => {
    const request = baseRequest();
    request.session.joinUrl = '';
    const graphClient = makeGraph();
    const { store } = makeStore();

    const result = await collectTeamsEvidence(request, { graphClient, store });

    expect(result.evidence.collectionStatus).toBe('missing_reference');
    expect(result.evidence.issues).toEqual([
      expect.objectContaining({
        stage: 'session_reference',
        kind: 'missing_join_url',
      }),
    ]);
    expect(graphClient.resolveOnlineMeetingByJoinUrl).not.toHaveBeenCalled();
  });

  it('stores meeting not found as evidence state instead of interpreting the learner as absent', async () => {
    const graphClient = makeGraph({
      resolveOnlineMeetingByJoinUrl: vi.fn().mockResolvedValue(null),
    });
    const { store } = makeStore();

    const result = await collectTeamsEvidence(baseRequest(), { graphClient, store });

    expect(result.evidence.collectionStatus).toBe('meeting_not_found');
    expect(result.evidence.meeting).toBeNull();
    expect(result.evidence.issues[0].kind).toBe('meeting_not_found');
  });

  it('does not request transcripts because they are irrelevant to the three business outcomes', async () => {
    const graphClient = makeGraph({
      listTranscripts: vi.fn().mockRejectedValue(new MicrosoftGraphError({
        kind: 'transcript_access_disabled',
        status: 403,
        innerCode: 'GraphAccessToTranscriptsDisabled',
        message: 'disabled',
      })),
    });
    const { store } = makeStore();

    const result = await collectTeamsEvidence(baseRequest(), { graphClient, store });

    expect(graphClient.listTranscripts).not.toHaveBeenCalled();
    expect(result.evidence.collectionStatus).toBe('complete');
    expect(result.evidence.transcripts).toEqual([]);
    expect(result.evidence.artifactAvailability.transcriptAvailable).toBe(false);
    expect(result.evidence.artifactAvailability.attendanceReportAvailable).toBe(true);
    expect(result.evidence.issues).toEqual([]);
  });

  it('marks first-page evidence partial when Graph advertises additional pages', async () => {
    const graphClient = makeGraph({
      listAttendanceReports: vi.fn().mockResolvedValue({
        value: [{ id: 'report-1' }],
        '@odata.nextLink': 'https://graph.microsoft.com/next/reports',
      }),
      listAttendanceRecords: vi.fn().mockResolvedValue({
        value: [],
        '@odata.nextLink': 'https://graph.microsoft.com/next/records',
      }),
    });
    const { store } = makeStore();

    const result = await collectTeamsEvidence(baseRequest(), { graphClient, store });

    expect(result.evidence.collectionStatus).toBe('partial');
    expect(result.evidence.completeness).toMatchObject({
      transcriptsComplete: true,
      attendanceReportsComplete: false,
      attendanceRecordsComplete: false,
      nextTranscriptPagePresent: false,
      nextAttendanceReportPagePresent: true,
    });
    expect(result.evidence.attendanceReports[0].nextRecordsPagePresent).toBe(true);
  });

  it('records attendance-record failure per report without discarding other collected artifacts', async () => {
    const graphClient = makeGraph({
      listAttendanceRecords: vi.fn().mockRejectedValue(new MicrosoftGraphError({
        kind: 'rate_limited',
        status: 429,
        retryAfterMs: 3000,
        message: 'rate limited',
      })),
    });
    const { store } = makeStore();

    const result = await collectTeamsEvidence(baseRequest(), { graphClient, store });

    expect(result.evidence.collectionStatus).toBe('partial');
    expect(result.evidence.transcripts).toHaveLength(0);
    expect(result.evidence.attendanceReports).toHaveLength(1);
    expect(result.evidence.attendanceReports[0].recordsComplete).toBe(false);
    expect(result.evidence.attendanceReports[0].recordsIssue).toEqual(
      expect.objectContaining({
        stage: 'attendance_records',
        reportId: 'report-1',
        kind: 'rate_limited',
        retryAfterMs: 3000,
      }),
    );
  });
});
