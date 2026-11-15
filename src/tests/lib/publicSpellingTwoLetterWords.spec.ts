import { describe, expect, it } from 'vitest';
import { TWO_LETTER_CHALLENGES, TWO_LETTER_ROUND_SIZE, twoLetterPracticeRound } from '../../lib/publicSpellingTwoLetterWords';
import { PUBLIC_SPELLING_LEVELS } from '../../lib/publicSpellingContent';

describe('sound-free two-letter starter words', () => {
  it('has 18 distinct two-letter words with meaningful sentence clues and valid tiles', () => {
    expect(TWO_LETTER_CHALLENGES).toHaveLength(18);
    expect(new Set(TWO_LETTER_CHALLENGES.map(x => x.id)).size).toBe(18);
    for (const word of TWO_LETTER_CHALLENGES) {
      expect(word.mode).toBe('build');
      expect(word.word).toMatch(/^[a-z]{2}$/);
      expect(word.clue).toContain('___');
      expect(word.clue.toLowerCase()).not.toContain(word.word + ' ');
      if (word.mode === 'build') {
        expect(word.tiles).toHaveLength(2);
        expect([...word.tiles].sort()).toEqual([...word.word].sort());
        expect(word.tiles.join('')).not.toBe(word.word);
      }
      expect(word).not.toHaveProperty('audio');
      expect(word).not.toHaveProperty('kidId');
    }
  });

  it('offers three independent six-word rounds without changing the approved classic starting word', () => {
    expect(TWO_LETTER_ROUND_SIZE).toBe(6);
    const rounds = [0, 1, 2].map(twoLetterPracticeRound);
    expect(rounds.map(r => r.length)).toEqual([6, 6, 6]);
    expect(new Set(rounds.flat().map(x => x.word)).size).toBe(18);
    expect(twoLetterPracticeRound(3).map(x => x.id))
      .toEqual(rounds[0].map(x => x.id));
    expect(PUBLIC_SPELLING_LEVELS[0].challenges[0].word).toBe('cat');
  });
});
