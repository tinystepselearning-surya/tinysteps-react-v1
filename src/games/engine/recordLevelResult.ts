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
 * Record a level result by calling the backend Cloud Function.
 * 
 * @param result - Complete level result data
 * @throws Error if Cloud Function is not deployed or fails
 */
export async function recordLevelResult(result: LevelResult): Promise<void> {
  try {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('../../lib/firebaseConfig'),
    ]);

    const callable = httpsCallable<LevelResult, { success: boolean; message?: string }>(
      functions,
      'recordLevelResult'
    );

    const response = await callable(result);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record level result');
    }

    console.log('[recordLevelResult] Level result recorded successfully:', {
      gameId: result.gameId,
      levelId: result.levelId,
      completed: result.completed,
    });
  } catch (error: any) {
    // Provide helpful error messages for common issues
    if (error.code === 'functions/not-found') {
      throw new Error(
        'Cloud Function "recordLevelResult" not deployed. ' +
        'Please deploy backend functions before using game recording.'
      );
    }

    console.error('[recordLevelResult] Failed to record level result:', error);
    throw error;
  }
}
