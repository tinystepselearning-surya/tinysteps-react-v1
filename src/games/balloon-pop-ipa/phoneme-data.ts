/**
 * Balloon Pop IPA - Phoneme Data
 * 
 * Contains all IPA phoneme symbols organized by category:
 * - Monophthongs (pure vowels)
 * - Diphthongs (gliding vowels)
 * - Consonants
 * 
 * Each phoneme includes examples, difficulty rating, and confusable sounds
 * for adaptive difficulty scaling.
 */

export type PhonemeCategory = "monophthongs" | "diphthongs" | "consonants";

export type Phoneme = {
  id: string;              // unique identifier (e.g. "ae", "theta", "tʃ")
  symbol: string;          // IPA symbol: "æ", "θ", "tʃ", "aɪ", "eɪ", etc.
  label?: string;          // optional plain-text name for accessibility
  examples: { word: string; ipa: string; picture?: string }[];
  difficulty: 1 | 2 | 3;   // seed difficulty (1=easy, 3=hard)
  confusables?: string[];  // ids of phonetically similar symbols
  type: PhonemeCategory;
};

export type PhonemeSet = {
  monophthongs: Phoneme[];
  diphthongs: Phoneme[];
  consonants: Phoneme[];
};

/**
 * Main phoneme dataset
 * ~43 phonemes total across all categories
 */
