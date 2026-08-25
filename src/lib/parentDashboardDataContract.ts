export const PARENT_DASHBOARD_DATA_CONTRACT_VERSION = 1 as const;

/**
 * Canonical child identity used by operational parent-dashboard data.
 *
 * Contract:
 * - `kidId` is the canonical child key.
 * - legacy aliases such as `studentId`, `studentUid`, `linkedStudentId`, and
 *   `studentRefId` are migration/lookup aids only and must not become competing
 *   operational identities.
 */
export type CanonicalKidId = string;

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export type SkillMastery =
  | 'not_started'
  | 'emerging'
  | 'developing'
  | 'proficient'
  | 'mastered';

export type ClassSessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'reschedule_requested'
  | 'rescheduled'
  | 'other';

export interface TeacherLessonProgressLike {
  lessonId?: string;
  topicId?: string;
  lessonStatus?: unknown;
  mastery?: unknown;
  progressRatings?: Record<string, unknown> | null;
  teacherRemark?: unknown;
  strengthSubskills?: unknown;
  needsPracticeSubskills?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export interface CurriculumCompletionSummary {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  completionPct: number;
}

export interface ParentClassSessionLike {
  id?: string;
  status?: unknown;
  startAtMs?: number | null;
}

export interface ParentClassMonthSummary {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  rescheduleRequestedSessions: number;
  rescheduledSessions: number;
  inProgressSessions: number;
  unresolvedPastSessions: number;
  otherSessions: number;
}

export interface ParentBillingContract {
  /** Parent/family running balance. Never label this as a selected-child balance. */
  familyBalance: number | null;
  /** Selected-child monthly billing view when a canonical byKid row exists. */
  childMonth?: {
    kidId: CanonicalKidId;
    billedAmount: number;
    settledAmount: number;
    dueAmount: number;
  } | null;
}

const LESSON_STATUSES = new Set<LessonStatus>(['not_started', 'in_progress', 'completed']);
const SKILL_MASTERY_VALUES = new Set<SkillMastery>([
  'not_started',
  'emerging',
  'developing',
  'proficient',
  'mastered',
]);

function normalizeLower(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeLessonStatus(value: unknown): LessonStatus | null {
  const raw = normalizeLower(value);
  if (raw === 'notstarted') return 'not_started';
  if (raw === 'inprogress') return 'in_progress';
  if (LESSON_STATUSES.has(raw as LessonStatus)) return raw as LessonStatus;
  return null;
}

export function normalizeSkillMastery(value: unknown): SkillMastery | null {
  const raw = normalizeLower(value).replace(/\s+/g, '_');
  if (SKILL_MASTERY_VALUES.has(raw as SkillMastery)) return raw as SkillMastery;
  return null;
}

export function normalizeClassSessionStatus(value: unknown): ClassSessionStatus {
  const raw = normalizeLower(value);
  if (!raw) return 'scheduled';
  if (raw === 'inprogress') return 'in_progress';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'reschedule-requested') return 'reschedule_requested';
  if (
    raw === 'scheduled' ||
    raw === 'in_progress' ||
    raw === 'completed' ||
    raw === 'cancelled' ||
    raw === 'no_show' ||
    raw === 'reschedule_requested' ||
    raw === 'rescheduled'
  ) {
    return raw;
  }
  return 'other';
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasRatedSkill(value: TeacherLessonProgressLike['progressRatings']): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value).some((key) => {
    const rating = value[key];
    if (typeof rating === 'number') return Number.isFinite(rating) && rating > 0;
    const numeric = Number(rating);
    return Number.isFinite(numeric) && numeric > 0;
  });
}

/**
 * Learning evidence is deliberately broader than lesson completion.
 * A teacher can rate skills, add feedback, or record mastery while the lesson
 * remains in progress.
 */
export function hasTeacherLearningEvidence(progress: TeacherLessonProgressLike | null | undefined): boolean {
  if (!progress) return false;
  const mastery = normalizeSkillMastery(progress.mastery);
  return Boolean(
    (mastery && mastery !== 'not_started') ||
      hasRatedSkill(progress.progressRatings) ||
      String(progress.teacherRemark ?? '').trim() ||
      hasNonEmptyArray(progress.strengthSubskills) ||
      hasNonEmptyArray(progress.needsPracticeSubskills),
  );
}

/**
 * Canonical curriculum state.
 *
 * Critical invariant: skill mastery NEVER completes a curriculum lesson.
 * `completed` is returned only from the explicit teacher-controlled
 * `lessonStatus` field.
 *
 * Legacy records with learning evidence but no lessonStatus are treated as
 * `in_progress` until a controlled migration/review assigns an explicit status.
 */
export function canonicalLessonStatus(
  progress: TeacherLessonProgressLike | null | undefined,
): LessonStatus {
  const explicit = normalizeLessonStatus(progress?.lessonStatus);
  if (explicit) return explicit;
  return hasTeacherLearningEvidence(progress) ? 'in_progress' : 'not_started';
}

