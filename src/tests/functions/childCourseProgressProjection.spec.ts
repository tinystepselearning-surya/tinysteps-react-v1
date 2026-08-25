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

describe('child course progress projection v2', () => {
  it('normalizes supported legacy course aliases', () => {
    expect(normalizeCourseId('phonics-foundation')).toBe('phonics-foundations');
    expect(normalizeCourseId('Grammar-Essentials')).toBe('basic-grammar');
  });

  it('uses explicit lessonStatus as the only completion authority', () => {
    expect(progressState(null)).toBe('not_started');
    expect(progressState({ mastery: 'developing' })).toBe('in_progress');
    expect(progressState({ progressRatings: { blending: 2 } })).toBe('in_progress');
    expect(progressState({ mastery: 'mastered' })).toBe('in_progress');
    expect(progressState({ status: 'completed' })).toBe('not_started');
    expect(progressState({ lessonStatus: 'in_progress', mastery: 'mastered' })).toBe('in_progress');
    expect(progressState({ lessonStatus: 'completed', mastery: 'developing' })).toBe('completed');
  });

  it('builds course and stage totals from the same canonical lesson states', () => {
    const docs = [
      fakeDoc('lesson-1', {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'completed',
        mastery: 'developing',
        updatedAt: new Date('2026-08-25T09:00:00.000Z'),
      }),
      fakeDoc('lesson-2', {
        topicId: 'lesson-2',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
        mastery: 'mastered',
        updatedAt: new Date('2026-08-25T10:00:00.000Z'),
      }),
      fakeDoc('lesson-3', {
        topicId: 'lesson-3',
        courseId: 'phonics-foundations',
        mastery: 'mastered',
        teacherRemark: 'Legacy evidence without explicit lesson status.',
        updatedAt: new Date('2026-08-25T11:00:00.000Z'),
      }),
    ];

    const summary = buildSummaryFromDocs(
      'kid-1',
      'phonics-foundations',
      docs as any,
      curriculum,
    );

    expect(summary.schemaVersion).toBe(2);
    expect(summary.modelType).toBe('child_course_progress_v2');
    expect(summary.completionAuthority).toBe('teacher_lesson_status');
    expect(summary.definitionStatus).toBe('configured');
    expect(summary.totalTopics).toBe(4);
    expect(summary.completedTopics).toBe(1);
    expect(summary.inProgressTopics).toBe(2);
    expect(summary.notStartedTopics).toBe(1);
    expect(summary.overallPct).toBe(25);
    expect(summary.totalStages).toBe(2);
    expect(summary.completedStages).toBe(0);

    const [stage1, stage2] = summary.stageSummaries;
    expect(stage1).toMatchObject({
      order: 1,
      totalTopics: 2,
      completedTopics: 1,
      inProgressTopics: 1,
      notStartedTopics: 0,
      completionPct: 50,
    });
    expect(stage2).toMatchObject({
      order: 2,
      totalTopics: 2,
      completedTopics: 0,
      inProgressTopics: 1,
      notStartedTopics: 1,
      completionPct: 0,
    });

    const stageCompleted = summary.stageSummaries.reduce((sum, stage) => sum + stage.completedTopics, 0);
    const stageInProgress = summary.stageSummaries.reduce((sum, stage) => sum + stage.inProgressTopics, 0);
    const stageNotStarted = summary.stageSummaries.reduce((sum, stage) => sum + stage.notStartedTopics, 0);
    expect(stageCompleted).toBe(summary.completedTopics);
    expect(stageInProgress).toBe(summary.inProgressTopics);
    expect(stageNotStarted).toBe(summary.notStartedTopics);
    expect(summary.completedTopics + summary.inProgressTopics + summary.notStartedTopics).toBe(summary.totalTopics);
  });

  it('moves a lesson between canonical states without letting mastery change completion', () => {
    const first = buildSummaryFromDocs(
      'kid-2',
      'phonics-foundations',
      [
        fakeDoc('lesson-1', {
          topicId: 'lesson-1',
          courseId: 'phonics-foundations',
          lessonStatus: 'in_progress',
          mastery: 'developing',
          updatedAt: new Date('2026-08-25T09:00:00.000Z'),
        }),
      ] as any,
      curriculum,
    );

    const masteryOnly = applyIncrementalSummary({
      existing: first,
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
        updatedAt: new Date('2026-08-25T10:00:00.000Z'),
      },
      curriculumData: curriculum,
    });

    expect(masteryOnly.completedTopics).toBe(0);
    expect(masteryOnly.inProgressTopics).toBe(1);

    const completed = applyIncrementalSummary({
      existing: masteryOnly,
      kidId: 'kid-2',
      courseId: 'phonics-foundations',
      topicId: 'lesson-1',
      beforeData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'in_progress',
        mastery: 'mastered',
      },
      afterData: {
        topicId: 'lesson-1',
        courseId: 'phonics-foundations',
        lessonStatus: 'completed',
        mastery: 'developing',
        updatedAt: new Date('2026-08-25T11:00:00.000Z'),
      },
      curriculumData: curriculum,
    });

    expect(completed.completedTopics).toBe(1);
    expect(completed.inProgressTopics).toBe(0);
    expect(completed.notStartedTopics).toBe(3);
    expect(completed.overallPct).toBe(25);
    expect(completed.stageSummaries[0].completedTopics).toBe(1);
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
    expect(summary.recentUpdates).toHaveLength(6);
    expect(summary.latestTopicId).toBe('lesson-8');
    expect(summary.strengthHighlights.length).toBeLessThanOrEqual(4);
    expect(summary.practiceHighlights.length).toBeLessThanOrEqual(4);
  });

  it('uses canonical curriculum membership and does not let stray progress inflate totals', () => {
    const topicIds = courseTopicIds(curriculum, 'phonics-foundations');
    const docs = [
      fakeDoc('lesson-1', { topicId: 'lesson-1', courseId: 'phonics-foundations', lessonStatus: 'completed' }),
      fakeDoc('stray', { topicId: 'stray', courseId: 'phonics-foundations', lessonStatus: 'completed' }),
      fakeDoc('other', { topicId: 'other', courseId: 'early-phonics', lessonStatus: 'completed' }),
    ];

    const relevant = docsForCourse(docs as any, 'phonics-foundations', topicIds);
    expect(relevant.map((doc: any) => doc.id)).toEqual(['lesson-1']);
  });

  it('forces a bootstrap when an existing projection is v1 or curriculum shape changed', () => {
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
      schemaVersion: 1,
      modelType: 'child_course_progress_v1' as any,
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
