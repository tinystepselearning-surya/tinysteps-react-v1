import { describe, expect, it } from 'vitest';

import {
  buildTeacherLessonStatusScalars,
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
});
