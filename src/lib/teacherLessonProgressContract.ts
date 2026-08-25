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

export interface TeacherLegacyCompletionBaselineTopic {
  topicId: string;
  lessonNumber: number;
  existing?: TeacherLessonProgressLike | null;
}

export interface TeacherLegacyCompletionBaselinePlan {
  cutoffLessonNumber: number;
  candidateTopicIds: string[];
  alreadyCompletedTopicIds: string[];
  conflictTopicIds: string[];
  canApply: boolean;
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
 * Plans a one-time teacher-confirmed historical completion baseline for students
 * whose progress predates explicit `lessonStatus` writes.
 *
 * This deliberately does NOT inspect mastery, ratings, attendance, or class count.
 * A teacher must explicitly choose the last fully completed lesson. Rows that
 * already carry any explicit non-completed status are treated as conflicts so a
 * migration can never overwrite newer P2 teacher intent.
 */
export function planTeacherLegacyCompletionBaseline(
  topics: readonly TeacherLegacyCompletionBaselineTopic[],
  cutoffLessonNumber: number,
): TeacherLegacyCompletionBaselinePlan {
  const cutoff = Math.trunc(Number(cutoffLessonNumber));
  if (!Number.isFinite(cutoff) || cutoff <= 0) {
    throw new Error('Historical completion cutoff must be a positive lesson number.');
  }

  const candidateTopicIds: string[] = [];
  const alreadyCompletedTopicIds: string[] = [];
  const conflictTopicIds: string[] = [];

  [...topics]
    .filter((topic) => Number.isFinite(topic.lessonNumber) && topic.lessonNumber > 0 && topic.lessonNumber <= cutoff)
    .sort((a, b) => a.lessonNumber - b.lessonNumber || a.topicId.localeCompare(b.topicId))
    .forEach((topic) => {
      const explicit = normalizeLessonStatus(topic.existing?.lessonStatus);
      if (explicit === 'completed') {
        alreadyCompletedTopicIds.push(topic.topicId);
        return;
      }
      if (explicit) {
        conflictTopicIds.push(topic.topicId);
        return;
      }
      candidateTopicIds.push(topic.topicId);
    });

  return {
    cutoffLessonNumber: cutoff,
    candidateTopicIds,
    alreadyCompletedTopicIds,
    conflictTopicIds,
    canApply: conflictTopicIds.length === 0 && candidateTopicIds.length > 0,
  };
}

/**
 * Scalar status fields for an explicit teacher-confirmed historical baseline.
 * Timestamp sentinels are added by the Firestore writer.
 */
export function buildTeacherLegacyCompletionBaselineScalars(
  actorUid: string | null | undefined,
): Record<string, string | number | null | boolean> {
  const uid = String(actorUid ?? '').trim() || null;
  return {
    learningContractVersion: TEACHER_LEARNING_CONTRACT_VERSION,
    lessonStatus: 'completed',
    lessonStatusSource: 'teacher_legacy_baseline',
    lessonStatusUpdatedBy: uid,
    legacyCompletionBaseline: true,
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
