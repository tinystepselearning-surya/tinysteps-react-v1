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
import { ensureGamesCatalogPatched } from './helpers/ensureGamesCatalog';

if (!admin.apps.length) admin.initializeApp();

/**
 * Helper: Remove keys with undefined values to prevent Firestore validation errors.
 * Firestore rejects documents containing undefined values.
 */
const omitUndefined = <T extends Record<string, any>>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

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

    // 4. Ensure games catalog is patched (once per instance)
    const catalogStatus = await ensureGamesCatalogPatched(db);
    
    logger.info('[recordLevelResult] Catalog status', { 
      ensureGamesCatalog: catalogStatus 
    });

    // 5. Read catalog for progress summary (category + totalLevels)
    let catalogData: any = null;
    let categoryId: string | null = null;
    let totalLevels: number | null = null;
    
    try {
      const catalogDoc = await db.doc('config/gamesCatalog').get();
      if (catalogDoc.exists) {
        catalogData = catalogDoc.data();
        const gameEntry = catalogData?.games?.[gameId];
        
        if (gameEntry) {
          categoryId = gameEntry.category;
          totalLevels = gameEntry.totalLevels;
        }
      }
    } catch (error: any) {
      logger.warn('[recordLevelResult] Failed to read catalog for summary', { error: error.message });
    }

    // 6. Current timestamp
    const nowTs = admin.firestore.Timestamp.now();

    // 7. Transaction: Update level, game progress, and kid summary
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
        
        const levelUpdateRaw = {
          completed,
          stars,
          score,
          accuracyPct,
          durationSec,
          lastPlayedAt: nowTs,
          bestStars: newBestStars,
        };
        const levelUpdate = omitUndefined(levelUpdateRaw);
        
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
        
        // 5d. Compute progress summary for cheap Parent Dashboard read (delta-based)
        const kidUpdateData: any = { summary: updatedSummary };
        
        if (categoryId && totalLevels !== null) {
          const progressSummary = (kidDoc.data()?.progressSummary || {}) as any;
          
          // Ensure structure
          if (!progressSummary.byGame) progressSummary.byGame = {};
          if (!progressSummary.progressByTopic) progressSummary.progressByTopic = {};
          if (!progressSummary.overall) {
            progressSummary.overall = { completedLevels: 0, totalLevels: 0, pct: 0 };
          }
          
          // Determine game key and compute deltas
          const gameKey = progressDocId || gameId;
          const newGameCompleted = newCompletedCount;
          const newGameTotal = totalLevels;
          const oldGameCompleted = progressSummary.byGame[gameKey]?.completedLevels || 0;
          const oldGameTotal = progressSummary.byGame[gameKey]?.totalLevels || 0;
          
          const deltaCompleted = newGameCompleted - oldGameCompleted;
          const deltaTotal = newGameTotal - oldGameTotal;
          
          // Update per-game entry
          progressSummary.byGame[gameKey] = {
            completedLevels: newGameCompleted,
            totalLevels: newGameTotal,
            topicId: categoryId,
            lastPlayedAt: nowTs,
          };
          
          // Update topic using deltas
          const topic = progressSummary.progressByTopic[categoryId] || {
            completedLevels: 0,
            totalLevels: 0,
            pct: 0,
          };
          topic.completedLevels += deltaCompleted;
          topic.totalLevels += deltaTotal;
          topic.pct = topic.totalLevels > 0 ? Math.round((topic.completedLevels / topic.totalLevels) * 100) : 0;
          topic.lastPlayedAt = nowTs;
          progressSummary.progressByTopic[categoryId] = topic;
          
          // Update overall using deltas
          const overall = progressSummary.overall;
          overall.completedLevels += deltaCompleted;
          overall.totalLevels += deltaTotal;
          overall.pct = overall.totalLevels > 0 ? Math.round((overall.completedLevels / overall.totalLevels) * 100) : 0;
          overall.lastPlayedAt = nowTs;
          progressSummary.overall = overall;
          
          kidUpdateData.progressSummary = progressSummary;
        }
        
        logger.info('[recordLevelResult] Transaction prepared', {
          writes: {
            level: levelRef.path,
            gameProgress: gameProgressRef.path,
            kidSummary: kidRef.path,
          },
          completedCount: newCompletedCount,
          progressSummaryUpdated: !!categoryId,
        });
        
        // ===== PHASE 3: ALL WRITES LAST =====
        // Perform all writes after all reads
        
        txn.set(levelRef, levelUpdate, { merge: true });
        txn.set(gameProgressRef, gameProgressUpdate, { merge: true });
        txn.update(kidRef, kidUpdateData);
      });

      logger.info('[recordLevelResult] Transaction committed successfully', { kidId, completedCount });

      // 7. Update skill stats (outside transaction - monotonic increments)
      tagsUpdated = await applyTagStats(db, kidId, tagDeltas, nowTs, { gameId, levelId });

      // 8. Update weak areas summary (bounded reads, no index queries)
      if (tagDeltas && Object.keys(tagDeltas).length > 0) {
        try {
          // Helper: sanitize tag exactly like applyTagStats does
          const sanitizeTag = (tag: string): string => {
            return tag
              .replace(/\//g, '_')
              .replace(/\\/g, '_')
              .replace(/\./g, '_')
              .trim();
          };

          // Get sanitized tag IDs for tags we just updated
          const updatedTagIds = Object.keys(tagDeltas)
            .filter(rawTag => tagDeltas[rawTag].attempts > 0)
            .map(rawTag => sanitizeTag(rawTag))
            .filter(safeTag => safeTag.length > 0);

          if (updatedTagIds.length > 0) {
            // Bounded read 1: kid doc for existing weakTop
            const kidRef = db.doc(`kids/${kidId}`);
            const kidSnap = await kidRef.get();
            const existingWeakTop = kidSnap.data()?.summary?.weakTop ?? [];

            // Bounded read 2: only the tag docs we just updated
            const tagDocsPromises = updatedTagIds.map(tagId =>
              db.doc(`kids/${kidId}/skillStats/${tagId}`).get()
            );
            const tagDocs = await Promise.all(tagDocsPromises);

            // Build map of updated tags with computed wrongRate
            const updatedTagsMap: Record<string, any> = {};
            for (const tagDoc of tagDocs) {
              if (tagDoc.exists) {
                const data = tagDoc.data()!;
                const attempts = data.attempts || 0;
                const wrong = data.wrong || 0;
                const wrongRate = attempts > 0 ? Math.round((wrong / attempts) * 100) : 0;

                // Store with tagLabel as key for easier merge
                const tagLabel = data.tagLabel || tagDoc.id;
                updatedTagsMap[tagLabel] = {
                  tag: tagLabel,
                  attempts,
                  correct: data.correct || 0,
                  wrong,
                  wrongRate,
                  lastSeenAt: data.lastSeenAt,
                  lastWrongAt: data.lastWrongAt,
                  evidence: data.lastEvidence,
                };
              }
            }

            // Merge: replace entries for updated tags, keep others
            const mergedMap: Record<string, any> = {};

            // Add existing weakTop entries (except those being updated)
            for (const entry of existingWeakTop) {
              if (entry && entry.tag && !updatedTagsMap[entry.tag]) {
                mergedMap[entry.tag] = entry;
              }
            }

            // Add/replace updated tags
            for (const [tagLabel, entry] of Object.entries(updatedTagsMap)) {
              mergedMap[tagLabel] = entry;
            }

            // Filter, sort, and slice top 10
            const sortedWeakTop = Object.values(mergedMap)
              .filter((entry: any) => entry.attempts >= 3 && entry.wrong > 0)
              .sort((a: any, b: any) => {
                // Sort by wrongRate desc
                if (b.wrongRate !== a.wrongRate) return b.wrongRate - a.wrongRate;
                // Then by wrong count desc
                if (b.wrong !== a.wrong) return b.wrong - a.wrong;
                // Then by attempts desc
                if (b.attempts !== a.attempts) return b.attempts - a.attempts;
                // Then by lastWrongAt desc (most recent first)
                if (a.lastWrongAt && b.lastWrongAt) {
                  const aTime = a.lastWrongAt.toMillis ? a.lastWrongAt.toMillis() : 0;
                  const bTime = b.lastWrongAt.toMillis ? b.lastWrongAt.toMillis() : 0;
                  return bTime - aTime;
                }
                return 0;
              })
              .slice(0, 10);

            // Build update object without undefined values
            const weakTopUpdate = omitUndefined({
              'summary.weakTop': sortedWeakTop,
              'summary.lastUpdatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });

            // Write to kid doc
            await kidRef.update(weakTopUpdate);

            logger.info('[recordLevelResult] Updated weakTop summary', {
              kidId,
              weakTopCount: sortedWeakTop.length,
              tagsProcessed: updatedTagIds.length,
            });
          }
        } catch (error: any) {
          // Log error but don't fail the entire operation
          logger.error('[recordLevelResult] Failed to update weakTop summary', {
            kidId,
            error: error.message,
          });
        }
      }

      // 9. Log success (concise commit log)
      logger.info(`[recordLevelResult] committed { kidId: ${kidId}, gameId: ${gameId}, progressDocId: ${progressDocId || gameId}, levelId: ${levelId}, completedLevelsCount: ${completedCount}, tagsUpdated: ${tagsUpdated} }`);

      // 10. Return rich response object
      return {
        success: true,
        progressDocId: progressDocId || gameId,
        completedLevelsCount: completedCount,
        tagsUpdated,
        summaryUpdated: true,
        catalogStatus,
        catalogChecked: catalogStatus.checked,
        catalogPatched: catalogStatus.patched,
        catalogPatchedPaths: catalogStatus.patchedPaths || [],
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
