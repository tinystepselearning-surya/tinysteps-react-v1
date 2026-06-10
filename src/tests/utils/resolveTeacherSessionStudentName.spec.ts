import { describe, expect, it } from 'vitest';
import {
  resolveTeacherSessionCourseLabel,
  resolveTeacherSessionStudentName,
} from '../../pages/teacher/utils/resolveTeacherSessionStudentName';

describe('resolveTeacherSessionStudentName', () => {
  it('uses enrollment childName when session childName is missing', () => {
    const result = resolveTeacherSessionStudentName(
      {
        id: 'session-1',
        courseId: 'phonics-foundations',
        date: '2026-06-10',
        startTime: '20:00',
      },
      {
        enrollment: {
          childName: 'Niharrika',
        },
      },
    );

    expect(result.name).toBe('Niharrika');
  });

  it('rejects assigned-count placeholders and falls back to enrollment childName', () => {
    const result = resolveTeacherSessionStudentName(
      {
        id: 'session-2',
        childName: '1 assigned',
        courseId: 'advanced-phonics',
        date: '2026-06-10',
        startTime: '20:00',
      },
      {
        enrollment: {
          childName: 'Niharrika',
        },
      },
    );

    expect(result.name).toBe('Niharrika');
  });

  it('returns Student when assigned-count placeholders are the only name-like values', () => {
    const result = resolveTeacherSessionStudentName({
      id: 'session-3',
      childName: '1 assigned',
      courseId: 'advanced-phonics',
      date: '2026-06-10',
      startTime: '20:00',
      kidIds: ['kid-1'],
    });

    expect(result.name).toBe('Student');
  });
});

describe('resolveTeacherSessionCourseLabel', () => {
  it('prefers a human-readable enrollment course name over a slug-like session course value', () => {
    const result = resolveTeacherSessionCourseLabel(
      {
        courseId: 'advanced-phonics',
        courseName: 'advanced-phonics',
      },
      {
        courseName: 'Foundation Phonics',
      },
    );

    expect(result).toBe('Foundation Phonics');
  });
});
