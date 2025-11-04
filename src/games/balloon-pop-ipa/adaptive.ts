/**
 * Adaptive Difficulty System for Phase 2
 * Tracks per-phoneme performance and adjusts difficulty
 */

export interface PhonemeStats {
  seen: number;
  correct: number;
  wrong: number;
  streak: number;
}

export interface AdaptiveState {
  phonemeStats: Record<string, PhonemeStats>;
  currentN: number;
  currentSpeed: 'slow' | 'med' | 'fast';
  sessionStreak: number;
}

export function createAdaptiveState(initialN: number, initialSpeed: 'slow' | 'med' | 'fast'): AdaptiveState {
  return {
    phonemeStats: {},
    currentN: initialN,
    currentSpeed: initialSpeed,
    sessionStreak: 0,
  };
}

export function getPhonemeStats(state: AdaptiveState, phoneme: string): PhonemeStats {
  if (!state.phonemeStats[phoneme]) {
    state.phonemeStats[phoneme] = {
      seen: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
    };
  }
  return state.phonemeStats[phoneme];
}

export function updateAdaptive(
  state: AdaptiveState,
  phoneme: string,
  result: 'right' | 'wrong'
): AdaptiveState {
  const stats = getPhonemeStats(state, phoneme);
  
  stats.seen++;
  
  if (result === 'right') {
    stats.correct++;
    stats.streak++;
    state.sessionStreak++;
    
    // On streak of 3+, increase difficulty
    if (stats.streak >= 3) {
      if (state.currentN < 6) {
        state.currentN = Math.min(6, state.currentN + 1);
      }
      if (state.currentSpeed === 'slow' && state.sessionStreak >= 5) {
        state.currentSpeed = 'med';
      }
    }
  } else {
    stats.wrong++;
    stats.streak = 0;
    state.sessionStreak = 0;
    
    // On 2 consecutive wrong, reduce difficulty
    if (stats.wrong >= 2 && stats.streak === 0) {
      state.currentN = 3;
      state.currentSpeed = 'slow';
    }
  }
  
  return state;
}

export function selectDistractors(
  target: string,
  pool: string[],
  count: number,
  options?: { difficulty?: 'easy' | 'hard'; confusables?: Record<string, string[]> }
): string[] {
  const available = pool.filter(g => g !== target);
  
  if (available.length === 0) {
    return [];
  }
  
  const distractors: string[] = [];
  const difficulty = options?.difficulty || 'easy';
  const confusables = options?.confusables || {};
  
  // For hard difficulty, try to include at least one confusable
  if (difficulty === 'hard' && confusables[target]) {
    const confusablePool = confusables[target].filter(c => available.includes(c));
    if (confusablePool.length > 0) {
      const confusable = confusablePool[Math.floor(Math.random() * confusablePool.length)];
      distractors.push(confusable);
    }
  }
  
  // Fill remaining slots with random distractors
  const shuffled = [...available]
    .filter(g => !distractors.includes(g))
    .sort(() => Math.random() - 0.5);
  
  const limit = Math.min(count - distractors.length, shuffled.length);
  
  for (let i = 0; i < limit; i++) {
    distractors.push(shuffled[i]);
  }
  
  return distractors;
}

export function selectWeightedPhoneme(
  graphemes: string[],
  stats: Record<string, PhonemeStats>
): string {
  // Weight by error rate to focus on weaker phonemes
  const weights: Record<string, number> = {};
  
  graphemes.forEach(g => {
    const s = stats[g];
    if (!s || s.seen === 0) {
      weights[g] = 2; // New phonemes get priority
    } else {
      const errorRate = s.wrong / s.seen;
      weights[g] = 1 + errorRate * 3; // Higher weight for more errors
    }
  });
  
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * total;
  
  for (const g of graphemes) {
    rand -= weights[g];
    if (rand <= 0) {
      return g;
    }
  }
  
  return graphemes[0];
}
