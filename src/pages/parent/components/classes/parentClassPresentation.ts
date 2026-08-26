import type { MaterializedParentChildMonthClassAttendance } from "../../../../lib/parentClassAttendanceProjection";

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

export type ParentClassMonthSummaryDisplay = {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  rescheduleRequestedSessions: number;
  rescheduledSessions: number;
  needsReviewSessions: number;
  presentSessions: number;
  lateSessions: number;
  absentSessions: number;
  attendanceMarkedSessions: number;
  attendanceUnmarkedCompletedSessions: number;
  attendancePct: number;
};

/**
 * P8 presentation selector over the canonical P4 selected-child/month row.
 * It never accepts parent totals or raw session rows, so class/attendance summary semantics
 * cannot drift from the P4 projection.
 */
export const buildParentClassMonthSummaryDisplay = (
  row: MaterializedParentChildMonthClassAttendance,
): ParentClassMonthSummaryDisplay => ({
  totalSessions: row.totalSessions,
  completedSessions: row.completedSessions,
  upcomingSessions: row.upcomingSessions,
  cancelledSessions: row.cancelledSessions,
  noShowSessions: row.noShowSessions,
  rescheduleRequestedSessions: row.rescheduleRequestedSessions,
  rescheduledSessions: row.rescheduledSessions,
  needsReviewSessions:
    row.unresolvedPastSessions + row.pendingTimeUnknownSessions + row.otherSessions,
  presentSessions: row.presentSessions,
  lateSessions: row.lateSessions,
  absentSessions: row.absentSessions,
  attendanceMarkedSessions: row.attendanceMarkedSessions,
  attendanceUnmarkedCompletedSessions: row.attendanceUnmarkedCompletedSessions,
  attendancePct: row.attendancePct,
});

export const formatParentClassMonthCompletion = (
  summary: ParentClassMonthSummaryDisplay,
  monthLabel: string,
): string => {
  const monthName = String(monthLabel || "").trim().split(/\s+/)[0] || "monthly";
  return `${summary.completedSessions} completed of ${summary.totalSessions} ${monthName} sessions`;
};

const rawSessionStatus = (source: unknown): string => {
  if (!source || typeof source !== "object") return "";
  return String((source as { status?: unknown }).status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
};

/**
 * ParentDashboard still has a compatibility normalizer that historically folded `rescheduled`
 * into `reschedule_requested`. P8 restores the more precise display state from the source row
 * without changing operational writers or other dashboard domains.
 */
export const getParentClassDisplayStatus = (row: ParentClassSessionDisplay): string => {
  const raw = rawSessionStatus(row.source);
  if (raw === "rescheduled") return "rescheduled";
  if (raw === "reschedule_requested") return "reschedule_requested";
  return row.status;
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
      return "Reschedule requested";
    case "rescheduled":
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
    case "rescheduled":
      return "border-teal-200 bg-teal-50 text-teal-800";
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
    case "rescheduled":
      return "bg-teal-600";
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
  && status !== "rescheduled"
  && status !== "paused";
