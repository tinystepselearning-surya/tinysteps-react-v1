// Guided reading levels, comprehension types, and adaptive helpers.
export const readingLevelSystem = {
  levelA: {
    range: 'Ages 4-5',
    characteristics: 'Concept books, 1-2 words per page, pictures tell story',
    vocabulary: 100,
    sentenceLength: 1,
    books: ['The Cat', 'My Dog', 'I See'],
  },
  levelB_C: {
    range: 'Ages 5-6',
    characteristics: 'Predictable patterns, simple sentences, familiar topics',
    vocabulary: 200,
    sentenceLength: 2,
    books: ['The Big Cat', 'A Red Ball', 'Look at Me'],
  },
  levelD_E: {
    range: 'Ages 6-7',
    characteristics: 'Simple stories, compound sentences, some new vocabulary',
    vocabulary: 400,
    sentenceLength: 3,
    books: ['The Little Red Hen', 'Curious George Visits Zoo'],
  },
  levelF_G: {
    range: 'Ages 7-8',
    characteristics: 'Chapter books, complex sentences, rich vocabulary',
    vocabulary: 700,
    sentenceLength: 4,
    books: ["Charlotte's Web (excerpts)", 'Ramona'],
  },
  levelH_I: {
    range: 'Ages 8-10',
    characteristics: 'Novel-length, complex plots, sophisticated vocabulary',
    vocabulary: 1200,
    sentenceLength: 5,
    books: ["Charlotte's Web", 'Bridge to Terabithia'],
  },
};

export const readingAdventureData = {
  levelA: {
    books: [
      {
        title: 'The Happy Cat',
        chapters: [
          {
            text: 'I am a cat. I am happy.',
            comprehensionQuestions: [
              {
                question: 'What is the main character?',
                options: ['dog', 'cat', 'bird'],
                answer: 'cat',
                difficulty: 'literal',
              },
              {
                question: 'How does the cat feel?',
                options: ['sad', 'happy', 'mad'],
                answer: 'happy',
                difficulty: 'literal',
              },
            ],
          },
        ],
      },
    ],
  },
  levelBC: {
    books: [
      {
        title: 'The Little Red Hen',
        chapters: [
          {
            text: "A little red hen found some wheat. 'Who will help me plant it?' she asked. But her friends said no.",
            comprehensionQuestions: [
              {
                question: 'What did the hen find?',
                options: ['corn', 'wheat', 'beans'],
                answer: 'wheat',
                difficulty: 'literal',
              },
              {
                question: "Why didn't her friends help?",
                options: ['They were busy', "They didn't want to", 'They were sleeping'],
                answer: "They didn't want to",
                difficulty: 'inferential',
              },
            ],
          },
          {
            text: "The hen planted the wheat by herself. Soon it grew tall and golden. 'Who will help me harvest it?' she asked. But again, her friends said no.",
            comprehensionQuestions: [
              {
                question: 'What color was the wheat?',
                options: ['green', 'golden', 'brown'],
                answer: 'golden',
                difficulty: 'literal',
              },
            ],
          },
        ],
      },
    ],
  },
  levelDE: {
    books: [
      {
        title: 'Adventures in the Woods',
        chapters: [
          {
            text:
              "Emma was walking in the woods when she found a small rabbit. 'Hello, little rabbit!' she said. The rabbit looked at her and hopped away. Emma followed it down a path. She was curious about where it was going.",
            comprehensionQuestions: [
              {
                question: 'Who did Emma find in the woods?',
                options: ['deer', 'rabbit', 'squirrel'],
                answer: 'rabbit',
                difficulty: 'literal',
              },
              {
                question: 'Why did Emma follow the rabbit?',
                options: ['It attacked her', 'She was curious', 'She wanted to catch it'],
                answer: 'She was curious',
                difficulty: 'inferential',
              },
            ],
          },
        ],
      },
    ],
  },
  levelFG: {
    books: [
      {
        title: "Charlotte's Web (Adapted)",
        chapters: [
          {
            text:
              "Wilbur was a young pig living on a farm. He had never had a friend before. One day, he heard a voice from the barn. 'Hello, Wilbur. I'm Charlotte, a spider.' Wilbur was surprised. 'You're my friend?' he asked. 'Yes,' said Charlotte. 'I will help you.'",
            comprehensionQuestions: [
              {
                question: 'What is Wilbur?',
                options: ['chicken', 'cow', 'pig'],
                answer: 'pig',
                difficulty: 'literal',
              },
              {
                question: 'Who did Wilbur meet?',
                options: ['Charlotte the spider', 'Clara the hen', 'Templeton the rat'],
                answer: 'Charlotte the spider',
                difficulty: 'literal',
              },
              {
                question: 'Why was Wilbur surprised?',
                options: ["Spiders don't usually talk", 'Charlotte was rude', "He didn't see her"],
                answer: "Spiders don't usually talk",
                difficulty: 'inferential',
              },
              {
                question: 'What do you think Charlotte will do to help Wilbur?',
                options: ['Give him food', 'Be his friend and protect him', 'Take him away'],
                answer: 'Be his friend and protect him',
                difficulty: 'predictive',
              },
            ],
          },
        ],
      },
    ],
  },
  levelHI: {
    books: [
      {
        title: 'Bridge to Terabithia (Adapted)',
        chapters: [
          {
            text:
              "Jess always walked to school alone. He was shy and liked to be by himself. One day, a girl named Leslie moved next door. She was different from everyone else. She wore running shoes and said what she thought. At first, Jess didn't like her. But one day, she said 'Come with me' and took him to a secret place in the woods. It was magical. They decided to call it Terabithia, their secret kingdom.",
            comprehensionQuestions: [
              {
                question: 'Why did Jess usually walk alone?',
                options: ['He lived far away', 'He was shy', "He didn't like school"],
                answer: 'He was shy',
                difficulty: 'inferential',
              },
              {
                question: 'What was different about Leslie?',
                options: ['She was older', 'She wore fancy clothes', 'She was different from everyone else'],
                answer: 'She was different from everyone else',
                difficulty: 'literal',
              },
              {
                question: 'What do you think Terabithia represented to Jess and Leslie?',
                options: ['A real place', 'An escape from reality', 'A school'],
                answer: 'An escape from reality',
                difficulty: 'critical',
              },
            ],
          },
        ],
      },
    ],
  },
  questionTypes: {
    literal: 'What happened? Who? When? Where? (Remember level)',
    inferential: 'Why? What can you infer? (Understand + Analyze)',
    predictive: 'What will happen next? (Predict)',
    critical: 'What does this mean? Do you agree? (Evaluate)',
    vocabulary: 'What does ___ mean?',
    connection: 'How is this like ___?',
    character: 'What kind of person is ___?',
  },
};

