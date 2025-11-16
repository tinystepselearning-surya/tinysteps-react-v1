// Curated phonics maze data and adaptive helpers.
export const phoneticsMazeData = {
  level1: {
    mazes: [
      {
        title: "Cat's Journey 🐱",
        difficulty: 'easy',
        junctions: 5,
        words: [
          {
            junction: 1,
            question: 'Which word says /kæt/?',
            options: [
              { text: 'cat', sound: '/kæt/', correct: true, hint: 'Small furry pet' },
              { text: 'kit', sound: '/kɪt/', correct: false, hint: 'Small box' },
              { text: 'cut', sound: '/kʌt/', correct: false, hint: 'Make shorter' },
            ],
            explanation: 'c-a-t: /k/ /æ/ /t/ = cat',
          },
          {
            junction: 2,
            question: 'Which word says /bæt/?',
            options: [
              { text: 'bat', sound: '/bæt/', correct: true },
              { text: 'bit', sound: '/bɪt/', correct: false },
              { text: 'but', sound: '/bʌt/', correct: false },
            ],
          },
          {
            junction: 3,
            question: 'Which word says /hæt/?',
            options: [
              { text: 'hat', sound: '/hæt/', correct: true },
              { text: 'hot', sound: '/hɑt/', correct: false },
              { text: 'hit', sound: '/hɪt/', correct: false },
            ],
          },
          {
            junction: 4,
            question: 'Which word says /mæt/?',
            options: [
              { text: 'mat', sound: '/mæt/', correct: true },
              { text: 'mit', sound: '/mɪt/', correct: false },
              { text: 'mut', sound: '/mʌt/', correct: false },
            ],
          },
          {
            junction: 5,
            question: 'Which word says /ræt/?',
            options: [
              { text: 'rat', sound: '/ræt/', correct: true },
              { text: 'rit', sound: '/rɪt/', correct: false },
              { text: 'rut', sound: '/rʌt/', correct: false },
            ],
          },
        ],
        correctPath: [0, 0, 0, 0, 0],
        reward: 50,
        story: 'Help the cat find its home! Solve the maze by picking the right words.',
      },
      {
        title: "Dog's Adventure 🐕",
        difficulty: 'easy',
        junctions: 5,
        words: [
          {
            junction: 1,
            question: 'Which word says /dɔg/?',
            options: [
              { text: 'dog', sound: '/dɔg/', correct: true },
              { text: 'dig', sound: '/dɪg/', correct: false },
              { text: 'dug', sound: '/dʌg/', correct: false },
            ],
          },
          {
            junction: 2,
            question: 'Which word says /bɔg/?',
            options: [
              { text: 'bog', sound: '/bɔg/', correct: true },
              { text: 'big', sound: '/bɪg/', correct: false },
              { text: 'bug', sound: '/bʌg/', correct: false },
            ],
          },
          {
            junction: 3,
            question: 'Which word says /fɔg/?',
            options: [
              { text: 'fog', sound: '/fɔg/', correct: true },
              { text: 'fig', sound: '/fɪg/', correct: false },
              { text: 'fug', sound: '/fʌg/', correct: false },
            ],
          },
          {
            junction: 4,
            question: 'Which word says /hɔg/?',
            options: [
              { text: 'hog', sound: '/hɔg/', correct: true },
              { text: 'hig', sound: '/hɪg/', correct: false },
              { text: 'hug', sound: '/hʌg/', correct: false },
            ],
          },
          {
            junction: 5,
            question: 'Which word says /lɔg/?',
            options: [
              { text: 'log', sound: '/lɔg/', correct: true },
              { text: 'lig', sound: '/lɪg/', correct: false },
              { text: 'lug', sound: '/lʌg/', correct: false },
            ],
          },
        ],
      },
      {
        title: "Pig's Home 🐷",
        difficulty: 'easy',
        junctions: 5,
        words: [
          { junction: 1, question: 'Which word says /pɪg/?', options: [{ text: 'pig', correct: true }, { text: 'pag', correct: false }, { text: 'pug', correct: false }] },
          { junction: 2, question: 'Which word says /bɪg/?', options: [{ text: 'big', correct: true }, { text: 'bag', correct: false }, { text: 'bug', correct: false }] },
          { junction: 3, question: 'Which word says /dɪg/?', options: [{ text: 'dig', correct: true }, { text: 'dag', correct: false }, { text: 'dug', correct: false }] },
          { junction: 4, question: 'Which word says /fɪg/?', options: [{ text: 'fig', correct: true }, { text: 'fag', correct: false }, { text: 'fug', correct: false }] },
          { junction: 5, question: 'Which word says /rɪg/?', options: [{ text: 'rig', correct: true }, { text: 'rag', correct: false }, { text: 'rug', correct: false }] },
        ],
      },
    ],
  },
  level2: {
    mazes: [
      {
        title: 'Make & Bake 🍰',
        difficulty: 'medium',
        pattern: 'Vowel team: ai',
        junctions: 6,
        words: [
          { question: 'Which word says /meɪk/?', options: [{ text: 'make', correct: true }, { text: 'milk', correct: false }, { text: 'make', correct: true }] },
          { question: 'Which word says /beɪk/?', options: [{ text: 'bake', correct: true }, { text: 'bike', correct: false }, { text: 'bake', correct: true }] },
          { question: 'Which word says /reɪn/?', options: [{ text: 'rain', correct: true }, { text: 'run', correct: false }] },
          { question: 'Which word says /peɪn/?', options: [{ text: 'pain', correct: true }, { text: 'pin', correct: false }] },
          { question: 'Which word says /meɪl/?', options: [{ text: 'mail', correct: true }, { text: 'mill', correct: false }] },
          { question: 'Which word says /seɪl/?', options: [{ text: 'sail', correct: true }, { text: 'sell', correct: false }] },
        ],
      },
      {
        title: 'Bees in Trees 🐝',
        difficulty: 'medium',
        pattern: 'Vowel team: ee',
        junctions: 6,
        words: [
          { question: 'Which word says /bi/?', options: [{ text: 'bee', correct: true }, { text: 'be', correct: false }] },
          { question: 'Which word says /tri/?', options: [{ text: 'tree', correct: true }, { text: 'try', correct: false }] },
          { question: 'Which word says /fri/?', options: [{ text: 'free', correct: true }, { text: 'fry', correct: false }] },
          { question: 'Which word says /si/', options: [{ text: 'see', correct: true }, { text: 'sea', correct: false }] },
          { question: 'Which word says /tib/', options: [{ text: 'tee', correct: true }, { text: 'tea', correct: false }] },
          { question: 'Which word says /mi/', options: [{ text: 'me', correct: true }, { text: 'thee', correct: false }] },
        ],
      },
    ],
  },
  level3: {
    mazes: [
      {
        title: 'Blend Challenge 🌟',
        difficulty: 'hard',
        pattern: 'Consonant blends',
        junctions: 8,
        words: [
          { question: 'Which word says /blænd/?', options: [{ text: 'blend', correct: true }, { text: 'band', correct: false }] },
          { question: 'Which word says /blæk/?', options: [{ text: 'black', correct: true }, { text: 'back', correct: false }] },
          { question: 'Which word says /brein/?', options: [{ text: 'brain', correct: true }, { text: 'bran', correct: false }] },
          { question: 'Which word says /bred/?', options: [{ text: 'bread', correct: true }, { text: 'bad', correct: false }] },
          { question: 'Which word says /krim/?', options: [{ text: 'cream', correct: true }, { text: 'cam', correct: false }] },
          { question: 'Which word says /drim/?', options: [{ text: 'dream', correct: true }, { text: 'dam', correct: false }] },
          { question: 'Which word says /spring/?', options: [{ text: 'spring', correct: true }, { text: 'sing', correct: false }] },
          { question: 'Which word says /string/?', options: [{ text: 'string', correct: true }, { text: 'sing', correct: false }] },
        ],
      },
    ],
  },
};

