import type { TeacherSession } from '../types/Teacher';

export type SessionResourceLesson = {
  id: string;
  worksheetResources: Array<{ targetCourseIds?: string[] }>;
};

export function resolveSessionLessonId(session: Pick<TeacherSession, 'lessonId' | 'plannedLessonId'>): string {
  return String(session.lessonId || session.plannedLessonId || '').trim();
}

export function lessonMatchesSession(
  lesson: SessionResourceLesson,
  session: Pick<TeacherSession, 'courseId' | 'lessonId' | 'plannedLessonId'>,
): boolean {
  const canonicalId = resolveSessionLessonId(session);
  if (canonicalId) return lesson.id === canonicalId;
  const courseId = String(session.courseId || '').trim();
  return !!courseId && lesson.worksheetResources.some((resource) => (resource.targetCourseIds || []).includes(courseId));
}
