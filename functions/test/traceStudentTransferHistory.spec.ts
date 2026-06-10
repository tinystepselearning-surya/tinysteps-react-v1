import { describe, expect, it } from 'vitest';
import { buildTraceStudentTransferHistoryResult } from '../src/traceStudentTransferHistory';

function baseQuery() {
  return {
    enrollmentId: null,
    kidId: null,
    studentName: null,
    fromDate: null,
    toDate: null,
    includeSessions: true,
    includeAuditLogs: true,
    includeRepairCandidates: true,
  };
}

function teacherMaps() {
  const teacherProfilesByUid = new Map([
    ['teacher_rashi', { uid: 'teacher_rashi', displayName: 'Rashi', name: 'Rashi', email: 'rashi@tinysteps.com' }],
    ['teacher_fareeha', { uid: 'teacher_fareeha', displayName: 'Fareeha', name: 'Fareeha', email: 'fareeha@tinysteps.com' }],
  ]);
  const teacherUidByEmail = new Map([
    ['rashi@tinysteps.com', 'teacher_rashi'],
    ['fareeha@tinysteps.com', 'teacher_fareeha'],
  ]);
  const teacherUidByName = new Map([
    ['rashi', 'teacher_rashi'],
    ['fareeha', 'teacher_fareeha'],
  ]);
  return { teacherProfilesByUid, teacherUidByEmail, teacherUidByName };
}