export const PHONEMES: PhonemeSet = {
  // ========== MONOPHTHONGS (Pure Vowels) ==========
  monophthongs: [
    {
      id: "i:",
      symbol: "iː",
      label: "long ee",
      examples: [
        { word: "eel", ipa: "iːl" },
        { word: "bee", ipa: "biː" },
        { word: "sea", ipa: "siː" }
      ],
      difficulty: 1,
      confusables: ["ɪ"],
      type: "monophthongs"
    },
    {
      id: "ɪ",
      symbol: "ɪ",
      label: "short i",
      examples: [
        { word: "ink", ipa: "ɪŋk" },
        { word: "bit", ipa: "bɪt" },
        { word: "sit", ipa: "sɪt" }
      ],
      difficulty: 1,
      confusables: ["i:", "e"],
      type: "monophthongs"
    },
    {
      id: "e",
      symbol: "e",
      label: "short e",
      examples: [
        { word: "egg", ipa: "eg" },
        { word: "bed", ipa: "bed" },
        { word: "pet", ipa: "pet" }
      ],
      difficulty: 1,
      confusables: ["æ", "ɪ"],
      type: "monophthongs"
    },
    {
      id: "æ",
      symbol: "æ",
      label: "short a",
      examples: [
        { word: "ash", ipa: "æʃ" },
        { word: "cat", ipa: "kæt" },
        { word: "bad", ipa: "bæd" }
      ],
      difficulty: 2,
      confusables: ["e", "ʌ"],
      type: "monophthongs"
    },
    {
      id: "ʌ",
      symbol: "ʌ",
      label: "schwa",
      examples: [
        { word: "up", ipa: "ʌp" },
        { word: "cup", ipa: "kʌp" },
        { word: "run", ipa: "rʌn" }
      ],
      difficulty: 2,
      confusables: ["æ", "ə"],
      type: "monophthongs"
    },
    {
      id: "ɑ:",
      symbol: "ɑː",
      label: "long a",
      examples: [
        { word: "arm", ipa: "ɑːm" },
        { word: "car", ipa: "kɑː" },
        { word: "far", ipa: "fɑː" }
      ],
      difficulty: 2,
      confusables: ["ɒ"],
      type: "monophthongs"
    },
    {
      id: "ɒ",
      symbol: "ɒ",
      label: "short o",
      examples: [
        { word: "ox", ipa: "ɒks" },
        { word: "hot", ipa: "hɒt" },
        { word: "pot", ipa: "pɒt" }
      ],
      difficulty: 2,
      confusables: ["ɑ:", "ɔ:"],
      type: "monophthongs"
    },
    {
      id: "ɔ:",
      symbol: "ɔː",
      label: "long o",
      examples: [
        { word: "ore", ipa: "ɔː" },
        { word: "saw", ipa: "sɔː" },
        { word: "door", ipa: "dɔː" }
      ],
      difficulty: 2,
      confusables: ["ɒ"],
      type: "monophthongs"
    },
    {
      id: "ʊ",
      symbol: "ʊ",
      label: "short u",
      examples: [
        { word: "foot", ipa: "fʊt" },
        { word: "book", ipa: "bʊk" },
        { word: "good", ipa: "gʊd" }
      ],
      difficulty: 2,
      confusables: ["u:"],
      type: "monophthongs"
    },
    {
      id: "u:",
      symbol: "uː",
      label: "long oo",
      examples: [
        { word: "ooze", ipa: "uːz" },
        { word: "moon", ipa: "muːn" },
        { word: "blue", ipa: "bluː" }
      ],
      difficulty: 1,
      confusables: ["ʊ"],
      type: "monophthongs"
    },
    {
      id: "ə",
      symbol: "ə",
      label: "schwa",
      examples: [
        { word: "ago", ipa: "əˈgəʊ" },
        { word: "about", ipa: "əˈbaʊt" },
        { word: "sofa", ipa: "ˈsəʊfə" }
      ],
      difficulty: 3,
      confusables: ["ʌ"],
      type: "monophthongs"
    },
    {
      id: "ɜ:",
      symbol: "ɜː",
      label: "er sound",
      examples: [
        { word: "err", ipa: "ɜː" },
        { word: "bird", ipa: "bɜːd" },
        { word: "her", ipa: "hɜː" }
      ],
      difficulty: 3,
      confusables: ["ə"],
      type: "monophthongs"
    }
  ],

  // ========== DIPHTHONGS (Gliding Vowels) ==========
  diphthongs: [
    {
      id: "aɪ",
      symbol: "aɪ",
      label: "long i",
      examples: [
        { word: "ice", ipa: "aɪs" },
        { word: "my", ipa: "maɪ" },
        { word: "try", ipa: "traɪ" }
      ],
      difficulty: 1,
      confusables: ["eɪ"],
      type: "diphthongs"
    },
    {
      id: "eɪ",
      symbol: "eɪ",
      label: "long a",
      examples: [
        { word: "ape", ipa: "eɪp" },
        { word: "day", ipa: "deɪ" },
        { word: "face", ipa: "feɪs" }
      ],
      difficulty: 1,
      confusables: ["aɪ"],
      type: "diphthongs"
    },
    {
      id: "ɔɪ",
      symbol: "ɔɪ",
      label: "oy sound",
      examples: [
        { word: "oil", ipa: "ɔɪl" },
        { word: "boy", ipa: "bɔɪ" },
        { word: "coin", ipa: "kɔɪn" }
      ],
      difficulty: 2,
      confusables: ["aɪ"],
      type: "diphthongs"
    },
    {
      id: "aʊ",
      symbol: "aʊ",
      label: "ow sound",
      examples: [
        { word: "out", ipa: "aʊt" },
        { word: "cow", ipa: "kaʊ" },
        { word: "house", ipa: "haʊs" }
      ],
      difficulty: 2,
      confusables: ["əʊ"],
      type: "diphthongs"
    },
    {
      id: "əʊ",
      symbol: "əʊ",
      label: "long o",
      examples: [
        { word: "ocean", ipa: "ˈəʊʃən" },
        { word: "go", ipa: "gəʊ" },
        { word: "boat", ipa: "bəʊt" }
      ],
      difficulty: 2,
      confusables: ["aʊ"],
      type: "diphthongs"
    },
    {
      id: "eə",
      symbol: "eə",
      label: "air sound",
      examples: [
        { word: "hare", ipa: "heə" },
        { word: "bear", ipa: "beə" },
        { word: "care", ipa: "keə" }
      ],
      difficulty: 3,
      confusables: ["ɪə"],
      type: "diphthongs"
    },
    {
      id: "ɪə",
      symbol: "ɪə",
      label: "ear sound",
      examples: [
        { word: "ear", ipa: "ɪə" },
        { word: "near", ipa: "nɪə" },
        { word: "beer", ipa: "bɪə" }
      ],
      difficulty: 3,
      confusables: ["eə"],
      type: "diphthongs"
    },
    {
      id: "ʊə",
      symbol: "ʊə",
      label: "oor sound",
      examples: [
        { word: "tour", ipa: "tʊə" },
        { word: "sure", ipa: "ʃʊə" },
        { word: "poor", ipa: "pʊə" }
      ],
      difficulty: 3,
      confusables: ["ɔ:"],
      type: "diphthongs"
    }
  ],

  // ========== CONSONANTS ==========
  consonants: [
    {
      id: "p",
      symbol: "p",
      label: "p sound",
      examples: [
        { word: "pen", ipa: "pen" },
        { word: "cup", ipa: "kʌp" },
        { word: "top", ipa: "tɒp" }
      ],
      difficulty: 1,
      confusables: ["b"],
      type: "consonants"
    },
    {
      id: "t",
      symbol: "t",
      label: "t sound",
      examples: [
        { word: "tea", ipa: "tiː" },
        { word: "cat", ipa: "kæt" },
        { word: "sit", ipa: "sɪt" }
      ],
      difficulty: 1,
      confusables: ["d"],
      type: "consonants"
    },
    {
      id: "k",
      symbol: "k",
      label: "k sound",
      examples: [
        { word: "kite", ipa: "kaɪt" },
        { word: "cup", ipa: "kʌp" },
        { word: "back", ipa: "bæk" }
      ],
      difficulty: 1,
      confusables: ["g"],
      type: "consonants"
    },
    {
      id: "f",
      symbol: "f",
      label: "f sound",
      examples: [
        { word: "fan", ipa: "fæn" },
        { word: "fish", ipa: "fɪʃ" },
        { word: "off", ipa: "ɒf" }
      ],
      difficulty: 1,
      confusables: ["v"],
      type: "consonants"
    },
    {
      id: "θ",
      symbol: "θ",
      label: "th sound (unvoiced)",
      examples: [
        { word: "thorn", ipa: "θɔːn" },
        { word: "think", ipa: "θɪŋk" },
        { word: "path", ipa: "pɑːθ" }
      ],
      difficulty: 3,
      confusables: ["ð", "f", "s"],
      type: "consonants"
    },
    {
      id: "s",
      symbol: "s",
      label: "s sound",
      examples: [
        { word: "sun", ipa: "sʌn" },
        { word: "see", ipa: "siː" },
        { word: "bus", ipa: "bʌs" }
      ],
      difficulty: 1,
      confusables: ["z", "ʃ"],
      type: "consonants"
    },
    {
      id: "ʃ",
      symbol: "ʃ",
      label: "sh sound",
      examples: [
        { word: "ship", ipa: "ʃɪp" },
        { word: "fish", ipa: "fɪʃ" },
        { word: "wash", ipa: "wɒʃ" }
      ],
      difficulty: 2,
      confusables: ["s", "ʒ", "tʃ"],
      type: "consonants"
    },
    {
      id: "tʃ",
      symbol: "tʃ",
      label: "ch sound",
      examples: [
        { word: "chain", ipa: "tʃeɪn" },
        { word: "chair", ipa: "tʃeə" },
        { word: "catch", ipa: "kætʃ" }
      ],
      difficulty: 2,
      confusables: ["ʃ", "dʒ"],
      type: "consonants"
    },
    {
      id: "b",
      symbol: "b",
      label: "b sound",
      examples: [
        { word: "bone", ipa: "bəʊn" },
        { word: "bat", ipa: "bæt" },
        { word: "cub", ipa: "kʌb" }
      ],
      difficulty: 1,
      confusables: ["p"],
      type: "consonants"
    },
    {
      id: "d",
      symbol: "d",
      label: "d sound",
      examples: [
        { word: "dot", ipa: "dɒt" },
        { word: "dog", ipa: "dɒg" },
        { word: "bed", ipa: "bed" }
      ],
      difficulty: 1,
      confusables: ["t"],
      type: "consonants"
    },
    {
      id: "g",
      symbol: "g",
      label: "g sound",
      examples: [
        { word: "gum", ipa: "gʌm" },
        { word: "go", ipa: "gəʊ" },
        { word: "bag", ipa: "bæg" }
      ],
      difficulty: 1,
      confusables: ["k"],
      type: "consonants"
    },
    {
      id: "v",
      symbol: "v",
      label: "v sound",
      examples: [
        { word: "van", ipa: "væn" },
        { word: "vine", ipa: "vaɪn" },
        { word: "love", ipa: "lʌv" }
      ],
      difficulty: 2,
      confusables: ["f"],
      type: "consonants"
    },
    {
      id: "ð",
      symbol: "ð",
      label: "th sound (voiced)",
      examples: [
        { word: "these", ipa: "ðiːz" },
        { word: "this", ipa: "ðɪs" },
        { word: "bathe", ipa: "beɪð" }
      ],
      difficulty: 3,
      confusables: ["θ", "d", "z"],
      type: "consonants"
    },
    {
      id: "z",
      symbol: "z",
      label: "z sound",
      examples: [
        { word: "zoo", ipa: "zuː" },
        { word: "zip", ipa: "zɪp" },
        { word: "buzz", ipa: "bʌz" }
      ],
      difficulty: 1,
      confusables: ["s"],
      type: "consonants"
    },
    {
      id: "ʒ",
      symbol: "ʒ",
      label: "zh sound",
      examples: [
        { word: "treasure", ipa: "ˈtreʒə" },
        { word: "vision", ipa: "ˈvɪʒən" },
        { word: "beige", ipa: "beɪʒ" }
      ],
      difficulty: 3,
      confusables: ["ʃ", "dʒ"],
      type: "consonants"
    },
    {
      id: "dʒ",
      symbol: "dʒ",
      label: "j sound",
      examples: [
        { word: "jar", ipa: "dʒɑː" },
        { word: "jump", ipa: "dʒʌmp" },
        { word: "badge", ipa: "bædʒ" }
      ],
      difficulty: 2,
      confusables: ["tʃ", "ʒ"],
      type: "consonants"
    },
    {
      id: "m",
      symbol: "m",
      label: "m sound",
      examples: [
        { word: "mail", ipa: "meɪl" },
        { word: "man", ipa: "mæn" },
        { word: "sum", ipa: "sʌm" }
      ],
      difficulty: 1,
      confusables: ["n"],
      type: "consonants"
    },
    {
      id: "n",
      symbol: "n",
      label: "n sound",
      examples: [
        { word: "nail", ipa: "neɪl" },
        { word: "net", ipa: "net" },
        { word: "sun", ipa: "sʌn" }
      ],
      difficulty: 1,
      confusables: ["m", "ŋ"],
      type: "consonants"
    },
    {
      id: "ŋ",
      symbol: "ŋ",
      label: "ng sound",
      examples: [
        { word: "sing", ipa: "sɪŋ" },
        { word: "ring", ipa: "rɪŋ" },
        { word: "long", ipa: "lɒŋ" }
      ],
      difficulty: 2,
      confusables: ["n"],
      type: "consonants"
    },
    {
      id: "r",
      symbol: "r",
      label: "r sound",
      examples: [
        { word: "roof", ipa: "ruːf" },
        { word: "red", ipa: "red" },
        { word: "car", ipa: "kɑː" }
      ],
      difficulty: 1,
      confusables: ["l"],
      type: "consonants"
    },
    {
      id: "l",
      symbol: "l",
      label: "l sound",
      examples: [
        { word: "lotus", ipa: "ˈləʊtəs" },
        { word: "lip", ipa: "lɪp" },
        { word: "bell", ipa: "bel" }
      ],
      difficulty: 1,
      confusables: ["r"],
      type: "consonants"
    },
    {
      id: "j",
      symbol: "j",
      label: "y sound",
      examples: [
        { word: "yak", ipa: "jæk" },
        { word: "yes", ipa: "jes" },
        { word: "you", ipa: "juː" }
      ],
      difficulty: 2,
      confusables: ["dʒ"],
      type: "consonants"
    },
    {
      id: "w",
      symbol: "w",
      label: "w sound",
      examples: [
        { word: "worm", ipa: "wɜːm" },
        { word: "wet", ipa: "wet" },
        { word: "win", ipa: "wɪn" }
      ],
      difficulty: 1,
      confusables: ["v"],
      type: "consonants"
    },
    {
      id: "h",
      symbol: "h",
      label: "h sound",
      examples: [
        { word: "huge", ipa: "hjuːdʒ" },
        { word: "hat", ipa: "hæt" },
        { word: "hot", ipa: "hɒt" }
      ],
      difficulty: 1,
      type: "consonants"
    }
  ]
};

