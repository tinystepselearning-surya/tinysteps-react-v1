// Curated grammar progression data and helpers for offline fallback.
export const grammarGameData = {
  stage1_plural: {
    tutorials: [
      "One cat → Many cats (add 's')",
      "One box → Many boxes (add 'es' if ends in s/z/x)",
      "One baby → Many babies (change 'y' to 'ies')",
    ],
    exercises: [
      {
        sentence: 'The ___ are playing.',
        options: ['dog', 'dogs'],
        answer: 'dogs',
        explanation: "More than one = plural. Add 's'.",
      },
      {
        sentence: 'I see one ___.',
        options: ['cats', 'cat'],
        answer: 'cat',
        explanation: "Only one = singular. No 's'.",
      },
    ],
  },
  stage2_tenses: {
    tutorials: ["Now: 'I walk to school' (present)", "Before: 'I walked to school' (past - add 'ed')"],
    exercises: [
      {
        sentence: 'Yesterday, I ___ the ball.',
        options: ['throw', 'threw'],
        answer: 'threw',
        explanation: 'Yesterday = past tense',
      },
    ],
  },
  stage3_svAgree: {
    tutorials: ["She runs (not 'she run')", "They run (not 'they runs')", "He is happy (not 'he are happy')"],
    exercises: [
      {
        sentence: 'The cat ___ on the mat.',
        options: ['sit', 'sits'],
        answer: 'sits',
        explanation: 'Singular subject = singular verb',
      },
    ],
  },
  stage4_pronouns: {
    tutorials: ['I, you, he, she, it, we, they', "He is a boy (use 'he' for males)"],
    exercises: [
      {
        sentence: '___ like to play.',
        options: ['He', 'They'],
        answer: 'They',
        explanation: 'Multiple people = they',
      },
    ],
  },
};

