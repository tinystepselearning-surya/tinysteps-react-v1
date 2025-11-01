/**
 * Utility functions for SpellBee Flash Trainer
 */

/**
 * Fisher-Yates shuffle algorithm
 * Shuffles an array in place and returns it
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate random wrong options for MCQ
 * Ensures the correct answer is NOT in the wrong options
 */
export function generateWrongOptions<T>(
  allOptions: T[],
  correctOption: T,
  count: number
): T[] {
  const filtered = allOptions.filter((opt) => opt !== correctOption);
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, count);
}

/**
 * Generate MCQ options with correct answer randomly positioned
 * Returns { options: T[], correctIndex: number }
 */
export function generateMCQOptions<T>(
  allOptions: T[],
  correctOption: T,
  totalOptions: number
): { options: T[]; correctIndex: number } {
  const wrongOptions = generateWrongOptions(
    allOptions,
    correctOption,
    totalOptions - 1
  );
  const allMCQOptions = [correctOption, ...wrongOptions];
  const shuffledOptions = shuffle(allMCQOptions);
  const correctIndex = shuffledOptions.indexOf(correctOption);

  return {
    options: shuffledOptions,
    correctIndex,
  };
}

/**
 * Ensure non-repeating options by checking uniqueness
 */
export function ensureNonRepeatingOptions<T>(options: T[]): T[] {
  return Array.from(new Set(options));
}

/**
 * Play audio with error handling
 * Returns cleanup function
 */
export function playAudio(src: string): () => void {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch((err) => {
      console.warn("Audio playback failed:", err);
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  } catch (err) {
    console.warn("Audio creation failed:", err);
    return () => {};
  }
}

/**
 * Speak text using Web Speech API with female American accent
 * Kid-friendly voice for Indian kids learning English
 */
export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  }
): () => void {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice properties for kid-friendly American accent
  utterance.rate = options?.rate || 0.85; // Slightly slower for clarity
  utterance.pitch = options?.pitch || 1.1; // Slightly higher pitch (kid-friendly)
  utterance.volume = options?.volume || 0.8;
  utterance.lang = "en-US"; // American English

  // Try to find a female US English voice
  const voices = window.speechSynthesis.getVoices();
  const femaleUSVoice = voices.find(
    (voice) =>
      voice.lang.startsWith("en-US") &&
      (voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("samantha") ||
        voice.name.toLowerCase().includes("victoria") ||
        voice.name.toLowerCase().includes("karen") ||
        voice.name.toLowerCase().includes("zira"))
  );

  if (femaleUSVoice) {
    utterance.voice = femaleUSVoice;
  } else {
    // Fallback to first US English voice
    const usVoice = voices.find((voice) => voice.lang.startsWith("en-US"));
    if (usVoice) {
      utterance.voice = usVoice;
    }
  }

  window.speechSynthesis.speak(utterance);

  // Return cleanup function
  return () => {
    window.speechSynthesis.cancel();
  };
}

/**
 * Speak word with emphasis (slightly slower)
 */
export function speakWord(word: string): () => void {
  return speakText(word, { rate: 0.7, pitch: 1.0 });
}

/**
 * Speak meaning with natural pace
 */
export function speakMeaning(meaning: string): () => void {
  return speakText(meaning, { rate: 0.85, pitch: 1.1 });
}

/**
 * Speak IPA phonetically with emphasis
 */
