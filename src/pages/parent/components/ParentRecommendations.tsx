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
  labelFromGameId: (gameId?: string | null) => string;
  onStartPractice: (gameId?: string) => void;
  onOpenGamesProgress: () => void;
};

export default function ParentRecommendations({
  dashboardRecommendedNext,
  labelFromGameId,
  onStartPractice,
  onOpenGamesProgress,
}: ParentRecommendationsProps) {
  const hasSpecificRecommendation = Boolean(dashboardRecommendedNext?.gameId);

  return (
    <Card className="rounded-[20px] border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Recommended Practice</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">One focused next step for practice at home.</p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
          {hasSpecificRecommendation
            ? labelFromGameId(dashboardRecommendedNext?.gameId)
            : "Explore the games portal"}
        </p>
        {dashboardRecommendedNext?.reason ? (
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{dashboardRecommendedNext.reason}</p>
        ) : (
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
            Choose an available activity when you are ready to practise.
          </p>
        )}
        {dashboardRecommendedNext?.estMinutes ? (
          <p className="mt-1 text-xs text-slate-500">About {dashboardRecommendedNext.estMinutes} minutes</p>
        ) : null}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => onStartPractice(dashboardRecommendedNext?.gameId)}
            className="min-h-11 bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            {hasSpecificRecommendation ? "Start Practice" : "Open Games Portal"}
          </Button>
          <Button type="button" variant="outline" onClick={onOpenGamesProgress} className="min-h-11">
            Games Progress
          </Button>
        </div>
      </div>
    </Card>
  );
}
