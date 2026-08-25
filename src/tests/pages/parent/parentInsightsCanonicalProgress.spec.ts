import { describe, expect, it } from 'vitest';

import type { ChildCourseProgressProjection } from '../../../hooks/useChildCourseProgressProjection';
import { selectCanonicalParentInsightsProgress } from '../../../pages/parent/components/insights/parentInsightsCanonicalProgress';
import type { ParentInsightStageDisplay } from '../../../pages/parent/components/insights/parentInsightsPresentation';

const presentationStages: ParentInsightStageDisplay[] = [
  {
    key: 'presentation-stage-1',
    order: 1,
    label: 'Core letter sets',
    state: 'completed',
    progressPct: 100,
    completedCount: 99,
    totalCount: 99,
    masteryLabel: 'Mastered',
    hint: 'Presentation hint 1',
    focusItems: ['Sound recall'],
    expectations: ['Expectation 1'],
  },
  {
    key: 'presentation-stage-2',
    order: 2,
    label: 'Digraphs',
    state: 'current',
    progressPct: 100,
    completedCount: 99,
    totalCount: 99,
    masteryLabel: 'Proficient',
    hint: 'Presentation hint 2',
    focusItems: ['Blending'],
    expectations: ['Expectation 2'],
  },
  {
    key: 'presentation-stage-3',
    order: 3,
    label: 'Magic E',
    state: 'upcoming',
    progressPct: 100,
    completedCount: 99,
    totalCount: 99,
    masteryLabel: 'Mastered',
    hint: 'Presentation hint 3',
    focusItems: ['Word reading'],
    expectations: ['Expectation 3'],
  },
];

const canonical: ChildCourseProgressProjection = {
  schemaVersion: 3,
  modelType: 'child_course_progress_v3',
  completionAuthority: 'teacher_progress_save',
  definitionStatus: 'configured',
  courseId: 'early-phonics',
  totalTopics: 5,
  completedTopics: 2,
  inProgressTopics: 0,
  notStartedTopics: 3,
  overallPct: 40,
  totalStages: 3,
  completedStages: 1,
  stageSummaries: [
    {
      key: 'canonical-stage-1', label: 'Stage 1', order: 1, totalTopics: 1,
      completedTopics: 1, inProgressTopics: 0, notStartedTopics: 0, completionPct: 100,
    },
    {
      key: 'canonical-stage-2', label: 'Stage 2', order: 2, totalTopics: 2,
      completedTopics: 1, inProgressTopics: 0, notStartedTopics: 1, completionPct: 50,
    },
    {
      key: 'canonical-stage-3', label: 'Stage 3', order: 3, totalTopics: 2,
      completedTopics: 0, inProgressTopics: 0, notStartedTopics: 2, completionPct: 0,
    },
  ],
  lastUpdatedAtMs: 123456,
};

describe('P6 canonical Insights saved-lesson progress', () => {
  it('uses V3 saved-lesson counts even when presentation/mastery rows claim 100%', () => {
    const result = selectCanonicalParentInsightsProgress(
      canonical,
      'early-phonics',
      presentationStages,
    );

    expect(result).toMatchObject({
      completedLessons: 2,
      totalLessons: 5,
      completionPct: 40,
      completedStages: 1,
    });
    expect(result?.stages.map((stage) => stage.progressPct)).toEqual([100, 50, 0]);
    expect(result?.stages.map((stage) => stage.completedCount)).toEqual([1, 1, 0]);
  });

  it('preserves mastery/focus only as presentation metadata without changing completion', () => {
    const changedPresentation = presentationStages.map((stage) => ({
      ...stage,
      masteryLabel: 'Mastered',
      progressPct: 0,
      completedCount: 0,
      totalCount: 400,
    }));
    const result = selectCanonicalParentInsightsProgress(
      canonical,
      'early-phonics',
      changedPresentation,
    );

    expect(result?.completionPct).toBe(40);
    expect(result?.completedLessons).toBe(2);
    expect(result?.stages[1]).toMatchObject({
      masteryLabel: 'Mastered',
      focusItems: ['Blending'],
      completedCount: 1,
      totalCount: 2,
      progressPct: 50,
    });
  });

  it('rejects V2, wrong authority, course mismatch, and nonzero in-progress counts', () => {
    expect(selectCanonicalParentInsightsProgress(
      { ...canonical, schemaVersion: 2, modelType: 'child_course_progress_v2' },
      'early-phonics',
      presentationStages,
    )).toBeNull();
    expect(selectCanonicalParentInsightsProgress(
      { ...canonical, completionAuthority: 'teacher_lesson_status' },
      'early-phonics',
      presentationStages,
    )).toBeNull();
    expect(selectCanonicalParentInsightsProgress(
      canonical,
      'advanced-phonics',
      presentationStages,
    )).toBeNull();
    expect(selectCanonicalParentInsightsProgress(
      { ...canonical, inProgressTopics: 1, notStartedTopics: 2 },
      'early-phonics',
      presentationStages,
    )).toBeNull();
  });

  it('rejects stage rows that do not reconcile instead of falling back to presentation data', () => {
    const badStages = [...(canonical.stageSummaries ?? [])];
    const result = selectCanonicalParentInsightsProgress(
      {
        ...canonical,
        stageSummaries: [
          badStages[0],
          { ...badStages[1], completedTopics: 2, notStartedTopics: 1, completionPct: 67 },
          badStages[2],
        ],
      },
      'early-phonics',
      presentationStages,
    );
    expect(result).toBeNull();
  });

  it('selects the furthest partial stage as current and the following incomplete stage as next', () => {
    const result = selectCanonicalParentInsightsProgress(
      {
        ...canonical,
        totalTopics: 6,
        completedTopics: 2,
        notStartedTopics: 4,
        overallPct: 33,
        stageSummaries: [
          {
            key: 's1', label: 'S1', order: 1, totalTopics: 2,
            completedTopics: 0, inProgressTopics: 0, notStartedTopics: 2, completionPct: 0,
          },
          {
            key: 's2', label: 'S2', order: 2, totalTopics: 2,
            completedTopics: 1, inProgressTopics: 0, notStartedTopics: 1, completionPct: 50,
          },
          {
            key: 's3', label: 'S3', order: 3, totalTopics: 2,
            completedTopics: 1, inProgressTopics: 0, notStartedTopics: 1, completionPct: 50,
          },
        ],
      },
      'early-phonics',
      presentationStages,
    );

    expect(result?.activeStage?.order).toBe(3);
    expect(result?.nextStage).toBeNull();
    expect(result?.stages.map((stage) => stage.state)).toEqual(['upcoming', 'upcoming', 'current']);
  });
});
