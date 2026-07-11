export type PublicSpellingMode = "build" | "family" | "missing" | "choice" | "fix" | "spell";

export type PublicSpellingDifficulty = "foundation" | "developing" | "confident";

type PublicSpellingChallengeBase = {
  id: string;
  word: string;
  clue: string;
  clueType: "picture" | "meaning" | "sentence";
  img?: string;
  emojiFallback?: string;
  spellingPattern?: string;
  reviewEligible?: boolean;
  review?: boolean;
};

export type PublicSpellingChallenge =
  | (PublicSpellingChallengeBase & { mode: "build"; tiles: string[] })
  | (PublicSpellingChallengeBase & { mode: "family"; rime: string; onset: string; tiles: string[] })
  | (PublicSpellingChallengeBase & { mode: "missing"; pattern: string; onset: string; tiles: string[] })
  | (PublicSpellingChallengeBase & { mode: "choice"; choices: string[] })
  | (PublicSpellingChallengeBase & { mode: "fix"; incorrectSpelling: string })
  | (PublicSpellingChallengeBase & { mode: "spell" });

export type PublicSpellingLevel = {
  id: string;
  mode: PublicSpellingMode;
  title: string;
  shortTitle: string;
  instruction: string;
  difficulty: PublicSpellingDifficulty;
  ageRange: string;
  skill: string;
  spellingPatterns: string[];
  challenges: PublicSpellingChallenge[];
};

const IMAGE_BASE = "/games/maw";

