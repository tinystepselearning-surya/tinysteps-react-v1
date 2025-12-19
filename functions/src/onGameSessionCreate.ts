/**
 * Game Session Summary Updater
 * 
 * Updates kids/{kidId}.summary when a new game session is created.
 * Tracks overall game stats, streaks, weekly time, and rolling accuracy.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

interface GameSessionData {
  accuracy?: number;
  attempts?: number;
  correct?: number;
  durationSec?: number;
  createdAt?: admin.firestore.Timestamp;
  endedAt?: admin.firestore.Timestamp;
  gameId?: string;
  graphemes?: string[];
  createdByUid?: string;
}

interface GameStats {
  plays: number;
  bestAccuracy: number;
  lastPlayedAt: admin.firestore.Timestamp;
}

interface KidSummary {
  totalSessions: number;
  lastPlayedAt: admin.firestore.Timestamp;
  lastGameId: string;
  last10Acc: number[];
  avgAccuracy10: number;
  streakDays: number;
  lastPlayedDateKey: string;
  timeSpentWeekSec: number;
  weekKey: string;
  games: Record<string, GameStats>;
}

/**
 * Converts a Firestore Timestamp to YYYY-MM-DD in Asia/Kolkata timezone
 */
function toDateKey(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  // Convert to Asia/Kolkata (UTC+5:30)
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(date.getTime() + kolkataOffset);
  
  const year = kolkataDate.getUTCFullYear();
  const month = String(kolkataDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kolkataDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converts a Firestore Timestamp to YYYY-WW (ISO week) in Asia/Kolkata timezone
 */
function toWeekKey(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  // Convert to Asia/Kolkata (UTC+5:30)
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(date.getTime() + kolkataOffset);
  
  // ISO week calculation
  const dayOfWeek = kolkataDate.getUTCDay() || 7; // Sunday = 7
  const nearestThursday = new Date(kolkataDate.getTime());
  nearestThursday.setUTCDate(kolkataDate.getUTCDate() + 4 - dayOfWeek);
  
  const yearStart = new Date(Date.UTC(nearestThursday.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((nearestThursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return `${nearestThursday.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Checks if dateKey is exactly one day before prevDateKey
 */
function isYesterday(dateKey: string, prevDateKey: string): boolean {
  const date = new Date(dateKey);
  const prevDate = new Date(prevDateKey);
  const diffMs = date.getTime() - prevDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

/**
 * Trigger: kids/{kidId}/gameSessions/{sessionId}
 * 
 * On create, update kids/{kidId}.summary with aggregated stats.
 */
export const onGameSessionCreate = onDocumentCreated(
  'kids/{kidId}/gameSessions/{sessionId}',
  async (event) => {
    const { kidId, sessionId } = event.params;
    const sessionData = event.data?.data() as GameSessionData | undefined;

    if (!sessionData) {
      logger.warn(`[onGameSessionCreate] No data for session ${sessionId}`);
      return;
    }

    const {
      accuracy = 0,
      durationSec = 0,
      createdAt,
      endedAt,
      gameId = 'unknown',
    } = sessionData;

    const db = admin.firestore();

    // PROD Kill Switch: Check config/insights (auto-create if missing)
    let enabled = true;
    try {
      const configRef = db.doc('config/insights');
      const configSnap = await configRef.get();

      if (!configSnap.exists) {
        // Auto-create config with enabled=true
        await configRef.set({
          enabled: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'onGameSessionCreate',
        }, { merge: true });
        logger.info('[onGameSessionCreate] config/insights auto-created with enabled=true', { kidId, sessionId });
        enabled = true;
      } else {
        const configData = configSnap.data();
        enabled = configData?.enabled === true;
      }
    } catch (error) {
      logger.warn('[onGameSessionCreate] config read failed; skipping safely', { kidId, sessionId, error });
      return;
    }

    // Kill switch check
    if (!enabled) {
      logger.info('[onGameSessionCreate] insights disabled; skipping', { kidId, sessionId });
      return;
    }

    // Proceed with existing logic
    const kidRef = db.collection('kids').doc(kidId);

    try {
      await db.runTransaction(async (transaction) => {
        const kidDoc = await transaction.get(kidRef);
        const existingSummary = (kidDoc.data()?.summary || {}) as Partial<KidSummary>;

        // Determine lastPlayedAt timestamp
        const lastPlayedAt = endedAt || createdAt || admin.firestore.Timestamp.now();
        const dateKey = toDateKey(lastPlayedAt);
        const weekKey = toWeekKey(lastPlayedAt);

        // Update totalSessions
        const totalSessions = (existingSummary.totalSessions || 0) + 1;

        // Update last10Acc array (prepend, max 10)
        const last10Acc = [accuracy, ...(existingSummary.last10Acc || [])].slice(0, 10);
        const avgAccuracy10 = last10Acc.reduce((sum, acc) => sum + acc, 0) / last10Acc.length;

        // Update streakDays
        let streakDays = existingSummary.streakDays || 0;
        const prevDateKey = existingSummary.lastPlayedDateKey || '';

        if (!prevDateKey) {
          // First session ever
          streakDays = 1;
        } else if (dateKey === prevDateKey) {
          // Same day, no change (keep existing value)
        } else if (isYesterday(dateKey, prevDateKey)) {
          // Consecutive day
          streakDays += 1;
        } else {
          // Streak broken
          streakDays = 1;
        }

        // Update timeSpentWeekSec
        let timeSpentWeekSec = durationSec;
        const prevWeekKey = existingSummary.weekKey || '';

        if (weekKey === prevWeekKey) {
          // Same week, accumulate
          timeSpentWeekSec = (existingSummary.timeSpentWeekSec || 0) + durationSec;
        }

        // Update per-game stats
        const games = existingSummary.games || {};
        const gameStats = games[gameId] || { plays: 0, bestAccuracy: 0, lastPlayedAt };

        gameStats.plays += 1;
        gameStats.bestAccuracy = Math.max(gameStats.bestAccuracy, accuracy);
        gameStats.lastPlayedAt = lastPlayedAt;

        games[gameId] = gameStats;

        // Build updated summary
        const updatedSummary: KidSummary = {
          totalSessions,
          lastPlayedAt,
          lastGameId: gameId,
          last10Acc,
          avgAccuracy10: Math.round(avgAccuracy10 * 100) / 100, // 2 decimals
          streakDays,
          lastPlayedDateKey: dateKey,
          timeSpentWeekSec,
          weekKey,
          games,
        };

        // Merge write
        transaction.update(kidRef, { summary: updatedSummary });

        logger.info(`[onGameSessionCreate] Updated summary for kid ${kidId}`, {
          kidId,
          sessionId,
          gameId,
          totalSessions,
          streakDays,
          avgAccuracy10: updatedSummary.avgAccuracy10,
          timeSpentWeekSec,
        });
      });
    } catch (error) {
      logger.error(`[onGameSessionCreate] Transaction failed for kid ${kidId}`, error);
      throw error;
    }
  }
);
