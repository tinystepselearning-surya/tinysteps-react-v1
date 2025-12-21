/**
 * Tiny Steps Games Engine - Scaffolding Types
 * 
 * Type definitions for stuck detection and progressive hint scaffolding.
 * Supports event-driven analysis of kid gameplay to trigger adaptive hints.
 */

/**
 * Progressive hint intensity level.
 * - 0: No hint needed (kid is progressing)
 * - 1: Gentle hint (idle detected)
 * - 2: Moderate hint (wrong streak detected)
 * - 3: Strong hint (many attempts without success)
 */
export type HintLevel = 0 | 1 | 2 | 3;

/**
 * Outcome of a single attempt.
 */
export type AttemptOutcome = 'correct' | 'wrong' | 'skipped';

/**
 * Event emitted during gameplay for scaffolding analysis.
 */
export interface ScaffoldingEvent {
  /** Timestamp in epoch milliseconds */
  at: number;
  
  /** Event type */
  type: 'level_start' | 'attempt' | 'hint_shown' | 'level_end';
  
  /** Attempt outcome (only for type === 'attempt') */
  outcome?: AttemptOutcome;
  
  /** Optional game-specific metadata */
  meta?: Record<string, unknown>;
}

/**
 * Configuration for stuck detection behavior.
 */
export interface StuckDetectorConfig {
  /** If no attempt occurs for this duration (ms), consider kid stuck. Default: 15000 */
  idleMs?: number;
  
  /** If consecutive wrong attempts reach this count, consider stuck. Default: 3 */
  wrongStreak?: number;
  
  /** If attempts reach this count without any correct, consider stuck. Default: 5 */
  attemptsWithoutCorrect?: number;
  
  /** Maximum events stored in memory. Default: 50 */
  maxEvents?: number;
}

/**
 * Current state of stuck detection analysis.
 */
export interface StuckDetectorState {
  /** Recent events (trimmed to maxEvents) */
  events: ScaffoldingEvent[];
  
  /** Count of consecutive wrong attempts */
  wrongStreak: number;
  
  /** Count of attempts since last correct answer */
  attemptsSinceLastCorrect: number;
  
  /** Timestamp of last attempt (epoch ms) */
  lastAttemptAt?: number;
  
  /** Timestamp of last correct attempt (epoch ms) */
  lastCorrectAt?: number;
  
  /** Timestamp of last hint shown (epoch ms) */
  lastHintAt?: number;
  
  /** Progressive hint intensity suggestion (0-3) */
  suggestedHintLevel: HintLevel;
  
  /** Whether kid is currently stuck */
  isStuck: boolean;
}

/**
 * Stuck detector interface for event-driven stuck analysis.
 */
export interface StuckDetector {
  /** Add a new event and update stuck state */
  push(event: ScaffoldingEvent): void;
  
  /** Reset detector to initial state */
  reset(): void;
  
  /** Get current stuck detection state */
  getState(): StuckDetectorState;
  
  /** Convenience: check if kid is currently stuck */
  isStuck(): boolean;
}
