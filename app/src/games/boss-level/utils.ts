/**
 * Boss Level Utilities
 * Adaptive helpers, minimal-pair generation, timers, persistence
 */

import type { WordEntry } from "./data";
import { PHONEME_GROUPS } from "./data";

// ==================== Types ====================

export interface BossStats {
  bestAccuracy: number;
  bestStreak: number;
  clears: number;
  lastPlayed: number;
}

export interface SessionReport {
  accuracy: number;
  bestStreak: number;
  coinsEarned: number;
  badges: string[];
  trickyPhonemes: { phoneme: string; errors: number }[];
  timestamp: number;
}

export interface RoundResult {
  correct: boolean;
  timeSpent: number;
  hintsUsed: number;
  phoneme?: string;
}

// ==================== Shuffle & Pick ====================

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== Minimal Pair Helpers ====================

export function extractPhoneme(ipa: string): string {
  // Extract core vowel/consonant from IPA (simplified)
  const matches = ipa.match(/[æɔɪʌəɜiːuːeɪaʊɔː]+|[ʃtʃdʒθðŋ]+/);
  return matches ? matches[0] : "";
}

export function getMinimalPair(targetIPA: string): string | null {
  const phoneme = extractPhoneme(targetIPA);
  const group = PHONEME_GROUPS[phoneme];
  if (!group) return null;
  
  const others = group.filter(ipa => ipa !== targetIPA);
  return others.length > 0 ? others[randomInt(0, others.length - 1)] : null;
}

export function generateIPADistractors(correctIPA: string, allWords: WordEntry[], count: number): string[] {
  const distractors: string[] = [];
  const used = new Set([correctIPA]);
  
  // Try minimal pair first
  const minimalPair = getMinimalPair(correctIPA);
  if (minimalPair && !used.has(minimalPair)) {
    distractors.push(minimalPair);
    used.add(minimalPair);
  }
  
  // Fill with random IPAs
  const shuffled = shuffle(allWords.map(w => w.ipa));
  for (const ipa of shuffled) {
    if (!used.has(ipa) && distractors.length < count) {
      distractors.push(ipa);
      used.add(ipa);
    }
  }
  
  return shuffle(distractors);
}

export function generateMeaningDistractors(
  correctMeaning: string,
  allWords: WordEntry[],
  count: number
): string[] {
  const distractors: string[] = [];
  const used = new Set([correctMeaning]);
  const words = correctMeaning.toLowerCase().split(" ");
  
  // Strategy 1: Near-synonym (shares 2+ words)
  for (const entry of allWords) {
    if (used.has(entry.meaning)) continue;
    const entryWords = entry.meaning.toLowerCase().split(" ");
    const overlap = words.filter(w => entryWords.includes(w)).length;
    if (overlap >= 2) {
      distractors.push(entry.meaning);
      used.add(entry.meaning);
      if (distractors.length >= count) break;
    }
  }
  
  // Strategy 2: Similar length
  if (distractors.length < count) {
    const targetLen = correctMeaning.length;
    const similar = allWords
      .filter(w => !used.has(w.meaning))
      .filter(w => Math.abs(w.meaning.length - targetLen) <= 10)
      .map(w => w.meaning);
    
    for (const m of shuffle(similar)) {
      if (distractors.length >= count) break;
      distractors.push(m);
      used.add(m);
    }
  }
  
  // Strategy 3: Random fallback
  if (distractors.length < count) {
    const random = shuffle(allWords.map(w => w.meaning).filter(m => !used.has(m)));
    distractors.push(...random.slice(0, count - distractors.length));
  }
  
  return shuffle(distractors.slice(0, count));
}

// ==================== Persistence (Debounced) ====================

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(key: string, value: unknown): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }
  }, 150);
}

