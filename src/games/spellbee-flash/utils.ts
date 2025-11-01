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

