import { describe, expect, it } from 'vitest';
import { lessonMatchesSession, resolveSessionLessonId } from '../../lib/sessionResourceMatching';

describe('teacher session resource matching', () => {
  it('uses an explicit canonical session lesson association when present', () => {
    expect(resolveSessionLessonId({ lessonId: 'lesson-a', plannedLessonId: 'lesson-b' })).toBe('lesson-a');
    expect(lessonMatchesSession({ id: 'lesson-a', worksheetResources: [] }, { courseId: 'course-1', lessonId: 'lesson-a' })).toBe(true);
    expect(lessonMatchesSession({ id: 'lesson-b', worksheetResources: [{ targetCourseIds: ['course-1'] }] }, { courseId: 'course-1', lessonId: 'lesson-a' })).toBe(false);
  });

  it('falls back to an explicit course-scoped chooser without title parsing', () => {
    expect(lessonMatchesSession({ id: 'lesson-a', worksheetResources: [{ targetCourseIds: ['course-1'] }] }, { courseId: 'course-1' })).toBe(true);
    expect(lessonMatchesSession({ id: 'lesson-b', worksheetResources: [{ targetCourseIds: ['course-2'] }] }, { courseId: 'course-1' })).toBe(false);
  });
});
