import { BookOpen, CalendarDays, CreditCard, Target } from "lucide-react";

import { Card } from "@/components/ui/card";

export type ProgressDisplayState = "loading" | "available" | "unavailable";

type ParentDashboardKpisProps = {
  progressState: ProgressDisplayState;
  completionPct?: number;
  lessonsSummaryText: string;
  confidenceLabel: string;
  confidenceMetaText: string;
  confidenceLoading?: boolean;
  attendanceLabel: string;
  attendanceMetaText: string;
  attendanceLoading?: boolean;
  billingLabel: string;
  billingMetaText: string;
  billingLoading?: boolean;
};

const valueSkeleton = <div className="mt-2 h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-700" />;

export default function ParentDashboardKpis({
  progressState,
  completionPct,
  lessonsSummaryText,
  confidenceLabel,
  confidenceMetaText,
  confidenceLoading = false,
  attendanceLabel,
  attendanceMetaText,
  attendanceLoading = false,
  billingLabel,
  billingMetaText,
  billingLoading = false,
}: ParentDashboardKpisProps) {
  const progressAvailable = progressState === "available" && typeof completionPct === "number";
  const safeProgressWidth = progressAvailable ? Math.max(0, Math.min(100, completionPct)) : 0;
  const cardClass = "min-w-0 rounded-[20px] border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";
  const iconClass = "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <section
      aria-label="Parent dashboard snapshot"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      data-layout="fixed-grid"
    >
      <Card className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Current course progress</p>
          <span className={iconClass}><BookOpen className="h-4 w-4" aria-hidden="true" /></span>
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
            <div className="h-1.5 rounded-full bg-slate-950 dark:bg-slate-100" style={{ width: `${safeProgressWidth}%` }} />
          </div>
        ) : (
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" aria-label="Course progress unavailable" />
        )}
      </Card>

      <Card className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Confidence snapshot</p>
          <span className={iconClass}><Target className="h-4 w-4" aria-hidden="true" /></span>
        </div>
        {confidenceLoading ? valueSkeleton : <p className="mt-2 break-words text-xl font-semibold text-slate-950 dark:text-slate-100">{confidenceLabel}</p>}
        <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{confidenceMetaText}</p>
      </Card>

      <Card className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Classes in selected month</p>
          <span className={iconClass}><CalendarDays className="h-4 w-4" aria-hidden="true" /></span>
        </div>
        {attendanceLoading ? valueSkeleton : <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{attendanceLabel}</p>}
        <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{attendanceMetaText}</p>
      </Card>

      <Card className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-slate-600">Wallet balance</p>
          <span className={iconClass}><CreditCard className="h-4 w-4" aria-hidden="true" /></span>
        </div>
        {billingLoading ? valueSkeleton : <p className="mt-2 break-words text-xl font-semibold text-slate-950 dark:text-slate-100">{billingLabel}</p>}
        <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{billingMetaText}</p>
      </Card>
    </section>
  );
}
