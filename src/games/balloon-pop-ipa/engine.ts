/**
 * Balloon Pop IPA - Game Engine
 * 
 * Generates questions with adaptive difficulty based on player performance.
 * Manages balloon configurations, speed, and minimal pair confusables.
 */

import type { Phoneme, PhonemeCategory, MinimalPair, TrickyWord } from './phoneme-data';
import { getPhonemesByCategory, findPhonemeById, getMinimalPairs, getTrickyWords } from './phoneme-data';
import type { Phase, LearnerState, RoundSpec } from './types';

// ========== TYPES ==========

export interface Answer {
  phonemeId: string;
  correct: boolean;
  timestamp: number;
  timeSpent?: number;
}

export interface BalloonConfig {
  id: string;
  phoneme: Phoneme;
  isCorrect: boolean;
  speed: number; // pixels per second
  delay: number; // ms before balloon starts rising
  size: 'small' | 'medium' | 'large';
}

export interface Question {
  targetPhoneme: Phoneme;
  example: { word: string; ipa: string; picture?: string };
  balloons: BalloonConfig[];
  difficulty: number; // 1-5
}

export interface DifficultySettings {
  balloonCount: number;
  speed: number; // base speed multiplier (1.0 = normal)
  size: 'small' | 'medium' | 'large';
  useConfusables: boolean;
  confusableCount: number; // how many confusables to include
}

// ========== CONSTANTS ==========

const BASE_SPEED = 50; // pixels per second
const DIFFICULTY_LEVELS: Record<number, DifficultySettings> = {
  1: {
    balloonCount: 4,
    speed: 1.0,
    size: 'large',
    useConfusables: false,
    confusableCount: 0
  },
  2: {
    balloonCount: 5,
    speed: 1.1,
    size: 'large',
    useConfusables: true,
    confusableCount: 1
  },
  3: {
    balloonCount: 6,
    speed: 1.2,
    size: 'medium',
    useConfusables: true,
    confusableCount: 2
  },
  4: {
    balloonCount: 7,
    speed: 1.35,
    size: 'medium',
    useConfusables: true,
    confusableCount: 3
  },
  5: {
    balloonCount: 8,
    speed: 1.5,
    size: 'small',
    useConfusables: true,
    confusableCount: 4
  }
};

// ========== DIFFICULTY ADAPTATION ==========

/**
 * Determines if player should level up based on recent performance
 */
export function shouldLevelUp(recentAnswers: Answer[]): boolean {
  if (recentAnswers.length < 10) return false;
  
  const last10 = recentAnswers.slice(0, 10);
  const correct = last10.filter(a => a.correct).length;
  const accuracy = (correct / 10) * 100;
  
  return accuracy >= 80;
}

/**
 * Determines if player should level down based on recent performance
 */
export function shouldLevelDown(recentAnswers: Answer[]): boolean {
  if (recentAnswers.length < 10) return false;
  
  const last10 = recentAnswers.slice(0, 10);
  const correct = last10.filter(a => a.correct).length;
  const accuracy = (correct / 10) * 100;
  
  return accuracy < 60;
}

/**
 * Suggests practice mode if player is struggling
 */
export function shouldSuggestPractice(recentAnswers: Answer[]): boolean {
  return shouldLevelDown(recentAnswers);
}

// ========== QUESTION GENERATION ==========

/**
 * Shuffles an array (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets random items from an array
 */
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Generates decoy phonemes for balloons
 */
function generateDecoys(
  target: Phoneme,
  category: PhonemeCategory | 'mixed',
  count: number,
  useConfusables: boolean,
  confusableCount: number
): Phoneme[] {
  const allPhonemes = getPhonemesByCategory(category);
  const decoys: Phoneme[] = [];
  
  // First, add confusables if enabled
  if (useConfusables && target.confusables && target.confusables.length > 0) {
    const confusablePhonemes = target.confusables
      .map(id => findPhonemeById(id))
      .filter((p): p is Phoneme => p !== undefined);
    
    const selectedConfusables = getRandomItems(
      confusablePhonemes,
      Math.min(confusableCount, confusablePhonemes.length)
    );
    
    decoys.push(...selectedConfusables);
  }
  
  // Fill remaining slots with random phonemes from the pool
  const remaining = count - decoys.length;
  if (remaining > 0) {
    const otherPhonemes = allPhonemes.filter(
      p => p.id !== target.id && !decoys.some(d => d.id === p.id)
    );
    
    decoys.push(...getRandomItems(otherPhonemes, remaining));
  }
  
  return decoys;
}

