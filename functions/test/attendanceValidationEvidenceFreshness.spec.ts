import { describe, expect, it } from 'vitest';
import {
  classifyCachedEvidenceFreshness,
} from '../src/attendanceValidation/evidenceFreshness';
import {
  hashAttendanceEvidenceValue,
  type AttendanceValidationEvidenceDocument,
} from '../src/attendanceValidation/teamsEvidenceCollector';

const joinUrl = 'https://teams.microsoft.com/l/meetup-join/original';

function evidence(
  overrides: Partial<AttendanceValidationEvidenceDocument['session']> = {},
): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 2,
    id: 'evidence-1',
    runId: 'run-1',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-23T10:00:00.000Z',
    organizerUserId: 'organizer',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-01T09:30:00.000Z',
      scheduledEndDateTime: '2026-09-01T10:05:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: hashAttendanceEvidenceValue(joinUrl),
      existingAttendanceStatus: 'absent',
      ...overrides,
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

function session(overrides: Record<string, unknown> = {}) {
  return {
    enrollmentId: 'enrollment-1',
    teacherId: 'teacher-1',
    kidId: 'kid-1',
    courseId: 'course-1',
    date: '2026-09-01',
    startAt: { seconds: Date.parse('2026-09-01T09:30:00.000Z') / 1000 },
    endAt: { seconds: Date.parse('2026-09-01T10:05:00.000Z') / 1000 },
    joinUrl,
    attendance: {
      'kid-1': { status: 'present', notes: 'attendance changed only' },
    },
    ...overrides,
  };
}

describe('AVS cached Teams evidence freshness classifier', () => {
  it('reuses evidence when only attendance or non-Teams metadata changed', () => {
    const result = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({
        teacherName: 'Updated display name',
        courseId: 'renamed-course',
      }),
      evidence: evidence(),
    });

    expect(result).toEqual({
      decision: 'reuse_cached',
      reasons: ['compatible'],
    });
  });

  it('requires fresh evidence when the teacher changes', () => {
    const result = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({ teacherId: 'teacher-2' }),
      evidence: evidence(),
    });

    expect(result.decision).toBe('fresh_required');
    expect(result.reasons).toContain('teacher_changed');
  });

  it('requires fresh evidence when enrollment or learner identity changes', () => {
    const result = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({
        enrollmentId: 'enrollment-2',
        kidId: 'kid-2',
      }),
      evidence: evidence(),
    });

    expect(result.decision).toBe('fresh_required');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['enrollment_changed', 'kid_changed']),
    );
  });

  it('requires fresh evidence when the service date or scheduled window changes', () => {
    const result = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({
        date: '2026-09-02',
        startAt: { seconds: Date.parse('2026-09-02T09:30:00.000Z') / 1000 },
        endAt: { seconds: Date.parse('2026-09-02T10:05:00.000Z') / 1000 },
      }),
      evidence: evidence(),
    });

    expect(result.decision).toBe('fresh_required');
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        'service_date_changed',
        'scheduled_window_changed',
      ]),
    );
  });

  it('requires fresh evidence when the Teams join URL changes or is newly added', () => {
    const changed = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/new',
      }),
      evidence: evidence(),
    });
    expect(changed.decision).toBe('fresh_required');
    expect(changed.reasons).toContain('join_url_changed');

    const added = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session(),
      evidence: evidence({ joinUrlHash: null }),
    });
    expect(added.decision).toBe('fresh_required');
    expect(added.reasons).toContain('join_url_added');
  });

  it('fails closed when compatibility cannot be proven', () => {
    const missingTeacher = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({ teacherId: null }),
      evidence: evidence(),
    });
    expect(missingTeacher.decision).toBe('unsafe_review');
    expect(missingTeacher.reasons).toContain(
      'operational_teacher_unresolved',
    );

    const missingLink = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session({
        joinUrl: null,
        meetingLink: null,
        classLink: null,
      }),
      evidence: evidence(),
    });
    expect(missingLink.decision).toBe('unsafe_review');
    expect(missingLink.reasons).toContain(
      'operational_join_url_unresolved',
    );
  });

  it('supports canonical teacher/kid aliases without forcing a refresh', () => {
    const aliased = session({
      teacherId: undefined,
      assignedTeacherId: 'teacher-1',
      kidId: undefined,
      kidIds: ['kid-1'],
    });

    const result = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: aliased,
      evidence: evidence(),
    });

    expect(result.decision).toBe('reuse_cached');
  });

  it('fails closed on an evidence/session reference mismatch', () => {
    const result = classifyCachedEvidenceFreshness({
      classSessionId: 'session-1',
      session: session(),
      evidence: evidence({ classSessionId: 'different-session' }),
    });

    expect(result.decision).toBe('unsafe_review');
    expect(result.reasons).toContain('evidence_session_id_mismatch');
  });
});
