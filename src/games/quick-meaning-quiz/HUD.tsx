/**
 * HUD - Top bar with coins, streak, round, and timer
 */

import { useEffect, useState } from "react";

interface HUDProps {
  coins: number;
  streak: number;
  round: number;
  totalRounds: number;
  timeLeft: number;
  maxTime: number;
}

export function HUD({
  coins,
  streak,
  round,
  totalRounds,
  timeLeft,
  maxTime,
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

  const timePercentage = Math.max(0, (timeLeft / maxTime) * 100);
  const timerColor =
    timePercentage > 50
      ? "bg-green-500"
      : timePercentage > 25
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      {/* Main HUD bar */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          {/* Left: Round */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
            <p className="text-sm font-semibold text-purple-600">
              Round {round}/{totalRounds}
            </p>
          </div>

          {/* Center: Streak */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{streak >= 3 ? "🔥" : "⭐"}</span>
              <div>
                <p className="text-sm font-semibold text-orange-600">
                  Streak: {streak}
                </p>
                {streak >= 5 && (
                  <p className="text-xs text-orange-500 animate-pulse">
                    Amazing!
                  </p>
                )}
              </div>
            </div>
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

      {/* Timer bar */}
      <div className="bg-gray-200 h-2">
        <div
          className={`${timerColor} h-full transition-all duration-300`}
          style={{ width: `${timePercentage}%` }}
          role="progressbar"
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={maxTime}
          aria-label={`Time remaining: ${Math.ceil(timeLeft)} seconds`}
        />
      </div>
    </div>
  );
}