/**
 * Generates a new question with balloons
 */
// NOTE: Renamed original rich generator to keep compatibility with UI component
export function generateRichQuestion(
  category: PhonemeCategory | 'mixed',
  level: number,
  recentAnswers: Answer[] = []
): Question {
  const difficulty = Math.min(5, Math.max(1, level));
  const settings = DIFFICULTY_LEVELS[difficulty];
  
  // Get available phonemes
  const availablePhonemes = getPhonemesByCategory(category);
  
  // Prioritize phonemes the player hasn't seen recently
  const recentIds = recentAnswers.slice(0, 5).map(a => a.phonemeId);
  const unseenPhonemes = availablePhonemes.filter(p => !recentIds.includes(p.id));
  const phonemePool = unseenPhonemes.length > 0 ? unseenPhonemes : availablePhonemes;
  
  // Select target phoneme
  const targetPhoneme = phonemePool[Math.floor(Math.random() * phonemePool.length)];
  
  // Select an example word
  const example = targetPhoneme.examples[
    Math.floor(Math.random() * targetPhoneme.examples.length)
  ];
  
  // Generate decoy phonemes
  const decoys = generateDecoys(
    targetPhoneme,
    category,
    settings.balloonCount - 1,
    settings.useConfusables,
    settings.confusableCount
  );
  
  // Create balloon configs
  const allBalloons = [targetPhoneme, ...decoys];
  const shuffledBalloons = shuffle(allBalloons);
  
  const balloons: BalloonConfig[] = shuffledBalloons.map((phoneme, index) => ({
    id: `balloon-${index}`,
    phoneme,
    isCorrect: phoneme.id === targetPhoneme.id,
    speed: BASE_SPEED * settings.speed * (0.9 + Math.random() * 0.2), // slight variation
    delay: index * 200, // stagger launches
    size: settings.size
  }));
  
  return {
    targetPhoneme,
    example,
    balloons,
    difficulty
  };
}

/**
 * Validates if a balloon click is correct
 */
export function validateAnswer(balloon: BalloonConfig, question: Question): boolean {
  return balloon.phoneme.id === question.targetPhoneme.id;
}

/**
 * Calculates score for a correct answer with time and streak bonuses
 */
export function calculateScore(
  timeSpent: number,
  streak: number,
  difficulty: number
): number {
  const baseScore = 100;
  
  // Time bonus: faster answers get more points (max 50 bonus)
  const timeBonus = Math.max(0, 50 - Math.floor(timeSpent / 100));
  
  // Streak bonus: max 500 points
  const streakBonus = Math.min(streak * 10, 500);
  
  // Difficulty multiplier
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.2;
  
  return Math.floor((baseScore + timeBonus + streakBonus) * difficultyMultiplier);
}

/**
 * Gets a hint for the current question (used in practice mode)
 */
export function getHint(question: Question): string {
  const { targetPhoneme, example } = question;
  return `Listen for the sound in "${example.word}" (${example.ipa}). The symbol is ${targetPhoneme.symbol}.`;
}

/**
 * Gets statistics about category performance
 */
export function getCategoryStats(
  answers: Answer[],
  _category: PhonemeCategory
): {
  total: number;
  correct: number;
  accuracy: number;
  mastery: number; // 0-100%
} {
  // Filter answers for this category
  // In real implementation, we'd look up each answer's phoneme type
  const categoryAnswers = answers; // Placeholder
  
  const total = categoryAnswers.length;
  const correct = categoryAnswers.filter(a => a.correct).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  
  // Mastery calculation: combination of accuracy and consistency
  const mastery = accuracy >= 90 ? 100 : accuracy >= 80 ? 80 : accuracy >= 70 ? 60 : accuracy >= 60 ? 40 : 0;
  
  return { total, correct, accuracy, mastery };
}

