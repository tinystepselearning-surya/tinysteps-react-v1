import type {
  ChildCourseProgressProjection,
  ChildCourseProgressStageProjection,
} from '../../../../hooks/useChildCourseProgressProjection';

export type ParentInsightProgressState = "loading" | "available" | "unavailable";

export type ParentInsightCourseOption = {
  courseId: string;
  label: string;
};

export type ParentInsightStageState =
  | "completed"
  | "current"
  | "in_progress"
  | "upcoming"
  | "unavailable";

export type ParentInsightStageDisplay = {
  key: string;
  order: number;
  label: string;
  state: ParentInsightStageState;
  progressPct: number | null;
  completedCount: number | null;
  totalCount: number | null;
  masteryLabel: string;
  hint: string;
  focusItems: string[];
  expectations: string[];
};

export type ParentInsightTeacherDisplay = {
  lessonLabel: string;
  contextLabel: string;
  updatedLabel: string;
  note: string;
  ratingValue: number | null;
  ratingLabel: string;
};

export const getParentInsightStageKey = (
  order: number,
  label: string,
): string => `${order}__${label}`;

export const getParentInsightStageStateLabel = (
  state: ParentInsightStageState,
): string => {
  switch (state) {
    case "completed":
      return "Completed";
    case "current":
      return "Current stage";
    case "in_progress":
      return "Learning activity recorded";
    case "upcoming":
      return "Upcoming";
    default:
      return "Progress unavailable";
  }
};

export const resolveParentInsightStageState = ({
  key,
  order,
  progressPct,
  activeStageKey,
  activeStageOrder,
}: {
  key: string;
  order: number;
  progressPct: number | null;
  activeStageKey: string | null;
  activeStageOrder: number | null;
}): ParentInsightStageState => {
  if (progressPct === null) return "unavailable";
  if (progressPct >= 100) return "completed";
  if (key === activeStageKey) return "current";
  if (progressPct > 0) return "in_progress";
  if (activeStageOrder === null || order > activeStageOrder) return "upcoming";
  return "unavailable";
};

function normalizeCourseId(value: unknown): string {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  const aliases: Record<string, string> = {
    'phonics-foundation': 'phonics-foundations',
    foundational: 'phonics-foundations',
    foundation: 'phonics-foundations',
    'phonics-early': 'early-phonics',
    early: 'early-phonics',
    'phonics-advanced': 'advanced-phonics',
    advanced: 'advanced-phonics',
    'grammar-essentials': 'basic-grammar',
    'grammar-mastery': 'advanced-grammar',
    'intermediate-grammar': 'basic-grammar',
    'public-speaking-foundations': 'basic-public-speaking',
    'public-speaking-excellence': 'advanced-public-speaking',
    'intermediate-public-speaking': 'basic-public-speaking',
  };
  return aliases[raw] || raw;
}

function clampCount(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
}

function stageInvariantValid(stage: ChildCourseProgressStageProjection): boolean {
  const total = clampCount(stage.totalTopics);
  const completed = clampCount(stage.completedTopics);
  const inProgress = clampCount(stage.inProgressTopics);
  const notStarted = clampCount(stage.notStartedTopics);
  const expectedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    completed + inProgress + notStarted === total
    && clampCount(stage.completionPct) === expectedPct
  );
}

export type CanonicalParentInsightStageResult = {
  stages: ParentInsightStageDisplay[];
  activeStage: ParentInsightStageDisplay | null;
  nextStage: ParentInsightStageDisplay | null;
};

/**
 * P6 stage authority adapter.
 *
 * Completion counts and percentages come exclusively from the P3 projection. The legacy
 * stage rows passed by ParentDashboard are used only for presentation metadata such as the
 * parent-friendly label, hint, focus chips, and expectations. Their mastery-derived counts
 * are deliberately ignored.
 */
export function buildCanonicalParentInsightStages(params: {
  projection: ChildCourseProgressProjection | null | undefined;
  expectedCourseId: string | null | undefined;
  presentationStages?: readonly ParentInsightStageDisplay[] | null;
}): CanonicalParentInsightStageResult | null {
  const projection = params.projection;
  const expectedCourseId = normalizeCourseId(params.expectedCourseId);
  const projectionCourseId = normalizeCourseId(projection?.courseId);
  if (
    !projection
    || projection.schemaVersion !== 2
    || projection.modelType !== 'child_course_progress_v2'
    || projection.completionAuthority !== 'teacher_lesson_status'
    || projection.definitionStatus !== 'configured'
    || !expectedCourseId
    || projectionCourseId !== expectedCourseId
    || !Array.isArray(projection.stageSummaries)
  ) {
    return null;
  }

  const canonicalStages = [...projection.stageSummaries]
    .filter(stageInvariantValid)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  if (canonicalStages.length !== projection.stageSummaries.length || canonicalStages.length === 0) {
    return null;
  }

  const presentationStages = params.presentationStages ?? [];
  const presentationByOrder = new Map<number, ParentInsightStageDisplay>();
  presentationStages.forEach((stage) => {
    if (!presentationByOrder.has(stage.order)) presentationByOrder.set(stage.order, stage);
  });

  // Stage frontier uses actual curriculum activity, not mastery percentage. Legacy teacher
  // evidence is represented by P3 as inProgressTopics, so migrated students can still show
  // where learning has reached without inventing completed lessons.
  const evidenced = canonicalStages.filter(
    (stage) => clampCount(stage.completedTopics) > 0 || clampCount(stage.inProgressTopics) > 0,
  );
  const frontier = evidenced[evidenced.length - 1] ?? canonicalStages[0] ?? null;
  const activeOrder = frontier?.order ?? null;

  const stages: ParentInsightStageDisplay[] = canonicalStages.map((stage) => {
    const presentation = presentationByOrder.get(stage.order);
    const total = clampCount(stage.totalTopics);
    const completed = clampCount(stage.completedTopics);
    const inProgress = clampCount(stage.inProgressTopics);
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    let state: ParentInsightStageState;
    if (total > 0 && completed === total) state = 'completed';
    else if (stage.order === activeOrder) state = 'current';
    else if (inProgress > 0 || completed > 0) state = 'in_progress';
    else if (activeOrder === null || stage.order > activeOrder) state = 'upcoming';
    else state = 'unavailable';

    return {
      key: stage.key || getParentInsightStageKey(stage.order, stage.label),
      order: stage.order,
      label: presentation?.label || stage.label,
      state,
      progressPct: completionPct,
      completedCount: completed,
      totalCount: total,
      // Skill mastery remains a separate teacher-feedback concept. P6 curriculum state must
      // never display it as if it were lesson completion authority.
      masteryLabel: '',
      hint: presentation?.hint || '',
      focusItems: presentation?.focusItems || [],
      expectations: presentation?.expectations || [],
    };
  });

  const activeStage = stages.find((stage) => stage.order === activeOrder) ?? stages[0] ?? null;
  const nextStage = activeStage
    ? stages.find((stage) => stage.order > activeStage.order && stage.state !== 'completed') ?? null
    : null;

  return { stages, activeStage, nextStage };
}