export const PUBLIC_SPELLING_LEVELS: PublicSpellingLevel[] = [
  {
    id: "build-it",
    mode: "build",
    title: "Build It",
    shortTitle: "Build",
    instruction: "Look at the picture. Tap the letters in order to build the word.",
    difficulty: "foundation",
    ageRange: "5-7",
    skill: "Form words from shuffled letters",
    spellingPatterns: ["CVC", "CCVC", "CVCC"],
    challenges: [
      { id: "build-cat", mode: "build", word: "cat", clue: "A small pet that says meow.", clueType: "picture", img: `${IMAGE_BASE}/cat.png`, emojiFallback: "🐱", spellingPattern: "CVC", tiles: ["t", "c", "a"] },
      { id: "build-dog", mode: "build", word: "dog", clue: "A friendly pet that can bark.", clueType: "picture", img: `${IMAGE_BASE}/dog.png`, emojiFallback: "🐶", spellingPattern: "CVC", tiles: ["g", "d", "o"] },
      { id: "build-sun", mode: "build", word: "sun", clue: "It shines in the daytime sky.", clueType: "picture", img: `${IMAGE_BASE}/sun.png`, emojiFallback: "☀️", spellingPattern: "CVC", tiles: ["n", "s", "u"] },
      { id: "build-pig", mode: "build", word: "pig", clue: "A farm animal with a curly tail.", clueType: "picture", img: `${IMAGE_BASE}/pig.png`, emojiFallback: "🐷", spellingPattern: "CVC", tiles: ["i", "g", "p"] },
      { id: "build-train", mode: "build", word: "train", clue: "It travels on railway tracks.", clueType: "picture", img: `${IMAGE_BASE}/train.png`, emojiFallback: "🚆", spellingPattern: "initial blend", tiles: ["a", "t", "n", "r", "i"] },
      { id: "build-nest", mode: "build", word: "nest", clue: "A bird may build this for its eggs.", clueType: "picture", img: `${IMAGE_BASE}/nest.png`, emojiFallback: "🪹", spellingPattern: "CVCC", tiles: ["s", "n", "t", "e"] },
    ],
  },
  {
    id: "word-families",
    mode: "family",
    title: "Word Families",
    shortTitle: "Families",
    instruction: "Use the picture and ending. Choose the missing first letter.",
    difficulty: "foundation",
    ageRange: "5-7",
    skill: "Recognise common word endings",
    spellingPatterns: ["-at", "-ap", "-og", "-un", "-ig", "-ing"],
    challenges: [
      { id: "family-cat", mode: "family", word: "cat", clue: "This animal is a pet.", clueType: "picture", img: `${IMAGE_BASE}/cat.png`, emojiFallback: "🐱", spellingPattern: "-at", rime: "at", onset: "c", tiles: ["b", "c", "h", "m"] },
      { id: "family-map", mode: "family", word: "map", clue: "It helps you find places.", clueType: "meaning", emojiFallback: "🗺️", spellingPattern: "-ap", rime: "ap", onset: "m", tiles: ["c", "n", "m", "t"] },
      { id: "family-dog", mode: "family", word: "dog", clue: "This animal can bark.", clueType: "picture", img: `${IMAGE_BASE}/dog.png`, emojiFallback: "🐶", spellingPattern: "-og", rime: "og", onset: "d", tiles: ["l", "d", "f", "h"] },
      { id: "family-sun", mode: "family", word: "sun", clue: "It gives light in the day.", clueType: "picture", img: `${IMAGE_BASE}/sun.png`, emojiFallback: "☀️", spellingPattern: "-un", rime: "un", onset: "s", tiles: ["b", "r", "s", "n"] },
      { id: "family-pig", mode: "family", word: "pig", clue: "A farm animal with a curly tail.", clueType: "picture", img: `${IMAGE_BASE}/pig.png`, emojiFallback: "🐷", spellingPattern: "-ig", rime: "ig", onset: "p", tiles: ["d", "f", "p", "w"] },
      { id: "family-ring", mode: "family", word: "ring", clue: "A small band worn on a finger.", clueType: "picture", img: `${IMAGE_BASE}/ring.png`, emojiFallback: "💍", spellingPattern: "-ing", rime: "ing", onset: "r", tiles: ["s", "w", "r", "k"] },
    ],
  },
  {
    id: "complete-it",
    mode: "missing",
    title: "Complete It",
    shortTitle: "Complete",
    instruction: "Read the clue. Choose the missing letter to complete the word.",
    difficulty: "developing",
    ageRange: "5-8",
    skill: "Recall missing letters in spelling patterns",
    spellingPatterns: ["short vowels", "digraphs", "consonant blends", "Magic E"],
    challenges: [
      { id: "missing-cat", mode: "missing", word: "cat", clue: "A small pet.", clueType: "picture", img: `${IMAGE_BASE}/cat.png`, emojiFallback: "🐱", spellingPattern: "short a", pattern: "c _ t", onset: "a", tiles: ["a", "o", "u", "e"] },
      { id: "missing-sun", mode: "missing", word: "sun", clue: "It shines in the sky.", clueType: "picture", img: `${IMAGE_BASE}/sun.png`, emojiFallback: "☀️", spellingPattern: "short u", pattern: "s _ n", onset: "u", tiles: ["a", "u", "i", "e"] },
      { id: "missing-pig", mode: "missing", word: "pig", clue: "A farm animal.", clueType: "picture", img: `${IMAGE_BASE}/pig.png`, emojiFallback: "🐷", spellingPattern: "short i", pattern: "p _ g", onset: "i", tiles: ["i", "a", "o", "u"] },
      { id: "missing-hen", mode: "missing", word: "hen", clue: "A bird that can lay eggs.", clueType: "meaning", emojiFallback: "🐔", spellingPattern: "short e", pattern: "h _ n", onset: "e", tiles: ["a", "e", "i", "o"] },
      { id: "missing-fish", mode: "missing", word: "fish", clue: "An animal that swims in water.", clueType: "picture", img: `${IMAGE_BASE}/fish.png`, emojiFallback: "🐟", spellingPattern: "sh digraph", pattern: "f _ sh", onset: "i", tiles: ["e", "i", "a", "o"] },
      { id: "missing-kite", mode: "missing", word: "kite", clue: "It flies in the wind on a string.", clueType: "picture", img: `${IMAGE_BASE}/kite.png`, emojiFallback: "🪁", spellingPattern: "i_e Magic E", pattern: "k _ te", onset: "i", tiles: ["i", "a", "o", "u"] },
    ],
  },
  {
    id: "choose-it",
    mode: "choice",
    title: "Choose It",
    shortTitle: "Choose",
    instruction: "Look at the clue. Choose the correctly spelled word.",
    difficulty: "developing",
    ageRange: "6-8",
    skill: "Distinguish correct spellings from common errors",
    spellingPatterns: ["digraphs", "vowel teams", "silent letters", "Magic E"],
    challenges: [
      { id: "choose-fish", mode: "choice", word: "fish", clue: "This animal swims in water.", clueType: "picture", img: `${IMAGE_BASE}/fish.png`, emojiFallback: "🐟", spellingPattern: "sh digraph", choices: ["fesh", "fish", "fissh"] },
      { id: "choose-elephant", mode: "choice", word: "elephant", clue: "A very big animal with a long trunk.", clueType: "picture", img: `${IMAGE_BASE}/elephant.png`, emojiFallback: "🐘", spellingPattern: "ph digraph", choices: ["elefant", "elephant", "eliphant"] },
      { id: "choose-tiger", mode: "choice", word: "tiger", clue: "A big striped wild cat.", clueType: "picture", img: `${IMAGE_BASE}/tiger.png`, emojiFallback: "🐯", spellingPattern: "long i", choices: ["tiger", "tigar", "tieger"] },
      { id: "choose-queen", mode: "choice", word: "queen", clue: "A woman who rules a kingdom.", clueType: "picture", img: `${IMAGE_BASE}/queen.png`, emojiFallback: "👑", spellingPattern: "qu and ee", choices: ["qween", "queen", "quean"] },
      { id: "choose-whale", mode: "choice", word: "whale", clue: "A very large animal that lives in the sea.", clueType: "picture", img: `${IMAGE_BASE}/whale.png`, emojiFallback: "🐋", spellingPattern: "wh and a_e", choices: ["wale", "whale", "whael"] },
      { id: "choose-grape", mode: "choice", word: "grape", clue: "A small fruit that grows in bunches.", clueType: "picture", img: `${IMAGE_BASE}/grape.png`, emojiFallback: "🍇", spellingPattern: "a_e Magic E", choices: ["grap", "graip", "grape"] },
    ],
  },
  {
    id: "fix-it",
    mode: "fix",
    title: "Fix It",
    shortTitle: "Fix",
    instruction: "This word has a spelling mistake. Type the correct spelling.",
    difficulty: "confident",
    ageRange: "6-9",
    skill: "Correct frequently misspelled words",
    spellingPatterns: ["vowel teams", "silent letters", "digraphs", "high-frequency words"],
    challenges: [
      { id: "fix-friend", mode: "fix", word: "friend", incorrectSpelling: "frend", clue: "A person you like and enjoy spending time with.", clueType: "meaning", spellingPattern: "ie vowel team" },
      { id: "fix-because", mode: "fix", word: "because", incorrectSpelling: "becaus", clue: "A word used to give a reason.", clueType: "meaning", spellingPattern: "silent final e" },
      { id: "fix-elephant", mode: "fix", word: "elephant", incorrectSpelling: "elefant", clue: "A large grey animal with a trunk.", clueType: "meaning", emojiFallback: "🐘", spellingPattern: "ph digraph" },
      { id: "fix-people", mode: "fix", word: "people", incorrectSpelling: "peple", clue: "More than one person.", clueType: "meaning", spellingPattern: "eo vowel pattern" },
      { id: "fix-watch", mode: "fix", word: "watch", incorrectSpelling: "woch", clue: "Something worn on the wrist to show the time.", clueType: "picture", img: `${IMAGE_BASE}/watch.png`, emojiFallback: "⌚", spellingPattern: "tch trigraph" },
      { id: "fix-school", mode: "fix", word: "school", incorrectSpelling: "scool", clue: "A place where children learn.", clueType: "meaning", emojiFallback: "🏫", spellingPattern: "sch and oo" },
    ],
  },
  {
    id: "spell-it",
    mode: "spell",
    title: "Spell It",
    shortTitle: "Spell",
    instruction: "Look at the clue. Type the whole word.",
    difficulty: "confident",
    ageRange: "6-9",
    skill: "Recall whole spellings from meaning and context",
    spellingPatterns: ["CVC", "vowel teams", "digraphs", "multisyllabic words"],
    challenges: [
      { id: "spell-sun", mode: "spell", word: "sun", clue: "The ___ shines brightly during the day.", clueType: "sentence", emojiFallback: "☀️", spellingPattern: "CVC" },
      { id: "spell-friend", mode: "spell", word: "friend", clue: "A person you like and enjoy spending time with.", clueType: "meaning", spellingPattern: "ie vowel team" },
      { id: "spell-queen", mode: "spell", word: "queen", clue: "A woman who rules a kingdom.", clueType: "meaning", emojiFallback: "👑", spellingPattern: "qu and ee" },
      { id: "spell-elephant", mode: "spell", word: "elephant", clue: "A large grey animal with a trunk.", clueType: "meaning", emojiFallback: "🐘", spellingPattern: "ph digraph" },
      { id: "spell-train", mode: "spell", word: "train", clue: "A vehicle that carries people or goods on railway tracks.", clueType: "meaning", emojiFallback: "🚆", spellingPattern: "tr blend and ai" },
      { id: "spell-library", mode: "spell", word: "library", clue: "A place where books are kept for people to read or borrow.", clueType: "meaning", emojiFallback: "📚", spellingPattern: "multisyllabic word" },
    ],
  },
];

