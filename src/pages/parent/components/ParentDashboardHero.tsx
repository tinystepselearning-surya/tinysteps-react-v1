import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

type ParentDashboardHeroProps = {
  childName: string;
  heroMessage: string;
  heroGradientClass: string;
  programIcon: string;
  programLabel: string;
  activeStageLabel: string;
  classesCompleted: number;
  classesUpcoming: number;
  alertText: string;
  onViewInsights: () => void;
  onViewClasses: () => void;
  joinClassUrl?: string;
  joinClassDisabledReason?: string;
};

export default function ParentDashboardHero(props: ParentDashboardHeroProps) {
  const {
    childName,
    heroMessage,
    heroGradientClass,
    programIcon,
    programLabel,
    activeStageLabel,
    classesCompleted,
    classesUpcoming,
    alertText,
    onViewInsights,
    onViewClasses,
    joinClassUrl,
    joinClassDisabledReason = "Class link will appear once assigned.",
  } = props;

  return (
    <Card
      className={`overflow-hidden border-slate-200 bg-gradient-to-br from-white via-slate-50 ${heroGradientClass} p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Parent Dashboard
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {childName} at a glance
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {heroMessage}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              type="button"
              onClick={onViewInsights}
              variant="outline"
              className="flex-1 border-slate-300 bg-white sm:flex-none dark:border-slate-700 dark:bg-slate-900"
            >
              View Insights
            </Button>
            <Button
              type="button"
              onClick={onViewClasses}
              className="flex-1 bg-slate-900 text-white hover:bg-slate-800 sm:flex-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              View Classes
            </Button>
            {joinClassUrl ? (
              <Button
                asChild
                className="flex-1 border border-fuchsia-200/80 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-400 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_16px_rgba(168,85,247,0.38),0_0_28px_rgba(59,130,246,0.28)] transition-all duration-200 hover:scale-[1.02] hover:from-indigo-500 hover:via-fuchsia-500 hover:to-cyan-300 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.24),0_0_22px_rgba(168,85,247,0.5),0_0_34px_rgba(59,130,246,0.38)] focus-visible:ring-fuchsia-300 sm:flex-none"
              >
                <a
                  href={joinClassUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join Class in a new tab"
                >
                  Join Class
                  <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                aria-label={joinClassDisabledReason}
                title={joinClassDisabledReason}
                className="flex-1 border border-fuchsia-200/50 bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-200 text-white opacity-60 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_14px_rgba(168,85,247,0.22)] sm:flex-none"
              >
                Join Class
                <ExternalLink className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {!joinClassUrl && (
          <div className="-mt-1 text-xs text-slate-500 dark:text-slate-400">
            {joinClassDisabledReason}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Current Program</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              <span className="mr-1.5" aria-hidden="true">{programIcon}</span>
              {programLabel}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Current Stage</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{activeStageLabel}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Class Rhythm</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {classesCompleted} done · {classesUpcoming} upcoming
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Needs Attention</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {alertText}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
