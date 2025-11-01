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
  isTypingMatch,
} from "./utils";
import { OptionButton } from "./OptionButton";
import { HUD } from "./HUD";
import { EndSummary } from "./EndSummary";

const TOTAL_ROUNDS = 10;
const BASE_TIME_LIMIT = 15;

type GameMode = "playing" | "bonus-typing" | "practice" | "summary";

interface RoundState {
  word: WordEntry;
  options: string[]; // 4 meanings (1 correct + 3 distractors)
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  timeLimit: number;
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
  const [typedWord, setTypedWord] = useState("");
  const [bonusTimeLeft, setBonusTimeLeft] = useState(12);
  const [showNextButton, setShowNextButton] = useState(false);

  const timerRef = useRef<number | null>(null);
  const bonusTimerRef = useRef<number | null>(null);

  // Load coins on mount
  useEffect(() => {
    setCoins(getCoins());
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

    // Generate 3 distractors
    const distractors = generateMeaningDistractors(
      word.meaning,
      WORDS,
      word.word,
      3
    );

    // Create 4 options and shuffle
    const allOptions = [word.meaning, ...distractors];
    const shuffled = shuffle(allOptions);
    const correctIndex = shuffled.indexOf(word.meaning);

    // Adaptive time limit
    let timeLimit = BASE_TIME_LIMIT;
    if (consecutiveMisses >= 2) {
      timeLimit = 18; // Easier
    } else if (streak >= 5) {
      timeLimit = 12; // Harder
    }

    setRoundState({
      word,
      options: shuffled,
      correctIndex,
      selectedIndex: null,
      isCorrect: null,
      timeLimit,
    });

    setTimeLeft(timeLimit);
    setRoundStartTime(performance.now());
    setShowNextButton(false);
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

  // Bonus typing timer
  useEffect(() => {
    if (gameMode !== "bonus-typing") {
      if (bonusTimerRef.current) clearInterval(bonusTimerRef.current);
      return;
    }

    bonusTimerRef.current = window.setInterval(() => {
      setBonusTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleBonusSkip();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (bonusTimerRef.current) clearInterval(bonusTimerRef.current);
    };
  }, [gameMode]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (bonusTimerRef.current) clearInterval(bonusTimerRef.current);
    };
  }, []);

  // Handle option selection
  const handleOptionSelect = (index: number) => {
    if (!roundState || roundState.isCorrect !== null) return;

    const isCorrect = index === roundState.correctIndex;
    const elapsedTime = (performance.now() - roundStartTime) / 1000;

    setRoundState((prev) =>
      prev
        ? { ...prev, selectedIndex: index, isCorrect }
        : null
    );

    if (isCorrect) {
      // Calculate coins
      let coinReward = 2; // Base

      // Time bonus
      if (elapsedTime <= 7) {
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

      setLiveMessage("Correct! Great job! 🎉");
      setTimeout(() => setLiveMessage(""), 2000);

      // Offer bonus typing
      setTimeout(() => {
        setGameMode("bonus-typing");
        setBonusTimeLeft(12);
      }, 1000);
    } else {
      // Wrong answer
      setStreak(0);
      setConsecutiveMisses((prev) => prev + 1);
      recordTrickyWord(roundState.word.word);

      setLiveMessage("Try again! 🎯");
      setTimeout(() => setLiveMessage(""), 2000);

      // Allow retry - reset selection after shake
      setTimeout(() => {
        setRoundState((prev) =>
          prev
            ? { ...prev, selectedIndex: null, isCorrect: null }
            : null
        );
      }, 600);
    }
  };

  // Handle time up
  const handleTimeUp = () => {
    if (!roundState) return;

    recordTrickyWord(roundState.word.word);
    setStreak(0);
    setConsecutiveMisses((prev) => prev + 1);

    setLiveMessage("Time's up! Moving to next round...");
    setTimeout(() => setLiveMessage(""), 2000);

    setShowNextButton(true);
  };

  // Handle bonus typing submission
  const handleBonusSubmit = () => {
    if (!roundState || !typedWord.trim()) return;

    const isMatch = isTypingMatch(typedWord, roundState.word.word);
    const bonusElapsed = 12 - bonusTimeLeft;

    if (isMatch) {
      let bonusCoins = 0;
      if (bonusElapsed <= 6) {
        bonusCoins = 2;
      } else if (bonusElapsed <= 12) {
        bonusCoins = 1;
      }

      if (bonusCoins > 0) {
        const newTotal = addCoins(bonusCoins);
        setCoins(newTotal);
        setCoinsEarnedThisSession((prev) => prev + bonusCoins);
      }

      setLiveMessage(`Bonus typing correct! +${bonusCoins} coins! 🎉`);
    } else {
      setLiveMessage("Not quite right, but good try!");
    }

    setTimeout(() => {
      setLiveMessage("");
      handleNextRound();
    }, 1500);
  };

  // Handle bonus skip
  const handleBonusSkip = () => {
    handleNextRound();
  };

  // Handle next round
  const handleNextRound = () => {
    setTypedWord("");

    if (gameMode === "practice") {
      if (currentRound >= 5) {
        finalizeGame();
      } else {
        setCurrentRound((prev) => prev + 1);
        setGameMode("playing");
      }
    } else {
      if (currentRound >= TOTAL_ROUNDS) {
        finalizeGame();
      } else {
        setCurrentRound((prev) => prev + 1);
        setGameMode("playing");
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

  // Bonus typing screen
  if (gameMode === "bonus-typing" && roundState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* HUD */}
          <HUD
            coins={coins}
            streak={streak}
            round={currentRound}
            totalRounds={TOTAL_ROUNDS}
            timeLeft={bonusTimeLeft}
            maxTime={12}
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
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-purple-600 mb-4">
                💡 Bonus Challenge!
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Type the word to earn extra coins!
              </p>

              <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
                <p className="text-2xl text-gray-800 leading-relaxed">
                  {roundState.word.example.replace(
                    new RegExp(`\\b${roundState.word.word}\\b`, "gi"),
                    "_____"
                  )}
                </p>
              </div>

              <input
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBonusSubmit();
                  }
                }}
                placeholder="Type the word here..."
                className="w-full max-w-md px-6 py-4 text-2xl font-bold text-center border-4 border-purple-400 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500"
                autoFocus
                aria-label="Type the missing word"
              />

              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={handleBonusSubmit}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-green-400"
                >
                  Submit ✓
                </button>

                <button
                  onClick={handleBonusSkip}
                  className="px-8 py-4 bg-gray-300 text-gray-700 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-gray-400"
                >
                  Skip →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      <div className="max-w-4xl mx-auto">
        {/* HUD */}
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

          {/* Options */}
          <div className="space-y-4 mb-8">
            {roundState.options.map((meaning, index) => (
              <OptionButton
                key={index}
                meaning={meaning}
                index={index}
                isSelected={roundState.selectedIndex === index}
                isCorrect={
                  roundState.selectedIndex === index
                    ? roundState.isCorrect
                    : null
                }
                isDisabled={roundState.isCorrect !== null}
                onClick={() => handleOptionSelect(index)}
              />
            ))}
          </div>

          {/* Next button (after time up or correct) */}
          {showNextButton && (
            <button
              onClick={handleNextRound}
              className="w-full px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-purple-400"
            >
              Next Round →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const gameMeta = {
  slug: "quick-meaning",
  title: "Quick Meaning Quiz",
  description: "Beat the timer—pick the right meaning, then type the word!",
  tags: ["timed", "meanings", "cloze", "streak"],
  icon: "⏱️",
};
