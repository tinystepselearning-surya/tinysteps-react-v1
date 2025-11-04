/**
 * SpellBeeFlashTrainer - Main Game Component
 * State machine for word learning with MCQ and card flip
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { WORDS, type Word } from "./data";
import WordCard from "./WordCard";
import SummaryScreen from "./SummaryScreen";
import SoundGate from "../shared/SoundGate";
import GameViewport from "./GameViewport";
import { createAnnouncer, announce } from "../shared/accessibility";
import { flushPending } from "../shared/storage";
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
  checkAchievements,
  calculateCoins,
  getFixUpWords,
  saveFixUpReport,
  type FixUpReport,
  loadQuests,
  saveQuests,
  updateQuestProgress,
  type QuestsState,
  saveMasteryDataDebounced,
  saveCoinsDebounced,
  logEvent,
  listWordsForGroup
} from "./utils";
import DebugPanel from "./DebugPanel";
import { 
  clearAllTimers, 
  primeAudio, 
  primeSpeech,
  flushDebouncedWrites 
} from "./helpers";

export const gameMeta = {
  slug: "spellbee-flash",
  title: "SpellBee Flash Trainer",
  description: "MCQ for meanings + IPA with kid-friendly flip cards",
  tags: ["spellbee", "ipa", "meanings", "flashcards"],
  icon: "🧠"
};

type GameMode = "normal" | "fixup";

export default function SpellBeeFlashTrainer() {
  // Check for debug mode from URL
  const isDebugMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
  
  // Accessibility announcer
  const announcerRef = useRef<HTMLDivElement | null>(null);
  
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [ipaStreak, setIpaStreak] = useState(0); // Track consecutive IPA correct answers
  const [completed, setCompleted] = useState(false);
  const [totalCoins, setTotalCoins] = useState(getTotalCoins());
  const [sessionStartCoins] = useState(getTotalCoins()); // Track coins at start
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [showBrainBreak, setShowBrainBreak] = useState(false);
  const [sparkEffect, setSparkEffect] = useState(false);
  const [recentMistakes, setRecentMistakes] = useState<number[]>([]);
  const [fixUpReport, setFixUpReport] = useState<FixUpReport | null>(null);
  const [_questsState, setQuestsState] = useState<QuestsState>(() => loadQuests());
  const [questCelebration, setQuestCelebration] = useState<string | null>(null);

  // Shuffle words once on mount (or use fix-up words)
  const shuffledWords = useMemo(() => {
    if (gameMode === "fixup") {
      const fixUpIndices = getFixUpWords(recentMistakes, WORDS.length);
      logEvent("fixup_start", { wordCount: fixUpIndices.length });
      return fixUpIndices.map((idx) => WORDS[idx]);
    }
    return shuffle(WORDS);
  }, [gameMode, recentMistakes]);

  // Initialize speech synthesis and audio on mount + cleanup on unmount
  useEffect(() => {
    // Create announcer
    announcerRef.current = createAnnouncer();
    document.body.appendChild(announcerRef.current);
    
    initializeSpeech();
    
    // Pre-warm audio after first user gesture
    const handleFirstClick = () => {
      primeAudio();
      const result = primeSpeech();
      if (!result.success && result.message) {
        // Could show a toast here if needed
        console.info(result.message);
      }
      document.removeEventListener("click", handleFirstClick);
    };
    document.addEventListener("click", handleFirstClick, { once: true });
    
    // Cleanup: flush debounced writes and clear timers
    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
      flushDebouncedWrites();
      flushPending();
      clearAllTimers();
      document.removeEventListener("click", handleFirstClick);
    };
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

  // Generate MCQ options for current word (3 options each)
  const meaningMCQ = useMemo(() => {
    const allMeanings = WORDS.map((w: Word) => w.meaning);
    return generateMCQOptions(allMeanings, currentWord.meaning, 3);
  }, [currentWord]);

  const ipaMCQ = useMemo(() => {
    const allIPAs = WORDS.map((w: Word) => w.ipa);
    return generateMCQOptions(allIPAs, currentWord.ipa, 3);
  }, [currentWord]);

  // Helper to update quests
  const updateQuest = (questId: string, increment: number) => {
    setQuestsState((prev) => {
      const updatedQuests = updateQuestProgress(prev.quests, questId, increment);
      const newState = { ...prev, quests: updatedQuests };
      
      // Check if quest just completed
      const justCompleted = updatedQuests.find(
        (q) => q.id === questId && q.done && prev.quests.find((pq) => pq.id === questId && !pq.done)
      );
      if (justCompleted) {
        setQuestCelebration(justCompleted.icon);
        setTimeout(() => setQuestCelebration(null), 3000);
        logEvent("quest_progress", { questId, completed: true });
      } else {
        const quest = updatedQuests.find((q) => q.id === questId);
        if (quest) {
          logEvent("quest_progress", { questId, progress: quest.progress, target: quest.target });
        }
      }
      
      saveQuests(newState);
      return newState;
    });
  };

  // Handle word completion
  const handleWordComplete = (
    correctMeaning: boolean, 
    correctIPA: boolean, 
    earTrainingBonus = false, 
    speedBonus = 0
  ) => {
    // Log answer event
    logEvent("answered", { 
      word: currentWord.word,
      correctMeaning, 
      correctIPA,
      earTrainingBonus,
      speedBonus
    });
    
    // Update score
    let newScore = score;
    const correctCount = (correctMeaning ? 1 : 0) + (correctIPA ? 1 : 0);
    newScore += correctCount;
    setScore(newScore);

    // Log correct/wrong
    if (correctMeaning && correctIPA) {
      logEvent("correct", { word: currentWord.word, bothCorrect: true });
      announce(announcerRef.current, "Correct! Well done!");
    } else {
      logEvent("wrong", { word: currentWord.word, correctMeaning, correctIPA });
      announce(announcerRef.current, "Not quite. Keep trying!");
    }

    // Update streak
    const bothCorrect = correctMeaning && correctIPA;
    let newStreak = streak;
    let newMaxStreak = maxStreak;
    if (bothCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      newMaxStreak = Math.max(maxStreak, newStreak);
      setMaxStreak(newMaxStreak);
      
      // Spark effect for streak milestones (including speed bonus)
      if (newStreak === 5 || newStreak === 10 || newStreak === 15 || speedBonus === 3) {
        setSparkEffect(true);
        setTimeout(() => setSparkEffect(false), 2000);
      }
    } else {
      setStreak(0);
    }

    // Calculate and award coins (10 coins per correct + streak bonus + ear-training + speed bonus)
    let earnedCoins = calculateCoins(correctCount, newStreak);
    if (earTrainingBonus) {
      earnedCoins += 5; // Bonus 5 coins for first-try ear-training success
    }
    earnedCoins += speedBonus; // Speed bonus: 0, 1, or 3 coins
    if (earnedCoins > 0) {
      const newTotal = addCoins(earnedCoins);
      setTotalCoins(newTotal);
      saveCoinsDebounced(newTotal); // Debounced save
      
      // Update coin quest
      updateQuest("coins_25", earnedCoins);
    }

    // Update quests based on performance
    if (newStreak >= 5) {
      updateQuest("streak_5", 1);
    }
    if (speedBonus === 3) {
      logEvent("speed_bonus", { word: currentWord.word, bonus: speedBonus });
      updateQuest("speed_2", 1);
    }
    if (correctIPA) {
      updateQuest("ipa_3", 1);
      
      // Track IPA streak for recurring rewards (every 3 correct)
      const newIpaStreak = ipaStreak + 1;
      setIpaStreak(newIpaStreak);
      
      // Award bonus coins and badge every 3 IPA correct
      if (newIpaStreak % 3 === 0) {
        const ipaBonus = 15; // 15 bonus coins for every 3 IPA correct
        const bonusTotal = addCoins(ipaBonus);
        setTotalCoins(bonusTotal);
        saveCoinsDebounced(bonusTotal);
        
        setNewBadge(`🔊 IPA Master +${ipaBonus} coins!`);
        setTimeout(() => setNewBadge(null), 3000);
        
        // Spark effect for celebration
        setSparkEffect(true);
        setTimeout(() => setSparkEffect(false), 2000);
      }
    } else {
      // Reset IPA streak on incorrect
      setIpaStreak(0);
    }

    // Update mastery for this word
    const wordIndex = WORDS.findIndex((w: { word: string }) => w.word === currentWord.word);
    if (wordIndex !== -1) {
      const masteryData = getMasteryData();
      const prevMastery = masteryData.get(wordIndex);
      const updatedMastery = updateMastery(wordIndex, bothCorrect, masteryData);
      saveMasteryDataDebounced(updatedMastery); // Debounced save
      
      // Check if word was just mastered (went from not mastered to mastered)
      const mastery = updatedMastery.get(wordIndex);
      const wasNotMastered = !prevMastery || !prevMastery.mastered;
      const isNowMastered = mastery && mastery.mastered;
      
      if (wasNotMastered && isNowMastered) {
        logEvent("bucket_up", { word: currentWord.word, bucket: "mastered" });
        updateQuest("master_3", 1);
      } else if (mastery && prevMastery && mastery.correct < prevMastery.correct) {
        logEvent("bucket_down", { word: currentWord.word, correct: mastery.correct });
      }
      
      // Track mistakes for fix-up mode (only in normal mode)
      if (!bothCorrect && gameMode === "normal") {
        setRecentMistakes((prev) => [...prev, wordIndex]);
      }
    }

    // Check for new badges
    const newlyEarned = checkBadges(newScore, currentWordIndex + 1, newStreak, newMaxStreak);
    if (newlyEarned.length > 0) {
      setNewBadge(`${newlyEarned[0].icon} ${newlyEarned[0].name}`);
      setTimeout(() => setNewBadge(null), 3000);
    }

    // Check for achievement milestones (10, 25, 50, 100, all mastered)
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
      // Show first achievement earned
      setNewBadge(`${newAchievements[0].icon} ${newAchievements[0].name}!`);
      setTimeout(() => setNewBadge(null), 4000);
      
      // Award bonus coins for achievements
      const achievementBonus = 50; // 50 coins per achievement
      const bonusTotal = addCoins(achievementBonus);
      setTotalCoins(bonusTotal);
      saveCoinsDebounced(bonusTotal);
      
      // Spark effect for achievement
      setSparkEffect(true);
      setTimeout(() => setSparkEffect(false), 2000);
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
      
      // Save progress (normal mode)
      if (gameMode === "normal") {
        const accuracy = Math.round((newScore / (shuffledWords.length * 2)) * 100);
        saveProgress({
          score: newScore,
          totalWords: shuffledWords.length,
          accuracy,
          streak: newMaxStreak,
          completedAt: new Date().toISOString(),
        });
      } else if (gameMode === "fixup") {
        // Save fix-up report
        const fixUpIndices = getFixUpWords(recentMistakes, WORDS.length);
        const report: FixUpReport = {
          wordIds: fixUpIndices,
          correct: newScore,
          wrong: shuffledWords.length * 2 - newScore,
          timestamp: new Date().toISOString(),
        };
        saveFixUpReport(report);
        setFixUpReport(report);
        
        // Award badge if 4/5 correct
        if (newScore >= 8) { // 4 out of 5 words (2 questions each)
          setNewBadge("🩹 Fix-Up Hero!");
          setTimeout(() => setNewBadge(null), 3000);
        }
        
        // Update fix-up quest
        updateQuest("fixup_1", 1);
        logEvent("fixup_finish", { correct: newScore, wrong: shuffledWords.length * 2 - newScore });
      }
    } else {
      setCurrentWordIndex(nextIndex);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    setGameMode("normal");
    setCurrentWordIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCompleted(false);
    setRecentMistakes([]);
    setFixUpReport(null);
  };

  // Handle fix-up mode start
  const handleStartFixUp = () => {
    setGameMode("fixup");
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
    const coinsEarned = totalCoins - sessionStartCoins;
    const sessionWordsList = shuffledWords.map((w) => w.word);
    
    return (
      <SummaryScreen
        score={score}
        totalWords={shuffledWords.length}
        streak={maxStreak}
        mistakeCount={gameMode === "normal" ? recentMistakes.length : 0}
        fixUpReport={gameMode === "fixup" ? fixUpReport : null}
        sessionWords={sessionWordsList}
        coinsEarned={coinsEarned}
        totalCoins={totalCoins}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
        onStartFixUp={gameMode === "normal" && recentMistakes.length > 0 ? handleStartFixUp : undefined}
        onCoinsUpdate={setTotalCoins}
      />
    );
  }

  return (
    <GameViewport>
      {/* Relative wrapper for absolute positioning + scroll margin for navbar */}
      <div className="relative h-full flex flex-col scroll-mt-[84px]">
        {/* Sound Gate */}
        <SoundGate gameSlug="spellbee-flash" />
        
        {/* Left Overlay removed to keep game screen clean for kids */}
        {/* Quest panel moved out - answers should always be visible */}
        {/* <LeftOverlay 
          coins={totalCoins}
          score={score}
          quests={questsState.quests}
        /> */}

        {/* Quest Celebration Toast */}
        {questCelebration && (
          <div 
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce"
            role="alert"
            aria-live="polite"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full shadow-2xl text-2xl font-bold">
              {questCelebration} Quest Complete!
            </div>
          </div>
        )}

        {/* HUD: Compact header with coins/streak - shrink-0 */}
        {/* Hidden on md+ since LeftOverlay shows Coins/Score */}
        <div className="shrink-0">
          {/* Back button - moved to bottom-left floating for better UX */}
          <button
            onClick={handleExit}
            className="fixed bottom-4 left-4 z-40 min-h-[64px] min-w-[64px] px-5 py-3 bg-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-3xl hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 text-base sm:text-lg"
            aria-label="Go back to game selection"
          >
            ← Back
          </button>

          {/* Coins/Score/Streak badges - now always visible since quest panel removed */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            {/* Coin Counter - improved contrast */}
            <div className="bg-yellow-500 text-gray-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-md">
              🪙 {totalCoins}
            </div>

            {/* Streak Badge */}
            {streak > 0 && (
              <div className="bg-orange-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold shadow-md text-sm sm:text-base">
                🔥 {streak}
              </div>
            )}

            {/* Score Display - improved contrast */}
            <div className="bg-purple-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-md">
              Score: {score}
            </div>
          </div>        {/* Progress Bar */}
        <div className="bg-white rounded-full h-3 shadow-inner overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              gameMode === "fixup" 
                ? "bg-gradient-to-r from-yellow-400 to-orange-400" 
                : "bg-gradient-to-r from-green-400 to-blue-400"
            }`}
            style={{
              width: `${((currentWordIndex + 1) / shuffledWords.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-center text-purple-700 font-bold mt-2">
          {gameMode === "fixup" 
            ? `Practice ${currentWordIndex + 1} of ${shuffledWords.length}`
            : `Word ${currentWordIndex + 1} of ${shuffledWords.length}`}
        </p>
      </div>

      {/* Main content area - flex-1 min-h-0 for proper flex shrinking */}
      <main className="flex-1 min-h-0 flex flex-col">
        {/* Word Card */}
        <WordCard
          key={currentWord.word}
          word={currentWord}
          meaningOptions={meaningMCQ.options}
          ipaOptions={ipaMCQ.options}
          correctMeaningIndex={meaningMCQ.correctIndex}
          correctIPAIndex={ipaMCQ.correctIndex}
          masteryLevel={currentWordMastery}
          isSpeedRound={gameMode === "normal" && (currentWordIndex + 1) % 5 === 0}
          isEarTrainingRound={gameMode === "normal" && (currentWordIndex + 1) % 3 === 0 && (currentWordIndex + 1) % 5 !== 0}
          onComplete={handleWordComplete}
          onTimeout={() => {
            // Speed round timeout - show brief message
            setNewBadge("⏱️ Time's Up!");
            setTimeout(() => setNewBadge(null), 2000);
          }}
        />
      </main>

      {/* Spark Effect for Streak Milestones */}
      {sparkEffect && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="text-9xl animate-ping">✨</div>
          <div className="text-6xl absolute animate-spin">🌟</div>
        </div>
      )}

      {/* New Badge Notification - moved to bottom-right, non-interactive */}
      {newBadge && (
        <div 
          className="pointer-events-none fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 bg-gradient-to-r from-yellow-300 to-orange-400 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl shadow-2xl"
          role="alert"
          aria-live="polite"
        >
          <p className="text-lg md:text-2xl font-black">New Badge!</p>
          <p className="text-2xl md:text-3xl mt-1 md:mt-2">{newBadge}</p>
        </div>
      )}

      {/* Brain Break Modal */}
      {showBrainBreak && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="brain-break-title"
        >
          <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-2xl text-center shadow-2xl">
            <h2 id="brain-break-title" className="text-4xl sm:text-5xl font-black text-purple-600 mb-4">Brain Break!</h2>
            <p className="text-xl sm:text-2xl text-purple-700 mb-6 sm:mb-8">
              Great job! Take a deep breath and stretch your arms up high!
            </p>
            <p className="text-lg sm:text-xl text-purple-600 mb-6 sm:mb-8" aria-live="polite">
              You've learned 12 words! Ready to continue?
            </p>
            <button
              onClick={() => setShowBrainBreak(false)}
              className="min-h-[64px] min-w-[200px] px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl sm:text-2xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-green-500 focus:ring-offset-2"
              aria-label="Continue to next word"
            >
              Let's Go!
            </button>
          </div>
        </div>
      )}

      {/* Debug Panel (only in debug mode) */}
      {isDebugMode && <DebugPanel />}
      </div> {/* End of relative wrapper */}
    </GameViewport>
  );
}

/**
 * Hook to start a specific group from the GroupDashboard
 * 
 * Example usage in router:
 * 
 * // In your router component:
 * import { useStartGroup } from './games/spellbee-flash/SpellBeeFlashTrainer';
 * 
 * function YourRouter() {
 *   const startGroup = useStartGroup();
 *   
 *   // When user clicks "Start" in GroupDashboard:
 *   const handleGroupStart = (groupId: string) => {
 *     startGroup(groupId);
 *     navigate('/games/spellbee-flash'); // or your route
 *   };
 * }
 */
export function useStartGroup(): (groupId: string) => void {
  return (groupId: string) => {
    // Save the selected group to localStorage
    localStorage.setItem('spellbee-last-group-v1', groupId);
    
    // Get words for this group
    const groupWords = listWordsForGroup(WORDS, groupId);
    
    // Log the start event
    logEvent('group_start', { 
      groupId, 
      wordCount: groupWords.length 
    });
    
    // Note: The SpellBeeFlashTrainer component will need to be updated
    // to read this localStorage key and filter words on mount.
    // This is left as a TODO for when router integration is ready.
  };
}
