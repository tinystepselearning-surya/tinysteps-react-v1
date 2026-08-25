import { describe, expect, it } from 'vitest';

import type { ChildCourseProgressProjection } from '../../hooks/useChildCourseProgressProjection';
import { buildCanonicalParentDetailedLessonProgress } from '../../pages/parent/parentDetailedLessonProgress';

const curriculumData = {
  topics: [
    {
      id: 'lesson-1',
      courseId: 'early-phonics',
      courseLabel: 'Early Phonics',
      displayTitle: 'Lesson 1 — Core sounds',
      lessonNumber: 1,
      stageLabel: 'Stage 1 — Core sounds',
      stageOrder: 1,
    },
    {
      id: 'lesson-2',
      courseId: 'early-phonics',
      courseLabel: 'Early Phonics',
      displayTitle: 'Lesson 2 — Blending',
      lessonNumber: 2,
      stageLabel: 'Stage 1 — Core sounds',
      stageOrder: 1,
    },
    {
      id: 'lesson-3',
      courseId: 'early-phonics',
      courseLabel: 'Early Phonics',
      displayTitle: 'Lesson 3 — Magic E',
      lessonNumber: 3,
      stageLabel: 'Stage 2 — Word rules',
      stageOrder: 2,
    },
    {
      id: 'lesson-4',
      courseId: 'early-phonics',
      courseLabel: 'Early Phonics',
      displayTitle: 'Lesson 4 — Diphthongs',
      lessonNumber: 4,
      stageLabel: 'Stage 3 — Diphthongs',
      stageOrder: 3,
    },
    {
      id: 'other-course-1',
      courseId: 'advanced-phonics',
      displayTitle: 'Other course lesson',
      lessonNumber: 1,
      stageLabel: 'Stage 1 — Other',
      stageOrder: 1,
    },
  ],
};

const canonicalProjection: ChildCourseProgressProjection = {
  schemaVersion: 2,
  modelType: 'child_course_progress_v2',
  completionAuthority: 'teacher_lesson_status',
  definitionStatus: 'configured',
  courseId: 'early-phonics',
  courseLabel: 'Early Phonics',
  totalTopics: 4,
  completedTopics: 1,
  inProgressTopics: 2,
  notStartedTopics: 1,
  overallPct: 25,
  totalStages: 3,
  completedStages: 0,
  stageSummaries: [
    {
      key: '1__Stage 1 — Core sounds',
      label: 'Stage 1 — Core sounds',
      order: 1,
      totalTopics: 2,
      completedTopics: 1,
      inProgressTopics: 1,
      notStartedTopics: 0,
      completionPct: 50,
    },
    {
      key: '2__Stage 2 — Word rules',
      label: 'Stage 2 — Word rules',
      order: 2,
      totalTopics: 1,
      completedTopics: 0,
      inProgressTopics: 1,
      notStartedTopics: 0,
      completionPct: 0,
    },
    {
      key: '3__Stage 3 — Diphthongs',
      label: 'Stage 3 — Diphthongs',
      order: 3,
      totalTopics: 1,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 1,
      completionPct: 0,
    },
  ],
  lastUpdatedAtMs: 4000,
};

const progressDocs: Array<Record<string, unknown>> = [
  {
    id: 'lesson-1',
    topicId: 'lesson-1',
    lessonStatus: 'completed',
    mastery: 'developing',
    updatedAt: 1000,
  },
  {
    id: 'lesson-2',
    topicId: 'lesson-2',
    lessonStatus: 'in_progress',
    mastery: 'mastered',
    updatedAt: 2000,
  },
  {
    id: 'lesson-3',
    topicId: 'lesson-3',
    masteryKey: 'proficient',
    teacherRemark: 'Reviewed Magic E.',
    updatedAt: 3000,
  },
  {
    id: 'stray',
    topicId: 'not-in-curriculum',
    lessonStatus: 'completed',
    mastery: 'mastered',
    updatedAt: 9000,
  },
];

