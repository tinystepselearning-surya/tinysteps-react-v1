import { describe, expect, it } from 'vitest';
import {
  VISUAL_SPELLING_PUZZLES,
  VISUAL_SPELLING_STAGES,
  shuffleVisualSpellingPuzzles,
  visualSpellingPracticeRound,
  validateVisualSpellingPuzzles,
  visualSpellingAnswer,
  type VisualSpellingPuzzle,
} from '../../lib/visualSpellingPuzzles';

describe('sound-free visual spelling puzzle curriculum', () => {
  it('provides four complete and validated stages', () => {
    expect(validateVisualSpellingPuzzles(VISUAL_SPELLING_PUZZLES)).toEqual([]);
    expect(VISUAL_SPELLING_STAGES).toHaveLength(4);
    expect(VISUAL_SPELLING_PUZZLES).toHaveLength(96);
    expect(new Set(VISUAL_SPELLING_PUZZLES.map(puzzle => puzzle.id)).size).toBe(
      VISUAL_SPELLING_PUZZLES.length
    );
    for (const stage of VISUAL_SPELLING_STAGES) {
      const tasks = VISUAL_SPELLING_PUZZLES.filter(puzzle => puzzle.stage === stage.id);
      expect(tasks).toHaveLength(24);
      expect(new Set(tasks.map(task => task.kind))).toEqual(
        new Set(['arrange', 'correct', 'missing', 'sort'])
      );
    }
  });

  it('introduces each level with an accurate, varied first task', () => {
    const stageIds = ['explorer', 'builder', 'expert', 'master'] as const;
    expect(stageIds.map(id => VISUAL_SPELLING_PUZZLES.find(p => p.stage === id)?.kind))
      .toEqual(['arrange', 'sort', 'missing', 'arrange']);
    const labels = VISUAL_SPELLING_STAGES.map(stage => stage.title);
    expect(labels).toEqual([
      'Everyday Words', 'Patterns & Endings', 'Tricky Spellings', 'Long Word Challenge',
    ]);
    expect(VISUAL_SPELLING_STAGES.every(stage =>
      stage.subtitle.length > 35 && stage.examples.includes(' · ')
    )).toBe(true);
    const international = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'master-international');
    expect(international?.kind).toBe('arrange');
    if (international?.kind === 'arrange') {
      expect(international.tiles).toHaveLength(3);
      expect(international.tiles.join('').split('').sort().join(''))
        .toBe(international.word.split('').sort().join(''));
    }
  });

  it('has answerable word-building, spotting, fill and sorting tasks', () => {
    const journey = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'explorer-journey');
    const friend = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'explorer-friend');
    const definite = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'builder-definitely');
    const advancedPrefix = VISUAL_SPELLING_PUZZLES.find(p => p.id === 'master-misinterpretation');
    expect(journey && visualSpellingAnswer(journey)).toBe('journey');
    expect(friend && visualSpellingAnswer(friend)).toBe('friend');
    expect(definite && visualSpellingAnswer(definite)).toBe('i');
    expect(advancedPrefix && visualSpellingAnswer(advancedPrefix)).toBe('Begins with mis-');
  });


  it('keeps every stage playable without audio, identity or persisted progress', () => {
    const stageIds = new Set(VISUAL_SPELLING_STAGES.map(stage => stage.id));
    expect(VISUAL_SPELLING_PUZZLES.every(p => stageIds.has(p.stage))).toBe(true);
    expect(VISUAL_SPELLING_PUZZLES.every(p =>
      !('audio' in p) &&
      !('kidId' in p) &&
      !('progressStorageKey' in p)
    )).toBe(true);
  });

  it('includes substantial longer-word practice beyond simple recognition', () => {
    const advanced = VISUAL_SPELLING_PUZZLES.filter(
      puzzle => ['expert', 'master'].includes(puzzle.stage)
    );
    expect(advanced.length).toBe(48);
    expect(advanced.some(puzzle => puzzle.word.length >= 15)).toBe(true);
    expect(VISUAL_SPELLING_PUZZLES
      .filter(puzzle => puzzle.stage === 'master')
      .every(puzzle => puzzle.word.length >= 10)).toBe(true);
    expect(new Set(advanced.map(puzzle => puzzle.kind))).toEqual(
      new Set(['arrange', 'correct', 'missing', 'sort'])
    );
  });

  it('shuffles all puzzles without changing their answers or storing a session', () => {
    const original = VISUAL_SPELLING_PUZZLES.filter(p => p.stage === 'explorer');
    const shuffled = shuffleVisualSpellingPuzzles(original, () => 0);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.map(p => p.id)).not.toEqual(original.map(p => p.id));
    expect(new Set(shuffled.map(p => p.id))).toEqual(new Set(original.map(p => p.id)));
    expect(original[0].id).toBe('explorer-journey');
  });

  it('offers all 24 reviewed puzzles in three short, non-overlapping eight-question rounds', () => {
    for (const stage of VISUAL_SPELLING_STAGES) {
      const rounds = [0, 1, 2].map(round => visualSpellingPracticeRound(stage.id, round));
      expect(rounds.every(round => round.length === 8)).toBe(true);
      const seen = rounds.flatMap(round => round.map(puzzle => puzzle.id));
      expect(new Set(seen).size).toBe(24);
      expect(new Set(seen)).toEqual(new Set(
        VISUAL_SPELLING_PUZZLES.filter(puzzle => puzzle.stage === stage.id).map(puzzle => puzzle.id)
      ));
      for (const round of rounds) {
        expect(new Set(round.map(puzzle => puzzle.kind)))
          .toEqual(new Set(['arrange', 'correct', 'missing', 'sort']));
      }
    }
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

    const sort = VISUAL_SPELLING_PUZZLES.find(p => p.kind === 'sort');
    if (sort?.kind === 'sort') {
      expect(validateVisualSpellingPuzzles([{ ...sort, pair: { ...sort.pair, clue: '' } }]))
        .toEqual([sort.id + ': invalid paired sorting categories']);
    }
  });
});