export const normalizePublicSpellingAnswer = (answer: string) => answer.trim().toLocaleLowerCase("en");

const isNonEmpty = (value: string | undefined) => Boolean(value?.trim());
const imagePathPattern = /^\/games\/maw\/[a-z0-9][a-z0-9-]*\.(?:png|jpe?g|webp)$/i;
const targetWordPattern = /^[a-z]+$/;

export function validatePublicSpellingContent(levels: PublicSpellingLevel[]): string[] {
  const errors: string[] = [];
  const levelIds = new Set<string>();
  const challengeIds = new Set<string>();

  for (const level of levels) {
    if (!isNonEmpty(level.id)) errors.push("A spelling level has an empty id.");
    else if (levelIds.has(level.id)) errors.push(`Duplicate spelling level id: ${level.id}`);
    levelIds.add(level.id);

    if (!isNonEmpty(level.title) || !isNonEmpty(level.instruction)) {
      errors.push(`Level ${level.id || "(unknown)"} needs a title and instruction.`);
    }
    if (!isNonEmpty(level.ageRange) || !isNonEmpty(level.skill) || level.spellingPatterns.length === 0) {
      errors.push(`Level ${level.id || "(unknown)"} needs curriculum metadata.`);
    }
    if (level.challenges.length === 0) errors.push(`Level ${level.id} has no challenges.`);

    for (const challenge of level.challenges) {
      const label = challenge.id || "(unknown challenge)";
      if (!isNonEmpty(challenge.id)) errors.push(`Level ${level.id} has a challenge with an empty id.`);
      else if (challengeIds.has(challenge.id)) errors.push(`Duplicate spelling challenge id: ${challenge.id}`);
      challengeIds.add(challenge.id);

      if (challenge.mode !== level.mode) errors.push(`${label} does not match level mode ${level.mode}.`);
      if (!isNonEmpty(challenge.word)) errors.push(`${label} has an empty target word.`);
      else if (!targetWordPattern.test(challenge.word)) errors.push(`${label} has an invalid target word: ${challenge.word}`);
      if (!isNonEmpty(challenge.clue)) errors.push(`${label} has an empty clue.`);
      if (challenge.img && !imagePathPattern.test(challenge.img)) errors.push(`${label} has an invalid image path: ${challenge.img}`);

      if (challenge.mode === "build") {
        if (challenge.tiles.length < 2 || challenge.tiles.some((tile) => tile.length !== 1)) errors.push(`${label} needs single-letter build tiles.`);
        if ([...challenge.tiles].sort().join("") !== challenge.word.split("").sort().join("")) errors.push(`${label} build tiles must form its target word exactly.`);
      }
      if (challenge.mode === "family") {
        if (!isNonEmpty(challenge.rime) || challenge.onset.length !== 1 || `${challenge.onset}${challenge.rime}` !== challenge.word) errors.push(`${label} needs an onset and rime that form its word.`);
        if (!challenge.tiles.includes(challenge.onset) || new Set(challenge.tiles).size !== challenge.tiles.length) errors.push(`${label} family tiles must be unique and include the answer.`);
      }
      if (challenge.mode === "missing") {
        const completedPattern = challenge.pattern.replace(/\s/g, "").replace("_", challenge.onset);
        if (!challenge.pattern.includes("_") || challenge.onset.length !== 1 || completedPattern !== challenge.word) errors.push(`${label} needs a blank pattern and missing-letter answer that form its word.`);
        if (!challenge.tiles.includes(challenge.onset) || new Set(challenge.tiles).size !== challenge.tiles.length) errors.push(`${label} missing-letter tiles must be unique and include the answer.`);
      }
      if (challenge.mode === "choice") {
        if (challenge.choices.length < 2) errors.push(`${label} needs at least two spelling choices.`);
        if (new Set(challenge.choices).size !== challenge.choices.length) errors.push(`${label} has duplicate spelling choices.`);
        if (challenge.choices.filter((choice) => choice === challenge.word).length !== 1) errors.push(`${label} must contain its correct answer exactly once.`);
      }
      if (challenge.mode === "fix" && (!targetWordPattern.test(challenge.incorrectSpelling) || normalizePublicSpellingAnswer(challenge.incorrectSpelling) === normalizePublicSpellingAnswer(challenge.word))) {
        errors.push(`${label} needs a genuine incorrect spelling.`);
      }
      if (challenge.mode === "spell") {
        const escapedWord = challenge.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${escapedWord}\\b`, "i").test(challenge.clue)) errors.push(`${label} reveals its target word in the clue.`);
      }
    }
  }

  return errors;
}

export function assertValidPublicSpellingContent(levels: PublicSpellingLevel[]): void {
  const errors = validatePublicSpellingContent(levels);
  if (errors.length > 0) throw new Error(`Invalid public spelling content:\n- ${errors.join("\n- ")}`);
}

if (import.meta.env.DEV) assertValidPublicSpellingContent(PUBLIC_SPELLING_LEVELS);
