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
      return "Progress recorded";
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
