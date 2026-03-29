import type React from "react";
import { ArrowRight, RefreshCw } from "lucide-react";

import ChildSkillRatingCard from "../../../components/progress/ChildSkillRatingCard";
import {
  normalizeProgressSkillsMeta,
  skillRatingLegendLabel,
  summarizeProgressRatings,
} from "../../../lib/skillRatings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CurriculumFilter = "all" | "in_progress" | "completed";

type ParentLessonTrackerProps = {
  phonicsLoading: boolean;
  phonicsError: boolean;
  phonicsErrorMessage: string;
  displayCourseId: string | null;
  curriculumData: any;
  curriculumFilter: CurriculumFilter;
  setCurriculumFilter: (value: CurriculumFilter) => void;
  collapsedStages: Record<string, boolean>;
  setCollapsedStages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onRefresh: () => void;
  isRefetching: boolean;
  formatTimestamp: (value?: number | null) => string;
  stripStagePrefix: (label: string, order: number) => string;
  teacherStarGuide: ReadonlyArray<{ stars: string; label: string }>;
  starString: (level: number) => string;
  selectedCourseLabel: string;
  onSelectTopic: (topic: any) => void;
  curriculumTopicModalOpen: boolean;
  selectedCurriculumTopic: any;
  onModalOpenChange: (open: boolean) => void;
  getLessonNeedsPracticeChips: (row: any) => string[];
};

