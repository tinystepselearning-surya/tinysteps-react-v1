import { describe, expect, it } from 'vitest';
import {
  PHONICS_COURSES,
  PHONICS_CURRICULUM_TOPICS,
  PHONICS_CURRICULUM_REVISION,
  PHONICS_STAGE_DEFINITIONS,
} from './phonicsCurriculum';
import {
  CANONICAL_PHONICS_COURSE_LABELS,
  CANONICAL_PHONICS_STAGE_DEFINITIONS,
  CANONICAL_PHONICS_TOPICS,
  PHONICS_CURRICULUM_REVISION as SERVER_PHONICS_CURRICULUM_REVISION,
} from '../../functions/src/phonicsCurriculumConfig';

const contractShape = (topic: {
  id: string;
  courseId: string;
  lesson: string;
  lessonNumber: number;
  label: string;
  displayTitle: string;
  order: number;
  stageLabel: string;
  stageOrder: number;
  rubricType: string;
}) => ({
  id: topic.id,
  courseId: topic.courseId,
  lesson: topic.lesson,
  lessonNumber: topic.lessonNumber,
  label: topic.label,
  displayTitle: topic.displayTitle,
  order: topic.order,
  stageLabel: topic.stageLabel,
  stageOrder: topic.stageOrder,
  rubricType: topic.rubricType,
});

describe('phonics curriculum frontend/server single-source contract', () => {
  it('uses the same runtime curriculum revision, topics and stage definitions', () => {
    expect(PHONICS_CURRICULUM_REVISION).toBe(SERVER_PHONICS_CURRICULUM_REVISION);
    expect(PHONICS_CURRICULUM_TOPICS).toBe(CANONICAL_PHONICS_TOPICS);
    expect(PHONICS_STAGE_DEFINITIONS).toBe(CANONICAL_PHONICS_STAGE_DEFINITIONS);
  });

  it('keeps every canonical phonics topic identical across frontend and server enforcement', () => {
    expect(CANONICAL_PHONICS_TOPICS.map(contractShape))
      .toEqual(PHONICS_CURRICULUM_TOPICS.map(contractShape));
  });

  it('derives frontend course labels and lesson counts from the shared canonical source', () => {
    const courseIds = [
      'phonics-foundations',
      'early-phonics',
      'advanced-phonics',
    ] as const;

    courseIds.forEach((courseId) => {
      expect(PHONICS_COURSES[courseId].label).toBe(CANONICAL_PHONICS_COURSE_LABELS[courseId]);
      expect(PHONICS_COURSES[courseId].lessonCount).toBe(
        CANONICAL_PHONICS_TOPICS.filter((topic) => topic.courseId === courseId).length,
      );
      expect(PHONICS_COURSES[courseId].stages).toBe(
        CANONICAL_PHONICS_STAGE_DEFINITIONS[courseId],
      );
    });
  });
});
