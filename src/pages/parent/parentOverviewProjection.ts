import type {
  ChildCourseProgressProjection,
  ChildCourseProgressStageProjection,
} from '../../hooks/useChildCourseProgressProjection';
import {
  selectCanonicalParentChildMonthClassAttendance,
  type MaterializedParentChildMonthClassAttendance,
  type ParentClassAttendanceReadModel,
} from '../../lib/parentClassAttendanceProjection';

export type ParentOverviewCourseStage = {
  key: string;
  label: string;
  order: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  completionPct: number;
};

export type ParentOverviewCourseSummary = {
  courseId: string;
  courseLabel: string | null;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  overallPct: number;
  totalStages: number;
  completedStages: number;
  stageSummaries: ParentOverviewCourseStage[];
  activeStage: ParentOverviewCourseStage | null;
  nextStage: ParentOverviewCourseStage | null;
  lastUpdatedAtMs: number | null;
};

export type ParentOverviewClassCounts = {
  total: number;
  completed: number;
  in_progress: number;
  scheduled: number;
  cancelled: number;
  no_show: number;
  reschedule_requested: number;
  rescheduled: number;
  other: number;
  upcoming: number;
  unresolved_past: number;
  pending_time_unknown: number;
  attendance_pct: number;
};

export type CanonicalParentOverview = {
  course: ParentOverviewCourseSummary | null;
  classAttendance: MaterializedParentChildMonthClassAttendance | null;
  classCounts: ParentOverviewClassCounts | null;
};

function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

