/**
 * HUD - Heads-up display for coins, streak, level
 */

interface HUDProps {
  coins: number;
  streak: number;
  level: number;
  round: number;
  totalRounds: number;
}

export function HUD({ coins, streak, level, round, totalRounds }: HUDProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
        {/* Left: Level & Round */}
        <div className="flex items-center gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
            <p className="text-sm font-semibold text-purple-600">Level {level}</p>
            <p className="text-xs text-gray-600">
              Round {round}/{totalRounds}
            </p>
          </div>
        </div>

        {/* Center: Streak */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {streak >= 5 ? "🔥" : "⭐"}
            </span>
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

        {/* Right: Coins */}
        <div className="bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl px-6 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <p className="text-xl font-black text-white drop-shadow">
              {coins}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
