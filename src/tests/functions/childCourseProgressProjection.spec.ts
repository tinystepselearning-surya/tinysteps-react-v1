import { describe, expect, it } from 'vitest';

import {
  applyIncrementalSummary,
  buildSummaryFromDocs,
  courseTopicIds,
  docsForCourse,
  normalizeCourseId,
  progressState,
  projectionMatchesCurriculum,
} from '../../../functions/src/childCourseProgressProjection';

const curriculum = {
  topics: [
    {
      id: 'lesson-1',
      courseId: 'phonics-foundations',
      courseLabel: 'Foundation Phonics',
      displayTitle: 'Lesson 1 — S',
      lessonNumber: 1,
      stageLabel: 'Stage 1 — Letters',
      stageOrder: 1,
    },
    {
      id: 'lesson-2',
      courseId: 'phonics-foundations',
      courseLabel: 'Foundation Phonics',
      displayTitle: 'Lesson 2 — A',
      lessonNumber: 2,
      stageLabel: 'Stage 1 — Letters',
      stageOrder: 1,
    },
    {
      id: 'lesson-3',
      courseId: 'phonics-foundations',
      courseLabel: 'Foundation Phonics',
      displayTitle: 'Lesson 3 — T',
      lessonNumber: 3,
      stageLabel: 'Stage 2 — More letters',
      stageOrder: 2,
    },
    {
      id: 'lesson-4',
      courseId: 'phonics-foundations',
      courseLabel: 'Foundation Phonics',
      displayTitle: 'Lesson 4 — I',
      lessonNumber: 4,
      stageLabel: 'Stage 2 — More letters',
      stageOrder: 2,
    },
  ],
};

const fakeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
}) as any;

