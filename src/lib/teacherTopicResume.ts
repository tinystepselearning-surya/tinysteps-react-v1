export interface TeacherTopicResumeCurriculumTopic {
  id: string;
  order: number;
}

/**
 * Resolve the lesson the teacher should land on when opening Topic Progress.
 *
 * `latestTopicId` comes from the canonical child/course progress projection, which is
 * maintained from successful teacher progress saves. Only a topic that still belongs
 * to the current curriculum is accepted. A missing/stale projection value returns null
 * so the editor can safely fall back to the first curriculum lesson.
 */
export function selectTeacherTopicResumeId(
  latestTopicId: unknown,
  courseTopics: TeacherTopicResumeCurriculumTopic[],
): string | null {
  const candidate = typeof latestTopicId === 'string' ? latestTopicId.trim() : '';
  if (!candidate || !courseTopics.length) return null;
  return courseTopics.some((topic) => topic.id === candidate) ? candidate : null;
}
