/**
 * EndSummary - Results screen with parent view
 */

import { useState } from "react";
import type { GameStats } from "./utils";
import { getSessionReport } from "./utils";

interface EndSummaryProps {
  coinsEarned: number;
  totalCoins: number;
  accuracy: number;
  bestStreak: number;
  avgTimePerCorrect: number;
  stats: GameStats;
  hasTrickyWords: boolean;
  onPlayAgain: () => void;
  onPracticeTricky: () => void;
}

export function EndSummary({
  coinsEarned,
  totalCoins,
  accuracy,
  bestStreak,
  avgTimePerCorrect,
  stats,
  hasTrickyWords,
  onPlayAgain,
  onPracticeTricky,
}: EndSummaryProps) {
  const [showParentView, setShowParentView] = useState(false);
  const sessionReport = getSessionReport();

  const handleCopySummary = () => {
    if (!sessionReport) return;

    const text = `Quick Meaning Quiz - Session Report
Date: ${sessionReport.date}
Accuracy: ${Math.round(sessionReport.accuracy)}%
Coins Earned: ${sessionReport.coinsEarned}
Best Streak: ${sessionReport.bestStreak}
Avg Time: ${sessionReport.avgTimePerCorrect.toFixed(1)}s
Tricky Words: ${sessionReport.trickyWords.join(", ") || "None"}

Keep practicing to improve!`;

    navigator.clipboard
      .writeText(text)
      .then(() => alert("Summary copied to clipboard!"))
      .catch(() => alert("Failed to copy summary"));
  };

  if (showParentView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl">
            <h1 className="text-4xl font-black text-purple-600 mb-6">
              📊 Parent View
            </h1>

            {sessionReport && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Today's Session
                  </h2>
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-2">
                    <p className="text-lg">
                      <strong>Date:</strong> {sessionReport.date}
                    </p>
                    <p className="text-lg">
                      <strong>Accuracy:</strong>{" "}
                      {Math.round(sessionReport.accuracy)}%
                    </p>
                    <p className="text-lg">
                      <strong>Coins earned:</strong> {sessionReport.coinsEarned}
                    </p>
                    <p className="text-lg">
                      <strong>Best streak:</strong> {sessionReport.bestStreak}
                    </p>
                    <p className="text-lg">
                      <strong>Avg time per correct:</strong>{" "}
                      {sessionReport.avgTimePerCorrect.toFixed(1)}s
                    </p>
                  </div>
                </div>

                {sessionReport.trickyWords.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                      Tricky Words
                    </h2>
                    <div className="bg-yellow-50 rounded-2xl p-6">
                      <p className="mb-3">Words that need more practice:</p>
                      <div className="flex flex-wrap gap-2">
                        {sessionReport.trickyWords.map((word) => (
                          <span
                            key={word}
                            className="px-4 py-2 bg-yellow-200 rounded-full font-semibold"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Quick Home Tips
                  </h2>
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Read together daily (10-15 minutes)</li>
                      <li>Discuss word meanings during everyday activities</li>
                      <li>Use new words in sentences at home</li>
                      <li>Play "meaning games" during car rides</li>
                      <li>Celebrate progress with small rewards</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleCopySummary}
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-green-400"
                >
                  📋 Copy Summary
                </button>
              </div>
            )}

            <button
              onClick={() => setShowParentView(false)}
              className="mt-8 w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-purple-400"
            >
              Back to Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-12 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-9xl mb-4 animate-bounce">⏱️</div>
            <h1 className="text-6xl font-black text-purple-600 mb-4">
              Great Work!
            </h1>
            <p className="text-2xl text-gray-700">
              You completed {stats.totalRounds} rounds!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Coins</p>
              <p className="text-5xl font-black text-yellow-600">
                +{coinsEarned}
              </p>
              <p className="text-sm text-gray-500 mt-2">Total: 💰 {totalCoins}</p>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Accuracy</p>
              <p className="text-5xl font-black text-green-600">
                {Math.round(accuracy)}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {accuracy >= 80 ? "Excellent!" : "Good!"}
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Best Streak</p>
              <p className="text-5xl font-black text-orange-600">{bestStreak}</p>
              <p className="text-sm text-gray-500 mt-2">
                {bestStreak >= 5 ? "Amazing! 🔥" : "Keep going!"}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Avg Time</p>
              <p className="text-5xl font-black text-blue-600">
                {avgTimePerCorrect.toFixed(1)}s
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {avgTimePerCorrect < 8 ? "Speedy!" : ""}
              </p>
            </div>
          </div>

          {/* Practice Tricky Words */}
          {hasTrickyWords && (
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-purple-700 mb-3 text-center">
                🎯 Want more practice?
              </h3>
              <p className="text-center text-gray-700 mb-4">
                Practice your tricky words in a quick 5-round session!
              </p>
              <button
                onClick={onPracticeTricky}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400"
              >
                Practice Tricky Words 🎯
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
              onClick={() => setShowParentView(true)}
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
