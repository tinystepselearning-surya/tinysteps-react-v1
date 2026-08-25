import { BookOpen, CalendarDays, CreditCard } from "lucide-react";

import { Card } from "@/components/ui/card";

export type ProgressDisplayState = "loading" | "available" | "unavailable";
export type AttendanceDisplayState = "loading" | "available" | "unavailable";

type ParentDashboardKpisProps = {
  progressState: ProgressDisplayState;
  completionPct?: number;
  lessonsSummaryText: string;
  // Kept temporarily for ParentDashboard call-site compatibility until P10 removes
  // the retired confidence wiring. P5 intentionally does not display guessed confidence.
  confidenceLabel?: string;
  confidenceMetaText?: string;
  confidenceLoading?: boolean;
  attendanceState: AttendanceDisplayState;
  attendanceLabel: string;
  attendanceMetaText: string;
  billingLabel: string;
  billingMetaText: string;
  billingLoading?: boolean;
};

const valueSkeleton = <div className="mt-2 h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-700" />;

export default function ParentDashboardKpis({
  progressState,
  completionPct,
  lessonsSummaryText,
  attendanceState,
  attendanceLabel,
  attendanceMetaText,
  billingLabel,
  billingMetaText,
  billingLoading = false,
}: ParentDashboardKpisProps) {
  const progressAvailable = progressState === "available" && typeof completionPct === "number";
  const safeProgressWidth = progressAvailable ? Math.max(0, Math.min(100, completionPct)) : 0;
  const cardClass = "min-w-0 h-full overflow-hidden rounded-[20px] border p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:bg-slate-900";

  return (
    <section
      aria-label="Parent dashboard snapshot"
      className="grid gap-3 sm:grid-cols-3"
      data-layout="fixed-grid"
    >
      <Card className={`${cardClass} border-indigo-100 bg-gradient-to-br from-white to-indigo-50/65 dark:border-indigo-900/60 dark:from-slate-900 dark:to-slate-900`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Course progress</p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><BookOpen className="h-4 w-4" aria-hidden="true" /></span>
        </div>
        {progressState === "loading" ? valueSkeleton : (
          <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {progressAvailable ? `${completionPct}%` : "Not available"}
          </p>
        )}
        <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{lessonsSummaryText}</p>
        {progressAvailable ? (
          <div
            className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"
            role="progressbar"
            aria-label="Current course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPct}
          >
            <div className="h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${safeProgressWidth}%` }} />
          </div>
        ) : (
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" aria-label="Course progress unavailable" />
        )}
      </Card>

      <Card className={`${cardClass} border-amber-100 bg-gradient-to-br from-white to-amber-50/65 dark:border-amber-900/60 dark:from-slate-900 dark:to-slate-900`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Classes this month</p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><CalendarDays className="h-4 w-4" aria-hidden="true" /></span>
        </div>
        {attendanceState === "loading" ? valueSkeleton : (
          <p className="mt-2 break-words text-xl font-semibold text-slate-950 dark:text-slate-100">
            {attendanceState === "available" ? attendanceLabel : "Not available"}
          </p>
        )}
        <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{attendanceMetaText}</p>
      </Card>

      <Card className={`${cardClass} border-teal-100 bg-gradient-to-br from-white to-teal-50/65 dark:border-teal-900/60 dark:from-slate-900 dark:to-slate-900`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Wallet</p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><CreditCard className="h-4 w-4" aria-hidden="true" /></span>
        </div>
        {billingLoading ? valueSkeleton : <p className="mt-2 break-words text-xl font-semibold text-slate-950 dark:text-slate-100">{billingLabel}</p>}
        <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{billingMetaText}</p>
      </Card>
    </section>
  );
}
