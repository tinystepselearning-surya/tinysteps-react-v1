/**
 * Utility functions for Balloon-Pop Phonics
 */

import type { Word } from "./data";

const COINS_KEY = "spellbee-coins-v1";
const STATS_KEY = "balloon-pop-stats-v1";

/**
 * Game stats interface
 */
export interface GameStats {
  bestStreak: number;
  totalRounds: number;
  correctPops: number;
  level3Clears: number;
  badges: string[];
  trickyPhonemes: Record<string, number>; // phoneme -> wrong count
}

/**
 * Minimal-pair phoneme groups
 */
const MINIMAL_PAIRS: Record<string, string[]> = {
  "/iː/": ["/ɪ/", "/eɪ/"],
  "/ɪ/": ["/iː/", "/e/"],
  "/æ/": ["/ʌ/", "/ɛ/", "/e/"],
  "/ʌ/": ["/æ/", "/ɑː/", "/ɒ/"],
  "/ɛ/": ["/æ/", "/e/", "/ɪ/"],
  "/ɔː/": ["/ɒ/", "/oʊ/", "/ʌ/"],
  "/ɒ/": ["/ɔː/", "/ɑː/", "/ʌ/"],
  "/uː/": ["/ʊ/", "/oʊ/"],
  "/ʊ/": ["/uː/", "/ʌ/"],
  "/ɑː/": ["/ʌ/", "/ɒ/", "/æ/"],
  "/aɪ/": ["/eɪ/", "/ɔɪ/"],
  "/eɪ/": ["/aɪ/", "/iː/"],
  "/ɔɪ/": ["/aɪ/", "/ɔː/"],
  "/aʊ/": ["/oʊ/", "/aɪ/"],
  "/oʊ/": ["/aʊ/", "/ɔː/", "/uː/"],
};

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
  allWords: Word[],
  count: number,
  recentIds: Set<string> = new Set()
): Word[] {
  const available = allWords.filter((w) => !recentIds.has(w.word));
  const pool = available.length >= count ? available : allWords;
  return shuffle(pool).slice(0, count);
}

/**
 * Extract main IPA phoneme from full IPA notation
 */
export function extractMainPhoneme(ipa: string): string {
  // Match common phoneme patterns
  const matches = ipa.match(/\/([^\/]+)\//);
  if (!matches) return ipa;
  
  const content = matches[1];
  // Find first vowel phoneme
  for (const [phoneme] of Object.entries(MINIMAL_PAIRS)) {
    if (content.includes(phoneme.replace(/\//g, ""))) {
      return phoneme;
    }
  }
  
  return `/${content.split(/[ˈˌ]/).filter(Boolean)[0] || content}/`;
}

/**
 * Generate minimal-pair distractors for IPA
 */
export function generateIPADistractors(
  correctIPA: string,
  allIPAs: string[],
  count: number
): string[] {
  const mainPhoneme = extractMainPhoneme(correctIPA);
  const pairs = MINIMAL_PAIRS[mainPhoneme] || [];
  
  // Try to find words with minimal-pair phonemes
  const candidates: string[] = [];
  
  for (const pair of pairs) {
    const matching = allIPAs.filter(
      (ipa) => ipa !== correctIPA && ipa.includes(pair.replace(/\//g, ""))
    );
    candidates.push(...matching);
  }
  
  // If not enough minimal pairs, add random different IPAs
  if (candidates.length < count) {
    const others = allIPAs.filter(
      (ipa) => ipa !== correctIPA && !candidates.includes(ipa)
    );
    candidates.push(...shuffle(others));
  }
  
  return shuffle(candidates).slice(0, count);
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
          totalRounds: 0,
          correctPops: 0,
          level3Clears: 0,
          badges: [],
          trickyPhonemes: {},
        };
  } catch {
    return {
      bestStreak: 0,
      totalRounds: 0,
      correctPops: 0,
      level3Clears: 0,
      badges: [],
      trickyPhonemes: {},
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
 * Record wrong phoneme for practice
 */
export function recordWrongPhoneme(ipa: string): void {
  const stats = getStats();
  const phoneme = extractMainPhoneme(ipa);
  stats.trickyPhonemes[phoneme] = (stats.trickyPhonemes[phoneme] || 0) + 1;
  saveStats(stats);
}

/**
 * Get tricky phonemes for practice (top 3)
 */
export function getTrickyPhonemes(): string[] {
  const stats = getStats();
  return Object.entries(stats.trickyPhonemes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([phoneme]) => phoneme);
}

/**
 * Award badge
 */
export function awardBadge(badge: string): boolean {
  const stats = getStats();
  if (stats.badges.includes(badge)) return false;
  stats.badges.push(badge);
  saveStats(stats);
  return true;
}

/**
 * Speak word using Web Speech API
 */
export function speakWord(text: string): () => void {
  if (!window.speechSynthesis) {
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
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
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
