import { describe, expect, it } from 'vitest';
import { buildAuditAllTransferredSessionSnapshotIssuesResult } from '../src/auditAllTransferredSessionSnapshotIssues';

function baseQuery() {
  return {
    fromDate: '2099-01-01',
    toDate: null,
    teacherUid: null,
    limit: 500,
    includeCompleted: true,
    includePast: true,
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

function buildResult(overrides?: {
  sessionDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  enrollmentById?: Map<string, Record<string, unknown>>;
  kidById?: Map<string, Record<string, unknown>>;
  childById?: Map<string, Record<string, unknown>>;
  courseById?: Map<string, Record<string, unknown>>;
}) {
  return buildAuditAllTransferredSessionSnapshotIssuesResult({
    query: baseQuery(),
    sessionDocs: overrides?.sessionDocs || [],
    enrollmentById: overrides?.enrollmentById || new Map(),
    kidById: overrides?.kidById || new Map(),
    childById: overrides?.childById || new Map(),
    courseById: overrides?.courseById || new Map(),
    ...teacherMaps(),
  });
}

describe('buildAuditAllTransferredSessionSnapshotIssuesResult', () => {
  it('detects missing child snapshots and resolves the name from enrollment', () => {
    const result = buildResult({
      sessionDocs: [
        {
          id: 'session_missing_name',
          data: {
            date: '2099-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { id: 'enr_1', kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', teacherIds: ['teacher_fareeha'] }],
      ]),
    });

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].repairReasons).toContain('student_snapshot_missing');
    expect(result.issues[0].resolvedChildName).toBe('Niharrika');
  });

  it('detects assigned-count labels', () => {
    const result = buildResult({
      sessionDocs: [
        {
          id: 'session_assigned',
          data: {
            date: '2099-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
            childName: '1 assigned',
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { id: 'enr_1', kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', teacherIds: ['teacher_fareeha'] }],
      ]),
    });

    expect(result.issues[0].repairReasons).toContain('student_snapshot_assigned_count_label');
  });

  it('detects slug-only course snapshots when enrollment has a better label', () => {
    const result = buildResult({
      sessionDocs: [
        {
          id: 'session_slug_course',
          data: {
            date: '2099-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            teacherIds: ['teacher_fareeha'],
            childName: 'Niharrika',
            courseId: 'advanced-phonics',
            courseName: 'advanced-phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { id: 'enr_1', kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', teacherIds: ['teacher_fareeha'], courseId: 'advanced-phonics', courseName: 'Foundation Phonics' }],
      ]),
    });

    expect(result.issues[0].repairReasons).toContain('course_snapshot_slug_only');
    expect(result.issues[0].resolvedCourseName).toBe('Foundation Phonics');
  });

  it('detects missing teacherIds arrays', () => {
    const result = buildResult({
      sessionDocs: [
        {
          id: 'session_missing_teacher_ids',
          data: {
            date: '2099-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_fareeha',
            childName: 'Niharrika',
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { id: 'enr_1', kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', teacherIds: ['teacher_fareeha'] }],
      ]),
    });

    expect(result.issues[0].repairReasons).toContain('teacherIds_missing_or_invalid');
  });

  it('detects future session mismatch with the current enrollment teacher', () => {
    const result = buildResult({
      sessionDocs: [
        {
          id: 'session_teacher_mismatch',
          data: {
            date: '2099-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_rashi',
            teacherIds: ['teacher_rashi'],
            childName: 'Niharrika',
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { id: 'enr_1', kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', teacherIds: ['teacher_fareeha'], previousTeacherId: 'teacher_rashi' }],
      ]),
    });

    expect(result.issues[0].repairReasons).toContain('future_session_enrollment_teacher_mismatch');
    expect(result.issues[0].looksLikeTransferredStudent).toBe(true);
  });

  it('generates grouped repair payloads from the detected teacher transition', () => {
    const result = buildResult({
      sessionDocs: [
        {
          id: 'session_teacher_mismatch',
          data: {
            date: '2099-06-10',
            startTime: '10:00',
            enrollmentId: 'enr_1',
            kidId: 'kid_1',
            teacherId: 'teacher_rashi',
            teacherIds: ['teacher_rashi'],
            childName: 'Niharrika',
            courseName: 'Foundation Phonics',
          },
        },
      ],
      enrollmentById: new Map([
        ['enr_1', { id: 'enr_1', kidId: 'kid_1', childName: 'Niharrika', teacherId: 'teacher_fareeha', teacherIds: ['teacher_fareeha'], previousTeacherId: 'teacher_rashi' }],
      ]),
    });

    expect(result.groupedByEnrollment).toHaveLength(1);
    expect(result.groupedByEnrollment[0].repairPayloads[0]).toEqual({
      enrollmentId: 'enr_1',
      kidId: 'kid_1',
      fromTeacherUid: 'teacher_rashi',
      toTeacherUid: 'teacher_fareeha',
      fromDate: '2099-06-10',
    });
  });
});
