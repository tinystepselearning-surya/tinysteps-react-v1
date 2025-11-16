// Pre-built word banks for SpellBee Trainer.
// Structured by level (rough age/grade) and difficulty.
export const spellbeeWordData = {
  // Level 1: Ages 5-6 (Kindergarten)
  level1: {
    easy: [
      { word: 'cat', hint: 'A small furry pet', sentence: 'The cat is sleeping.', pronunciation: '/kæt/', topic: 'Animals' },
      { word: 'dog', hint: 'A pet that barks', sentence: 'I have a dog.', pronunciation: '/dɔɡ/', topic: 'Animals' },
      { word: 'sit', hint: 'To rest on a chair', sentence: 'Please sit down.', pronunciation: '/sɪt/', topic: 'Actions' },
      { word: 'run', hint: 'To move fast', sentence: 'He can run fast.', pronunciation: '/rʌn/', topic: 'Actions' },
      { word: 'sun', hint: 'Bright in the sky', sentence: 'The sun is hot.', pronunciation: '/sʌn/', topic: 'Nature' },
      { word: 'map', hint: 'Shows places', sentence: 'I have a map.', pronunciation: '/mæp/', topic: 'Objects' },
      { word: 'bat', hint: 'Used in baseball', sentence: 'Hit the ball with a bat.', pronunciation: '/bæt/', topic: 'Sports' },
      { word: 'hat', hint: 'Wear on your head', sentence: 'Put on your hat.', pronunciation: '/hæt/', topic: 'Clothes' },
      { word: 'bed', hint: 'Where you sleep', sentence: 'Go to bed at night.', pronunciation: '/bed/', topic: 'Places' },
      { word: 'red', hint: 'A color', sentence: 'The apple is red.', pronunciation: '/red/', topic: 'Colors' },
    ],
    medium: [
      { word: 'make', hint: 'Create something', sentence: 'Can you make a cake?', pronunciation: '/meɪk/', topic: 'Actions' },
      { word: 'take', hint: 'Pick something up', sentence: 'Take the book.', pronunciation: '/teɪk/', topic: 'Actions' },
      { word: 'lake', hint: 'Water with land around', sentence: 'We went to the lake.', pronunciation: '/leɪk/', topic: 'Nature' },
      { word: 'like', hint: 'Enjoy something', sentence: 'I like ice cream.', pronunciation: '/laɪk/', topic: 'Feelings' },
      { word: 'bike', hint: 'Two wheels, pedals', sentence: 'I ride my bike.', pronunciation: '/baɪk/', topic: 'Transport' },
    ],
    hard: [
      { word: 'blend', hint: 'Mix together', sentence: 'Blend the colors.', pronunciation: '/blend/', topic: 'Actions' },
      { word: 'spring', hint: 'Season after winter', sentence: 'Flowers bloom in spring.', pronunciation: '/sprɪŋ/', topic: 'Seasons' },
      { word: 'string', hint: 'Thin line', sentence: 'Tie with a string.', pronunciation: '/strɪŋ/', topic: 'Objects' },
    ],
  },

  // Level 2: Ages 6-7 (Grade 1)
  level2: {
    easy: [
      { word: 'house', hint: 'Where you live', sentence: 'We have a big house.', pronunciation: '/haʊs/', topic: 'Places' },
      { word: 'mouse', hint: 'Small gray animal', sentence: 'The mouse is small.', pronunciation: '/maʊs/', topic: 'Animals' },
      { word: 'book', hint: 'Pages with stories', sentence: 'Read your book.', pronunciation: '/bʊk/', topic: 'Objects' },
      { word: 'cook', hint: 'Make food', sentence: 'Mom will cook dinner.', pronunciation: '/kʊk/', topic: 'Actions' },
      { word: 'look', hint: 'See with eyes', sentence: 'Look at the sky.', pronunciation: '/lʊk/', topic: 'Actions' },
    ],
    medium: [
      { word: 'friend', hint: 'Person you like', sentence: 'My friend is kind.', pronunciation: '/frend/', topic: 'People' },
      { word: 'money', hint: 'Use to buy things', sentence: 'Save your money.', pronunciation: '/mʌni/', topic: 'Finance' },
      { word: 'happy', hint: 'Joy, smiling feeling', sentence: 'I am very happy.', pronunciation: '/hæpi/', topic: 'Feelings' },
    ],
    hard: [
      { word: 'science', hint: 'Study of nature', sentence: 'I love science class.', pronunciation: '/saɪəns/', topic: 'Education' },
      { word: 'special', hint: 'Not ordinary, unique', sentence: 'Today is special.', pronunciation: '/speʃəl/', topic: 'Adjectives' },
    ],
  },

  // Level 3: Ages 7-8 (Grade 2)
  level3: {
    easy: [
      { word: 'picture', hint: 'Image, photograph', sentence: 'Draw a picture.', pronunciation: '/pɪktʃər/', topic: 'Art' },
      { word: 'teacher', hint: 'Person who teaches', sentence: 'My teacher is nice.', pronunciation: '/titʃər/', topic: 'People' },
      { word: 'weather', hint: 'Rain, sun, wind', sentence: 'The weather is sunny.', pronunciation: '/weðər/', topic: 'Nature' },
    ],
    medium: [
      { word: 'beautiful', hint: 'Very pretty', sentence: 'The flower is beautiful.', pronunciation: '/bjutəfl/', topic: 'Adjectives' },
      { word: 'example', hint: 'Model, sample', sentence: 'Give me an example.', pronunciation: '/ɪgzæmpəl/', topic: 'Academic' },
    ],
    hard: [
      { word: 'animal', hint: 'Living creature', sentence: 'My favorite animal is a dog.', pronunciation: '/ænɪməl/', topic: 'Science' },
      { word: 'celebration', hint: 'Party, special event', sentence: 'We had a celebration.', pronunciation: '/seləbreɪʃən/', topic: 'Events' },
    ],
  },
};

