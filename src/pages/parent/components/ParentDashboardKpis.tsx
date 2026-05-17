import { BookOpen, CalendarDays, CreditCard, Target } from "lucide-react";

import { Card } from "@/components/ui/card";

type ParentDashboardKpisProps = {
  completionPct: number;
  lessonsSummaryText: string;
  confidenceLabel: string;
  confidenceMetaText: string;
  attendanceLabel: string;
  attendanceMetaText: string;
  billingLabel: string;
  billingMetaText: string;
};

export default function ParentDashboardKpis(props: ParentDashboardKpisProps) {
  const {
    completionPct,
    lessonsSummaryText,
    confidenceLabel,
    confidenceMetaText,
    attendanceLabel,
    attendanceMetaText,
    billingLabel,
    billingMetaText,
  } = props;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Progress</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{completionPct}%</p>
            <p className="mt-1 text-xs text-slate-500">{lessonsSummaryText}</p>
          </div>
          <BookOpen className="h-5 w-5 text-slate-400" />
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence Snapshot</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{confidenceLabel}</p>
            <p className="mt-1 text-xs text-slate-500">{confidenceMetaText}</p>
          </div>
          <Target className="h-5 w-5 text-slate-400" />
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendance This Month</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{attendanceLabel}</p>
            <p className="mt-1 text-xs text-slate-500">{attendanceMetaText}</p>
          </div>
          <CalendarDays className="h-5 w-5 text-slate-400" />
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet Snapshot</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{billingLabel}</p>
            <p className="mt-1 text-xs text-slate-500">{billingMetaText}</p>
          </div>
          <CreditCard className="h-5 w-5 text-slate-400" />
        </div>
      </Card>
    </div>
  );
}