function pct(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeStage(stage: ChildCourseProgressStageProjection): ParentOverviewCourseStage {
  return {
    key: String(stage.key || '').trim(),
    label: String(stage.label || '').trim() || 'Stage',
    order: count(stage.order),
    totalTopics: count(stage.totalTopics),
    completedTopics: count(stage.completedTopics),
    inProgressTopics: count(stage.inProgressTopics),
    notStartedTopics: count(stage.notStartedTopics),
    completionPct: pct(stage.completionPct),
  };
}

function stageIsValid(stage: ParentOverviewCourseStage): boolean {
  return (
    stage.inProgressTopics === 0 &&
    stage.completedTopics + stage.notStartedTopics === stage.totalTopics &&
    stage.completionPct ===
      (stage.totalTopics > 0 ? Math.round((stage.completedTopics / stage.totalTopics) * 100) : 0)
  );
}

function selectSavedLessonStageJourney(stageSummaries: ParentOverviewCourseStage[]): {
  activeStage: ParentOverviewCourseStage | null;
  nextStage: ParentOverviewCourseStage | null;
} {
  if (stageSummaries.length === 0) return { activeStage: null, nextStage: null };

  const partialStages = stageSummaries.filter(
    (stage) => stage.completedTopics > 0 && stage.completedTopics < stage.totalTopics,
  );
  let activeStage = partialStages[partialStages.length - 1] || null;

  if (!activeStage) {
    const furthestCompletedIndex = stageSummaries.reduce(
      (latest, stage, index) =>
        stage.totalTopics > 0 && stage.completedTopics === stage.totalTopics ? index : latest,
      -1,
    );
    activeStage =
      stageSummaries[furthestCompletedIndex + 1] ||
      stageSummaries[stageSummaries.length - 1] ||
      null;
  }

  const activeIndex = activeStage
    ? stageSummaries.findIndex((stage) => stage.key === activeStage.key && stage.order === activeStage.order)
    : -1;
  const nextStage =
    activeIndex >= 0
      ? stageSummaries.slice(activeIndex + 1).find((stage) => stage.completedTopics < stage.totalTopics) || null
      : null;

  return { activeStage, nextStage };
}

/**
 * Canonical parent course selector.
 *
 * A curriculum lesson is completed when the teacher successfully saves that lesson's
 * canonical progress document. Re-saving the same lesson only updates the existing document,
 * so completion stays one-per-lesson. Mastery, skill stars, attendance, and class completion
 * are not alternate curriculum counters.
 */
export function selectCanonicalParentOverviewCourse(
  projection: ChildCourseProgressProjection | null | undefined,
  expectedCourseId: string | null | undefined,
): ParentOverviewCourseSummary | null {
  if (!projection) return null;
  if (projection.schemaVersion !== 3) return null;
  if (projection.modelType !== 'child_course_progress_v3') return null;
  if (projection.completionAuthority !== 'teacher_progress_save') return null;
  if (projection.definitionStatus !== 'configured') return null;

  const expected = String(expectedCourseId || '').trim();
  const courseId = String(projection.courseId || expected).trim();
  if (!courseId) return null;
  if (expected && courseId !== expected) return null;

  const totalTopics = count(projection.totalTopics);
  const completedTopics = count(projection.completedTopics);
  const inProgressTopics = count(projection.inProgressTopics);
  const notStartedTopics = count(projection.notStartedTopics);
  const overallPct = pct(projection.overallPct);

  if (inProgressTopics !== 0) return null;
  if (completedTopics + notStartedTopics !== totalTopics) return null;
  if (
    overallPct !==
    (totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0)
  ) {
    return null;
  }

  const stageSummaries = Array.isArray(projection.stageSummaries)
    ? projection.stageSummaries.map(normalizeStage).sort((a, b) => a.order - b.order)
    : [];
  if (stageSummaries.some((stage) => !stageIsValid(stage))) return null;

  if (stageSummaries.length > 0) {
    const stageTotals = stageSummaries.reduce(
      (acc, stage) => ({
        total: acc.total + stage.totalTopics,
        completed: acc.completed + stage.completedTopics,
        inProgress: acc.inProgress + stage.inProgressTopics,
        notStarted: acc.notStarted + stage.notStartedTopics,
      }),
      { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
    );
    if (
      stageTotals.total !== totalTopics ||
      stageTotals.completed !== completedTopics ||
      stageTotals.inProgress !== inProgressTopics ||
      stageTotals.notStarted !== notStartedTopics
    ) {
      return null;
    }
  }

  const { activeStage, nextStage } = selectSavedLessonStageJourney(stageSummaries);
  const derivedCompletedStages = stageSummaries.filter(
    (stage) => stage.totalTopics > 0 && stage.completedTopics === stage.totalTopics,
  ).length;

  return {
    courseId,
    courseLabel: projection.courseLabel ? String(projection.courseLabel).trim() || null : null,
    totalTopics,
    completedTopics,
    inProgressTopics,
    notStartedTopics,
    overallPct,
    totalStages: stageSummaries.length || count(projection.totalStages),
    completedStages: derivedCompletedStages,
    stageSummaries,
    activeStage,
    nextStage,
    lastUpdatedAtMs:
      typeof projection.lastUpdatedAtMs === 'number' && Number.isFinite(projection.lastUpdatedAtMs)
        ? projection.lastUpdatedAtMs
        : null,
  };
}

export function toParentOverviewClassCounts(
  row: MaterializedParentChildMonthClassAttendance | null,
): ParentOverviewClassCounts | null {
  if (!row) return null;
  return {
    total: row.totalSessions,
    completed: row.completedSessions,
    in_progress: row.inProgressSessions,
    scheduled: row.scheduledSessions,
    cancelled: row.cancelledSessions,
    no_show: row.noShowSessions,
    reschedule_requested: row.rescheduleRequestedSessions,
    rescheduled: row.rescheduledSessions,
    other: row.otherSessions,
    upcoming: row.upcomingSessions,
    unresolved_past: row.unresolvedPastSessions,
    pending_time_unknown: row.pendingTimeUnknownSessions,
    attendance_pct: row.attendancePct,
  };
}

/** One P5 selection point for the Overview. No family totals and no legacy course fallback. */
export function buildCanonicalParentOverview(params: {
  courseProjection: ChildCourseProgressProjection | null | undefined;
  expectedCourseId: string | null | undefined;
  classAttendanceModel: ParentClassAttendanceReadModel | null | undefined;
  kidId: string | null | undefined;
  nowMs: number;
}): CanonicalParentOverview {
  const classAttendance = selectCanonicalParentChildMonthClassAttendance(
    params.classAttendanceModel,
    params.kidId,
    params.nowMs,
  );
  return {
    course: selectCanonicalParentOverviewCourse(params.courseProjection, params.expectedCourseId),
    classAttendance,
    classCounts: toParentOverviewClassCounts(classAttendance),
  };
}