export function speakIPA(ipa: string): () => void {
  // Remove IPA slashes for better pronunciation
  const cleanIPA = ipa.replace(/\//g, "");
  return speakText(cleanIPA, { rate: 0.6, pitch: 1.0 });
}

/**
 * Speak positive feedback (replaces correct.mp3)
 */
export function speakCorrect(): () => void {
  const phrases = ["Great job!", "Excellent!", "Perfect!", "Well done!", "Amazing!"];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  return speakText(randomPhrase, { rate: 1.0, pitch: 1.2, volume: 0.9 });
}

/**
 * Speak encouraging feedback (replaces wrong.mp3)
 */
export function speakWrong(): () => void {
  const phrases = ["Try again!", "Almost there!", "Keep trying!", "You can do it!"];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  return speakText(randomPhrase, { rate: 0.9, pitch: 1.1, volume: 0.8 });
}

/**
 * Initialize voices (call this on app mount)
 */
export function initializeSpeech(): void {
  if (!window.speechSynthesis) return;
  
  // Load voices - some browsers need this
  window.speechSynthesis.getVoices();
  
  // Listen for voices loaded event
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/**
 * Get encouraging message based on score percentage
 */
export function getEncouragingMessage(percentage: number): string {
  if (percentage === 100) return "🌟 Perfect Score! You're a SpellBee Champion!";
  if (percentage >= 90) return "🎉 Excellent work! Almost perfect!";
  if (percentage >= 80) return "👏 Great job! Keep it up!";
  if (percentage >= 70) return "😊 Good effort! You're doing well!";
  if (percentage >= 60) return "💪 Nice try! Practice makes perfect!";
  return "🌈 Keep learning! You're improving every day!";
}

/**
 * Get streak badge based on consecutive correct answers
 */
export function getStreakBadge(streak: number): string {
  if (streak >= 10) return "🔥 On Fire!";
  if (streak >= 5) return "⭐ Hot Streak!";
  if (streak >= 3) return "✨ Good Streak!";
  return "";
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

/**
 * Save progress to localStorage
 */
export function saveProgress(data: {
  score: number;
  totalWords: number;
  accuracy: number;
  streak: number;
  completedAt: string;
}): void {
  try {
    const key = "spellbee-progress-v1";
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    history.push(data);
    
    // Keep only last 10 sessions
    const trimmed = history.slice(-10);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Failed to save progress:", err);
  }
}

/**
 * Load progress from localStorage
 */
export function loadProgress(): Array<{
  score: number;
  totalWords: number;
  accuracy: number;
  streak: number;
  completedAt: string;
}> {
  try {
    const key = "spellbee-progress-v1";
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn("Failed to load progress:", err);
    return [];
  }
}

/**
 * SRS (Spaced Repetition System) - Track word mastery levels
 */
export interface WordMastery {
  wordIndex: number;
  correct: number; // consecutive correct answers
  wrong: number; // total wrong answers
  lastSeen: number; // timestamp
  mastered: boolean;
}

/**
 * Get mastery data from localStorage
 */
export function getMasteryData(): Map<number, WordMastery> {
  try {
    const data = localStorage.getItem("spellbee-mastery-v1");
    if (!data) return new Map();
    
    const obj = JSON.parse(data);
    return new Map(Object.entries(obj).map(([k, v]) => [Number(k), v as WordMastery]));
  } catch (err) {
    console.warn("Failed to load mastery data:", err);
    return new Map();
  }
}

/**
 * Save mastery data to localStorage
 */
export function saveMasteryData(masteryMap: Map<number, WordMastery>): void {
  try {
    const obj = Object.fromEntries(masteryMap);
    localStorage.setItem("spellbee-mastery-v1", JSON.stringify(obj));
  } catch (err) {
    console.warn("Failed to save mastery data:", err);
  }
}

/**
 * Update mastery for a word (correct or wrong answer)
 */
export function updateMastery(
  wordIndex: number,
  isCorrect: boolean,
  masteryMap: Map<number, WordMastery>
): Map<number, WordMastery> {
  const newMap = new Map(masteryMap);
  const current = newMap.get(wordIndex) || {
    wordIndex,
    correct: 0,
    wrong: 0,
    lastSeen: Date.now(),
    mastered: false,
  };

  if (isCorrect) {
    current.correct++;
    // Mark as mastered after 3 consecutive correct answers
    if (current.correct >= 3) {
      current.mastered = true;
    }
  } else {
    current.wrong++;
    current.correct = 0; // Reset streak on wrong answer
    current.mastered = false;
  }

  current.lastSeen = Date.now();
  newMap.set(wordIndex, current);
  saveMasteryData(newMap);
  
  return newMap;
}

/**
 * Get words that need review (wrong answers, not mastered)
 */
export function getWordsNeedingReview(
  totalWords: number,
  masteryMap: Map<number, WordMastery>
): number[] {
  const needReview: number[] = [];
  
  for (let i = 0; i < totalWords; i++) {
    const mastery = masteryMap.get(i);
    
    // Include if: never seen, has wrong answers, or not mastered
    if (!mastery || mastery.wrong > 0 || !mastery.mastered) {
      needReview.push(i);
    }
  }
  
  return needReview;
}

/**
 * Adaptive difficulty: Generate easier/harder distractors based on performance
 */
export function generateAdaptiveMCQOptions<T>(
  allOptions: T[],
  correctOption: T,
  totalOptions: number,
  _difficulty: "easy" | "medium" | "hard" // Prefix with _ to indicate unused
): { options: T[]; correctIndex: number } {
  // For now, same as regular MCQ (can enhance later with semantic similarity)
  return generateMCQOptions(allOptions, correctOption, totalOptions);
}

/**
 * Determine difficulty level based on streak
 */
export function getDifficultyFromStreak(streak: number): "easy" | "medium" | "hard" {
  if (streak >= 5) return "hard";
  if (streak >= 3) return "medium";
  return "easy";
}

/**
 * Badge system - Get badge for achievement
 */
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export function checkBadges(
  score: number,
  totalWords: number,
  _streak: number, // Prefix with _ to indicate intentionally unused for now
  maxStreak: number
): Badge[] {
  const badges: Badge[] = [];
  
  const accuracy = calculateAccuracy(score, totalWords * 2);
  
  // Meaning Master
  if (accuracy === 100) {
    badges.push({
      id: "perfect",
      name: "Perfect Score",
      icon: "🏆",
      description: "Got everything right!"
    });
  }
  
  // IPA Hero
  if (maxStreak >= 10) {
    badges.push({
      id: "streak-hero",
      name: "Streak Hero",
      icon: "🔥",
      description: "10+ correct in a row!"
    });
  }
  
  // First 5 words
  if (totalWords >= 5 && score >= 8) {
    badges.push({
      id: "quick-learner",
      name: "Quick Learner",
      icon: "⭐",
      description: "Mastered first 5 words!"
    });
  }
  
  return badges;
}

/**
 * Coin system - Calculate coins earned
 */
export function calculateCoins(
  correctAnswers: number,
  streak: number
): number {
  let coins = correctAnswers * 10; // 10 coins per correct answer
  
  // Bonus for streak
  if (streak >= 5) coins += streak * 5;
  
  return coins;
}

/**
 * Get total coins from localStorage
 */
export function getTotalCoins(): number {
  try {
    const coins = localStorage.getItem("spellbee-coins-v1");
    return coins ? parseInt(coins, 10) : 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Add coins to total
 */
export function addCoins(amount: number): number {
  const current = getTotalCoins();
  const newTotal = current + amount;
  try {
    localStorage.setItem("spellbee-coins-v1", newTotal.toString());
  } catch (err) {
    console.warn("Failed to save coins:", err);
  }
  return newTotal;
}

/**
 * Phoneme Difficulty Tracking
 */
export interface PhonemeStats {
  seen: number;
  wrong: number;
}

export function getPhonemeStats(): Map<string, PhonemeStats> {
  try {
    const data = localStorage.getItem("spellbee-phonemes-v1");
    if (!data) return new Map();
    
    const obj = JSON.parse(data);
    const map = new Map<string, PhonemeStats>();
    Object.entries(obj).forEach(([key, value]) => {
      map.set(key, value as PhonemeStats);
    });
    return map;
  } catch (err) {
    console.warn("Failed to load phoneme stats:", err);
    return new Map();
  }
}

export function savePhonemeStats(stats: Map<string, PhonemeStats>): void {
  try {
    const obj: Record<string, PhonemeStats> = {};
    stats.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem("spellbee-phonemes-v1", JSON.stringify(obj));
  } catch (err) {
    console.warn("Failed to save phoneme stats:", err);
  }
}

export function updatePhonemeStats(
  ipa: string,
  isCorrect: boolean
): Map<string, PhonemeStats> {
  const stats = getPhonemeStats();
  const current = stats.get(ipa) || { seen: 0, wrong: 0 };
  
  current.seen++;
  if (!isCorrect) {
    current.wrong++;
  }
  
  stats.set(ipa, current);
  savePhonemeStats(stats);
  return stats;
}

/**
 * Generate minimal-pair hint for IPA
 */
export function getMinimalPairHint(correctIPA: string, selectedIPA: string): string {
  const pairs: Record<string, string> = {
    "/iː/": "/ɪ/ (short i)",
    "/ɪ/": "/iː/ (long e)",
    "/æ/": "/ʌ/ (uh sound)",
    "/ʌ/": "/æ/ (short a)",
    "/ɔː/": "/ɒ/ (short o)",
    "/ɒ/": "/ɔː/ (long o)",
    "/uː/": "/ʊ/ (short oo)",
    "/ʊ/": "/uː/ (long oo)",
    "/e/": "/ɪ/ (short i)",
    "/ɑː/": "/ʌ/ (uh sound)",
  };
  
  return `${correctIPA} vs ${selectedIPA} ${pairs[correctIPA] || ""}`.trim();
}

/**
 * Fix-Up Mode: Get words that need practice
 */
export function getFixUpWords(
  recentMistakes: number[],
  totalWords: number
): number[] {
  const masteryData = getMasteryData();
  const fixUpSet = new Set<number>();

  // Priority 1: Recent mistakes from current session
  recentMistakes.forEach((idx) => fixUpSet.add(idx));

  // Priority 2: Words with wrong > 0 and not mastered
  for (let i = 0; i < totalWords && fixUpSet.size < 5; i++) {
    const mastery = masteryData.get(i);
    if (mastery && mastery.wrong > 0 && !mastery.mastered) {
      fixUpSet.add(i);
    }
  }

  // Priority 3: Never seen words (fill to 5)
  for (let i = 0; i < totalWords && fixUpSet.size < 5; i++) {
    if (!masteryData.has(i)) {
      fixUpSet.add(i);
    }
  }

  return Array.from(fixUpSet).slice(0, 5);
}

/**
 * Save fix-up report
 */
export interface FixUpReport {
  wordIds: number[];
  correct: number;
  wrong: number;
  timestamp: string;
}

export function saveFixUpReport(report: FixUpReport): void {
  try {
    localStorage.setItem("spellbee-fixup-v1", JSON.stringify(report));
  } catch (err) {
    console.warn("Failed to save fix-up report:", err);
  }
}

export function getLastFixUpReport(): FixUpReport | null {
  try {
    const data = localStorage.getItem("spellbee-fixup-v1");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Parent Mini-Report
 */
export interface ParentReport {
  timestamp: number;
  sessionId: string;
  accuracy: number;
  attempted: number;
  bestStreak: number;
  coinsEarned: number;
  masteredToday: string[];
  topTrickyPhonemes: Array<{ ipa: string; seen: number; wrong: number; label: string }>;
  tip: string;
}

const PHONEME_LABELS: Record<string, string> = {
  "/iː/": "long e",
  "/ɪ/": "short i",
  "/æ/": "short a",
  "/ʌ/": "uh sound",
  "/ɔː/": "long o",
  "/ɒ/": "short o",
  "/uː/": "long oo",
  "/ʊ/": "short oo",
  "/e/": "short e",
  "/ɑː/": "ah sound",
};

export function buildParentReport(
  accuracy: number,
  attempted: number,
  bestStreak: number,
  coinsEarned: number,
  sessionWords: string[]
): ParentReport {
  const masteryData = getMasteryData();
  const phonemeStats = getPhonemeStats();
  
  // Find mastered words from this session
  const masteredToday: string[] = [];
  sessionWords.forEach((word) => {
    const idx = sessionWords.indexOf(word);
    const mastery = masteryData.get(idx);
    if (mastery && mastery.mastered) {
      masteredToday.push(word);
    }
  });

  // Get top 3 tricky phonemes
  const trickyPhonemes = Array.from(phonemeStats.entries())
    .filter(([_, stats]) => stats.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 3)
    .map(([ipa, stats]) => ({
      ipa,
      seen: stats.seen,
      wrong: stats.wrong,
      label: PHONEME_LABELS[ipa] || ipa,
    }));

  // Generate practice tip
  let tip = "Great job today! Keep practicing daily.";
  if (trickyPhonemes.length > 0) {
    const topPhoneme = trickyPhonemes[0];
    tip = `Review ${topPhoneme.label} (${topPhoneme.ipa}) sounds. Try words like "cat", "bat", "hat" at home!`;
  }

  return {
    timestamp: Date.now(),
    sessionId: `session-${Date.now()}`,
    accuracy,
    attempted,
    bestStreak,
    coinsEarned,
    masteredToday: masteredToday.slice(0, 8),
    topTrickyPhonemes: trickyPhonemes,
    tip,
  };
}

export function saveParentReport(report: ParentReport): void {
  try {
    localStorage.setItem("spellbee-report-v1", JSON.stringify(report));
  } catch (err) {
    console.warn("Failed to save parent report:", err);
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  
  // Fallback for older browsers
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve(success);
  } catch {
    return Promise.resolve(false);
  }
}

export function formatParentReportText(report: ParentReport): string {
  const date = new Date(report.timestamp).toLocaleDateString();
  
  let text = `📊 SpellBee Progress Report - ${date}\n\n`;
  text += `✅ Accuracy: ${report.accuracy}%\n`;
  text += `📝 Questions Attempted: ${report.attempted}\n`;
  text += `🔥 Best Streak: ${report.bestStreak}\n`;
  text += `🪙 Coins Earned: ${report.coinsEarned}\n\n`;
  
  if (report.masteredToday.length > 0) {
    text += `🌟 Words Mastered:\n`;
    report.masteredToday.forEach((word) => {
      text += `  • ${word}\n`;
    });
    text += `\n`;
  }
  
  if (report.topTrickyPhonemes.length > 0) {
    text += `💡 Sounds to Practice:\n`;
    report.topTrickyPhonemes.forEach((phoneme) => {
      text += `  • ${phoneme.label} (${phoneme.ipa}): ${phoneme.wrong}/${phoneme.seen} mistakes\n`;
    });
    text += `\n`;
  }
  
  text += `📚 Practice Tip:\n${report.tip}\n`;
  
  return text;
}

/**
 * Daily Quests System
 */
export interface Quest {
  id: string;
  title: string;
  icon: string;
  target: number;
  progress: number;
  done: boolean;
}

export interface QuestsState {
  date: string;
  quests: Quest[];
}

const QUEST_POOL: Omit<Quest, "progress" | "done">[] = [
  { id: "coins_25", title: "Earn 25 coins", icon: "🪙", target: 25 },
  { id: "master_3", title: "Master 3 words", icon: "🏆", target: 3 },
  { id: "streak_5", title: "Keep a 5+ streak", icon: "🔥", target: 5 },
  { id: "speed_2", title: "Win 2 speed rounds", icon: "⚡", target: 2 },
  { id: "ipa_3", title: "Get 3 IPA correct", icon: "🔊", target: 3 },
  { id: "fixup_1", title: "Complete Fix-Up mode", icon: "🩹", target: 1 },
];

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function rollDailyQuests(): Quest[] {
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2).map((q) => ({
    ...q,
    progress: 0,
    done: false,
  }));
}

export function loadQuests(): QuestsState {
  try {
    const data = localStorage.getItem("spellbee-quests-v1");
    if (!data) {
      const quests = rollDailyQuests();
      return { date: getTodayDate(), quests };
    }

    const state: QuestsState = JSON.parse(data);
    
    // Check if new day
    if (state.date !== getTodayDate()) {
      const quests = rollDailyQuests();
      return { date: getTodayDate(), quests };
    }

    return state;
  } catch {
    const quests = rollDailyQuests();
    return { date: getTodayDate(), quests };
  }
}

export function saveQuests(state: QuestsState): void {
  try {
    localStorage.setItem("spellbee-quests-v1", JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to save quests:", err);
  }
}

export function updateQuestProgress(
  quests: Quest[],
  questId: string,
  increment: number
): Quest[] {
  return quests.map((q) => {
    if (q.id === questId && !q.done) {
      const newProgress = q.progress + increment;
      return {
        ...q,
        progress: newProgress,
        done: newProgress >= q.target,
      };
    }
    return q;
  });
}

// ===== STICKER SHEET =====

export interface StickersState {
  owned: string[]; // Emojis owned by user
  placed: string[]; // Emojis placed on grid (12 slots, 0-11)
}

export const STICKER_SHOP: string[] = [
  "🌟", "🎨", "🚀", "🦄", "🌈", "🎪",
  "🍕", "🎮", "🏆", "🎭", "🐉", "🎸"
];

const STICKERS_KEY = "spellbee-stickers-v1";

export function loadStickers(): StickersState {
  try {
    const data = localStorage.getItem(STICKERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Failed to load stickers:", err);
  }
  return { owned: [], placed: Array(12).fill("") };
}

export function saveStickers(state: StickersState): void {
  try {
    localStorage.setItem(STICKERS_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to save stickers:", err);
  }
}

export function purchaseSticker(
  emoji: string,
  currentCoins: number,
  stickersState: StickersState
): { success: boolean; newCoins: number; newState: StickersState; error?: string } {
  const STICKER_COST = 10;
  
  if (stickersState.owned.includes(emoji)) {
    return {
      success: false,
      newCoins: currentCoins,
      newState: stickersState,
      error: "Already owned!"
    };
  }
  
  if (currentCoins < STICKER_COST) {
    return {
      success: false,
      newCoins: currentCoins,
      newState: stickersState,
      error: "Not enough coins!"
    };
  }
  
  const newState = {
    ...stickersState,
    owned: [...stickersState.owned, emoji]
  };
  
  return {
    success: true,
    newCoins: currentCoins - STICKER_COST,
    newState
  };
}

export function placeSticker(
  emoji: string,
  slotIndex: number,
  stickersState: StickersState
): StickersState {
  const newPlaced = [...stickersState.placed];
  newPlaced[slotIndex] = emoji;
  return {
    ...stickersState,
    placed: newPlaced
  };
}

export function removeSticker(
  slotIndex: number,
  stickersState: StickersState
): StickersState {
  const newPlaced = [...stickersState.placed];
  newPlaced[slotIndex] = "";
  return {
    ...stickersState,
    placed: newPlaced
  };
}

// ===== DEBOUNCED STORAGE WRAPPERS =====

import { debouncedLocalStorageWrite } from "./helpers";

export function saveMasteryDataDebounced(masteryMap: Map<number, WordMastery>): void {
  try {
    const obj = Object.fromEntries(masteryMap);
    debouncedLocalStorageWrite("spellbee-mastery-v1", JSON.stringify(obj));
  } catch (err) {
    console.warn("Failed to debounce mastery save:", err);
  }
}

export function saveCoinsDebounced(total: number): void {
  try {
    debouncedLocalStorageWrite("spellbee-coins-v1", total.toString());
  } catch (err) {
    console.warn("Failed to debounce coins save:", err);
  }
}

export function saveProgressDebounced(data: {
  completed: number[];
  lastPlayed: string;
}): void {
  try {
    debouncedLocalStorageWrite("spellbee-progress-v1", JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to debounce progress save:", err);
  }
}

// ===== EVENT LOGGING FOR DEBUG =====

export interface LogEvent {
  timestamp: string;
  name: string;
  payload?: Record<string, unknown>;
}

const EVENTS_KEY = "spellbee-events-v1";
const MAX_EVENTS = 200;

export function logEvent(name: string, payload?: Record<string, unknown>): void {
  try {
    const event: LogEvent = {
      timestamp: new Date().toISOString(),
      name,
      payload,
    };

    const existing = localStorage.getItem(EVENTS_KEY);
    const events: LogEvent[] = existing ? JSON.parse(existing) : [];
    
    // Ring buffer: keep only last MAX_EVENTS
    events.push(event);
    const trimmed = events.slice(-MAX_EVENTS);
    
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Failed to log event:", err);
  }
}

export function getEventLog(): LogEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn("Failed to load event log:", err);
    return [];
  }
}

export function clearEventLog(): void {
  try {
    localStorage.removeItem(EVENTS_KEY);
  } catch (err) {
    console.warn("Failed to clear event log:", err);
  }
}
