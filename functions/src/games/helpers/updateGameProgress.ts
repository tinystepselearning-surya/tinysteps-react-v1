/**
 * Tiny Steps Games - Game Progress Updater
 * 
 * Updates per-game progress summary in Firestore.
 * Tracks completed levels, last played info, and completion count.
 */

import * as admin from 'firebase-admin';

/**
 * Compute updated completed count from level update.
 * Uses a boolean map (completedLevelsMap) to track which levels are completed.
 * 
 * Strategy: Completion is sticky - once completed, it stays completed.
 * This fits the pedagogical model where progress is cumulative.
 * 
 * @param prevSummary - Previous game progress summary (or empty object)
 * @param levelId - Level identifier
 * @param completed - Whether this level is now completed
 * @returns Updated completed count
 */
export function computeCompletedCountFromLevelUpdate(
  prevSummary: any,
  levelId: number,
  completed: boolean
): { completedCount: number; completedLevelsMap: Record<number, boolean> } {
  // Get existing completed levels map
  const completedLevelsMap: Record<number, boolean> = prevSummary?.completedLevelsMap || {};

  // If completed=true, mark this level as completed (sticky)
  if (completed) {
    completedLevelsMap[levelId] = true;
  }
  // If completed=false, we do NOT remove it (sticky completion)

  // Count total completed levels
  const completedCount = Object.keys(completedLevelsMap).length;

  return { completedCount, completedLevelsMap };
}

/**
 * Update game progress summary within a transaction.
 * 
 * Updates kids/{kidId}/gameProgress/{gameId} with:
 * - lastPlayedAt: current timestamp
 * - updatedAt: current timestamp
 * - lastLevelPlayed: level ID
 * - completedLevelsMap: map of completed level IDs
 * - completedCount: count of completed levels
 * 
 * @param txn - Firestore transaction
 * @param db - Firestore instance
 * @param kidId - Kid identifier
 * @param gameId - Game identifier
 * @param levelId - Level identifier
 * @param completed - Whether level is completed
 * @param nowTs - Current timestamp
 * @returns Completed count and previous completed count (for delta calculation)
 */
export async function updateGameProgressInTxn(
  txn: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  kidId: string,
  gameId: string,
  progressDocId: string | undefined,
  levelId: number,
  completed: boolean,
  nowTs: admin.firestore.Timestamp,
  stars?: number
): Promise<{ completedCount: number; prevCompletedCount: number }> {
  // Use progressDocId if provided, otherwise fallback to gameId
  const docId = progressDocId || gameId;
  const gameProgressRef = db.doc(`kids/${kidId}/gameProgress/${docId}`);

  // Read current summary
  const gameProgressDoc = await txn.get(gameProgressRef);
  const prevSummary = gameProgressDoc.exists ? gameProgressDoc.data() : {};
  const prevCompletedCount = prevSummary?.completedCount || 0;

  // Compute updated completed count
  const { completedCount, completedLevelsMap } = computeCompletedCountFromLevelUpdate(
    prevSummary,
    levelId,
    completed
  );

  // Compute completedLevels array (sorted unique)
  const completedLevels = Object.keys(completedLevelsMap)
    .map(Number)
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  // Update bestStarsByLevel map
  const bestStarsByLevel = prevSummary?.bestStarsByLevel || {};
  if (stars !== undefined && stars > 0) {
    const prevBestStars = bestStarsByLevel[levelId] || 0;
    bestStarsByLevel[levelId] = Math.max(prevBestStars, stars);
  }

  // Update game progress summary
  txn.set(
    gameProgressRef,
    {
      lastPlayedAt: nowTs,
      updatedAt: nowTs,
      lastLevelPlayed: levelId,
      completedLevels,
      completedLevelsMap,
      completedCount,
      bestStarsByLevel,
      version: admin.firestore.FieldValue.increment(1),
    },
    { merge: true }
  );

  return { completedCount, prevCompletedCount };
}
