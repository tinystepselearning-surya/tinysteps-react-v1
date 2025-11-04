/**
 * EndSummary - Final summary screen with badges and practice option
 */

import type { GameStats } from "./utils";

interface EndSummaryProps {
  coinsEarned: number;
  totalCoins: number;
  bestStreak: number;
  accuracy: number;
  newBadges: string[];
  stats: GameStats;
  hasTrickyPhonemes: boolean;
  onPlayAgain: () => void;
  onPracticeTricky: () => void;
  onParentView: () => void;
}

const BADGE_INFO: Record<string, { icon: string; name: string; desc: string }> = {
  "sharpshooter": {
    icon: "🎯",
    name: "Sharpshooter",
    desc: "10 first-try hits in a row!",
  },
  "quick-popper": {
    icon: "🕒",
    name: "Quick Popper",
    desc: "Hit within 3s, 5 times",
  },
  "wind-tamer": {
    icon: "🌪️",
    name: "Wind Tamer",
    desc: "Cleared Level 3 with ≥80% accuracy",
  },
  "tune-up": {
    icon: "🔧",
    name: "Tune-Up",
    desc: "Practiced tricky sounds with ≥5/6 score",
  },
};

export function EndSummary({
  coinsEarned,
  totalCoins,
  bestStreak,
  accuracy,
  newBadges,
  stats,
  hasTrickyPhonemes,
  onPlayAgain,
  onPracticeTricky,
  onParentView,
}: EndSummaryProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-12 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-9xl mb-4 animate-bounce">🎈</div>
            <h1 className="text-6xl font-black text-purple-600 mb-4">
              Great Popping!
            </h1>
            <p className="text-2xl text-gray-700">
              You popped {stats.correctPops} balloons!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Coins Earned</p>
              <p className="text-5xl font-black text-yellow-600">
                +{coinsEarned}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Total: 💰 {totalCoins}
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Best Streak</p>
              <p className="text-5xl font-black text-orange-600">
                {bestStreak}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {bestStreak >= 10 ? "Amazing! 🔥" : "Keep going!"}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6 text-center col-span-2 md:col-span-1">
              <p className="text-xl text-gray-600 mb-2">Accuracy</p>
              <p className="text-5xl font-black text-green-600">
                {Math.round(accuracy)}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {accuracy >= 80 ? "Excellent!" : "Good try!"}
              </p>
            </div>
          </div>

          {/* New Badges */}
          {newBadges.length > 0 && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-purple-700 mb-4 text-center">
                🏆 New Badges Earned!
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {newBadges.map((badgeId) => {
                  const badge = BADGE_INFO[badgeId];
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="bg-white rounded-2xl p-4 shadow-lg text-center min-w-[140px] transform hover:scale-105 transition-transform"
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <p className="font-bold text-purple-700">{badge.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Badges Collection */}
          {stats.badges.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-700 mb-3 text-center">
                📜 Your Badge Collection
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {stats.badges.map((badgeId) => {
                  const badge = BADGE_INFO[badgeId];
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {badge.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practice Tricky Sounds */}
          {hasTrickyPhonemes && (
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-purple-700 mb-3 text-center">
                🎯 Want more practice?
              </h3>
              <p className="text-center text-gray-700 mb-4">
                Practice your tricky sounds in a quick 6-round session!
              </p>
              <button
                onClick={onPracticeTricky}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400"
              >
                Practice Tricky Sounds 🎯
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 px-8 py-6 bg-gradient-to-r from-green-400 to-blue-400 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400"
            >
              Play Again 🔄
            </button>

            <button
              onClick={onParentView}
              className="px-8 py-6 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-400"
            >
              Parent View 📊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