// Comprehensive grammar builder exercises by topic.
export const grammarBuilderData = {
  singular_plural: {
    level: 'beginner',
    exercises: [
      {
        type: 'sentence_completion',
        sentence: 'I see one ___.',
        blank: 'singular',
        options: [
          { text: 'cat', correct: true },
          { text: 'cats', correct: false },
        ],
        explanation: 'One = singular (no s)',
      },
      {
        type: 'sentence_completion',
        sentence: 'I see three ___.',
        blank: 'plural',
        options: [
          { text: 'dog', correct: false },
          { text: 'dogs', correct: true },
        ],
        explanation: 'More than one = plural (add s)',
      },
      {
        type: 'correction',
        incorrect: 'The childs are playing.',
        correct: 'The children are playing.',
        rule: 'Irregular plural',
        explanation: 'Child → children (irregular)',
      },
      {
        type: 'fill_in',
        word: 'box',
        instruction: 'Make plural',
        answer: 'boxes',
        rule: 'Add -es after s, z, x, ch, sh',
      },
      {
        type: 'fill_in',
        word: 'baby',
        instruction: 'Make plural',
        answer: 'babies',
        rule: 'Change y to ies',
      },
    ],
  },
  present_past_tense: {
    level: 'beginner',
    exercises: [
      {
        type: 'sentence_completion',
        sentence: 'Today I ___. Yesterday I walked.',
        blank: 'present',
        options: [
          { text: 'walk', correct: true },
          { text: 'walked', correct: false },
        ],
        explanation: 'Today = present tense (no -ed)',
      },
      {
        type: 'sentence_completion',
        sentence: 'Yesterday I ___.',
        blank: 'past',
        options: [
          { text: 'jump', correct: false },
          { text: 'jumped', correct: true },
        ],
        explanation: 'Yesterday = past tense (add -ed)',
      },
      {
        type: 'irregular',
        present: 'go',
        past: 'went',
        examples: ['I go to school. Yesterday I went to school.'],
      },
      {
        type: 'irregular',
        present: 'eat',
        past: 'ate',
        examples: ['I eat lunch. Yesterday I ate pizza.'],
      },
    ],
  },
  subject_verb_agreement: {
    level: 'intermediate',
    exercises: [
      {
        type: 'sentence_completion',
        sentence: 'He ___.',
        options: [
          { text: 'run', correct: false },
          { text: 'runs', correct: true },
        ],
        explanation: 'He (singular) → runs (add s)',
      },
      {
        type: 'sentence_completion',
        sentence: 'They ___.',
        options: [
          { text: 'run', correct: true },
          { text: 'runs', correct: false },
        ],
        explanation: 'They (plural) → run (no s)',
      },
    ],
  },
  pronouns: {
    level: 'beginner',
    exercises: [
      {
        type: 'replacement',
        sentence: 'John is a boy. ___ likes to play.',
        options: ['He', 'She', 'It'],
        answer: 'He',
        explanation: "John is male → use 'he'",
      },
      {
        type: 'replacement',
        sentence: 'Mary and I are friends. ___ play together.',
        options: ['We', 'They', 'I'],
        answer: 'We',
        explanation: 'Mary and I = two people → use “we”',
      },
    ],
  },
  capitalization: {
    level: 'beginner',
    exercises: [
      {
        type: 'correction',
        incorrect: 'my name is john.',
        correct: 'My name is John.',
        rule: 'Capitalize beginning and proper nouns',
      },
      {
        type: 'fill_in',
        sentence: 'i like ___.',
        correction: 'I like ___',
        rule: "Capitalize 'I'",
      },
    ],
  },
  articles: {
    level: 'intermediate',
    exercises: [
      {
        type: 'selection',
        sentence: '___ apple is red.',
        options: ['A', 'An', 'The'],
        answer: 'The',
        explanation: "Specific apple → 'the'",
      },
      {
        type: 'selection',
        sentence: 'I want ___ apple.',
        options: ['A', 'An'],
        answer: 'An',
        explanation: "Apple starts with vowel → 'an'",
      },
    ],
  },
  prepositions: {
    level: 'intermediate',
    exercises: [
      {
        type: 'selection',
        sentence: 'The cat is ___ the table.',
        options: ['on', 'under', 'in'],
        answer: 'on',
        explanation: 'Sitting = on top',
      },
      {
        type: 'selection',
        sentence: 'I go to school ___ the morning.',
        options: ['at', 'in', 'on'],
        answer: 'in',
        explanation: "Time period → 'in'",
      },
    ],
  },
  adjectives_adverbs: {
    level: 'advanced',
    exercises: [
      {
        type: 'identify',
        sentence: 'The boy is happy.',
        word: 'happy',
        partOfSpeech: 'adjective',
        explanation: 'Describes noun',
      },
      {
        type: 'identify',
        sentence: 'He runs quickly.',
        word: 'quickly',
        partOfSpeech: 'adverb',
        explanation: 'Describes verb (how)',
      },
    ],
  },
  compound_sentences: {
    level: 'advanced',
    exercises: [
      {
        type: 'combine',
        sentence1: 'I like cats.',
        sentence2: 'I like dogs.',
        conjunction: 'and',
        combined: 'I like cats and dogs.',
        explanation: "Use 'and' to combine similar ideas",
      },
    ],
  },
  punctuation: {
    level: 'beginner',
    exercises: [
      {
        type: 'add_punctuation',
        sentence: 'What is your name',
        correct: 'What is your name?',
        rule: 'Question = question mark',
      },
      {
        type: 'add_punctuation',
        sentence: 'I am happy',
        correct: 'I am happy!',
        rule: 'Excitement = exclamation mark',
      },
    ],
  },
};
// Expanded grammar topics metadata for future adaptive selection and coverage tracking.
export const enhancedGrammarData = {
  topics: {
    plural: { exercises: 30, difficulty: 'easy' },
    tenses: {
      present: 20,
      past: 20,
      future: 15,
      presentProgressive: 15,
      pastProgressive: 10,
      presentPerfect: 10,
    },
    svAgree: { exercises: 25, difficulty: 'medium' },
    pronouns: { exercises: 30, difficulty: 'medium' },
    capitalization: {
      properNouns: 15,
      beginSentence: 15,
      days: 10,
      months: 10,
    },
    punctuation: {
      periods: 15,
      commas: 20,
      questionMarks: 15,
      exclamation: 10,
      apostrophes: 15,
    },
    articles: {
      aVsAn: 20,
      theUsage: 25,
      omittingArticles: 15,
    },
    prepositions: {
      location: 20,
      time: 20,
      direction: 15,
      commonErrors: 20,
    },
    conjunctions: {
      and: 10,
      but: 10,
      or: 10,
      coordinatingConjunctions: 15,
      subordinatingConjunctions: 20,
    },
    adjectivesAdverbs: {
      positioning: 15,
      formingAdverbs: 20,
      comparison: 20,
    },
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getOfflineSnippet(grammarTopic = 'singular/plural') {
  const key =
    grammarTopic.includes('plural') || grammarTopic.includes('singular') ? 'stage1_plural' :
    grammarTopic.includes('tense') || grammarTopic.includes('past') ? 'stage2_tenses' :
    grammarTopic.includes('pronoun') ? 'stage4_pronouns' :
    'stage3_svAgree';

  const stage = grammarGameData[key] || grammarGameData.stage1_plural;
  const exercise = shuffle(stage.exercises || [])[0] || {
    sentence: 'The ___ is here.',
    options: ['cat', 'cats'],
    answer: 'cat',
    explanation: '',
  };

  const options = (exercise.options || []).map((opt) => ({
    text: opt,
    correct: opt === exercise.answer,
  }));

  return {
    snippet: exercise.sentence,
    correctChoice: exercise.answer,
    options,
    grammarTopic: grammarTopic,
    tutorial: stage.tutorials?.[0] || '',
  };
}

export function getGrammarAdaptiveSettings(history = []) {
  const recent = history.slice(-10);
  const correct = recent.filter((h) => h.correct).length;
  const accuracy = recent.length ? Math.round((correct / recent.length) * 100) : 0;
  if (accuracy < 60) return { grammarTopic: 'singular/plural', level: 'stage1_plural' };
  if (accuracy < 80) return { grammarTopic: 'present_vs_past', level: 'stage2_tenses' };
  if (accuracy < 90) return { grammarTopic: 'subject_verb_agreement', level: 'stage3_svAgree' };
  return { grammarTopic: 'pronouns', level: 'stage4_pronouns' };
}