export function getFallbackWords(level = 'level1', difficulty = 'medium') {
  const levelData = spellbeeWordData[level] || spellbeeWordData.level1;
  const bucket = levelData?.[difficulty] || levelData?.medium || levelData?.easy || [];

  // Ensure at least 5 words; if fewer, cycle through available items.
  if (bucket.length >= 5) return bucket.slice(0, 5);
  const words = [...bucket];
  let idx = 0;
  while (words.length < 5 && bucket.length > 0) {
    words.push(bucket[idx % bucket.length]);
    idx += 1;
  }
  return words;
}

// Bloom-based progression map
export const spellbeeProgression = {
  stage1: {
    name: 'Sound Makers',
    description: 'Learn to recognize letter sounds',
    duration: 'Week 1-2',
    activities: ['Hear sound, match to letter', 'See word, hear pronunciation', 'Repeat after recording'],
    successCriteria: '90% accuracy on 20 words',
  },
  stage2: {
    name: 'Sound Blenders',
    description: 'Blend individual sounds into words',
    duration: 'Week 3-4',
    activities: ['Sound out letters: c-a-t', "Blend: /c/ /a/ /t/ = 'cat'", 'Write sound pattern (CVC)'],
    prerequisites: ['stage1'],
    successCriteria: '85% accuracy on blending',
  },
  stage3: {
    name: 'Spell Writers',
    description: 'Spell words from memory',
    duration: 'Week 5-6',
    activities: ['Hear word, type spelling', 'See picture, spell object', 'Complete word: c_t = cat'],
    prerequisites: ['stage1', 'stage2'],
    successCriteria: '80% accuracy on typing',
  },
  stage4: {
    name: 'Pattern Detectives',
    description: 'Identify spelling patterns',
    duration: 'Week 7-8',
    activities: [
      'Find words with same pattern: take, make, lake',
      'Sort words by sound: /æ/ vs /ay/',
      "Identify exceptions: 'are' vs 'air'",
    ],
    prerequisites: ['stage2', 'stage3'],
    successCriteria: '75% accuracy on pattern matching',
  },
  stage5: {
    name: 'Spelling Critics',
    description: 'Correct and explain misspellings',
    duration: 'Week 9-10',
    activities: ['Fix misspelled words', 'Explain why a spelling is wrong', 'Teach another word'],
    prerequisites: ['stage3', 'stage4'],
    successCriteria: '70% accuracy on corrections',
  },
  stage6: {
    name: 'Word Creators',
    description: 'Create and test spelling rules',
    duration: 'Week 11+',
    activities: ['Write original sentences', 'Create spelling checklists', 'Play advanced games'],
    prerequisites: ['stage4', 'stage5'],
    successCriteria: 'Mastery of level',
  },
};

