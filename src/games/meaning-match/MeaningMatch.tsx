/**
 * MeaningMatch - Main game orchestrator
 * Drag words to their meanings and IPA symbols
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { WORDS, type Word } from "./data";
import {
  pickWords,
  shuffle,
  getCoins,
  addCoins,
  addStrugglingWord,
  getStrugglingWordObjects,
  clearStrugglingWords,
  speakWord,
  getMinimalPairHint,
  updateMasteryRecord,
  checkAchievements,
} from "./utils";
import { DraggableTile } from "./DraggableTile";
import { DropZone } from "./DropZone";
import { RoundSummary } from "./RoundSummary";
import SoundGate from "../shared/SoundGate";
import SoundControl from "../shared/SoundControl";
import DyslexiaToggle from "../shared/DyslexiaToggle";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";
import { playCelebrationSound, areSoundsEnabled, toggleSounds } from "./soundEffects";

const TOTAL_ROUNDS = 5;
const WORDS_PER_ROUND = 3;

interface MatchState {
  meaningWordId: string | null;
  ipaWordId: string | null;
  meaningCorrect: boolean;
  ipaCorrect: boolean;
  meaningAttempts: number;
  ipaAttempts: number;
}

type GameMode = "playing" | "round-summary" | "game-complete" | "practice";

export default function MeaningMatch() {
  const [gameMode, setGameMode] = useState<GameMode>("playing");
  const [currentRound, setCurrentRound] = useState(1);
  const [roundWords, setRoundWords] = useState<Word[]>([]);
  const [recentWordIds, setRecentWordIds] = useState<Set<string>>(new Set());
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [coinsThisRound, setCoinsThisRound] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matchesThisRound, setMatchesThisRound] = useState(0);
  const [showHintTargets, setShowHintTargets] = useState<Set<string>>(
    new Set()
  );
  const [liveMessage, setLiveMessage] = useState("");
  const [matchStates, setMatchStates] = useState<Record<string, MatchState>>(
    {}
  );
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [soundsEnabled, setSoundsEnabled] = useState(areSoundsEnabled());

  const announcerRef = useRef<HTMLDivElement | null>(null);

  // Initialize round
  useEffect(() => {
    if (gameMode === "playing" || gameMode === "practice") {
      const words =
        gameMode === "practice"
          ? getStrugglingWordObjects(WORDS).slice(0, WORDS_PER_ROUND)
          : pickWords(WORDS, WORDS_PER_ROUND, recentWordIds);

      setRoundWords(words);

      // Initialize match states
      const states: Record<string, MatchState> = {};
      words.forEach((w) => {
        states[w.word] = {
          meaningWordId: null,
          ipaWordId: null,
          meaningCorrect: false,
          ipaCorrect: false,
          meaningAttempts: 0,
          ipaAttempts: 0,
        };
      });
      setMatchStates(states);
      setCoinsThisRound(0);
      setMatchesThisRound(0);
      setShowHintTargets(new Set());
      setSelectedWordId(null);
    }
  }, [gameMode, currentRound, recentWordIds]);

  // Load coins on mount
  useEffect(() => {
    // Create announcer
    announcerRef.current = createAnnouncer();
    document.body.appendChild(announcerRef.current);

    setTotalCoins(getCoins());

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
      flushPending();
    };
  }, []);

  // Shuffled meanings and IPAs
  const shuffledMeanings = useMemo(
    () => shuffle(roundWords.map((w) => w.simpleMeaning)),
    [roundWords]
  );

  const shuffledIPAs = useMemo(
    () => shuffle(roundWords.map((w) => w.ipa)),
    [roundWords]
  );

  const handleDrop = (wordId: string, targetId: string) => {
    const word = roundWords.find((w) => w.word === wordId);
    if (!word) return;

    const [targetType, targetValue] = targetId.split(":");
    const isCorrect =
      (targetType === "meaning" && targetValue === word.simpleMeaning) ||
      (targetType === "ipa" && targetValue === word.ipa);

    const currentState = matchStates[wordId];
    const updatedState = { ...currentState };

    if (targetType === "meaning") {
      updatedState.meaningAttempts += 1;
      updatedState.meaningWordId = wordId;
      updatedState.meaningCorrect = isCorrect;
    } else {
      updatedState.ipaAttempts += 1;
      updatedState.ipaWordId = wordId;
      updatedState.ipaCorrect = isCorrect;
    }

    setMatchStates((prev) => ({ ...prev, [wordId]: updatedState }));

    if (isCorrect) {
      // Play celebration sound
      playCelebrationSound();
      
      // Award coins
      const coinValue = updatedState.meaningAttempts === 1 || updatedState.ipaAttempts === 1 ? 5 : 2;
      const newCoins = addCoins(coinValue);
      setTotalCoins(newCoins);
      setCoinsThisRound((prev) => prev + coinValue);
      setMatchesThisRound((prev) => prev + 1);
      setTotalMatches((prev) => prev + 1);

      announce(announcerRef.current, "Correct match!");
      setLiveMessage("Correct match!");
      setTimeout(() => setLiveMessage(""), 2000);

      // Check for word completion (both meaning and IPA correct)
      const bothComplete =
        (targetType === "meaning" && updatedState.ipaCorrect) ||
        (targetType === "ipa" && updatedState.meaningCorrect);
        
      if (bothComplete) {
        announce(announcerRef.current, `Nice! ${word.word} complete!`);
        setLiveMessage(`⭐ Nice! ${word.word} complete!`);
        
        // Update mastery tracking
        const meaningCorrectFirst = updatedState.meaningAttempts === 1;
        const ipaCorrectFirst = updatedState.ipaAttempts === 1;
        updateMasteryRecord(wordId, meaningCorrectFirst, ipaCorrectFirst, true);
        
        // Check for new achievements
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
          const ach = newAchievements[0];
          setNewBadge(`${ach.icon} ${ach.name}!`);
          setTimeout(() => setNewBadge(null), 4000);
          
          // Bonus coins for achievement
          const bonusCoins = addCoins(50);
          setTotalCoins(bonusCoins);
          setCoinsThisRound((prev) => prev + 50);
        }
      }
    } else {
      announce(announcerRef.current, "Not quite. Try again!");
      setLiveMessage("Try again!");
      setTimeout(() => setLiveMessage(""), 2000);

      // Track struggling if 2+ attempts
      if (updatedState.meaningAttempts >= 2 || updatedState.ipaAttempts >= 2) {
        addStrugglingWord(wordId);
      }
    }

    // Clear selection
    setSelectedWordId(null);
  };

  const handleKeyboardDrop = (targetId: string) => {
    if (!selectedWordId) return;
    handleDrop(selectedWordId, targetId);
  };

  const handlePickup = (wordId: string) => {
    setSelectedWordId(wordId);
  };

  const handleKeyboardSelect = (wordId: string) => {
    if (selectedWordId === wordId) {
      setSelectedWordId(null); // Deselect
    } else {
      setSelectedWordId(wordId);
    }
  };

  const handleShowHint = () => {
    // Find first incomplete target
    for (const word of roundWords) {
      const state = matchStates[word.word];
      if (!state.meaningCorrect) {
        const hintId = `meaning:${word.simpleMeaning}`;
        setShowHintTargets(new Set([hintId]));
        setTimeout(() => setShowHintTargets(new Set()), 1200);
        return;
      }
      if (!state.ipaCorrect) {
        const hintId = `ipa:${word.ipa}`;
        setShowHintTargets(new Set([hintId]));
        setTimeout(() => setShowHintTargets(new Set()), 1200);
        return;
      }
    }
  };

  const handleSpeakWord = (word: string) => {
    speakWord(word);
  };

  // Check if round complete
  const isRoundComplete = roundWords.every((w) => {
    const state = matchStates[w.word];
    return state?.meaningCorrect && state?.ipaCorrect;
  });

  useEffect(() => {
    if (isRoundComplete && roundWords.length > 0 && gameMode === "playing") {
      // Round bonus
      const bonusCoins = addCoins(5);
      setTotalCoins(bonusCoins);
      setCoinsThisRound((prev) => prev + 5);

      // Update recent words
      setRecentWordIds(
        new Set(roundWords.map((w) => w.word))
      );

      // Show summary after delay
      setTimeout(() => {
        if (currentRound >= TOTAL_ROUNDS) {
          setGameMode("game-complete");
        } else {
          setGameMode("round-summary");
        }
      }, 1500);
    }
  }, [isRoundComplete, roundWords, currentRound, gameMode]);

  const handleContinue = () => {
    setCurrentRound((prev) => prev + 1);
    setGameMode("playing");
  };

  const handlePracticeTricky = () => {
    setGameMode("practice");
  };

  const handlePlayAgain = () => {
    setCurrentRound(1);
    setTotalMatches(0);
    setRecentWordIds(new Set());
    clearStrugglingWords();
    setGameMode("playing");
  };

  // Check if hint button should show (2+ failed attempts in round)
  const shouldShowHintButton = Object.values(matchStates).some(
    (state) =>
      (state.meaningAttempts >= 2 && !state.meaningCorrect) ||
      (state.ipaAttempts >= 2 && !state.ipaCorrect)
  );

  const trickyWords = getStrugglingWordObjects(WORDS);

  // Render summary screens
  if (gameMode === "round-summary" || gameMode === "game-complete") {
    return (
      <RoundSummary
        isGameComplete={gameMode === "game-complete"}
        currentRound={currentRound}
        totalRounds={TOTAL_ROUNDS}
        matchesThisRound={matchesThisRound}
        totalMatches={totalMatches}
        coinsEarned={coinsThisRound}
        totalCoins={totalCoins}
        trickyWords={trickyWords}
        onContinue={handleContinue}
        onPracticeTricky={handlePracticeTricky}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-4 sm:p-8 relative">
      <SoundGate gameSlug="meaning-match" />
      
      {/* Floating Back Button */}
      <button
        onClick={() => window.history.back()}
        className="fixed bottom-4 left-4 z-40 min-h-[64px] min-w-[64px] px-5 py-3 bg-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-3xl hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 text-base sm:text-lg"
        aria-label="Go back"
      >
        ← Back
      </button>

      {/* View Progress Button */}
      <button
        onClick={() => window.location.href = '/kids/games/meaning-match/dashboard'}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 min-h-[64px] px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-blue-500 focus:ring-offset-2 text-base sm:text-lg"
        aria-label="View progress dashboard"
      >
        <span>📊</span>
        <span className="hidden sm:inline">Progress</span>
      </button>

      {/* Achievement Badge Notification */}
      {newBadge && (
        <div 
          className="pointer-events-none fixed bottom-24 right-4 md:bottom-20 md:right-8 z-50 bg-gradient-to-r from-yellow-300 to-orange-400 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl shadow-2xl animate-bounce"
          role="alert"
          aria-live="polite"
        >
          <p className="text-lg md:text-2xl font-black">Achievement!</p>
          <p className="text-2xl md:text-3xl mt-1 md:mt-2">{newBadge}</p>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-purple-600">
                🧩 Meaning-Match
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                {gameMode === "practice"
                  ? "Practice Mode"
                  : `Round ${currentRound} of ${TOTAL_ROUNDS}`}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4 items-center flex-wrap">
              {/* Sound Mute Toggle */}
              <button
                onClick={() => {
                  const newValue = toggleSounds();
                  setSoundsEnabled(newValue);
                }}
                className="min-h-[56px] min-w-[56px] px-3 py-2 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-2xl focus:outline-none focus:ring-[3px] focus:ring-purple-500"
                aria-label={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
                aria-pressed={soundsEnabled}
              >
                {soundsEnabled ? "🔔" : "🔕"}
              </button>
              
              <DyslexiaToggle />
              <SoundControl gameSlug="meaning-match" />
              <div className="bg-gradient-to-r from-yellow-300 to-orange-300 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-lg">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  💰 {totalCoins}
                </p>
              </div>
              {shouldShowHintButton && (
                <button
                  onClick={handleShowHint}
                  className="min-h-[64px] px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-400"
                  aria-label="Show hint for next match"
                >
                  💡 Hint
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live region for announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveMessage}
        </div>

        {/* Game board */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Word tiles */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              📝 Drag these words:
            </h2>
            <div className="flex gap-4 justify-center flex-wrap">
              {roundWords.map((word) => {
                const state = matchStates[word.word];
                const isPlaced = state?.meaningCorrect && state?.ipaCorrect;
                return (
                  <div key={word.word} className="relative">
                    <DraggableTile
                      word={word.word}
                      wordId={word.word}
                      isPlaced={isPlaced}
                      isSelected={selectedWordId === word.word}
                      onPickup={handlePickup}
                      onKeyboardSelect={handleKeyboardSelect}
                    />
                    {/* Show completion star */}
                    {isPlaced && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce">
                        ⭐
                      </div>
                    )}
                    {/* Speak button */}
                    {!isPlaced && window.speechSynthesis && (
                      <button
                        onClick={() => handleSpeakWord(word.word)}
                        className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-400 text-white rounded-full text-sm font-semibold hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400"
                        aria-label={`Hear word: ${word.word}`}
                      >
                        🔊 Hear
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drop zones */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Meanings column */}
            <div>
              <h2 className="text-2xl font-bold text-green-700 mb-4">
                📖 Meanings
              </h2>
              <div className="space-y-4">
                {shuffledMeanings.map((meaning) => {
                  const word = roundWords.find(
                    (w) => w.simpleMeaning === meaning
                  );
                  const state = word ? matchStates[word.word] : null;
                  const targetId = `meaning:${meaning}`;
                  return (
                    <DropZone
                      key={targetId}
                      targetId={targetId}
                      targetType="meaning"
                      label={meaning}
                      correctWordId={word?.word || ""}
                      placedWordId={state?.meaningWordId || null}
                      isCorrect={state?.meaningCorrect || false}
                      showHint={showHintTargets.has(targetId)}
                      onDrop={handleDrop}
                      onKeyboardDrop={handleKeyboardDrop}
                    />
                  );
                })}
              </div>
            </div>

            {/* IPA column */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">
                🔊 IPA Symbols
              </h2>
              <div className="space-y-4">
                {shuffledIPAs.map((ipa) => {
                  const word = roundWords.find((w) => w.ipa === ipa);
                  const state = word ? matchStates[word.word] : null;
                  const targetId = `ipa:${ipa}`;
                  const hint =
                    state && state.ipaAttempts >= 2 && !state.ipaCorrect
                      ? getMinimalPairHint(ipa)
                      : "";
                  return (
                    <div key={targetId}>
                      <DropZone
                        targetId={targetId}
                        targetType="ipa"
                        label={ipa}
                        correctWordId={word?.word || ""}
                        placedWordId={state?.ipaWordId || null}
                        isCorrect={state?.ipaCorrect || false}
                        showHint={showHintTargets.has(targetId)}
                        onDrop={handleDrop}
                        onKeyboardDrop={handleKeyboardDrop}
                      />
                      {hint && (
                        <p className="text-sm text-purple-600 mt-1 ml-2">
                          💡 {hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/80 rounded-2xl p-6 text-center">
          <p className="text-lg text-gray-700">
            <span className="font-bold">Mouse:</span> Drag each word to its
            meaning AND IPA symbol
            <br />
            <span className="font-bold">Keyboard:</span> Press Enter on a word,
            then Enter on a target
          </p>
        </div>
      </div>
    </div>
  );
}

export const gameMeta = {
  slug: "meaning-match",
  title: "Meaning-Match Drag-Drop",
  description: "Drag words to their meanings and IPA symbols.",
  tags: ["drag-drop", "ipa", "meanings", "phonics"],
  icon: "🧩",
};
