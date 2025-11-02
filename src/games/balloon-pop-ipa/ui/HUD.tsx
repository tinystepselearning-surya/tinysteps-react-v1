/**
 * HUD - Enhanced heads-up display with coins, streak, level, accuracy, progress
 */

import { useEffect, useState } from "react";

interface HUDProps {
  score: number;
  streak: number;
  level: number;
  round: number;
  totalRounds: number;
  accuracy: number;
  roundProgress: number; // 0-1
}

export function HUD({
  score,
  streak,
  level,
  round,
  totalRounds,
  accuracy,
  roundProgress,
}: HUDProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [scoreBounce, setScoreBounce] = useState(false);

  // Animated score counter
  useEffect(() => {
    if (score === displayScore) return;

    setScoreBounce(true);
    const timeout = setTimeout(() => setScoreBounce(false), 400);

    const increment = score > displayScore ? 1 : -1;
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        const next = prev + increment;
        if ((increment > 0 && next >= score) || (increment < 0 && next <= score)) {
          clearInterval(interval);
          return score;
        }
        return next;
      });
    }, 30);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [score, displayScore]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {/* Main HUD bar */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          {/* Left: Level & Round */}
          {level > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg" title={`Level ${level}`}>
              <p className="text-sm font-semibold text-purple-600">
                Level {level}
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

          {/* Right: Score */}
          <div
            className={`
              bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl px-6 py-2 shadow-lg
              transition-transform duration-300
              ${scoreBounce ? "scale-125" : "scale-100"}
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <p className="text-xl font-black text-white drop-shadow">
                {displayScore}
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

export default HUD;
