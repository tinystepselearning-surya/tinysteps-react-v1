import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentDashboardHeroProps = {
  childName: string;
  heroMessage: string;
  programLabel: string;
  activeStageLabel: string;
  classesCompleted: number | null;
  classesUpcoming: number | null;
  classesScopeLabel: string;
  alertText: string;
  hasAlert: boolean;
  onViewInsights: () => void;
  onViewClasses: () => void;
  joinClassUrl?: string;
  joinClassDisabledReason?: string;
};

export default function ParentDashboardHero({
  childName,
  heroMessage,
  programLabel,
  activeStageLabel,
  classesCompleted,
  classesUpcoming,
  classesScopeLabel,
  alertText,
  hasAlert,
  onViewInsights,
  onViewClasses,
  joinClassUrl,
  joinClassDisabledReason = "Class link will appear once assigned.",
}: ParentDashboardHeroProps) {
  const classesAvailable = classesCompleted !== null && classesUpcoming !== null;

  return (
    <Card className="relative overflow-hidden rounded-[22px] border-indigo-100 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.10),transparent_36%),linear-gradient(145deg,#ffffff_0%,#f5f7ff_100%)] p-4 shadow-[0_16px_40px_rgba(79,70,229,0.09)] sm:p-5 dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_36%),linear-gradient(145deg,#0f172a_0%,#111827_100%)]">
      <div className="min-w-0">
        <h2 className="break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl dark:text-slate-100">
          {childName} at a glance
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600 sm:leading-6 dark:text-slate-300">
          {heroMessage}
        </p>

        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
          <div className="min-w-0 rounded-2xl border border-indigo-100 bg-indigo-50/75 px-3 py-2.5 dark:border-indigo-900/60 dark:bg-indigo-950/35">
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              Current programme
            </div>
            <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
              {programLabel}
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-violet-100 bg-violet-50/75 px-3 py-2.5 dark:border-violet-900/60 dark:bg-violet-950/30">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
              Current stage
            </div>
            <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
              {activeStageLabel}
            </div>
          </div>
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>
              {classesAvailable
                ? `${classesCompleted} completed · ${classesUpcoming} upcoming · ${classesScopeLabel}`
                : `Class totals unavailable · ${classesScopeLabel}`}
            </span>
          </div>
          <div
            className={hasAlert
              ? "flex items-start gap-2 text-amber-800 dark:text-amber-200"
              : "flex items-start gap-2 text-emerald-700 dark:text-emerald-300"}
            role={hasAlert ? "status" : undefined}
          >
            {hasAlert ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="break-words">{alertText}</span>
          </div>
        </div>

        <div className="mt-3" data-testid="hero-primary-action">
          {joinClassUrl ? (
            <Button
              asChild
              className="min-h-11 w-full bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.22)] hover:bg-indigo-700 sm:w-auto sm:min-w-48 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <a
                href={joinClassUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join Class in a new tab"
              >
                Join Class
                <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              aria-label={joinClassDisabledReason}
              aria-describedby="join-class-disabled-reason"
              title={joinClassDisabledReason}
              className="min-h-11 w-full border border-slate-300 bg-slate-200 text-slate-500 shadow-none disabled:opacity-100 sm:w-auto sm:min-w-48 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              Join Class
              <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        {!joinClassUrl && (
          <p id="join-class-disabled-reason" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {joinClassDisabledReason}
          </p>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={onViewClasses}
            variant="outline"
            className="min-h-11 border-indigo-200 bg-white/85 text-indigo-950 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-100 dark:hover:bg-indigo-950/40"
          >
            View Classes
          </Button>
          <Button
            type="button"
            onClick={onViewInsights}
            variant="ghost"
            className="min-h-11 border border-violet-100 bg-violet-50/70 text-violet-900 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-100 dark:hover:bg-violet-950/45"
          >
            View Insights
          </Button>
        </div>
      </div>
    </Card>
  );
}
