/**
 * SpellBeeFlashTrainer - Main Game Component
 * State machine for word learning with MCQ and card flip
 */

import { useState, useMemo, useEffect } from "react";
import { WORDS } from "./data";
import WordCard from "./WordCard";
import SummaryScreen from "./SummaryScreen";
import { shuffle, generateMCQOptions, saveProgress, initializeSpeech } from "./utils";

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

  // Shuffle words once on mount
  const shuffledWords = useMemo(() => shuffle(WORDS), []);

  // Initialize speech synthesis on mount
  useEffect(() => {
    initializeSpeech();
  }, []);

  // Current word
  const currentWord = shuffledWords[currentWordIndex];

  // Generate MCQ options for current word
  const meaningMCQ = useMemo(() => {
    const allMeanings = WORDS.map((w) => w.meaning);
    return generateMCQOptions(allMeanings, currentWord.meaning, 4);
  }, [currentWord]);

  const ipaMCQ = useMemo(() => {
    const allIPAs = WORDS.map((w) => w.ipa);
    return generateMCQOptions(allIPAs, currentWord.ipa, 3);
  }, [currentWord]);

  // Handle word completion
  const handleWordComplete = (correctMeaning: boolean, correctIPA: boolean) => {
    // Update score
    let newScore = score;
    if (correctMeaning) newScore++;
    if (correctIPA) newScore++;
    setScore(newScore);

    // Update streak
    const bothCorrect = correctMeaning && correctIPA;
    let newStreak = streak;
    if (bothCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
    } else {
      setStreak(0);
    }

    // Move to next word or finish
    const nextIndex = currentWordIndex + 1;
    if (nextIndex >= shuffledWords.length) {
      // Game completed
      setCompleted(true);
      
      // Save progress
      const accuracy = Math.round((newScore / (shuffledWords.length * 2)) * 100);
      saveProgress({
        score: newScore,
        totalWords: shuffledWords.length,
        accuracy,
        streak: maxStreak,
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

      {/* Word Card */}
      <WordCard
        key={currentWord.word}
        word={currentWord}
        meaningOptions={meaningMCQ.options}
        ipaOptions={ipaMCQ.options}
        correctMeaningIndex={meaningMCQ.correctIndex}
        correctIPAIndex={ipaMCQ.correctIndex}
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
