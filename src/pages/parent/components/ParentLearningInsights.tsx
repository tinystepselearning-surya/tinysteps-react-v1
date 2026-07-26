import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentLearningInsightsProps = {
  isLoading?: boolean;
  latestTeacherLesson: any;
  selectedCourseLabel: string;
  formatTimestamp: (value?: number | null) => string;
  dashboardStrengthChips: string[];
  dashboardPracticeChips: string[];
  onOpenAllRatings: () => void;
};

export default function ParentLearningInsights({
  isLoading = false,
  latestTeacherLesson,
  selectedCourseLabel,
  formatTimestamp,
  dashboardStrengthChips,
  dashboardPracticeChips,
  onOpenAllRatings,
}: ParentLearningInsightsProps) {
  return (
    <Card className="rounded-[20px] border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Learning Insights</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The latest teacher-provided learning update.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAllRatings}
          className="min-h-11 shrink-0 px-3"
        >
          All Ratings
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3" aria-label="Loading learning insights">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : latestTeacherLesson ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">Latest rated lesson</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
            {latestTeacherLesson.label}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {latestTeacherLesson.stageLabel || selectedCourseLabel || "Current course"}
            {latestTeacherLesson.updatedAtMs ? ` · ${formatTimestamp(latestTeacherLesson.updatedAtMs)}` : ""}
          </p>
          {latestTeacherLesson.remark ? (
            <blockquote className="mt-3 border-l-2 border-slate-300 pl-3 text-sm leading-5 text-slate-700 dark:border-slate-600 dark:text-slate-300">
              {latestTeacherLesson.remark}
            </blockquote>
          ) : null}

          <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 dark:border-slate-700">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Strengths</p>
              {dashboardStrengthChips.length > 0 ? (
                <p className="mt-1 text-sm leading-5 text-slate-700 dark:text-slate-300">
                  {dashboardStrengthChips.join(" · ")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">More teacher updates will add strength highlights.</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Needs practice</p>
              {dashboardPracticeChips.length > 0 ? (
                <p className="mt-1 text-sm leading-5 text-slate-700 dark:text-slate-300">
                  {dashboardPracticeChips.join(" · ")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">More teacher updates will add practice priorities.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Teacher lesson insights will appear once ratings are published.
        </div>
      )}
    </Card>
  );
}
