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
  classesCompleted: number;
  classesUpcoming: number;
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
  return (
    <Card className="overflow-hidden rounded-[20px] border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="min-w-0">
        <h2 className="break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl dark:text-slate-100">
          {childName} at a glance
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600 sm:leading-6 dark:text-slate-300">
          {heroMessage}
        </p>

        <div className="mt-4 grid min-w-0 grid-cols-2 divide-x divide-slate-200 rounded-2xl bg-white/70 px-1 py-3 dark:divide-slate-700 dark:bg-slate-900/60">
          <div className="min-w-0 px-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              Current programme
            </div>
            <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
              {programLabel}
            </div>
          </div>
          <div className="min-w-0 px-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
              Current stage
            </div>
            <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
              {activeStageLabel}
            </div>
          </div>
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>{classesCompleted} completed · {classesUpcoming} upcoming · {classesScopeLabel}</span>
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

        <div className="mt-4" data-testid="hero-primary-action">
          {joinClassUrl ? (
            <Button
              asChild
              className="min-h-11 w-full bg-slate-950 text-white shadow-sm hover:bg-slate-800 sm:w-auto sm:min-w-48 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
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
            className="min-h-11 border-slate-300 bg-white/80 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            View Classes
          </Button>
          <Button
            type="button"
            onClick={onViewInsights}
            variant="ghost"
            className="min-h-11 text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View Insights
          </Button>
        </div>
      </div>
    </Card>
  );
}
