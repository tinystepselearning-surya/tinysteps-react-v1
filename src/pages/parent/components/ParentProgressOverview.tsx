import { RefreshCw } from "lucide-react";

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
  completionPct: number;
  stripStagePrefix: (label: string, order: number) => string;
};

export default function ParentProgressOverview(props: ParentProgressOverviewProps) {
  const {
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
  } = props;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Progress Overview</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            What {childName} is learning now and how completion is moving.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefetching}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      {showsFallbackBanner && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Showing live progress docs while monthly projection catches up.
        </div>
      )}

      {phonicsLoading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Loading progress overview...
        </div>
      ) : phonicsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {phonicsErrorMessage}
        </div>
      ) : !curriculumData ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Curriculum lessons are not available yet for this child.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Course completion</span>
              <span>
                {curriculumData.summaryCompletedCount}/{curriculumData.summaryTotalTopics} lessons
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-2.5 rounded-full bg-slate-900 dark:bg-slate-100"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Completed Stages</div>
              <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {curriculumData.completedStages}/{curriculumData.stageSummaries.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Current Focus</div>
              <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {curriculumData.activeStage
                  ? stripStagePrefix(curriculumData.activeStage.label, curriculumData.activeStage.order ?? 0)
                  : "Stage setup pending"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Coming Next</div>
              <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {curriculumData.nextStage
                  ? stripStagePrefix(curriculumData.nextStage.label, curriculumData.nextStage.order ?? 0)
                  : "Keep practicing this stage"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {curriculumData.stageSummaries.slice(0, 4).map((stage: any, index: number) => (
              <div
                key={`${stage.order}-${stage.label}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Stage {typeof stage.order === "number" && stage.order > 0 ? stage.order : index + 1}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {Math.round(stage.progressPct ?? 0)}%
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stripStagePrefix(stage.label, stage.order ?? index + 1)}
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-slate-900 dark:bg-slate-100"
                    style={{ width: `${Math.round(stage.progressPct ?? 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
