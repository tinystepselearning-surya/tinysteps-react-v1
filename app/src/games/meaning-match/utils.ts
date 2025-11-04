/**
 * Utility functions for Meaning-Match Drag-Drop
 */

import type { Word } from "./data";

const COINS_KEY = "meaning-match-coins-v1";
const STRUGGLING_KEY = "meaning-match-struggling-v1";
const MASTERY_KEY = "meaning-match-mastery-v1";
const ACHIEVEMENTS_KEY = "meaning-match-achievements-v1";

/** Mastery data structure per word */
export interface MasteryRecord {
  meaningCorrectFirst: number; // How many times matched meaning on first try
  ipaCorrectFirst: number;     // How many times matched IPA on first try
  totalMatches: number;        // Total complete matches (both correct)
  lastPracticed: number;       // Timestamp
  mastered: boolean;           // true if consistently matching both on first try
}

/** Achievement definition */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  earned: boolean;
  earnedAt?: number;
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
 * Pick N distinct words from the dataset, avoiding immediate repeats
 */
export function pickWords(
  allWords: Word[],
  count: number,
  recentWordIds: Set<string> = new Set()
): Word[] {
  // Filter out recent words
  const available = allWords.filter((w) => !recentWordIds.has(w.word));
  
  // If we don't have enough, use all words
  const pool = available.length >= count ? available : allWords;
  
  // Shuffle and take first N
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}

/**
 * Get minimal pair hint for IPA (e.g., /æ/ vs /ʌ/)
 */
export function getMinimalPairHint(ipa: string): string {
  const pairs: Record<string, string> = {
    "/æ/": "like 'cat' - /æ/ (not /ʌ/ like 'cut')",
    "/ʌ/": "like 'cup' - /ʌ/ (not /æ/ like 'cap')",
    "/ɪ/": "like 'sit' - /ɪ/ (not /iː/ like 'seat')",
    "/iː/": "like 'see' - /iː/ (long)",
    "/ɛ/": "like 'bed' - /ɛ/",
    "/ə/": "schwa sound - /ə/ (unstressed)",
    "/ɔː/": "like 'call' - /ɔː/",
    "/ɒ/": "like 'hot' - /ɒ/",
  };

  // Try to find a matching phoneme
  for (const [phoneme, hint] of Object.entries(pairs)) {
    if (ipa.includes(phoneme)) {
      return hint;
    }
  }

  return `Listen: ${ipa}`;
}

/**
 * Coin management
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
 * Struggling words set (words that needed hints or multiple attempts)
 */
export function getStrugglingWords(): Set<string> {
  try {
    const stored = localStorage.getItem(STRUGGLING_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function addStrugglingWord(wordId: string): void {
  try {
    const current = getStrugglingWords();
    current.add(wordId);
    localStorage.setItem(STRUGGLING_KEY, JSON.stringify([...current]));
  } catch {
    console.warn("Failed to save struggling word");
  }
}

export function clearStrugglingWords(): void {
  try {
    localStorage.removeItem(STRUGGLING_KEY);
  } catch {
    console.warn("Failed to clear struggling words");
  }
}

/**
 * Get words from struggling set for practice
 */
export function getStrugglingWordObjects(allWords: Word[]): Word[] {
  const strugglingIds = getStrugglingWords();
  return allWords.filter((w) => strugglingIds.has(w.word));
}

/**
 * Speak text using Web Speech API with female American accent
 */
export function speakWord(text: string): () => void {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  utterance.volume = 0.8;
  utterance.lang = "en-US";

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
    const usVoice = voices.find((voice) => voice.lang.startsWith("en-US"));
    if (usVoice) {
      utterance.voice = usVoice;
    }
  }

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

/**
 * Mastery tracking - track how well student performs on each word
 */
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
  meaningCorrectFirst: boolean,
  ipaCorrectFirst: boolean,
  bothComplete: boolean
): void {
  const data = getMasteryData();
  const existing = data.get(wordId) || {
    meaningCorrectFirst: 0,
    ipaCorrectFirst: 0,
    totalMatches: 0,
    lastPracticed: 0,
    mastered: false,
  };

  if (meaningCorrectFirst) existing.meaningCorrectFirst += 1;
  if (ipaCorrectFirst) existing.ipaCorrectFirst += 1;
  if (bothComplete) existing.totalMatches += 1;
  
  existing.lastPracticed = Date.now();
  
  // Mastered if 3+ total matches with high first-try rate
  existing.mastered = 
    existing.totalMatches >= 3 &&
    existing.meaningCorrectFirst >= 2 &&
    existing.ipaCorrectFirst >= 2;

  data.set(wordId, existing);
  saveMasteryData(data);
}

/**
 * Achievement system
 */
const ALL_ACHIEVEMENTS: Omit<Achievement, 'earned' | 'earnedAt'>[] = [
  { id: 'first_match', name: 'First Match', description: 'Complete your first word match', icon: '⭐', target: 1 },
  { id: 'match_10', name: 'Word Matcher', description: 'Master 10 words', icon: '🎯', target: 10 },
  { id: 'match_25', name: 'Match Expert', description: 'Master 25 words', icon: '🏆', target: 25 },
  { id: 'match_50', name: 'Matching Legend', description: 'Master 50 words', icon: '👑', target: 50 },
  { id: 'match_all', name: 'Perfect Matcher', description: 'Master all 148 words', icon: '🎖️', target: 148 },
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
  const masteryData = getMasteryData();
  const masteredCount = Array.from(masteryData.values()).filter(r => r.mastered).length;
  const earned = getEarnedAchievements();
  const newAchievements: Achievement[] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (earned.has(achievement.id)) continue;

    const shouldEarn = masteredCount >= achievement.target;
    if (shouldEarn) {
      earned.add(achievement.id);
      newAchievements.push({
        ...achievement,
        earned: true,
        earnedAt: Date.now(),
      });
    }
  }

  if (newAchievements.length > 0) {
    saveEarnedAchievements(earned);
  }

  return newAchievements;
}

export function getAllAchievements(): Achievement[] {
  const earned = getEarnedAchievements();
  return ALL_ACHIEVEMENTS.map(ach => ({
    ...ach,
    earned: earned.has(ach.id),
    earnedAt: earned.has(ach.id) ? Date.now() : undefined,
  }));
}

/**
 * Compute statistics for progress dashboard
 */
export function computeProgressStats(allWords: Word[]) {
  const masteryData = getMasteryData();
  const masteredWords = Array.from(masteryData.values()).filter(r => r.mastered);
  const totalWords = allWords.length;
  const masteredCount = masteredWords.length;
  const percent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  // Group by first letter
  const groupStats: Record<string, { total: number; mastered: number; percent: number }> = {};
  
  for (const word of allWords) {
    const firstLetter = word.word[0].toUpperCase();
    const group = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
    
    if (!groupStats[group]) {
      groupStats[group] = { total: 0, mastered: 0, percent: 0 };
    }
    
    groupStats[group].total += 1;
    const record = masteryData.get(word.word);
    if (record?.mastered) {
      groupStats[group].mastered += 1;
    }
  }

  // Calculate percentages
  for (const group in groupStats) {
    const stats = groupStats[group];
    stats.percent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
  }

  return {
    overall: { total: totalWords, mastered: masteredCount, percent },
    groups: groupStats,
  };
}
