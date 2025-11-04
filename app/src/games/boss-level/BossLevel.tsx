/**
 * Boss Level: Phonics Gauntlet
 * 12-round capstone mixing all game modes
 */

import { useState, useEffect, useRef } from "react";
import { WORDS, type WordEntry } from "./data";
import {
  getCoins,
  addCoins,
  updateMastery,
  recordPhonemeError,
  extractPhoneme,
  getAdaptiveConfig,
  pickRandom,
} from "./utils";
import HUD from "./HUD";
import Confetti from "./confetti";
import {
  FlashMCQ,
  EarTraining,
  SpeedMeaning,
  BalloonPopLite,
  DragDropLite,
  FixupLite,
} from "./rounds";
import EndSummary from "./EndSummary";
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce as announceToSR } from "../shared/accessibility";
import { flushPending } from "../shared/storage";

// ==================== Types ====================

type BossPhase =
  | "intro"
  | "flash"
  | "ear"
  | "speed"
  | "pop"
  | "drag"
  | "fixup"
  | "summary";

export interface RoundData {
  phase: BossPhase;
  word: WordEntry;
  correct: boolean;
  timeSpent: number;
  hintsUsed: number;
}

// ==================== Round Script ====================

const SCRIPT: BossPhase[] = [
  "flash",  // 1
  "ear",    // 2
  "speed",  // 3
  "pop",    // 4
  "drag",   // 5
  "flash",  // 6
  "ear",    // 7
  "speed",  // 8
  "pop",    // 9
  "drag",   // 10
  "fixup",  // 11
  "fixup",  // 12
];

// ==================== Main Component ====================