/**
 * Helper function to get all phonemes as a flat array
 */
export function getAllPhonemes(): Phoneme[] {
  return [
    ...PHONEMES.monophthongs,
    ...PHONEMES.diphthongs,
    ...PHONEMES.consonants
  ];
}

/**
 * Helper function to get phonemes by category
 */
export function getPhonemesByCategory(category: PhonemeCategory | "mixed"): Phoneme[] {
  if (category === "mixed") {
    return getAllPhonemes();
  }
  return PHONEMES[category];
}

/**
 * Helper function to find a phoneme by ID
 */
export function findPhonemeById(id: string): Phoneme | undefined {
  return getAllPhonemes().find(p => p.id === id);
}

// ========== MINIMAL PAIRS ==========

export type MinimalPair = {
  targetA: string; // phoneme id
  targetB: string; // phoneme id
};

export const MINIMAL_PAIRS: MinimalPair[] = [
  { targetA: "p", targetB: "b" },
  { targetA: "t", targetB: "d" },
  { targetA: "k", targetB: "g" },
  { targetA: "f", targetB: "v" },
  { targetA: "s", targetB: "z" },
  { targetA: "θ", targetB: "ð" },
  { targetA: "ʃ", targetB: "ʒ" },
  { targetA: "tʃ", targetB: "dʒ" },
  { targetA: "i:", targetB: "ɪ" },
  { targetA: "u:", targetB: "ʊ" },
  { targetA: "æ", targetB: "e" },
  { targetA: "ɑ:", targetB: "ɒ" },
  { targetA: "aɪ", targetB: "eɪ" },
  { targetA: "aʊ", targetB: "əʊ" },
  { targetA: "eə", targetB: "ɪə" },
  { targetA: "m", targetB: "n" },
  { targetA: "l", targetB: "r" }
];

