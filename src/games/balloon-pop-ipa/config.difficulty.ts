/**
 * Difficulty Configuration for Balloon Pop IPA
 * 
 * Age, phase, and level-based difficulty scaling for:
 * - Balloon rise speed
 * - Number of options
 * - Spawn timing
 */

import type { Phase } from './types';

export type AgeBand = "3-4" | "5-6" | "7-8";

interface PhaseConfig {
  speedSec: [number, number]; // [min, max] seconds for balloon rise
  options: number;             // base number of balloon options
  spawnGapMs: number;          // gap between spawning balloons (if staggered)
}

interface AgeAdjustment {
  speedFactor: number;   // multiply speed (>1 = slower, <1 = faster)
  optionsDelta: number;  // add/subtract options
}

interface LevelAdjustment {
  speedFactor: number;
  optionsDelta: number;
}

export const DIFFICULTY = {
  /**
   * Base difficulty per phase
   * P1: Slowest, fewest options (intro)
   * P6: Fastest, most options (mastery)
   */
  base: {
    1: { speedSec: [9, 12], options: 3, spawnGapMs: 900 } as PhaseConfig,
    2: { speedSec: [8, 11], options: 4, spawnGapMs: 850 } as PhaseConfig,
    3: { speedSec: [7, 10], options: 5, spawnGapMs: 800 } as PhaseConfig,
    4: { speedSec: [7, 10], options: 5, spawnGapMs: 780 } as PhaseConfig,
    5: { speedSec: [6, 9], options: 6, spawnGapMs: 760 } as PhaseConfig,
    6: { speedSec: [6, 9], options: 6, spawnGapMs: 740 } as PhaseConfig,
  } as Record<Phase, PhaseConfig>,

  /**
   * Age-based adjustments
   * 3-4: Slower speeds, fewer options (younger learners)
   * 5-6: Baseline (default)
   * 7-8: Slightly faster (older learners)
   */
  ageAdjust: {
    "3-4": { speedFactor: 1.15, optionsDelta: -1 } as AgeAdjustment,
    "5-6": { speedFactor: 1.00, optionsDelta: 0 } as AgeAdjustment,
    "7-8": { speedFactor: 0.95, optionsDelta: 0 } as AgeAdjustment,
  } as Record<AgeBand, AgeAdjustment>,

  /**
   * Level-based adjustments within a phase
   * Lower levels: slightly slower
   * Higher levels: slightly faster + more options
   */
  levelAdjust(level: number): LevelAdjustment {
    const speedFactor = level <= 2 ? 1.08 : level >= 5 ? 0.92 : 1.0;
    const optionsDelta = level >= 4 ? 1 : 0;
    return { speedFactor, optionsDelta };
  },

  /**
   * Show hint glow after this many wrong attempts
   */
  glowAfterWrongAttempts: 2,
};

/**
 * Compute final difficulty parameters
 */
export function computeDifficulty(
  phase: Phase,
  ageBand: AgeBand,
  level: number
): {
  speedRange: [number, number];
  optionCount: number;
  spawnGapMs: number;
} {
  const base = DIFFICULTY.base[phase];
  const age = DIFFICULTY.ageAdjust[ageBand];
  const lvl = DIFFICULTY.levelAdjust(level);

  // Apply all factors to speed
  const speedMin = base.speedSec[0] * age.speedFactor * lvl.speedFactor;
  const speedMax = base.speedSec[1] * age.speedFactor * lvl.speedFactor;

  // Apply deltas to options, clamp to reasonable bounds
  const optionCount = Math.max(
    3,
    Math.min(7, base.options + age.optionsDelta + lvl.optionsDelta)
  );

  return {
    speedRange: [speedMin, speedMax],
    optionCount,
    spawnGapMs: base.spawnGapMs,
  };
}

/**
 * Get random rise speed within difficulty range
 */
export function getRandomRiseSpeed(speedRange: [number, number]): number {
  const [min, max] = speedRange;
  return min + Math.random() * (max - min);
}