describe('buildTraceStudentTransferHistoryResult', () => {
  it('prefers explicit reassignment audit logs for transfer confidence', () => {
    const result = buildTraceStudentTransferHistoryResult({
      query: baseQuery(),
      sessionDocs: [
        {
          id: 'session_after',
          data: {
            date: '2026-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
            childName: 'Niharrika',
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { kidId: 'kid_1', childName: 'Niharrika', courseName: 'Foundation Phonics', teacherId: 'teacher_fareeha' }],
      ]),
      kidById: new Map([
        ['kid_1', { name: 'Niharrika' }],
      ]),
      childById: new Map(),
      courseById: new Map(),
      auditLogRows: [
        {
          logId: 'audit_1',
          sourceCollection: 'enrollments/enr_1/teacherReassignments',
          type: null,
          timestamp: '2026-06-05T09:30:00.000Z',
          enrollmentId: 'enr_1',
          kidId: 'kid_1',
          studentId: 'kid_1',
          studentName: 'Niharrika',
          courseId: 'foundation-phonics',
          courseName: 'Foundation Phonics',
          teacherId: 'teacher_fareeha',
          teacherIds: ['teacher_fareeha'],
          teacherName: 'Fareeha',
          teacherEmail: 'fareeha@tinysteps.com',
          previousTeacherUid: 'teacher_rashi',
          previousTeacherName: 'Rashi',
          previousTeacherEmail: 'rashi@tinysteps.com',
          newTeacherUid: 'teacher_fareeha',
          newTeacherName: 'Fareeha',
          newTeacherEmail: 'fareeha@tinysteps.com',
          changedBy: 'admin@tinysteps.com',
          matchedBy: ['enrollmentId'],
        },
      ],
      preferredEnrollmentId: 'enr_1',
      preferredKidId: 'kid_1',
      ...teacherMaps(),
    });

    expect(result.summary.transferredFrom).toBe('teacher_rashi');
    expect(result.summary.transferredTo).toBe('teacher_fareeha');
    expect(result.summary.confidence).toBe('high');
    expect(result.transferEvents[0]).toMatchObject({
      confidence: 'high',
      evidence: { source: 'audit_log', logId: 'audit_1' },
    });
  });

  it('infers transfer events from the classSessions timeline when audit logs are absent', () => {
    const result = buildTraceStudentTransferHistoryResult({
      query: baseQuery(),
      sessionDocs: [
        {
          id: 'session_before',
          data: {
            date: '2026-06-01',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_rashi',
            teacherIds: ['teacher_rashi'],
            childName: 'Niharrika',
          },
        },
        {
          id: 'session_after',
          data: {
            date: '2026-06-07',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
            childName: 'Niharrika',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha' }],
      ]),
      kidById: new Map([
        ['kid_1', { name: 'Niharrika' }],
      ]),
      childById: new Map(),
      courseById: new Map(),
      auditLogRows: [],
      preferredEnrollmentId: 'enr_1',
      preferredKidId: 'kid_1',
      ...teacherMaps(),
    });

    expect(result.transferEvents).toHaveLength(1);
    expect(result.transferEvents[0]).toMatchObject({
      previousTeacherUid: 'teacher_rashi',
      newTeacherUid: 'teacher_fareeha',
      confidence: 'medium',
      evidence: {
        source: 'session_timeline',
        beforeSessionId: 'session_before',
        afterSessionId: 'session_after',
      },
    });
  });

  it('rejects assigned-count labels and falls back to enrollment snapshots', () => {
    const result = buildTraceStudentTransferHistoryResult({
      query: baseQuery(),
      sessionDocs: [
        {
          id: 'session_transfer',
          data: {
            date: '2026-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
            childName: '1 assigned',
            courseName: 'advanced-phonics',
            courseId: 'advanced-phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { kidId: 'kid_1', childName: 'Niharrika', courseName: 'Foundation Phonics', teacherId: 'teacher_fareeha' }],
      ]),
      kidById: new Map([
        ['kid_1', { name: 'Niharrika' }],
      ]),
      childById: new Map(),
      courseById: new Map(),
      auditLogRows: [],
      preferredEnrollmentId: 'enr_1',
      preferredKidId: 'kid_1',
      ...teacherMaps(),
    });

    expect(result.sessionTimeline[0]).toMatchObject({
      resolvedStudentName: 'Niharrika',
      studentNameRejectedBecauseAssignedFallback: true,
      resolvedCourseName: 'Foundation Phonics',
      repairCandidate: true,
    });
    expect(result.sessionTimeline[0].repairReasons).toContain('student_name_rejected_assigned_count_label');
    expect(result.sessionTimeline[0].repairReasons).toContain('course_name_slug_only');
  });

  it('recovers missing student snapshots from enrollment data', () => {
    const result = buildTraceStudentTransferHistoryResult({
      query: baseQuery(),
      sessionDocs: [
        {
          id: 'session_missing_name',
          data: {
            date: '2026-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', courseName: 'Foundation Phonics' }],
      ]),
      kidById: new Map(),
      childById: new Map(),
      courseById: new Map(),
      auditLogRows: [],
      preferredEnrollmentId: 'enr_1',
      preferredKidId: 'kid_1',
      ...teacherMaps(),
    });

    expect(result.sessionTimeline[0].resolvedStudentName).toBe('Niharrika');
    expect(result.sessionTimeline[0].studentNameMissing).toBe(false);
    expect(result.resolvedStudent.studentName).toBe('Niharrika');
  });

  it('marks conflicting teacher aliases as repair candidates', () => {
    const result = buildTraceStudentTransferHistoryResult({
      query: baseQuery(),
      sessionDocs: [
        {
          id: 'session_conflict',
          data: {
            date: '2026-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha', 'teacher_rashi'],
            assignedTeacherId: 'teacher_fareeha',
            primaryTeacherId: 'teacher_rashi',
            childName: 'Niharrika',
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', courseName: 'Foundation Phonics' }],
      ]),
      kidById: new Map([
        ['kid_1', { name: 'Niharrika' }],
      ]),
      childById: new Map(),
      courseById: new Map(),
      auditLogRows: [],
      preferredEnrollmentId: 'enr_1',
      preferredKidId: 'kid_1',
      ...teacherMaps(),
    });

    expect(result.sessionTimeline[0].teacherFieldsConflicting).toBe(true);
    expect(result.sessionTimeline[0].repairCandidate).toBe(true);
    expect(result.sessionTimeline[0].repairReasons).toContain('teacher_alias_conflict');
  });
});
