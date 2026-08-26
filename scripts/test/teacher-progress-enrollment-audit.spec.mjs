import { describe, expect, it } from 'vitest';

import {
  buildProgressEnrollmentAudit,
  classifyProgressEnrollment,
  enrollmentBelongsToKid,
} from '../lib/teacher-progress-enrollment-audit.mjs';

const enrollment = (id, data) => ({ id, data });
const progress = (kidId, topicId, data) => ({
  path: `students/${kidId}/progress/${topicId}`,
  data,
});

describe('teacher progress enrollment audit', () => {
  it('uses canonical enrollment kidId before stale legacy aliases', () => {
    expect(enrollmentBelongsToKid({
      kidId: 'child-a',
      studentId: 'child-b',
      childId: 'child-b',
      kidIds: ['child-b'],
    }, 'child-a')).toBe(true);
    expect(enrollmentBelongsToKid({
      kidId: 'child-a',
      studentId: 'child-b',
      childId: 'child-b',
      kidIds: ['child-b'],
    }, 'child-b')).toBe(false);
  });

  it('classifies an existing valid enrollmentId as already correct', () => {
    const row = classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', {
        courseId: 'phonics-foundations',
        enrollmentId: 'enroll-a',
      }),
      enrollments: [enrollment('enroll-a', {
        kidId: 'child-a',
        courseId: 'phonics-foundations',
      })],
    });
    expect(row.kind).toBe('already_correct');
  });

  it('marks a missing enrollmentId migratable only when child + course has exactly one match', () => {
    const row = classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', { courseId: 'phonics-foundations' }),
      enrollments: [
        enrollment('enroll-a', { kidId: 'child-a', courseId: 'phonics-foundations' }),
        enrollment('other-course', { kidId: 'child-a', courseId: 'basic-grammar' }),
      ],
    });
    expect(row.kind).toBe('migratable_unique');
    expect(row.targetEnrollmentId).toBe('enroll-a');
  });

  it('does not guess when multiple enrollments match the same child + course', () => {
    const row = classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', { courseId: 'phonics-foundations' }),
      enrollments: [
        enrollment('enroll-a', { kidId: 'child-a', courseId: 'phonics-foundations' }),
        enrollment('enroll-a-history', { studentId: 'child-a', courseId: 'phonics-foundations' }),
      ],
    });
    expect(row.kind).toBe('ambiguous');
    expect(row.candidateEnrollmentIds).toEqual(['enroll-a', 'enroll-a-history']);
  });

  it('reports zero-match, missing-course and conflicting existing enrollment cases', () => {
    const enrollments = [
      enrollment('enroll-a', { kidId: 'child-a', courseId: 'phonics-foundations' }),
    ];

    expect(classifyProgressEnrollment({
      ...progress('child-b', 'lesson-1', { courseId: 'phonics-foundations' }),
      enrollments,
    }).kind).toBe('unmapped');

    expect(classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', {}),
      enrollments,
    }).kind).toBe('missing_course_id');

    expect(classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', {
        courseId: 'phonics-foundations',
        enrollmentId: 'does-not-exist',
      }),
      enrollments,
    }).kind).toBe('conflicting_enrollment_missing');

    expect(classifyProgressEnrollment({
      ...progress('child-b', 'lesson-1', {
        courseId: 'phonics-foundations',
        enrollmentId: 'enroll-a',
      }),
      enrollments,
    }).kind).toBe('conflicting_enrollment_child');

    expect(classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', {
        courseId: 'basic-grammar',
        enrollmentId: 'enroll-a',
      }),
      enrollments,
    }).kind).toBe('conflicting_enrollment_course');
  });

  it('is idempotent: a uniquely backfilled record becomes already correct on the next run', () => {
    const enrollments = [
      enrollment('enroll-a', { kidId: 'child-a', courseId: 'phonics-foundations' }),
    ];
    const before = classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', { courseId: 'phonics-foundations' }),
      enrollments,
    });
    expect(before.kind).toBe('migratable_unique');

    const after = classifyProgressEnrollment({
      ...progress('child-a', 'lesson-1', {
        courseId: 'phonics-foundations',
        enrollmentId: before.targetEnrollmentId,
      }),
      enrollments,
    });
    expect(after.kind).toBe('already_correct');
  });

  it('summarizes dry-run counts without treating ambiguous/conflicting records as updates', () => {
    const enrollments = [
      enrollment('enroll-a', { kidId: 'child-a', courseId: 'phonics-foundations' }),
      enrollment('enroll-a-2', { studentId: 'child-a', courseId: 'phonics-foundations' }),
      enrollment('enroll-b', { kidId: 'child-b', courseId: 'early-phonics' }),
    ];
    const audit = buildProgressEnrollmentAudit({
      enrollments,
      progressDocs: [
        progress('child-b', 'lesson-1', {
          courseId: 'early-phonics',
          enrollmentId: 'enroll-b',
        }),
        progress('child-c', 'lesson-1', { courseId: 'advanced-phonics' }),
        progress('child-a', 'lesson-1', { courseId: 'phonics-foundations' }),
        progress('child-b', 'lesson-2', { courseId: 'early-phonics' }),
        progress('child-b', 'lesson-3', {
          courseId: 'basic-grammar',
          enrollmentId: 'enroll-b',
        }),
        progress('child-d', 'lesson-1', {}),
      ],
    });

    expect(audit.summary).toEqual({
      totalExamined: 6,
      withEnrollmentId: 2,
      missingEnrollmentId: 4,
      uniqueMapping: 1,
      ambiguous: 1,
      conflicting: 1,
      unmapped: 1,
      missingCourseId: 1,
      alreadyCorrect: 1,
      wouldUpdate: 1,
    });
  });
});
