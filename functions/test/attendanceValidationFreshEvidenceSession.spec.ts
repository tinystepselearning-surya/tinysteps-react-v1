import { describe, expect, it } from 'vitest';
import {
  buildBaselineEvidenceSessionSnapshot,
  buildFreshEvidenceSessionSnapshot,
} from '../src/attendanceValidation/freshEvidenceSession';
import type {
  AttendanceValidationEvidenceDocument,
} from '../src/attendanceValidation/teamsEvidenceCollector';

function evidence(): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 1,
    id: 'evidence-old',
    runId: 'run-old',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-18T12:00:00.000Z',
    organizerUserId: 'organizer-1',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-old',
      teacherId: 'teacher-old',
      kidId: 'kid-old',
      courseId: 'course-old',
      scheduledStartDateTime: '2026-09-18T10:00:00.000Z',
      scheduledEndDateTime: '2026-09-18T10:35:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'hash',
      existingAttendanceStatus: 'absent',
    },
    meeting: null,
    transcripts: [],
    attendanceReports: [],
    completeness: {
      transcriptsComplete: true,
      attendanceReportsComplete: true,
      attendanceRecordsComplete: true,
      nextTranscriptPagePresent: false,
      nextAttendanceReportPagePresent: false,
    },
    artifactAvailability: {
      transcriptAvailable: false,
      attendanceReportAvailable: false,
      recordingAvailable: null,
    },
    issues: [],
  };
}

describe('AVS force-fresh session snapshot', () => {
  it('uses the current operational session identity/window/link and attendance', () => {
    const result = buildFreshEvidenceSessionSnapshot(
      'session-1',
      {
        enrollmentId: 'enrollment-new',
        teacherId: 'teacher-new',
        kidId: 'kid-new',
        courseId: 'course-new',
        startAt: { seconds: Date.parse('2026-09-18T11:00:00.000Z') / 1000 },
        endAt: { seconds: Date.parse('2026-09-18T11:35:00.000Z') / 1000 },
        joinUrl: 'https://teams.example/new',
        attendance: { 'kid-new': { status: 'present' } },
      },
      evidence(),
    );

    expect(result).toEqual({
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-new',
      teacherId: 'teacher-new',
      kidId: 'kid-new',
      courseId: 'course-new',
      scheduledStartDateTime: '2026-09-18T11:00:00.000Z',
      scheduledEndDateTime: '2026-09-18T11:35:00.000Z',
      joinUrl: 'https://teams.example/new',
      existingAttendanceStatus: 'present',
    });
  });

  it('falls back to the previous evidence window and identity when legacy fields are absent', () => {
    const result = buildFreshEvidenceSessionSnapshot(
      'session-1',
      {
        meetingLink: 'https://teams.example/legacy',
        attendance: { 'kid-old': { status: 'no_show' } },
      },
      evidence(),
    );

    expect(result.scheduledStartDateTime).toBe('2026-09-18T10:00:00.000Z');
    expect(result.scheduledEndDateTime).toBe('2026-09-18T10:35:00.000Z');
    expect(result.enrollmentId).toBe('enrollment-old');
    expect(result.teacherId).toBe('teacher-old');
    expect(result.kidId).toBe('kid-old');
    expect(result.joinUrl).toBe('https://teams.example/legacy');
    expect(result.existingAttendanceStatus).toBe('absent');
  });


describe('AVS first-time baseline session snapshot', () => {
  it('reconstructs a legacy IST schedule window and canonical aliases without prior evidence', () => {
    const result = buildBaselineEvidenceSessionSnapshot(
      'session-legacy',
      {
        enrollmentId: 'enrollment-1',
        assignedTeacherId: 'teacher-1',
        kidIds: ['kid-1'],
        courseId: 'course-1',
        date: '2026-09-18',
        startTime: '20:00',
        durationMins: 35,
        joinUrl: 'https://teams.example/legacy',
        attendance: { 'kid-1': { status: 'present' } },
      },
    );

    expect(result).toMatchObject({
      classSessionId: 'session-legacy',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-18T14:30:00.000Z',
      scheduledEndDateTime: '2026-09-18T15:05:00.000Z',
      joinUrl: 'https://teams.example/legacy',
      existingAttendanceStatus: 'present',
    });
  });

  it('fails closed when no valid class window can be reconstructed', () => {
    expect(() =>
      buildBaselineEvidenceSessionSnapshot('session-bad', {
        date: '2026-09-18',
        startTime: '20:00',
      }),
    ).toThrow('valid scheduled start/end window');
  });
});
});
