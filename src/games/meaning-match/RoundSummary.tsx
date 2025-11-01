/**
 * RoundSummary - End-of-round and final summary screen
 */

import type { Word } from "./data";

interface RoundSummaryProps {
  isGameComplete: boolean;
  currentRound: number;
  totalRounds: number;
  matchesThisRound: number;
  totalMatches: number;
  coinsEarned: number;
  totalCoins: number;
  trickyWords: Word[];
  onContinue: () => void;
  onPracticeTricky: () => void;
  onPlayAgain: () => void;
}

export function RoundSummary({
  isGameComplete,
  currentRound,
  totalRounds,
  matchesThisRound,
  totalMatches,
  coinsEarned,
  totalCoins,
  trickyWords,
  onContinue,
  onPracticeTricky,
  onPlayAgain,
}: RoundSummaryProps) {
  if (!isGameComplete) {
    // End of round (not final)
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-12 max-w-2xl text-center shadow-2xl transform animate-bounce">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-5xl font-black text-purple-600 mb-4">
            Round {currentRound} Complete!
          </h2>
          <div className="space-y-4 text-2xl text-gray-700 mb-8">
            <p>
              <span className="font-bold text-green-600">
                {matchesThisRound} matches
              </span>{" "}
              this round
            </p>
            <p>
              <span className="font-bold text-yellow-600">
                +{coinsEarned} coins
              </span>{" "}
              earned
            </p>
            <p className="text-xl text-gray-500">
              💰 Total coins: {totalCoins}
            </p>
          </div>
          <button
            onClick={onContinue}
            className="px-12 py-6 bg-gradient-to-r from-green-400 to-blue-400 text-white text-2xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400"
          >
            Next Round! 🚀
          </button>
        </div>
      </div>
    );
  }

  // Game complete
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-12 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-9xl mb-4">🏆</div>
            <h1 className="text-6xl font-black text-purple-600 mb-4">
              Amazing Work!
            </h1>
            <p className="text-3xl text-gray-700 mb-2">
              You completed all {totalRounds} rounds!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Total Matches</p>
              <p className="text-5xl font-black text-green-600">
                {totalMatches}
              </p>
            </div>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 text-center">
              <p className="text-xl text-gray-600 mb-2">Coins Earned</p>
              <p className="text-5xl font-black text-yellow-600">
                💰 {totalCoins}
              </p>
            </div>
          </div>

          {trickyWords.length > 0 && (
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-purple-700 mb-3">
                🎯 Want more practice?
              </h3>
              <p className="text-lg text-gray-700 mb-4">
                You have {trickyWords.length} tricky word
                {trickyWords.length === 1 ? "" : "s"} to review
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {trickyWords.map((w) => (
                  <span
                    key={w.word}
                    className="px-4 py-2 bg-white rounded-full text-purple-700 font-semibold shadow"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
              <button
                onClick={onPracticeTricky}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400"
              >
                Practice My Tricky Words 📚
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 px-8 py-6 bg-gradient-to-r from-green-400 to-blue-400 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400"
            >
              Play Again 🔄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
