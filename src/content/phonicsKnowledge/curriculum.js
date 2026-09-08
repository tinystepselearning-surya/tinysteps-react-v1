// Read-only bridge: Node >=22.18 strips the canonical source's erasable types;
// Vite already consumes this same source through phonicsCurriculum.ts.
// No copied lesson sequence, titles, or independent curriculum is maintained here.
import { CANONICAL_PHONICS_TOPICS } from '../../../functions/src/phonicsCurriculumConfig.ts';

export const PHONICS_KNOWLEDGE_CURRICULUM = Object.freeze(
  CANONICAL_PHONICS_TOPICS.map((lesson) => Object.freeze({ ...lesson })),
);
export function getKnowledgeCurriculumRefs(predicate) {
  return PHONICS_KNOWLEDGE_CURRICULUM.filter(predicate).map((lesson) => ({
    lessonId: lesson.id,
    courseId: lesson.courseId,
    lessonNumber: lesson.lessonNumber,
    label: lesson.label,
  }));
}
