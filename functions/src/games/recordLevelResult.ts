/**
 * Tiny Steps Games - Record Level Result
 * 
 * Cloud Function to record game level completion results.
 * Updates multiple aggregation levels: level, game, topic, overall, and skill stats.
 * 
 * Security: Authenticated users only. Caller must be:
 * - The kid themselves (uid === kidId)
 * - A parent with this kid in their parentIds array
 * - An admin user
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { parseLevelResult } from './types';
import { applyTagStats } from './helpers/applyTagStats';

if (!admin.apps.length) admin.initializeApp();

/**
 * Verify caller has permission to write to this kid's data.
 * 
 * Allowed if:
 * - Caller uid === kidId (kid themselves)
 * - Caller is a parent of this kid (kidId in their parentIds)
 * - Caller is an admin
 * 
 * @param db - Firestore instance
 * @param callerUid - Authenticated user ID
 * @param kidId - Target kid ID
 * @returns true if authorized, throws HttpsError otherwise
 */
async function verifyKidAccess(
  db: admin.firestore.Firestore,
  callerUid: string,
  kidId: string
): Promise<void> {
  // Check 1: Caller is the kid
  if (callerUid === kidId) {
    return;
  }

  // Check 2: Caller is admin
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole === 'admin') {
    return;
  }

  // Check 3: Caller is parent of this kid
  const kidDoc = await db.collection('kids').doc(kidId).get();
  
  if (!kidDoc.exists) {
    throw new HttpsError('not-found', `Kid ${kidId} not found`);
  }

  const parentIds = kidDoc.data()?.parentIds || [];

  if (Array.isArray(parentIds) && parentIds.includes(callerUid)) {
    return;
  }

  // No access
  logger.warn(`[recordLevelResult] Unauthorized access attempt by ${callerUid} for kid ${kidId}`);
  throw new HttpsError(
    'permission-denied',
    'You do not have permission to record results for this kid'
  );
}

/**
 * Record Level Result Callable Function
 * 
 * Accepts a level completion result and updates:
 * 1. Level state doc (overwrite with latest)
 * 2. Game progress summary (completed count, last played)
 * 3. Kid summary (game/topic/overall progress)
 * 4. Skill stats (per-tag counters)
 */
