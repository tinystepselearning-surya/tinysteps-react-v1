export type ParentInsightProgressState = "loading" | "available" | "unavailable";

export type ParentInsightCourseOption = {
  courseId: string;
  label: string;
};

export type ParentInsightStageState =
  | "completed"
  | "current"
  | "in_progress"
  | "not_started"
  | "upcoming"
  | "unavailable";

export type ParentInsightLessonDisplay = {
  id: string;
  label: string;
  lessonStatus: "not_started" | "in_progress" | "completed";
  updatedLabel: string;
};

export type ParentInsightStageDisplay = {
  key: string;
  order: number;
  label: string;
  state: ParentInsightStageState;
  progressPct: number | null;
  completedCount: number | null;
  inProgressCount: number | null;
  notStartedCount: number | null;
  totalCount: number | null;
  hint: string;
  focusItems: string[];
  expectations: string[];
  lessons: ParentInsightLessonDisplay[];
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
      return "In progress";
    case "not_started":
      return "Not started";
    case "upcoming":
      return "Upcoming";
    default:
      return "Progress unavailable";
  }
};

export const getParentInsightLessonStatusLabel = (
  status: ParentInsightLessonDisplay["lessonStatus"],
): string => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      return "Not started";
  }
};

export const resolveParentInsightStageState = ({
  key,
  order,
  completedCount,
  inProgressCount,
  totalCount,
  activeStageKey,
  activeStageOrder,
}: {
  key: string;
  order: number;
  completedCount: number | null;
  inProgressCount: number | null;
  totalCount: number | null;
  activeStageKey: string | null;
  activeStageOrder: number | null;
}): ParentInsightStageState => {
  if (completedCount === null || inProgressCount === null || totalCount === null) return "unavailable";
  if (totalCount > 0 && completedCount === totalCount) return "completed";
  if (key === activeStageKey) return "current";
  if (completedCount > 0 || inProgressCount > 0) return "in_progress";
  if (activeStageOrder === null || order > activeStageOrder) return "upcoming";
  return "not_started";
};
