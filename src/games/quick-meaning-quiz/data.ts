/**
 * Data source for Quick Meaning Quiz
 * Uses shared WORDS from spellbee-flash with type adaptation
 */

import { WORDS as SHARED_WORDS, type Word } from "../spellbee-flash/data";

export interface WordEntry {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  forms: string[];
}

// Adapt shared Word type to WordEntry (add id field and ensure forms is always array)
export const WORDS: WordEntry[] = SHARED_WORDS.map((w: Word, index: number) => ({
  id: `word-${index}-${w.word}`,
  word: w.word,
  ipa: w.ipa,
  meaning: w.meaning,
  example: w.example,
  forms: Array.isArray(w.forms) ? w.forms : [w.word],
}));
