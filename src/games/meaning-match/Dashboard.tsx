/**
 * Meaning-Match Dashboard
 * Shows progress across all words with group-based bar charts
 */

import { useState, useEffect, useMemo } from 'react';
import { WORDS } from './data';
import { computeProgressStats, getAllAchievements } from './utils';

export default function Dashboard() {
  // Force fresh computation on every render with polling
  const [stats, setStats] = useState(() => computeProgressStats(WORDS));
  const [achievements, setAchievements] = useState(() => getAllAchievements());
  
  // Refresh data when component mounts or when localStorage changes
  useEffect(() => {
    // Immediately refresh on mount
    const refreshData = () => {
      setStats(computeProgressStats(WORDS));
      setAchievements(getAllAchievements());
    };
    
    refreshData();
    
    // Listen for storage changes (from other tabs or same tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('meaning-match-mastery') || e.key?.includes('meaning-match-achievements')) {
        refreshData();
      }
    };
    
    // Also refresh when window gains focus (user navigates back)
    const handleFocus = () => {
      refreshData();
    };
    
    // Set up an interval to refresh every 2 seconds while dashboard is visible
    const intervalId = setInterval(refreshData, 2000);
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const groupOrder = useMemo(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const order: string[] = [];

    for (const letter of alphabet) {
      if (stats.groups[letter]) {
        order.push(letter);
      }
    }

    if (stats.groups['#']) {
      order.push('#');
    }

    return order;
  }, [stats.groups]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold shadow ring-1 ring-slate-200 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition text-slate-700 min-h-[56px]"
          aria-label="Go back to game"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Game</span>
        </button>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2">
            🧩 Meaning-Match Progress
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Track your matching mastery across all words
          </p>
        </div>

        {/* Overall Stats */}
        <div className="mb-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 border border-purple-200">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Overall Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-4xl font-extrabold text-purple-600">
                {stats.overall.mastered}
              </div>
              <div className="text-sm text-purple-700">Words Mastered</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-blue-600">
                {stats.overall.total}
              </div>
              <div className="text-sm text-blue-700">Total Words</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-green-600">
                {stats.overall.percent}%
              </div>
              <div className="text-sm text-green-700">Complete</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">🏆 Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition ${
                  achievement.earned
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-slate-800">{achievement.name}</div>
                <div className="text-sm text-slate-600">{achievement.description}</div>
                {achievement.earned && (
                  <div className="text-xs text-green-600 mt-2 font-semibold">
                    ✓ Earned!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group Progress Bar Charts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Progress by Letter Group
          </h2>
          <div className="space-y-3">
            {groupOrder.map((group) => {
              const groupData = stats.groups[group];
              return (
                <div key={group} className="flex items-center gap-4">
                  <div className="w-12 text-center font-bold text-slate-700 text-lg">
                    {group}
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-200 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 flex items-center justify-end px-3"
                        style={{ width: `${groupData.percent}%` }}
                      >
                        {groupData.percent > 10 && (
                          <span className="text-white text-sm font-bold">
                            {groupData.percent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm text-slate-600">
                    {groupData.mastered} / {groupData.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
