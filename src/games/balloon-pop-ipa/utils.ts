/**
 * Utility functions for Balloon-Pop Phonics
 */

import type { Word } from "./data";

const COINS_KEY = "spellbee-coins-v1";
const STATS_KEY = "balloon-pop-stats-v1";
const SOUND_ENABLED_KEY = "balloon-pop-sound-enabled";
const MASTERY_KEY = "balloon-pop-mastery-v1";
const ACHIEVEMENTS_KEY = "balloon-pop-achievements-v1";

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
 * Mastery tracking for individual words
 * Tracks first-try accuracy to determine mastery (3 correct first-tries = mastered)
 */
export interface MasteryRecord {
  correct: number; // First-try correct count
  total: number; // Total attempts
  lastPracticed: number; // Timestamp
  mastered: boolean; // True if correct >= 3
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  target: number; // Number of words to master
  icon: string;
  earned: boolean;
  earnedAt?: number; // Timestamp
}

/**
 * Progress statistics for dashboard
 */
export interface ProgressStats {
  totalWords: number;
  masteredWords: number;
  masteryPercent: number;
  groupProgress: {
    group: string;
    mastered: number;
    total: number;
    percent: number;
  }[];
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

/**
 * Audio pre-warming and management
 */
let correctAudio: HTMLAudioElement | null = null;
let wrongAudio: HTMLAudioElement | null = null;
let popAudio: HTMLAudioElement | null = null;

export function primeAudioElements(): void {
  if (correctAudio) return; // Already primed

  // Create silent base64 audio elements to pre-warm
  const silentMP3 =
    "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4RS+V8QAAAAAAAAAAAAAAAAAAAAAP/7kGQAAAAAExBTL8AAANIKjGn4AAABH0BVv0AAEQAAAM0gAAABE1FRU1FMUwxMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

  try {
    correctAudio = new Audio(silentMP3);
    wrongAudio = new Audio(silentMP3);
    popAudio = new Audio(silentMP3);

    // Attempt to play silently to warm up
    [correctAudio, wrongAudio, popAudio].forEach((audio) => {
      audio.volume = 0;
      audio.play().catch(() => {
        // Autoplay blocked - will handle with user gesture
      });
    });
  } catch (error) {
    console.warn("Audio priming failed:", error);
  }
}

export function playCorrectSound(): void {
  if (!correctAudio) return;
  correctAudio.volume = 0.3;
  correctAudio.currentTime = 0;
  correctAudio.play().catch(() => {});
}

export function playWrongSound(): void {
  if (!wrongAudio) return;
  wrongAudio.volume = 0.2;
  wrongAudio.currentTime = 0;
  wrongAudio.play().catch(() => {});
}

export function playPopSound(): void {
  if (!popAudio) return;
  popAudio.volume = 0.25;
  popAudio.currentTime = 0;
  popAudio.play().catch(() => {});
}

/**
 * Sound permission management
 */
export function getSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === "true";
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  } catch {
    console.warn("Failed to save sound preference");
  }
}

/**
 * Get minimal-pair hint text
 */
export function getMinimalPairHint(correctIPA: string, wrongIPA: string): string {
  const correctPhoneme = extractMainPhoneme(correctIPA);
  const wrongPhoneme = extractMainPhoneme(wrongIPA);
  
  if (correctPhoneme === wrongPhoneme) {
    return "Listen carefully to the word!";
  }
  
  return `Hint: ${correctPhoneme} vs ${wrongPhoneme}`;
}

/**
 * Delta time utilities for rAF
 */
export function clampDelta(delta: number, maxDelta: number = 100): number {
  // Prevent huge jumps when tab is hidden/resumed
  return Math.min(delta, maxDelta);
}

/**
 * Mastery tracking functions
 */
export function getMasteryRecord(wordId: string): MasteryRecord {
  try {
    const stored = localStorage.getItem(MASTERY_KEY);
    const allRecords: Record<string, MasteryRecord> = stored ? JSON.parse(stored) : {};
    return allRecords[wordId] || { correct: 0, total: 0, lastPracticed: 0, mastered: false };
  } catch {
    return { correct: 0, total: 0, lastPracticed: 0, mastered: false };
  }
}

