import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RecommendedNext = {
  gameId: string;
  reason: string;
  estMinutes: number | null;
};

type ParentRecommendationsProps = {
  dashboardRecommendedNext: RecommendedNext | null;
  dashboardStrengthChips: string[];
  dashboardPracticeChips: string[];
  labelFromGameId: (gameId?: string | null) => string;
  onStartPractice: (gameId?: string) => void;
  onOpenGamesProgress: () => void;
};

export default function ParentRecommendations(props: ParentRecommendationsProps) {
  const {
    dashboardRecommendedNext,
    dashboardStrengthChips,
    dashboardPracticeChips,
    labelFromGameId,
    onStartPractice,
    onOpenGamesProgress,
  } = props;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recommendations & Next Steps</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Practical guidance to help at home this week.
          </p>
        </div>
        <Clock3 className="h-5 w-5 text-slate-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Practice Today</div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {dashboardRecommendedNext?.gameId
              ? labelFromGameId(dashboardRecommendedNext.gameId)
              : "Open the games portal for guided practice"}
          </div>
          {dashboardRecommendedNext?.reason ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dashboardRecommendedNext.reason}</p>
          ) : null}
          {dashboardRecommendedNext?.estMinutes ? (
            <p className="mt-1 text-xs text-slate-500">Estimated time: {dashboardRecommendedNext.estMinutes} minutes</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onStartPractice(dashboardRecommendedNext?.gameId)}
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Start Practice
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onOpenGamesProgress}>
              Open Games Progress
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Feel Good About
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {dashboardStrengthChips.length > 0 ? (
                dashboardStrengthChips.map((chip: string) => (
                  <span
                    key={`recommendation-strength-${chip}`}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  New strengths will appear as classes progress.
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Practice Next
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {dashboardPracticeChips.length > 0 ? (
                dashboardPracticeChips.map((chip: string) => (
                  <span
                    key={`recommendation-practice-${chip}`}
                    className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  Practice areas will update after teacher ratings.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
