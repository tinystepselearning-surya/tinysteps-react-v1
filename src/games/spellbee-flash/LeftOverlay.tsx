/**
 * LeftOverlay Component
 * Compact left-side overlay that doesn't affect main content layout.
 * Shows Quests + Coins/Score chips on desktop, hidden on mobile.
 */

import QuestsPanel from "./QuestsPanel";
import type { Quest } from "./utils";

export interface LeftOverlayProps {
  coins: number;
  score: number;
  quests: Quest[];
  hiddenOnMobile?: boolean; // default true
}

export default function LeftOverlay({ 
  coins, 
  score, 
  quests,
  hiddenOnMobile = true 
}: LeftOverlayProps) {
  const hiddenClass = hiddenOnMobile ? "hidden md:flex" : "flex";

  return (
    <div 
      className={`pointer-events-none absolute left-2 top-20 md:left-4 md:top-24 z-30 ${hiddenClass} flex-col gap-3`}
      aria-label="Game stats overlay"
    >
      {/* Quests Panel - wrapped with pointer-events-auto */}
      <div className="pointer-events-auto">
        <QuestsPanel quests={quests} />
      </div>

      {/* Coins + Score Chips Row */}
      <div className="pointer-events-auto flex flex-col gap-2 w-[180px]">
        <div className="flex items-center gap-2">
          {/* Coins Chip */}
          <div 
            className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold shadow ring-1 ring-slate-200 flex items-center gap-1.5"
            aria-label={`Coins: ${coins}`}
          >
            <span aria-hidden="true">🪙</span>
            <span className="text-yellow-700">{coins}</span>
          </div>

          {/* Score Chip */}
          <div 
            className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold shadow ring-1 ring-slate-200 flex items-center gap-1.5"
            aria-label={`Score: ${score}`}
          >
            <span className="text-purple-600">Score: {score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
