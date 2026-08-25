import type { ChildCourseProgressProjection } from '../../../../hooks/useChildCourseProgressProjection';
import type { ParentInsightStageDisplay } from './parentInsightsPresentation';

export type CanonicalParentInsightsProgress = {
  completedLessons: number;
  totalLessons: number;
  completionPct: number;
  completedStages: number;
  lastUpdatedAtMs: number | null;
  stages: ParentInsightStageDisplay[];
  activeStage: ParentInsightStageDisplay | null;
  nextStage: ParentInsightStageDisplay | null;
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

function normalized(value: unknown): string {
  return String(value ?? '').trim();
}

/**
 * P6 completion boundary.
 *
 * Course/stage completion comes only from the P3 V3 saved-lesson projection. The presentation
 * rows supplied by ParentDashboard remain useful for mastery labels, focus chips, hints and
 * expectations, but their mastery-derived percentages/counts are deliberately ignored here.
 */
export function selectCanonicalParentInsightsProgress(
  projection: ChildCourseProgressProjection | null | undefined,
  expectedCourseId: string | null | undefined,
  presentationStages: readonly ParentInsightStageDisplay[] = [],
): CanonicalParentInsightsProgress | null {
  if (!projection) return null;
  if (projection.schemaVersion !== 3) return null;
  if (projection.modelType !== 'child_course_progress_v3') return null;
  if (projection.completionAuthority !== 'teacher_progress_save') return null;
  if (projection.definitionStatus !== 'configured') return null;

  const expected = normalized(expectedCourseId);
  const courseId = normalized(projection.courseId || expected);
  if (!courseId || (expected && courseId !== expected)) return null;

  const totalLessons = count(projection.totalTopics);
  const completedLessons = count(projection.completedTopics);
  const inProgressLessons = count(projection.inProgressTopics);
  const notStartedLessons = count(projection.notStartedTopics);
  const completionPct = pct(projection.overallPct);

  if (inProgressLessons !== 0) return null;
  if (completedLessons + notStartedLessons !== totalLessons) return null;
  if (completionPct !== (totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0)) {
    return null;
  }

  const rawStages = Array.isArray(projection.stageSummaries)
    ? [...projection.stageSummaries].sort((a, b) => count(a.order) - count(b.order))
    : [];
  if (rawStages.length === 0 && totalLessons > 0) return null;

  const invalidStage = rawStages.some((stage) => {
    const totalCount = count(stage.totalTopics);
    const completedCount = count(stage.completedTopics);
    const inProgressCount = count(stage.inProgressTopics);
    const notStartedCount = count(stage.notStartedTopics);
    const progressPct = pct(stage.completionPct);
    return (
      inProgressCount !== 0 ||
      completedCount + notStartedCount !== totalCount ||
      progressPct !== (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0)
    );
  });
  if (invalidStage) return null;

  const presentationByOrder = new Map<number, ParentInsightStageDisplay>();
  presentationStages.forEach((stage) => {
    const order = count(stage.order);
    if (order > 0 && !presentationByOrder.has(order)) presentationByOrder.set(order, stage);
  });

  let stageTotal = 0;
  let stageCompleted = 0;
  let stageNotStarted = 0;
  const materialized = rawStages.map((stage) => {
    const order = count(stage.order);
    const totalCount = count(stage.totalTopics);
    const completedCount = count(stage.completedTopics);
    const notStartedCount = count(stage.notStartedTopics);
    const progressPct = pct(stage.completionPct);

    stageTotal += totalCount;
    stageCompleted += completedCount;
    stageNotStarted += notStartedCount;
    const presentation = presentationByOrder.get(order);
    return {
      key: presentation?.key || normalized(stage.key) || `${order}__${normalized(stage.label) || 'Stage'}`,
      order,
      label: presentation?.label || normalized(stage.label) || `Stage ${order}`,
      state: 'upcoming' as const,
      progressPct,
      completedCount,
      totalCount,
      masteryLabel: presentation?.masteryLabel || '',
      hint: presentation?.hint || '',
      focusItems: presentation?.focusItems ? [...presentation.focusItems] : [],
      expectations: presentation?.expectations ? [...presentation.expectations] : [],
    } satisfies ParentInsightStageDisplay;
  });

  if (stageTotal !== totalLessons || stageCompleted !== completedLessons || stageNotStarted !== notStartedLessons) {
    return null;
  }

  const partialStages = materialized.filter(
    (stage) => (stage.completedCount ?? 0) > 0 && (stage.completedCount ?? 0) < (stage.totalCount ?? 0),
  );
  let activeStage = partialStages[partialStages.length - 1] || null;
  if (!activeStage) {
    const furthestCompletedIndex = materialized.reduce(
      (latest, stage, index) =>
        (stage.totalCount ?? 0) > 0 && stage.completedCount === stage.totalCount ? index : latest,
      -1,
    );
    activeStage = materialized[furthestCompletedIndex + 1] || materialized[materialized.length - 1] || null;
  }

  const stages = materialized.map((stage) => ({
    ...stage,
    state:
      (stage.totalCount ?? 0) > 0 && stage.completedCount === stage.totalCount
        ? 'completed'
        : activeStage && stage.key === activeStage.key
          ? 'current'
          : 'upcoming',
  })) as ParentInsightStageDisplay[];
  activeStage = activeStage ? stages.find((stage) => stage.key === activeStage?.key) || null : null;
  const activeIndex = activeStage ? stages.findIndex((stage) => stage.key === activeStage?.key) : -1;
  const nextStage = activeIndex >= 0
    ? stages.slice(activeIndex + 1).find((stage) => stage.completedCount !== stage.totalCount) || null
    : null;

  return {
    completedLessons,
    totalLessons,
    completionPct,
    completedStages: stages.filter(
      (stage) => (stage.totalCount ?? 0) > 0 && stage.completedCount === stage.totalCount,
    ).length,
    lastUpdatedAtMs:
      typeof projection.lastUpdatedAtMs === 'number' && Number.isFinite(projection.lastUpdatedAtMs)
        ? projection.lastUpdatedAtMs
        : null,
    stages,
    activeStage,
    nextStage,
  };
}
