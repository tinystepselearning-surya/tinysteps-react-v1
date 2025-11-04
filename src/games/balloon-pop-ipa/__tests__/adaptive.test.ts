/**
 * Tests for adaptive difficulty system
 */

import { describe, it, expect } from 'vitest';
import {
  createAdaptiveState,
  updateAdaptive,
  selectDistractors,
  selectWeightedPhoneme,
} from '../adaptive';

describe('createAdaptiveState', () => {
  it('should create initial state with defaults', () => {
    const state = createAdaptiveState(3, 'slow');

    expect(state.currentN).toBe(3);
    expect(state.currentSpeed).toBe('slow');
    expect(state.phonemeStats).toEqual({});
  });

  it('should respect custom parameters', () => {
    const state = createAdaptiveState(5, 'fast');

    expect(state.currentN).toBe(5);
    expect(state.currentSpeed).toBe('fast');
  });
});

describe('updateAdaptive', () => {
  it('should track correct answer and increase streak', () => {
    const initial = createAdaptiveState(3, 'slow');
    const updated = updateAdaptive(initial, 's', 'right');

    expect(updated.phonemeStats.s).toEqual({
      seen: 1,
      correct: 1,
      wrong: 0,
      streak: 1,
    });
  });

  it('should track wrong answer and reset streak', () => {
    const initial = createAdaptiveState(3, 'slow');
    const afterRight = updateAdaptive(initial, 's', 'right');
    const afterWrong = updateAdaptive(afterRight, 's', 'wrong');

    expect(afterWrong.phonemeStats.s).toEqual({
      seen: 2,
      correct: 1,
      wrong: 1,
      streak: 0,
    });
  });

  it('should reduce difficulty after 2 wrong on same phoneme', () => {
    const initial = createAdaptiveState(4, 'med');
    const after1Wrong = updateAdaptive(initial, 's', 'wrong');
    const after2Wrong = updateAdaptive(after1Wrong, 's', 'wrong');

    expect(after2Wrong.currentN).toBe(3);
    expect(after2Wrong.currentSpeed).toBe('slow');
  });

  it('should increase n after streak of 3 on same phoneme', () => {
    let state = createAdaptiveState(3, 'slow');
    
    // Build streak of 3 on same phoneme
    state = updateAdaptive(state, 's', 'right');
    state = updateAdaptive(state, 's', 'right');
    state = updateAdaptive(state, 's', 'right');

    expect(state.currentN).toBe(4);
  });

  it('should not increase n beyond 6', () => {
    let state = createAdaptiveState(6, 'fast');
    
    // Try to increase
    state = updateAdaptive(state, 's', 'right');
    state = updateAdaptive(state, 'a', 'right');
    state = updateAdaptive(state, 't', 'right');

    expect(state.currentN).toBe(6); // Capped at 6
  });

  it('should not decrease n below 3', () => {
    let state = createAdaptiveState(3, 'slow');
    
    // Try to decrease
    state = updateAdaptive(state, 's', 'wrong');
    state = updateAdaptive(state, 'a', 'wrong');

    expect(state.currentN).toBe(3); // Capped at 3
  });
});

describe('selectDistractors', () => {
  const pool = ['s', 'a', 't', 'p', 'i', 'n'];

  it('should select correct number of distractors', () => {
    const distractors = selectDistractors('s', pool, 2);
    expect(distractors.length).toBe(2);
  });

  it('should not include target in distractors', () => {
    const distractors = selectDistractors('s', pool, 3);
    expect(distractors).not.toContain('s');
  });

  it('should not have duplicates', () => {
    const distractors = selectDistractors('s', pool, 3);
    const unique = [...new Set(distractors)];
    expect(distractors.length).toBe(unique.length);
  });

  it('should select all available when count exceeds pool size', () => {
    const smallPool = ['a', 't'];
    const distractors = selectDistractors('s', smallPool, 5);
    
    // Should get at most pool.length items
    expect(distractors.length).toBeLessThanOrEqual(smallPool.length);
  });

  it('should only select from available graphemes', () => {
    const distractors = selectDistractors('s', pool, 3);
    
    distractors.forEach((d) => {
      expect(pool).toContain(d);
    });
  });

  it('should include confusable when difficulty is hard', () => {
    const confusables = {
      sh: ['s', 'ch'],
      ch: ['sh', 't'],
    };
    const extendedPool = ['sh', 's', 'ch', 't', 'p', 'a'];

    const distractors = selectDistractors('sh', extendedPool, 2, {
      difficulty: 'hard',
      confusables,
    });

    // Should include at least one confusable (s or ch)
    const hasConfusable = distractors.some(d => ['s', 'ch'].includes(d));
    expect(hasConfusable).toBe(true);
  });

  it('should not require confusable when difficulty is easy', () => {
    const confusables = {
      sh: ['s', 'ch'],
    };
    const extendedPool = ['sh', 't', 'p', 'a', 'n'];

    const distractors = selectDistractors('sh', extendedPool, 2, {
      difficulty: 'easy',
      confusables,
    });

    // Should select random distractors (not necessarily confusables)
    expect(distractors.length).toBe(2);
    distractors.forEach(d => {
      expect(extendedPool).toContain(d);
      expect(d).not.toBe('sh');
    });
  });

  it('should handle confusables not in pool gracefully', () => {
    const confusables = {
      sh: ['s', 'ch'], // Neither s nor ch in pool
    };
    const limitedPool = ['sh', 't', 'p', 'a'];

    const distractors = selectDistractors('sh', limitedPool, 2, {
      difficulty: 'hard',
      confusables,
    });

    // Should still return 2 distractors from available pool
    expect(distractors.length).toBe(2);
    expect(distractors).not.toContain('sh');
  });
});

describe('selectWeightedPhoneme', () => {
  const graphemes = ['s', 'a', 't'];

  it('should select from available graphemes', () => {
    const stats = {};
    const selected = selectWeightedPhoneme(graphemes, stats);
    
    expect(graphemes).toContain(selected);
  });

  it('should handle empty stats (random selection)', () => {
    const selected = selectWeightedPhoneme(graphemes, {});
    
    expect(graphemes).toContain(selected);
  });

  it('should weight towards phonemes with more errors', () => {
    const stats = {
      s: { seen: 10, correct: 5, wrong: 5, streak: 0 }, // 50% error rate
      a: { seen: 10, correct: 10, wrong: 0, streak: 10 }, // 0% error rate
      t: { seen: 10, correct: 8, wrong: 2, streak: 2 }, // 20% error rate
    };

    // Run multiple times to check distribution
    const results: Record<string, number> = { s: 0, a: 0, t: 0 };
    
    for (let i = 0; i < 100; i++) {
      const selected = selectWeightedPhoneme(graphemes, stats);
      results[selected]++;
    }

    // 's' should be selected most often (highest error rate)
    expect(results.s).toBeGreaterThan(results.a);
    expect(results.s).toBeGreaterThan(results.t);
  });

  it('should fallback to random if weights are all zero', () => {
    const stats = {
      s: { seen: 0, correct: 0, wrong: 0, streak: 0 },
      a: { seen: 0, correct: 0, wrong: 0, streak: 0 },
      t: { seen: 0, correct: 0, wrong: 0, streak: 0 },
    };

    const selected = selectWeightedPhoneme(graphemes, stats);
    expect(graphemes).toContain(selected);
  });
});