// Scaffolding presets (child psychology: Vygotsky)
export const scaffoldingLevels = {
  highScaffolding: {
    showWord: true,
    showImage: true,
    playAudio: true,
    showHint: true,
    allowRetries: 3,
    hintDetail: 'detailed',
    feedback: 'immediate + explanatory',
  },
  mediumScaffolding: {
    showWord: true,
    showImage: true,
    playAudio: true,
    showHint: true,
    allowRetries: 1,
    hintDetail: 'short',
    feedback: 'immediate + brief',
  },
  lowScaffolding: {
    showWord: false,
    showImage: true,
    playAudio: true,
    showHint: false,
    allowRetries: 0,
    hintDetail: 'none',
    feedback: 'correct/incorrect only',
  },
};

export const mindsetFeedback = {
  correct: [
    'Great effort! 🎉',
    'You got it through practice! 💪',
    'Your hard work paid off! ✨',
    "You're building your spelling skills! 📚",
  ],
  incorrect: [
    'Not yet, but you’re learning! 🌱',
    'This is helping your brain grow! 🧠',
    'Mistakes help us learn! 💡',
    "Keep practicing - you'll get it! 🚀",
  ],
};

export const motivationStrategy = {
  autonomy: {
    selectDifficulty: true,
    selectTopics: true,
    selectGameMode: ['solo', 'timed', 'multiplayer'],
  },
  competence: {
    accuracyPercentage: true,
    levelBadges: true,
    skillMastery: '80% → Expert Badge',
    dailyGoals: 'Complete 5 words',
  },
  relatedness: {
    leaderboards: true,
    friendChallenges: true,
    parentUpdates: 'Weekly progress email',
    teacherFeedback: true,
  },
};

// Spaced repetition scheduler (simplified)
export const spacedRepetitionSchedule = {
  newWord: {
    firstReview: '1 day later',
    secondReview: '3 days later',
    thirdReview: '7 days later',
    fourthReview: '2 weeks later',
    fifthReview: '1 month later',
  },
};

function safeAccuracy(recent) {
  if (!recent || recent.length === 0) return 0;
  const correctCount = recent.reduce((a, b) => a + (b.correct ? 1 : 0), 0);
  return Math.round((correctCount / recent.length) * 100);
}

function calculateTrend(recent) {
  const first = recent.slice(0, 5);
  const last = recent.slice(-5);
  const firstAcc = safeAccuracy(first);
  const lastAcc = safeAccuracy(last);
  if (lastAcc > firstAcc + 10) return 'improving';
  if (lastAcc < firstAcc - 10) return 'declining';
  return 'stable';
}

export function getAdaptiveSettings(performanceHistory = []) {
  const recent = performanceHistory.slice(-10);
  const accuracy = safeAccuracy(recent);
  const trend = calculateTrend(recent);

  if (accuracy < 60) {
    return { difficulty: 'easy', hintDetail: 'detailed', retries: 3, scaffolding: scaffoldingLevels.highScaffolding, trend };
  }
  if (accuracy < 75) {
    return { difficulty: 'medium', hintDetail: 'short', retries: 2, scaffolding: scaffoldingLevels.mediumScaffolding, trend };
  }
  if (accuracy < 90) {
    return { difficulty: 'hard', hintDetail: 'minimal', retries: 1, scaffolding: scaffoldingLevels.lowScaffolding, trend };
  }
  return { difficulty: 'expert', hintDetail: 'none', retries: 0, scaffolding: scaffoldingLevels.lowScaffolding, trend };
}