// ========== NEW SIMPLE QUESTION API WITH ADAPTIVITY ==========

// Demo mapping of prompt letter to target IPA string WITH slashes
const LETTER_TO_IPA: Record<string, string> = {
  a: '/æ/',
  e: '/e/',
  i: '/ɪ/',
  o: '/ɒ/',
  u: '/ʌ/',
  s: '/s/',
  j: '/dʒ/',
  c: '/tʃ/',
  f: '/f/',
  v: '/v/',
  th: '/θ/',
  dh: '/ð/'
};

export type SimplePrompt = {
  letter: string;
  image?: string;
  targetIPA: string; // with slashes e.g. '/æ/'
};

export type SimpleQuestion = {
  id: string;
  prompt: SimplePrompt;
  choices: string[]; // IPA strings with slashes; includes target
};

// Internal adaptive state for ring buffer + level
const engineState = {
  level: 1,
  recent: [] as boolean[]
};

// Push a result and maybe adjust level per thresholds
export function recordResult(correct: boolean): void {
  engineState.recent.unshift(correct);
  if (engineState.recent.length > 10) engineState.recent.pop();

  const accuracy = engineState.recent.reduce((a, b) => a + (b ? 1 : 0), 0) / engineState.recent.length;
  if (engineState.recent.length >= 10) {
    if (accuracy >= 0.8) engineState.level = Math.min(5, engineState.level + 1);
    else if (accuracy < 0.6) engineState.level = Math.max(1, engineState.level - 1);
  }
}

export function getLevel(): number {
  return engineState.level;
}

export function nextLevelConfig(level: number): { balloonCount: number; speed: number; decoys: number; sizePx: number; spawnIntervalMs: number; minDistancePx: number; minConfusableRatio: number; } {
  const clamped = Math.min(5, Math.max(1, level));
  // Scale parameters by level
  const balloonCount = 3 + clamped; // 4..8
  const speed = 1.0 + (clamped - 1) * 0.12; // 1.0..1.48
  const decoys = Math.min(4, Math.max(2, Math.round(1 + clamped))); // 2..4
  const sizePx = Math.round(110 - (clamped - 1) * 10); // 110..70
  const spawnIntervalMs = Math.round(1200 - (clamped - 1) * 150); // 1200..600
  const minDistancePx = Math.round(100 - (clamped - 1) * 10); // 100..60
  const minConfusableRatio = clamped >= 2 ? Math.min(0.75, 0.3 + (clamped - 2) * 0.15) : 0; // 0..0.75

  return { balloonCount, speed, decoys, sizePx, spawnIntervalMs, minDistancePx, minConfusableRatio };
}

export type MasteryMap = Record<string, number>; // phonemeId -> 0..1

export function updateMastery(mastery: MasteryMap, phonemeId: string, isCorrect: boolean, alpha = 0.2): MasteryMap {
  const prev = mastery[phonemeId] ?? 0.5; // neutral prior
  const obs = isCorrect ? 1 : 0;
  const updated = prev * (1 - alpha) + obs * alpha;
  return { ...mastery, [phonemeId]: Math.max(0, Math.min(1, updated)) };
}

function resolvePool(pool: Phoneme[] | PhonemeCategory | 'mixed'): Phoneme[] {
  if (Array.isArray(pool)) return pool;
  return getPhonemesByCategory(pool);
}

function findPhonemeBySymbol(symWithSlashes: string, pool: Phoneme[]): Phoneme | undefined {
  const sym = symWithSlashes.replaceAll('/', '');
  return pool.find(p => p.symbol === sym);
}

function toSlashed(symbol: string): string {
  return symbol.startsWith('/') ? symbol : `/${symbol}/`;
}

