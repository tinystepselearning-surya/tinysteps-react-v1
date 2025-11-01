/**
 * SummaryScreen Component
 * Final score display with confetti effect and encouraging messages
 */

import { useEffect, useState } from "react";
import { getEncouragingMessage, getStreakBadge, calculateAccuracy } from "./utils";

interface SummaryScreenProps {
  score: number;
  totalWords: number;
  streak: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
}

export default function SummaryScreen({
  score,
  totalWords,
  streak,
  onPlayAgain,
  onExit,
}: SummaryScreenProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const accuracy = calculateAccuracy(score, totalWords * 2); // 2 questions per word
  const encouragingMessage = getEncouragingMessage(accuracy);
  const streakBadge = getStreakBadge(streak);

  // Generate confetti on mount
  useEffect(() => {
    const confettiPieces: Confetti[] = [];
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];

    for (let i = 0; i < 50; i++) {
      confettiPieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setConfetti(confettiPieces);

    // Cleanup after 5 seconds
    const timeout = setTimeout(() => {
      setConfetti([]);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti Effect */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: "-10px",
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      {/* Summary Card */}
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative z-10">
        {/* Trophy Icon */}
        <div className="text-center mb-8">
          <div className="text-9xl mb-4 animate-bounce">🏆</div>
          <h1 className="text-5xl font-black text-purple-600 mb-2">
            Amazing Work!
          </h1>
          <p className="text-2xl text-gray-600 font-semibold">
            {encouragingMessage}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Score */}
          <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-6xl font-black text-green-600 mb-2">{score}</p>
            <p className="text-xl font-bold text-green-700">
              Correct Answers
            </p>
          </div>

          {/* Accuracy */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-6xl font-black text-blue-600 mb-2">
              {accuracy}%
            </p>
            <p className="text-xl font-bold text-blue-700">Accuracy</p>
          </div>

          {/* Words Completed */}
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-6xl font-black text-purple-600 mb-2">
              {totalWords}
            </p>
            <p className="text-xl font-bold text-purple-700">Words Learned</p>
          </div>
        </div>

        {/* Streak Badge */}
        {streakBadge && (
          <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center mb-8 shadow-lg">
            <p className="text-4xl font-black text-orange-600">
              {streakBadge}
            </p>
            <p className="text-lg text-orange-700 mt-2">
              {streak} consecutive correct answers!
            </p>
          </div>
        )}

        {/* Encouragement Section */}
        <div className="bg-gradient-to-r from-pink-100 to-yellow-100 rounded-2xl p-6 mb-8 shadow-lg">
          <p className="text-2xl text-center font-bold text-pink-600">
            💪 Keep practicing to become a SpellBee master!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold text-2xl rounded-full shadow-xl hover:from-green-500 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400"
            aria-label="Play again"
          >
            🎮 Play Again!
          </button>
          <button
            onClick={onExit}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold text-2xl rounded-full shadow-xl hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400"
            aria-label="Exit game"
          >
            🏠 Exit
          </button>
        </div>

        {/* Fun Facts */}
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">
            🌟 You answered {totalWords * 2} questions today!
          </p>
        </div>
      </div>

      {/* Custom CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(360deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}