export function getMinimalPairs(): MinimalPair[] {
  return MINIMAL_PAIRS;
}

// ========== TRICKY WORDS & RHYMES ==========

export type TrickyWord = {
  word: string;
  ipa: string;
  rhymeAnchors: string[]; // words that rhyme
};

export const TRICKY_WORDS: TrickyWord[] = [
  { word: "shoe", ipa: "ʃuː", rhymeAnchors: ["zoo", "too", "blue", "new"] },
  { word: "chair", ipa: "tʃeə", rhymeAnchors: ["bear", "hair", "air", "care"] },
  { word: "think", ipa: "θɪŋk", rhymeAnchors: ["sink", "pink", "link", "blink"] },
  { word: "bath", ipa: "bɑːθ", rhymeAnchors: ["path", "math", "wrath"] },
  { word: "boy", ipa: "bɔɪ", rhymeAnchors: ["toy", "joy", "ploy", "coy"] },
  { word: "house", ipa: "haʊs", rhymeAnchors: ["mouse", "louse", "grouse"] },
  { word: "near", ipa: "nɪə", rhymeAnchors: ["beer", "fear", "dear", "hear"] },
  { word: "day", ipa: "deɪ", rhymeAnchors: ["say", "way", "play", "stay"] },
  { word: "night", ipa: "naɪt", rhymeAnchors: ["light", "bright", "sight", "fight"] },
  { word: "moon", ipa: "muːn", rhymeAnchors: ["soon", "noon", "tune", "June"] },
  { word: "cat", ipa: "kæt", rhymeAnchors: ["bat", "hat", "mat", "sat"] },
  { word: "dog", ipa: "dɒg", rhymeAnchors: ["log", "fog", "jog", "hog"] }
];

export function getTrickyWords(): TrickyWord[] {
  return TRICKY_WORDS;
}
