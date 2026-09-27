import {
  VOCABULARY_LEXICAL_ENTRIES,
  toLegacyPublicVocabularyWord,
} from './vocabularyLexicalModel';

export type PublicVocabularyWord = {
  id: string;
  word: string;
  meaning: string;
  sentence: string;
  category: "action" | "feeling" | "describing" | "school" | "everyday";
};

export type PublicVocabularyChallenge =
  | {
      id: string;
      mode: "match-it";
      clue: string;
      wordId: string;
      choiceWordIds: string[];
      correctWordId: string;
    }
  | {
      id: string;
      mode: "find-word";
      clue: string;
      meaningWordId: string;
      choiceWordIds: string[];
      correctWordId: string;
    }
  | {
      id: string;
      mode: "context-clues";
      clue: string;
      sentence: string;
      choiceWordIds: string[];
      correctWordId: string;
    }
  | {
      id: string;
      mode: "synonym" | "antonym";
      clue: string;
      targetWord: string;
      choices: string[];
      correctChoice: string;
    }
  | {
      id: string;
      mode: "word-detective";
      clue: string;
      answerWord: string;
      acceptableAnswers?: string[];
    };

export type PublicVocabularyLevel = {
  id: string;
  shortTitle: string;
  title: string;
  instruction: string;
  challenges: PublicVocabularyChallenge[];
};

export const PUBLIC_VOCABULARY_WORDS: PublicVocabularyWord[] = VOCABULARY_LEXICAL_ENTRIES.map(
  (entry) => toLegacyPublicVocabularyWord(entry),
) as PublicVocabularyWord[];

export const PUBLIC_VOCABULARY_WORDS_BY_ID = Object.fromEntries(
  PUBLIC_VOCABULARY_WORDS.map((entry) => [entry.id, entry]),
) as Record<string, PublicVocabularyWord>;

