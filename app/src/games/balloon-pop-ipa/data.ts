/**
 * Data source for Balloon-Pop IPA
 * 44 IPA Phonemes ordered by salience (vowel contrasts → continuous → stops → affricates → diphthongs)
 * Phase 1 – Phoneme Listening Order
 */

export interface Phoneme {
  word: string;          // IPA symbol for display (e.g., "/iː/")
  ipa: string;           // IPA symbol (e.g., "/iː/")
  label: string;         // Display name (e.g., "ee")
  description: string;   // Example (e.g., "as in see")
  audioKey: string;      // Audio file key
  phase: number;         // Learning phase (1-6)
}

// Type alias for compatibility with BalloonPop component
export type Word = Phoneme;

/**
 * 44 Core Phonemes - Ordered by salience & teaching sequence
 * Phase 1 (P1): Vowel contrasts (12) - sustained, high salience
 * Phase 2 (P2): Continuous consonants (13) - easy to hold
 * Phase 3 (P3): Oral stops (6) - very short
 * Phase 4 (P4): Affricates & interdentals (5) - higher confusion
 * Phase 5 (P5): Nasal coda (1)
 * Phase 6 (P6): Diphthongs (7) - complex glides
 */
export const PHONEMES: Phoneme[] = [
  // Phase 1: Vowel Contrasts (12)
  { word: "/iː/", ipa: "/iː/", label: "ee", description: "as in see", audioKey: "i", phase: 1 },
  { word: "/ɪ/", ipa: "/ɪ/", label: "ih", description: "as in sit", audioKey: "I", phase: 1 },
  { word: "/uː/", ipa: "/uː/", label: "oo", description: "as in food", audioKey: "u", phase: 1 },
  { word: "/ʊ/", ipa: "/ʊ/", label: "uh", description: "as in foot", audioKey: "U", phase: 1 },
  { word: "/ɑː/", ipa: "/ɑː/", label: "ah", description: "as in father", audioKey: "A", phase: 1 },
  { word: "/ʌ/", ipa: "/ʌ/", label: "uh", description: "as in cup", audioKey: "V", phase: 1 },
  { word: "/ɔː/", ipa: "/ɔː/", label: "aw", description: "as in saw", audioKey: "O", phase: 1 },
  { word: "/ɒ/", ipa: "/ɒ/", label: "o", description: "as in hot", audioKey: "Q", phase: 1 },
  { word: "/e/", ipa: "/e/", label: "eh", description: "as in bed", audioKey: "e", phase: 1 },
  { word: "/æ/", ipa: "/æ/", label: "a", description: "as in cat", audioKey: "{", phase: 1 },
  { word: "/ɜː/", ipa: "/ɜː/", label: "ur", description: "as in bird", audioKey: "3", phase: 1 },
  { word: "/ə/", ipa: "/ə/", label: "uh", description: "as in about", audioKey: "@", phase: 1 },

  // Phase 2: Continuous Consonants (13)
  { word: "/s/", ipa: "/s/", label: "s", description: "as in sun", audioKey: "s", phase: 2 },
  { word: "/z/", ipa: "/z/", label: "z", description: "as in zoo", audioKey: "z", phase: 2 },
  { word: "/f/", ipa: "/f/", label: "f", description: "as in fan", audioKey: "f", phase: 2 },
  { word: "/v/", ipa: "/v/", label: "v", description: "as in van", audioKey: "v", phase: 2 },
  { word: "/ʃ/", ipa: "/ʃ/", label: "sh", description: "as in ship", audioKey: "S", phase: 2 },
  { word: "/ʒ/", ipa: "/ʒ/", label: "zh", description: "as in measure", audioKey: "Z", phase: 2 },
  { word: "/m/", ipa: "/m/", label: "m", description: "as in man", audioKey: "m", phase: 2 },
  { word: "/n/", ipa: "/n/", label: "n", description: "as in no", audioKey: "n", phase: 2 },
  { word: "/l/", ipa: "/l/", label: "l", description: "as in leg", audioKey: "l", phase: 2 },
  { word: "/r/", ipa: "/r/", label: "r", description: "as in red", audioKey: "r", phase: 2 },
  { word: "/h/", ipa: "/h/", label: "h", description: "as in hat", audioKey: "h", phase: 2 },
  { word: "/w/", ipa: "/w/", label: "w", description: "as in wet", audioKey: "w", phase: 2 },
  { word: "/j/", ipa: "/j/", label: "y", description: "as in yes", audioKey: "j", phase: 2 },

  // Phase 3: Oral Stops (6)
  { word: "/p/", ipa: "/p/", label: "p", description: "as in pen", audioKey: "p", phase: 3 },
  { word: "/b/", ipa: "/b/", label: "b", description: "as in bat", audioKey: "b", phase: 3 },
  { word: "/t/", ipa: "/t/", label: "t", description: "as in top", audioKey: "t", phase: 3 },
  { word: "/d/", ipa: "/d/", label: "d", description: "as in dog", audioKey: "d", phase: 3 },
  { word: "/k/", ipa: "/k/", label: "k", description: "as in kite", audioKey: "k", phase: 3 },
  { word: "/g/", ipa: "/g/", label: "g", description: "as in go", audioKey: "g", phase: 3 },

  // Phase 4: Affricates & Interdentals (5)
  { word: "/tʃ/", ipa: "/tʃ/", label: "ch", description: "as in chair", audioKey: "tS", phase: 4 },
  { word: "/dʒ/", ipa: "/dʒ/", label: "j", description: "as in jam", audioKey: "dZ", phase: 4 },
  { word: "/θ/", ipa: "/θ/", label: "th", description: "as in thin", audioKey: "T", phase: 4 },
  { word: "/ð/", ipa: "/ð/", label: "th", description: "as in this", audioKey: "D", phase: 4 },
  { word: "/ŋ/", ipa: "/ŋ/", label: "ng", description: "as in sing", audioKey: "N", phase: 4 },

  // Phase 5: Diphthongs (7)
  { word: "/eɪ/", ipa: "/eɪ/", label: "ay", description: "as in day", audioKey: "eI", phase: 5 },
  { word: "/aɪ/", ipa: "/aɪ/", label: "eye", description: "as in ice", audioKey: "aI", phase: 5 },
  { word: "/ɔɪ/", ipa: "/ɔɪ/", label: "oy", description: "as in toy", audioKey: "OI", phase: 5 },
  { word: "/aʊ/", ipa: "/aʊ/", label: "ow", description: "as in now", audioKey: "aU", phase: 5 },
  { word: "/əʊ/", ipa: "/əʊ/", label: "oh", description: "as in go", audioKey: "@U", phase: 5 },
  { word: "/ɪə/", ipa: "/ɪə/", label: "ear", description: "as in ear", audioKey: "I@", phase: 5 },
  { word: "/eə/", ipa: "/eə/", label: "air", description: "as in air", audioKey: "e@", phase: 5 },
  { word: "/ʊə/", ipa: "/ʊə/", label: "oor", description: "as in poor", audioKey: "U@", phase: 5 },
];

// Export for compatibility
export const WORDS = PHONEMES;
