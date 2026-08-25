import { describe, expect, it } from 'vitest';

import {
  applyIncrementalSummary,
  buildSummaryFromDocs,
  courseTopicIds,
  docsForCourse,
} from '../../../functions/src/childCourseProgressProjection';
import type { ChildCourseProgressProjection } from '../../hooks/useChildCourseProgressProjection';
import { selectCanonicalParentOverviewCourse } from '../../pages/parent/parentOverviewProjection';
import { selectCanonicalParentInsightsProgress } from '../../pages/parent/components/insights/parentInsightsCanonicalProgress';

const lessonNumbers = [21, 24, 26, 27, 28, 34, 35, 36];
const curriculum = {
  topics: lessonNumbers.map((lessonNumber, index) => ({
    id: `early-${lessonNumber}`,
    courseId: 'early-phonics',
    courseLabel: 'Early Phonics',
    displayTitle: `Lesson ${lessonNumber}`,
    lessonNumber,
    stageLabel: index < 4 ? 'Stage 1 — Long vowels' : 'Stage 2 — Advanced patterns',
    stageOrder: index < 4 ? 1 : 2,
  })),
};

const fakeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
}) as any;

describe('existing-parent course progress recovery incident', () => {
  it('materializes representative Early Phonics saved lessons with a canonical denominator', () => {
    const historicalDocs = [21, 24, 26, 27, 28, 34].map((lessonNumber, index) =>
      fakeDoc(`save-${lessonNumber}-${index}`, {
        topicId: `early-${lessonNumber}`,
        courseId: 'early-phonics',
        lessonStatus: index % 2 === 0 ? 'completed' : 'in_progress',
        mastery: index % 2 === 0 ? 'mastered' : 'developing',
        updatedAt: new Date(`2026-08-${String(index + 1).padStart(2, '0')}T10:00:00Z`),
      }));
    historicalDocs.push(fakeDoc('duplicate-rating-save', {
      topicId: 'early-21',
      courseId: 'early-phonics',
      lessonStatus: 'in_progress',
      mastery: 'mastered',
      progressRatings: { blending: 5 },
      updatedAt: new Date('2026-08-20T10:00:00Z'),
    }));
    historicalDocs.push(fakeDoc('stray-history', {
      topicId: 'early-999',
      courseId: 'early-phonics',
      lessonStatus: 'completed',
    }));

    const relevant = docsForCourse(
      historicalDocs,
      'early-phonics',
      courseTopicIds(curriculum, 'early-phonics'),
    );
    const summary = buildSummaryFromDocs('kid-existing', 'early-phonics', relevant, curriculum);

    expect(summary.totalTopics).toBe(lessonNumbers.length);
    expect(summary.completedTopics).toBe(6);
    expect(summary.completedTopics).toBeLessThanOrEqual(summary.totalTopics);
    expect(summary.stageSummaries.reduce((sum, stage) => sum + stage.totalTopics, 0)).toBe(summary.totalTopics);
    expect(summary.stageSummaries.reduce((sum, stage) => sum + stage.completedTopics, 0)).toBe(summary.completedTopics);
  });

  it('does not add another completion when only mastery/ratings change on a saved lesson', () => {
    const first = buildSummaryFromDocs('kid-existing', 'early-phonics', [
      fakeDoc('early-21', { topicId: 'early-21', courseId: 'early-phonics', lessonStatus: 'in_progress' }),
    ], curriculum);
    const resaved = applyIncrementalSummary({
      existing: first,
      kidId: 'kid-existing',
      courseId: 'early-phonics',
      topicId: 'early-21',
      beforeData: { topicId: 'early-21', courseId: 'early-phonics', lessonStatus: 'in_progress', mastery: 2 },
      afterData: {
        topicId: 'early-21',
        courseId: 'early-phonics',
        lessonStatus: 'in_progress',
        mastery: 5,
        progressRatings: { blending: 5 },
      },
      curriculumData: curriculum,
    });

    expect(first.completedTopics).toBe(1);
    expect(resaved.completedTopics).toBe(1);
  });

  it('feeds identical lesson totals to P5 and P6 and preserves unavailable selected-child state', () => {
    const projection = buildSummaryFromDocs('kid-existing', 'early-phonics', [
      fakeDoc('early-21', { topicId: 'early-21', courseId: 'early-phonics' }),
      fakeDoc('early-24', { topicId: 'early-24', courseId: 'early-phonics' }),
    ], curriculum) as ChildCourseProgressProjection;
    const overview = selectCanonicalParentOverviewCourse(projection, 'early-phonics');
    const insights = selectCanonicalParentInsightsProgress(projection, 'early-phonics');

    expect(overview).toMatchObject({ completedTopics: 2, totalTopics: 8 });
    expect(insights).toMatchObject({ completedLessons: 2, totalLessons: 8 });
    expect(selectCanonicalParentOverviewCourse(null, 'early-phonics')).toBeNull();
    expect(selectCanonicalParentInsightsProgress(null, 'early-phonics')).toBeNull();
  });

  it('keeps a missing curriculum definition unavailable instead of inventing totals', () => {
    const summary = buildSummaryFromDocs('kid-existing', 'early-phonics', [
      fakeDoc('early-21', { topicId: 'early-21', courseId: 'early-phonics', mastery: 5 }),
    ], undefined);

    expect(summary).toMatchObject({
      definitionStatus: 'missing',
      totalTopics: 0,
      completedTopics: 0,
    });
    expect(selectCanonicalParentOverviewCourse(summary, 'early-phonics')).toBeNull();
    expect(selectCanonicalParentInsightsProgress(summary, 'early-phonics')).toBeNull();
  });
});
