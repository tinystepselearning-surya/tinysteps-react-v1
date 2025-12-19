/**
 * Batch Insights Rollup
 *
 * Scheduled function that runs 3 times daily (11:00, 17:00, 23:00 IST).
 * Processes all game sessions since last run and updates kids/{kidId}.summary.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) admin.initializeApp();

interface GameSessionData {
  accuracy?: number;
  durationSec?: number;
  createdAt?: admin.firestore.Timestamp;
  endedAt?: admin.firestore.Timestamp;
  gameId?: string;
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
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(date.getTime() + kolkataOffset);

  const year = kolkataDate.getUTCFullYear();
  const month = String(kolkataDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kolkataDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Converts a Firestore Timestamp to YYYY-WW (ISO week) in Asia/Kolkata timezone
 */
function toWeekKey(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(date.getTime() + kolkataOffset);

  const dayOfWeek = kolkataDate.getUTCDay() || 7;
  const nearestThursday = new Date(kolkataDate.getTime());
  nearestThursday.setUTCDate(kolkataDate.getUTCDate() + 4 - dayOfWeek);

  const yearStart = new Date(Date.UTC(nearestThursday.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((nearestThursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${nearestThursday.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Checks if dateKey is exactly one day after prevDateKey
 */
function isYesterday(dateKey: string, prevDateKey: string): boolean {
  const date = new Date(dateKey);
  const prevDate = new Date(prevDateKey);
  const diffMs = date.getTime() - prevDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

/**
 * Apply a single session to the summary (incremental update logic)
 */
function applySummaryUpdate(existingSummary: Partial<KidSummary>, session: GameSessionData): KidSummary {
  const { accuracy = 0, durationSec = 0, createdAt, endedAt, gameId = "unknown" } = session;

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
  const prevDateKey = existingSummary.lastPlayedDateKey || "";

  if (!prevDateKey) {
    streakDays = 1;
  } else if (dateKey === prevDateKey) {
    // Same day, no change
  } else if (isYesterday(dateKey, prevDateKey)) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }

  // Update timeSpentWeekSec
  let timeSpentWeekSec = durationSec;
  const prevWeekKey = existingSummary.weekKey || "";

  if (weekKey === prevWeekKey) {
    timeSpentWeekSec = (existingSummary.timeSpentWeekSec || 0) + durationSec;
  }

  // Update per-game stats
  const games = existingSummary.games || {};
  const gameStats = games[gameId] || { plays: 0, bestAccuracy: 0, lastPlayedAt };

  gameStats.plays += 1;
  gameStats.bestAccuracy = Math.max(gameStats.bestAccuracy, accuracy);
  gameStats.lastPlayedAt = lastPlayedAt;

  games[gameId] = gameStats;

  return {
    totalSessions,
    lastPlayedAt,
    lastGameId: gameId,
    last10Acc,
    avgAccuracy10: Math.round(avgAccuracy10 * 100) / 100,
    streakDays,
    lastPlayedDateKey: dateKey,
    timeSpentWeekSec,
    weekKey,
    games,
  };
}

/**
 * Core rollup logic (shared across all schedule times and manual triggers)
 */
export async function runBatchInsightsRollup(
  label: string,
  db: admin.firestore.Firestore
): Promise<{
  kidsUpdated: number;
  sessionsProcessed: number;
  from: admin.firestore.Timestamp;
  to: admin.firestore.Timestamp;
}> {
  const startTime = Date.now();

  logger.info(`[batchInsightsRollup:${label}] Starting rollup`);

  try {
    // Read config
    const configRef = db.doc("config/insights");
    const configSnap = await configRef.get();

    if (!configSnap.exists) {
      logger.warn(`[batchInsightsRollup:${label}] config/insights not found; skipping`);
      throw new Error("config/insights not found");
    }

    const configData = configSnap.data();
    const enabled = configData?.enabled === true;

    if (!enabled) {
      logger.info(`[batchInsightsRollup:${label}] insights disabled; skipping`);
      throw new Error("Insights are currently disabled");
    }

    // Determine lastRunAt
    const lastRunAt =
      configData?.lastRunAt || admin.firestore.Timestamp.fromMillis(Date.now() - 8 * 60 * 60 * 1000);
    const now = admin.firestore.Timestamp.now();

    logger.info(`[batchInsightsRollup:${label}] Processing sessions since ${lastRunAt.toDate().toISOString()}`);

    // Query collectionGroup for sessions since lastRunAt
    const sessionsQuery = db
      .collectionGroup("gameSessions")
      .where("createdAt", ">", lastRunAt)
      .orderBy("createdAt", "asc");

    const sessionsSnap = await sessionsQuery.get();
    logger.info(`[batchInsightsRollup:${label}] Found ${sessionsSnap.size} sessions to process`);

    if (sessionsSnap.empty) {
      // Update lastRunAt even if no sessions
      await configRef.update({
        lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
        lastRunLabel: label,
      });

      logger.info(`[batchInsightsRollup:${label}] No sessions to process; updated lastRunAt`);
      return {
        kidsUpdated: 0,
        sessionsProcessed: 0,
        from: lastRunAt,
        to: now,
      };
    }

    // Group sessions by kidId
    const sessionsByKid = new Map<string, GameSessionData[]>();

    for (const doc of sessionsSnap.docs) {
      const kidId = doc.ref.parent.parent?.id; // kids/{kidId}/gameSessions/{sessionId}
      if (!kidId) continue;

      const sessionData = doc.data() as GameSessionData;
      if (!sessionsByKid.has(kidId)) sessionsByKid.set(kidId, []);
      sessionsByKid.get(kidId)!.push(sessionData);
    }

    logger.info(`[batchInsightsRollup:${label}] Processing ${sessionsByKid.size} kids`);

    // Process each kid
    let kidsUpdated = 0;

    // IMPORTANT FIX:
    // You cannot reuse the same batch after commit(). Create a NEW batch each time.
    let batch = db.batch();
    let batchCount = 0;

    for (const [kidId, sessions] of sessionsByKid) {
      const kidRef = db.collection("kids").doc(kidId);
      const kidDoc = await kidRef.get();

      if (!kidDoc.exists) {
        logger.warn(`[batchInsightsRollup:${label}] Kid ${kidId} not found; skipping`);
        continue;
      }

      let summary = (kidDoc.data()?.summary || {}) as Partial<KidSummary>;

      // Apply each session in order
      for (const session of sessions) {
        summary = applySummaryUpdate(summary, session);
      }

      // Write back - use set with merge to avoid "field specified multiple times" error
      batch.set(
        kidRef,
        {
          summary: {
            ...summary,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );

      batchCount++;
      kidsUpdated++;

      // Commit batch every 500 writes (Firestore limit)
      if (batchCount >= 500) {
        await batch.commit();
        logger.info(`[batchInsightsRollup:${label}] Committed batch of ${batchCount} updates`);

        // NEW batch after commit (critical)
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
      logger.info(`[batchInsightsRollup:${label}] Committed final batch of ${batchCount} updates`);
    }

    // Update config lastRunAt
    await configRef.update({
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRunLabel: label,
    });

    const duration = Date.now() - startTime;
    logger.info(
      `[batchInsightsRollup:${label}] Completed: ${sessionsSnap.size} sessions, ${kidsUpdated} kids updated, ${duration}ms`
    );

    return {
      kidsUpdated,
      sessionsProcessed: sessionsSnap.size,
      from: lastRunAt,
      to: now,
    };
  } catch (err: any) {
    // ✅ LOG FULL ERROR DETAILS (so you can see "requires an index" if that's the cause)
    logger.error(`[batchInsightsRollup:${label}] FAILED`, {
      code: err?.code,
      message: err?.message,
      details: err?.details,
      stack: err?.stack,
    });
    throw err;
  }
}

/**
 * Scheduled function: 11:00 AM IST (05:30 UTC)
 */
export const batchInsightsRollup11am = onSchedule(
  {
    schedule: "30 5 * * *", // 05:30 UTC = 11:00 IST
    timeZone: "UTC",
    region: "asia-south1",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("11am", db);
  }
);

/**
 * Scheduled function: 5:00 PM IST (11:30 UTC)
 */
export const batchInsightsRollup5pm = onSchedule(
  {
    schedule: "30 11 * * *", // 11:30 UTC = 17:00 IST
    timeZone: "UTC",
    region: "asia-south1",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("5pm", db);
  }
);

/**
 * Scheduled function: 11:00 PM IST (17:30 UTC)
 */
export const batchInsightsRollup11pm = onSchedule(
  {
    schedule: "30 17 * * *", // 17:30 UTC = 23:00 IST
    timeZone: "UTC",
    region: "asia-south1",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("11pm", db);
  }
);
