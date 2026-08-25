import { describe, expect, it } from 'vitest';

import {
  applyIncrementalSummary,
  buildSummaryFromDocs,
  courseTopicIds,
  docsForCourse,
  normalizeCourseId,
  progressState,
} from '../../../functions/src/childCourseProgressProjection';

describe('child course progress projection', () => {
  it('normalizes supported legacy course aliases', () => {
    expect(normalizeCourseId('phonics-foundation')).toBe('phonics-foundations');
    expect(normalizeCourseId('Grammar-Essentials')).toBe('basic-grammar');
  });

  it('classifies current topic state without scanning sibling topics', () => {
    expect(progressState(null)).toBe('not_started');
    expect(progressState({ mastery: 'developing' })).toBe('in_progress');
    expect(progressState({ progressRatings: { blending: 2 } })).toBe('in_progress');
    expect(progressState({ mastery: 'mastered' })).toBe('completed');
  });

  it('moves one topic from in-progress to completed using only before/after deltas', () => {
    const first = applyIncrementalSummary({
      existing: null,
      kidId: 'kid-1',
      courseId: 'phonics-foundations',
      topicId: 'lesson-1',
      beforeData: null,
      afterData: {
        courseId: 'phonics-foundations',
        courseLabel: 'Foundation Phonics',
        courseTotalTopics: 30,
        topicName: 'Lesson 1 — S',
        lessonNumber: 1,
        mastery: 'developing',
        strengthSubskills: ['Sound recognition'],
        teacherRemark: 'Good effort.',
        updatedAt: new Date('2026-08-25T09:00:00.000Z'),
      },
    });

    expect(first.totalTopics).toBe(30);
    expect(first.completedTopics).toBe(0);
    expect(first.inProgressTopics).toBe(1);
    expect(first.overallPct).toBe(0);

    const second = applyIncrementalSummary({
      existing: first,
      kidId: 'kid-1',
      courseId: 'phonics-foundations',
      topicId: 'lesson-1',
      beforeData: {
        courseId: 'phonics-foundations',
        courseTotalTopics: 30,
        mastery: 'developing',
      },
      afterData: {
        courseId: 'phonics-foundations',
        courseLabel: 'Foundation Phonics',
        courseTotalTopics: 30,
        topicName: 'Lesson 1 — S',
        lessonNumber: 1,
        mastery: 'mastered',
        strengthSubskills: ['Sound recognition'],
        teacherRemark: 'Secure now.',
        updatedAt: new Date('2026-08-25T10:00:00.000Z'),
      },
    });

    expect(second.completedTopics).toBe(1);
    expect(second.inProgressTopics).toBe(0);
    expect(second.overallPct).toBe(3);
    expect(second.latestTopicId).toBe('lesson-1');
    expect(second.latestTeacherRemark).toBe('Secure now.');
  });

  it('keeps only a bounded recent insight window for parent-facing summaries', () => {
    let summary: any = null;
    for (let i = 1; i <= 8; i += 1) {
      summary = applyIncrementalSummary({
        existing: summary,
        kidId: 'kid-2',
        courseId: 'early-phonics',
        topicId: `lesson-${i}`,
        beforeData: null,
        afterData: {
          courseId: 'early-phonics',
          courseTotalTopics: 41,
          topicName: `Lesson ${i}`,
          lessonNumber: i,
          mastery: 'developing',
          strengthSubskills: [`Skill ${i}`],
          needsPracticeSubskills: [`Practice ${i}`],
          updatedAt: new Date(2026, 7, i),
        },
      });
    }

    expect(summary.recentUpdates).toHaveLength(6);
    expect(summary.latestTopicId).toBe('lesson-8');
    expect(summary.strengthHighlights.length).toBeLessThanOrEqual(4);
    expect(summary.practiceHighlights.length).toBeLessThanOrEqual(4);
  });

  it('bootstraps legacy documents through canonical aliases and curriculum topic mapping', () => {
    const topicIds = courseTopicIds({
      topics: [
        { id: 'legacy-missing-course', courseId: 'phonics-foundation' },
        { id: 'other-course-topic', courseId: 'early-phonics' },
      ],
    }, 'phonics-foundations');
    const fakeDocs = [
      {
        id: 'legacy-alias',
        data: () => ({ courseId: 'phonics-foundation', mastery: 'mastered' }),
      },
      {
        id: 'legacy-missing-course',
        data: () => ({ mastery: 'developing' }),
      },
      {
        id: 'other-course-topic',
        data: () => ({ courseId: 'early-phonics', mastery: 'mastered' }),
      },
    ] as any;

    const relevantDocs = docsForCourse(fakeDocs, 'phonics-foundations', topicIds);
    const summary = buildSummaryFromDocs(
      'kid-legacy',
      'phonics-foundations',
      relevantDocs,
      topicIds.size,
    );

    expect(relevantDocs).toHaveLength(2);
    expect(summary.totalTopics).toBe(2);
    expect(summary.completedTopics).toBe(1);
    expect(summary.inProgressTopics).toBe(1);
  });
});
