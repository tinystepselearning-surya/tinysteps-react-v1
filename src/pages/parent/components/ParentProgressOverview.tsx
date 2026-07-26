import { CheckCircle2, Circle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentProgressOverviewProps = {
  childName: string;
  isRefetching: boolean;
  onRefresh: () => void;
  showsFallbackBanner: boolean;
  phonicsLoading: boolean;
  phonicsError: boolean;
  phonicsErrorMessage: string;
  curriculumData: any;
  completionPct?: number;
  stripStagePrefix: (label: string, order: number) => string;
};

export default function ParentProgressOverview({
  childName,
  isRefetching,
  onRefresh,
  showsFallbackBanner,
  phonicsLoading,
  phonicsError,
  phonicsErrorMessage,
  curriculumData,
  completionPct,
  stripStagePrefix,
}: ParentProgressOverviewProps) {
  const hasCompletion = Boolean(curriculumData) && typeof completionPct === "number";
  const safeProgressWidth = hasCompletion ? Math.max(0, Math.min(100, completionPct)) : 0;
  const activeStageKey = curriculumData?.activeStage
    ? `${curriculumData.activeStage.order}-${curriculumData.activeStage.label}`
    : null;

  return (
    <Card className="rounded-[20px] border-indigo-100 bg-gradient-to-br from-white to-indigo-50/35 p-4 shadow-sm sm:p-5 dark:border-indigo-900/60 dark:from-slate-900 dark:to-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Progress Overview</h3>
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {childName}&apos;s current-course journey.
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefetching}
          aria-label={isRefetching ? "Refreshing progress" : "Refresh progress"}
          className="h-11 w-11 shrink-0 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {showsFallbackBanner && (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-4 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Showing the latest available lesson progress while the monthly summary updates.
        </div>
      )}

      {phonicsLoading ? (
        <div className="mt-4 space-y-3" aria-label="Loading progress overview">
          <div className="h-7 w-28 rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : phonicsError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {phonicsErrorMessage}
        </div>
      ) : !curriculumData ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Curriculum lessons are not available yet for this child.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Current course completion</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-100">{completionPct}%</p>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {curriculumData.summaryCompletedCount}/{curriculumData.summaryTotalTopics} lessons
              </p>
            </div>
            <div
              className="mt-2 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"
              role="progressbar"
              aria-label="Current course completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPct}
            >
              <div className="h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${safeProgressWidth}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-2xl bg-slate-50 py-3 dark:divide-slate-700 dark:bg-slate-800/60">
            <div className="min-w-0 px-3">
              <p className="text-xs text-slate-500">Current focus</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-100">
                {curriculumData.activeStage
                  ? stripStagePrefix(curriculumData.activeStage.label, curriculumData.activeStage.order ?? 0)
                  : "Stage setup pending"}
              </p>
            </div>
            <div className="min-w-0 px-3">
              <p className="text-xs text-slate-500">Coming next</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-100">
                {curriculumData.nextStage
                  ? stripStagePrefix(curriculumData.nextStage.label, curriculumData.nextStage.order ?? 0)
                  : "Keep practising this stage"}
              </p>
            </div>
          </div>

          <ol className="divide-y divide-slate-200 dark:divide-slate-700" aria-label="Course stage journey">
            {curriculumData.stageSummaries.slice(0, 4).map((stage: any, index: number) => {
              const stageKey = `${stage.order}-${stage.label}`;
              const isActive = stageKey === activeStageKey;
              const stagePct = Number(stage.progressPct ?? 0);
              return (
                <li
                  key={stageKey}
                  className="flex min-w-0 items-center gap-3 py-3"
                  aria-current={isActive ? "step" : undefined}
                  data-stage-state={isActive ? "active" : stagePct >= 100 ? "complete" : "upcoming"}
                >
                  {stagePct >= 100 ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className={isActive ? "h-5 w-5 shrink-0 fill-slate-950 text-slate-950 dark:fill-slate-100 dark:text-slate-100" : "h-5 w-5 shrink-0 text-slate-300"} aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Stage {typeof stage.order === "number" && stage.order > 0 ? stage.order : index + 1}</p>
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {stripStagePrefix(stage.label, stage.order ?? index + 1)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">{Math.round(stagePct)}%</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}
