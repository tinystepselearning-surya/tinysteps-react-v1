/**
 * SummaryScreen Component
 * Final score display with confetti effect and encouraging messages
 */

import { useEffect, useState } from "react";
import { 
  getEncouragingMessage, 
  getStreakBadge, 
  calculateAccuracy,
  buildParentReport,
  saveParentReport,
  copyToClipboard,
  formatParentReportText,
  loadStickers,
  saveStickers,
  type ParentReport,
  type StickersState
} from "./utils";
import StickersSheet from "./StickersSheet";

interface SummaryScreenProps {
  score: number;
  totalWords: number;
  streak: number;
  mistakeCount?: number;
  fixUpReport?: { correct: number; wrong: number } | null;
  sessionWords?: string[];
  coinsEarned?: number;
  totalCoins: number;
  onPlayAgain: () => void;
  onExit: () => void;
  onStartFixUp?: () => void;
  onCoinsUpdate: (newCoins: number) => void;
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
  mistakeCount = 0,
  fixUpReport,
  sessionWords = [],
  coinsEarned = 0,
  totalCoins,
  onPlayAgain,
  onExit,
  onStartFixUp,
  onCoinsUpdate,
}: SummaryScreenProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showParentView, setShowParentView] = useState(false);
  const [parentReport, setParentReport] = useState<ParentReport | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [stickersState, setStickersState] = useState<StickersState>(() => loadStickers());
  
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

        {/* Parent View Toggle */}
        <div className="mb-6 text-center">
          <button
            onClick={() => {
              if (!showParentView) {
                const report = buildParentReport(
                  accuracy,
                  totalWords * 2,
                  streak,
                  coinsEarned,
                  sessionWords
                );
                setParentReport(report);
                saveParentReport(report);
              }
              setShowParentView(!showParentView);
            }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-bold text-lg rounded-full shadow-lg hover:from-indigo-500 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-400"
            aria-label={showParentView ? "Hide parent view" : "Show parent view"}
          >
            {showParentView ? "📊 Hide Parent View" : "📊 Parent View"}
          </button>
        </div>

        {/* Parent View Panel */}
        {showParentView && parentReport && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 shadow-xl border-2 border-indigo-200">
            <h3 className="text-2xl font-black text-indigo-700 mb-4 text-center">
              📊 Progress Report for Parents
            </h3>

            <div className="space-y-4">
              {/* Session Stats */}
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{parentReport.accuracy}%</p>
                    <p className="text-sm text-gray-600">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{parentReport.attempted}</p>
                    <p className="text-sm text-gray-600">Questions</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-600">🔥 {parentReport.bestStreak}</p>
                    <p className="text-sm text-gray-600">Best Streak</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-yellow-600">🪙 {parentReport.coinsEarned}</p>
                    <p className="text-sm text-gray-600">Coins Earned</p>
                  </div>
                </div>
              </div>

              {/* Mastered Words */}
              {parentReport.masteredToday.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow">
                  <h4 className="text-lg font-bold text-green-700 mb-2">🌟 Words Mastered Today</h4>
                  <div className="flex flex-wrap gap-2">
                    {parentReport.masteredToday.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tricky Phonemes */}
              {parentReport.topTrickyPhonemes.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow">
                  <h4 className="text-lg font-bold text-orange-700 mb-2">💡 Sounds to Practice</h4>
                  <div className="space-y-2">
                    {parentReport.topTrickyPhonemes.map((phoneme, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          {phoneme.label} ({phoneme.ipa})
                        </span>
                        <span className="text-sm text-orange-600">
                          {phoneme.wrong}/{phoneme.seen} mistakes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Tip */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 shadow">
                <h4 className="text-lg font-bold text-purple-700 mb-2">📚 Practice Tip</h4>
                <p className="text-sm text-purple-900">{parentReport.tip}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Share (if supported) */}
                {navigator.share && (
                  <button
                    onClick={async () => {
                      const text = formatParentReportText(parentReport);
                      try {
                        await navigator.share({
                          title: "SpellBee Session Report",
                          text: text,
                        });
                      } catch (err) {
                        // User cancelled or error - fallback to copy
                        const success = await copyToClipboard(text);
                        if (success) {
                          setCopyToast(true);
                          setTimeout(() => setCopyToast(false), 2000);
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    aria-label="Share report"
                  >
                    📤 Share
                  </button>
                )}
                
                {/* Copy to Clipboard */}
                <button
                  onClick={async () => {
                    const text = formatParentReportText(parentReport);
                    const success = await copyToClipboard(text);
                    if (success) {
                      setCopyToast(true);
                      setTimeout(() => setCopyToast(false), 2000);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  aria-label="Copy report to clipboard"
                >
                  📋 Copy
                </button>
                
                {/* Download as .txt */}
                <button
                  onClick={() => {
                    const text = formatParentReportText(parentReport);
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `spellbee-report-${new Date().toISOString().split("T")[0]}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 2000);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  aria-label="Download report as text file"
                >
                  💾 Download
                </button>
              </div>
            </div>

            {/* Copy Toast */}
            {copyToast && (
              <div
                className="mt-4 p-3 bg-green-500 text-white rounded-lg text-center font-bold animate-bounce"
                role="alert"
                aria-live="polite"
              >
                ✅ Success!
              </div>
            )}
          </div>
        )}

        {/* Fix-Up Report (if completed) */}
        {fixUpReport && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 mb-6 shadow-lg border-2 border-green-300">
            <h3 className="text-2xl font-black text-green-700 mb-3 text-center">
              🩹 Fix-Up Results
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">
                {fixUpReport.correct}/{fixUpReport.correct + fixUpReport.wrong} ✅
              </p>
              {fixUpReport.correct >= 4 && (
                <p className="text-xl font-bold text-yellow-600 animate-bounce">
                  🩹 Fix-Up Hero Badge Earned!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Fix-Up Mode Button (only if has mistakes and not already done) */}
          {mistakeCount > 0 && !fixUpReport && onStartFixUp && (
            <button
              onClick={onStartFixUp}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold text-2xl rounded-full shadow-xl hover:from-yellow-500 hover:to-orange-500 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-400"
              aria-label="Practice mistakes"
            >
              🩹 Practice My Mistakes
            </button>
          )}
          
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

        {/* Stickers Button */}
        <div className="text-center">
          <button
            onClick={() => setShowStickers(true)}
            className="px-8 py-4 bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-bold text-2xl rounded-full shadow-xl hover:from-pink-500 hover:to-yellow-500 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-pink-400"
            aria-label="Open sticker collection"
          >
            🎉 My Stickers ({stickersState.owned.length}/12)
          </button>
        </div>

        {/* Fun Facts */}
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">
            🌟 You answered {totalWords * 2} questions today!
          </p>
        </div>
      </div>

      {/* Stickers Sheet Modal */}
      {showStickers && (
        <StickersSheet
          stickersState={stickersState}
          totalCoins={totalCoins}
          onClose={() => setShowStickers(false)}
          onCoinsUpdate={onCoinsUpdate}
          onStickersUpdate={(newState) => {
            setStickersState(newState);
            saveStickers(newState);
          }}
        />
      )}

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