export const phoneticProgression = {
  phase1: { name: 'Sound Basics', focus: 'Single letter sounds', words: ['a, b, c, d, e...'], duration: 'Week 1-2' },
  phase2: { name: 'CVC Magic', focus: 'Consonant-Vowel-Consonant', words: ['cat, dog, sit, run, pig'], duration: 'Week 3-4', prerequisite: 'phase1' },
  phase3: { name: 'Vowel Teams', focus: 'Two vowels together', words: ['make, take, rain, mail'], duration: 'Week 5-6', prerequisite: 'phase2' },
  phase4: { name: 'Blend Time', focus: 'Consonant clusters', words: ['blend, spring, black'], duration: 'Week 7-8', prerequisite: 'phase3' },
  phase5: { name: 'Digraph Discovery', focus: 'Two letters = one sound', words: ['ch, sh, th, ph'], duration: 'Week 9-10', prerequisite: 'phase4' },
};

function safeAccuracy(history = []) {
  if (!history.length) return 0;
  const correct = history.reduce((acc, item) => acc + (item.correct ? 1 : 0), 0);
  return Math.round((correct / history.length) * 100);
}

export function getPhonicsAdaptiveSettings(history = []) {
  const accuracy = safeAccuracy(history.slice(-10));
  if (accuracy < 60) return { level: 1, focus: 'CVC', support: 'high', difficulty: 'easy' };
  if (accuracy < 75) return { level: 2, focus: 'Vowel Teams', support: 'medium', difficulty: 'medium' };
  if (accuracy < 90) return { level: 3, focus: 'Consonant Blends', support: 'medium', difficulty: 'hard' };
  return { level: 4, focus: 'Advanced Blends', support: 'low', difficulty: 'hard' };
}

function buildFallbackMaze(levelKey = 'level1') {
  const level = phoneticsMazeData[levelKey] || phoneticsMazeData.level1;
  const mazeDef = level.mazes?.[0];
  if (!mazeDef) return null;

  const correctIndices = mazeDef.correctPath || mazeDef.words.map(() => 0);
  const junctions = (mazeDef.words || []).map((w, idx) => {
    const options = (w.options || [w.word]).map((text, i) => ({
      text,
      sound: w.sound || '',
      correct: i === (correctIndices[idx] || 0),
    }));
    const question = w.pattern ? `Which matches the pattern ${w.pattern}?` : `Which matches the sound ${w.sound || w.word}?`;
    return {
      position: [idx + 1, 1],
      question,
      options,
      topic: w.pattern || levelKey,
    };
  });

  const correctPath = junctions.map((j) => j.position);
  return {
    mazeId: `offline-${levelKey}`,
    title: mazeDef.title || levelKey,
    rows: Math.max(8, junctions.length + 2),
    cols: 6,
    junctions,
    correctPath,
    difficulty: mazeDef.difficulty || 'easy',
    focus: levelKey,
  };
}

export function getOfflineMaze(levelKey = 'level1') {
  return buildFallbackMaze(levelKey) || buildFallbackMaze('level1');
}
