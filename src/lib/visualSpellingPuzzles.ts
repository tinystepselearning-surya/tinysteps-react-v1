/**
 * Ages 8–10+ visual spelling prototype: deliberately silent, with contextual word work.
 * Reviewed examples only; no phoneme inference, speech APIs, or backend writes.
 */
export type VisualSpellingStage = 'explorer' | 'builder' | 'expert' | 'master';
type BasePuzzle = {
  id: string;
  stage: VisualSpellingStage;
  word: string;
  clue: string;
  learningNote: string;
  hint: string;
};

export type VisualSpellingPuzzle =
  | (BasePuzzle & { kind: 'arrange'; tiles: string[] })
  | (BasePuzzle & { kind: 'correct'; options: string[] })
  | (BasePuzzle & { kind: 'missing'; before: string; after: string; choices: string[]; missing: string })
  | (BasePuzzle & {
      kind: 'sort';
      categories: [string, string];
      answer: string;
      pair: { word: string; clue: string; answer: string; learningNote: string };
    });

export const VISUAL_SPELLING_STAGES: readonly {
  id: VisualSpellingStage;
  title: string;
  subtitle: string;
  examples: string;
}[] = [
  { id: 'explorer', title: 'Everyday Words', subtitle: 'Build familiar words, spot mistakes and fill missing letters.', examples: 'friend · school · planet' },
  { id: 'builder', title: 'Patterns & Endings', subtitle: 'Match word endings, prefixes and tricky letter patterns.', examples: 'careful · receive · happiness' },
  { id: 'expert', title: 'Tricky Spellings', subtitle: 'Practise double letters, spelling changes and longer words.', examples: 'necessary · calendar · opportunity' },
  { id: 'master', title: 'Long Word Challenge', subtitle: 'Build and check long words using meaningful word parts.', examples: 'international · accommodation · misunderstanding' },
];

