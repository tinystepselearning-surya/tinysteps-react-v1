/**
 * Balloon Pop - Progress Dashboard
 * Real-time mastery tracking and achievement display
 */

import { useState, useEffect } from "react";
import { WORDS } from "./data";
import {
  computeProgressStats,
  getAllAchievements,
  type ProgressStats,
  type Achievement,
} from "./utils";

export default function BalloonPopDashboard() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const refreshData = () => {
    setStats(computeProgressStats(WORDS));
    setAchievements(getAllAchievements());
  };

  useEffect(() => {
    // Initial load
    refreshData();

    // Polling refresh every 2s
    const intervalId = setInterval(refreshData, 2000);

    // Storage event listener (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("balloon-pop")) {
        refreshData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Focus event (navigating back from game)
    const handleFocus = () => refreshData();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-purple-100 flex items-center justify-center">
        <p className="text-2xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-purple-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🎈 Balloon Pop Progress
          </h1>
          <p className="text-xl text-gray-600">
            Track your phonics mastery journey!
          </p>
        </div>

        {/* Overall Stats Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Overall Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
              <p className="text-5xl font-bold text-blue-600 mb-2">
                {stats.masteredWords}
              </p>
              <p className="text-gray-700 font-semibold">Words Mastered</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
              <p className="text-5xl font-bold text-purple-600 mb-2">
                {stats.totalWords}
              </p>
              <p className="text-gray-700 font-semibold">Total Words</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
              <p className="text-5xl font-bold text-green-600 mb-2">
                {stats.masteryPercent}%
              </p>
              <p className="text-gray-700 font-semibold">Mastery Rate</p>
            </div>
          </div>
        </div>

        {/* Achievements Gallery */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            🏆 Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`
                  rounded-2xl p-6 transition-all
                  ${
                    ach.earned
                      ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400 shadow-lg"
                      : "bg-gray-100 border-2 border-gray-300 opacity-50"
                  }
                `}
              >
                <div className="text-5xl mb-3 text-center">{ach.icon}</div>
                <h3 className="font-bold text-lg text-gray-800 mb-1 text-center">
                  {ach.name}
                </h3>
                <p className="text-sm text-gray-600 text-center mb-2">
                  {ach.description}
                </p>
                {ach.earned && ach.earnedAt && (
                  <p className="text-xs text-green-600 font-semibold text-center">
                    ✓ Earned {new Date(ach.earnedAt).toLocaleDateString()}
                  </p>
                )}
                {!ach.earned && (
                  <p className="text-xs text-gray-500 text-center">
                    Target: {ach.target} words
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group Progress Bars */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            📊 Progress by Phoneme Group
          </h2>
          <div className="space-y-6">
            {stats.groupProgress.map((group) => (
              <div key={group.group}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl text-gray-800">
                    {group.group}
                  </h3>
                  <span className="text-lg font-semibold text-gray-600">
                    {group.mastered} / {group.total} ({group.percent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                    style={{ width: `${group.percent}%` }}
                  >
                    {group.percent > 10 && (
                      <span className="text-white font-bold text-sm">
                        {group.percent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg transition-all"
          >
            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  );
}