export function isLessonCompleted(
  progress: TeacherLessonProgressLike | null | undefined,
): boolean {
  return canonicalLessonStatus(progress) === 'completed';
}

/**
 * Builds one curriculum-completion summary from explicit lesson status only.
 * Duplicate lesson/topic ids are de-duplicated so one lesson cannot inflate the
 * course total twice.
 *
 * `totalLessons` remains the canonical curriculum total. If progress contains
 * more distinct active/completed lessons than the curriculum total, this helper
 * intentionally leaves the contradiction visible so invariant validation can
 * block it instead of silently changing the curriculum size.
 */
export function summarizeCurriculumCompletion(
  totalLessons: number,
  progressRows: readonly TeacherLessonProgressLike[],
): CurriculumCompletionSummary {
  const total = Math.max(0, Math.trunc(Number.isFinite(totalLessons) ? totalLessons : 0));
  const unique = new Map<string, TeacherLessonProgressLike>();
  let anonymousIndex = 0;

  progressRows.forEach((row) => {
    const key = String(row.lessonId ?? row.topicId ?? '').trim() || `__anonymous_${anonymousIndex++}`;
    unique.set(key, row);
  });

  let completedLessons = 0;
  let inProgressLessons = 0;

  for (const row of unique.values()) {
    const state = canonicalLessonStatus(row);
    if (state === 'completed') completedLessons += 1;
    else if (state === 'in_progress') inProgressLessons += 1;
  }

  const counted = completedLessons + inProgressLessons;
  const notStartedLessons = Math.max(0, total - counted);
  const completionPct = total > 0
    ? Math.round((completedLessons / total) * 100)
    : 0;

  return {
    totalLessons: total,
    completedLessons,
    inProgressLessons,
    notStartedLessons,
    completionPct,
  };
}

/**
 * Used by projections/tests to prevent the parent UI from showing internally
 * contradictory totals such as course 15/40 while every stage shows 0/X.
 */
export function curriculumSummaryInvariantErrors(
  summary: CurriculumCompletionSummary,
): string[] {
  const errors: string[] = [];
  const { totalLessons, completedLessons, inProgressLessons, notStartedLessons, completionPct } = summary;

  if ([totalLessons, completedLessons, inProgressLessons, notStartedLessons].some((value) => value < 0)) {
    errors.push('curriculum counts must be non-negative');
  }
  if (completedLessons + inProgressLessons + notStartedLessons !== totalLessons) {
    errors.push('curriculum states must sum to totalLessons');
  }
  const expectedPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  if (completionPct !== expectedPct) {
    errors.push('completionPct must be derived only from completedLessons / totalLessons');
  }
  if (completionPct < 0 || completionPct > 100) {
    errors.push('completionPct must remain between 0 and 100');
  }
  return errors;
}

export function summarizeParentClassMonth(
  sessions: readonly ParentClassSessionLike[],
  nowMs: number,
): ParentClassMonthSummary {
  const summary: ParentClassMonthSummary = {
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    cancelledSessions: 0,
    noShowSessions: 0,
    rescheduleRequestedSessions: 0,
    rescheduledSessions: 0,
    inProgressSessions: 0,
    unresolvedPastSessions: 0,
    otherSessions: 0,
  };

  sessions.forEach((session) => {
    const status = normalizeClassSessionStatus(session.status);
    const startAtMs = Number(session.startAtMs ?? 0);
    const hasStart = Number.isFinite(startAtMs) && startAtMs > 0;

    summary.totalSessions += 1;

    if (status === 'completed') summary.completedSessions += 1;
    else if (status === 'cancelled') summary.cancelledSessions += 1;
    else if (status === 'no_show') summary.noShowSessions += 1;
    else if (status === 'reschedule_requested') summary.rescheduleRequestedSessions += 1;
    else if (status === 'rescheduled') summary.rescheduledSessions += 1;
    else if (status === 'in_progress') summary.inProgressSessions += 1;
    else if (status === 'other') summary.otherSessions += 1;

    if ((status === 'scheduled' || status === 'in_progress') && hasStart) {
      if (startAtMs >= nowMs) summary.upcomingSessions += 1;
      else summary.unresolvedPastSessions += 1;
    }
  });

  return summary;
}

/**
 * The parent dashboard must never silently replace a selected child's row with
 * family totals. Missing child data is represented as `null` so the UI can say
 * that child-specific data is unavailable instead of displaying another scope.
 */
export function selectCanonicalChildRow<T>(
  byKid: Record<string, T> | null | undefined,
  kidId: CanonicalKidId | null | undefined,
): T | null {
  const canonicalKidId = String(kidId ?? '').trim();
  if (!canonicalKidId || !byKid) return null;
  return byKid[canonicalKidId] ?? null;
}
