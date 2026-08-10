import { describe, expect, it } from 'vitest';
import { PHONICS_CURRICULUM_TOPICS, PHONICS_CURRICULUM_REVISION } from './phonicsCurriculum';
import {
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

describe('phonics curriculum frontend/server contract', () => {
  it('uses the same curriculum revision', () => {
    expect(SERVER_PHONICS_CURRICULUM_REVISION).toBe(PHONICS_CURRICULUM_REVISION);
  });

  it('keeps every canonical phonics topic identical across frontend and server enforcement', () => {
    expect(CANONICAL_PHONICS_TOPICS.map(contractShape))
      .toEqual(PHONICS_CURRICULUM_TOPICS.map(contractShape));
  });
});
