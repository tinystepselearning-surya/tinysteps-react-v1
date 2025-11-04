/**
 * Boss Level HUD
 * Displays coins, streak, round progress, accuracy
 */

import { useEffect, useState } from "react";

interface HUDProps {
  coins: number;
  streak: number;
  roundNumber: number;
  totalRounds: number;
  accuracy: number;
}

export default function HUD({ coins, streak, roundNumber, totalRounds, accuracy }: HUDProps) {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (coins === displayCoins) return;
    
    setBouncing(true);
    const timer = setTimeout(() => setBouncing(false), 400);
    
    const increment = coins > displayCoins ? 1 : -1;
    const interval = setInterval(() => {
      setDisplayCoins((prev) => {
        if (prev === coins) {
          clearInterval(interval);
          return coins;
        }
        return prev + increment;
      });
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [coins, displayCoins]);

  const progress = (roundNumber / totalRounds) * 100;

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Coins */}
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl transition-transform ${
                bouncing ? "scale-125" : "scale-100"
              }`}
            >
              🪙
            </span>
            <span className="text-lg font-bold text-amber-600">{displayCoins}</span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{streak >= 3 ? "🔥" : "⭐"}</span>
            <span className="text-lg font-bold text-orange-600">
              {streak > 0 ? `${streak}x` : "—"}
            </span>
          </div>

          {/* Round */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">
              Round {roundNumber}/{totalRounds}
            </span>
          </div>

          {/* Accuracy */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">
              {accuracy.toFixed(0)}% Accurate
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={roundNumber}
            aria-valuemin={0}
            aria-valuemax={totalRounds}
            aria-label={`Progress: ${roundNumber} of ${totalRounds} rounds`}
          />
        </div>
      </div>
    </div>
  );
}