export const recordLevelResult = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 60,
  },
  async (request) => {
    // 1. Authentication check
    const uid = request.auth?.uid;
    if (!uid) {
      logger.warn('[recordLevelResult] Unauthenticated call attempt');
      throw new HttpsError('unauthenticated', 'You must be logged in');
    }

    // 2. Parse and validate payload
    let payload;
    try {
      payload = parseLevelResult(request.data);
    } catch (error: any) {
      logger.warn('[recordLevelResult] Invalid payload:', error.message);
      throw new HttpsError('invalid-argument', error.message);
    }

    const { kidId, gameId, progressDocId, levelId, completed, stars, score, accuracyPct, durationSec, tagDeltas } = payload;

    logger.info('[recordLevelResult] Start', { uid, kidId, gameId, progressDocId, levelId, completed });

    // 3. Authorization check
    const db = admin.firestore();
    await verifyKidAccess(db, uid, kidId);

    logger.info('[recordLevelResult] Authorized', { uid, kidId });

    // 4. Current timestamp
    const nowTs = admin.firestore.Timestamp.now();

    // 5. Transaction: Update level, game progress, and kid summary
    let completedCount = 0;
    let tagsUpdated = 0;

    try {
      // Run transaction for consistent updates
      await db.runTransaction(async (txn) => {
        const docId = progressDocId || gameId;
        
        // ===== PHASE 1: ALL READS FIRST =====
        // Read all docs before any writes (Firestore requirement)
        
        const levelRef = db.doc(`kids/${kidId}/gameProgress/${docId}/levels/${levelId}`);
        const gameProgressRef = db.doc(`kids/${kidId}/gameProgress/${docId}`);
        const kidRef = db.doc(`kids/${kidId}`);
        
        const [prevLevelDoc, gameProgressDoc, kidDoc] = await Promise.all([
          txn.get(levelRef),
          txn.get(gameProgressRef),
          txn.get(kidRef),
        ]);
        
        logger.info('[recordLevelResult] Transaction reads complete', {
          levelExists: prevLevelDoc.exists,
          progressExists: gameProgressDoc.exists,
          kidExists: kidDoc.exists,
        });
        
        // ===== PHASE 2: COMPUTE UPDATES IN MEMORY =====
        
        // 5a. Compute level state
        const prevBestStars = prevLevelDoc.exists ? prevLevelDoc.data()?.bestStars || 0 : 0;
        const newBestStars = Math.max(prevBestStars, stars || 0);
        
        const levelUpdate = {
          completed,
          stars,
          score,
          accuracyPct,
          durationSec,
          lastPlayedAt: nowTs,
          bestStars: newBestStars,
        };
        
        // 5b. Compute game progress update (inline logic from helper)
        const prevSummary = gameProgressDoc.exists ? gameProgressDoc.data() : {};
        
        const completedLevelsMap: Record<number, boolean> = prevSummary?.completedLevelsMap || {};
        if (completed) {
          completedLevelsMap[levelId] = true;
        }
        
        const newCompletedCount = Object.keys(completedLevelsMap).length;
        completedCount = newCompletedCount;
        
        const completedLevels = Object.keys(completedLevelsMap)
          .map(Number)
          .filter(n => !isNaN(n))
          .sort((a, b) => a - b);
        
        const bestStarsByLevel = prevSummary?.bestStarsByLevel || {};
        if (stars !== undefined && stars > 0) {
          const prevBestStarsForLevel = bestStarsByLevel[levelId] || 0;
          bestStarsByLevel[levelId] = Math.max(prevBestStarsForLevel, stars);
        }
        
        const gameProgressUpdate = {
          lastPlayedAt: nowTs,
          updatedAt: nowTs,
          lastLevelPlayed: levelId,
          completedLevels,
          completedLevelsMap,
          completedCount: newCompletedCount,
          bestStarsByLevel,
          version: admin.firestore.FieldValue.increment(1),
        };
        
        // 5c. Compute kid summary update
        const existingSummary = (kidDoc.data()?.summary || {}) as any;
        
        const totalSessions = (existingSummary.totalSessions || 0) + 1;
        const accValue = (accuracyPct !== undefined ? accuracyPct / 100 : 0);
        const last10Acc = [accValue, ...(existingSummary.last10Acc || [])].slice(0, 10);
        const avgAccuracy10 = last10Acc.reduce((sum: number, acc: number) => sum + acc, 0) / last10Acc.length;
        
        const games = existingSummary.games || {};
        const gameStats = games[gameId] || { plays: 0, bestAccuracy: 0, lastPlayedAt: nowTs };
        
        gameStats.plays += 1;
        gameStats.bestAccuracy = Math.max(gameStats.bestAccuracy, accValue);
        gameStats.lastPlayedAt = nowTs;
        
        games[gameId] = gameStats;
        
        const updatedSummary = {
          ...existingSummary,
          totalSessions,
          lastPlayedAt: nowTs,
          lastGameId: gameId,
          last10Acc,
          avgAccuracy10: Math.round(avgAccuracy10 * 100) / 100,
          games,
        };
        
        logger.info('[recordLevelResult] Transaction prepared', {
          writes: {
            level: levelRef.path,
            gameProgress: gameProgressRef.path,
            kidSummary: kidRef.path,
          },
          completedCount: newCompletedCount,
        });
        
        // ===== PHASE 3: ALL WRITES LAST =====
        // Perform all writes after all reads
        
        txn.set(levelRef, levelUpdate, { merge: true });
        txn.set(gameProgressRef, gameProgressUpdate, { merge: true });
        txn.update(kidRef, { summary: updatedSummary });
      });

      logger.info('[recordLevelResult] Transaction committed successfully', { kidId, completedCount });

      // 6. Update skill stats (outside transaction - monotonic increments)
      tagsUpdated = await applyTagStats(db, kidId, tagDeltas, nowTs);

      // 7. Log success (concise commit log)
      logger.info(`[recordLevelResult] committed { kidId: ${kidId}, gameId: ${gameId}, progressDocId: ${progressDocId || gameId}, levelId: ${levelId}, completedLevelsCount: ${completedCount}, tagsUpdated: ${tagsUpdated} }`);

      // 8. Return rich response object
      return {
        success: true,
        progressDocId: progressDocId || gameId,
        completedLevelsCount: completedCount,
        tagsUpdated,
        summaryUpdated: true,
      };
    } catch (error: any) {
      logger.error('[recordLevelResult] Transaction failed', {
        kidId,
        gameId,
        progressDocId,
        levelId,
        error: error.message,
        code: error.code,
      });

      throw new HttpsError('internal', 'Failed to record level result: ' + error.message);
    }
  }
);