function selectDecoysForTarget(target: Phoneme, pool: Phoneme[], decoyCount: number, minConfusableRatio: number): string[] {
  const requiredConfusables = Math.floor(decoyCount * minConfusableRatio);
  const decoys: Phoneme[] = [];

  // 1) Try confusables first
  if (target.confusables && target.confusables.length > 0 && requiredConfusables > 0) {
    const confusablePhonemes = target.confusables
      .map(id => findPhonemeById(id))
      .filter((p): p is Phoneme => !!p)
      .filter(p => pool.some(x => x.id === p.id) && p.id !== target.id);
    decoys.push(...getRandomItems(confusablePhonemes, Math.min(requiredConfusables, decoyCount)));
  }

  // 2) Fill remaining by nearest difficulty
  const remaining = decoyCount - decoys.length;
  if (remaining > 0) {
    const others = pool
      .filter(p => p.id !== target.id && !decoys.some(d => d.id === p.id))
      .sort((a, b) => Math.abs(a.difficulty - target.difficulty) - Math.abs(b.difficulty - target.difficulty));
    for (const cand of others) {
      decoys.push(cand);
      if (decoys.length >= decoyCount) break;
    }
  }

  // Ensure uniqueness and limit
  const unique = decoys.filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx).slice(0, decoyCount);
  return shuffle(unique.map(p => toSlashed(p.symbol)));
}

/**
 * New simplified generator for prompts and choices.
 * pool: phoneme array or category indicator. mode is reserved for future (e.g., practice, timed).
 */
export function generateQuestion(pool: Phoneme[] | PhonemeCategory | 'mixed', _mode: 'normal' | 'practice' = 'normal'): SimpleQuestion {
  const poolList = resolvePool(pool);
  const level = getLevel();
  const cfg = nextLevelConfig(level);

  // Choose a prompt letter that maps to a phoneme present in pool
  const letters = Object.keys(LETTER_TO_IPA);
  let letter = letters[Math.floor(Math.random() * letters.length)];
  let targetIPA = LETTER_TO_IPA[letter];
  let targetPhoneme = findPhonemeBySymbol(targetIPA, poolList);

  // Ensure the chosen mapping exists in the pool; retry a few times
  let tries = 0;
  while (!targetPhoneme && tries < 10) {
    letter = letters[Math.floor(Math.random() * letters.length)];
    targetIPA = LETTER_TO_IPA[letter];
    targetPhoneme = findPhonemeBySymbol(targetIPA, poolList);
    tries++;
  }

  // Fallback: pick any phoneme from pool
  if (!targetPhoneme) {
    targetPhoneme = poolList[Math.floor(Math.random() * poolList.length)];
    targetIPA = toSlashed(targetPhoneme.symbol);
    letter = targetPhoneme.label || targetPhoneme.id;
  }

  const decoyCount = Math.max(2, Math.min(4, cfg.decoys));
  const decoys = selectDecoysForTarget(targetPhoneme, poolList, decoyCount, cfg.minConfusableRatio);
  const choices = shuffle([toSlashed(targetPhoneme.symbol), ...decoys]).slice(0, decoyCount + 1);

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: { letter, targetIPA },
    choices
  };
}

// ========== PHASED ROUND GENERATION (Cambridge-style) ==========

// Minimal grapheme mapping for demo (extendable)
const GRAPHEME_TO_PHONEME_ID: Record<string, string> = {
  // single letters
  a: 'æ', e: 'e', i: 'ɪ', o: 'ɒ', u: 'ʌ',
  // digraphs
  sh: 'ʃ', ch: 'tʃ', th: 'θ', thv: 'ð', ph: 'f', oo: 'u:', ea: 'i:', oi: 'ɔɪ', ow: 'aʊ', ou: 'aʊ', ar: 'ɑ:', er: 'ɜ:',
  // split digraphs
  a_e: 'eɪ', o_e: 'əʊ', i_e: 'aɪ'
};

// Reverse mapping: phonemeId -> graphemes
const PHONEME_ID_TO_GRAPHEMES: Record<string, string[]> = Object.entries(GRAPHEME_TO_PHONEME_ID).reduce(
  (acc, [g, pid]) => {
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(g);
    return acc;
  }, {} as Record<string, string[]>
);

