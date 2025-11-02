/**
 * English sound hints for IPA symbols
 * Maps IPA phoneme symbols to simple English approximations for kids
 */

export const HINTS: Record<string, string> = {
  // Monophthongs (single vowel sounds)
  "iː": "ee",
  "ɪ": "ih",
  "uː": "oo",
  "ʊ": "uh/oo",
  "ɑː": "ah",
  "ʌ": "uh",
  "ɔː": "aw",
  "ɒ": "o",
  "e": "eh",
  "æ": "a",
  "ɜː": "ur",
  "ə": "uh",
  
  // Consonants
  "s": "s",
  "z": "z",
  "f": "f",
  "v": "v",
  "ʃ": "sh",
  "ʒ": "zh",
  "m": "m",
  "n": "n",
  "l": "l",
  "r": "r",
  "h": "h",
  "w": "w",
  "j": "y",
  "p": "p",
  "b": "b",
  "t": "t",
  "d": "d",
  "k": "k",
  "g": "g",
  "tʃ": "ch",
  "dʒ": "j",
  "θ": "th (voiceless)",
  "ð": "th (voiced)",
  "ŋ": "ng",
  
  // Diphthongs (gliding vowel sounds)
  "eɪ": "ay",
  "aɪ": "eye",
  "ɔɪ": "oy",
  "aʊ": "ow",
  "əʊ": "oh",
  "ɪə": "ear",
  "eə": "air",
  "ʊə": "oor"
};

/**
 * Get the English hint for an IPA symbol
 * @param ipa - IPA phoneme symbol (e.g., "iː", "ʃ")
 * @returns English approximation (e.g., "ee", "sh") or empty string if not found
 */
export const getHint = (ipa: string): string => HINTS[ipa] ?? "";
