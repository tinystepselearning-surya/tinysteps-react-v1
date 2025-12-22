/**
 * Tiny Steps Games Engine - Record Level Result
 *
 * Client-side wrapper for submitting level completion results.
 * Calls a Cloud Function (recordLevelResult) via Firebase Functions.
 *
 * This keeps the client code clean and delegates validation/writes to the backend.
 */

import type { LevelResult } from './types';

/**
 * Catalog patch status
 */
export interface CatalogStatus {
  cached: boolean;
  checked: boolean;
  patched: boolean;
  patchedPaths?: string[];
  reason?: string;
}

/**
 * Response from recordLevelResult Cloud Function
 */
export interface RecordLevelResultResponse {
  success: boolean;
  progressDocId: string;
  completedLevelsCount: number;
  tagsUpdated: number;
  summaryUpdated: boolean;
  catalogStatus: CatalogStatus;
}

/**
 * Record a level result by calling the backend Cloud Function.
 *
 * @param result - Complete level result data
 * @returns Response object with progress details
 * @throws Error if Cloud Function is not deployed or fails
 */
export async function recordLevelResult(result: LevelResult): Promise<RecordLevelResultResponse> {
  try {
    const [{ httpsCallable, getFunctions }, firebase] = await Promise.all([
      import('firebase/functions'),
      import('../../lib/firebaseConfig'),
    ]);

    // IMPORTANT: ensure region matches your deployed functions
    // firebaseConfig should export `app`. If it doesn't, export it there and use it here.
    const functions = getFunctions(firebase.app, 'asia-south1');

    const callable = httpsCallable(functions, 'recordLevelResult');

    // Generate or retrieve eventId for idempotency
    const storageKey = `ts:eventId:${result.kidId}:${result.gameId}:${result.levelId}`;
    let eventId = (result as any).eventId;
    if (!eventId) {
      eventId = sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
      sessionStorage.setItem(storageKey, eventId);
    }

    // Add required fields for backend validation
    const payload = {
      ...result,
      schemaVersion: 1 as const,
      eventId,
      progressDocId: result.progressDocId || result.gameId,
      accuracy: result.accuracyPct ?? 0,
      attempts: Object.values(result.tagDeltas).reduce((sum, td) => sum + td.attempts, 0),
      correct: Object.values(result.tagDeltas).reduce((sum, td) => sum + td.correct, 0),
      wrong: Object.values(result.tagDeltas).reduce((sum, td) => sum + td.wrong, 0),
      timeSpentSec: result.durationSec ?? 0,
      pointsEarned: result.score ?? 0,
      skillResults: Object.entries(result.tagDeltas).map(([tag, delta]) => ({
        tag,
        attempts: delta.attempts,
        correct: delta.correct,
        wrong: delta.wrong,
      })),
    };

    console.debug('[recordLevelResult] sending', {
      kidId: result.kidId,
      gameId: result.gameId,
      levelId: result.levelId,
      eventId,
      schemaVersion: 1,
    });

    const response = await callable(payload);

    const data = response.data as RecordLevelResultResponse;

    if (!data?.success) {
      throw new Error('Failed to record level result');
    }

    // Clear eventId on success (idempotency complete)
    sessionStorage.removeItem(storageKey);

    console.log('[recordLevelResult] Level result recorded successfully:', {
      gameId: result.gameId,
      levelId: result.levelId,
      completed: result.completed,
      progressDocId: data.progressDocId,
      completedLevelsCount: data.completedLevelsCount,
      tagsUpdated: data.tagsUpdated,
      catalogStatus: data.catalogStatus,
    });

    return data;
  } catch (error: any) {
    // Provide helpful error messages for common issues
    if (error?.code === 'functions/not-found') {
      throw new Error(
        'Cloud Function "recordLevelResult" not found in asia-south1. ' +
          'Please deploy backend functions (asia-south1) before using game recording.'
      );
    }

    console.error('[recordLevelResult] Failed to record level result:', error);
    throw error;
  }
}
