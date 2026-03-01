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
 * 1. Update kids/{kidId}/gameProgress/{progressDocId}
 *    - completedLevels (only if first completion of this level)
 *    - totalLevels (from catalog)
 *    - lastPlayedAt
 * 
 * 2. Update kids/{kidId}/summary/overall
 *    - games.{gameId}.plays
 *    - games.{gameId}.lastPlayedAt
 *    - totalPoints
 *    - lastUpdatedAt
 */
export const onGameSessionCreateTrigger = onDocumentCreated(
  {
    document: 'gameSessions/{eventId}',
    region: 'asia-south1',
  },
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
      accuracy,
      skillResults,
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

    // TEMPORARY DEBUG LOG
    console.log('[onGameSessionCreate] DEBUG:', {
      eventId,
      kidId,
      gameId,
      skillResultsLength: Array.isArray(skillResults) ? skillResults.length : 0,
      skillResultsSample: Array.isArray(skillResults) ? skillResults.slice(0, 2) : null,
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

      // Update gameProgress
      const progressRef = db.doc(`kids/${kidId}/gameProgress/${progressDocId}`);
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

      logger.info(`[onGameSessionCreate] Updated gameProgress`, {
        eventId,
        kidId,
        progressDocId,
        incrementedLevels: isFirstCompletion,
        totalLevels,
      });

      // Update summary
      const summaryRef = db.doc(`kids/${kidId}/summary/overall`);
      const summaryUpdate: any = {
        [`games.${gameId}.plays`]: FieldValue.increment(1),
        [`games.${gameId}.lastPlayedAt`]: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      };

      // Add points if present
      if (typeof pointsEarned === 'number' && pointsEarned > 0) {
        summaryUpdate.totalPoints = FieldValue.increment(pointsEarned);
      }

      // Add accuracy for average calculation
      if (typeof accuracy === 'number') {
        summaryUpdate[`games.${gameId}.totalAccuracy`] = FieldValue.increment(accuracy);
        summaryUpdate[`games.${gameId}.avgAccuracy`] = FieldValue.increment(accuracy / (sessionData.attempts || 1));
      }

      await summaryRef.set(summaryUpdate, { merge: true });

      logger.info(`[onGameSessionCreate] Updated summary`, {
        eventId,
        kidId,
        gameId,
        pointsEarned: pointsEarned || 0,
      });

      // Update skill tag stats
      if (Array.isArray(skillResults) && skillResults.length > 0) {
        console.log('[onGameSessionCreate] SKILL ROLLUP START:', {
          eventId,
          kidId,
          skillResultsCount: skillResults.length,
          firstTwoTags: skillResults.slice(0, 2).map((s: any) => s.tag),
        });

        const skillUpdatePromises = skillResults.map(async (skill: any, index: number) => {
          try {
            const { tag, attempts, correct, wrong } = skill;
            if (!tag || typeof attempts !== 'number') {
              console.log('[onGameSessionCreate] SKILL SKIPPED:', { eventId, tag, attempts, index });
              return;
            }

            // Sanitize tag for Firestore doc ID (replace /, \, ., : with _)
            const safeTag = tag.replace(/\//g, '_').replace(/\\/g, '_').replace(/\./g, '_').replace(/:/g, '_');
            const skillRef = db.doc(`kids/${kidId}/skillTagStats/${safeTag}`);

            console.log('[onGameSessionCreate] SKILL WRITE:', {
              eventId,
              index,
              originalTag: tag,
              safeTag,
              path: `kids/${kidId}/skillTagStats/${safeTag}`,
              increments: { attempts, correct, wrong },
            });

            const skillUpdate: any = {
              tag,
              attempts: FieldValue.increment(attempts),
              correct: FieldValue.increment(correct || 0),
              wrong: FieldValue.increment(wrong || 0),
              lastSeenAt: FieldValue.serverTimestamp(),
            };

            if (wrong > 0) {
              skillUpdate.lastWrongAt = FieldValue.serverTimestamp();
            }

            await skillRef.set(skillUpdate, { merge: true });
            console.log('[onGameSessionCreate] SKILL WRITE SUCCESS:', { eventId, safeTag });
          } catch (skillError: any) {
            logger.error('[onGameSessionCreate] SKILL WRITE FAILED:', {
              eventId,
              kidId,
              index,
              tag: skill?.tag,
              errorMessage: skillError.message,
              errorCode: skillError.code || 'unknown',
            });
            // Don't throw - allow other skills to process
          }
        });

        await Promise.all(skillUpdatePromises);

        logger.info(`[onGameSessionCreate] Updated skill tag stats`, {
          eventId,
          kidId,
          skillsCount: skillResults.length,
        });
      }

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
        gameId,
        progressDocId,
        levelId,
        errorMessage: error.message,
        errorCode: error.code || 'unknown',
        errorStack: error.stack,
      });
      // Don't throw - let the marker absence allow retry on next trigger
    }
  }
);
