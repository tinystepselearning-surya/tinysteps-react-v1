import * as React from "react";
import type { WeeklyReport } from "../../lib/insights/weeklyReports";

type Props = {
  report: WeeklyReport;
  title?: string;
  variant?: "parent" | "teacher";
  showDeltas?: boolean;
  prevReport?: WeeklyReport | null;
  displayRounding?: "nearest5" | "none";
  showSampleBadge?: boolean;
  footerNote?: string;
  onEditClick?: () => void;
};

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function roundToNearest5(n: number) {
  return Math.round(n / 5) * 5;
}

function formatDelta(delta: number) {
  const d = Math.round(delta);
  if (!Number.isFinite(d) || d === 0) return "0";
  return d > 0 ? `+${d}` : `${d}`;
}

function DeltaText({ delta }: { delta: number }) {
  const d = Math.round(delta);
  const txt = formatDelta(d);
  const cls =
    d > 0
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : d < 0
        ? "text-rose-700 bg-rose-50 border-rose-200"
        : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {txt}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = clampPct(value);
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" style={{ width: `${v}%` }} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
      {children}
    </span>
  );
}

function SectionBox({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const clean = (items || []).map((s) => s?.trim()).filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>
      {clean.length === 0 ? (
        <div className="text-sm text-slate-500">-</div>
      ) : (
        <ul className="space-y-2">
          {clean.map((t, i) => (
            <li key={`${title}-${i}`} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeeklyProgressCard({
  report,
  title = "Weekly Progress Card",
  variant = "parent",
  showDeltas = false,
  prevReport = null,
  displayRounding = "nearest5",
  showSampleBadge = false,
  footerNote,
  onEditClick,
}: Props) {
  const disp = (n: number) => {
    const base = clampPct(n);
    return displayRounding === "nearest5" ? clampPct(roundToNearest5(base)) : base;
  };

  const weekLabel =
    report.weekKey?.trim() === "Till Date" ? "Till Date" : `Week: ${report.weekKey}`;

  const sessionsLabel = `Sessions: ${report.sessionsAttended}/${report.sessionsPlanned} attended`;

  const overall = disp(report.scores?.overall ?? 0);
  const consistency = disp(report.scores?.consistency ?? 0);
  const understanding = disp(report.scores?.understanding ?? 0);
  const confidence = disp(report.scores?.confidence ?? 0);

  const prev = prevReport;
  const canShowDelta = Boolean(showDeltas && prev);

  const dOverall = canShowDelta ? overall - disp(prev!.scores?.overall ?? 0) : 0;
  const dConsistency = canShowDelta ? consistency - disp(prev!.scores?.consistency ?? 0) : 0;
  const dUnderstanding = canShowDelta ? understanding - disp(prev!.scores?.understanding ?? 0) : 0;
  const dConfidence = canShowDelta ? confidence - disp(prev!.scores?.confidence ?? 0) : 0;

  // Helper texts (kept static to match the planned card)
  const helper = {
    consistency: "Attended + practiced on most days",
    understanding: "Correct answers + concept clarity",
    confidence: "Less hesitation, more independence",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/40 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">
            {variant === "teacher" ? "TEACHER INSIGHTS" : "PARENT INSIGHTS"}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {showSampleBadge ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Sample Preview
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            A simple, parent-friendly snapshot - what improved, what needs practice, and what's next.
          </div>
        </div>

        {onEditClick ? (
          <button
            type="button"
            onClick={onEditClick}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Edit
          </button>
        ) : null}
      </div>

      {/* Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{weekLabel}</Chip>
        <Chip>{sessionsLabel}</Chip>
        <Chip>
          Overall: {overall}%
          {canShowDelta ? <DeltaText delta={dOverall} /> : null}
        </Chip>
      </div>

      {/* Overall progress */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Overall progress</div>
          <div className="text-sm font-semibold text-slate-900">{overall}%</div>
        </div>
        <div className="mt-3">
          <ProgressBar value={overall} />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {variant === "teacher"
            ? "Preview of what parents will see once you publish."
            : "This weekly card is generated from teacher updates and attendance."}
        </div>
      </div>

      {/* 3 metrics */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Consistency</div>
            <div className="text-sm font-semibold text-slate-900">
              {consistency}%
              {canShowDelta ? <DeltaText delta={dConsistency} /> : null}
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar value={consistency} />
          </div>
          <div className="mt-2 text-xs text-slate-500">{helper.consistency}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Understanding</div>
            <div className="text-sm font-semibold text-slate-900">
              {understanding}%
              {canShowDelta ? <DeltaText delta={dUnderstanding} /> : null}
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar value={understanding} />
          </div>
          <div className="mt-2 text-xs text-slate-500">{helper.understanding}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Confidence</div>
            <div className="text-sm font-semibold text-slate-900">
              {confidence}%
              {canShowDelta ? <DeltaText delta={dConfidence} /> : null}
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar value={confidence} />
          </div>
          <div className="mt-2 text-xs text-slate-500">{helper.confidence}</div>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <SectionBox title="What we covered" items={report.covered || []} />
        <SectionBox title="Wins this week" items={report.wins || []} />
        <SectionBox title="Focus areas" items={report.focusAreas || []} />
        <SectionBox title="Next week plan" items={report.nextWeekPlan || []} />
      </div>

      {/* Home practice strip */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Home practice (5 mins/day)</div>
          <div className="text-xs font-semibold text-slate-500">Simple / doable / consistent</div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {report.homePractice?.quickRevision?.trim() || "2 minutes: quick revision"}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {report.homePractice?.focusedSkill?.trim() || "2 minutes: one focused skill"}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {report.homePractice?.confidenceBooster?.trim() || "1 minute: confidence booster"}
          </div>
        </div>

        {footerNote ? (
          <div className="mt-3 text-xs text-slate-500">{footerNote}</div>
        ) : null}
      </div>
    </div>
  );
}