export const comprehensionQuestions = {
  literal: [
    { question: 'What color was the ball?', answer: 'red', type: 'recall', difficulty: 1 },
  ],
  inferential: [
    { question: 'Why did the cat run away?', answer: 'It was scared', type: 'inference', difficulty: 2 },
  ],
  critical: [
    { question: 'Was the ending happy? Why?', answer: 'Open-ended', type: 'opinion', difficulty: 3 },
  ],
};

function safeAccuracy(history = []) {
  if (!history.length) return 0;
  const correct = history.reduce((sum, h) => sum + (h.correct ? 1 : 0), 0);
  return Math.round((correct / history.length) * 100);
}

export function getReadingAdaptiveSettings(history = []) {
  const accuracy = safeAccuracy(history.slice(-10));
  if (accuracy < 60) return { changeLevel: 'down', reason: 'Comprehension below 60%' };
  if (accuracy < 80) return { changeLevel: 'maintain', reason: 'Right level' };
  if (accuracy < 95) return { changeLevel: 'up', reason: 'Ready for challenge' };
  return { changeLevel: 'up2levels', reason: 'Mastering this level' };
}

function pickLevelKey(currentLevel = 'levelA', change = 'maintain') {
  const levels = ['levelA', 'levelB_C', 'levelD_E', 'levelF_G', 'levelH_I'];
  const idx = Math.max(0, levels.indexOf(currentLevel));
  if (change === 'down') return levels[Math.max(0, idx - 1)];
  if (change === 'up') return levels[Math.min(levels.length - 1, idx + 1)];
  if (change === 'up2levels') return levels[Math.min(levels.length - 1, idx + 2)];
  return levels[idx];
}

export function buildOfflineChapter(levelKey = 'levelA') {
  const level = readingLevelSystem[levelKey] || readingLevelSystem.levelA;
  const title = level.books?.[0] || 'Adventure Story';
  const paragraph = `A short story at ${level.range}. It uses simple sentences and familiar topics.`;
  const questionSet = [
    ...(comprehensionQuestions.literal || []),
    ...(comprehensionQuestions.inferential || []),
    ...(comprehensionQuestions.critical || []),
  ];
  const question = questionSet[Math.floor(Math.random() * questionSet.length)] || comprehensionQuestions.literal[0];
  return {
    bookId: title,
    chapterNumber: 1,
    level: levelKey,
    paragraph,
    question: question.question,
    options: question.answer === 'Open-ended' ? [] : [question.answer, 'Unknown'],
    correctAnswer: question.answer,
  };
}

export function nextLevelKey(currentLevel, history = []) {
  const adaptive = getReadingAdaptiveSettings(history);
  return pickLevelKey(currentLevel, adaptive.changeLevel);
}