function toCategoryKey(cat: 'mono'|'diph'|'cons'|'mixed'): PhonemeCategory | 'mixed' {
  return cat === 'mono' ? 'monophthongs' : cat === 'diph' ? 'diphthongs' : cat === 'cons' ? 'consonants' : 'mixed';
}

function topConfusions(learner: LearnerState, targetId: string, limit = 2): string[] {
  const row = learner.confusionMatrix[targetId] || {};
  const sorted = Object.entries(row).sort((a,b) => b[1]-a[1]).map(([id]) => id);
  return sorted.slice(0, limit);
}

function unique<T>(arr: T[]): T[] { return arr.filter((v,i,a)=>a.indexOf(v)===i); }

function chooseTarget(pool: Phoneme[]): Phoneme {
  // Prioritize lower mastery or unseen by random for now (simple)
  return pool[Math.floor(Math.random()*pool.length)];
}

function selectDecoyPhonemeIds(
  target: Phoneme,
  pool: Phoneme[],
  learner: LearnerState,
  desired: number
): string[] {
  const picks: string[] = [];

  // 1) From confusion matrix top 2
  const confused = topConfusions(learner, target.id, 2);
  for (const id of confused) {
    if (id !== target.id && pool.some(p=>p.id===id)) {
      picks.push(id);
      if (picks.length >= desired) return unique(picks);
    }
  }

  // 2) Nearest difficulty in same pool
  const sorted = pool
    .filter(p => p.id !== target.id && !picks.includes(p.id))
    .sort((a,b)=> Math.abs(a.difficulty - target.difficulty) - Math.abs(b.difficulty - target.difficulty));
  for (const p of sorted) {
    picks.push(p.id);
    if (picks.length >= desired) break;
  }
  return unique(picks).slice(0, desired);
}

function phonemeIdToSlashedIPA(id: string, pool: Phoneme[]): string | null {
  const p = pool.find(x=>x.id===id);
  return p ? `/${p.symbol}/` : null;
}

// ========== SPECIAL ROUND GENERATORS ==========

/**
 * minimalPair: Audio prompt of targetA; balloons show [A, B, +2 neutral fillers]
 * Award +2 streak bonus if correct in <2s
 */
export function minimalPair(pairData: MinimalPair, pool: Phoneme[]): RoundSpec & { bonusStreakThreshold?: number } {
  const { targetA, targetB } = pairData;
  const phonemeA = findPhonemeById(targetA);
  const phonemeB = findPhonemeById(targetB);

  if (!phonemeA || !phonemeB) {
    throw new Error(`MinimalPair phonemes not found: ${targetA}, ${targetB}`);
  }

  const ipaA = `/${phonemeA.symbol}/`;
  const ipaB = `/${phonemeB.symbol}/`;

  // Pick 2 neutral fillers from pool (not A or B)
  const fillers = pool
    .filter(p => p.id !== targetA && p.id !== targetB)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map(p => `/${p.symbol}/`);

  const choices = shuffle([ipaA, ipaB, ...fillers]);

  return {
    promptType: 'minimalPair',
    prompt: { audioKey: targetA, ipa: ipaA, targetId: targetA },
    choices,
    correctIds: [ipaA],
    bonusStreakThreshold: 2000 // ms; award +2 streak if responseMs < 2000
  };
}

/**
 * trickyRhyme: Prompt shows trickyWord + audio; balloons show rhyme anchors (text).
 * Correct = any anchor that rhymes. Multi-select allowed.
 * Returns rhymeCard data for UI display after success.
 */
export function trickyRhyme(trickyData: TrickyWord): RoundSpec & { rhymeCard?: { word: string; rhymes: string[] } } {
  const { word, ipa, rhymeAnchors } = trickyData;

  // All anchors are correct (they all rhyme)
  const choices = shuffle([...rhymeAnchors]);

  return {
    promptType: 'trickyRhyme',
    prompt: { letter: word, audioKey: word, ipa, targetId: word },
    choices,
    correctIds: rhymeAnchors, // all anchors are correct
    rhymeCard: { word, rhymes: rhymeAnchors }
  };
}

