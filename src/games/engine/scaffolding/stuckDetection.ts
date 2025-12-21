/**
 * Tiny Steps Games Engine - Stuck Detection
 * 
 * Event-driven stuck detection for adaptive scaffolding.
 * Analyzes gameplay events to determine when a kid needs help.
 */

import type {
  HintLevel,
  ScaffoldingEvent,
  StuckDetectorConfig,
  StuckDetectorState,
  StuckDetector,
} from './types';

// Default configuration values
const DEFAULT_IDLE_MS = 15000;
const DEFAULT_WRONG_STREAK = 3;
const DEFAULT_ATTEMPTS_WITHOUT_CORRECT = 5;
const DEFAULT_MAX_EVENTS = 50;

/**
 * Create a new stuck detector instance.
 * 
 * The detector maintains an internal event history and computes stuck state
 * based on idle time, wrong streaks, and attempts without success.
 * 
 * @param config - Optional configuration overrides
 * @returns StuckDetector instance
 * 
 * @example
 * ```ts
 * const detector = createStuckDetector({ wrongStreak: 2, idleMs: 10000 });
 * detector.push({ at: Date.now(), type: 'level_start' });
 * detector.push({ at: Date.now(), type: 'attempt', outcome: 'wrong' });
 * if (detector.isStuck()) {
 *   const state = detector.getState();
 *   console.log('Hint level:', state.suggestedHintLevel);
 * }
 * ```
 */
export function createStuckDetector(config?: StuckDetectorConfig): StuckDetector {
  const mergedConfig: Required<StuckDetectorConfig> = {
    idleMs: config?.idleMs ?? DEFAULT_IDLE_MS,
    wrongStreak: config?.wrongStreak ?? DEFAULT_WRONG_STREAK,
    attemptsWithoutCorrect: config?.attemptsWithoutCorrect ?? DEFAULT_ATTEMPTS_WITHOUT_CORRECT,
    maxEvents: config?.maxEvents ?? DEFAULT_MAX_EVENTS,
  };

  let events: ScaffoldingEvent[] = [];

  return {
    push(event: ScaffoldingEvent): void {
      // Validate event shape (defensive)
      if (!event || typeof event.at !== 'number' || !event.type) {
        console.warn('[StuckDetector] Invalid event ignored:', event);
        return;
      }

      // Add event to history
      events.push(event);

      // Trim to maxEvents (keep most recent)
      if (events.length > mergedConfig.maxEvents) {
        events = events.slice(-mergedConfig.maxEvents);
      }
    },

    reset(): void {
      events = [];
    },

    getState(): StuckDetectorState {
      return computeStuckState(events, Date.now(), mergedConfig);
    },

    isStuck(): boolean {
      return computeStuckState(events, Date.now(), mergedConfig).isStuck;
    },
  };
}

/**
 * Compute stuck detection state from event history.
 * 
 * Pure function that analyzes events to determine:
 * - Whether kid is stuck
 * - Suggested hint level (0-3)
 * - Wrong streak and attempts since last correct
 * 
 * Stuck conditions (OR logic):
 * 1. Idle: No attempt for >= idleMs (after at least 1 attempt)
 * 2. Wrong streak: >= wrongStreak consecutive wrong attempts
 * 3. Many attempts: >= attemptsWithoutCorrect attempts without correct
 * 
 * Hint levels:
 * - 0: Not stuck
 * - 1: Stuck by idle (gentle hint)
 * - 2: Stuck by wrong streak (moderate hint)
 * - 3: Stuck by many attempts (strong hint)
 * 
 * @param events - Event history
 * @param nowMs - Current timestamp (epoch ms)
 * @param config - Detector configuration
 * @returns Stuck detection state
 */
export function computeStuckState(
  events: ScaffoldingEvent[],
  nowMs: number,
  config?: StuckDetectorConfig
): StuckDetectorState {
  const cfg: Required<StuckDetectorConfig> = {
    idleMs: config?.idleMs ?? DEFAULT_IDLE_MS,
    wrongStreak: config?.wrongStreak ?? DEFAULT_WRONG_STREAK,
    attemptsWithoutCorrect: config?.attemptsWithoutCorrect ?? DEFAULT_ATTEMPTS_WITHOUT_CORRECT,
    maxEvents: config?.maxEvents ?? DEFAULT_MAX_EVENTS,
  };

  // Initialize state
  let wrongStreak = 0;
  let attemptsSinceLastCorrect = 0;
  let lastAttemptAt: number | undefined;
  let lastCorrectAt: number | undefined;
  let lastHintAt: number | undefined;

  // Process events in chronological order
  for (const event of events) {
    if (event.type === 'attempt' && event.outcome) {
      lastAttemptAt = event.at;

      if (event.outcome === 'correct') {
        lastCorrectAt = event.at;
        wrongStreak = 0;
        attemptsSinceLastCorrect = 0;
      } else if (event.outcome === 'wrong') {
        wrongStreak++;
        attemptsSinceLastCorrect++;
      }
      // 'skipped' doesn't affect streaks
    } else if (event.type === 'hint_shown') {
      lastHintAt = event.at;
    } else if (event.type === 'level_start') {
      // Reset streaks on new level
      wrongStreak = 0;
      attemptsSinceLastCorrect = 0;
    }
  }

  // Determine stuck conditions
  const hasAttempted = lastAttemptAt !== undefined;
  const idleStuck = hasAttempted && lastAttemptAt !== undefined && (nowMs - lastAttemptAt >= cfg.idleMs);
  const wrongStreakStuck = wrongStreak >= cfg.wrongStreak;
  const manyAttemptsStuck = attemptsSinceLastCorrect >= cfg.attemptsWithoutCorrect;

  const isStuck = idleStuck || wrongStreakStuck || manyAttemptsStuck;

  // Determine hint level (highest severity wins)
  let suggestedHintLevel: HintLevel = 0;
  if (isStuck) {
    if (manyAttemptsStuck) {
      suggestedHintLevel = 3; // Strong hint
    } else if (wrongStreakStuck) {
      suggestedHintLevel = 2; // Moderate hint
    } else if (idleStuck) {
      suggestedHintLevel = 1; // Gentle hint
    }
  }

  return {
    events: [...events], // Defensive copy
    wrongStreak,
    attemptsSinceLastCorrect,
    lastAttemptAt,
    lastCorrectAt,
    lastHintAt,
    suggestedHintLevel,
    isStuck,
  };
}
