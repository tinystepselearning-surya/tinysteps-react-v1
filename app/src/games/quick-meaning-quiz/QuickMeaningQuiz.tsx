/**
 * QuickMeaningQuiz - Main game component with timed cloze questions
 */

import { useState, useEffect, useRef } from "react";
import { WORDS, type WordEntry } from "./data";
import {
  pickWords,
  generateMeaningDistractors,
  shuffle,
  getCoins,
  addCoins,
  getStats,
  saveStats,
  recordTrickyWord,
  getTrickyWords,
  saveSessionReport,
  speakText,
  updateMasteryRecord,
  checkAchievements,
} from "./utils";
import { playCelebrationSound } from "./soundEffects";
import { HUD } from "./HUD";
import { EndSummary } from "./EndSummary";
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

const TOTAL_ROUNDS = 10;
const BASE_TIME_LIMIT = 15;

type GameMode = "playing" | "practice" | "summary";

interface RoundState {
  word: WordEntry;
  options: string[]; // 3 meanings (1 correct + 2 distractors)
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  timeLimit: number;
  wrongAttempts: Set<number>; // Track wrong answers for adaptive learning
  showCorrectHint: boolean; // Guide to correct answer after wrong attempt
}

export default function QuickMeaningQuiz() {
  const [gameMode, setGameMode] = useState<GameMode>("playing");
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [recentWordIds, setRecentWordIds] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME_LIMIT);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [totalCorrectTime, setTotalCorrectTime] = useState(0);
  const [coinsEarnedThisSession, setCoinsEarnedThisSession] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [draggedOption, setDraggedOption] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  // Load coins on mount
  useEffect(() => {
    // Create announcer
    announcerRef.current = createAnnouncer();
    document.body.appendChild(announcerRef.current);

    setCoins(getCoins());

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
      flushPending();
    };
  }, []);

  // Initialize round
  const initializeRound = (practiceMode = false) => {
    let word: WordEntry;

    if (practiceMode) {
      const trickyWords = getTrickyWords();
      const trickyWordEntries = WORDS.filter((w) =>
        trickyWords.includes(w.word.toLowerCase())
      );
      const candidates = trickyWordEntries.length > 0 ? trickyWordEntries : WORDS;
      word = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      const words = pickWords(WORDS, 1, recentWordIds);
      word = words[0];
      setRecentWordIds((prev) => new Set([...prev, word.id]));
    }

    // Generate 2 distractors (changed from 3 to make it 3 total options)
    const distractors = generateMeaningDistractors(
      word.meaning,
      WORDS,
      word.word,
      2
    );

    // Create 3 options and shuffle
    const allOptions = [word.meaning, ...distractors];
    const shuffled = shuffle(allOptions);
    const correctIndex = shuffled.indexOf(word.meaning);

    // Adaptive time limit (more generous than before)
    let timeLimit = BASE_TIME_LIMIT;
    if (consecutiveMisses >= 2) {
      timeLimit = 18; // Give more time if struggling
    } else if (streak >= 5) {
      timeLimit = 12; // Challenge mode
    }

    setRoundState({
      word,
      options: shuffled,
      correctIndex,
      selectedIndex: null,
      isCorrect: null,
      timeLimit,
      wrongAttempts: new Set(),
      showCorrectHint: false,
    });

    setTimeLeft(timeLimit);
    setRoundStartTime(performance.now());
  };

  // Start game
  useEffect(() => {
    if (gameMode === "playing" || gameMode === "practice") {
      initializeRound(gameMode === "practice");
    }
  }, [currentRound, gameMode]);

  // Timer countdown
  useEffect(() => {
    if (gameMode !== "playing" || !roundState || roundState.isCorrect !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleTimeUp();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, roundState]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle option selection (with adaptive learning)
  const handleOptionSelect = (index: number) => {
    if (!roundState || roundState.isCorrect === true) return;

    const isCorrect = index === roundState.correctIndex;
    const elapsedTime = (performance.now() - roundStartTime) / 1000;

    if (isCorrect) {
      // Correct answer!
      setRoundState((prev) =>
        prev ? { ...prev, selectedIndex: index, isCorrect: true } : null
      );

      // Calculate coins (increased rewards)
      let coinReward = 3; // Base reward (increased from 2)

      // Time bonus
      if (elapsedTime <= 7) {
        coinReward += 2;
      } else if (elapsedTime <= 10) {
        coinReward += 1;
      }

      // Streak multiplier
      if (streak >= 5) {
        coinReward += 2;
      } else if (streak >= 3) {
        coinReward += 1;
      }

      const newTotal = addCoins(coinReward);
      setCoins(newTotal);
      setCoinsEarnedThisSession((prev) => prev + coinReward);

      // Update stats
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
      setCorrectCount((prev) => prev + 1);
      setConsecutiveMisses(0);
      setTotalCorrectTime((prev) => prev + elapsedTime);

      // Update mastery tracking
      const firstTryCorrect = roundState.wrongAttempts.size === 0;
      updateMasteryRecord(roundState.word.id, firstTryCorrect);

      // Check for achievements
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) {
        const ach = newAchievements[0];
        setNewBadge(`${ach.icon} ${ach.name}!`);
        setTimeout(() => setNewBadge(null), 4000);
        
        // Bonus coins for achievement
        const bonusCoins = addCoins(50);
        setCoins(bonusCoins);
        setCoinsEarnedThisSession((prev) => prev + 50);
      }

      // Celebration effects
      playCelebrationSound();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);

      announce(announcerRef.current, "Correct! Well done!");
      setLiveMessage(`Correct! +${coinReward} coins! �`);
      setTimeout(() => setLiveMessage(""), 2000);

      // Auto-advance after celebration
      setTimeout(() => {
        handleNextRound();
      }, 2000);
    } else {
      // Wrong answer - adaptive learning!
      setRoundState((prev) =>
        prev
          ? {
              ...prev,
              wrongAttempts: new Set([...prev.wrongAttempts, index]),
              showCorrectHint: true,
            }
          : null
      );

      setConsecutiveMisses((prev) => prev + 1);
      recordTrickyWord(roundState.word.word);

      announce(announcerRef.current, "Try again! Look for the green hint.");
      setLiveMessage("Not quite! Try again 🎯");
      setTimeout(() => setLiveMessage(""), 2000);

      // Don't proceed - wait for correct answer
    }
  };

  // Handle time up
  const handleTimeUp = () => {
    if (!roundState) return;

    recordTrickyWord(roundState.word.word);
    setStreak(0);
    setConsecutiveMisses((prev) => prev + 1);

    // Update mastery as incorrect
    updateMasteryRecord(roundState.word.id, false);

    announce(announcerRef.current, "Time's up! Moving to next round");
    setLiveMessage("Time's up! ⏰");
    setTimeout(() => setLiveMessage(""), 2000);

    setTimeout(() => {
      handleNextRound();
    }, 2000);
  };

  // Handle next round
  const handleNextRound = () => {
    if (gameMode === "practice") {
      if (currentRound >= 5) {
        finalizeGame();
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    } else {
      if (currentRound >= TOTAL_ROUNDS) {
        finalizeGame();
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    }
  };

  // Finalize game
  const finalizeGame = () => {
    const stats = getStats();
    stats.bestStreak = Math.max(stats.bestStreak, bestStreak);
    stats.totalPlays += 1;
    stats.totalCorrect += correctCount;
    stats.totalRounds += currentRound;

    const accuracy = correctCount > 0 ? (correctCount / currentRound) * 100 : 0;
    stats.bestAccuracy = Math.max(stats.bestAccuracy, accuracy);

    saveStats(stats);

    // Save session report
    const avgTime =
      correctCount > 0 ? totalCorrectTime / correctCount : 0;
    saveSessionReport({
      date: new Date().toLocaleDateString(),
      accuracy,
      coinsEarned: coinsEarnedThisSession,
      bestStreak,
      avgTimePerCorrect: avgTime,
      trickyWords: getTrickyWords(),
    });

    setGameMode("summary");
  };

  // Handle speak sentence
  const handleSpeakSentence = () => {
    if (!roundState) return;

    const sentence = roundState.word.example.replace(
      new RegExp(`\\b${roundState.word.word}\\b`, "gi"),
      "blank"
    );

    speakText(sentence);
  };

  // Play again
  const handlePlayAgain = () => {
    setCurrentRound(1);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setConsecutiveMisses(0);
    setTotalCorrectTime(0);
    setCoinsEarnedThisSession(0);
    setRecentWordIds(new Set());
    setGameMode("playing");
  };

  // Practice tricky
  const handlePracticeTricky = () => {
    setCurrentRound(1);
    setStreak(0);
    setCorrectCount(0);
    setTotalCorrectTime(0);
    setGameMode("practice");
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedOption(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedOption !== null) {
      handleOptionSelect(draggedOption);
      setDraggedOption(null);
    }
  };

  const stats = getStats();
  const accuracy = currentRound > 0 ? (correctCount / currentRound) * 100 : 0;
  const avgTime = correctCount > 0 ? totalCorrectTime / correctCount : 0;
  const trickyWords = getTrickyWords();

  // Summary screen
  if (gameMode === "summary") {
    return (
      <EndSummary
        coinsEarned={coinsEarnedThisSession}
        totalCoins={coins}
        accuracy={accuracy}
        bestStreak={bestStreak}
        avgTimePerCorrect={avgTime}
        stats={stats}
        hasTrickyWords={trickyWords.length > 0}
        onPlayAgain={handlePlayAgain}
        onPracticeTricky={handlePracticeTricky}
      />
    );
  }

  // Main game screen
  if (!roundState) return null;

  // Generate cloze sentence
  const clozeSentence = roundState.word.example.replace(
    new RegExp(`\\b${roundState.word.word}\\b`, "gi"),
    "_____"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8 pt-24">
      <SoundGate gameSlug="quick-meaning" />
      
      <div className="max-w-4xl mx-auto">
        {/* HUD */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <DyslexiaToggle />
          <SoundControl gameSlug="quick-meaning" />
        </div>
        <HUD
          coins={coins}
          streak={streak}
          round={currentRound}
          totalRounds={gameMode === "practice" ? 5 : TOTAL_ROUNDS}
          timeLeft={timeLeft}
          maxTime={roundState.timeLimit}
        />

        {/* SR announcer */}
        <div
          id="sr-announcer"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveMessage}
        </div>

        <div className="bg-white rounded-3xl p-12 shadow-2xl mt-8">
          {/* Cloze sentence */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-purple-600">
                What does the missing word mean?
              </h2>
              {window.speechSynthesis && (
                <button
                  onClick={handleSpeakSentence}
                  className="px-4 py-2 bg-blue-400 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="Speak sentence"
                  title="Hear the sentence"
                >
                  🔊 Speak
                </button>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <p className="text-3xl font-bold text-gray-800 leading-relaxed text-center">
                {clozeSentence}
              </p>
            </div>
          </div>

          {/* Drag & Drop Instructions */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-700">
              Drag the right meaning to the drop zone!
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="mb-8 p-8 border-4 border-dashed border-purple-300 bg-purple-50 rounded-2xl text-center transition-all hover:border-purple-400 hover:bg-purple-100"
          >
            <p className="text-xl font-bold text-purple-600">
              {roundState.isCorrect === true
                ? "✓ Correct!"
                : "Drop your answer here"}
            </p>
          </div>

          {/* Draggable Options */}
          <div className="space-y-4 mb-8">
            {roundState.options.map((meaning, index) => {
              const isWrong = roundState.wrongAttempts.has(index);
              const isCorrectHint =
                roundState.showCorrectHint && index === roundState.correctIndex;
              const isSelected = roundState.selectedIndex === index;

              return (
                <div
                  key={index}
                  draggable={!isSelected}
                  onDragStart={() => handleDragStart(index)}
                  onClick={() => handleOptionSelect(index)}
                  className={`
                    p-6 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-lg
                    ${
                      isSelected && roundState.isCorrect === true
                        ? "bg-green-500 text-white shadow-lg scale-105"
                        : isWrong
                        ? "bg-red-100 border-2 border-red-400 text-red-700 opacity-75"
                        : isCorrectHint
                        ? "bg-green-100 border-2 border-green-400 text-green-700 animate-pulse"
                        : "bg-white border-2 border-gray-300 text-gray-800 hover:border-purple-400 hover:shadow-md"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1 text-center">{meaning}</span>
                    {isWrong && <span className="ml-4 text-2xl">✗</span>}
                    {isCorrectHint && <span className="ml-4 text-2xl">✓</span>}
                    {!isSelected && !isWrong && !isCorrectHint && (
                      <span className="ml-4 text-gray-400">☰</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievement Badge Overlay */}
      {newBadge && (
        <div className="fixed bottom-24 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce z-50">
          <p className="text-xl font-bold">{newBadge}</p>
          <p className="text-sm">+50 coins!</p>
        </div>
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-9xl animate-ping">✨🌟✨</div>
        </div>
      )}

      {/* Floating Navigation */}
      <button
        onClick={() => window.history.back()}
        className="fixed bottom-6 left-6 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full shadow-lg transition-all z-30"
      >
        ← Back
      </button>
      <button
        onClick={() => (window.location.href = "/kids/games/quick-meaning/dashboard")}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full shadow-lg transition-all z-30"
      >
        📊 Progress
      </button>
    </div>
  );
}

export const gameMeta = {
  slug: "quick-meaning",
  title: "Quick Meaning Quiz",
  description: "Drag the right meaning to match the sentence—beat the timer!",
  tags: ["timed", "meanings", "drag-drop", "adaptive"],
  icon: "⏱️",
};
