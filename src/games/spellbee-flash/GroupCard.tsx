/**
 * GroupCard Component
 * Displays a letter group with progress stats and quick actions
 */

export interface GroupCardProps {
  groupId: string; // 'A'..'Z' or 'All' or '#'
  stats: {
    total: number;
    completed: number;
    percent: number;
    confidence: 'Low' | 'Medium' | 'High';
  };
  onStart: (groupId: string) => void;
  onView: (groupId: string) => void;
  onReset: (groupId: string) => void;
}

export default function GroupCard({
  groupId,
  stats,
  onStart,
  onView,
  onReset,
}: GroupCardProps) {
  // Confidence pill styles
  const confidenceStyles = {
    Low: 'bg-rose-50 text-rose-700 ring-rose-200',
    Medium: 'bg-amber-50 text-amber-800 ring-amber-200',
    High: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };

  return (
    <div className="rounded-2xl bg-white shadow ring-1 ring-slate-200 p-3 sm:p-4 flex flex-col gap-2">
      {/* Title Row: Letter Badge + Numbers */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-lg sm:text-xl">
          {groupId}
        </div>
        <div className="text-right">
          <div className="text-sm sm:text-base text-slate-600 font-semibold">
            {stats.completed}/{stats.total}
          </div>
          <div className="text-xs text-slate-500">{stats.percent}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div
          className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={stats.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Group ${groupId} progress: ${stats.percent}% complete`}
        >
          <div
            className="h-2.5 rounded-full bg-purple-500 transition-[width] duration-500"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
        <span className="sr-only">
          {stats.completed} of {stats.total} words completed ({stats.percent}%)
        </span>
      </div>

      {/* Confidence Pill */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${
            confidenceStyles[stats.confidence]
          }`}
        >
          {stats.confidence}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-1">
        {/* Start Group - Primary */}
        <button
          onClick={() => onStart(groupId)}
          className="flex-1 rounded-xl bg-purple-600 text-white hover:bg-purple-700 px-3 py-1.5 text-sm font-semibold shadow ring-1 ring-purple-600 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition"
          aria-label={`Start practicing group ${groupId}`}
        >
          Start
        </button>

        {/* View Words */}
        <button
          onClick={() => onView(groupId)}
          className="rounded-xl bg-white hover:bg-slate-50 px-3 py-1.5 text-sm font-semibold shadow ring-1 ring-slate-200 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition text-slate-700"
          aria-label={`View words in group ${groupId}`}
          title="View Words"
        >
          View
        </button>

        {/* Reset Group */}
        <button
          onClick={() => onReset(groupId)}
          className="rounded-xl bg-white hover:bg-slate-50 px-3 py-1.5 text-sm font-semibold shadow ring-1 ring-slate-200 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition text-slate-700"
          aria-label={`Reset progress for group ${groupId}`}
          title="Reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
