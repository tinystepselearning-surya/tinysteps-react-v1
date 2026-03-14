import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { normalizeGameIdentity } from '../games/helpers/normalizeGameIdentity';

const db = getFirestore();

type LightweightGameMeta = {
  title: string;
  areaPractised: string;
  expertiseArea: string;
  totalLevels?: number;
};

const LIGHTWEIGHT_GAME_META: Record<string, LightweightGameMeta> = {
  "letter-tracing": {
    title: "Letter Tracing",
    areaPractised: "Letter formation",
    expertiseArea: "phonics",
    totalLevels: 59,
  },
  "letter-tracing-sounds": {
    title: "Letter Tracing + Sounds",
    areaPractised: "Letter formation with sound support",
    expertiseArea: "phonics",
    totalLevels: 59,
  },
  "letter-sound-match": {
    title: "Letter Sounds",
    areaPractised: "Letter-sound recognition",
    expertiseArea: "phonics",
    totalLevels: 7,
  },
  "balloon-pop": {
    title: "Balloon Pop",
    areaPractised: "Sound matching",
    expertiseArea: "phonics",
    totalLevels: 7,
  },
  "sound-detective": {
    title: "Sound Listening",
    areaPractised: "Listening and sound identification",
    expertiseArea: "phonics",
    totalLevels: 7,
  },
  "my-first-words": {
    title: "My First Words",
    areaPractised: "Word blending",
    expertiseArea: "phonics",
    totalLevels: 2,
  },
  "cvc-word-builder": {
    title: "CVC Word Builder",
    areaPractised: "CVC blending and spelling",
    expertiseArea: "phonics",
    totalLevels: 5,
  },
};

function getGameMeta(gameId: string): LightweightGameMeta {
  return (
    LIGHTWEIGHT_GAME_META[gameId] || {
      title: gameId,
      areaPractised: "Practice",
      expertiseArea: "general_english",
    }
  );
}

/**
 * onGameSessionCreate - Firestore trigger for kids/{kidId}/gameSessions/{eventId}
 * 
 * Applies minimal rollups when a new game session is recorded.
 * Idempotent via marker doc: kids/{kidId}/rollupsApplied/{eventId}
 * 
 * Rollups:
 * 1. Update kids/{kidId}/gameProgress/{progressDocId}
 *    - completedLevels (only if first completion of this level)
 *    - totalLevels (from catalog)
 *    - lastPlayedAt
 */
