/**
 * Boss Level End Summary
 * Final scorecard, badges, report, share functionality
 */

import { useEffect, useState } from "react";
import type { RoundData } from "./BossLevel";
import {
  calculateBadges,
  getBossStats,
  saveBossStats,
  saveSessionReport,
  getTopTrickyPhonemes,
  addSticker,
  getStickers,
} from "./utils";

interface EndSummaryProps {
  accuracy: number;
  bestStreak: number;
  sessionCoins: number;
  hintsUsed: number;
  earAccuracy: number;
  speedBonuses: number;
  rounds: RoundData[];
}

export default function EndSummary({
  accuracy,
  bestStreak,
  sessionCoins,
  hintsUsed,
  earAccuracy,
  speedBonuses,
}: EndSummaryProps) {
  const [badges, setBadges] = useState<string[]>([]);
  const [showParentView, setShowParentView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFirstClear, setIsFirstClear] = useState(false);

  useEffect(() => {
    const calculatedBadges = calculateBadges(accuracy, bestStreak, hintsUsed, earAccuracy, speedBonuses);
    setBadges(calculatedBadges);

    // Update boss stats
    const stats = getBossStats();
    const newStats = {
      bestAccuracy: Math.max(stats.bestAccuracy, accuracy),
      bestStreak: Math.max(stats.bestStreak, bestStreak),
      clears: stats.clears + 1,
      lastPlayed: Date.now(),
    };
    saveBossStats(newStats);

    // Check if first clear
    if (stats.clears === 0) {
      setIsFirstClear(true);
      const stickers = getStickers();
      if (!stickers.includes("🐝 Gold Bee")) {
        addSticker("🐝 Gold Bee");
      }
    }

    // Save session report
    const trickyPhonemes = getTopTrickyPhonemes(3);
    saveSessionReport({
      accuracy,
      bestStreak,
      coinsEarned: sessionCoins,
      badges: calculatedBadges,
      trickyPhonemes,
      timestamp: Date.now(),
    });
  }, [accuracy, bestStreak, sessionCoins, hintsUsed, earAccuracy, speedBonuses]);

  const handleCopy = () => {
    const summary = `
Boss Level: Phonics Gauntlet - Session Report
=============================================
Accuracy: ${accuracy.toFixed(1)}%
Best Streak: ${bestStreak}
Coins Earned: ${sessionCoins}
Badges: ${badges.join(", ")}

Top Tricky Phonemes:
${getTopTrickyPhonemes(3)
  .map((p, i) => `${i + 1}. ${p.phoneme} (${p.errors} errors)`)
  .join("\n")}

Great work! Keep practicing those tricky sounds! 🎉
    `.trim();

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Boss Level Complete!",
        text: `I completed the Phonics Gauntlet with ${accuracy.toFixed(1)}% accuracy and earned ${sessionCoins} coins! 🎉`,
      });
    }
  };

  const trickyPhonemes = getTopTrickyPhonemes(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 space-y-6">
        {!showParentView ? (
          <>
            {/* Main Summary */}
            <div className="text-center space-y-4">
              <div className="text-7xl animate-bounce">🏆</div>
              <h1 className="text-4xl font-bold text-slate-800">Gauntlet Complete!</h1>
              
              {isFirstClear && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
                  <p className="text-xl font-bold text-amber-700">🐝 Gold Bee Unlocked!</p>
                  <p className="text-sm text-amber-600">First clear achievement!</p>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{sessionCoins}</div>
                <div className="text-sm text-slate-600">Coins Earned</div>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{accuracy.toFixed(0)}%</div>
                <div className="text-sm text-slate-600">Accuracy</div>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{bestStreak}</div>
                <div className="text-sm text-slate-600">Best Streak</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{badges.length}</div>
                <div className="text-sm text-slate-600">Badges Earned</div>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                <h3 className="font-bold text-slate-700 mb-3">🏅 Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, idx) => (
                    <div
                      key={idx}
                      className="bg-white px-3 py-2 rounded-full text-sm font-semibold text-slate-700 shadow-sm"
                    >
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tricky Phonemes */}
            {trickyPhonemes.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4">
                <h3 className="font-bold text-slate-700 mb-3">🎯 Practice These</h3>
                <ul className="space-y-2">
                  {trickyPhonemes.map((p, idx) => (
                    <li key={idx} className="text-sm text-slate-600">
                      <span className="font-mono font-bold">{p.phoneme}</span> - {p.errors} errors
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full min-h-[64px] bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
              >
                Play Again 🔄
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="min-h-[56px] bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold shadow-md transition-colors"
                >
                  {copied ? "✓ Copied!" : "Copy Summary 📋"}
                </button>
                
                {"share" in navigator && (
                  <button
                    onClick={handleShare}
                    className="min-h-[56px] bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold shadow-md transition-colors"
                  >
                    Share 🔗
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowParentView(true)}
                className="w-full min-h-[56px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-semibold transition-colors"
              >
                Parent Report 👨‍👩‍👧
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Parent View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">📊 Parent Report</h2>
                <button
                  onClick={() => setShowParentView(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-sm"
                >
                  ← Back
                </button>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-slate-700">Session Summary</h3>
                <p className="text-sm text-slate-600">
                  <strong>Completed:</strong> {new Date().toLocaleDateString()} at{" "}
                  {new Date().toLocaleTimeString()}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Accuracy:</strong> {accuracy.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Best Streak:</strong> {bestStreak}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Hints Used:</strong> {hintsUsed}
                </p>
              </div>

              <div className="bg-green-50 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-slate-700">Strengths</h3>
                {earAccuracy >= 0.8 && (
                  <p className="text-sm text-slate-600">✓ Excellent ear-training (phoneme recognition)</p>
                )}
                {speedBonuses >= 6 && (
                  <p className="text-sm text-slate-600">✓ Fast and accurate on speed rounds</p>
                )}
                {hintsUsed === 0 && (
                  <p className="text-sm text-slate-600">✓ Completed without hints (independent work)</p>
                )}
                {accuracy >= 80 && (
                  <p className="text-sm text-slate-600">✓ Strong overall accuracy</p>
                )}
              </div>

              {trickyPhonemes.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 space-y-2">
                  <h3 className="font-bold text-slate-700">Focus Areas</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Practice these sounds for 1-2 minutes daily:
                  </p>
                  <ul className="space-y-1">
                    {trickyPhonemes.map((p, idx) => (
                      <li key={idx} className="text-sm text-slate-600">
                        • <span className="font-mono font-bold">{p.phoneme}</span> (missed {p.errors}x)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-purple-50 rounded-2xl p-4">
                <h3 className="font-bold text-slate-700 mb-2">Next Steps</h3>
                <p className="text-sm text-slate-600">
                  Encourage daily practice with individual games (SpellBee Flash, Meaning-Match) to
                  reinforce phoneme recognition and vocabulary. Boss Level can be repeated weekly to
                  track progress!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
