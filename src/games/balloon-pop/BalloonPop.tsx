/**
 * BalloonPop - Main game component with requestAnimationFrame loop
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { WORDS, type Word } from "./data";
import {
  pickWords,
  generateIPADistractors,
  getCoins,
  addCoins,
  getStats,
  saveStats,
  recordWrongPhoneme,
  getTrickyPhonemes,
  awardBadge,
  speakWord,
  randomInt,
  randomFloat,
} from "./utils";
import { Balloon, BALLOON_COLORS } from "./Balloon";
import { HUD } from "./HUD";
import { EndSummary } from "./EndSummary";

const ROUNDS_PER_LEVEL = 10;
const TOTAL_LEVELS = 3;

interface BalloonState {
  id: string;
  ipa: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  colorIndex: number;
  swayOffset: number; // for horizontal sway
  isPopped: boolean;
}

type GameMode = "playing" | "practice" | "summary" | "parent-view";

export default function BalloonPop() {
  const [gameMode, setGameMode] = useState<GameMode>("playing");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [targetWord, setTargetWord] = useState<Word | null>(null);
  const [balloons, setBalloons] = useState<BalloonState[]>([]);
  const [recentWordIds, setRecentWordIds] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [riseSpeed, setRiseSpeed] = useState(0.015); // % per frame
  const [missCount, setMissCount] = useState(0);
  const [quickHits, setQuickHits] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [coinsEarnedThisSession, setCoinsEarnedThisSession] = useState(0);

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Load coins on mount
  useEffect(() => {
    setCoins(getCoins());
  }, []);

  // Get level config
  const levelConfig = useMemo(() => {
    switch (currentLevel) {
      case 1:
        return { balloonCount: 3, baseSpeed: 0.015, hasSway: false };
      case 2:
        return { balloonCount: 4, baseSpeed: 0.022, hasSway: false };
      case 3:
        return { balloonCount: 5, baseSpeed: 0.03, hasSway: true };
      default:
        return { balloonCount: 3, baseSpeed: 0.015, hasSway: false };
    }
  }, [currentLevel]);

  // Initialize round
  const initializeRound = (practiceMode = false) => {
    let word: Word;
    
    if (practiceMode) {
      const trickyPhonemes = getTrickyPhonemes();
      const trickyWords = WORDS.filter((w) =>
        trickyPhonemes.some((p) => w.ipa.includes(p.replace(/\//g, "")))
      );
      const candidates = trickyWords.length > 0 ? trickyWords : WORDS;
      word = candidates[randomInt(0, candidates.length - 1)];
    } else {
      const words = pickWords(WORDS, 1, recentWordIds);
      word = words[0];
      setRecentWordIds((prev) => new Set([...prev, word.word]));
    }

    setTargetWord(word);
    setRoundStartTime(Date.now());

    // Generate IPA choices
    const allIPAs = WORDS.map((w) => w.ipa);
    const balloonCount = practiceMode ? 3 : levelConfig.balloonCount;
    const distractors = generateIPADistractors(
      word.ipa,
      allIPAs,
      balloonCount - 1
    );
    const choices = [word.ipa, ...distractors];

    // Shuffle and create balloon states
    const shuffled = [...choices].sort(() => Math.random() - 0.5);
    const newBalloons: BalloonState[] = shuffled.map((ipa, i) => ({
      id: `balloon-${i}`,
      ipa,
      x: randomFloat(15, 85),
      y: 110, // Start below viewport
      colorIndex: i % BALLOON_COLORS.length,
      swayOffset: randomFloat(0, Math.PI * 2),
      isPopped: false,
    }));

    setBalloons(newBalloons);
    setTotalAttempts(0);
  };

  // Start new game/round
  useEffect(() => {
    if (gameMode === "playing" || gameMode === "practice") {
      initializeRound(gameMode === "practice");
    }
  }, [currentRound, currentLevel, gameMode]);

  // Game loop with requestAnimationFrame
  useEffect(() => {
    if (gameMode !== "playing" && gameMode !== "practice") return;
    if (!targetWord) return;

    let animationId: number;

    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update balloon positions
      setBalloons((prevBalloons) => {
        const updated = prevBalloons.map((balloon) => {
          if (balloon.isPopped) return balloon;

          // Move up
          let newY = balloon.y - riseSpeed * (deltaTime / 16); // normalized to 60fps

          // Add sway for level 3
          let newX = balloon.x;
          if (levelConfig.hasSway) {
            const swayAmount = Math.sin(timestamp / 500 + balloon.swayOffset) * 3;
            newX = Math.max(10, Math.min(90, balloon.x + swayAmount * 0.1));
          }

          return { ...balloon, y: newY, x: newX };
        });

        // Check if any balloon reached top (game over for this round)
        const reachedTop = updated.some((b) => !b.isPopped && b.y <= -10);
        if (reachedTop) {
          cancelAnimationFrame(animationId);
          handleRoundEnd(false);
          return updated;
        }

        return updated;
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    rafIdRef.current = animationId;

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameMode, targetWord, riseSpeed, levelConfig.hasSway]);

  // Handle balloon pop
  const handlePop = (id: string, ipa: string) => {
    if (!targetWord) return;

    const isCorrect = ipa === targetWord.ipa;
    const currentAttempts = totalAttempts + 1;
    setTotalAttempts(currentAttempts);

    // Mark balloon as popped
    setBalloons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isPopped: true } : b))
    );

    if (isCorrect) {
      const elapsedTime = (Date.now() - roundStartTime) / 1000;

      // Award coins
      let coinReward = 0;
      if (currentAttempts === 1) {
        coinReward = 5;
      } else if (currentAttempts === 2) {
        coinReward = 2;
      }

      if (coinReward > 0) {
        const newTotal = addCoins(coinReward);
        setCoins(newTotal);
        setCoinsEarnedThisSession((prev) => prev + coinReward);
      }

      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));

      // Quick hit tracking (within 3s)
      if (elapsedTime <= 3) {
        setQuickHits((prev) => prev + 1);
      }

      // Update stats
      setCorrectCount((prev) => prev + 1);

      setLiveMessage("Correct pop! 🎈");
      setTimeout(() => setLiveMessage(""), 2000);

      // Check for badges
      if (newStreak === 10) {
        const awarded = awardBadge("sharpshooter");
        if (awarded) setNewBadges((prev) => [...prev, "sharpshooter"]);
      }

      // Proceed to next round after delay
      setTimeout(() => handleRoundEnd(true), 800);
    } else {
      // Wrong pop
      recordWrongPhoneme(ipa);
      setStreak(0);
      setMissCount((prev) => prev + 1);

      setLiveMessage("Try again! 🎯");
      setTimeout(() => setLiveMessage(""), 2000);

      // Don't end round, allow retry
    }
  };

  // Handle round end
  const handleRoundEnd = (success: boolean) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Adaptive difficulty
    if (!success) {
      setMissCount((prev) => prev + 1);
      if (missCount >= 1) {
        // Slow down after 2 misses in a row
        setRiseSpeed((prev) => prev * 0.85);
      }
    } else {
      // Speed up on streak
      if (streak >= 5) {
        setRiseSpeed((prev) => prev * 1.1);
      }
    }

    // Move to next round or level
    if (gameMode === "practice") {
      if (currentRound >= 6) {
        finalizePractice();
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    } else {
      const totalRounds = ROUNDS_PER_LEVEL * currentLevel;
      if (currentRound >= totalRounds) {
        // Level complete
        if (currentLevel === 3) {
          // Check Wind Tamer badge
          const accuracy = (correctCount / Math.max(1, correctCount + (totalRounds - correctCount))) * 100;
          if (accuracy >= 80) {
            const awarded = awardBadge("wind-tamer");
            if (awarded) setNewBadges((prev) => [...prev, "wind-tamer"]);
          }
        }

        if (currentLevel < TOTAL_LEVELS) {
          // Award level bonus
          const bonusCoins = addCoins(10);
          setCoins(bonusCoins);
          setCoinsEarnedThisSession((prev) => prev + 10);
          
          setTimeout(() => {
            setCurrentLevel((prev) => prev + 1);
            setCurrentRound(1);
            setRiseSpeed(0.015); // Reset speed
          }, 1500);
        } else {
          // Game complete
          finalizeGame();
        }
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    }
  };

  // Finalize game
  const finalizeGame = () => {
    // Check Quick Popper badge
    if (quickHits >= 5) {
      const awarded = awardBadge("quick-popper");
      if (awarded) setNewBadges((prev) => [...prev, "quick-popper"]);
    }

    // Save stats
    const stats = getStats();
    stats.bestStreak = Math.max(stats.bestStreak, bestStreak);
    stats.totalRounds += currentRound;
    stats.correctPops += correctCount;
    stats.level3Clears += currentLevel === 3 ? 1 : 0;
    saveStats(stats);

    setGameMode("summary");
  };

  // Finalize practice
  const finalizePractice = () => {
    const practiceAccuracy = correctCount / 6;
    if (practiceAccuracy >= 5 / 6) {
      const awarded = awardBadge("tune-up");
      if (awarded) setNewBadges((prev) => [...prev, "tune-up"]);
    }

    setGameMode("summary");
  };

  // Handle speak word
  const handleSpeakWord = () => {
    if (targetWord) {
      speakWord(targetWord.word);
    }
  };

  // Play again
  const handlePlayAgain = () => {
    setCurrentLevel(1);
    setCurrentRound(1);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setMissCount(0);
    setQuickHits(0);
    setNewBadges([]);
    setCoinsEarnedThisSession(0);
    setRecentWordIds(new Set());
    setRiseSpeed(0.015);
    setGameMode("playing");
  };

  // Practice tricky
  const handlePracticeTricky = () => {
    setCurrentRound(1);
    setStreak(0);
    setCorrectCount(0);
    setGameMode("practice");
  };

  // Parent view
  const handleParentView = () => {
    setGameMode("parent-view");
  };

  // Return to summary from parent view
  const handleBackToSummary = () => {
    setGameMode("summary");
  };

  const stats = getStats();
  const accuracy = correctCount > 0 ? (correctCount / (correctCount + (currentRound - correctCount))) * 100 : 0;
  const trickyPhonemes = getTrickyPhonemes();

  // Parent View
  if (gameMode === "parent-view") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl">
            <h1 className="text-4xl font-black text-purple-600 mb-6">
              📊 Parent View
            </h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Session Summary</h2>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-2">
                  <p className="text-lg"><strong>Coins earned:</strong> {coinsEarnedThisSession}</p>
                  <p className="text-lg"><strong>Best streak:</strong> {bestStreak}</p>
                  <p className="text-lg"><strong>Accuracy:</strong> {Math.round(accuracy)}%</p>
                  <p className="text-lg"><strong>Correct pops:</strong> {correctCount}</p>
                </div>
              </div>

              {trickyPhonemes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">Tricky Phonemes</h2>
                  <div className="bg-yellow-50 rounded-2xl p-6">
                    <p className="mb-3">Sounds that need more practice:</p>
                    <div className="flex flex-wrap gap-2">
                      {trickyPhonemes.map((phoneme) => (
                        <span
                          key={phoneme}
                          className="px-4 py-2 bg-yellow-200 rounded-full font-mono font-semibold"
                        >
                          {phoneme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Tips for Parents</h2>
                <div className="bg-blue-50 rounded-2xl p-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Encourage daily practice (10-15 minutes)</li>
                    <li>Practice minimal pairs: cat/cut, sit/seat, hot/hall</li>
                    <li>Use the "Hear word" button to reinforce pronunciation</li>
                    <li>Celebrate progress and badges earned</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleBackToSummary}
              className="mt-8 w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-purple-400"
            >
              Back to Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Summary screen
  if (gameMode === "summary") {
    return (
      <EndSummary
        coinsEarned={coinsEarnedThisSession}
        totalCoins={coins}
        bestStreak={bestStreak}
        accuracy={accuracy}
        newBadges={newBadges}
        stats={stats}
        hasTrickyPhonemes={trickyPhonemes.length > 0}
        onPlayAgain={handlePlayAgain}
        onPracticeTricky={handlePracticeTricky}
        onParentView={handleParentView}
      />
    );
  }

  // Main game view
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-purple-200 overflow-hidden">
      {/* HUD */}
      <HUD
        coins={coins}
        streak={streak}
        level={gameMode === "practice" ? 0 : currentLevel}
        round={currentRound}
        totalRounds={gameMode === "practice" ? 6 : ROUNDS_PER_LEVEL * currentLevel}
      />

      {/* Live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {/* Target word */}
      {targetWord && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-2xl border-4 border-purple-400">
            <p className="text-sm font-semibold text-purple-600 mb-2 text-center">
              Pop the balloon for:
            </p>
            <p className="text-4xl font-black text-purple-800 text-center mb-3">
              {targetWord.word}
            </p>
            {window.speechSynthesis && (
              <button
                onClick={handleSpeakWord}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-green-400"
                aria-label={`Hear word: ${targetWord.word}`}
              >
                🔊 Hear Word
              </button>
            )}
          </div>
        </div>
      )}

      {/* Balloons */}
      <div className="absolute inset-0 pt-24">
        {balloons.map((balloon) => (
          <Balloon
            key={balloon.id}
            id={balloon.id}
            ipa={balloon.ipa}
            x={balloon.x}
            y={balloon.y}
            color={String(balloon.colorIndex)}
            onPop={handlePop}
            isPopped={balloon.isPopped}
          />
        ))}
      </div>

      {/* Streak burst */}
      {streak >= 5 && streak % 5 === 0 && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="text-9xl animate-ping">✨</div>
        </div>
      )}
    </div>
  );
}

export const gameMeta = {
  slug: "balloon-pop",
  title: "Balloon-Pop Phonics",
  description: "Pop the balloon with the correct IPA for the word!",
  tags: ["ipa", "phonics", "speed", "balloons"],
  icon: "🎈",
};
