/**
 * Utility functions for Quick Meaning Quiz
 */

import type { WordEntry } from "./data";

const COINS_KEY = "spellbee-coins-v1";
const STATS_KEY = "quick-meaning-stats-v1";
const REPORT_KEY = "quick-meaning-report-v1";
const MASTERY_KEY = "quick-meaning-mastery-v1";
const ACHIEVEMENTS_KEY = "quick-meaning-achievements-v1";

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

/**
 * Mastery tracking - track how well student performs on each word
 */
export interface MasteryRecord {
  correct: number; // Count of correct first-try answers
  total: number; // Total attempts
  lastPracticed: number; // Timestamp
  mastered: boolean; // true if 3+ correct
}

export function getMasteryData(): Map<string, MasteryRecord> {
  try {
    const stored = localStorage.getItem(MASTERY_KEY);
    if (!stored) return new Map();
    
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

export function saveMasteryData(data: Map<string, MasteryRecord>): void {
  try {
    const obj = Object.fromEntries(data);
    localStorage.setItem(MASTERY_KEY, JSON.stringify(obj));
  } catch {
    console.warn("Failed to save mastery data");
  }
}

export function updateMasteryRecord(
  wordId: string,
  correctFirstTry: boolean
): void {
  const data = getMasteryData();
  const existing = data.get(wordId) || {
    correct: 0,
    total: 0,
    lastPracticed: 0,
    mastered: false,
  };

  existing.total += 1;
  if (correctFirstTry) existing.correct += 1;
  existing.lastPracticed = Date.now();
  
  // Mastered if 3+ correct first-try answers
  existing.mastered = existing.correct >= 3;

  data.set(wordId, existing);
  saveMasteryData(data);
}

/**
 * Achievement system
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  earned: boolean;
  earnedAt?: number;
}

const ALL_ACHIEVEMENTS: Omit<Achievement, 'earned' | 'earnedAt'>[] = [
  { id: 'first_word', name: 'First Success', description: 'Master your first word', icon: '⭐', target: 1 },
  { id: 'master_10', name: 'Word Expert', description: 'Master 10 words', icon: '🎯', target: 10 },
  { id: 'master_25', name: 'Quiz Champion', description: 'Master 25 words', icon: '🏆', target: 25 },
  { id: 'master_50', name: 'Meaning Master', description: 'Master 50 words', icon: '👑', target: 50 },
  { id: 'master_all', name: 'Perfect Quiz', description: 'Master all 148 words', icon: '🎖️', target: 148 },
];

export function getEarnedAchievements(): Set<string> {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveEarnedAchievements(earned: Set<string>): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...earned]));
  } catch {
    console.warn("Failed to save achievements");
  }
}

export function checkAchievements(): Achievement[] {
  const mastery = getMasteryData();
  const masteredCount = Array.from(mastery.values()).filter((m) => m.mastered).length;
  const earned = getEarnedAchievements();
  const newlyEarned: Achievement[] = [];

  for (const ach of ALL_ACHIEVEMENTS) {
    if (masteredCount >= ach.target && !earned.has(ach.id)) {
      earned.add(ach.id);
      newlyEarned.push({
        ...ach,
        earned: true,
        earnedAt: Date.now(),
      });
    }
  }

  if (newlyEarned.length > 0) {
    saveEarnedAchievements(earned);
  }

  return newlyEarned;
}

export function getAllAchievements(): Achievement[] {
  const mastery = getMasteryData();
  const masteredCount = Array.from(mastery.values()).filter((m) => m.mastered).length;
  const earned = getEarnedAchievements();

  return ALL_ACHIEVEMENTS.map((ach) => ({
    ...ach,
    earned: masteredCount >= ach.target || earned.has(ach.id),
    earnedAt: earned.has(ach.id) ? Date.now() : undefined,
  }));
}

/**
 * Progress stats computation for dashboard
 */
export interface ProgressStats {
  overall: {
    mastered: number;
    total: number;
    percent: number;
  };
  groups: Record<string, {
    mastered: number;
    total: number;
    percent: number;
  }>;
}

export function computeProgressStats(words: WordEntry[]): ProgressStats {
  const mastery = getMasteryData();
  const groups: Record<string, { mastered: number; total: number }> = {};

  // Group words by first letter
  for (const word of words) {
    const firstChar = word.word[0].toUpperCase();
    const group = /[A-Z]/.test(firstChar) ? firstChar : '#';

    if (!groups[group]) {
      groups[group] = { mastered: 0, total: 0 };
    }

    groups[group].total += 1;

    const record = mastery.get(word.id);
    if (record?.mastered) {
      groups[group].mastered += 1;
    }
  }

  // Calculate overall stats
  const totalMastered = Array.from(mastery.values()).filter((m) => m.mastered).length;
  const totalWords = words.length;

  // Build result with percentages
  const groupsWithPercent: Record<string, { mastered: number; total: number; percent: number }> = {};
  for (const [key, value] of Object.entries(groups)) {
    groupsWithPercent[key] = {
      ...value,
      percent: value.total > 0 ? Math.round((value.mastered / value.total) * 100) : 0,
    };
  }

  return {
    overall: {
      mastered: totalMastered,
      total: totalWords,
      percent: totalWords > 0 ? Math.round((totalMastered / totalWords) * 100) : 0,
    },
    groups: groupsWithPercent,
  };
}
