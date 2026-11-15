/**
 * Optional two-letter written-word warm-up, without speech or phonics audio.
 * Keep this separate from the existing six-step spelling journey so the
 * familiar ?play=1 entry still begins with its original "cat" challenge.
 * Each clue contains a blank; the two tiles deliberately start reversed.
 */
import type { PublicSpellingChallenge } from './publicSpellingContent';

const words: readonly [string, string][] = [
  ['am', 'I ___ happy to be here.'],
  ['an', 'She ate ___ apple.'],
  ['at', 'Meet me ___ the park.'],
  ['be', 'Please ___ kind to others.'],
  ['by', 'The bicycle is ___ the gate.'],
  ['do', 'What should I ___ next?'],
  ['go', 'We can ___ to the playground.'],
  ['he', '___ is my brother.'],
  ['if', '___ it rains, we will stay inside.'],
  ['in', 'The pencil is ___ the bag.'],
  ['is', 'The dog ___ sleeping.'],
  ['it', '___ is a sunny day.'],
  ['me', 'Please give the book to ___.'],
  ['my', 'This is ___ pencil.'],
  ['no', 'She said ___ to the offer.'],
  ['of', 'A cup ___ water, please.'],
  ['on', 'The book is ___ the table.'],
  ['up', 'Look ___ at the stars.'],
];

export const TWO_LETTER_CHALLENGES: readonly PublicSpellingChallenge[] = words.map(([word, clue]) => ({
  id: 'two-letter-' + word,
  mode: 'build',
  word,
  clue,
  clueType: 'sentence',
  spellingPattern: 'two-letter written word',
  tiles: [word[1], word[0]],
}));

export const TWO_LETTER_ROUND_SIZE = 6;

export function twoLetterPracticeRound(round: number): PublicSpellingChallenge[] {
  const normalized = Math.max(0, Math.floor(round)) % (TWO_LETTER_CHALLENGES.length / TWO_LETTER_ROUND_SIZE);
  return TWO_LETTER_CHALLENGES.slice(
    normalized * TWO_LETTER_ROUND_SIZE,
    (normalized + 1) * TWO_LETTER_ROUND_SIZE,
  );
}
