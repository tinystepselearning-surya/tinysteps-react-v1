import * as React from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import type { GameMeta } from "../../types/games";

type Props = {
  meta: GameMeta;
  progressPct?: number; // 0-100
  parentMode?: boolean;
};

export const GameCard = React.memo(function GameCard({ 
  meta, 
  progressPct = 0, 
  parentMode = false 
}: Props) {
  const badge = meta.featured 
    ? "Featured" 
    : meta.status === "beta" 
    ? "Beta" 
    : meta.status === "coming_soon" 
    ? "Coming soon" 
    : null;

  return (
    <article className="rounded-2xl border border-gray-200/60 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white">
      <div className="relative">
        <img
          src={meta.thumbnailUrl}
          alt={`${meta.title} thumbnail`}
          loading="lazy"
          width={640}
          height={360}
          className="w-full aspect-[16/9] object-cover bg-gradient-to-br from-orange-100 to-sky-100"
          onError={(e) => {
            // Fallback gradient if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute left-3 top-3 flex gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-900 shadow-sm border border-gray-200">
            Phase {meta.phase}
          </span>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-400 to-sky-400 text-xs font-bold text-white shadow-sm">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">
          {meta.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {meta.area.toUpperCase()} • Ages {meta.ageMin}–{meta.ageMax} • {meta.durationMin} min • {meta.difficulty}
        </p>
        <div className="mt-3">
          <ProgressBar value={progressPct} label={`${meta.title} progress`} />
        </div>
      </div>

      <div className="p-4 pt-0 flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {meta.badges.map((b) => (
            <span 
              key={b} 
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200"
            >
              {b}
            </span>
          ))}
        </div>
        {meta.status === "coming_soon" ? (
          <button 
            className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl cursor-not-allowed" 
            disabled 
            aria-disabled="true"
          >
            Coming Soon
          </button>
        ) : parentMode ? (
          <Link 
            to={`/kids/game/${meta.slug}`} 
            aria-label={`View learning goals for ${meta.title}`}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            View learning goals
          </Link>
        ) : (
          <Link 
            to={`/kids/game/${meta.slug}`} 
            aria-label={`Play ${meta.title}`}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-400 to-sky-400 rounded-xl hover:from-orange-500 hover:to-sky-500 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Play
          </Link>
        )}
      </div>
    </article>
  );
});