// ========== QUESTION COUNTER FOR SPECIAL ROUNDS ==========
let questionCounter = 0;

export function resetQuestionCounter(): void {
  questionCounter = 0;
}

function shouldInjectSpecialRound(): boolean {
  questionCounter++;
  // Inject every 6–8 questions (randomize slightly)
  const threshold = 6 + Math.floor(Math.random() * 3); // 6, 7, or 8
  if (questionCounter >= threshold) {
    questionCounter = 0;
    return true;
  }
  return false;
}

export function selectRound(
  phase: Phase,
  learner: LearnerState,
  category: 'mono'|'diph'|'cons'|'mixed'
): RoundSpec {
  const cat = toCategoryKey(category);
  const pool = getPhonemesByCategory(cat);

  // Occasionally inject special rounds
  if (shouldInjectSpecialRound()) {
    const specialType = Math.random() < 0.5 ? 'minimalPair' : 'trickyRhyme';

    if (specialType === 'minimalPair') {
      const pairs = getMinimalPairs();
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      return minimalPair(pair, pool);
    } else {
      const trickyWords = getTrickyWords();
      const tricky = trickyWords[Math.floor(Math.random() * trickyWords.length)];
      return trickyRhyme(tricky);
    }
  }

  // Otherwise, proceed with phase-based round
  const target = chooseTarget(pool);

  // base decoy count from difficulty config
  const cfg = nextLevelConfig(learner.level);
  const decoyCount = Math.max(2, Math.min(4, cfg.decoys));
  const decoyIds = selectDecoyPhonemeIds(target, pool, learner, decoyCount);

  switch (phase) {
    case 1: { // audioOnly → choices show IPA
      const targetIPA = `/${target.symbol}/`;
      const decoys = decoyIds
        .map(id => phonemeIdToSlashedIPA(id, pool))
        .filter((x): x is string => !!x);
      const choices = shuffle(unique([targetIPA, ...decoys])).slice(0, decoyCount+1);
      return {
        promptType: 'audioOnly',
        prompt: { audioKey: target.id, ipa: targetIPA, targetId: target.id },
        choices,
        correctIds: [targetIPA]
      };
    }
    case 2: { // letterToIPA (existing mode)
      // Reuse LETTER_TO_IPA by picking a letter that maps to target if possible
      let letter = Object.keys(LETTER_TO_IPA).find(k => LETTER_TO_IPA[k].replaceAll('/','') === target.symbol);
      if (!letter) letter = target.label || target.id;
      const targetIPA = `/${target.symbol}/`;
      const decoys = decoyIds
        .map(id => phonemeIdToSlashedIPA(id, pool))
        .filter((x): x is string => !!x);
      const choices = shuffle(unique([targetIPA, ...decoys])).slice(0, decoyCount+1);
      return {
        promptType: 'letterToIPA',
        prompt: { letter, ipa: targetIPA, targetId: target.id },
        choices,
        correctIds: [targetIPA]
      };
    }
    case 3:
    case 4: { // graphemeToIPA (digraph/trigraph/split digraph allowed)
      const graphemes = PHONEME_ID_TO_GRAPHEMES[target.id] || [];
      const grapheme = graphemes[0] || (target.label || target.id);
      const targetIPA = `/${target.symbol}/`;
      const decoys = decoyIds
        .map(id => phonemeIdToSlashedIPA(id, pool))
        .filter((x): x is string => !!x);
      const choices = shuffle(unique([targetIPA, ...decoys])).slice(0, decoyCount+1);
      return {
        promptType: 'graphemeToIPA',
        prompt: { grapheme, ipa: targetIPA, targetId: target.id },
        choices,
        correctIds: [targetIPA]
      };
    }
    case 5:
    case 6: { // ipaToGrapheme (multi-select possible)
      const targetIPA = `/${target.symbol}/`;
      const correctGraphemes = PHONEME_ID_TO_GRAPHEMES[target.id] || [];
      // Build decoy graphemes from decoy phoneme ids
      const decoyGraphemes = decoyIds.flatMap(id => PHONEME_ID_TO_GRAPHEMES[id] || []).slice(0, decoyCount);
      const choices = shuffle(unique([...correctGraphemes, ...decoyGraphemes])).slice(0, Math.max(correctGraphemes.length+2, decoyCount+1));
      const correctIds = choices.filter(c => correctGraphemes.includes(c));
      return {
        promptType: 'ipaToGrapheme',
        prompt: { ipa: targetIPA, targetId: target.id },
        choices,
        correctIds
      };
    }
    default: {
      const targetIPA = `/${target.symbol}/`;
      const decoys = decoyIds
        .map(id => phonemeIdToSlashedIPA(id, pool))
        .filter((x): x is string => !!x);
      const choices = shuffle(unique([targetIPA, ...decoys])).slice(0, decoyCount+1);
      return {
        promptType: 'letterToIPA',
        prompt: { letter: target.label || target.id, ipa: targetIPA, targetId: target.id },
        choices,
        correctIds: [targetIPA]
      };
    }
  }
}

