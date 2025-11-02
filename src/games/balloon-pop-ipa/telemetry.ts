/**
 * Telemetry System for Balloon Pop IPA
 * 
 * Console-based event logging stub. Swap implementation for analytics provider.
 * All calls wrapped in try/catch to ensure gameplay never breaks.
 */

type TelemetryEvent = 
  | 'round_start'
  | 'answer_submitted'
  | 'phase_unlock'
  | 'special_round_injected'
  | 'audio_error'
  | 'error_boundary_triggered';

/**
 * Log a telemetry event with optional properties.
 * Currently logs to console; replace with analytics provider in production.
 */
export const logEvent = (
  name: TelemetryEvent,
  props?: Record<string, unknown>
): void => {
  try {
    const timestamp = new Date().toISOString();
    const eventData = {
      event: name,
      timestamp,
      ...props,
    };

    // Console logging for development
    if (import.meta.env.DEV) {
      console.info('[Telemetry]', JSON.stringify(eventData, null, 2));
    } else {
      // Production: send to analytics service
      // Example: analytics.track(name, eventData);
      console.log('[Telemetry]', name, props);
    }
  } catch (error) {
    // Never let telemetry break the game
    console.warn('[Telemetry] Failed to log event:', name, error);
  }
};

/**
 * Log a round start event
 */
export const logRoundStart = (phase: number, promptType: string): void => {
  logEvent('round_start', { phase, promptType });
};

/**
 * Log an answer submission
 */
export const logAnswerSubmitted = (
  correct: boolean,
  elapsedMs: number,
  promptType: string,
  selectedCount: number
): void => {
  logEvent('answer_submitted', {
    correct,
    elapsedMs,
    promptType,
    selectedCount,
  });
};

/**
 * Log a phase unlock
 */
export const logPhaseUnlock = (newPhase: number): void => {
  logEvent('phase_unlock', { newPhase });
};

/**
 * Log a special round injection
 */
export const logSpecialRoundInjected = (type: 'minimalPair' | 'trickyRhyme'): void => {
  logEvent('special_round_injected', { type });
};

/**
 * Log an audio error
 */
export const logAudioError = (src: string, error: unknown): void => {
  logEvent('audio_error', { src, error: String(error) });
};

/**
 * Log an error boundary trigger
 */
export const logErrorBoundary = (error: Error, errorInfo: unknown): void => {
  logEvent('error_boundary_triggered', {
    error: error.message,
    stack: error.stack,
    errorInfo: String(errorInfo),
  });
};