export const VISUAL_SPELLING_PUZZLES: readonly VisualSpellingPuzzle[] = [
  {
    id: 'explorer-journey', stage: 'explorer', kind: 'arrange', word: 'journey',
    clue: 'A trip from one place to another.',
    tiles: ['n', 'r', 'o', 'y', 'j', 'e', 'u'],
    hint: 'It begins with j and has seven letters.',
    learningNote: 'Journey is a seven-letter word. Look at the complete spelling, not just the order of a few tiles.',
  },
  {
    id: 'explorer-friend', stage: 'explorer', kind: 'correct', word: 'friend',
    clue: 'A person you trust and enjoy spending time with.',
    options: ['freind', 'frend', 'friend', 'friand'],
    hint: 'Look closely at the letters between fr and nd.',
    learningNote: 'Friend is spelled f-r-i-e-n-d. The order i-e is worth remembering in this word.',
  },
  {
    id: 'explorer-separate', stage: 'explorer', kind: 'missing', word: 'separate',
    clue: 'To move things apart or keep them apart.',
    before: 'sepa', missing: 'r', after: 'ate', choices: ['n', 'r', 't', 's'],
    hint: 'Say the complete word in your mind and study the middle letters.',
    learningNote: 'Separate contains a-r-a in the middle, not e-r-e.',
  },
  {
    id: 'explorer-hopeful', stage: 'explorer', kind: 'sort', word: 'hopeful',
    clue: 'Feeling that something good may happen.',
    categories: ['Ends in -ful', 'Ends in -less'], answer: 'Ends in -ful',
    pair: { word: 'hopeless', clue: 'Having little or no hope for a good outcome.', answer: 'Ends in -less', learningNote: 'Hopeless is hope + less. Compare hopeful and hopeless: the endings change the meaning.' },
    hint: 'Check the last three or four letters of the word.',
    learningNote: 'Hopeful ends in -ful: hope + ful. The suffix has one final l.',
  },
  {
    id: 'explorer-planet', stage: 'explorer', kind: 'arrange', word: 'planet',
    clue: 'A large round object that moves around a star.',
    tiles: ['n', 't', 'p', 'a', 'l', 'e'],
    hint: 'It begins with pl and ends in et.',
    learningNote: 'Planet is spelled p-l-a-n-e-t. Look at the position of its vowel letters.',
  },
  {
    id: 'explorer-school', stage: 'explorer', kind: 'correct', word: 'school',
    clue: 'A place where children study and learn.',
    options: ['scool', 'school', 'scholl', 'shcool'],
    hint: 'The word starts with three letters before oo.',
    learningNote: 'School begins with sch and contains oo.',
  },
  {
    id: 'explorer-picture', stage: 'explorer', kind: 'missing', word: 'picture',
    clue: 'A drawing, photograph or image.',
    before: 'pic', missing: 't', after: 'ure', choices: ['d', 't', 'c', 'r'],
    hint: 'The word begins pic... and ends ...ure.',
    learningNote: 'Picture contains pic + ture. Notice the letter t in the middle.',
  },
  {
    id: 'explorer-joyless', stage: 'explorer', kind: 'sort', word: 'joyless',
    clue: 'Without joy or happiness.',
    categories: ['Ends in -ful', 'Ends in -less'], answer: 'Ends in -less',
    pair: { word: 'joyful', clue: 'Feeling or showing a lot of happiness.', answer: 'Ends in -ful', learningNote: 'Joyful ends in -ful, while joyless ends in -less. Study the ending carefully.' },
    hint: 'Look at the last four letters.',
    learningNote: 'Joyless is joy + less. The suffix -less means without.',
  },

  {
    id: 'builder-careless', stage: 'builder', kind: 'sort', word: 'careless',
    clue: 'Not paying enough attention or care.',
    categories: ['Ends in -ful', 'Ends in -less'], answer: 'Ends in -less',
    pair: { word: 'careful', clue: 'Taking care to avoid mistakes or harm.', answer: 'Ends in -ful', learningNote: 'Careful has the suffix -ful. Careless has -less; the two endings change the meaning.' },
    hint: 'The suffix changes the meaning of care.',
    learningNote: 'Careless is care + less. The suffix -less often means without.',
  },

  {
    id: 'builder-carefully', stage: 'builder', kind: 'arrange', word: 'carefully',
    clue: 'Doing something with attention to avoid mistakes.',
    tiles: ['ly', 'care', 'ful'],
    hint: 'Start with care; then add the ending that means full of, followed by -ly.',
    learningNote: 'Carefully is built from care + ful + ly. The complete word is carefully.',
  },
  {
    id: 'builder-receive', stage: 'builder', kind: 'correct', word: 'receive',
    clue: 'To get something that someone gives or sends.',
    options: ['recieve', 'receive', 'receeve', 'receve'],
    hint: 'The letters after c are e then i in this word.',
    learningNote: 'Receive uses e-i after c. Other English words can follow different patterns, so study each word family.',
  },
  {
    id: 'builder-definitely', stage: 'builder', kind: 'missing', word: 'definitely',
    clue: 'Without doubt; certainly.',
    before: 'defin', missing: 'i', after: 'tely', choices: ['a', 'i', 'e', 'o'],
    hint: 'The spelling is related to definite.',
    learningNote: 'Definitely is definite + ly. Keep the e before -ly: definite → definitely.',
  },
  {
    id: 'builder-disagree', stage: 'builder', kind: 'arrange', word: 'disagree',
    clue: 'To have a different opinion from someone.',
    tiles: ['agree', 'dis'],
    hint: 'Put the prefix meaning not or opposite before agree.',
    learningNote: 'Disagree adds dis- to agree. Meaningful parts help build longer words.',
  },
  {
    id: 'builder-beautiful', stage: 'builder', kind: 'correct', word: 'beautiful',
    clue: 'Very pleasing to look at or experience.',
    options: ['beautifull', 'beautifal', 'beautiful', 'beutiful'],
    hint: 'The word ends with -ful, which has one final l.',
    learningNote: 'Beautiful keeps beau- and ends in -ful, not -full.',
  },
  {
    id: 'builder-believe', stage: 'builder', kind: 'missing', word: 'believe',
    clue: 'To think something is true.',
    before: 'bel', missing: 'ie', after: 've', choices: ['ei', 'ie', 'ee', 'i'],
    hint: 'Think about the related word belief.',
    learningNote: 'Believe contains ie after bel. Related word: belief.',
  },
  {
    id: 'builder-agreement', stage: 'builder', kind: 'sort', word: 'agreement',
    clue: 'A shared decision or understanding.',
    categories: ['Ends in -ment', 'Ends in -ness'], answer: 'Ends in -ment',
    pair: { word: 'happiness', clue: 'The feeling of being happy.', answer: 'Ends in -ness', learningNote: 'Happiness is happy + ness, changing y to i. Agreement instead ends in -ment.' },
    hint: 'Look at the ending after agree.',
    learningNote: 'Agreement is agree + ment. The suffix -ment can help form nouns.',
  },

  {
    id: 'expert-necessary', stage: 'expert', kind: 'missing', word: 'necessary',
    clue: 'Something that is needed or required.',
    before: 'nece', missing: 'ss', after: 'ary', choices: ['sc', 's', 'ss', 'c'],
    hint: 'The middle of this word has two of the same consonant.',
    learningNote: 'Necessary has one c followed by two s letters: ne-ce-ss-ary.',
  },

  {
    id: 'expert-unhappiness', stage: 'expert', kind: 'arrange', word: 'unhappiness',
    clue: 'The feeling or state of not being happy.',
    tiles: ['ness', 'un', 'happi'],
    hint: 'The prefix means not; the base happy changes y to i before -ness.',
    learningNote: 'Unhappiness uses un- + happi + -ness. Happy changes y to i before -ness.',
  },
  {
    id: 'expert-calendar', stage: 'expert', kind: 'correct', word: 'calendar',
    clue: 'A chart showing days, weeks and months.',
    options: ['calender', 'calandar', 'calendar', 'calendor'],
    hint: 'Pay attention to the last three letters.',
    learningNote: 'Calendar ends in -dar, not -der.',
  },
  {
    id: 'expert-kindness', stage: 'expert', kind: 'sort', word: 'kindness',
    clue: 'The quality of being thoughtful and caring.',
    categories: ['Prefix at the start', 'Suffix at the end'], answer: 'Suffix at the end',
    pair: { word: 'unhappy', clue: 'Not feeling happy.', answer: 'Prefix at the start', learningNote: 'Unhappy has un- at the start. Kindness has -ness at the end.' },
    hint: 'Find which part was added to kind.',
    learningNote: 'Kindness is kind + ness. -ness is a suffix added at the end.',
  },
  {
    id: 'expert-impossible', stage: 'expert', kind: 'arrange', word: 'impossible',
    clue: 'Something that cannot be done.',
    tiles: ['possible', 'im'],
    hint: 'The short prefix meaning not comes before possible.',
    learningNote: 'Impossible uses the prefix im- with possible. The prefix changes the meaning.',
  },
  {
    id: 'expert-opportunity', stage: 'expert', kind: 'correct', word: 'opportunity',
    clue: 'A chance to do something useful or exciting.',
    options: ['opportunity', 'oppertunity', 'oportunity', 'opportunaty'],
    hint: 'Look carefully at the double consonant near the beginning.',
    learningNote: 'Opportunity has pp and ends with -unity.',
  },
  {
    id: 'expert-occasion', stage: 'expert', kind: 'missing', word: 'occasion',
    clue: 'An event or a particular time when something happens.',
    before: 'occa', missing: 's', after: 'ion', choices: ['ss', 's', 'c', 't'],
    hint: 'The word starts occa... and has one s before ion.',
    learningNote: 'Occasion has double c and a single s.',
  },
  {
    id: 'expert-enjoyment', stage: 'expert', kind: 'sort', word: 'enjoyment',
    clue: 'The feeling of taking pleasure in something.',
    categories: ['Ends in -ment', 'Ends in -ness'], answer: 'Ends in -ment',
    pair: { word: 'kindness', clue: 'The quality of caring for other people.', answer: 'Ends in -ness', learningNote: 'Kindness ends in -ness; enjoyment ends in -ment. Both endings form nouns.' },
    hint: 'Identify the suffix following enjoy.',
    learningNote: 'Enjoyment is enjoy + ment. The spelling of enjoy is kept.',
  },

  {
    id: 'master-international', stage: 'master', kind: 'arrange', word: 'international',
    clue: 'Involving two or more countries.',
    tiles: ['al', 'inter', 'nation'],
    hint: 'Start with inter- (between), add nation, then finish with -al.',
    learningNote: 'International can be built from inter- + nation + -al. Inter- means between; -al can mean relating to.',
  },
  {
    id: 'master-accommodation', stage: 'master', kind: 'correct', word: 'accommodation',
    clue: 'A room or place to stay while away from home.',
    options: ['accomodation', 'accommodation', 'accommondation', 'acommodation'],
    hint: 'This word has two c letters and two m letters.',
    learningNote: 'Accommodation has cc and mm: a-c-c-o-m-m-o-d-a-t-i-o-n.',
  },
  {
    id: 'master-conscience', stage: 'master', kind: 'missing', word: 'conscience',
    clue: 'Your sense of what is right or wrong.',
    before: 'con', missing: 'sc', after: 'ience', choices: ['s', 'sc', 'c', 'sh'],
    hint: 'The letters in the middle are not what you might first expect.',
    learningNote: 'Conscience is con + sc + ience. The middle uses sc.',
  },
  {
    id: 'master-interdependence', stage: 'master', kind: 'sort', word: 'interdependence',
    clue: 'A state in which people or things depend on one another.',
    categories: ['Has prefix inter-', 'Has prefix pre-'], answer: 'Has prefix inter-',
    pair: { word: 'preview', clue: 'To look at something before it is shown or used.', answer: 'Has prefix pre-', learningNote: 'Preview begins with pre-, which can mean before. Interdependence begins with inter-.' },
    hint: 'Look at the first five letters of the word.',
    learningNote: 'Interdependence starts with inter-, often meaning between or among.',
  },

  {
    id: 'master-misunderstanding', stage: 'master', kind: 'arrange', word: 'misunderstanding',
    clue: 'A situation in which someone understands something incorrectly.',
    tiles: ['ing', 'mis', 'understand'],
    hint: 'Begin with the part that means wrongly, then the base word, then -ing.',
    learningNote: 'Misunderstanding can be built from mis- + understand + -ing. The word parts help with longer spellings.',
  },
  {
    id: 'master-extraordinary', stage: 'master', kind: 'correct', word: 'extraordinary',
    clue: 'Something very unusual or remarkable.',
    options: ['extrordinary', 'extraordenary', 'extraordinary', 'extraordinnary'],
    hint: 'This word joins extra and ordinary. Keep every letter in both parts.',
    learningNote: 'Extraordinary is extra + ordinary. Notice the full extra- and -ordinary parts.',
  },
  {
    id: 'master-environment', stage: 'master', kind: 'missing', word: 'environment',
    clue: 'The surroundings or conditions in which someone lives.',
    before: 'envir', missing: 'o', after: 'nment', choices: ['e', 'i', 'o', 'a'],
    hint: 'Focus on the middle of the word: envir…nment.',
    learningNote: 'Environment keeps the o in environ- before -ment.',
  },
  {
    id: 'master-misinterpretation', stage: 'master', kind: 'sort', word: 'misinterpretation',
    clue: 'Understanding the meaning of something incorrectly.',
    categories: ['Begins with mis-', 'Begins with dis-'], answer: 'Begins with mis-',
    pair: {
      word: 'disagreement', clue: 'A situation where people have different opinions.',
      answer: 'Begins with dis-',
      learningNote: 'Disagreement starts with dis- and comes from disagree + -ment. Misinterpretation starts with mis-.',
    },
    hint: 'Compare the first three letters of the words.',
    learningNote: 'Misinterpretation begins with mis-, meaning wrongly, followed by interpretation.',
  },
];

