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

    const response = await callable(result);

    const data = response.data as RecordLevelResultResponse;

    if (!data?.success) {
      throw new Error('Failed to record level result');
    }

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