// Coins
export function getCoins(): number {
  try {
    const val = localStorage.getItem("spellbee-coins-v1");
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function addCoins(amount: number): void {
  const current = getCoins();
  debouncedSave("spellbee-coins-v1", current + amount);
}

// Boss Stats
export function getBossStats(): BossStats {
  try {
    const val = localStorage.getItem("boss-level-stats-v1");
    return val ? JSON.parse(val) : { bestAccuracy: 0, bestStreak: 0, clears: 0, lastPlayed: 0 };
  } catch {
    return { bestAccuracy: 0, bestStreak: 0, clears: 0, lastPlayed: 0 };
  }
}

export function saveBossStats(stats: BossStats): void {
  debouncedSave("boss-level-stats-v1", stats);
}

// Session Report
export function saveSessionReport(report: SessionReport): void {
  debouncedSave("spellbee-report-v1", report);
}

// Stickers
export function getStickers(): string[] {
  try {
    const val = localStorage.getItem("spellbee-stickers-v1");
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

export function addSticker(sticker: string): void {
  const stickers = getStickers();
  if (!stickers.includes(sticker)) {
    stickers.push(sticker);
    debouncedSave("spellbee-stickers-v1", stickers);
  }
}

// Mastery tracking (SRS buckets)
export function updateMastery(wordId: string, correct: boolean): void {
  try {
    const val = localStorage.getItem("spellbee-mastery-v1");
    const mastery: Record<string, { bucket: number; lastSeen: number }> = val ? JSON.parse(val) : {};
    
    const current = mastery[wordId] || { bucket: 0, lastSeen: 0 };
    current.bucket = correct ? Math.min(5, current.bucket + 1) : Math.max(0, current.bucket - 1);
    current.lastSeen = Date.now();
    
    mastery[wordId] = current;
    debouncedSave("spellbee-mastery-v1", mastery);
  } catch (e) {
    console.warn("Mastery update failed:", e);
  }
}

// Phoneme stats
export function recordPhonemeError(phoneme: string): void {
  try {
    const val = localStorage.getItem("spellbee-phonemes-v1");
    const stats: Record<string, number> = val ? JSON.parse(val) : {};
    stats[phoneme] = (stats[phoneme] || 0) + 1;
    debouncedSave("spellbee-phonemes-v1", stats);
  } catch (e) {
    console.warn("Phoneme stat update failed:", e);
  }
}

export function getTopTrickyPhonemes(count: number): { phoneme: string; errors: number }[] {
  try {
    const val = localStorage.getItem("spellbee-phonemes-v1");
    const stats: Record<string, number> = val ? JSON.parse(val) : {};
    return Object.entries(stats)
      .map(([phoneme, errors]) => ({ phoneme, errors }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, count);
  } catch {
    return [];
  }
}

// ==================== Adaptive Difficulty ====================

export interface AdaptiveConfig {
  timerDuration: number;
  distractorCount: number;
  balloonSpeed: number;
}

export function getAdaptiveConfig(streak: number, wrongStreak: number): AdaptiveConfig {
  const config: AdaptiveConfig = {
    timerDuration: 10,
    distractorCount: 3,
    balloonSpeed: 1.0,
  };
  
  // Soften if struggling
  if (wrongStreak >= 2) {
    config.timerDuration = 15;
    config.distractorCount = 2;
    config.balloonSpeed = 0.7;
  }
  
  // Harden if on fire
  if (streak >= 5) {
    config.timerDuration = 7;
    config.distractorCount = 3;
    config.balloonSpeed = 1.3;
  }
  
  return config;
}

// ==================== Timer Helpers ====================

export function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

// ==================== TTS ====================

export function speakText(text: string): void {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  
  // Prefer female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha"));
  if (femaleVoice) utterance.voice = femaleVoice;
  
  window.speechSynthesis.speak(utterance);
}

// ==================== Badge Calculation ====================

export function calculateBadges(
  _accuracy: number,
  bestStreak: number,
  hintsUsed: number,
  earAccuracy: number,
  speedBonuses: number
): string[] {
  const badges: string[] = [];
  
  badges.push("🏁 Gauntlet Clear");
  if (hintsUsed === 0) badges.push("🎯 No-Help Hero");
  if (bestStreak >= 8) badges.push("🔥 Streak Beast");
  if (earAccuracy >= 0.8) badges.push("👂 Phoneme Pro");
  if (speedBonuses >= 6) badges.push("💨 Speed Ace");
  
  return badges;
}