export function updateMasteryRecord(wordId: string, wasCorrectFirstTry: boolean): void {
  try {
    const stored = localStorage.getItem(MASTERY_KEY);
    const allRecords: Record<string, MasteryRecord> = stored ? JSON.parse(stored) : {};
    
    const current = allRecords[wordId] || { correct: 0, total: 0, lastPracticed: 0, mastered: false };
    
    if (wasCorrectFirstTry) {
      current.correct += 1;
    }
    current.total += 1;
    current.lastPracticed = Date.now();
    current.mastered = current.correct >= 3;
    
    allRecords[wordId] = current;
    localStorage.setItem(MASTERY_KEY, JSON.stringify(allRecords));
    
    // Trigger storage event for dashboard refresh
    window.dispatchEvent(new StorageEvent('storage', {
      key: MASTERY_KEY,
      newValue: JSON.stringify(allRecords),
    }));
  } catch (error) {
    console.warn('Failed to update mastery record:', error);
  }
}

export function getAllMasteryRecords(): Record<string, MasteryRecord> {
  try {
    const stored = localStorage.getItem(MASTERY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Achievement system
 */
const ALL_ACHIEVEMENTS: Omit<Achievement, 'earned' | 'earnedAt'>[] = [
  {
    id: 'first_word',
    name: 'First Pop',
    description: 'Master your first word!',
    target: 1,
    icon: '⭐',
  },
  {
    id: 'master_10',
    name: 'Rising Star',
    description: 'Master 10 words',
    target: 10,
    icon: '🎯',
  },
  {
    id: 'master_25',
    name: 'Balloon Champion',
    description: 'Master 25 words',
    target: 25,
    icon: '🏆',
  },
  {
    id: 'master_50',
    name: 'Phonics Expert',
    description: 'Master 50 words',
    target: 50,
    icon: '👑',
  },
  {
    id: 'master_all',
    name: 'Ultimate Popper',
    description: 'Master all 148 words!',
    target: 148,
    icon: '🎖️',
  },
];

export function getAllAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    const earned: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    return ALL_ACHIEVEMENTS.map(ach => ({
      ...ach,
      earned: !!earned[ach.id],
      earnedAt: earned[ach.id],
    }));
  } catch {
    return ALL_ACHIEVEMENTS.map(ach => ({ ...ach, earned: false }));
  }
}

export function checkAchievements(): Achievement[] {
  const masteryRecords = getAllMasteryRecords();
  const masteredCount = Object.values(masteryRecords).filter(r => r.mastered).length;
  
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    const earned: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    const newlyEarned: Achievement[] = [];
    
    for (const ach of ALL_ACHIEVEMENTS) {
      if (!earned[ach.id] && masteredCount >= ach.target) {
        earned[ach.id] = Date.now();
        newlyEarned.push({ ...ach, earned: true, earnedAt: earned[ach.id] });
      }
    }
    
    if (newlyEarned.length > 0) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(earned));
      
      // Trigger storage event for dashboard refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: ACHIEVEMENTS_KEY,
        newValue: JSON.stringify(earned),
      }));
    }
    
    return newlyEarned;
  } catch {
    return [];
  }
}

/**
 * Progress statistics computation for dashboard
 */
export function computeProgressStats(words: typeof import('./data').WORDS): ProgressStats {
  const masteryRecords = getAllMasteryRecords();
  const totalWords = words.length;
  const masteredWords = Object.values(masteryRecords).filter(r => r.mastered).length;
  
  // Group words by phoneme (vowels, consonants, diphthongs)
  const groups = {
    'Short Vowels': words.filter(w => /[æɪʌɛɒʊ]/.test(w.ipa)),
    'Long Vowels': words.filter(w => /[iːɑːɔːuː]/.test(w.ipa)),
    'Diphthongs': words.filter(w => /[aɪeɪɔɪaʊoʊ]/.test(w.ipa)),
    'Consonants': words.filter(w => !/[æɪʌɛɒʊiːɑːɔːuːaɪeɪɔɪaʊoʊ]/.test(w.ipa)),
  };
  
  const groupProgress = Object.entries(groups).map(([group, groupWords]) => {
    const mastered = groupWords.filter(w => masteryRecords[w.word]?.mastered).length;
    return {
      group,
      mastered,
      total: groupWords.length,
      percent: groupWords.length > 0 ? Math.round((mastered / groupWords.length) * 100) : 0,
    };
  });
  
  return {
    totalWords,
    masteredWords,
    masteryPercent: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
    groupProgress,
  };
}
