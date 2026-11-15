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
  | (BasePuzzle & { kind: 'sort'; categories: [string, string]; answer: string });

export const VISUAL_SPELLING_STAGES: readonly {
  id: VisualSpellingStage;
  title: string;
  subtitle: string;
}[] = [
  { id: 'explorer', title: 'Word Explorer', subtitle: 'Spot and form familiar spellings' },
  { id: 'builder', title: 'Pattern Builder', subtitle: 'Notice letter patterns and word endings' },
  { id: 'expert', title: 'Spelling Expert', subtitle: 'Handle longer and trickier words' },
  { id: 'master', title: 'Word Architect', subtitle: 'Build advanced words from meaningful parts' },
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
    hint: 'Check the last three or four letters of the word.',
    learningNote: 'Hopeful ends in -ful: hope + ful. The suffix has one final l.',
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
    id: 'builder-careless', stage: 'builder', kind: 'sort', word: 'careless',
    clue: 'Not paying enough attention or care.',
    categories: ['Ends in -ful', 'Ends in -less'], answer: 'Ends in -less',
    hint: 'The suffix changes the meaning of care.',
    learningNote: 'Careless is care + less. The suffix -less often means without.',
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
    id: 'expert-necessary', stage: 'expert', kind: 'missing', word: 'necessary',
    clue: 'Something that is needed or required.',
    before: 'nece', missing: 'ss', after: 'ary', choices: ['sc', 's', 'ss', 'c'],
    hint: 'The middle of this word has two of the same consonant.',
    learningNote: 'Necessary has one c followed by two s letters: ne-ce-ss-ary.',
  },
  {
    id: 'expert-kindness', stage: 'expert', kind: 'sort', word: 'kindness',
    clue: 'The quality of being thoughtful and caring.',
    categories: ['Prefix at the start', 'Suffix at the end'], answer: 'Suffix at the end',
    hint: 'Find which part was added to kind.',
    learningNote: 'Kindness is kind + ness. -ness is a suffix added at the end.',
  },
  {
    id: 'master-misunderstanding', stage: 'master', kind: 'arrange', word: 'misunderstanding',
    clue: 'A situation in which someone understands something incorrectly.',
    tiles: ['ing', 'mis', 'understand'],
    hint: 'Begin with the part that means wrongly, then the base word, then -ing.',
    learningNote: 'Misunderstanding can be built from mis- + understand + -ing. The word parts help with longer spellings.',
  },
  {
    id: 'master-because', stage: 'master', kind: 'correct', word: 'because',
    clue: 'A word used when giving a reason.',
    options: ['becaus', 'beacause', 'because', 'becose'],
    hint: 'Check the middle vowels and the final e.',
    learningNote: 'Because is spelled b-e-c-a-u-s-e. Make sure the a comes before the u.',
  },
  {
    id: 'master-environment', stage: 'master', kind: 'missing', word: 'environment',
    clue: 'The surroundings or conditions in which someone lives.',
    before: 'envir', missing: 'o', after: 'nment', choices: ['e', 'i', 'o', 'a'],
    hint: 'Focus on the middle of the word: envir…nment.',
    learningNote: 'Environment keeps the o in environ- before -ment.',
  },
  {
    id: 'master-unhappy', stage: 'master', kind: 'sort', word: 'unhappy',
    clue: 'Not feeling happy.',
    categories: ['Prefix at the start', 'Suffix at the end'], answer: 'Prefix at the start',
    hint: 'Look for the added part before happy.',
    learningNote: 'Unhappy adds un- before happy. Un- is a prefix that often means not.',
  },
];

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
      if (!puzzle.categories.includes(puzzle.answer) || puzzle.categories[0] === puzzle.categories[1]) errors.push(puzzle.id + ': invalid categories');
    }
  }
  return errors;
}
