import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UpcomingRow = {
  session: any;
  status: string;
  start: Date;
};

type ParentAttendanceSummaryProps = {
  classesCounts: {
    total: number;
    completed: number;
    reschedule_requested: number;
  };
  upcomingPreviewRows: UpcomingRow[];
  joiningSessionId: string | null;
  onOpenClasses: () => void;
  onJoinSession: (session: any) => void;
  canJoinFromOverview: (row: UpcomingRow) => boolean;
  formatSessionTimeRange: (session: any) => string;
};

export default function ParentAttendanceSummary(props: ParentAttendanceSummaryProps) {
  const {
    classesCounts,
    upcomingPreviewRows,
    joiningSessionId,
    onOpenClasses,
    onJoinSession,
    canJoinFromOverview,
    formatSessionTimeRange,
  } = props;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Class & Attendance</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Recent class rhythm and what is coming next.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenClasses}>
          Open Classes
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">This Month</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{classesCounts.total} classes</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Completed</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{classesCounts.completed}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Rescheduled</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{classesCounts.reschedule_requested}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming Classes</div>
        {upcomingPreviewRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            No upcoming classes are scheduled yet.
          </div>
        ) : (
          upcomingPreviewRows.map((row) => {
            const session = row.session;
            const canJoin = canJoinFromOverview(row);
            return (
              <div
                key={`dashboard-upcoming-${session.id}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.start.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {formatSessionTimeRange(session)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {session.courseName || "Course"} {session.teacherName ? `· ${session.teacherName}` : ""}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onJoinSession(session)}
                    disabled={!canJoin || joiningSessionId === session.id}
                    className="h-8"
                  >
                    {joiningSessionId === session.id ? "Opening..." : "Join"}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