export const PUBLIC_VOCABULARY_LEVELS: PublicVocabularyLevel[] = [
  {
    id: "vocab-match-it",
    shortTitle: "Match It",
    title: "Match It",
    instruction: "Choose the best meaning for the word.",
    challenges: [
      { id: "m1", mode: "match-it", clue: "Find the meaning of run.", wordId: "run", choiceWordIds: ["run", "jump", "carry", "read"], correctWordId: "run" },
      { id: "m2", mode: "match-it", clue: "Find the meaning of proud.", wordId: "proud", choiceWordIds: ["proud", "bored", "scared", "sad"], correctWordId: "proud" },
      { id: "m3", mode: "match-it", clue: "Find the meaning of bright.", wordId: "bright", choiceWordIds: ["bright", "cold", "loud", "soft"], correctWordId: "bright" },
      { id: "m4", mode: "match-it", clue: "Find the meaning of lesson.", wordId: "lesson", choiceWordIds: ["lesson", "question", "notebook", "library"], correctWordId: "lesson" },
      { id: "m5", mode: "match-it", clue: "Find the meaning of market.", wordId: "market", choiceWordIds: ["market", "street", "garden", "window"], correctWordId: "market" },
    ],
  },
  {
    id: "vocab-find-word",
    shortTitle: "Find the Word",
    title: "Find the Word",
    instruction: "Read the meaning and choose the correct word.",
    challenges: [
      { id: "f1", mode: "find-word", clue: "Which word means feeling peaceful and not worried?", meaningWordId: "calm", choiceWordIds: ["angry", "calm", "excited", "bored"], correctWordId: "calm" },
      { id: "f2", mode: "find-word", clue: "Which word means a room where food is cooked?", meaningWordId: "kitchen", choiceWordIds: ["garden", "classroom", "kitchen", "market"], correctWordId: "kitchen" },
      { id: "f3", mode: "find-word", clue: "Which word means making a lot of sound?", meaningWordId: "loud", choiceWordIds: ["loud", "soft", "clean", "cold"], correctWordId: "loud" },
      { id: "f4", mode: "find-word", clue: "Which word means doing something again to get better?", meaningWordId: "practice", choiceWordIds: ["question", "answer", "practice", "lesson"], correctWordId: "practice" },
      { id: "f5", mode: "find-word", clue: "Which word means feeling very happy and eager?", meaningWordId: "excited", choiceWordIds: ["tired", "excited", "sad", "calm"], correctWordId: "excited" },
    ],
  },
  {
    id: "vocab-context-clues",
    shortTitle: "Context Clues",
    title: "Context Clues",
    instruction: "Use the sentence clue and choose the best missing word.",
    challenges: [
      { id: "c1", mode: "context-clues", clue: "What word fits the sentence?", sentence: "I drink water from my ___.", choiceWordIds: ["blanket", "bottle", "market", "library"], correctWordId: "bottle" },
      { id: "c2", mode: "context-clues", clue: "What word fits the sentence?", sentence: "After the race, I feel very ___.", choiceWordIds: ["tired", "proud", "angry", "scared"], correctWordId: "tired" },
      { id: "c3", mode: "context-clues", clue: "What word fits the sentence?", sentence: "Please ___ the door before you come in.", choiceWordIds: ["open", "draw", "jump", "read"], correctWordId: "open" },
      { id: "c4", mode: "context-clues", clue: "What word fits the sentence?", sentence: "Our teacher asks a ___ and we say the answer.", choiceWordIds: ["question", "lesson", "market", "window"], correctWordId: "question" },
      { id: "c5", mode: "context-clues", clue: "What word fits the sentence?", sentence: "At night I sleep under a warm ___.", choiceWordIds: ["blanket", "street", "pencil", "morning"], correctWordId: "blanket" },
    ],
  },
  {
    id: "vocab-synonym",
    shortTitle: "Synonyms",
    title: "Synonym Challenge",
    instruction: "Pick the word with the closest meaning.",
    challenges: [
      { id: "s1", mode: "synonym", clue: "Choose a word that means almost the same as happy.", targetWord: "happy", choices: ["joyful", "angry", "sad", "tired"], correctChoice: "joyful" },
      { id: "s2", mode: "synonym", clue: "Choose a word that means almost the same as big.", targetWord: "big", choices: ["small", "tiny", "large", "slow"], correctChoice: "large" },
      { id: "s3", mode: "synonym", clue: "Choose a word that means almost the same as calm.", targetWord: "calm", choices: ["peaceful", "loud", "scared", "angry"], correctChoice: "peaceful" },
      { id: "s4", mode: "synonym", clue: "Choose a word that means almost the same as fast.", targetWord: "fast", choices: ["quick", "slow", "soft", "cold"], correctChoice: "quick" },
      { id: "s5", mode: "synonym", clue: "Choose a word that means almost the same as bright.", targetWord: "bright", choices: ["dark", "shiny", "dirty", "quiet"], correctChoice: "shiny" },
    ],
  },
  {
    id: "vocab-antonym",
    shortTitle: "Antonyms",
    title: "Antonym Challenge",
    instruction: "Pick the word with the opposite meaning.",
    challenges: [
      { id: "a1", mode: "antonym", clue: "Choose the opposite of happy.", targetWord: "happy", choices: ["joyful", "sad", "excited", "proud"], correctChoice: "sad" },
      { id: "a2", mode: "antonym", clue: "Choose the opposite of big.", targetWord: "big", choices: ["huge", "small", "bright", "loud"], correctChoice: "small" },
      { id: "a3", mode: "antonym", clue: "Choose the opposite of clean.", targetWord: "clean", choices: ["neat", "dirty", "sweet", "cold"], correctChoice: "dirty" },
      { id: "a4", mode: "antonym", clue: "Choose the opposite of open.", targetWord: "open", choices: ["close", "read", "write", "carry"], correctChoice: "close" },
      { id: "a5", mode: "antonym", clue: "Choose the opposite of fast.", targetWord: "fast", choices: ["quick", "slow", "bright", "calm"], correctChoice: "slow" },
    ],
  },
  {
    id: "vocab-word-detective",
    shortTitle: "Detective",
    title: "Word Detective",
    instruction: "Read the clue and type the word.",
    challenges: [
      { id: "d1", mode: "word-detective", clue: "I am the place where we keep and read many books.", answerWord: "library" },
      { id: "d2", mode: "word-detective", clue: "I tell how someone feels when they need rest after playing.", answerWord: "tired" },
      { id: "d3", mode: "word-detective", clue: "I am a warm cover used while sleeping.", answerWord: "blanket" },
      { id: "d4", mode: "word-detective", clue: "I mean to make a picture with a pencil or crayon.", answerWord: "draw" },
      { id: "d5", mode: "word-detective", clue: "I am a place where people buy and sell things.", answerWord: "market" },
    ],
  },
];

export function normalizeVocabularyAnswer(value: string) {
  return value.trim().toLowerCase();
}

