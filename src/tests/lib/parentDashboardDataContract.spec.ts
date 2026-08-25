import { describe, expect, it } from 'vitest';

import {
  canonicalLessonStatus,
  curriculumSummaryInvariantErrors,
  isLessonCompleted,
  normalizeClassSessionStatus,
  normalizeLessonStatus,
  normalizeSkillMastery,
  selectCanonicalChildRow,
  summarizeCurriculumCompletion,
  summarizeParentClassMonth,
} from '../../lib/parentDashboardDataContract';

describe('parent dashboard data contract — Brick P1', () => {
  it('normalizes only supported canonical lesson states', () => {
    expect(normalizeLessonStatus('completed')).toBe('completed');
    expect(normalizeLessonStatus('inprogress')).toBe('in_progress');
    expect(normalizeLessonStatus('not started')).toBeNull();
    expect(normalizeLessonStatus('mastered')).toBeNull();
  });

  it('keeps skill mastery independent from lesson completion', () => {
    expect(normalizeSkillMastery('Proficient')).toBe('proficient');
    expect(normalizeSkillMastery('Mastered')).toBe('mastered');

    expect(canonicalLessonStatus({ mastery: 'mastered' })).toBe('in_progress');
    expect(canonicalLessonStatus({ mastery: 'proficient' })).toBe('in_progress');
    expect(isLessonCompleted({ mastery: 'mastered' })).toBe(false);

    expect(canonicalLessonStatus({ lessonStatus: 'completed', mastery: 'developing' })).toBe('completed');
    expect(isLessonCompleted({ lessonStatus: 'completed', mastery: 'developing' })).toBe(true);
  });

  it('treats teacher evidence without lessonStatus as in progress for legacy safety', () => {
    expect(canonicalLessonStatus({ progressRatings: { blending: 3 } })).toBe('in_progress');
    expect(canonicalLessonStatus({ teacherRemark: 'Practise segmenting.' })).toBe('in_progress');
    expect(canonicalLessonStatus({ strengthSubskills: ['Blending'] })).toBe('in_progress');
    expect(canonicalLessonStatus({})).toBe('not_started');
  });

  it('summarizes curriculum completion from explicit lesson status only', () => {
    const summary = summarizeCurriculumCompletion(40, [
      { topicId: 'lesson-1', lessonStatus: 'completed', mastery: 'developing' },
      { topicId: 'lesson-2', lessonStatus: 'completed', mastery: 'proficient' },
      { topicId: 'lesson-3', lessonStatus: 'in_progress', mastery: 'mastered' },
      { topicId: 'lesson-4', mastery: 'mastered' },
      { topicId: 'lesson-5', progressRatings: { decoding: 2 } },
    ]);

    expect(summary).toEqual({
      totalLessons: 40,
      completedLessons: 2,
      inProgressLessons: 3,
      notStartedLessons: 35,
      completionPct: 5,
    });
    expect(curriculumSummaryInvariantErrors(summary)).toEqual([]);
  });

  it('deduplicates repeated lesson identifiers so one lesson cannot inflate completion', () => {
    const summary = summarizeCurriculumCompletion(3, [
      { topicId: 'lesson-1', lessonStatus: 'in_progress' },
      { topicId: 'lesson-1', lessonStatus: 'completed' },
      { topicId: 'lesson-2', lessonStatus: 'completed' },
    ]);

    expect(summary.completedLessons).toBe(2);
    expect(summary.inProgressLessons).toBe(0);
    expect(summary.notStartedLessons).toBe(1);
  });

  it('detects contradictory curriculum summaries before they reach parent UI', () => {
    expect(
      curriculumSummaryInvariantErrors({
        totalLessons: 40,
        completedLessons: 15,
        inProgressLessons: 7,
        notStartedLessons: 18,
        completionPct: 38,
      }),
    ).toEqual([]);

    expect(
      curriculumSummaryInvariantErrors({
        totalLessons: 40,
        completedLessons: 15,
        inProgressLessons: 7,
        notStartedLessons: 40,
        completionPct: 0,
      }),
    ).toEqual([
      'curriculum states must sum to totalLessons',
      'completionPct must be derived only from completedLessons / totalLessons',
    ]);
  });

  it('fails loudly when progress contains more active lessons than the canonical curriculum', () => {
    const summary = summarizeCurriculumCompletion(2, [
      { topicId: 'lesson-1', lessonStatus: 'completed' },
      { topicId: 'lesson-2', lessonStatus: 'completed' },
      { topicId: 'lesson-3', lessonStatus: 'in_progress' },
    ]);

    expect(summary.totalLessons).toBe(2);
    expect(curriculumSummaryInvariantErrors(summary)).toContain(
      'curriculum states must sum to totalLessons',
    );
  });

  it('keeps class-session counts separate from curriculum lessons', () => {
    const nowMs = Date.parse('2026-08-25T12:00:00.000Z');
    const summary = summarizeParentClassMonth(
      [
        { id: 'c1', status: 'completed', startAtMs: Date.parse('2026-08-20T12:00:00.000Z') },
        { id: 'c2', status: 'completed', startAtMs: Date.parse('2026-08-21T12:00:00.000Z') },
        { id: 'c3', status: 'scheduled', startAtMs: Date.parse('2026-08-26T12:00:00.000Z') },
        { id: 'c4', status: 'cancelled', startAtMs: Date.parse('2026-08-24T12:00:00.000Z') },
        { id: 'c5', status: 'scheduled', startAtMs: Date.parse('2026-08-23T12:00:00.000Z') },
        { id: 'c6', status: 'rescheduled', startAtMs: Date.parse('2026-08-22T12:00:00.000Z') },
      ],
      nowMs,
    );

    expect(summary).toEqual({
      totalSessions: 6,
      completedSessions: 2,
      upcomingSessions: 1,
      cancelledSessions: 1,
      noShowSessions: 0,
      rescheduleRequestedSessions: 0,
      rescheduledSessions: 1,
      inProgressSessions: 0,
      unresolvedPastSessions: 1,
      otherSessions: 0,
    });
  });

  it('normalizes class status without reusing lesson semantics', () => {
    expect(normalizeClassSessionStatus('completed')).toBe('completed');
    expect(normalizeClassSessionStatus('canceled')).toBe('cancelled');
    expect(normalizeClassSessionStatus('inprogress')).toBe('in_progress');
    expect(normalizeClassSessionStatus('rescheduled')).toBe('rescheduled');
    expect(normalizeClassSessionStatus('unknown-status')).toBe('other');
  });

  it('never falls back from a selected child row to family totals', () => {
    const byKid = {
      'kid-a': { total: 18, completed: 15 },
      'kid-b': { total: 12, completed: 10 },
    };

    expect(selectCanonicalChildRow(byKid, 'kid-a')).toEqual({ total: 18, completed: 15 });
    expect(selectCanonicalChildRow(byKid, 'missing-kid')).toBeNull();
    expect(selectCanonicalChildRow(byKid, '')).toBeNull();
  });
});
