import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

const db = getFirestore();

/**
 * onGameSessionCreate - Firestore trigger for gameSessions/{eventId}
 * 
 * Applies minimal rollups when a new game session is recorded.
 * Idempotent via marker doc: kids/{kidId}/rollupsApplied/{eventId}
 * 
 * Rollups:
 * 1. Update kids/{kidId}/progress/byGame/{progressDocId}
 *    - completedLevels (only if first completion of this level)
 *    - totalLevels (from catalog)
 *    - lastPlayedAt
 * 
 * 2. Update kids/{kidId}/summary
 *    - games.{gameId}.plays
 *    - games.{gameId}.lastPlayedAt
 *    - totalPoints
 *    - lastUpdatedAt
 */
export const onGameSessionCreateTrigger = onDocumentCreated(
  'gameSessions/{eventId}',
  async (event) => {
    const eventId = event.params.eventId;
    const sessionData = event.data?.data();

    if (!sessionData) {
      logger.warn(`[onGameSessionCreate] No data for eventId: ${eventId}`);
      return;
    }

    const {
      kidId,
      gameId,
      progressDocId,
      levelId,
      pointsEarned,
    } = sessionData;

    // Validate required fields
    if (!kidId || !gameId || !progressDocId || levelId === undefined) {
      logger.error(`[onGameSessionCreate] Missing required fields`, {
        eventId,
        kidId,
        gameId,
        progressDocId,
        levelId,
      });
      return;
    }

    logger.info(`[onGameSessionCreate] Processing`, {
      eventId,
      kidId,
      gameId,
      progressDocId,
      levelId,
    });

    // Check idempotency marker
    const markerRef = db.doc(`kids/${kidId}/rollupsApplied/${eventId}`);
    const markerSnap = await markerRef.get();

    if (markerSnap.exists) {
      logger.info(`[onGameSessionCreate] Already processed (marker exists)`, { eventId, kidId });
      return;
    }

    try {
      // Fetch game catalog for totalLevels
      let totalLevels: number | null = null;
      try {
        const catalogDoc = await db.doc('config/gamesCatalog').get();
        if (catalogDoc.exists) {
          const catalogData = catalogDoc.data();
          const gameEntry = catalogData?.games?.[gameId];
          if (gameEntry) {
            totalLevels = gameEntry.totalLevels || null;
          }
        }
      } catch (error: any) {
        logger.warn(`[onGameSessionCreate] Failed to read catalog`, {
          eventId,
          error: error.message,
        });
      }

      // Check level completion marker
      const levelMarkerRef = db.doc(`kids/${kidId}/levelCompletions/${progressDocId}__${levelId}`);
      const levelMarkerSnap = await levelMarkerRef.get();
      const isFirstCompletion = !levelMarkerSnap.exists;

      // Create level completion marker if first time
      if (isFirstCompletion) {
        await levelMarkerRef.set({
          kidId,
          progressDocId,
          levelId,
          createdAt: FieldValue.serverTimestamp(),
        });
        logger.info(`[onGameSessionCreate] Level completion marker created`, {
          eventId,
          kidId,
          progressDocId,
          levelId,
        });
      }

      // Update progress/byGame
      const progressRef = db.doc(`kids/${kidId}/progress/byGame/${progressDocId}`);
      const progressUpdate: any = {
        lastPlayedAt: FieldValue.serverTimestamp(),
      };

      // Only increment completedLevels if first completion
      if (isFirstCompletion) {
        progressUpdate.completedLevels = FieldValue.increment(1);
      }

      // Set totalLevels if available
      if (totalLevels !== null) {
        progressUpdate.totalLevels = totalLevels;
      }

      await progressRef.set(progressUpdate, { merge: true });

      logger.info(`[onGameSessionCreate] Updated progress/byGame`, {
        eventId,
        kidId,
        progressDocId,
        incrementedLevels: isFirstCompletion,
        totalLevels,
      });

      // Update summary
      const summaryRef = db.doc(`kids/${kidId}/summary`);
      const summaryUpdate: any = {
        [`games.${gameId}.plays`]: FieldValue.increment(1),
        [`games.${gameId}.lastPlayedAt`]: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      };

      // Add points if present
      if (typeof pointsEarned === 'number' && pointsEarned > 0) {
        summaryUpdate.totalPoints = FieldValue.increment(pointsEarned);
      }

      await summaryRef.set(summaryUpdate, { merge: true });

      logger.info(`[onGameSessionCreate] Updated summary`, {
        eventId,
        kidId,
        gameId,
        pointsEarned: pointsEarned || 0,
      });

      // Write idempotency marker
      await markerRef.set({
        eventId,
        kidId,
        processedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`[onGameSessionCreate] Rollup complete`, {
        eventId,
        kidId,
        gameId,
        progressDocId,
        levelId,
      });
    } catch (error: any) {
      logger.error(`[onGameSessionCreate] Failed to apply rollups`, {
        eventId,
        kidId,
        error: error.message,
        stack: error.stack,
      });
      // Don't throw - let the marker absence allow retry on next trigger
    }
  }
);