export const onGameSessionCreateTrigger = onDocumentCreated(
  {
    document: 'kids/{kidId}/gameSessions/{eventId}',
    region: 'asia-south1',
  },
  async (event) => {
    const { kidId, eventId } = event.params as { kidId: string; eventId: string };
    const sessionData = event.data?.data();

    if (!sessionData) {
      logger.warn(`[onGameSessionCreate] No data for eventId: ${eventId}`);
      return;
    }

    const {
      gameId: rawGameId,
      progressDocId: rawProgressDocId,
      levelId,
      durationSec,
      timeSpentSec,
      timeSpentMs,
      skillResults,
    } = sessionData;
    const { gameId, progressDocId } = normalizeGameIdentity(rawGameId, rawProgressDocId);

    const resolvedKidId =
      (typeof sessionData.kidId === 'string' && sessionData.kidId.trim()) ||
      (typeof kidId === 'string' && kidId.trim()) ||
      '';

    // Validate required fields
    if (!resolvedKidId || !gameId || !progressDocId || levelId === undefined) {
      logger.error(`[onGameSessionCreate] Missing required fields`, {
        eventId,
        kidId: resolvedKidId || kidId,
        gameId,
        progressDocId,
        levelId,
      });
      return;
    }

    logger.info(`[onGameSessionCreate] Processing`, {
      eventId,
      kidId: resolvedKidId,
      gameId,
      progressDocId,
      levelId,
    });

    // Check idempotency marker
    const markerRef = db.doc(`kids/${resolvedKidId}/rollupsApplied/${eventId}`);
    const markerSnap = await markerRef.get();

    if (markerSnap.exists) {
      logger.info(`[onGameSessionCreate] Already processed (marker exists)`, { eventId, kidId: resolvedKidId });
      return;
    }

    try {
      // Fetch game catalog for totalLevels
      const gameMeta = getGameMeta(gameId);
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
      if (totalLevels === null && typeof gameMeta.totalLevels === "number") {
        totalLevels = gameMeta.totalLevels;
      }

      const normalizedTimeSpentMs =
        typeof timeSpentMs === "number" && Number.isFinite(timeSpentMs)
          ? Math.max(0, Math.floor(timeSpentMs))
          : typeof timeSpentSec === "number" && Number.isFinite(timeSpentSec)
            ? Math.max(0, Math.floor(timeSpentSec * 1000))
            : typeof durationSec === "number" && Number.isFinite(durationSec)
              ? Math.max(0, Math.floor(durationSec * 1000))
              : 0;

      // Check level completion marker
      const levelMarkerRef = db.doc(`kids/${resolvedKidId}/levelCompletions/${progressDocId}__${levelId}`);
      const levelMarkerSnap = await levelMarkerRef.get();
      const isFirstCompletion = !levelMarkerSnap.exists;

      // Create level completion marker if first time
      if (isFirstCompletion) {
        await levelMarkerRef.set({
          kidId: resolvedKidId,
          progressDocId,
          levelId,
          createdAt: FieldValue.serverTimestamp(),
        });
        logger.info(`[onGameSessionCreate] Level completion marker created`, {
          eventId,
          kidId: resolvedKidId,
          progressDocId,
          levelId,
        });
      }

      // Update gameProgress
      const progressRef = db.doc(`kids/${resolvedKidId}/gameProgress/${progressDocId}`);
      const progressUpdate: any = {
        gameId,
        title: gameMeta.title,
        areaPractised: gameMeta.areaPractised,
        expertiseArea: gameMeta.expertiseArea,
        started: true,
        lastPlayedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        progressStatus: "in_progress",
      };

      // Only increment completedLevels if first completion
      if (isFirstCompletion) {
        progressUpdate.completedLevels = FieldValue.increment(1);
        progressUpdate.levelsCompleted = FieldValue.increment(1);
      }

      // Set totalLevels if available
      if (totalLevels !== null) {
        progressUpdate.totalLevels = totalLevels;
      }
      if (normalizedTimeSpentMs > 0) {
        progressUpdate.totalTimeSpentMs = FieldValue.increment(normalizedTimeSpentMs);
      }

      await progressRef.set(progressUpdate, { merge: true });

      logger.info(`[onGameSessionCreate] Updated gameProgress`, {
        eventId,
        kidId: resolvedKidId,
        progressDocId,
        incrementedLevels: isFirstCompletion,
        totalLevels,
      });

      // Update lightweight activity freshness head for parent refresh checks.
      const activityHeadRef = db.doc(`kids/${resolvedKidId}/activity/head`);
      await activityHeadRef.set(
        {
          lastGameUpdateAt: FieldValue.serverTimestamp(),
          lastPlayedAt: FieldValue.serverTimestamp(),
          lastGameId: gameId,
          lastProgressDocId: progressDocId,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      logger.info(`[onGameSessionCreate] Updated activity head`, {
        eventId,
        kidId: resolvedKidId,
        gameId,
        progressDocId,
      });

      // Update skill tag stats
      if (Array.isArray(skillResults) && skillResults.length > 0) {
        const skillUpdatePromises = skillResults.map(async (skill: any, index: number) => {
          try {
            const { tag, attempts, correct, wrong } = skill;
            if (!tag || typeof attempts !== 'number') {
              return;
            }

            // Sanitize tag for Firestore doc ID (replace /, \, ., : with _)
            const safeTag = tag.replace(/\//g, '_').replace(/\\/g, '_').replace(/\./g, '_').replace(/:/g, '_');
            const skillRef = db.doc(`kids/${resolvedKidId}/skillTagStats/${safeTag}`);

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
          } catch (skillError: any) {
            logger.error('[onGameSessionCreate] SKILL WRITE FAILED:', {
              eventId,
              kidId: resolvedKidId,
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
          kidId: resolvedKidId,
          skillsCount: skillResults.length,
        });
      }

      // Write idempotency marker
      await markerRef.set({
        eventId,
        kidId: resolvedKidId,
        processedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`[onGameSessionCreate] Rollup complete`, {
        eventId,
        kidId: resolvedKidId,
        gameId,
        progressDocId,
        levelId,
      });
    } catch (error: any) {
      logger.error(`[onGameSessionCreate] Failed to apply rollups`, {
        eventId,
        kidId: resolvedKidId,
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
