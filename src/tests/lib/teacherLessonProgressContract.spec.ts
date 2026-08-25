import { describe, expect, it } from 'vitest';

import {
  buildTeacherLegacyCompletionBaselineScalars,
  buildTeacherLessonStatusScalars,
  planTeacherLegacyCompletionBaseline,
  planTeacherLessonStatusWrite,
  resolveTeacherEditableLessonStatus,
} from '../../lib/teacherLessonProgressContract';

describe('teacher lesson progress contract — Brick P2', () => {
  it('defaults a new teacher-reviewed lesson to in progress', () => {
    expect(resolveTeacherEditableLessonStatus(null)).toBe('in_progress');
    expect(resolveTeacherEditableLessonStatus({})).toBe('in_progress');
  });

  it('preserves an explicit completed lesson when reopening the editor', () => {
    expect(resolveTeacherEditableLessonStatus({ lessonStatus: 'completed' })).toBe('completed');
  });

  it('does not infer teacher completion from mastery and explicitly adopts legacy rows', () => {
    expect(resolveTeacherEditableLessonStatus({ mastery: 'mastered' })).toBe('in_progress');
    const plan = planTeacherLessonStatusWrite({ mastery: 'mastered' }, 'in_progress');
    expect(plan).toMatchObject({
      previousStatus: 'in_progress',
      nextStatus: 'in_progress',
      transition: 'adopted',
      hadExplicitStatus: false,
      statusChanged: true,
      setCompletedMetadata: false,
      clearCompletedMetadata: false,
    });
  });

  it('plans the first teacher save as a started lesson', () => {
    const plan = planTeacherLessonStatusWrite(null, 'in_progress');
    expect(plan).toEqual({
      previousStatus: 'not_started',
      nextStatus: 'in_progress',
      transition: 'started',
      hadExplicitStatus: false,
      statusChanged: true,
      setCompletedMetadata: false,
      clearCompletedMetadata: false,
    });
  });

  it('sets completion metadata only on a transition into completed', () => {
    const plan = planTeacherLessonStatusWrite(
      { lessonStatus: 'in_progress', mastery: 'developing' },
      'completed',
    );
    expect(plan.transition).toBe('completed');
    expect(plan.hadExplicitStatus).toBe(true);
    expect(plan.setCompletedMetadata).toBe(true);
    expect(plan.clearCompletedMetadata).toBe(false);
  });

  it('does not reset completedAt on ordinary edits to an already completed lesson', () => {
    const plan = planTeacherLessonStatusWrite(
      { lessonStatus: 'completed', mastery: 'proficient' },
      'completed',
    );
    expect(plan.transition).toBe('unchanged');
    expect(plan.statusChanged).toBe(false);
    expect(plan.setCompletedMetadata).toBe(false);
    expect(plan.clearCompletedMetadata).toBe(false);
  });

  it('clears current completion metadata when the teacher reopens a lesson', () => {
    const plan = planTeacherLessonStatusWrite(
      { lessonStatus: 'completed', mastery: 'mastered' },
      'in_progress',
    );
    expect(plan.transition).toBe('reopened');
    expect(plan.clearCompletedMetadata).toBe(true);
  });

  it('emits status audit ownership only when status is established or changed', () => {
    const completedPlan = planTeacherLessonStatusWrite(null, 'completed');
    expect(buildTeacherLessonStatusScalars(completedPlan, 'teacher-1')).toEqual({
      learningContractVersion: 2,
      lessonStatus: 'completed',
      lessonStatusSource: 'teacher',
      lessonStatusUpdatedBy: 'teacher-1',
    });

    const unchangedPlan = planTeacherLessonStatusWrite(
      { lessonStatus: 'completed' },
      'completed',
    );
    expect(buildTeacherLessonStatusScalars(unchangedPlan, 'teacher-2')).toEqual({
      learningContractVersion: 2,
      lessonStatus: 'completed',
      lessonStatusSource: 'teacher',
    });
  });

  it('plans a teacher-confirmed historical baseline without consulting mastery or ratings', () => {
    const plan = planTeacherLegacyCompletionBaseline(
      [
        { topicId: 'lesson-1', lessonNumber: 1, existing: null },
        { topicId: 'lesson-2', lessonNumber: 2, existing: { mastery: 'mastered' } },
        { topicId: 'lesson-3', lessonNumber: 3, existing: { progressRatings: { reading: 4 } } },
        { topicId: 'lesson-4', lessonNumber: 4, existing: { lessonStatus: 'completed' } },
        { topicId: 'lesson-5', lessonNumber: 5, existing: null },
      ],
      4,
    );

    expect(plan).toEqual({
      cutoffLessonNumber: 4,
      candidateTopicIds: ['lesson-1', 'lesson-2', 'lesson-3'],
      alreadyCompletedTopicIds: ['lesson-4'],
      conflictTopicIds: [],
      canApply: true,
    });
  });

  it('blocks a historical baseline from overwriting any newer explicit teacher state', () => {
    const plan = planTeacherLegacyCompletionBaseline(
      [
        { topicId: 'lesson-1', lessonNumber: 1, existing: { lessonStatus: 'completed' } },
        { topicId: 'lesson-2', lessonNumber: 2, existing: { lessonStatus: 'in_progress' } },
        { topicId: 'lesson-3', lessonNumber: 3, existing: { lessonStatus: 'not_started' } },
        { topicId: 'lesson-4', lessonNumber: 4, existing: null },
      ],
      4,
    );

    expect(plan.alreadyCompletedTopicIds).toEqual(['lesson-1']);
    expect(plan.candidateTopicIds).toEqual(['lesson-4']);
    expect(plan.conflictTopicIds).toEqual(['lesson-2', 'lesson-3']);
    expect(plan.canApply).toBe(false);
  });

  it('emits a distinct auditable source for teacher-confirmed historical completion', () => {
    expect(buildTeacherLegacyCompletionBaselineScalars('teacher-1')).toEqual({
      learningContractVersion: 2,
      lessonStatus: 'completed',
      lessonStatusSource: 'teacher_legacy_baseline',
      lessonStatusUpdatedBy: 'teacher-1',
      legacyCompletionBaseline: true,
    });
  });

  it('rejects an invalid historical completion cutoff', () => {
    expect(() => planTeacherLegacyCompletionBaseline([], 0)).toThrow(
      'Historical completion cutoff must be a positive lesson number.',
    );
  });
});