export default function ParentLessonTracker(props: ParentLessonTrackerProps) {
  const {
    phonicsLoading,
    phonicsError,
    phonicsErrorMessage,
    displayCourseId,
    curriculumData,
    curriculumFilter,
    setCurriculumFilter,
    collapsedStages,
    setCollapsedStages,
    onRefresh,
    isRefetching,
    formatTimestamp,
    stripStagePrefix,
    teacherStarGuide,
    starString,
    selectedCourseLabel,
    onSelectTopic,
    curriculumTopicModalOpen,
    selectedCurriculumTopic,
    onModalOpenChange,
    getLessonNeedsPracticeChips,
  } = props;

  const lessonStageKeys = curriculumData?.groupedLessons.map((group: any) => group.key) ?? [];
  const expandAllStages = () => {
    const next: Record<string, boolean> = {};
    lessonStageKeys.forEach((key: string) => {
      next[key] = false;
    });
    setCollapsedStages(next);
  };
  const collapseAllStages = () => {
    const next: Record<string, boolean> = {};
    lessonStageKeys.forEach((key: string) => {
      next[key] = true;
    });
    setCollapsedStages(next);
  };

  return (
    <>
      <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Detailed Lesson Tracker</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Expanded curriculum details for parents who want a deeper view.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Refreshing" : "Refresh"}
          </Button>
        </div>

        {phonicsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            Loading detailed lesson tracker...
          </div>
        ) : phonicsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {phonicsErrorMessage}
          </div>
        ) : !displayCourseId ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            No enrolled curriculum found. Please contact admin.
          </div>
        ) : !curriculumData ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            Curriculum lessons are not available yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Completed</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {curriculumData.summaryCompletedCount}/{curriculumData.summaryTotalTopics}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">In Progress</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {curriculumData.summaryInProgressCount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Last Updated</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {curriculumData.summaryLastUpdatedAtMs
                    ? formatTimestamp(curriculumData.summaryLastUpdatedAtMs)
                    : "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { key: "all", label: `All (${curriculumData.summaryTotalTopics})` },
                { key: "in_progress", label: `In progress (${curriculumData.summaryInProgressCount})` },
                { key: "completed", label: `Completed (${curriculumData.summaryCompletedCount})` },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setCurriculumFilter(option.key as CurriculumFilter)}
                  className={`rounded-full border px-2.5 py-1 font-semibold ${
                    curriculumFilter === option.key
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={expandAllStages}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAllStages}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Collapse all
              </button>
            </div>

            {curriculumData.filteredRows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                No lessons match this filter yet.
              </div>
            ) : (
              <div className="space-y-4">
                {curriculumData.groupedLessons.map((group: any) => {
                  const isCollapsed = collapsedStages[group.key] ?? true;
                  return (
                    <div key={group.key} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {stripStagePrefix(group.label, group.order)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {group.summary ? (
                            <>
                              <span>
                                {group.summary.completedCount}/{group.summary.totalCount} lessons
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {Math.round(group.summary.progressPct ?? 0)}%
                              </span>
                            </>
                          ) : (
                            <span>{group.rows.length} lessons</span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedStages((prev) => ({
                                ...prev,
                                [group.key]: !(prev[group.key] ?? true),
                              }))
                            }
                            className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {isCollapsed ? "Expand" : "Collapse"}
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                            <div className="font-semibold">How to read star ratings</div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              {teacherStarGuide.map((item) => (
                                <span key={item.stars}>
                                  {item.stars} = {item.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {group.rows.map((row: any) => {
                              const ratingSummary = summarizeProgressRatings(
                                row.progressRatings ?? {},
                                Array.isArray(row.progressSkills) ? row.progressSkills : [],
                              );
                              const starLevel = ratingSummary.roundedAverageRating;
                              const starRating = starString(starLevel);
                              const ratingLabel = skillRatingLegendLabel(starLevel);
                              const masteryLower = String(row.mastery ?? "").toLowerCase().trim();
                              const accentDot =
                                masteryLower === "mastered"
                                  ? "bg-emerald-500"
                                  : masteryLower && masteryLower !== "not_started"
                                    ? "bg-sky-500"
                                    : "bg-slate-300";
                              return (
                                <button
                                  key={row.id}
                                  type="button"
                                  onClick={() =>
                                    onSelectTopic({
                                      ...row,
                                      courseLabel: selectedCourseLabel,
                                    })
                                  }
                                  className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2">
                                      <span className={`mt-1 h-2 w-2 rounded-full ${accentDot}`} />
                                      <div className="text-xs font-semibold leading-5 text-slate-900 dark:text-slate-100">
                                        {row.label}
                                      </div>
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <div className="rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold tracking-[0.08em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                                      {starRating}
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500">{ratingLabel}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <Dialog open={curriculumTopicModalOpen} onOpenChange={onModalOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lesson details</DialogTitle>
          </DialogHeader>
          {selectedCurriculumTopic ? (
            <div className="space-y-3 text-sm">
              {(() => {
                const lessonStrengths =
                  Array.isArray(selectedCurriculumTopic.strengthChips)
                    ? selectedCurriculumTopic.strengthChips
                    : [];
                const lessonNeedsPractice = getLessonNeedsPracticeChips(selectedCurriculumTopic);
                return (
                  <>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedCurriculumTopic.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedCurriculumTopic.courseLabel}
                    </div>
                    {selectedCurriculumTopic.stageLabel && (
                      <div className="text-xs text-slate-500">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {selectedCurriculumTopic.stageLabel}
                        </span>
                      </div>
                    )}
                    <ChildSkillRatingCard
                      title="Child Progress"
                      subtitle="Teacher ratings for this lesson."
                      skills={
                        Array.isArray(selectedCurriculumTopic.progressSkills)
                          ? selectedCurriculumTopic.progressSkills
                          : normalizeProgressSkillsMeta(selectedCurriculumTopic.progressRatingsMeta)
                      }
                      values={selectedCurriculumTopic.progressRatings ?? {}}
                      readOnly
                      className="p-3"
                    />
                    {lessonStrengths.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500">Strengths</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lessonStrengths.map((chip: string) => (
                            <span
                              key={chip}
                              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {lessonNeedsPractice.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500">Needs practice</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lessonNeedsPractice.map((chip: string) => (
                            <span
                              key={chip}
                              className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-slate-500">Teacher note</div>
                      <div className="text-sm text-slate-800 dark:text-slate-200">
                        {selectedCurriculumTopic.remark || "—"}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-300">No lesson selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
