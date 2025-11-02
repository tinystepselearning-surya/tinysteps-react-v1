/**
 * WordCard Component
 * Interactive flash card with flip animation, MCQ, and feedback
 */

import { useState, useEffect, useRef } from "react";
import type { Word } from "./data";
import { speakWord, speakMeaning, speakIPA, speakCorrect, speakWrong, updatePhonemeStats, getMinimalPairHint } from "./utils";
import { getWordImageUrl } from "./spellbeeImages";
import ConfettiBurst from "./Confetti";

export type GamePhase = "meaning" | "ear-training" | "ipa" | "speed" | "reveal";

interface WordCardProps {
  word: Word;
  meaningOptions: string[];
  ipaOptions: string[];
  correctMeaningIndex: number;
  correctIPAIndex: number;
  masteryLevel?: string | null;
  isEarTrainingRound?: boolean;
  isSpeedRound?: boolean;
  onComplete: (correctMeaning: boolean, correctIPA: boolean, earTrainingBonus?: boolean, speedBonus?: number) => void;
  onTimeout?: () => void;
}

export default function WordCard({
  word,
  meaningOptions,
  ipaOptions,
  correctMeaningIndex,
  correctIPAIndex,
  masteryLevel,
  isEarTrainingRound = false,
  isSpeedRound = false,
  onComplete,
  onTimeout,
}: WordCardProps) {
  const [phase, setPhase] = useState<GamePhase>(
    isSpeedRound ? "speed" : isEarTrainingRound ? "ear-training" : "meaning"
  );
  const [selectedMeaningIndex, setSelectedMeaningIndex] = useState<number | null>(null);
  const [selectedIPAIndex, setSelectedIPAIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [minimalPairHint, setMinimalPairHint] = useState<string | null>(null);
  const [earTrainingCorrect, setEarTrainingCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const beepTimesRef = useRef<Set<number>>(new Set());
  
  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [cheerMessage, setCheerMessage] = useState<string | null>(null);
  
  const CHEER_MESSAGES = ["You did it! 🎉", "Great job! 🌟", "Congratulations! 🥳"];
  
  // Get local image URL for this word
  const wordImageUrl = getWordImageUrl(word.word);

  // Reset state when word changes
  useEffect(() => {
    setPhase(isSpeedRound ? "speed" : isEarTrainingRound ? "ear-training" : "meaning");
    setSelectedMeaningIndex(null);
    setSelectedIPAIndex(null);
    setIsFlipped(false);
    setAudioPlayed(false);
    setMinimalPairHint(null);
    setEarTrainingCorrect(null);
    setTimeLeft(10);
    setTimerStartTime(null);
    beepTimesRef.current = new Set();
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Speak the word when a new card appears (only if not ear-training or speed)
    if (!isEarTrainingRound && !isSpeedRound) {
      const cleanup = speakWord(word.word);
      return cleanup;
    }
  }, [word.word, isEarTrainingRound, isSpeedRound]);

  // Speed round timer effect
  useEffect(() => {
    if (phase !== "speed" || selectedMeaningIndex !== null) return;

    // Start timer
    setTimerStartTime(Date.now());
    beepTimesRef.current = new Set();

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Play timeout beep
          playBeep();
          
          // Handle timeout
          setTimeout(() => {
            if (onTimeout) onTimeout();
            // Auto-advance with incorrect answer
            onComplete(false, false, false, 0);
          }, 1000);
          
          return 0;
        }

        // Play beep at 7s, 4s, 1s remaining
        if ((prev === 7 || prev === 4 || prev === 1) && !beepTimesRef.current.has(prev)) {
          beepTimesRef.current.add(prev);
          playBeep();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, selectedMeaningIndex, onComplete, onTimeout]);

    // Play beep sound
  const playBeep = () => {
    try {
      const audio = new Audio();
      audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnn77RgGwU7k9n0yXUqBSh+zPLaizsKGGS56+mnUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBQ==";
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silent fail if audio blocked
      });
    } catch {
      // Fallback: silent
    }
  };
  
  // Celebration helper
  const triggerCelebration = () => {
    // Show confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
    
    // Show random cheer message
    const randomCheer = CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
    setCheerMessage(randomCheer);
    setTimeout(() => setCheerMessage(null), 1200);
  };

  // Handler for "Hear it" button in ear-training mode
  const handlePlayAudio = () => {
    setAudioPlayed(true);
    speakWord(word.word);
  };

  // Handler for ear-training IPA selection
  const handleEarTrainingSelect = (index: number) => {
    if (earTrainingCorrect !== null) return;
    
    const isCorrect = index === correctIPAIndex;
    setEarTrainingCorrect(isCorrect);
    
    // Track phoneme difficulty
    updatePhonemeStats(word.ipa, isCorrect);
    
    // Show minimal-pair hint if wrong
    if (!isCorrect) {
      const hint = getMinimalPairHint(word.ipa, ipaOptions[index]);
      setMinimalPairHint(hint);
    } else {
      // Trigger celebration on correct
      triggerCelebration();
    }
    
    // Play audio feedback with speech
    const cleanup = isCorrect ? speakCorrect() : speakWrong();

    // Move to meaning phase after delay
    setTimeout(() => {
      cleanup();
      setPhase("meaning");
    }, isCorrect ? 1000 : 2500);
  };

  const handleMeaningSelect = (index: number) => {
    if (selectedMeaningIndex !== null) return;
    
    setSelectedMeaningIndex(index);
    const isCorrect = index === correctMeaningIndex;
    
    // For speed round, calculate bonus and complete immediately
    if (phase === "speed") {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const elapsedTime = timerStartTime ? (Date.now() - timerStartTime) / 1000 : 10;
      let speedBonus = 0;
      if (isCorrect) {
        speedBonus = elapsedTime <= 4 ? 3 : elapsedTime <= 10 ? 1 : 0;
        // Trigger celebration
        triggerCelebration();
      }

      // Play audio feedback with speech
      const cleanup = isCorrect ? speakCorrect() : speakWrong();

      // Complete with speed bonus
      setTimeout(() => {
        cleanup();
        onComplete(isCorrect, true, false, speedBonus); // Speed rounds skip IPA
      }, 1000);
      return;
    }
    
    // Trigger celebration if correct
    if (isCorrect) {
      triggerCelebration();
    }
    
    // Normal flow: speak meaning
    speakMeaning(meaningOptions[index]);
    
    // Play audio feedback with speech
    const cleanup = isCorrect ? speakCorrect() : speakWrong();

    // Move to IPA phase after delay
    setTimeout(() => {
      cleanup();
      setPhase("ipa");
    }, 1500);
  };

  const handleIPASelect = (index: number) => {
    if (selectedIPAIndex !== null) return;
    
    setSelectedIPAIndex(index);
    const isCorrect = index === correctIPAIndex;
    
    // Trigger celebration if correct
    if (isCorrect) {
      triggerCelebration();
    }
    
    // Speak the selected IPA
    speakIPA(ipaOptions[index]);
    
    // Play audio feedback with speech
    const cleanup = isCorrect ? speakCorrect() : speakWrong();

    // Move to reveal phase after delay
    setTimeout(() => {
      cleanup();
      setPhase("reveal");
      setIsFlipped(true);
    }, 1500);
  };

  const handleNextWord = () => {
    const correctMeaning = selectedMeaningIndex === correctMeaningIndex;
    const correctIPA = selectedIPAIndex === correctIPAIndex;
    const earTrainingFirstTry = isEarTrainingRound && earTrainingCorrect === true;
    onComplete(correctMeaning, correctIPA, earTrainingFirstTry);
  };

  const getButtonClass = (
    index: number,
    selectedIndex: number | null,
    correctIndex: number
  ): string => {
    // Bigger tap targets for kids, responsive text size
    const baseClass =
      "px-4 py-4 min-h-[64px] rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 active:scale-[0.99]";

    if (selectedIndex === null) {
      return `${baseClass} bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg`;
    }

    if (index === selectedIndex) {
      const isCorrect = index === correctIndex;
      return isCorrect
        ? `${baseClass} bg-gradient-to-r from-green-400 to-green-500 text-white shadow-xl animate-bounce`
        : `${baseClass} bg-gradient-to-r from-red-400 to-red-500 text-white shadow-xl animate-gentle-shake`;
    }

    if (index === correctIndex) {
      return `${baseClass} bg-gradient-to-r from-green-400 to-green-500 text-white shadow-xl`;
    }

    return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Confetti Burst */}
      {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}
      
      {/* Cheer Overlay */}
      {cheerMessage && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="rounded-2xl bg-white/70 backdrop-blur px-6 py-3 text-2xl sm:text-3xl font-bold text-purple-600 shadow-2xl animate-bounce">
            {cheerMessage}
          </div>
        </div>
      )}
      
      {/* Mastery Tier Display */}
      {masteryLevel && (
        <div className="mb-4 text-center">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-lg">
            <span className="text-xl font-bold text-purple-600">{masteryLevel}</span>
          </div>
        </div>
      )}

      {/* Card Container with Flip Effect */}
      <div className="relative w-full min-h-[500px] perspective-1000">
        <div
          className={`w-full h-full transition-transform duration-700 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of Card (MCQ Phase) */}
          <div
            className={`absolute w-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl shadow-2xl p-8 backface-hidden ${
              isFlipped ? "invisible" : "visible"
            }`}
          >
            {/* Speed Round Timer Bar */}
            {phase === "speed" && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-orange-600 animate-pulse">
                    ⏱️ SPEED ROUND!
                  </span>
                  <span className="text-2xl font-bold text-orange-600">
                    {timeLeft}s
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-4 shadow-inner overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{
                      width: `${(timeLeft / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Word Display */}
            <div className="text-center mb-8">
              <div className="text-8xl mb-3 animate-bounce">{word.icon}</div>
              <h2 className="text-6xl font-black text-purple-600 mb-4 animate-pulse">
                {phase === "ear-training" ? "???" : word.word}
              </h2>
              <p className="text-2xl text-gray-600 font-semibold">
                {phase === "speed"
                  ? "⚡ Quick! What does it mean?"
                  : phase === "ear-training" 
                  ? "🔊 Listen and pick the IPA!" 
                  : phase === "meaning" 
                  ? "What does it mean?" 
                  : "What's the IPA?"}
              </p>
            </div>

            {/* Picture Area (only show after ear-training phase) */}
            {phase !== "ear-training" && (
              <div className="shrink-0">
                {wordImageUrl ? (
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/60 max-h-[38svh]">
                    <img 
                      src={wordImageUrl} 
                      alt={`Visual for ${word.word}`}
                      className="h-full w-full object-cover rounded-2xl shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-2xl border border-slate-200/40 bg-slate-50/40 max-h-[38svh] h-[26svh]" />
                )}
              </div>
            )}

            {/* Ear-Training: Hear It Button */}
            {phase === "ear-training" && !audioPlayed && (
              <div className="text-center mb-8">
                <button
                  onClick={handlePlayAudio}
                  className="px-12 py-6 bg-gradient-to-r from-blue-400 to-purple-400 text-white text-3xl font-black rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400"
                  aria-label="Play audio"
                >
                  🔊 Hear it!
                </button>
              </div>
            )}

            {/* Ear-Training: IPA Options (shown after audio plays) */}
            {phase === "ear-training" && audioPlayed && (
              <div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {ipaOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleEarTrainingSelect(index)}
                      disabled={earTrainingCorrect !== null}
                      className={getButtonClass(
                        index,
                        earTrainingCorrect === null ? null : (earTrainingCorrect && index === correctIPAIndex ? index : earTrainingCorrect === false && index !== correctIPAIndex ? null : index),
                        correctIPAIndex
                      )}
                      aria-label={`Option ${index + 1}: ${option}`}
                      aria-pressed={earTrainingCorrect === null ? undefined : index === correctIPAIndex}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                
                {/* Minimal-Pair Hint */}
                {minimalPairHint && earTrainingCorrect === false && (
                  <div className="mt-4 p-4 bg-yellow-100 rounded-xl border-2 border-yellow-400">
                    <p className="text-lg font-bold text-yellow-800">
                      💡 Hint: {minimalPairHint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* MCQ Options - Horizontal Layout */}
            <div>
              {/* Speed Round: Meaning Only */}
              {phase === "speed" && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {meaningOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMeaningSelect(index)}
                      disabled={selectedMeaningIndex !== null || timeLeft === 0}
                      className={getButtonClass(
                        index,
                        selectedMeaningIndex,
                        correctMeaningIndex
                      )}
                      aria-label={`Option ${index + 1}: ${option}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Normal: Meaning Phase */}
              {phase === "meaning" && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {meaningOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMeaningSelect(index)}
                      disabled={selectedMeaningIndex !== null}
                      className={getButtonClass(
                        index,
                        selectedMeaningIndex,
                        correctMeaningIndex
                      )}
                      aria-label={`Option ${index + 1}: ${option}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* IPA Phase */}
              {phase === "ipa" && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {ipaOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleIPASelect(index)}
                      disabled={selectedIPAIndex !== null}
                      className={getButtonClass(
                        index,
                        selectedIPAIndex,
                        correctIPAIndex
                      )}
                      aria-label={`Option ${index + 1}: ${option}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Back of Card (Reveal Phase) */}
          <div
            className={`absolute w-full bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 rounded-3xl shadow-2xl p-8 backface-hidden rotate-y-180 ${
              isFlipped ? "visible" : "invisible"
            }`}
          >
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <span className="text-6xl">{word.icon}</span>
                <h2 className="text-5xl font-black text-green-600">
                  {word.word}
                </h2>
                <button
                  onClick={() => speakWord(word.word)}
                  className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="Pronounce word"
                  title="Hear pronunciation"
                >
                  🔊
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl text-gray-700 flex-1">
                    <span className="font-bold text-purple-600">IPA:</span>{" "}
                    <span className="font-mono text-2xl">{word.ipa}</span>
                  </p>
                  <button
                    onClick={() => speakIPA(word.ipa)}
                    className="p-2 bg-purple-400 text-white rounded-full hover:bg-purple-500 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-300"
                    aria-label="Pronounce IPA"
                    title="Hear IPA sound"
                  >
                    🔊
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl flex-shrink-0">{word.icon}</span>
                  <p className="text-2xl text-gray-700 flex-1 font-semibold">
                    {word.simpleMeaning}
                  </p>
                  <button
                    onClick={() => speakMeaning(word.simpleMeaning)}
                    className="p-2 bg-green-400 text-white rounded-full hover:bg-green-500 transition-colors focus:outline-none focus:ring-4 focus:ring-green-300 flex-shrink-0"
                    aria-label="Read meaning"
                    title="Hear meaning"
                  >
                    🔊
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-xl text-gray-700 mb-2">
                  <span className="font-bold text-purple-600">Forms:</span>{" "}
                  {word.forms}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-xl text-gray-700 italic">
                  <span className="font-bold text-purple-600">Example:</span>{" "}
                  "{word.example}"
                </p>
              </div>

              <button
                onClick={handleNextWord}
                className="mt-6 px-10 py-4 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold text-2xl rounded-full shadow-xl hover:from-green-500 hover:to-blue-500 transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400 flex items-center justify-center gap-3 mx-auto"
                aria-label="Next word"
              >
                Next Word!
                <span className="animate-arrow-bounce inline-block">⏭️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for 3D flip effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes gentle-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
        }
        .animate-gentle-shake {
          animation: gentle-shake 0.4s ease-in-out;
        }
        @keyframes arrow-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-arrow-bounce {
          animation: arrow-bounce 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
