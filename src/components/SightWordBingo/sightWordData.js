// Dolch sight words with simple clue helpers and adaptive settings.
export const sightWordData = {
  kindergarten: {
    frequencyTier1: [
      { word: 'the', clue: 'Most common word', frequency: 'Very High' },
      { word: 'and', clue: 'Two things together', frequency: 'Very High' },
      { word: 'to', clue: 'Going somewhere', frequency: 'Very High' },
      { word: 'a', clue: 'One person or thing', frequency: 'Very High' },
      { word: 'i', clue: 'About yourself', frequency: 'Very High' },
      { word: 'in', clue: 'Inside', frequency: 'Very High' },
      { word: 'is', clue: 'Being verb', frequency: 'Very High' },
      { word: 'it', clue: 'That thing', frequency: 'Very High' },
      { word: 'you', clue: 'The person listening', frequency: 'Very High' },
      { word: 'that', clue: 'Something specific', frequency: 'High' },
    ],
    frequencyTier2: [
      { word: 'he', clue: 'Male person', frequency: 'High' },
      { word: 'she', clue: 'Female person', frequency: 'High' },
      { word: 'what', clue: 'Question word', frequency: 'High' },
      { word: 'this', clue: 'Near you', frequency: 'High' },
      { word: 'for', clue: 'Purpose', frequency: 'High' },
      { word: 'not', clue: 'Negative', frequency: 'High' },
      { word: 'but', clue: 'However', frequency: 'Medium' },
      { word: 'can', clue: 'Able to', frequency: 'Medium' },
      { word: 'my', clue: 'Belonging to me', frequency: 'Medium' },
      { word: 'with', clue: 'Together with', frequency: 'Medium' },
    ],
    frequencyTier3: [
      { word: 'have', clue: 'Own something', frequency: 'Medium' },
      { word: 'this', clue: 'This one here', frequency: 'Medium' },
      { word: 'from', clue: 'Starting point', frequency: 'Medium' },
      { word: 'they', clue: 'Those people', frequency: 'Medium' },
      { word: 'we', clue: 'Us together', frequency: 'Medium' },
      { word: 'him', clue: 'Male object', frequency: 'Low' },
      { word: 'her', clue: 'Female object', frequency: 'Low' },
      { word: 'will', clue: 'Future action', frequency: 'Low' },
      { word: 'one', clue: 'Number 1', frequency: 'Low' },
      { word: 'all', clue: 'Everything', frequency: 'Low' },
    ],
  },
  grade1: {
    frequencyTier1: [
      { word: 'after', clue: 'Following', frequency: 'High' },
      { word: 'again', clue: 'One more time', frequency: 'High' },
      { word: 'because', clue: 'Reason', frequency: 'High' },
      { word: 'been', clue: 'Past of be', frequency: 'High' },
      { word: 'before', clue: 'Earlier', frequency: 'High' },
      { word: 'could', clue: 'Able to', frequency: 'High' },
      { word: 'did', clue: 'Past action', frequency: 'High' },
      { word: 'find', clue: 'Look for', frequency: 'High' },
      { word: 'first', clue: 'Beginning', frequency: 'High' },
      { word: 'get', clue: 'Obtain', frequency: 'High' },
    ],
    frequencyTier2: [
      { word: 'go', clue: 'Leave', frequency: 'High' },
      { word: 'good', clue: 'Nice', frequency: 'High' },
      { word: 'has', clue: 'Possess', frequency: 'High' },
      { word: 'help', clue: 'Assist', frequency: 'High' },
      { word: 'how', clue: 'In what way', frequency: 'High' },
      { word: 'its', clue: 'Belonging to it', frequency: 'High' },
      { word: 'just', clue: 'Only', frequency: 'High' },
      { word: 'know', clue: 'Understand', frequency: 'High' },
      { word: 'like', clue: 'Enjoy', frequency: 'High' },
      { word: 'look', clue: 'See', frequency: 'High' },
    ],
  },
  grade2: {
    frequencyTier1: [
      { word: 'also', clue: 'In addition', frequency: 'High' },
      { word: 'any', clue: 'Some', frequency: 'High' },
      { word: 'back', clue: 'Return', frequency: 'High' },
      { word: 'call', clue: 'Make sound', frequency: 'High' },
      { word: 'came', clue: 'Arrived', frequency: 'High' },
      { word: 'come', clue: 'Arrive', frequency: 'High' },
      { word: 'day', clue: '24 hours', frequency: 'High' },
      { word: 'does', clue: 'Takes action', frequency: 'High' },
      { word: 'down', clue: 'Lower', frequency: 'High' },
      { word: 'each', clue: 'Every one', frequency: 'High' },
    ],
  },
  clueStrategies: {
    simple: 'One-word definition',
    contextual: "Use in sentence: 'I like to ___'",
    opposites: 'Opposite of ___',
    rhyming: 'Rhymes with ___',
    conceptual: 'Shows action or idea',
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

function take(arr, n) {
  return arr.slice(0, n);
}

export function buildBingoCard(studentLevel = 'kindergarten', performanceHistory = []) {
  const levelData = sightWordData[studentLevel] || sightWordData.kindergarten;
  const tierWords = [
    ...(levelData.frequencyTier1 || []).map((w) => w.word),
    ...(levelData.frequencyTier2 || []).map((w) => w.word),
    ...(levelData.frequencyTier3 || []).map((w) => w.word),
  ];
  const pool = tierWords.length ? tierWords : [];
  const knownCount = Math.max(0, Math.floor(pool.length * 0.6));
  const known = shuffle(pool).slice(0, knownCount);
  const unknown = pool.filter((w) => !known.includes(w));
  const randomKnown = take(shuffle(known), 15);
  const randomUnknown = take(shuffle(unknown), 9);
  const combined = shuffle([...randomKnown, ...randomUnknown, 'FREE']);

  const card = [];
  for (let r = 0; r < 5; r += 1) {
    const row = [];
    for (let c = 0; c < 5; c += 1) {
      row.push(combined[r * 5 + c] || 'FREE');
    }
    card.push(row);
  }
  return card;
}

export function buildClues(card, difficulty = 'medium', level = 'kindergarten') {
  const clues = [];
  const levelData = sightWordData[level] || {};
  const levelClues = {
    ...(levelData.frequencyTier1 || []).reduce((m, w) => ({ ...m, [w.word]: w.clue }), {}),
    ...(levelData.frequencyTier2 || []).reduce((m, w) => ({ ...m, [w.word]: w.clue }), {}),
    ...(levelData.frequencyTier3 || []).reduce((m, w) => ({ ...m, [w.word]: w.clue }), {}),
  };

  for (const row of card) {
    for (const word of row) {
      if (word === 'FREE') continue;
      if (difficulty === 'easy') {
        clues.push(levelClues[word] || `Find the word "${word}"`);
      } else if (difficulty === 'hard') {
        clues.push(`Abstract clue for "${word}"`);
      } else {
        clues.push(levelClues[word] || `Use this in a sentence with "${word}"`);
      }
    }
  }

  return shuffle(clues);
}

function safeAccuracy(history = []) {
  if (!history.length) return 0;
  const correct = history.reduce((sum, h) => sum + (h.correct ? 1 : 0), 0);
  return Math.round((correct / history.length) * 100);
}

export function getBingoAdaptiveSettings(history = []) {
  const accuracy = safeAccuracy(history.slice(-10));
  if (accuracy < 60) return { difficulty: 'easy', level: 'kindergarten' };
  if (accuracy < 80) return { difficulty: 'medium', level: 'grade1' };
  return { difficulty: 'hard', level: 'grade2' };
}
