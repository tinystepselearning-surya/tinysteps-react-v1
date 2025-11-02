/**
 * BalloonPop - Main game component with delta-time rAF loop, audio, and enhanced UX
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
  primeAudioElements,
  playCorrectSound,
  playWrongSound,
  playPopSound,
  getSoundEnabled,
  setSoundEnabled,
  getMinimalPairHint,
  clampDelta,
  updateMasteryRecord,
  checkAchievements,
} from "./utils";
import { playCelebrationSound } from "./soundEffects";
import { Balloon, BALLOON_COLORS } from "./Balloon";
import { HUD } from "./HUD";
import { EndSummary } from "./EndSummary";
import { CloudLayer } from "./CloudLayer";
import { Toast } from "./Toast";
import { Confetti } from "./Confetti";
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce as announceToSR } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

const ROUNDS_PER_LEVEL = 10;
const TOTAL_LEVELS = 3;

// Slower rise speeds for better visibility and gameplay (px/s)
const LEVEL_CONFIGS = {
  1: { balloonCount: 3, riseSpeed: 50, hasSway: false },
  2: { balloonCount: 4, riseSpeed: 70, hasSway: false },
  3: { balloonCount: 5, riseSpeed: 90, hasSway: true },
};

interface BalloonState {
  id: string;
  ipa: string;
  x: number; // 0-100 percentage
  y: number; // px from bottom
  colorIndex: number;
  swayOffset: number;
  isPopped: boolean;
  shake: boolean;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
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
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [quickHits, setQuickHits] = useState(0);
  const [firstTryStreak, setFirstTryStreak] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [coinsEarnedThisSession, setCoinsEarnedThisSession] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number } | null>(null);
  const [hintText, setHintText] = useState("");
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [showSoundTip, setShowSoundTip] = useState(false);
  const [focusedBalloonIndex, setFocusedBalloonIndex] = useState(0);
  const [achievementBadge, setAchievementBadge] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [skyTheme, setSkyTheme] = useState<'sunny' | 'cloudy' | 'sunset' | 'sunrise' | 'night'>('sunny');

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const viewportHeightRef = useRef(window.innerHeight);
  const adaptiveSpeedRef = useRef(1.0); // Speed multiplier
  const adaptiveDistractorCountRef = useRef(0); // Distractor reduction
  const announcerRef = useRef<HTMLDivElement | null>(null);

  // Load coins and sound preference on mount
  useEffect(() => {
    // Create announcer
    announcerRef.current = createAnnouncer();
    document.body.appendChild(announcerRef.current);

    setCoins(getCoins());
    const enabled = getSoundEnabled();
    setSoundEnabledState(enabled);
    if (!enabled) {
      setShowSoundTip(true);
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      flushPending();
    };
  }, []);

  // Prime audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!soundEnabled) {
        primeAudioElements();
        setSoundEnabledState(true);
        setSoundEnabled(true);
        setShowSoundTip(false);
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [soundEnabled]);

  // Get level config with adaptive adjustments
  const levelConfig = useMemo(() => {
    const base = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS] || LEVEL_CONFIGS[1];
    const adjustedSpeed = Math.max(90, base.riseSpeed * adaptiveSpeedRef.current);
    const adjustedBalloons = Math.max(
      3,
      base.balloonCount - adaptiveDistractorCountRef.current
    );

    return {
      ...base,
      riseSpeed: adjustedSpeed,
      balloonCount: adjustedBalloons,
    };
  }, [currentLevel, consecutiveMisses, streak]);

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
    setRoundStartTime(performance.now());
    setHintText("");
    setTotalAttempts(0);
    setFocusedBalloonIndex(0);

    // Generate IPA choices
    const allIPAs = WORDS.map((w) => w.ipa);
    const balloonCount = practiceMode ? 3 : levelConfig.balloonCount;
    const distractorCount = balloonCount - 1;
    const distractors = generateIPADistractors(word.ipa, allIPAs, distractorCount);
    const choices = [word.ipa, ...distractors];

    // Shuffle and create balloon states
    const shuffled = [...choices].sort(() => Math.random() - 0.5);
    const newBalloons: BalloonState[] = shuffled.map((ipa, i) => ({
      id: `balloon-${Date.now()}-${i}`,
      ipa,
      x: randomFloat(15, 85),
      y: viewportHeightRef.current + 50, // Start below viewport
      colorIndex: i % BALLOON_COLORS.length,
      swayOffset: randomFloat(0, Math.PI * 2),
      isPopped: false,
      shake: false,
    }));

    setBalloons(newBalloons);
  };

  // Start new game/round
  useEffect(() => {
    if (gameMode === "playing" || gameMode === "practice") {
      initializeRound(gameMode === "practice");
    }
  }, [currentRound, currentLevel, gameMode]);

  // Change sky theme every 5 rounds
  useEffect(() => {
    const themes: Array<'sunny' | 'cloudy' | 'sunset' | 'sunrise' | 'night'> = [
      'sunny', 'cloudy', 'sunset', 'sunrise', 'night'
    ];
    const themeIndex = Math.floor((currentRound - 1) / 5) % themes.length;
    setSkyTheme(themes[themeIndex]);
  }, [currentRound]);

  // Game loop with delta-time requestAnimationFrame
  useEffect(() => {
    if (gameMode !== "playing" && gameMode !== "practice") return;
    if (!targetWord) return;

    let animationId: number;

    const gameLoop = (timestamp: number) => {
      // Skip movement if paused (during confetti)
      if (isPaused) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = clampDelta(timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      // Convert px/s to px per frame
      const pixelsPerSecond = levelConfig.riseSpeed;
      const pixelsPerFrame = (pixelsPerSecond / 1000) * deltaTime;

      // Update balloon positions
      setBalloons((prevBalloons) => {
        const updated = prevBalloons.map((balloon) => {
          if (balloon.isPopped) return balloon;

          // Move up (decrease y from bottom)
          let newY = balloon.y - pixelsPerFrame;

          // Add sway for level 3
          let newX = balloon.x;
          if (levelConfig.hasSway) {
            const swayAmount = Math.sin(timestamp / 500 + balloon.swayOffset);
            const swayDelta = swayAmount * 0.15; // Percentage shift
            newX = Math.max(10, Math.min(90, balloon.x + swayDelta));
          }

          return { ...balloon, y: newY, x: newX, shake: false };
        });

        // Check if any balloon reached top (game over for this round)
        const reachedTop = updated.some((b) => !b.isPopped && b.y <= -50);
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
      rafIdRef.current = null;
      lastTimeRef.current = 0;
    };
  }, [gameMode, targetWord, levelConfig, isPaused]);

  // Pause/resume on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause: cancel rAF
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      } else {
        // Resume: reset lastTime to avoid huge delta jump
        lastTimeRef.current = 0;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode !== "playing" && gameMode !== "practice") return;
      if (balloons.length === 0) return;

      const activeBalloons = balloons.filter((b) => !b.isPopped);
      if (activeBalloons.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedBalloonIndex((prev) =>
          prev > 0 ? prev - 1 : activeBalloons.length - 1
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedBalloonIndex((prev) =>
          prev < activeBalloons.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const focusedBalloon = activeBalloons[focusedBalloonIndex];
        if (focusedBalloon) {
          handlePop(focusedBalloon.id, focusedBalloon.ipa);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameMode, balloons, focusedBalloonIndex]);

  // Helper: Add toast
  const addToast = (message: string, type: ToastMessage["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // Helper: Remove toast
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      const elapsedTime = (performance.now() - roundStartTime) / 1000;
      const isFirstTry = currentAttempts === 1;

      // Play sounds
      playCorrectSound();
      playPopSound();
      playCelebrationSound();

      // Pause balloons during confetti celebration
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 1500);

      // Track mastery (first-try correct)
      updateMasteryRecord(targetWord.word, isFirstTry);

      // Check achievements and award bonus coins
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) {
        const ach = newAchievements[0];
        setAchievementBadge(`${ach.icon} ${ach.name}!`);
        addCoins(50); // Achievement bonus
        setTimeout(() => setAchievementBadge(null), 5000);
      }

      // Show celebration effect
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500);

      // Award coins
      let coinReward = 0;
      if (isFirstTry) {
        coinReward = 5;
        setFirstTryStreak((prev) => prev + 1);
      } else if (currentAttempts === 2) {
        coinReward = 2;
        setFirstTryStreak(0);
      } else {
        setFirstTryStreak(0);
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
      setConsecutiveMisses(0);

      // Quick hit tracking (within 3s)
      if (elapsedTime <= 3) {
        setQuickHits((prev) => prev + 1);
      }

      // Update stats
      setCorrectCount((prev) => prev + 1);

      // Confetti - show for duration of pause
      const balloon = balloons.find((b) => b.id === id);
      if (balloon) {
        const confettiId = Date.now();
        setConfetti({ id: confettiId, x: balloon.x, y: (balloon.y / viewportHeightRef.current) * 100 });
        setTimeout(() => setConfetti(null), 1500); // Match pause duration
      }

      // Toast
      addToast("Correct pop! 🎈", "success");
      announceToSR(announcerRef.current, "Correct pop!");
      setLiveMessage("Correct pop!");
      setTimeout(() => setLiveMessage(""), 2000);

      // Check for Sharpshooter badge (10 first-try in a row)
      if (isFirstTry) {
        const newFirstTryStreak = firstTryStreak + 1;
        if (newFirstTryStreak === 10) {
          const awarded = awardBadge("sharpshooter");
          if (awarded) setNewBadges((prev) => [...prev, "sharpshooter"]);
        }
      }

      // Adaptive: Speed up on streak ≥5
      if (newStreak >= 5 && newStreak % 5 === 0) {
        adaptiveSpeedRef.current = Math.min(1.3, adaptiveSpeedRef.current * 1.1);
      }

      // Proceed to next round after delay
      setTimeout(() => handleRoundEnd(true), 800);
    } else {
      // Wrong pop
      playWrongSound();
      recordWrongPhoneme(ipa);
      setStreak(0);
      setFirstTryStreak(0);

      const missCount = consecutiveMisses + 1;
      setConsecutiveMisses(missCount);

      // Shake balloon
      setBalloons((prev) =>
        prev.map((b) => (b.id === id ? { ...b, shake: true } : b))
      );

      // Show hint
      const hint = getMinimalPairHint(targetWord.ipa, ipa);
      setHintText(hint);
      setTimeout(() => setHintText(""), 3000);

      // Toast
      addToast("Oops! Incorrect", "error");
      announceToSR(announcerRef.current, "Not quite. Try again!");
      setLiveMessage("Try again");
      setTimeout(() => setLiveMessage(""), 2000);

      // Adaptive: Slow down after 2 misses in a row
      if (missCount >= 2) {
        adaptiveSpeedRef.current = Math.max(0.7, adaptiveSpeedRef.current * 0.85);
        adaptiveDistractorCountRef.current = Math.min(2, adaptiveDistractorCountRef.current + 1);
      }

      // Don't end round, allow retry
    }
  };

  // Handle round end
  const handleRoundEnd = (success: boolean) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Reset adaptive on round end
    if (success) {
      adaptiveSpeedRef.current = 1.0;
      adaptiveDistractorCountRef.current = 0;
      setConsecutiveMisses(0);
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
          const accuracy =
            (correctCount / Math.max(1, correctCount + (totalRounds - correctCount))) * 100;
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
            adaptiveSpeedRef.current = 1.0;
            adaptiveDistractorCountRef.current = 0;
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
    setConsecutiveMisses(0);
    setQuickHits(0);
    setFirstTryStreak(0);
    setNewBadges([]);
    setCoinsEarnedThisSession(0);
    setRecentWordIds(new Set());
    adaptiveSpeedRef.current = 1.0;
    adaptiveDistractorCountRef.current = 0;
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
  const accuracy =
    correctCount > 0
      ? (correctCount / (correctCount + totalAttempts - correctCount)) * 100
      : 0;
  const trickyPhonemes = getTrickyPhonemes();

  // Calculate round progress (0-1) based on balloon positions
  const roundProgress = useMemo(() => {
    if (balloons.length === 0) return 0;
    const avgY = balloons.reduce((sum, b) => sum + b.y, 0) / balloons.length;
    const viewportHeight = viewportHeightRef.current;
    return Math.max(0, Math.min(1, 1 - avgY / viewportHeight));
  }, [balloons]);

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
  const skyBackgrounds = {
    sunny: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    cloudy: "linear-gradient(to bottom, #B0C4DE 0%, #D3D3D3 50%, #A9A9A9 100%)",
    sunset: "linear-gradient(to bottom, #FF6B6B 0%, #FFB84D 30%, #FFA07A 60%, #FFE5B4 100%)",
    sunrise: "linear-gradient(to bottom, #FFB6C1 0%, #FFD700 30%, #FFA07A 60%, #87CEEB 100%)",
    night: "linear-gradient(to bottom, #0B1026 0%, #1A1F3A 50%, #2C3E50 100%)",
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: skyBackgrounds[skyTheme],
        transition: "background 2s ease-in-out",
      }}
    >
      <SoundGate gameSlug="balloon-pop" />
      
      {/* Sky elements based on theme */}
      {skyTheme === 'sunny' && (
        <>
          {/* Sun */}
          <div className="absolute top-20 right-20 w-24 h-24 rounded-full bg-yellow-300 shadow-2xl z-0"
            style={{
              boxShadow: '0 0 60px 30px rgba(255, 223, 0, 0.4)'
            }}
          />
          {/* Birds */}
          <div className="absolute top-32 left-1/4 text-4xl animate-bounce" style={{animationDuration: '3s'}}>🐦</div>
          <div className="absolute top-48 right-1/3 text-3xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>🐦</div>
        </>
      )}
      
      {skyTheme === 'cloudy' && (
        <>
          {/* Rain clouds */}
          <div className="absolute top-16 left-1/4 text-6xl opacity-80">☁️</div>
          <div className="absolute top-24 right-1/4 text-7xl opacity-70">☁️</div>
          <div className="absolute top-32 left-1/2 text-6xl opacity-60">☁️</div>
        </>
      )}
      
      {skyTheme === 'sunset' && (
        <>
          {/* Setting sun */}
          <div className="absolute bottom-40 right-32 w-32 h-32 rounded-full bg-orange-400 shadow-2xl z-0"
            style={{
              boxShadow: '0 0 80px 40px rgba(255, 140, 0, 0.5)'
            }}
          />
          {/* Birds flying home */}
          <div className="absolute top-40 left-1/4 text-3xl">🐦</div>
          <div className="absolute top-56 left-1/3 text-2xl">🐦</div>
        </>
      )}
      
      {skyTheme === 'sunrise' && (
        <>
          {/* Rising sun */}
          <div className="absolute top-32 left-32 w-28 h-28 rounded-full bg-yellow-200 shadow-2xl z-0"
            style={{
              boxShadow: '0 0 70px 35px rgba(255, 215, 0, 0.4)'
            }}
          />
          {/* Morning birds */}
          <div className="absolute top-44 right-1/4 text-4xl animate-bounce" style={{animationDuration: '3.5s'}}>🐦</div>
        </>
      )}
      
      {skyTheme === 'night' && (
        <>
          {/* Moon */}
          <div className="absolute top-20 right-24 text-7xl">🌙</div>
          {/* Stars */}
          <div className="absolute top-16 left-1/4 text-2xl animate-pulse">⭐</div>
          <div className="absolute top-32 left-1/3 text-xl animate-pulse" style={{animationDelay: '0.5s'}}>⭐</div>
          <div className="absolute top-48 right-1/4 text-2xl animate-pulse" style={{animationDelay: '1s'}}>⭐</div>
          <div className="absolute top-24 right-1/3 text-xl animate-pulse" style={{animationDelay: '1.5s'}}>⭐</div>
          <div className="absolute top-40 left-1/2 text-2xl animate-pulse" style={{animationDelay: '2s'}}>✨</div>
          <div className="absolute top-56 right-1/2 text-xl animate-pulse" style={{animationDelay: '2.5s'}}>✨</div>
        </>
      )}
      
      {/* Parallax clouds */}
      <CloudLayer layer={1} />
      <CloudLayer layer={2} />

      {/* HUD */}
      <div className="relative z-20">
        <div className="flex items-center justify-end gap-2 px-6 pt-4">
          <DyslexiaToggle />
          <SoundControl gameSlug="balloon-pop" />
        </div>
        <HUD
          coins={coins}
          streak={streak}
          level={gameMode === "practice" ? 0 : currentLevel}
          round={currentRound}
          totalRounds={gameMode === "practice" ? 6 : ROUNDS_PER_LEVEL * currentLevel}
          accuracy={accuracy}
          roundProgress={roundProgress}
        />
      </div>

      {/* SR-only live region */}
      <div
        id="sr-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {/* Sound tip */}
      {showSoundTip && (
        <div className="fixed top-32 right-6 z-50 bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-xs">
          <p className="font-bold mb-2">🔊 Enable Sound?</p>
          <p className="text-sm mb-3">
            Tap anywhere to hear word pronunciations and sound effects!
          </p>
          <button
            onClick={() => setShowSoundTip(false)}
            className="text-xs underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* Toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Confetti */}
      {confetti && <Confetti x={confetti.x} y={confetti.y} />}

      {/* Hint text */}
      {hintText && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-gray-900 px-6 py-3 rounded-2xl shadow-2xl font-semibold">
          {hintText}
        </div>
      )}

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
        {balloons.map((balloon) => {
          if (balloon.isPopped) return null;

          // Convert y from px to percentage for component
          const yPercent = (balloon.y / viewportHeightRef.current) * 100;

          return (
            <Balloon
              key={balloon.id}
              id={balloon.id}
              ipa={balloon.ipa}
              x={balloon.x}
              y={yPercent}
              color={String(balloon.colorIndex)}
              onPop={handlePop}
              isPopped={false}
              shake={balloon.shake}
            />
          );
        })}
      </div>

      {/* Streak burst */}
      {streak >= 5 && streak % 5 === 0 && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="text-9xl animate-ping">✨</div>
        </div>
      )}

      {/* Achievement Badge Overlay */}
      {achievementBadge && (
        <div className="fixed bottom-24 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce z-50">
          <p className="text-xl font-bold">{achievementBadge}</p>
          <p className="text-sm">+50 coins!</p>
        </div>
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-9xl animate-ping">✨🌟✨</div>
        </div>
      )}

      {/* Floating Navigation - Only show during gameplay */}
      {(gameMode === "playing" || gameMode === "practice") && (
        <>
          <button
            onClick={() => setGameMode("summary")}
            className="fixed bottom-6 left-6 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full shadow-lg transition-all z-30"
          >
            ← Back
          </button>
          <button
            onClick={() => (window.location.href = "/kids/games/balloon-pop/dashboard")}
            className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full shadow-lg transition-all z-30"
          >
            📊 Progress
          </button>
        </>
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
