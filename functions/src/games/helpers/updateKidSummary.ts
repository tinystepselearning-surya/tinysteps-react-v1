/**
 * Tiny Steps Games - Kid Summary Updater
 * 
 * Updates kid's overall learning summary with game/topic progress.
 * Maintains aggregated progress metrics at game, topic, and overall levels.
 */

import * as admin from 'firebase-admin';

interface GamesCatalogDoc {
  version?: number;
  categories?: Record<string, any>;
  games?: Record<string, {
    title: string;
    category: string;
    totalLevels: number;
    active: boolean;
    order: number;
  }>;
}

/**
 * Update kid summary with game progress within a transaction.
 * 
 * Maintains three levels of aggregation in kids/{kidId}.summary:
 * 1. progressByGame[gameId] - per-game completion stats
 * 2. progressByTopic[topicId] - per-topic aggregated stats
 * 3. overall - overall completion stats
 * 
 * Uses delta-based updates to avoid scanning all games:
 * - Computes delta from previous completed count
 * - Incrementally updates topic and overall totals
 * 
 * @param txn - Firestore transaction
 * @param db - Firestore instance
 * @param kidId - Kid identifier
 * @param catalog - Games catalog document
 * @param gameId - Game identifier
 * @param completedCount - New completed count for this game
 * @param prevCompletedCount - Previous completed count
 * @param nowTs - Current timestamp
 */
export async function updateKidSummaryInTxn(
  txn: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  kidId: string,
  catalog: GamesCatalogDoc | null,
  gameId: string,
  completedCount: number,
  prevCompletedCount: number,
  nowTs: admin.firestore.Timestamp
): Promise<void> {
  const kidRef = db.doc(`kids/${kidId}`);

  // Read current kid doc
  const kidDoc = await txn.get(kidRef);
  const currentSummary = kidDoc.exists ? kidDoc.data()?.summary || {} : {};

  // Get game config from catalog
  const gameConfig = catalog?.games?.[gameId];
  
  if (!gameConfig) {
    // Game not in catalog - just update timestamp
    console.warn(`[updateKidSummary] Game ${gameId} not found in catalog`);
    txn.set(
      kidRef,
      {
        summary: {
          lastUpdatedAt: nowTs,
          lastGamePlayed: gameId,
        },
      },
      { merge: true }
    );
    return;
  }

  const topicId = gameConfig.category;
  const totalLevels = gameConfig.totalLevels;

  // Calculate delta
  const deltaCompleted = completedCount - prevCompletedCount;

  // Initialize nested objects if missing
  const progressByGame = currentSummary.progressByGame || {};
  const progressByTopic = currentSummary.progressByTopic || {};
  const overall = currentSummary.overall || { completedLevels: 0, totalLevels: 0 };

  // Check if this is the first time we're seeing this game
  const isFirstTimeSeeingGame = !progressByGame[gameId];

  // Update progressByGame
  progressByGame[gameId] = {
    completedCount,
    totalLevels,
    pct: totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0,
    lastPlayedAt: nowTs,
  };

  // Update progressByTopic
  if (!progressByTopic[topicId]) {
    progressByTopic[topicId] = {
      completedLevels: 0,
      totalLevels: 0,
    };
  }

  // Add delta to topic
  progressByTopic[topicId].completedLevels += deltaCompleted;

  // If first time seeing game, add its total levels to topic total
  if (isFirstTimeSeeingGame) {
    progressByTopic[topicId].totalLevels += totalLevels;
  }

  // Calculate topic percentage
  progressByTopic[topicId].pct = progressByTopic[topicId].totalLevels > 0
    ? Math.round((progressByTopic[topicId].completedLevels / progressByTopic[topicId].totalLevels) * 100)
    : 0;

  // Update overall
  overall.completedLevels += deltaCompleted;

  // If first time seeing game, add its total levels to overall total
  if (isFirstTimeSeeingGame) {
    overall.totalLevels += totalLevels;
  }

  // Calculate overall percentage
  overall.pct = overall.totalLevels > 0
    ? Math.round((overall.completedLevels / overall.totalLevels) * 100)
    : 0;

  // Write updated summary
  txn.set(
    kidRef,
    {
      summary: {
        progressByGame,
        progressByTopic,
        overall,
        lastUpdatedAt: nowTs,
        lastGamePlayed: gameId,
      },
    },
    { merge: true }
  );
}
