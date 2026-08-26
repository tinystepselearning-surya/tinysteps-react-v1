import { CheckCircle2, Circle } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ParentOverviewCourseSummary } from "../parentOverviewProjection";

type ParentProgressOverviewProps = {
  childName: string;
  loading: boolean;
  errorMessage?: string | null;
  course: ParentOverviewCourseSummary | null;
  stripStagePrefix: (label: string, order: number) => string;
};

export default function ParentProgressOverview({
  childName,
  loading,
  errorMessage,
  course,
  stripStagePrefix,
}: ParentProgressOverviewProps) {
  const completionPct = course?.overallPct;
  const hasCompletion = Boolean(course) && typeof completionPct === "number";
  const safeProgressWidth = hasCompletion ? Math.max(0, Math.min(100, completionPct as number)) : 0;
  const activeStageKey = course?.activeStage
    ? `${course.activeStage.order}-${course.activeStage.key}`
    : null;

  return (
    <Card className="rounded-[20px] border-indigo-100 bg-gradient-to-br from-white to-indigo-50/35 p-4 shadow-sm sm:p-5 dark:border-indigo-900/60 dark:from-slate-900 dark:to-slate-900">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Progress Overview</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
          Course progress for {childName}, based on lessons saved by your child&apos;s teacher.
        </p>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3" aria-label="Loading progress overview">
          <div className="h-7 w-28 rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {errorMessage}
        </div>
      ) : !course ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Course progress is unavailable until the canonical lesson projection is ready. No mastery-based estimate is substituted.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Course completion</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-100">{completionPct}%</p>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {course.completedTopics}/{course.totalTopics} lessons
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
                {course.activeStage
                  ? stripStagePrefix(course.activeStage.label, course.activeStage.order)
                  : "Course complete"}
              </p>
            </div>
            <div className="min-w-0 px-3">
              <p className="text-xs text-slate-500">Coming next</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-100">
                {course.nextStage
                  ? stripStagePrefix(course.nextStage.label, course.nextStage.order)
                  : course.completedTopics === course.totalTopics && course.totalTopics > 0
                    ? "Course complete"
                    : "Continue current stage"}
              </p>
            </div>
          </div>

          {course.stageSummaries.length > 0 ? (
            <ol className="divide-y divide-slate-200 dark:divide-slate-700" aria-label="Course stage journey">
              {course.stageSummaries.map((stage, index) => {
                const stageKey = `${stage.order}-${stage.key}`;
                const isActive = stageKey === activeStageKey;
                const isComplete = stage.totalTopics > 0 && stage.completedTopics === stage.totalTopics;
                const hasProgress = stage.completedTopics > 0;
                const stageState = isActive
                  ? "current"
                  : isComplete
                    ? "completed"
                    : hasProgress
                      ? "in_progress"
                      : "not_started";
                return (
                  <li
                    key={stageKey}
                    className="flex min-w-0 items-center gap-3 py-3"
                    aria-current={isActive ? "step" : undefined}
                    data-stage-state={stageState}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Circle className={isActive ? "h-5 w-5 shrink-0 fill-slate-950 text-slate-950 dark:fill-slate-100 dark:text-slate-100" : "h-5 w-5 shrink-0 text-slate-300"} aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">Stage {stage.order > 0 ? stage.order : index + 1}</p>
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {stripStagePrefix(stage.label, stage.order || index + 1)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">{stage.completionPct}%</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:bg-slate-800/60">
              Stage breakdown is not configured for this course yet.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
