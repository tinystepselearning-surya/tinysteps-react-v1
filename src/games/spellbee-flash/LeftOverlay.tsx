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
  quests
}: Omit<LeftOverlayProps, 'hiddenOnMobile'>) {
  // Always hide on small/medium screens for layout overflow fix (only show on large+ screens)
  const hiddenClass = "hidden lg:flex";

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
          {/* Coins Chip - improved contrast */}
          <div 
            className="rounded-full bg-yellow-500 text-gray-900 px-3 py-1.5 text-sm font-bold shadow ring-1 ring-slate-300 flex items-center gap-1.5"
            aria-label={`Coins: ${coins}`}
          >
            <span className="text-base" aria-hidden="true">🪙</span>
            <span>{coins}</span>
          </div>

          {/* Score Chip - improved contrast */}
          <div 
            className="rounded-full bg-purple-600 text-white px-3 py-1.5 text-sm font-bold shadow ring-1 ring-purple-700 flex items-center gap-1.5"
            aria-label={`Score: ${score}`}
          >
            <span>Score: {score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