describe('Brick P6 detailed lesson progress selector', () => {
  it('reconciles course, stage and lesson states to the canonical P3 projection', () => {
    const detail = buildCanonicalParentDetailedLessonProgress({
      courseProjection: canonicalProjection,
      expectedCourseId: 'early-phonics',
      curriculumData,
      progressDocs,
    });

    expect(detail).not.toBeNull();
    expect(detail).toMatchObject({
      totalLessons: 4,
      completedLessons: 1,
      inProgressLessons: 2,
      notStartedLessons: 1,
      completionPct: 25,
      completedStages: 0,
    });
    expect(detail?.stages[0]).toMatchObject({
      totalLessons: 2,
      completedLessons: 1,
      inProgressLessons: 1,
      notStartedLessons: 0,
      completionPct: 50,
    });
    expect(detail?.stages[1]).toMatchObject({
      completedLessons: 0,
      inProgressLessons: 1,
      completionPct: 0,
    });
  });

  it('never lets mastered or proficient learning evidence complete a lesson', () => {
    const detail = buildCanonicalParentDetailedLessonProgress({
      courseProjection: canonicalProjection,
      expectedCourseId: 'early-phonics',
      curriculumData,
      progressDocs,
    });

    const lesson2 = detail?.stages.flatMap((stage) => stage.lessons).find((lesson) => lesson.id === 'lesson-2');
    const lesson3 = detail?.stages.flatMap((stage) => stage.lessons).find((lesson) => lesson.id === 'lesson-3');
    expect(lesson2?.lessonStatus).toBe('in_progress');
    expect(lesson3?.lessonStatus).toBe('in_progress');
    expect(detail?.completedLessons).toBe(1);
  });

  it('allows explicit completed status to coexist with developing mastery', () => {
    const detail = buildCanonicalParentDetailedLessonProgress({
      courseProjection: canonicalProjection,
      expectedCourseId: 'early-phonics',
      curriculumData,
      progressDocs,
    });
    const lesson1 = detail?.stages.flatMap((stage) => stage.lessons).find((lesson) => lesson.id === 'lesson-1');
    expect(lesson1?.lessonStatus).toBe('completed');
  });

  it('treats legacy numeric mastery as in progress rather than completed', () => {
    const numericProgress = progressDocs.map((row) =>
      row.topicId === 'lesson-3'
        ? { id: 'lesson-3', topicId: 'lesson-3', masteryPct: 80, updatedAt: 3500 }
        : row,
    );
    const detail = buildCanonicalParentDetailedLessonProgress({
      courseProjection: canonicalProjection,
      expectedCourseId: 'early-phonics',
      curriculumData,
      progressDocs: numericProgress,
    });
    const lesson3 = detail?.stages.flatMap((stage) => stage.lessons).find((lesson) => lesson.id === 'lesson-3');
    expect(lesson3?.lessonStatus).toBe('in_progress');
  });

  it('ignores stray progress rows that are not canonical curriculum topics', () => {
    const detail = buildCanonicalParentDetailedLessonProgress({
      courseProjection: canonicalProjection,
      expectedCourseId: 'early-phonics',
      curriculumData,
      progressDocs,
    });
    expect(detail?.totalLessons).toBe(4);
    expect(detail?.stages.flatMap((stage) => stage.lessons).some((lesson) => lesson.id === 'not-in-curriculum')).toBe(false);
  });

  it('selects the highest progressed incomplete stage as the curriculum frontier', () => {
    const detail = buildCanonicalParentDetailedLessonProgress({
      courseProjection: canonicalProjection,
      expectedCourseId: 'early-phonics',
      curriculumData,
      progressDocs,
    });
    expect(detail?.activeStage?.key).toBe('2__Stage 2 — Word rules');
    expect(detail?.nextStage?.key).toBe('3__Stage 3 — Diphthongs');
  });

  it('returns unavailable when lesson detail disagrees with P3 instead of showing a second calculation', () => {
    const inconsistentProjection: ChildCourseProgressProjection = {
      ...canonicalProjection,
      completedTopics: 2,
      inProgressTopics: 1,
      overallPct: 50,
      stageSummaries: canonicalProjection.stageSummaries?.map((stage, index) =>
        index === 1
          ? {
              ...stage,
              completedTopics: 1,
              inProgressTopics: 0,
              completionPct: 100,
            }
          : stage,
      ),
    };
    expect(
      buildCanonicalParentDetailedLessonProgress({
        courseProjection: inconsistentProjection,
        expectedCourseId: 'early-phonics',
        curriculumData,
        progressDocs,
      }),
    ).toBeNull();
  });

  it('rejects legacy or wrong-authority projections before considering local detail', () => {
    expect(
      buildCanonicalParentDetailedLessonProgress({
        courseProjection: { ...canonicalProjection, schemaVersion: 1 },
        expectedCourseId: 'early-phonics',
        curriculumData,
        progressDocs,
      }),
    ).toBeNull();
    expect(
      buildCanonicalParentDetailedLessonProgress({
        courseProjection: { ...canonicalProjection, completionAuthority: 'mastery' },
        expectedCourseId: 'early-phonics',
        curriculumData,
        progressDocs,
      }),
    ).toBeNull();
  });
});