export default function BossLevel() {
  const [phase, setPhase] = useState<BossPhase>("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  
  const [totalCoins, setTotalCoins] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const announceRef = useRef<HTMLDivElement>(null);
  const srAnnouncerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer
    srAnnouncerRef.current = createAnnouncer();
    document.body.appendChild(srAnnouncerRef.current);

    setTotalCoins(getCoins());

    return () => {
      if (srAnnouncerRef.current) {
        document.body.removeChild(srAnnouncerRef.current);
      }
      flushPending();
    };
  }, []);

  // ==================== Start Game ====================

  const handleStart = () => {
    setPhase(SCRIPT[0]);
    setRoundIndex(0);
    selectNextWord(SCRIPT[0]);
  };

  // ==================== Word Selection ====================

  const selectNextWord = (nextPhase: BossPhase) => {
    let word: WordEntry;
    
    if (nextPhase === "fixup" && rounds.length > 0) {
      // Pick weakest word from this session
      const weakest = [...rounds]
        .filter((r) => !r.correct || r.timeSpent > 8 || r.hintsUsed > 0)
        .sort((a, b) => {
          const scoreA = (a.correct ? 0 : 2) + a.hintsUsed + (a.timeSpent > 8 ? 1 : 0);
          const scoreB = (b.correct ? 0 : 2) + b.hintsUsed + (b.timeSpent > 8 ? 1 : 0);
          return scoreB - scoreA;
        });
      
      word = weakest.length > 0 ? weakest[0].word : pickRandom(WORDS, 1)[0];
    } else {
      const available = WORDS.filter((w) => !usedWords.has(w.id));
      word = available.length > 0 ? pickRandom(available, 1)[0] : pickRandom(WORDS, 1)[0];
    }
    
    setCurrentWord(word);
    setUsedWords((prev) => new Set(prev).add(word.id));
  };

  // ==================== Round Completion ====================

  const handleRoundComplete = (correct: boolean, timeSpent: number, hintsUsedInRound: number) => {
    if (!currentWord) return;
    
    // Update streak
    const newStreak = correct ? streak + 1 : 0;
    const newWrongStreak = correct ? 0 : wrongStreak + 1;
    setStreak(newStreak);
    setWrongStreak(newWrongStreak);
    setHintsUsed(hintsUsed + hintsUsedInRound);
    
    // Calculate coins
    let coinsEarned = 0;
    if (correct) {
      coinsEarned = 2; // base
      
      if (phase === "speed" && timeSpent <= 4) coinsEarned += 3;
      else if (phase === "speed" && timeSpent <= 10) coinsEarned += 1;
      
      if (newStreak >= 5) coinsEarned += 2;
      else if (newStreak >= 3) coinsEarned += 1;
      
      if (phase === "ear" && hintsUsedInRound === 0) coinsEarned += 5;
    }
    
    if (coinsEarned > 0) {
      addCoins(coinsEarned);
      setTotalCoins(totalCoins + coinsEarned);
      setSessionCoins(sessionCoins + coinsEarned);
    }
    
    // Update mastery
    updateMastery(currentWord.id, correct);
    
    // Track phoneme errors
    if (!correct) {
      const phoneme = extractPhoneme(currentWord.ipa);
      if (phoneme) recordPhonemeError(phoneme);
    }
    
    // Save round data
    setRounds((prev) => [
      ...prev,
      { phase, word: currentWord, correct, timeSpent, hintsUsed: hintsUsedInRound },
    ]);
    
    // Announce
    announce(correct ? "Correct! Well done!" : "Oops! Try to remember this one.");
    
    // Show confetti on correct
    if (correct && newStreak % 3 === 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    
    // Advance
    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex >= SCRIPT.length) {
      setPhase("summary");
    } else {
      setRoundIndex(nextRoundIndex);
      const nextPhase = SCRIPT[nextRoundIndex];
      setPhase(nextPhase);
      selectNextWord(nextPhase);
    }
  };

  // ==================== Accessibility ====================

  const announce = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
    }
    announceToSR(srAnnouncerRef.current, message);
  };

  // ==================== Render ====================

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
        <SoundGate gameSlug="boss-level" />
        
        <div className="max-w-md text-center space-y-6">
          <div className="text-8xl">👑</div>
          <h1 className="text-4xl font-bold text-slate-800">Boss Level</h1>
          <h2 className="text-2xl font-semibold text-purple-700">Phonics Gauntlet</h2>
          <p className="text-slate-600">
            12 fast rounds mixing all your skills—meanings, ear-training, speed, balloons, and drag-drop!
          </p>
          <p className="text-sm text-slate-500">
            Earn badges and unlock the <strong>Gold Bee 🐝</strong> sticker!
          </p>
          
          <button
            onClick={handleStart}
            className="min-h-[64px] min-w-[64px] px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xl font-bold shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-purple-400"
          >
            Start Gauntlet 🚀
          </button>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    const accuracy = rounds.length > 0
      ? (rounds.filter((r) => r.correct).length / rounds.length) * 100
      : 0;
    const bestStreak = Math.max(streak, ...rounds.map(() => streak));
    const earRounds = rounds.filter((r) => r.phase === "ear");
    const earAccuracy = earRounds.length > 0
      ? earRounds.filter((r) => r.correct).length / earRounds.length
      : 0;
    const speedBonuses = rounds.filter(
      (r) => r.phase === "speed" && r.correct && r.timeSpent <= 4
    ).length;

    return (
      <EndSummary
        accuracy={accuracy}
        bestStreak={bestStreak}
        sessionCoins={sessionCoins}
        hintsUsed={hintsUsed}
        earAccuracy={earAccuracy}
        speedBonuses={speedBonuses}
        rounds={rounds}
      />
    );
  }

  // ==================== Active Round ====================

  const adaptiveConfig = getAdaptiveConfig(streak, wrongStreak);
  const accuracy = rounds.length > 0
    ? (rounds.filter((r) => r.correct).length / rounds.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <SoundGate gameSlug="boss-level" />
      
      <div className="flex items-center justify-end gap-2 px-6 pt-4">
        <DyslexiaToggle />
        <SoundControl gameSlug="boss-level" />
      </div>
      
      <HUD
        coins={totalCoins}
        streak={streak}
        roundNumber={roundIndex + 1}
        totalRounds={SCRIPT.length}
        accuracy={accuracy}
      />
      
      <Confetti trigger={showConfetti} />
      
      <div
        ref={announceRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      <div className="max-w-4xl mx-auto py-8">
        {currentWord && (
          <>
            {phase === "flash" && (
              <FlashMCQ
                word={currentWord}
                allWords={WORDS}
                onComplete={handleRoundComplete}
                adaptiveConfig={adaptiveConfig}
              />
            )}
            {phase === "ear" && (
              <EarTraining
                word={currentWord}
                allWords={WORDS}
                onComplete={handleRoundComplete}
                adaptiveConfig={adaptiveConfig}
              />
            )}
            {phase === "speed" && (
              <SpeedMeaning
                word={currentWord}
                allWords={WORDS}
                onComplete={handleRoundComplete}
                adaptiveConfig={adaptiveConfig}
              />
            )}
            {phase === "pop" && (
              <BalloonPopLite
                word={currentWord}
                allWords={WORDS}
                onComplete={handleRoundComplete}
                adaptiveConfig={adaptiveConfig}
              />
            )}
            {phase === "drag" && (
              <DragDropLite
                word={currentWord}
                allWords={WORDS}
                onComplete={handleRoundComplete}
                adaptiveConfig={adaptiveConfig}
              />
            )}
            {phase === "fixup" && (
              <FixupLite
                word={currentWord}
                allWords={WORDS}
                onComplete={handleRoundComplete}
                adaptiveConfig={adaptiveConfig}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const gameMeta = {
  slug: "boss-level",
  title: "Boss Level: Phonics Gauntlet",
  description: "12 fast rounds mixing all skills—earn badges and a Gold Bee!",
  tags: ["boss", "mixed", "ipa", "speed", "drag-drop"],
  icon: "👑",
};
