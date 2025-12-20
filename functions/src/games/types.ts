/**
 * Tiny Steps Games - Backend Types
 * 
 * Type definitions for game level results and validation.
 * These mirror frontend types but are defined independently to avoid coupling.
 */

// ========== Tag Delta ==========

export interface TagDelta {
  attempts: number;
  correct: number;
  wrong: number;
}

// ========== Level Result Payload ==========

export interface LevelResultPayload {
  kidId: string;
  gameId: string;
  progressDocId?: string; // Optional override for gameProgress doc ID (e.g., "phonics_letter_sound")
  levelId: number;
  completed: boolean;
  stars?: number;
  score?: number;
  accuracyPct?: number;
  durationSec?: number;
  tagDeltas: Record<string, TagDelta>;
  evidence?: {
    itemId?: string;
    [key: string]: unknown;
  };
}

// ========== Validation ==========

const MAX_TAG_DELTAS = 50;
const MAX_LEVEL_ID = 1000;
const MAX_DURATION_SEC = 3600; // 1 hour

/**
 * Parse and validate a level result payload.
 * Throws Error if validation fails.
 * 
 * @param data - Raw payload from client
 * @returns Validated LevelResultPayload
 */
export function parseLevelResult(data: any): LevelResultPayload {
  // Required fields
  if (typeof data?.kidId !== 'string' || !data.kidId.trim()) {
    throw new Error('Invalid kidId: must be a non-empty string');
  }

  if (typeof data?.gameId !== 'string' || !data.gameId.trim()) {
    throw new Error('Invalid gameId: must be a non-empty string');
  }

  // progressDocId is optional
  if (data.progressDocId !== undefined && (typeof data.progressDocId !== 'string' || !data.progressDocId.trim())) {
    throw new Error('Invalid progressDocId: must be a non-empty string if provided');
  }

  if (typeof data?.levelId !== 'number' || data.levelId < 1 || data.levelId > MAX_LEVEL_ID) {
    throw new Error(`Invalid levelId: must be a number between 1 and ${MAX_LEVEL_ID}`);
  }

  if (typeof data?.completed !== 'boolean') {
    throw new Error('Invalid completed: must be a boolean');
  }

  // Optional numeric fields
  if (data.stars !== undefined && (typeof data.stars !== 'number' || data.stars < 0)) {
    throw new Error('Invalid stars: must be a non-negative number');
  }

  if (data.score !== undefined && (typeof data.score !== 'number' || data.score < 0)) {
    throw new Error('Invalid score: must be a non-negative number');
  }

  if (data.accuracyPct !== undefined && (typeof data.accuracyPct !== 'number' || data.accuracyPct < 0 || data.accuracyPct > 100)) {
    throw new Error('Invalid accuracyPct: must be a number between 0 and 100');
  }

  if (data.durationSec !== undefined && (typeof data.durationSec !== 'number' || data.durationSec < 0 || data.durationSec > MAX_DURATION_SEC)) {
    throw new Error(`Invalid durationSec: must be a number between 0 and ${MAX_DURATION_SEC}`);
  }

  // Tag deltas validation
  if (!data.tagDeltas || typeof data.tagDeltas !== 'object' || Array.isArray(data.tagDeltas)) {
    throw new Error('Invalid tagDeltas: must be an object');
  }

  const tagKeys = Object.keys(data.tagDeltas);
  if (tagKeys.length > MAX_TAG_DELTAS) {
    throw new Error(`Too many tags: maximum ${MAX_TAG_DELTAS} allowed`);
  }

  const validatedTagDeltas: Record<string, TagDelta> = {};

  for (const tag of tagKeys) {
    const delta = data.tagDeltas[tag];

    if (!delta || typeof delta !== 'object') {
      throw new Error(`Invalid tag delta for '${tag}': must be an object`);
    }

    if (typeof delta.attempts !== 'number' || delta.attempts < 0) {
      throw new Error(`Invalid attempts for tag '${tag}': must be a non-negative number`);
    }

    if (typeof delta.correct !== 'number' || delta.correct < 0) {
      throw new Error(`Invalid correct for tag '${tag}': must be a non-negative number`);
    }

    if (typeof delta.wrong !== 'number' || delta.wrong < 0) {
      throw new Error(`Invalid wrong for tag '${tag}': must be a non-negative number`);
    }

    // Sanity check: correct + wrong should equal attempts
    if (delta.correct + delta.wrong !== delta.attempts) {
      throw new Error(`Invalid tag delta for '${tag}': correct + wrong must equal attempts`);
    }

    validatedTagDeltas[tag] = {
      attempts: delta.attempts,
      correct: delta.correct,
      wrong: delta.wrong,
    };
  }

  return {
    kidId: data.kidId.trim(),
    gameId: data.gameId.trim(),
    progressDocId: data.progressDocId?.trim(),
    levelId: data.levelId,
    completed: data.completed,
    stars: data.stars,
    score: data.score,
    accuracyPct: data.accuracyPct,
    durationSec: data.durationSec,
    tagDeltas: validatedTagDeltas,
    evidence: data.evidence,
  };
}
