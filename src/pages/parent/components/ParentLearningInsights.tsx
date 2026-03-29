import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentLearningInsightsProps = {
  latestTeacherLesson: any;
  selectedCourseLabel: string;
  formatTimestamp: (value?: number | null) => string;
  dashboardStrengthChips: string[];
  dashboardPracticeChips: string[];
  onOpenAllRatings: () => void;
};

export default function ParentLearningInsights(props: ParentLearningInsightsProps) {
  const {
    latestTeacherLesson,
    selectedCourseLabel,
    formatTimestamp,
    dashboardStrengthChips,
    dashboardPracticeChips,
    onOpenAllRatings,
  } = props;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Learning Insights</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Teacher-updated highlights in parent-friendly language.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenAllRatings}
          className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
          All Ratings
        </Button>
      </div>

      {latestTeacherLesson ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Latest Rated Lesson</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {latestTeacherLesson.label}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {latestTeacherLesson.stageLabel || selectedCourseLabel || "Current course"}
              {latestTeacherLesson.updatedAtMs ? ` · ${formatTimestamp(latestTeacherLesson.updatedAtMs)}` : ""}
            </div>
            {latestTeacherLesson.remark ? (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{latestTeacherLesson.remark}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Areas Improving
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {dashboardStrengthChips.length > 0 ? (
                  dashboardStrengthChips.map((chip: string) => (
                    <span
                      key={`dashboard-strength-${chip}`}
                      className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                    >
                      {chip}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Strength highlights will appear after more teacher updates.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Needs Practice
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {dashboardPracticeChips.length > 0 ? (
                  dashboardPracticeChips.map((chip: string) => (
                    <span
                      key={`dashboard-practice-${chip}`}
                      className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
                    >
                      {chip}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Practice priorities will appear after more teacher updates.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Teacher lesson insights will appear once ratings are published.
        </div>
      )}
    </Card>
  );
}
