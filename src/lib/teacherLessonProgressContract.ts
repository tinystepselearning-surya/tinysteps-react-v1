import {
  canonicalLessonStatus,
  normalizeLessonStatus,
  type LessonStatus,
  type TeacherLessonProgressLike,
} from './parentDashboardDataContract';

export const TEACHER_LEARNING_CONTRACT_VERSION = 2 as const;

export type TeacherEditableLessonStatus = Exclude<LessonStatus, 'not_started'>;
export type TeacherLessonStatusTransition =
  | 'unchanged'
  | 'adopted'
  | 'started'
  | 'completed'
  | 'reopened';

export interface TeacherLessonStatusPlan {
  previousStatus: LessonStatus;
  nextStatus: TeacherEditableLessonStatus;
  transition: TeacherLessonStatusTransition;
  hadExplicitStatus: boolean;
  statusChanged: boolean;
  setCompletedMetadata: boolean;
  clearCompletedMetadata: boolean;
}

/**
 * The teacher editor is only used after a lesson has been taught or reviewed.
 * A brand-new lesson therefore defaults to `in_progress` once the teacher
 * chooses to save it. Existing explicit status always wins.
 */
export function resolveTeacherEditableLessonStatus(
  existing: TeacherLessonProgressLike | null | undefined,
): TeacherEditableLessonStatus {
  const explicit = normalizeLessonStatus(existing?.lessonStatus);
  if (explicit === 'completed') return 'completed';
  return 'in_progress';
}

export function planTeacherLessonStatusWrite(
  existing: TeacherLessonProgressLike | null | undefined,
  nextStatus: TeacherEditableLessonStatus,
): TeacherLessonStatusPlan {
  const explicitStatus = normalizeLessonStatus(existing?.lessonStatus);
  const previousStatus = canonicalLessonStatus(existing);
  const normalizedNext = normalizeLessonStatus(nextStatus);
  if (normalizedNext !== 'in_progress' && normalizedNext !== 'completed') {
    throw new Error('Teacher lesson status must be in_progress or completed.');
  }

  const hadExplicitStatus = explicitStatus !== null;
  let transition: TeacherLessonStatusTransition = 'unchanged';
  if (previousStatus === 'not_started' && normalizedNext === 'in_progress') {
    transition = 'started';
  } else if (previousStatus !== 'completed' && normalizedNext === 'completed') {
    transition = 'completed';
  } else if (previousStatus === 'completed' && normalizedNext === 'in_progress') {
    transition = 'reopened';
  } else if (!hadExplicitStatus && normalizedNext === previousStatus) {
    transition = 'adopted';
  }

  const statusChanged = !hadExplicitStatus || previousStatus !== normalizedNext;

  return {
    previousStatus,
    nextStatus: normalizedNext,
    transition,
    hadExplicitStatus,
    statusChanged,
    setCompletedMetadata: transition === 'completed',
    clearCompletedMetadata: transition === 'reopened',
  };
}

/**
 * Returns only status-related scalar fields safe for the Firestore/current-state
 * document. Timestamp sentinels are intentionally added by the writer.
 *
 * Audit ownership is omitted when status is unchanged so an ordinary rating or
 * note edit cannot erase the teacher who last changed lesson status.
 */
export function buildTeacherLessonStatusScalars(
  plan: TeacherLessonStatusPlan,
  actorUid: string | null | undefined,
): Record<string, string | number | null> {
  const uid = String(actorUid ?? '').trim() || null;
  const base: Record<string, string | number | null> = {
    learningContractVersion: TEACHER_LEARNING_CONTRACT_VERSION,
    lessonStatus: plan.nextStatus,
    lessonStatusSource: 'teacher',
  };
  if (plan.statusChanged) base.lessonStatusUpdatedBy = uid;
  return base;
}
