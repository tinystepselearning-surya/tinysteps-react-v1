/**
 * WordCard Component - Compact Mobile-First Layout
 * Single-screen fit with responsive sizing for small devices
 */

import { useState, useEffect, useRef } from "react";
import type { Word } from "./data";
import { speakWord, speakCorrect, speakWrong, updatePhonemeStats, getMinimalPairHint } from "./utils";
import { getWordImageUrl } from "./spellbeeImages";
import ConfettiBurst from "./Confetti";
import TopToolbar from "./TopToolbar";

export type GamePhase = "meaning" | "ear-training" | "ipa" | "speed";

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
      audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnn77RgGwU7k9n0yXUqBSh+zPLaizsKGGS56+mnUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBSh+zPDajTsJF2O269uqUxELTKXh8bllHAU2jdXzzn0vBQ==";
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
      
      const elapsed = timerStartTime ? (Date.now() - timerStartTime) / 1000 : 10;
      const speedBonus = isCorrect ? Math.max(0, Math.floor((10 - elapsed) * 10)) : 0;
      
      if (isCorrect) triggerCelebration();
      
      // Play audio feedback
      const cleanup = isCorrect ? speakCorrect() : speakWrong();
      
      setTimeout(() => {
        cleanup();
        onComplete(isCorrect, false, false, speedBonus);
      }, 1000);
      return;
    }
    
    // Normal flow: proceed to IPA phase
    if (isCorrect) triggerCelebration();
    
    // Play audio feedback
    const cleanup = isCorrect ? speakCorrect() : speakWrong();
    
    setTimeout(() => {
      cleanup();
      setPhase("ipa");
    }, 1000);
  };

  const handleIPASelect = (index: number) => {
    if (selectedIPAIndex !== null) return;
    
    setSelectedIPAIndex(index);
    const isCorrect = index === correctIPAIndex;
    
    if (isCorrect) triggerCelebration();
    
    // Play audio feedback
    const cleanup = isCorrect ? speakCorrect() : speakWrong();

    // Complete the word
    setTimeout(() => {
      cleanup();
      const correctMeaning = selectedMeaningIndex === correctMeaningIndex;
      const correctIPA = isCorrect;
      const earTrainingFirstTry = isEarTrainingRound && earTrainingCorrect === true;
      onComplete(correctMeaning, correctIPA, earTrainingFirstTry);
    }, 1000);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Confetti Burst - absolute overlay */}
      {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}
      
      {/* Cheer Overlay - absolute, non-intrusive */}
      {cheerMessage && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-40">
          <div className="rounded-2xl bg-white/70 backdrop-blur px-4 py-2 text-base sm:text-xl font-semibold text-slate-900 shadow">
            {cheerMessage}
          </div>
        </div>
      )}

      {/* Card Container - flex-1 min-h-0 allows shrinking, relative for toolbar positioning */}
      <div className="relative flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4">
        
        {/* Top Toolbar - book, speaker, volume icons */}
        <TopToolbar 
          onToggleSpeak={() => {
            // Re-speak the current word
            if (phase !== "ear-training") {
              speakWord(word.word);
            }
          }}
        />
        
        {/* Speed Round Timer Bar */}
        {phase === "speed" && (
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm sm:text-base font-bold text-orange-600 animate-pulse">
                ⏱️ SPEED!
              </span>
              <span className="text-sm sm:text-base font-bold text-orange-600">
                {timeLeft}s
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 sm:h-3 shadow-inner overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-400 to-red-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{
                  width: `${(timeLeft / 10) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Word Display - compact */}
        <div className="text-center shrink-0 mt-1 sm:mt-2">
          <div className="text-4xl sm:text-5xl mb-1">{word.icon}</div>
          <h2 className="text-[clamp(18px,4.2vw,28px)] sm:text-3xl font-black text-purple-600 mb-1 leading-tight">
            {phase === "ear-training" ? "???" : word.word}
          </h2>
        </div>

        {/* Picture Area - clamped height, only after ear-training */}
        {phase !== "ear-training" && (
          <div className="shrink-0">
            {wordImageUrl ? (
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/60 max-h-[30svh] sm:max-h-[28svh]">
                <img 
                  src={wordImageUrl} 
                  alt=""
                  className="h-full w-full object-cover rounded-2xl shadow-inner"
                />
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-slate-200/40 bg-slate-50/40 max-h-[30svh] sm:max-h-[28svh] h-[22svh]" />
            )}
          </div>
        )}

        {/* Q&A Section - flex-1 min-h-0 allows it to grow/shrink */}
        <section className="flex-1 min-h-0 flex flex-col justify-center gap-2">
          
          {/* Question Line - responsive text */}
          <h3 className="text-center px-2 leading-snug font-semibold text-[clamp(16px,3.8vw,22px)] sm:text-xl text-slate-700">
            {phase === "speed"
              ? "⚡ Quick! What does it mean?"
              : phase === "ear-training" 
              ? "🔊 Listen and pick the IPA!" 
              : phase === "meaning" 
              ? "What does it mean?" 
              : "What's the IPA?"}
          </h3>

          {/* Ear-Training: Hear It Button */}
          {phase === "ear-training" && !audioPlayed && (
            <div className="text-center shrink-0">
              <button
                onClick={handlePlayAudio}
                className="px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-blue-400 to-purple-400 text-white text-xl sm:text-2xl font-black rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400"
                aria-label="Play audio"
              >
                🔊 Hear it!
              </button>
            </div>
          )}

          {/* Ear-Training: IPA Options (after audio plays) */}
          {phase === "ear-training" && audioPlayed && (
            <div className="shrink-0">
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[880px] mx-auto px-2 shrink-0">
                {ipaOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleEarTrainingSelect(index)}
                    disabled={earTrainingCorrect !== null}
                    className={`group rounded-2xl shadow-md px-3 sm:px-4 py-3 sm:py-4 min-h-[56px] sm:min-h-[64px] w-full text-[clamp(13px,2.9vw,18px)] sm:text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-300 transition ${
                      earTrainingCorrect === null
                        ? ""
                        : earTrainingCorrect && index === correctIPAIndex
                        ? "bg-green-50 ring-2 ring-green-300"
                        : !earTrainingCorrect && index !== correctIPAIndex
                        ? ""
                        : "bg-rose-50 ring-2 ring-rose-300"
                    }`}
                    aria-label={`Option ${index + 1}: ${option}`}
                    aria-pressed={earTrainingCorrect === null ? undefined : index === correctIPAIndex}
                  >
                    {option}
                  </button>
                ))}
              </div>
              
              {/* Minimal-Pair Hint */}
              {minimalPairHint && earTrainingCorrect === false && (
                <div className="mt-3 p-3 bg-yellow-100 rounded-xl border-2 border-yellow-400">
                  <p className="text-sm sm:text-base font-bold text-yellow-800">
                    💡 Hint: {minimalPairHint}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MCQ Options - 3 Horizontal Buttons */}
          {/* Speed Round: Meaning Only */}
          {phase === "speed" && (
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[880px] mx-auto px-2 shrink-0">
              {meaningOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMeaningSelect(index)}
                  disabled={selectedMeaningIndex !== null || timeLeft === 0}
                  className={`group rounded-2xl shadow-md px-3 sm:px-4 py-3 sm:py-4 min-h-[56px] sm:min-h-[64px] w-full text-[clamp(13px,2.9vw,18px)] sm:text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-300 transition ${
                    selectedMeaningIndex === null
                      ? ""
                      : selectedMeaningIndex === index
                      ? index === correctMeaningIndex
                        ? "bg-green-50 ring-2 ring-green-300"
                        : "bg-rose-50 ring-2 ring-rose-300"
                      : index === correctMeaningIndex
                      ? "bg-green-50 ring-2 ring-green-300"
                      : ""
                  }`}
                  aria-label={`Option ${index + 1}: ${option}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Normal: Meaning Phase */}
          {phase === "meaning" && (
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[880px] mx-auto px-2 shrink-0">
              {meaningOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMeaningSelect(index)}
                  disabled={selectedMeaningIndex !== null}
                  className={`group rounded-2xl shadow-md px-3 sm:px-4 py-3 sm:py-4 min-h-[56px] sm:min-h-[64px] w-full text-[clamp(13px,2.9vw,18px)] sm:text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-300 transition ${
                    selectedMeaningIndex === null
                      ? ""
                      : selectedMeaningIndex === index
                      ? index === correctMeaningIndex
                        ? "bg-green-50 ring-2 ring-green-300"
                        : "bg-rose-50 ring-2 ring-rose-300"
                      : index === correctMeaningIndex
                      ? "bg-green-50 ring-2 ring-green-300"
                      : ""
                  }`}
                  aria-label={`Option ${index + 1}: ${option}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* IPA Phase */}
          {phase === "ipa" && (
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[880px] mx-auto px-2 shrink-0">
              {ipaOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleIPASelect(index)}
                  disabled={selectedIPAIndex !== null}
                  className={`group rounded-2xl shadow-md px-3 sm:px-4 py-3 sm:py-4 min-h-[56px] sm:min-h-[64px] w-full text-[clamp(13px,2.9vw,18px)] sm:text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-300 transition ${
                    selectedIPAIndex === null
                      ? ""
                      : selectedIPAIndex === index
                      ? index === correctIPAIndex
                        ? "bg-green-50 ring-2 ring-green-300"
                        : "bg-rose-50 ring-2 ring-rose-300"
                      : index === correctIPAIndex
                      ? "bg-green-50 ring-2 ring-green-300"
                      : ""
                  }`}
                  aria-label={`Option ${index + 1}: ${option}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
