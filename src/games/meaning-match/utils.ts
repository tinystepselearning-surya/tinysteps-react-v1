/**
 * Utility functions for Meaning-Match Drag-Drop
 */

import type { Word } from "./data";

const COINS_KEY = "spellbee-coins-v1";
const STRUGGLING_KEY = "meaning-match-struggling-v1";

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
