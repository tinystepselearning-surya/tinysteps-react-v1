/**
 * HUD - Enhanced heads-up display with coins, streak, level, accuracy, progress
 */

import { useEffect, useState } from "react";

interface HUDProps {
  coins: number;
  streak: number;
  level: number;
  round: number;
  totalRounds: number;
  accuracy: number;
  roundProgress: number; // 0-1
}

export function HUD({
  coins,
  streak,
  level,
  round,
  totalRounds,
  accuracy,
  roundProgress,
}: HUDProps) {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [coinBounce, setCoinBounce] = useState(false);

  // Animated coin counter
  useEffect(() => {
    if (coins === displayCoins) return;

    setCoinBounce(true);
    const timeout = setTimeout(() => setCoinBounce(false), 400);

    const increment = coins > displayCoins ? 1 : -1;
    const interval = setInterval(() => {
      setDisplayCoins((prev) => {
        const next = prev + increment;
        if ((increment > 0 && next >= coins) || (increment < 0 && next <= coins)) {
          clearInterval(interval);
          return coins;
        }
        return next;
      });
    }, 30);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [coins, displayCoins]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {/* Main HUD bar */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          {/* Left: Level & Round */}
          {level > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg" title={`Level ${level}: ${level === 1 ? '3 balloons' : level === 2 ? '4 balloons' : '5 balloons'} - ${level === 1 ? '20 px/s' : level === 2 ? '25 px/s' : '30 px/s'} speed`}>
              <p className="text-sm font-semibold text-purple-600">
                Level {level} {level === 1 ? '🎈' : level === 2 ? '🎈🎈' : '🎈🎈🎈'}
              </p>
              <p className="text-xs text-gray-600">
                Round {round}/{totalRounds}
              </p>
            </div>
          )}

          {/* Center: Streak */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{streak >= 5 ? "🔥" : "⭐"}</span>
              <div>
                <p className="text-sm font-semibold text-orange-600">
                  Streak: {streak}
                </p>
                {streak >= 5 && (
                  <p className="text-xs text-orange-500 animate-pulse">
                    On fire!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
            <p className="text-sm font-semibold text-green-600">
              {Math.round(accuracy)}%
            </p>
            <p className="text-xs text-gray-600">Accuracy</p>
          </div>

          {/* Right: Coins */}
          <div
            className={`
              bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl px-6 py-2 shadow-lg
              transition-transform duration-300
              ${coinBounce ? "scale-125" : "scale-100"}
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <p className="text-xl font-black text-white drop-shadow">
                {displayCoins}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 h-1.5">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-300"
          style={{ width: `${roundProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
