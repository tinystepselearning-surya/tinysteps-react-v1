/**
 * Configuration Constants for Balloon Pop IPA
 * 
 * Centralized thresholds and game parameters for easy tuning.
 */

// ========== PHASE UNLOCK THRESHOLDS ==========

export const PHASE_UNLOCK = {
  /** Mastery level required to unlock next phase (0-1) */
  mastery: 0.8,
  /** Minimum correct answers in current phase before unlock */
  minCorrect: 20,
  /** Number of mastered phonemes needed per phase unlock */
  phonemesPerPhase: 5,
};

// ========== SPECIAL ROUNDS ==========

export const MINIMAL_PAIR_BONUS_MS = 2000;

export const SPECIAL_ROUND_INTERVAL: [number, number] = [6, 8];

// ========== CELEBRATION ==========

export const CELEBRATION_DURATION_MS = 2500;

export const CONFETTI_CONFIG = {
  particleCount: 5,
  startVelocity: 25,
  spread: 70,
  gravity: 0.6,
  ticks: 250,
  scalar: 0.9,
  colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'],
};

// ========== ADAPTIVITY ==========

export const ADAPTIVITY = {
  /** Window size for recent performance tracking */
  recentWindow: 10,
  /** Accuracy threshold to level up */
  levelUpThreshold: 0.8,
  /** Accuracy threshold to level down */
  levelDownThreshold: 0.6,
  /** Max level */
  maxLevel: 5,
  /** Min level */
  minLevel: 1,
};

// ========== UI TIMING ==========

export const UI_TIMING = {
  /** Delay before auto-advancing to next round after correct answer */
  autoAdvanceMs: CELEBRATION_DURATION_MS,
  /** Duration to show wrong answer feedback */
  wrongFeedbackMs: 1500,
  /** Stagger delay between SFX sounds */
  sfxStaggerMs: 150,
  /** Delay before auto-playing audio prompt */
  audioAutoPlayDelayMs: 300,
};

// ========== ACCESSIBILITY ==========

export const A11Y = {
  /** Focus ring width in pixels */
  focusRingWidth: 3,
  /** Focus ring offset in pixels */
  focusRingOffset: 2,
  /** Minimum touch target size in pixels */
  minTouchTarget: 44,
};