describe('child course progress projection v3', () => {
  it('normalizes supported legacy course aliases', () => {
    expect(normalizeCourseId('phonics-foundation')).toBe('phonics-foundations');
    expect(normalizeCourseId('Grammar-Essentials')).toBe('basic-grammar');
  });

  it('treats a saved canonical lesson document as one completed curriculum lesson', () => {
    expect(progressState(null)).toBe('not_started');
    expect(progressState({})).toBe('completed');
    expect(progressState({ lessonStatus: 'in_progress', mastery: 'developing' })).toBe('completed');
    expect(progressState({ lessonStatus: 'in_progress', progressRatings: { blending: 1 } })).toBe('completed');
    expect(progressState({ lessonStatus: 'completed', mastery: 'mastered' })).toBe('completed');
  });

  it('builds course and stage totals from unique saved canonical lesson documents', () => {
    const docs = [
      fakeDoc('lesson-1', {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
        mastery: 'developing',
        updatedAt: new Date('2026-08-25T09:00:00.000Z'),
      }),
      fakeDoc('lesson-2', {
        topicId: 'lesson-2',
        courseId: 'phonics-foundations',
        lessonStatus: 'completed',
        mastery: 'mastered',
        updatedAt: new Date('2026-08-25T10:00:00.000Z'),
      }),
      fakeDoc('lesson-3', {
        topicId: 'lesson-3',
        courseId: 'phonics-foundations',
        mastery: 'developing',
        teacherRemark: 'Saved teacher progress.',
        updatedAt: new Date('2026-08-25T11:00:00.000Z'),
      }),
    ];

    const summary = buildSummaryFromDocs(
      'kid-1',
      'phonics-foundations',
      docs as any,
      curriculum,
    );

    expect(summary.schemaVersion).toBe(3);
    expect(summary.modelType).toBe('child_course_progress_v3');
    expect(summary.completionAuthority).toBe('teacher_progress_save');
    expect(summary.definitionStatus).toBe('configured');
    expect(summary.totalTopics).toBe(4);
    expect(summary.completedTopics).toBe(3);
    expect(summary.inProgressTopics).toBe(0);
    expect(summary.notStartedTopics).toBe(1);
    expect(summary.overallPct).toBe(75);
    expect(summary.totalStages).toBe(2);
    expect(summary.completedStages).toBe(1);

    const [stage1, stage2] = summary.stageSummaries;
    expect(stage1).toMatchObject({
      order: 1,
      totalTopics: 2,
      completedTopics: 2,
      inProgressTopics: 0,
      notStartedTopics: 0,
      completionPct: 100,
    });
    expect(stage2).toMatchObject({
      order: 2,
      totalTopics: 2,
      completedTopics: 1,
      inProgressTopics: 0,
      notStartedTopics: 1,
      completionPct: 50,
    });

    const stageCompleted = summary.stageSummaries.reduce((sum, stage) => sum + stage.completedTopics, 0);
    const stageNotStarted = summary.stageSummaries.reduce((sum, stage) => sum + stage.notStartedTopics, 0);
    expect(stageCompleted).toBe(summary.completedTopics);
    expect(stageNotStarted).toBe(summary.notStartedTopics);
    expect(summary.completedTopics + summary.notStartedTopics).toBe(summary.totalTopics);
  });

  it('counts the first save once and keeps re-saves of the same lesson idempotent', () => {
    const firstSave = applyIncrementalSummary({
      existing: null,
      kidId: 'kid-2',
      courseId: 'phonics-foundations',
      topicId: 'lesson-1',
      beforeData: null,
      afterData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
        mastery: 'developing',
        updatedAt: new Date('2026-08-25T09:00:00.000Z'),
      },
      curriculumData: curriculum,
    });

    expect(firstSave.completedTopics).toBe(1);
    expect(firstSave.notStartedTopics).toBe(3);
    expect(firstSave.overallPct).toBe(25);

    const starsChangedAndSavedAgain = applyIncrementalSummary({
      existing: firstSave,
      kidId: 'kid-2',
      courseId: 'phonics-foundations',
      topicId: 'lesson-1',
      beforeData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
        mastery: 'developing',
      },
      afterData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
        mastery: 'mastered',
        progressRatings: { soundRecall: 4 },
        updatedAt: new Date('2026-08-25T10:00:00.000Z'),
      },
      curriculumData: curriculum,
    });

    expect(starsChangedAndSavedAgain.completedTopics).toBe(1);
    expect(starsChangedAndSavedAgain.notStartedTopics).toBe(3);
    expect(starsChangedAndSavedAgain.overallPct).toBe(25);

    const learningStatusChangedAndSavedAgain = applyIncrementalSummary({
      existing: starsChangedAndSavedAgain,
      kidId: 'kid-2',
      courseId: 'phonics-foundations',
      topicId: 'lesson-1',
      beforeData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
      },
      afterData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'completed',
        updatedAt: new Date('2026-08-25T11:00:00.000Z'),
      },
      curriculumData: curriculum,
    });

    expect(learningStatusChangedAndSavedAgain.completedTopics).toBe(1);
    expect(learningStatusChangedAndSavedAgain.inProgressTopics).toBe(0);
    expect(learningStatusChangedAndSavedAgain.overallPct).toBe(25);
  });

  it('keeps only a bounded recent teacher-evidence window', () => {
    const manyTopics = {
      topics: Array.from({ length: 8 }, (_, index) => ({
        id: `lesson-${index + 1}`,
        courseId: 'early-phonics',
        courseLabel: 'Early Phonics',
        displayTitle: `Lesson ${index + 1}`,
        lessonNumber: index + 1,
        stageLabel: 'Stage 1',
        stageOrder: 1,
      })),
    };
    const docs = Array.from({ length: 8 }, (_, index) => fakeDoc(`lesson-${index + 1}`, {
      topicId: `lesson-${index + 1}`,
      courseId: 'early-phonics',
      lessonStatus: 'in_progress',
      mastery: 'developing',
      strengthSubskills: [`Skill ${index + 1}`],
      needsPracticeSubskills: [`Practice ${index + 1}`],
      updatedAt: new Date(2026, 7, index + 1),
    }));

    const summary = buildSummaryFromDocs('kid-3', 'early-phonics', docs as any, manyTopics);
    expect(summary.completedTopics).toBe(8);
    expect(summary.recentUpdates).toHaveLength(6);
    expect(summary.latestTopicId).toBe('lesson-8');
    expect(summary.strengthHighlights.length).toBeLessThanOrEqual(4);
    expect(summary.practiceHighlights.length).toBeLessThanOrEqual(4);
  });

  it('uses canonical curriculum membership and does not let stray saved progress inflate totals', () => {
    const topicIds = courseTopicIds(curriculum, 'phonics-foundations');
    const docs = [
      fakeDoc('lesson-1', { topicId: 'lesson-1', courseId: 'phonics-foundations' }),
      fakeDoc('stray', { topicId: 'stray', courseId: 'phonics-foundations' }),
      fakeDoc('other', { topicId: 'other', courseId: 'early-phonics' }),
    ];

    const relevant = docsForCourse(docs as any, 'phonics-foundations', topicIds);
    expect(relevant.map((doc: any) => doc.id)).toEqual(['lesson-1']);
  });

  it('forces a rebuild when an existing projection uses the old completion contract', () => {
    const topicIds = courseTopicIds(curriculum, 'phonics-foundations');
    const topics = Array.from(topicIds).map((id, index) => ({
      id,
      courseId: 'phonics-foundations',
      courseLabel: 'Foundation Phonics',
      label: id,
      lessonNumber: index + 1,
      stageLabel: index < 2 ? 'Stage 1 — Letters' : 'Stage 2 — More letters',
      stageOrder: index < 2 ? 1 : 2,
    }));

    expect(projectionMatchesCurriculum({
      schemaVersion: 2,
      modelType: 'child_course_progress_v2' as any,
      completionAuthority: 'teacher_lesson_status' as any,
      courseId: 'phonics-foundations',
    } as any, 'phonics-foundations', topics as any)).toBe(false);

    const summary = buildSummaryFromDocs('kid-4', 'phonics-foundations', [] as any, curriculum);
    expect(projectionMatchesCurriculum(summary, 'phonics-foundations', topics as any)).toBe(true);

    expect(projectionMatchesCurriculum(
      { ...summary, totalTopics: 99 },
      'phonics-foundations',
      topics as any,
    )).toBe(false);
  });
});
