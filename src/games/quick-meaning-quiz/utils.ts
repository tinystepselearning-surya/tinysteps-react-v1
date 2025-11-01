/**
 * Utility functions for Quick Meaning Quiz
 */

import type { WordEntry } from "./data";

const COINS_KEY = "spellbee-coins-v1";
const STATS_KEY = "quick-meaning-stats-v1";
const REPORT_KEY = "quick-meaning-report-v1";

/**
 * Game stats interface
 */
export interface GameStats {
  bestStreak: number;
  bestAccuracy: number;
  totalPlays: number;
  totalCorrect: number;
  totalRounds: number;
  trickyWords: Record<string, number>; // word -> miss count
}

/**
 * Session report for parent view
 */
export interface SessionReport {
  date: string;
  accuracy: number;
  coinsEarned: number;
  bestStreak: number;
  avgTimePerCorrect: number;
  trickyWords: string[];
}

/**
 * Fisher-Yates shuffle
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
 * Pick N words avoiding recent ones
 */
export function pickWords(
  allWords: WordEntry[],
  count: number,
  recentIds: Set<string> = new Set()
): WordEntry[] {
  const available = allWords.filter((w) => !recentIds.has(w.id));
  const pool = available.length >= count ? available : allWords;
  return shuffle(pool).slice(0, count);
}

/**
 * Generate smart meaning distractors
 */
export function generateMeaningDistractors(
  correctMeaning: string,
  allWords: WordEntry[],
  targetWord: string,
  count: number = 3
): string[] {
  const distractors: string[] = [];
  const correctWords = correctMeaning.toLowerCase().split(/\s+/);

  // Filter out the target word itself
  const candidates = allWords.filter(
    (w) => w.word.toLowerCase() !== targetWord.toLowerCase()
  );

  // Strategy 1: Near-synonym (shares common words)
  const nearSynonyms = candidates.filter((w) => {
    const words = w.meaning.toLowerCase().split(/\s+/);
    const overlap = words.filter((word) => correctWords.includes(word));
    return overlap.length >= 2 && overlap.length < correctWords.length;
  });

  if (nearSynonyms.length > 0 && distractors.length < count) {
    const picked = nearSynonyms[Math.floor(Math.random() * nearSynonyms.length)];
    distractors.push(picked.meaning);
  }

  // Strategy 2: Antonym-like (contains "not" or opposite sentiment)
  const antonyms = candidates.filter((w) => {
    const meaning = w.meaning.toLowerCase();
    return (
      meaning.includes("not ") ||
      meaning.includes("without ") ||
      meaning.includes("opposite")
    );
  });

  if (antonyms.length > 0 && distractors.length < count) {
    const picked = antonyms[Math.floor(Math.random() * antonyms.length)];
    if (!distractors.includes(picked.meaning)) {
      distractors.push(picked.meaning);
    }
  }

  // Strategy 3: Phonologically similar words (similar IPA or word structure)
  const phonoSimilar = candidates.filter((w) => {
    const targetLen = targetWord.length;
    const wordLen = w.word.length;
    return Math.abs(targetLen - wordLen) <= 2;
  });

  if (phonoSimilar.length > 0 && distractors.length < count) {
    const picked = phonoSimilar[Math.floor(Math.random() * phonoSimilar.length)];
    if (!distractors.includes(picked.meaning)) {
      distractors.push(picked.meaning);
    }
  }

  // Fill remaining with random unique meanings
  const remaining = candidates.filter(
    (w) => !distractors.includes(w.meaning)
  );

  while (distractors.length < count && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    const picked = remaining.splice(idx, 1)[0];
    if (!distractors.includes(picked.meaning)) {
      distractors.push(picked.meaning);
    }
  }

  return shuffle(distractors).slice(0, count);
}

/**
 * Levenshtein distance for typo tolerance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Check if typed word matches target (tolerant)
 */
export function isTypingMatch(typed: string, target: string): boolean {
  const distance = levenshteinDistance(typed, target);
  return distance <= 1;
}

/**
 * Coin management (shared with other games)
 */
export function getCoins(): number {
  try {
    const stored = localStorage.getItem(COINS_KEY);
    return stored ? Math.max(0, parseInt(stored, 10)) : 0;
  } catch {
    return 0;
  }
}

export function addCoins(amount: number): number {
  const current = getCoins();
  const newTotal = Math.max(0, current + amount);
  try {
    localStorage.setItem(COINS_KEY, newTotal.toString());
  } catch {
    console.warn("Failed to save coins");
  }
  return newTotal;
}

/**
 * Game stats persistence
 */
export function getStats(): GameStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          bestStreak: 0,
          bestAccuracy: 0,
          totalPlays: 0,
          totalCorrect: 0,
          totalRounds: 0,
          trickyWords: {},
        };
  } catch {
    return {
      bestStreak: 0,
      bestAccuracy: 0,
      totalPlays: 0,
      totalCorrect: 0,
      totalRounds: 0,
      trickyWords: {},
    };
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    console.warn("Failed to save stats");
  }
}

/**
 * Record tricky word (missed or slow)
 */
export function recordTrickyWord(word: string): void {
  const stats = getStats();
  stats.trickyWords[word] = (stats.trickyWords[word] || 0) + 1;
  saveStats(stats);
}

/**
 * Get tricky words for practice (top 5 by miss count)
 */
export function getTrickyWords(): string[] {
  const stats = getStats();
  return Object.entries(stats.trickyWords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Save session report for parent view
 */
export function saveSessionReport(report: SessionReport): void {
  try {
    localStorage.setItem(REPORT_KEY, JSON.stringify(report));
  } catch {
    console.warn("Failed to save session report");
  }
}

/**
 * Get session report
 */
export function getSessionReport(): SessionReport | null {
  try {
    const stored = localStorage.getItem(REPORT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Speak text using Web Speech API
 */
export function speakText(text: string, rate: number = 0.85): () => void {
  if (!window.speechSynthesis) {
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  utterance.lang = "en-US";

  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    (v) =>
      v.lang.startsWith("en-US") &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha"))
  );

  if (femaleVoice) utterance.voice = femaleVoice;

  window.speechSynthesis.speak(utterance);

  return () => window.speechSynthesis.cancel();
}

/**
 * Format time in seconds to mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