// ========== LEARNER STATE UPDATE ==========

type ApplyResultInput = { targetId: string; isCorrect: boolean; responseMs: number; confusablesUsed: string[]; phase: Phase };

export function phaseAccuracy(learner: LearnerState, phase: Phase): number {
  const items = learner.recent.filter(r => r.phase === phase);
  if (items.length === 0) return 0;
  const correct = items.filter(r => r.isCorrect).length;
  return correct / items.length;
}

export function applyResult(learner: LearnerState, input: ApplyResultInput): LearnerState {
  const { targetId, isCorrect, responseMs, confusablesUsed, phase } = input;

  // update mastery (EWMA α=0.25)
  const alpha = 0.25;
  const prevM = learner.mastery[targetId] ?? 0.5;
  const updatedM = prevM * (1 - alpha) + (isCorrect ? 1 : 0) * alpha;

  // update avgResponseMs (EWMA β=0.25)
  const beta = 0.25;
  const newAvg = learner.avgResponseMs === 0 ? responseMs : learner.avgResponseMs * (1 - beta) + responseMs * beta;

  // update confusion matrix for wrong picks
  const cmRow = { ...(learner.confusionMatrix[targetId] || {}) };
  if (!isCorrect) {
    for (const c of confusablesUsed) {
      cmRow[c] = (cmRow[c] || 0) + 1;
    }
  }

  // recent ring buffer (keep last 50)
  const recent = [{ phase, isCorrect, responseMs, targetId, timestamp: Date.now() }, ...learner.recent].slice(0, 50);

  let nextPhase = learner.phase;
  let nextLevel = learner.level;

  // Promotion: phaseAcc>=0.8 over last 20 and avgResponseMs<=2500 → phase++
  const last20 = recent.filter(r => r.phase === phase).slice(0, 20);
  if (last20.length >= 10) {
    const acc20 = last20.filter(r => r.isCorrect).length / last20.length;
    if (acc20 >= 0.8 && newAvg <= 2500 && learner.phase < 6) {
      nextPhase = (learner.phase + 1) as Phase;
    }
  }

  // Remediation: phaseAcc<0.6 over last 10 → level down (speed-, size+, decoys-)
  const last10 = recent.filter(r => r.phase === phase).slice(0, 10);
  if (last10.length >= 10) {
    const acc10 = last10.filter(r => r.isCorrect).length / 10;
    if (acc10 < 0.6 && learner.level > 1) {
      nextLevel = Math.max(1, learner.level - 1);
    }
  }

  return {
    ...learner,
    phase: nextPhase,
    level: nextLevel,
    mastery: { ...learner.mastery, [targetId]: Math.max(0, Math.min(1, updatedM)) },
    avgResponseMs: newAvg,
    confusionMatrix: { ...learner.confusionMatrix, [targetId]: cmRow },
    recent
  };
}
