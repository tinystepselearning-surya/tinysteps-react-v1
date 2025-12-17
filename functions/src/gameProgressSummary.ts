/**
 * Game Progress Summary Generator
 * 
 * Automatically creates/updates a lightweight summary document when game progress changes.
 * This allows the Parent Dashboard to quickly read aggregated progress without loading
 * full gameProgress documents.
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Constants for phonics game (hardcoded to avoid dependencies)
const TOTAL_ROUNDS = 8;
const TOTAL_LEVELS = 7;
const MAX_POSSIBLE_STARS = TOTAL_ROUNDS * TOTAL_LEVELS; // 56

interface GameProgressData {
  bestStarsByLevel?: Record<string, number>;
  completedLevels?: number[];
  resume?: {
    level?: number;
    round?: number;
    stars?: number;
    questions?: any[];
  };
  lastPlayedAt?: admin.firestore.Timestamp;
  version?: number;
}

interface GameSummaryData {
  gameId: string;
  lastPlayedAt: admin.firestore.Timestamp;
  bestStarsTotal: number;
  completedLevelCount: number;
  hasResume: boolean;
  completionPercent: number;
  version: number;
}

/**
 * Trigger: kids/{kidId}/gameProgress/{gameId}
 * 
 * On any write (create/update/delete), compute a summary and write to
 * kids/{kidId}/gameSummaries/{gameId}
 */
export const onGameProgressWrite = onDocumentWritten(
  'kids/{kidId}/gameProgress/{gameId}',
  async (event) => {
    const { kidId, gameId } = event.params;
    const snapshot = event.data;

    logger.info(`Game progress change detected for kid=${kidId}, game=${gameId}`);

    // If document was deleted, delete the summary too
    if (!snapshot || !snapshot.after.exists) {
      logger.info(`Game progress deleted, removing summary for kid=${kidId}, game=${gameId}`);
      try {
        await admin
          .firestore()
          .doc(`kids/${kidId}/gameSummaries/${gameId}`)
          .delete();
        logger.info(`Summary deleted successfully for kid=${kidId}, game=${gameId}`);
      } catch (error) {
        logger.error(`Failed to delete summary for kid=${kidId}, game=${gameId}:`, error);
      }
      return;
    }

    // Get the updated data
    const progressData = snapshot.after.data() as GameProgressData;

    // Calculate summary metrics
    const bestStarsTotal = calculateBestStarsTotal(progressData.bestStarsByLevel);
    const completedLevelCount = progressData.completedLevels?.length || 0;
    const hasResume = checkHasResume(progressData.resume);
    const completionPercent = calculateCompletionPercent(bestStarsTotal);

    // Build summary document
    const summaryData: GameSummaryData = {
      gameId,
      lastPlayedAt: progressData.lastPlayedAt || admin.firestore.Timestamp.now(),
      bestStarsTotal,
      completedLevelCount,
      hasResume,
      completionPercent,
      version: 1,
    };

    // Write summary document
    try {
      await admin
        .firestore()
        .doc(`kids/${kidId}/gameSummaries/${gameId}`)
        .set(summaryData, { merge: true });
      
      logger.info(
        `Summary updated for kid=${kidId}, game=${gameId}: ` +
        `stars=${bestStarsTotal}, completed=${completedLevelCount}, ` +
        `completion=${completionPercent.toFixed(1)}%, hasResume=${hasResume}`
      );
    } catch (error) {
      logger.error(`Failed to write summary for kid=${kidId}, game=${gameId}:`, error);
    }
  }
);

/**
 * Calculate total stars earned across all levels
 */
function calculateBestStarsTotal(bestStarsByLevel?: Record<string, number>): number {
  if (!bestStarsByLevel) return 0;
  
  return Object.values(bestStarsByLevel).reduce((sum, stars) => {
    const validStars = typeof stars === 'number' && stars >= 0 ? stars : 0;
    return sum + validStars;
  }, 0);
}

/**
 * Check if there's an active resume (player is mid-level)
 */
function checkHasResume(resume?: GameProgressData['resume']): boolean {
  if (!resume) return false;
  
  // Consider it a resume if they have progress in a level
  const hasRound = typeof resume.round === 'number' && resume.round > 0;
  const hasStars = typeof resume.stars === 'number' && resume.stars > 0;
  
  return hasRound || hasStars;
}

/**
 * Calculate completion percentage (0-100)
 * Based on total stars earned vs maximum possible stars
 */
function calculateCompletionPercent(bestStarsTotal: number): number {
  if (bestStarsTotal <= 0) return 0;
  
  const percent = (bestStarsTotal / MAX_POSSIBLE_STARS) * 100;
  
  // Clamp to 0-100 range
  return Math.min(100, Math.max(0, percent));
}
