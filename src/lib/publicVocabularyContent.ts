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

export const PUBLIC_VOCABULARY_WORDS: PublicVocabularyWord[] = [
  { id: "run", word: "run", meaning: "to move fast using your legs", sentence: "I run in the park.", category: "action" },
  { id: "jump", word: "jump", meaning: "to push your body up into the air", sentence: "The boy jumps over the rope.", category: "action" },
  { id: "eat", word: "eat", meaning: "to put food in your mouth and swallow it", sentence: "I eat an apple.", category: "action" },
  { id: "read", word: "read", meaning: "to look at words and understand them", sentence: "She reads a storybook.", category: "action" },
  { id: "write", word: "write", meaning: "to make letters or words on paper", sentence: "I write my name.", category: "action" },
  { id: "draw", word: "draw", meaning: "to make a picture with a pencil, crayon, or pen", sentence: "I draw a flower.", category: "action" },
  { id: "sing", word: "sing", meaning: "to make music with your voice", sentence: "We sing a happy song.", category: "action" },
  { id: "dance", word: "dance", meaning: "to move your body to music", sentence: "The children dance on the stage.", category: "action" },
  { id: "carry", word: "carry", meaning: "to hold something and take it with you", sentence: "I carry my school bag.", category: "action" },
  { id: "open", word: "open", meaning: "to move something so it is not closed", sentence: "Please open the door.", category: "action" },
  { id: "happy", word: "happy", meaning: "feeling good or joyful", sentence: "The child is happy.", category: "feeling" },
  { id: "sad", word: "sad", meaning: "feeling unhappy", sentence: "The girl is sad.", category: "feeling" },
  { id: "angry", word: "angry", meaning: "feeling upset or mad", sentence: "He is angry because his toy broke.", category: "feeling" },
  { id: "tired", word: "tired", meaning: "needing rest or sleep", sentence: "I am tired after playing.", category: "feeling" },
  { id: "excited", word: "excited", meaning: "feeling very happy and eager", sentence: "She is excited for her birthday.", category: "feeling" },
  { id: "scared", word: "scared", meaning: "feeling afraid", sentence: "The puppy is scared of thunder.", category: "feeling" },
  { id: "proud", word: "proud", meaning: "feeling happy about something you did well", sentence: "I am proud of my drawing.", category: "feeling" },
  { id: "bored", word: "bored", meaning: "feeling uninterested", sentence: "He is bored during the long wait.", category: "feeling" },
  { id: "calm", word: "calm", meaning: "peaceful and not worried", sentence: "I feel calm after taking a deep breath.", category: "feeling" },
  { id: "surprised", word: "surprised", meaning: "feeling amazed because something unexpected happened", sentence: "She was surprised by the gift.", category: "feeling" },
  { id: "big", word: "big", meaning: "large in size", sentence: "The elephant is big.", category: "describing" },
  { id: "small", word: "small", meaning: "little in size", sentence: "The cup is small.", category: "describing" },
  { id: "soft", word: "soft", meaning: "smooth and gentle to touch", sentence: "The pillow is soft.", category: "describing" },
  { id: "loud", word: "loud", meaning: "making a lot of sound", sentence: "The drum is loud.", category: "describing" },
  { id: "bright", word: "bright", meaning: "full of light or colour", sentence: "The sun is bright.", category: "describing" },
  { id: "clean", word: "clean", meaning: "not dirty", sentence: "My room is clean.", category: "describing" },
  { id: "cold", word: "cold", meaning: "having a low temperature", sentence: "The water is cold.", category: "describing" },
  { id: "sweet", word: "sweet", meaning: "tasting like sugar", sentence: "The mango is sweet.", category: "describing" },
  { id: "fast", word: "fast", meaning: "moving quickly", sentence: "The rabbit is fast.", category: "describing" },
  { id: "slow", word: "slow", meaning: "moving with little speed", sentence: "The turtle is slow.", category: "describing" },
  { id: "pencil", word: "pencil", meaning: "a tool used for writing or drawing", sentence: "I write with a pencil.", category: "school" },
  { id: "teacher", word: "teacher", meaning: "a person who helps children learn", sentence: "My teacher explains the lesson.", category: "school" },
  { id: "classroom", word: "classroom", meaning: "a room where children learn", sentence: "We sit in the classroom.", category: "school" },
  { id: "lesson", word: "lesson", meaning: "something we learn", sentence: "Today's lesson is about words.", category: "school" },
  { id: "homework", word: "homework", meaning: "school work done at home", sentence: "I finish my homework.", category: "school" },
  { id: "notebook", word: "notebook", meaning: "a book used for writing notes or work", sentence: "I write answers in my notebook.", category: "school" },
  { id: "question", word: "question", meaning: "something we ask to get an answer", sentence: "The teacher asks a question.", category: "school" },
  { id: "answer", word: "answer", meaning: "what we say or write for a question", sentence: "I know the answer.", category: "school" },
  { id: "library", word: "library", meaning: "a place where books are kept", sentence: "We read books in the library.", category: "school" },
  { id: "practice", word: "practice", meaning: "doing something again to get better", sentence: "I practice reading every day.", category: "school" },
  { id: "family", word: "family", meaning: "people who live with us or care for us", sentence: "I love my family.", category: "everyday" },
  { id: "garden", word: "garden", meaning: "a place where plants and flowers grow", sentence: "The flowers are in the garden.", category: "everyday" },
  { id: "market", word: "market", meaning: "a place where people buy and sell things", sentence: "We buy fruits from the market.", category: "everyday" },
  { id: "bottle", word: "bottle", meaning: "a container used to hold water or other liquids", sentence: "I drink water from a bottle.", category: "everyday" },
  { id: "window", word: "window", meaning: "an opening in a wall that lets in light and air", sentence: "I opened the window.", category: "everyday" },
  { id: "kitchen", word: "kitchen", meaning: "a room where food is cooked", sentence: "Mother is in the kitchen.", category: "everyday" },
  { id: "blanket", word: "blanket", meaning: "a warm cover used while sleeping", sentence: "I sleep under a blanket.", category: "everyday" },
  { id: "street", word: "street", meaning: "a road in a town or city", sentence: "Cars move on the street.", category: "everyday" },
  { id: "neighbour", word: "neighbour", meaning: "a person who lives near your home", sentence: "Our neighbour has a dog.", category: "everyday" },
  { id: "morning", word: "morning", meaning: "the early part of the day", sentence: "I brush my teeth in the morning.", category: "everyday" },
];

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
