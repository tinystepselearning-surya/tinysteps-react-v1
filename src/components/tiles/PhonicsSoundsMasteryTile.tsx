import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { readProgress } from "../../lib/psmProgress";

const TOTAL_LEVELS = 36;

export default function PhonicsSoundsMasteryTile() {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const progress = readProgress();
    const done = Object.values(progress).filter((p) => p.completed).length;
    setCompleted(done);
  }, []);

  const progressPercent = Math.round((completed / TOTAL_LEVELS) * 100);

  return (
    <article className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm hover:border-[#2563eb]/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb]/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-[#2563eb]"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Phonics Sounds Mastery</h3>
            <p className="mt-1 text-sm text-slate-600">
              Foundations → Advanced (Phases 1–6)
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#f472b6]/10 px-3 py-1 text-xs font-semibold text-[#be185d]">
          Path
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-semibold text-[#2563eb]">
            {completed}/{TOTAL_LEVELS}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <Link
        to="/games/phonics-sounds-mastery"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]"
      >
        Open
      </Link>
    </article>
  );
}
