import { describe, expect, it } from 'vitest';
import {
  VISUAL_SPELLING_PUZZLES,
  VISUAL_SPELLING_STAGES,
  validateVisualSpellingPuzzles,
  visualSpellingAnswer,
  type VisualSpellingPuzzle,
} from '../../lib/visualSpellingPuzzles';

describe('sound-free visual spelling puzzle curriculum', () => {
  it('provides four complete and validated stages', () => {
    expect(validateVisualSpellingPuzzles(VISUAL_SPELLING_PUZZLES)).toEqual([]);
    expect(VISUAL_SPELLING_STAGES).toHaveLength(4);
    expect(new Set(VISUAL_SPELLING_PUZZLES.map(puzzle => puzzle.id)).size).toBe(
      VISUAL_SPELLING_PUZZLES.length
    );
    for (const stage of VISUAL_SPELLING_STAGES) {
      const tasks = VISUAL_SPELLING_PUZZLES.filter(puzzle => puzzle.stage === stage.id);
      expect(tasks).toHaveLength(4);
      expect(new Set(tasks.map(task => task.kind))).toEqual(
        new Set(['arrange', 'correct', 'missing', 'sort'])
      );
    }
  });

  it('has answerable word-building, spotting, fill and sorting tasks', () => {
    const journey = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'explorer-journey');
    const friend = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'explorer-friend');
    const definite = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'builder-definitely');
    const unhappy = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'master-unhappy');
    expect(journey && visualSpellingAnswer(journey)).toBe('journey');
    expect(friend && visualSpellingAnswer(friend)).toBe('friend');
    expect(definite && visualSpellingAnswer(definite)).toBe('i');
    expect(unhappy && visualSpellingAnswer(unhappy)).toBe('Prefix at the start');
  });

  it('refuses ambiguous options and corrupted word parts', () => {
    const correct = VISUAL_SPELLING_PUZZLES.find(p => p.kind === 'correct');
    const arrange = VISUAL_SPELLING_PUZZLES.find(p => p.kind === 'arrange');
    const missing = VISUAL_SPELLING_PUZZLES.find(p => p.kind === 'missing');
    expect(correct?.kind).toBe('correct');
    expect(arrange?.kind).toBe('arrange');
    expect(missing?.kind).toBe('missing');
    if (!correct || correct.kind !== 'correct' ||
        !arrange || arrange.kind !== 'arrange' ||
        !missing || missing.kind !== 'missing') return;

    expect(validateVisualSpellingPuzzles([
      { ...correct, options: [correct.word, correct.word, 'x', 'y'] },
      { ...arrange, tiles: ['x', 'y'] },
      { ...missing, missing: 'wrong' },
    ] as VisualSpellingPuzzle[]).length).toBeGreaterThanOrEqual(3);
  });
});