/**
 * Mix the order for a new in-page play session. Nothing is persisted to the
 * browser or a child profile. Caller selects when to reshuffle (on replay).
 * Accepting an injected random source makes the shuffle deterministic in tests.
 */
export function shuffleVisualSpellingPuzzles(
  puzzles: readonly VisualSpellingPuzzle[],
  random: () => number = Math.random
): VisualSpellingPuzzle[] {
  const result = [...puzzles];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const visualSpellingAnswer = (puzzle: VisualSpellingPuzzle): string => {
  if (puzzle.kind === 'sort') return puzzle.answer;
  if (puzzle.kind === 'missing') return puzzle.missing;
  return puzzle.word;
};

export function validateVisualSpellingPuzzles(puzzles: readonly VisualSpellingPuzzle[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const stages = new Set(VISUAL_SPELLING_STAGES.map(stage => stage.id));
  for (const puzzle of puzzles) {
    if (!puzzle.id || seen.has(puzzle.id)) errors.push('Duplicate or empty puzzle id: ' + puzzle.id);
    seen.add(puzzle.id);
    if (!stages.has(puzzle.stage)) errors.push(puzzle.id + ': unknown stage');
    if (!puzzle.word || !puzzle.clue || !puzzle.learningNote || !puzzle.hint) errors.push(puzzle.id + ': missing learning content');
    if (puzzle.kind === 'arrange') {
      if (puzzle.tiles.length < 2 || puzzle.tiles.join('') === puzzle.word) errors.push(puzzle.id + ': invalid or solved tile set');
      if (puzzle.tiles.join('').split('').sort().join('') !== puzzle.word.split('').sort().join('')) errors.push(puzzle.id + ': tiles do not form answer');
    } else if (puzzle.kind === 'correct') {
      if (puzzle.options.length !== 4 || new Set(puzzle.options).size !== 4 ||
          puzzle.options.filter(v => v === puzzle.word).length !== 1) errors.push(puzzle.id + ': ambiguous choices');
    } else if (puzzle.kind === 'missing') {
      if (puzzle.before + puzzle.missing + puzzle.after !== puzzle.word ||
          puzzle.choices.length !== 4 || new Set(puzzle.choices).size !== 4 ||
          puzzle.choices.filter(v => v === puzzle.missing).length !== 1) errors.push(puzzle.id + ': invalid missing letter choices');
    } else {
      if (!puzzle.categories.includes(puzzle.answer) || puzzle.categories[0] === puzzle.categories[1] ||
          !puzzle.pair?.word || !puzzle.pair.clue || puzzle.pair.word === puzzle.word ||
          !puzzle.categories.includes(puzzle.pair.answer) ||
          puzzle.pair.answer === puzzle.answer ||
          !puzzle.pair.learningNote) errors.push(puzzle.id + ': invalid paired sorting categories');
    }
  }
  return errors;
}