export function validatePublicVocabularyContent() {
  const wordIds = new Set(PUBLIC_VOCABULARY_WORDS.map((entry) => entry.id));
  const levelIds = new Set<string>();
  const challengeIds = new Set<string>();

  for (const level of PUBLIC_VOCABULARY_LEVELS) {
    if (!level.id.trim()) {
      throw new Error("[publicVocabularyContent] Level id cannot be empty.");
    }
    if (levelIds.has(level.id)) {
      throw new Error(`[publicVocabularyContent] Duplicate level id: ${level.id}`);
    }
    levelIds.add(level.id);

    for (const challenge of level.challenges) {
      if (challengeIds.has(challenge.id)) {
        throw new Error(`[publicVocabularyContent] Duplicate challenge id: ${challenge.id}`);
      }
      challengeIds.add(challenge.id);

      if (!challenge.clue.trim()) {
        throw new Error(`[publicVocabularyContent] Challenge clue cannot be empty (${challenge.id}).`);
      }

      if (challenge.mode === "match-it") {
        if (!wordIds.has(challenge.wordId) || !wordIds.has(challenge.correctWordId)) {
          throw new Error(`[publicVocabularyContent] Unknown word id in ${challenge.id}.`);
        }
        if (!challenge.choiceWordIds.includes(challenge.correctWordId)) {
          throw new Error(`[publicVocabularyContent] Correct choice missing in ${challenge.id}.`);
        }
        const uniqueChoices = new Set(challenge.choiceWordIds);
        if (uniqueChoices.size !== challenge.choiceWordIds.length) {
          throw new Error(`[publicVocabularyContent] Duplicate choices in ${challenge.id}.`);
        }
      }

      if (challenge.mode === "find-word") {
        if (!wordIds.has(challenge.meaningWordId) || !wordIds.has(challenge.correctWordId)) {
          throw new Error(`[publicVocabularyContent] Unknown word id in ${challenge.id}.`);
        }
        if (!challenge.choiceWordIds.includes(challenge.correctWordId)) {
          throw new Error(`[publicVocabularyContent] Correct choice missing in ${challenge.id}.`);
        }
        const uniqueChoices = new Set(challenge.choiceWordIds);
        if (uniqueChoices.size !== challenge.choiceWordIds.length) {
          throw new Error(`[publicVocabularyContent] Duplicate choices in ${challenge.id}.`);
        }
      }

      if (challenge.mode === "context-clues") {
        if (!challenge.sentence.trim()) {
          throw new Error(`[publicVocabularyContent] Context sentence cannot be empty (${challenge.id}).`);
        }
        if (!wordIds.has(challenge.correctWordId)) {
          throw new Error(`[publicVocabularyContent] Unknown context answer id in ${challenge.id}.`);
        }
        if (!challenge.choiceWordIds.includes(challenge.correctWordId)) {
          throw new Error(`[publicVocabularyContent] Correct choice missing in ${challenge.id}.`);
        }
        const uniqueChoices = new Set(challenge.choiceWordIds);
        if (uniqueChoices.size !== challenge.choiceWordIds.length) {
          throw new Error(`[publicVocabularyContent] Duplicate choices in ${challenge.id}.`);
        }
      }

      if (challenge.mode === "synonym" || challenge.mode === "antonym") {
        if (!challenge.targetWord.trim()) {
          throw new Error(`[publicVocabularyContent] Target word missing in ${challenge.id}.`);
        }
        const normalizedChoices = challenge.choices.map((choice) => normalizeVocabularyAnswer(choice));
        const normalizedCorrect = normalizeVocabularyAnswer(challenge.correctChoice);
        if (!normalizedCorrect) {
          throw new Error(`[publicVocabularyContent] Correct choice missing in ${challenge.id}.`);
        }
        const uniqueChoices = new Set(normalizedChoices);
        if (uniqueChoices.size !== normalizedChoices.length) {
          throw new Error(`[publicVocabularyContent] Duplicate choices in ${challenge.id}.`);
        }
        const correctCount = normalizedChoices.filter((choice) => choice === normalizedCorrect).length;
        if (correctCount !== 1) {
          throw new Error(`[publicVocabularyContent] Correct choice must appear exactly once in ${challenge.id}.`);
        }
      }

      if (challenge.mode === "word-detective") {
        if (!challenge.answerWord.trim()) {
          throw new Error(`[publicVocabularyContent] Word Detective answer missing in ${challenge.id}.`);
        }
        if (challenge.acceptableAnswers) {
          const normalized = challenge.acceptableAnswers.map((value) => normalizeVocabularyAnswer(value));
          if (normalized.some((value) => !value)) {
            throw new Error(`[publicVocabularyContent] Empty acceptable answer in ${challenge.id}.`);
          }
          if (new Set(normalized).size !== normalized.length) {
            throw new Error(`[publicVocabularyContent] Duplicate acceptable answers in ${challenge.id}.`);
          }
        }
      }
    }
  }
}

validatePublicVocabularyContent();
