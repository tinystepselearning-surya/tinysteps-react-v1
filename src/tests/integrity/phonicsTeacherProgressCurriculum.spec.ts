import { describe, expect, it } from 'vitest';

import {
  PHONICS_COURSES,
  PHONICS_CURRICULUM_TOPICS,
  PHONICS_STAGE_DEFINITIONS,
  getPhonicsLessons,
  type PhonicsCourseId,
} from '../../content/phonicsCurriculum';
import { getProgressSkillsForLesson } from '../../lib/progressSkills';

const EXPECTED_LESSON_COUNTS: Record<PhonicsCourseId, number> = {
  'phonics-foundations': 31,
  'early-phonics': 40,
  'advanced-phonics': 30,
};

const COURSE_IDS = Object.keys(EXPECTED_LESSON_COUNTS) as PhonicsCourseId[];

describe('canonical phonics teacher progress curriculum integrity', () => {
  it('keeps the approved 31 / 40 / 30 lesson totals and 101 unique progress document ids', () => {
    expect(PHONICS_CURRICULUM_TOPICS).toHaveLength(101);
    expect(new Set(PHONICS_CURRICULUM_TOPICS.map((lesson) => lesson.id)).size).toBe(101);

    for (const courseId of COURSE_IDS) {
      const expectedCount = EXPECTED_LESSON_COUNTS[courseId];
      expect(PHONICS_COURSES[courseId].lessonCount).toBe(expectedCount);
      expect(getPhonicsLessons(courseId)).toHaveLength(expectedCount);
    }
  });

  it.each(COURSE_IDS)('certifies lesson identity, stage and rubric coverage for %s', (courseId) => {
    const lessons = getPhonicsLessons(courseId);
    const stages = PHONICS_STAGE_DEFINITIONS[courseId];

    lessons.forEach((lesson, index) => {
      const lessonNumber = index + 1;
      const expectedId = `${courseId}__lesson-${String(lessonNumber).padStart(2, '0')}`;
      const matchingStages = stages.filter(
        (stage) => lessonNumber >= stage.start && lessonNumber <= stage.end,
      );

      expect(lesson.id).toBe(expectedId);
      expect(lesson.courseId).toBe(courseId);
      expect(lesson.courseLabel).toBe(PHONICS_COURSES[courseId].label);
      expect(lesson.area).toBe('phonics');
      expect(lesson.lesson).toBe(`Lesson-${lessonNumber}`);
      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.order).toBe(lessonNumber);
      expect(lesson.displayTitle).toBe(`Lesson ${lessonNumber} — ${lesson.label}`);

      expect(matchingStages).toHaveLength(1);
      expect(lesson.stageLabel).toBe(matchingStages[0].label);
      expect(lesson.stageOrder).toBe(matchingStages[0].stageOrder);
      expect(lesson.rubricType.trim().length).toBeGreaterThan(0);

      const skills = getProgressSkillsForLesson({
        courseId: lesson.courseId,
        topicId: lesson.id,
        lessonId: lesson.lesson,
        rubricType: lesson.rubricType,
        stageLabel: lesson.stageLabel,
        lessonTitle: lesson.displayTitle,
        topicLabel: lesson.label,
        area: lesson.area,
      });

      expect(skills.length).toBeGreaterThanOrEqual(4);
      expect(skills.length).toBeLessThanOrEqual(6);
      expect(new Set(skills.map((skill) => skill.key)).size).toBe(skills.length);
      expect(new Set(skills.map((skill) => skill.label)).size).toBe(skills.length);
      expect(skills.every((skill) => skill.area === 'phonics')).toBe(true);
    });
  });

  it('keeps every stage contiguous with no gaps or overlaps', () => {
    for (const courseId of COURSE_IDS) {
      const stages = PHONICS_STAGE_DEFINITIONS[courseId];
      const coveredLessonNumbers = stages.flatMap((stage) =>
        Array.from({ length: stage.end - stage.start + 1 }, (_, index) => stage.start + index),
      );
      const expectedLessonNumbers = Array.from(
        { length: EXPECTED_LESSON_COUNTS[courseId] },
        (_, index) => index + 1,
      );

      expect(coveredLessonNumbers).toEqual(expectedLessonNumbers);
      expect(new Set(coveredLessonNumbers).size).toBe(coveredLessonNumbers.length);
    }
  });
});
