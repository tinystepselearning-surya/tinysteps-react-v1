import { useEffect } from "react";
import { ArrowRight, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  currentIndiaMonthKey,
  requestClassAttendanceBootstrap,
} from "../../../lib/parentCanonicalProjectionBootstrap";
import {
  formatIndiaTimeRange,
  formatSessionDate,
  formatSessionTimeRange,
  isSessionTimeFallback,
} from "../../../lib/sessionTime";

type UpcomingRow = {
  session: any;
  status: string;
  start: Date;
};

type ParentAttendanceSummaryProps = {
  classesState: "loading" | "available" | "unavailable";
  classesCounts: {
    total: number;
    completed: number;
    reschedule_requested: number;
  } | null;
  scopeLabel: string;
  upcomingPreviewRows: UpcomingRow[];
  joiningSessionId: string | null;
  onOpenClasses: () => void;
  onJoinSession: (session: any) => void;
  canJoinFromOverview: (row: UpcomingRow) => boolean;
};

export default function ParentAttendanceSummary({
  classesState,
  classesCounts,
  scopeLabel,
  upcomingPreviewRows,
  joiningSessionId,
  onOpenClasses,
  onJoinSession,
  canJoinFromOverview,
}: ParentAttendanceSummaryProps) {
  useEffect(() => {
    if (classesState !== "unavailable" || typeof window === "undefined") return;
    const kidId = String(new URLSearchParams(window.location.search).get("kidId") || "").trim();
    if (!kidId) return;

    // Existing class sessions can predate the P4 projection writer. The request document
    // is deterministic per child/current month, so repeated renders cannot trigger scans.
    void requestClassAttendanceBootstrap(kidId, currentIndiaMonthKey()).catch(() => undefined);
  }, [classesState]);

  const summaryValue = (value: number | undefined) =>
    classesState === "available" && typeof value === "number" ? String(value) : "—";

  return (
    <Card className="overflow-hidden rounded-[20px] border-indigo-100 border-t-2 border-t-indigo-500 bg-white p-4 shadow-sm sm:p-5 dark:border-indigo-900/60 dark:border-t-indigo-400 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Next Class</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Schedule and class activity at a glance.</p>
        </div>
        <Button variant="outline" onClick={onOpenClasses} className="min-h-11 shrink-0 px-3">
          Open Classes
        </Button>
      </div>

      <div className="mt-4 space-y-2" data-testid="upcoming-class-list">
        {upcomingPreviewRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            No today or upcoming classes are scheduled yet.
          </div>
        ) : (
          upcomingPreviewRows.map((row, index) => {
            const session = row.session;
            const canJoin = canJoinFromOverview(row);
            return (
              <div
                key={`dashboard-upcoming-${session.id}`}
                className={index === 0
                  ? "rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"
                  : "border-t border-slate-200 px-1 pt-3 dark:border-slate-700"}
                data-class-priority={index === 0 ? "next" : "later"}
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        <CalendarClock className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {formatSessionDate(session)} · {formatSessionTimeRange(session)}
                      </p>
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
                      {session.courseName || "Course"}{session.teacherName ? ` · ${session.teacherName}` : ""}
                    </p>
                    <p className="mt-1 text-xs leading-4 text-slate-500">
                      India time: {formatIndiaTimeRange(session)}
                      {isSessionTimeFallback(session) ? " · based on legacy schedule fields" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={index === 0 ? "default" : "outline"}
                    onClick={() => onJoinSession(session)}
                    disabled={!canJoin || joiningSessionId === session.id}
                    aria-label={joiningSessionId === session.id ? "Opening class" : "Join Class"}
                    className="min-h-11 w-full shrink-0 sm:w-auto"
                  >
                    {joiningSessionId === session.id ? "Opening..." : "Join Class"}
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-500">{scopeLabel}</p>
        {classesState === "unavailable" && (
          <p className="mt-1 text-xs leading-4 text-slate-500">
            Class totals are unavailable for the selected child and month. Family totals are not substituted.
          </p>
        )}
        {classesState === "loading" && (
          <p className="mt-1 text-xs leading-4 text-slate-500">Loading selected-child class totals…</p>
        )}
        <dl className="mt-2 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
          <div className="px-2 first:pl-0">
            <dt className="text-xs text-slate-500">Classes</dt>
            <dd className="mt-0.5 text-base font-semibold text-slate-950 dark:text-slate-100">{summaryValue(classesCounts?.total)}</dd>
          </div>
          <div className="px-3">
            <dt className="text-xs text-slate-500">Completed</dt>
            <dd className="mt-0.5 text-base font-semibold text-slate-950 dark:text-slate-100">{summaryValue(classesCounts?.completed)}</dd>
          </div>
          <div className="px-3">
            <dt className="text-xs text-slate-500">Reschedule requests</dt>
            <dd className="mt-0.5 text-base font-semibold text-slate-950 dark:text-slate-100">{summaryValue(classesCounts?.reschedule_requested)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
