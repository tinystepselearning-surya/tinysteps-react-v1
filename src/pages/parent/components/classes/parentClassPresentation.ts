export type ParentClassesFilterId =
  | "today"
  | "upcoming"
  | "completed"
  | "past_pending"
  | "rescheduled";

export type ParentClassesResourceId = "calendar" | "recordings";

export type ParentClassesViewId = ParentClassesFilterId | "calendar";

export type ParentClassSessionDisplay = {
  id: string;
  source: unknown;
  dateLabel: string;
  dateTime?: string;
  timeLabel: string;
  indiaTimeLabel: string;
  legacyTimeWarning: boolean;
  courseName: string;
  teacherName: string;
  childName: string;
  status: string;
  startMs: number;
  isToday: boolean;
  isFuture: boolean;
  canJoin: boolean;
  joinDisabledReason: string;
};

export const getParentClassStatusLabel = (status: string): string => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No show";
    case "reschedule_requested":
      return "Rescheduled";
    case "paused":
      return "Paused";
    default:
      return "Scheduled";
  }
};

export const getParentClassStatusTone = (status: string): string => {
  switch (status) {
    case "completed":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "in_progress":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "no_show":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "reschedule_requested":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
  }
};

export const getParentClassStatusDotTone = (status: string): string => {
  switch (status) {
    case "completed":
    case "cancelled":
      return "bg-slate-500";
    case "in_progress":
      return "bg-sky-600";
    case "no_show":
      return "bg-orange-600";
    case "reschedule_requested":
      return "bg-amber-600";
    default:
      return "bg-indigo-600";
  }
};

const isNextClassStatus = (status: string): boolean =>
  status === "scheduled" || status === "in_progress";

export const selectNextParentClass = (
  rows: ParentClassSessionDisplay[],
): ParentClassSessionDisplay | null => {
  const todayJoinable = rows.find(
    (row) => row.isToday && isNextClassStatus(row.status) && row.canJoin,
  );
  if (todayJoinable) return todayJoinable;

  const futureJoinable = rows.find(
    (row) => row.isFuture && isNextClassStatus(row.status) && row.canJoin,
  );
  if (futureJoinable) return futureJoinable;

  return rows.find(
    (row) => row.isFuture && isNextClassStatus(row.status),
  ) || null;
};

export const shouldShowClassJoinAction = (status: string): boolean =>
  status !== "completed"
  && status !== "cancelled"
  && status !== "no_show"
  && status !== "reschedule_requested"
  && status !== "paused";
