import { describe, expect, it } from 'vitest';
import {
  buildSessionRepairPatch,
  buildSessionRepairQueryCoverage,
  buildTeacherReassignmentJoinLinkPatch,
} from '../src/lifecycle';

describe('buildSessionRepairQueryCoverage', () => {
  it('always includes the primary enrollmentId query', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: null,
      kidIds: [],
      studentId: null,
      childId: null,
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    expect(coverage).toEqual([
      expect.objectContaining({
        field: 'enrollmentId',
        op: '==',
        value: 'enr_123',
        source: 'enrollmentId',
        legacy: false,
      }),
    ]);
  });

  it('covers actual studentId plus legacy studentId fallback when ids differ', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      studentId: 'student_1',
      childId: null,
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    expect(coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'studentId', op: '==', value: 'student_1', legacy: false }),
        expect.objectContaining({ field: 'studentIds', op: 'array-contains', value: 'student_1', legacy: false }),
        expect.objectContaining({ field: 'studentId', op: '==', value: 'kid_1', legacy: true }),
        expect.objectContaining({ field: 'studentIds', op: 'array-contains', value: 'kid_1', legacy: true }),
      ]),
    );
  });

  it('covers childId and both child array aliases', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      studentId: 'student_1',
      childId: 'child_1',
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    expect(coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'childId', op: '==', value: 'child_1', legacy: false }),
        expect.objectContaining({ field: 'childIds', op: 'array-contains', value: 'child_1', legacy: false }),
        expect.objectContaining({ field: 'childrenIds', op: 'array-contains', value: 'child_1', legacy: false }),
        expect.objectContaining({ field: 'childId', op: '==', value: 'kid_1', legacy: true }),
        expect.objectContaining({ field: 'childIds', op: 'array-contains', value: 'kid_1', legacy: true }),
        expect.objectContaining({ field: 'childrenIds', op: 'array-contains', value: 'kid_1', legacy: true }),
      ]),
    );
  });

  it('deduplicates queries when identity aliases collapse to the same id', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: 'same_id',
      kidIds: ['same_id'],
      studentId: 'same_id',
      childId: 'same_id',
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    const keys = coverage.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(coverage.filter((entry) => entry.legacy)).toHaveLength(0);
  });
});

describe('teacher reassignment join-link handling', () => {
  it('clears denormalized meeting-link aliases when no replacement link is provided', () => {
    expect(buildTeacherReassignmentJoinLinkPatch(null)).toEqual({
      joinUrl: null,
      meetingLink: null,
      classLink: null,
    });
  });

  it('rewrites future session snapshots to remove stale meeting links during reassignment', () => {
    const patch = buildSessionRepairPatch({
      existing: {
        enrollmentId: 'enr_123',
        teacherId: 'teacher_old',
        teacherIds: ['teacher_old'],
        joinUrl: 'https://old-teacher.example.com/room',
        meetingLink: 'https://old-teacher.example.com/room',
        classLink: 'https://old-teacher.example.com/room',
      },
      teacher: {
        teacherId: 'teacher_new',
        teacherIds: ['teacher_new'],
        teacherName: 'Teacher New',
        teacherDisplayName: 'Teacher New',
        teacherEmail: 'teacher.new@example.com',
      },
      student: {
        kidId: 'kid_1',
        kidIds: ['kid_1'],
        studentId: 'kid_1',
        childId: 'kid_1',
        studentName: 'Student One',
        kidName: 'Student One',
        childName: 'Student One',
        studentFullName: 'Student One',
        kidFullName: 'Student One',
        childFullName: 'Student One',
      },
      enrollment: {
        enrollmentId: 'enr_123',
        courseId: 'course_1',
        courseName: 'Course One',
        parentId: 'parent_1',
        parentIds: ['parent_1'],
        joinUrl: null,
      },
      actorIdentity: 'admin_1',
      previousTeacherId: 'teacher_old',
      previousTeacherName: 'Teacher Old',
      previousTeacherEmail: 'teacher.old@example.com',
      includeEnrollmentId: false,
    });

    expect(patch).toMatchObject({
      teacherId: 'teacher_new',
      teacherIds: ['teacher_new'],
      assignedTeacherId: 'teacher_new',
      primaryTeacherId: 'teacher_new',
      joinUrl: null,
      meetingLink: null,
      classLink: null,
    });
  });
});
