import { describe, expect, it } from 'vitest';
import {
  PHONICS_COURSES,
  PHONICS_CURRICULUM_REVISION,
  PHONICS_CURRICULUM_TOPICS,
  PHONICS_STAGE_DEFINITIONS,
  type PhonicsCourseId,
} from './phonicsCurriculum';
import {
  CANONICAL_PHONICS_TOPICS,
  PHONICS_CURRICULUM_REVISION as SERVER_PHONICS_CURRICULUM_REVISION,
} from '../../functions/src/phonicsCurriculumConfig';

const COURSE_COUNTS: Record<PhonicsCourseId, number> = {
  'phonics-foundations': 31,
  'early-phonics': 40,
  'advanced-phonics': 30,
};

describe('phonics curriculum single-source contract', () => {
  it('uses the server enforcement source and revision unchanged in the frontend', () => {
    expect(PHONICS_CURRICULUM_REVISION).toBe(SERVER_PHONICS_CURRICULUM_REVISION);
    expect(PHONICS_CURRICULUM_TOPICS).toEqual(CANONICAL_PHONICS_TOPICS);
  });

  it('preserves the approved 31 / 40 / 30 course counts and deterministic ids', () => {
    for (const [courseId, expectedCount] of Object.entries(COURSE_COUNTS) as Array<[PhonicsCourseId, number]>) {
      const lessons = PHONICS_CURRICULUM_TOPICS.filter((topic) => topic.courseId === courseId);
      expect(lessons).toHaveLength(expectedCount);
      expect(PHONICS_COURSES[courseId].lessonCount).toBe(expectedCount);
      expect(lessons.map((lesson) => lesson.id)).toEqual(
        Array.from({ length: expectedCount }, (_, index) =>
          `${courseId}__lesson-${String(index + 1).padStart(2, '0')}`,
        ),
      );
    }
    expect(new Set(PHONICS_CURRICULUM_TOPICS.map((topic) => topic.id)).size)
      .toBe(PHONICS_CURRICULUM_TOPICS.length);
  });

  it('derives frontend stage boundaries exactly from the canonical lesson metadata', () => {
    for (const courseId of Object.keys(COURSE_COUNTS) as PhonicsCourseId[]) {
      const lessons = PHONICS_CURRICULUM_TOPICS.filter((topic) => topic.courseId === courseId);
      const stages = PHONICS_STAGE_DEFINITIONS[courseId];

      expect(stages.map((stage) => stage.stageOrder)).toEqual(
        Array.from(new Set(lessons.map((lesson) => lesson.stageOrder))).sort((a, b) => a - b),
      );

      stages.forEach((stage) => {
        const stageLessons = lessons.filter((lesson) => lesson.stageOrder === stage.stageOrder);
        expect(stageLessons.length).toBeGreaterThan(0);
        expect(new Set(stageLessons.map((lesson) => lesson.stageLabel))).toEqual(new Set([stage.label]));
        expect(stage.start).toBe(Math.min(...stageLessons.map((lesson) => lesson.lessonNumber)));
        expect(stage.end).toBe(Math.max(...stageLessons.map((lesson) => lesson.lessonNumber)));
      });
    }
  });
});
