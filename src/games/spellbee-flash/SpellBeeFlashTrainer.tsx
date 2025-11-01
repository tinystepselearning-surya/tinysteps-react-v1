/**
 * SpellBeeFlashTrainer - Main Game Component
 * State machine for word learning with MCQ and card flip
 */

import { useState, useMemo, useEffect } from "react";
import { WORDS, type Word } from "./data";
import WordCard from "./WordCard";
import SummaryScreen from "./SummaryScreen";
import { 
  shuffle, 
  generateMCQOptions, 
  saveProgress, 
  initializeSpeech,
  getTotalCoins,
  addCoins,
  getMasteryData,
  updateMastery,
  checkBadges,
  calculateCoins
} from "./utils";

export const gameMeta = {
  slug: "spellbee-flash",
  title: "SpellBee Flash Trainer",
  description: "MCQ for meanings + IPA with kid-friendly flip cards",
  tags: ["spellbee", "ipa", "meanings", "flashcards"],
  icon: "🧠"
};

export default function SpellBeeFlashTrainer() {
  // Game state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [totalCoins, setTotalCoins] = useState(getTotalCoins());
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [showBrainBreak, setShowBrainBreak] = useState(false);
  const [sparkEffect, setSparkEffect] = useState(false);

  // Shuffle words once on mount
  const shuffledWords = useMemo(() => shuffle(WORDS), []);

  // Initialize speech synthesis on mount
  useEffect(() => {
    initializeSpeech();
  }, []);

  // Current word
  const currentWord = shuffledWords[currentWordIndex] as Word;

  // Get mastery level for current word
  const currentWordMastery = useMemo(() => {
    const wordIndex = WORDS.findIndex((w: { word: string }) => w.word === currentWord.word);
    if (wordIndex === -1) return null;
    
    const masteryData = getMasteryData();
    const mastery = masteryData.get(wordIndex);
    
    if (!mastery || mastery.correct === 0) return "Learning 📚";
    if (mastery.mastered) return "Mastered 🏆";
    if (mastery.correct >= 1) return "Getting Better 💪";
    return "Learning 📚";
  }, [currentWord.word]);

  // Generate MCQ options for current word
  const meaningMCQ = useMemo(() => {
    const allMeanings = WORDS.map((w: Word) => w.meaning);
    return generateMCQOptions(allMeanings, currentWord.meaning, 4);
  }, [currentWord]);

  const ipaMCQ = useMemo(() => {
    const allIPAs = WORDS.map((w: Word) => w.ipa);
    return generateMCQOptions(allIPAs, currentWord.ipa, 3);
  }, [currentWord]);

  // Handle word completion
  const handleWordComplete = (correctMeaning: boolean, correctIPA: boolean) => {
    // Update score
    let newScore = score;
    const correctCount = (correctMeaning ? 1 : 0) + (correctIPA ? 1 : 0);
    newScore += correctCount;
    setScore(newScore);

    // Update streak
    const bothCorrect = correctMeaning && correctIPA;
    let newStreak = streak;
    let newMaxStreak = maxStreak;
    if (bothCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      newMaxStreak = Math.max(maxStreak, newStreak);
      setMaxStreak(newMaxStreak);
      
      // Spark effect for streak milestones
      if (newStreak === 5 || newStreak === 10 || newStreak === 15) {
        setSparkEffect(true);
        setTimeout(() => setSparkEffect(false), 2000);
      }
    } else {
      setStreak(0);
    }

    // Calculate and award coins (10 coins per correct answer + streak bonus)
    const earnedCoins = calculateCoins(correctCount, newStreak);
    if (earnedCoins > 0) {
      const newTotal = addCoins(earnedCoins);
      setTotalCoins(newTotal);
    }

    // Update mastery for this word
    const wordIndex = WORDS.findIndex((w: { word: string }) => w.word === currentWord.word);
    if (wordIndex !== -1) {
      const masteryData = getMasteryData();
      updateMastery(wordIndex, bothCorrect, masteryData);
    }

    // Check for new badges
    const newlyEarned = checkBadges(newScore, currentWordIndex + 1, newStreak, newMaxStreak);
    if (newlyEarned.length > 0) {
      setNewBadge(`${newlyEarned[0].icon} ${newlyEarned[0].name}`);
      setTimeout(() => setNewBadge(null), 3000);
    }

    // Brain break every 12 words
    const nextIndex = currentWordIndex + 1;
    if (nextIndex % 12 === 0 && nextIndex < shuffledWords.length) {
      setShowBrainBreak(true);
    }

    // Move to next word or finish
    if (nextIndex >= shuffledWords.length) {
      // Game completed
      setCompleted(true);
      
      // Save progress
      const accuracy = Math.round((newScore / (shuffledWords.length * 2)) * 100);
      saveProgress({
        score: newScore,
        totalWords: shuffledWords.length,
        accuracy,
        streak: newMaxStreak,
        completedAt: new Date().toISOString(),
      });
    } else {
      setCurrentWordIndex(nextIndex);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCompleted(false);
  };

  // Handle exit
  const handleExit = () => {
    window.history.back();
  };

  // Render summary screen if completed
  if (completed) {
    return (
      <SummaryScreen
        score={score}
        totalWords={shuffledWords.length}
        streak={maxStreak}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 py-8 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleExit}
            className="px-6 py-3 bg-white text-purple-600 font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400"
            aria-label="Exit game"
          >
            ← Back
          </button>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-purple-600 mb-2">
              🐝 SpellBee Flash Trainer
            </h1>
            <p className="text-xl text-purple-700 font-semibold">
              Learn words, meanings & IPA symbols!
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Coin Counter with Bounce */}
            <div className="bg-yellow-400 text-yellow-900 px-5 py-3 rounded-full font-bold text-xl shadow-lg animate-bounce">
              🪙 {totalCoins}
            </div>

            {/* Streak Badge */}
            {streak > 0 && (
              <div className="bg-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
                🔥 {streak}
              </div>
            )}

            {/* Score Display */}
            <div className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold text-xl shadow-lg">
              Score: {score}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-full h-4 shadow-inner overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-400 h-full transition-all duration-500 rounded-full"
            style={{
              width: `${((currentWordIndex + 1) / shuffledWords.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-center text-purple-700 font-bold mt-2">
          Word {currentWordIndex + 1} of {shuffledWords.length}
        </p>
      </div>

      {/* Spark Effect for Streak Milestones */}
      {sparkEffect && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="text-9xl animate-ping">✨</div>
          <div className="text-6xl absolute animate-spin">🌟</div>
        </div>
      )}

      {/* New Badge Notification */}
      {newBadge && (
        <div className="fixed top-24 right-8 z-50 bg-gradient-to-r from-yellow-300 to-orange-400 text-white px-8 py-4 rounded-2xl shadow-2xl transform animate-bounce">
          <p className="text-2xl font-black">New Badge!</p>
          <p className="text-3xl mt-2">{newBadge}</p>
        </div>
      )}

      {/* Brain Break Modal */}
      {showBrainBreak && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-12 max-w-2xl text-center shadow-2xl transform animate-bounce">
            <div className="text-8xl mb-6">🧘‍♀️</div>
            <h2 className="text-5xl font-black text-purple-600 mb-4">Brain Break!</h2>
            <p className="text-2xl text-purple-700 mb-8">
              Great job! Take a deep breath and stretch your arms up high! 🙌
            </p>
            <p className="text-xl text-purple-600 mb-8">
              You've learned 12 words! Ready to continue?
            </p>
            <button
              onClick={() => setShowBrainBreak(false)}
              className="px-12 py-6 bg-gradient-to-r from-green-400 to-blue-400 text-white text-2xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400"
            >
              Let's Go! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Word Card */}
      <WordCard
        key={currentWord.word}
        word={currentWord}
        meaningOptions={meaningMCQ.options}
        ipaOptions={ipaMCQ.options}
        correctMeaningIndex={meaningMCQ.correctIndex}
        correctIPAIndex={ipaMCQ.correctIndex}
        masteryLevel={currentWordMastery}
        onComplete={handleWordComplete}
      />

      {/* Fun Motivational Messages */}
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
          <p className="text-2xl font-bold text-purple-600">
            {streak >= 5
              ? "🌟 Amazing streak! Keep going!"
              : streak >= 3
              ? "✨ You're on a roll!"
              : "💪 You've got this!"}
          </p>
        </div>
      </div>
    </div>
  );
}
