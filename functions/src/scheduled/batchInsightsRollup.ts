import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) admin.initializeApp();

interface SkillResult {
  tag?: string;
  attempts?: number;
  correct?: number;
  wrong?: number;
}

interface GameSessionData {
  accuracy?: number;
  durationSec?: number;
  createdAt?: admin.firestore.Timestamp;
  endedAt?: admin.firestore.Timestamp;
  gameId?: string;

  // for tracing/skill rollups
  skillTags?: string[];
  tagDeltas?: Record<string, { attempts?: number; correct?: number; wrong?: number }>;

  // ✅ IMPORTANT: many sessions store tags here
  skillResults?: SkillResult[];

  attempts?: number;
  correct?: number;
  wrong?: number;
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

type LetterMaps = {
  lowerDone: Record<string, true>;
  lowerPerfect: Record<string, true>;
  upperDone: Record<string, true>;
  upperPerfect: Record<string, true>;
};

function toDateKey(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(date.getTime() + kolkataOffset);
  const y = kolkataDate.getUTCFullYear();
  const m = String(kolkataDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kolkataDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

function isYesterday(dateKey: string, prevDateKey: string): boolean {
  const date = new Date(dateKey);
  const prevDate = new Date(prevDateKey);
  const diffMs = date.getTime() - prevDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24) === 1;
}

function applySummaryUpdate(existingSummary: Partial<KidSummary>, session: GameSessionData): KidSummary {
  const accuracy = session.accuracy ?? 0;
  const durationSec = session.durationSec ?? 0;
  const createdAt = session.createdAt;
  const endedAt = session.endedAt;
  const gameId = session.gameId || "unknown";

  const lastPlayedAt = endedAt || createdAt || admin.firestore.Timestamp.now();
  const dateKey = toDateKey(lastPlayedAt);
  const weekKey = toWeekKey(lastPlayedAt);

  const totalSessions = (existingSummary.totalSessions || 0) + 1;

  const last10Acc = [accuracy, ...(existingSummary.last10Acc || [])].slice(0, 10);
  const avgAccuracy10 = last10Acc.reduce((s, a) => s + a, 0) / last10Acc.length;

  let streakDays = existingSummary.streakDays || 0;
  const prevDateKey = existingSummary.lastPlayedDateKey || "";

  if (!prevDateKey) streakDays = 1;
  else if (dateKey === prevDateKey) {
    // same day
  } else if (isYesterday(dateKey, prevDateKey)) streakDays += 1;
  else streakDays = 1;

  let timeSpentWeekSec = durationSec;
  const prevWeekKey = existingSummary.weekKey || "";
  if (weekKey === prevWeekKey) timeSpentWeekSec = (existingSummary.timeSpentWeekSec || 0) + durationSec;

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

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function getTags(session: GameSessionData): string[] {
  const a = Array.isArray(session.skillTags) ? session.skillTags.map(String) : [];
  const b =
    session.tagDeltas && typeof session.tagDeltas === "object"
      ? Object.keys(session.tagDeltas).map(String)
      : [];

  // ✅ NEW: pull tags from skillResults array too
  const c = Array.isArray(session.skillResults)
    ? session.skillResults.map((r) => String(r?.tag || "")).filter(Boolean)
    : [];

  return uniq([...a, ...b, ...c]).filter(Boolean);
}

function extractLetterAndCase(tags: string[]): { letter: string | null; letterCase: "lower" | "upper" | null } {
  const lower = tags.map((t) => t.toLowerCase());

  const letterTag = lower.find((t) => t.startsWith("letter:"));
  const caseTag = lower.find((t) => t === "case:lower" || t === "case:upper");

  let letter: string | null = null;
  if (letterTag) {
    const raw = letterTag.split("letter:")[1] || "";
    const ch = raw.trim().slice(0, 1);
    if (ch >= "a" && ch <= "z") letter = ch;
  }

  const letterCase = caseTag ? (caseTag.endsWith("lower") ? "lower" : "upper") : null;
  return { letter, letterCase };
}

function isPerfect(session: GameSessionData): boolean {
  // Prefer explicit accuracy if provided
  if (typeof session.accuracy === "number" && Number.isFinite(session.accuracy)) {
    return session.accuracy >= 100; // keep strict for now
  }

  // Or derive from tagDeltas
  if (session.tagDeltas && typeof session.tagDeltas === "object") {
    const anyWrong = Object.values(session.tagDeltas).some((d) => (d?.wrong ?? 0) > 0);
    return !anyWrong;
  }

  // Or derive from skillResults
  if (Array.isArray(session.skillResults) && session.skillResults.length > 0) {
    const anyWrong = session.skillResults.some((r) => (r?.wrong ?? 0) > 0);
    return !anyWrong;
  }

  return false;
}

function normalizeLetterMaps(existing: any): LetterMaps {
  const letters = existing?.letters || {};
  const ld = letters?.lower?.done || existing?.lowerDoneMap || {};
  const lp = letters?.lower?.perfect || existing?.lowerPerfectMap || {};
  const ud = letters?.upper?.done || existing?.upperDoneMap || {};
  const up = letters?.upper?.perfect || existing?.upperPerfectMap || {};

  return {
    lowerDone: { ...(ld || {}) },
    lowerPerfect: { ...(lp || {}) },
    upperDone: { ...(ud || {}) },
    upperPerfect: { ...(up || {}) },
  };
}

function countMap(m: Record<string, true>): number {
  return Object.keys(m || {}).length;
}

function unionCount(a: Record<string, true>, b: Record<string, true>): number {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  return keys.size;
}

function keysSorted(m: Record<string, true>): string[] {
  return Object.keys(m || {}).sort();
}

function unionKeysSorted(a: Record<string, true>, b: Record<string, true>): string[] {
  return Array.from(new Set([...Object.keys(a || {}), ...Object.keys(b || {})])).sort();
}

/**
 * Core rollup logic
 */
export async function runBatchInsightsRollup(label: string, db: admin.firestore.Firestore) {
  logger.info(`[batchInsightsRollup:${label}] Starting rollup`);

  const configRef = db.doc("config/insights");
  const configSnap = await configRef.get();
  if (!configSnap.exists) throw new Error("config/insights not found");

  const configData = configSnap.data();
  if (configData?.enabled !== true) throw new Error("Insights are currently disabled");

  const lastRunAt =
    configData?.lastRunAt || admin.firestore.Timestamp.fromMillis(Date.now() - 8 * 60 * 60 * 1000);
  const now = admin.firestore.Timestamp.now();

  logger.info(`[batchInsightsRollup:${label}] Processing sessions since ${lastRunAt.toDate().toISOString()}`);

  const sessionsQuery = db
    .collectionGroup("gameSessions")
    .where("createdAt", ">", lastRunAt)
    .orderBy("createdAt", "asc");

  const sessionsSnap = await sessionsQuery.get();
  logger.info(`[batchInsightsRollup:${label}] Found ${sessionsSnap.size} sessions`);

  if (sessionsSnap.empty) {
    await configRef.update({
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRunLabel: label,
    });
    return { kidsUpdated: 0, sessionsProcessed: 0, from: lastRunAt, to: now };
  }

  // group by kidId (kids/{kidId}/gameSessions/{id})
  const sessionsByKid = new Map<string, GameSessionData[]>();
  for (const doc of sessionsSnap.docs) {
    const kidId = doc.ref.parent.parent?.id;
    if (!kidId) continue;
    const d = doc.data() as GameSessionData;
    if (!sessionsByKid.has(kidId)) sessionsByKid.set(kidId, []);
    sessionsByKid.get(kidId)!.push(d);
  }

  let kidsUpdated = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const [kidId, sessions] of sessionsByKid) {
    const kidRef = db.collection("kids").doc(kidId);
    const kidDoc = await kidRef.get();
    if (!kidDoc.exists) continue;

    let summary = (kidDoc.data()?.summary || {}) as Partial<KidSummary>;
    const existingProgress = (kidDoc.data()?.progress || {}) as any;
    const existingByGame = (existingProgress.byGame || {}) as any;

    const existingLT = existingByGame["letter-tracing"] || {};
    const maps = normalizeLetterMaps(existingLT);

    for (const session of sessions) {
      summary = applySummaryUpdate(summary, session);

      if ((session.gameId || "") === "letter-tracing") {
        const tags = getTags(session);
        const { letter, letterCase } = extractLetterAndCase(tags);
        if (letter && letterCase) {
          const perfect = isPerfect(session);
          if (letterCase === "lower") {
            maps.lowerDone[letter] = true;
            if (perfect) maps.lowerPerfect[letter] = true;
          } else {
            maps.upperDone[letter] = true;
            if (perfect) maps.upperPerfect[letter] = true;
          }
        }
      }
    }

    const lowerDone = countMap(maps.lowerDone);
    const upperDone = countMap(maps.upperDone);
    const lowerPerfect = countMap(maps.lowerPerfect);
    const upperPerfect = countMap(maps.upperPerfect);

    // ✅ overall is “unique letters a-z practiced in any case”
    const overallDone = unionCount(maps.lowerDone, maps.upperDone);
    const overallPerfect = unionCount(maps.lowerPerfect, maps.upperPerfect);

    // ✅ lists to show in UI
    const lowerDoneList = keysSorted(maps.lowerDone); // ["a","b"]
    const upperDoneList = keysSorted(maps.upperDone).map((x) => x.toUpperCase()); // ["A","C"]
    const lowerPerfectList = keysSorted(maps.lowerPerfect);
    const upperPerfectList = keysSorted(maps.upperPerfect).map((x) => x.toUpperCase());

    const overallDoneList = unionKeysSorted(maps.lowerDone, maps.upperDone).map((x) => x.toUpperCase()); // ["A","B","C"]
    const overallPerfectList = unionKeysSorted(maps.lowerPerfect, maps.upperPerfect).map((x) => x.toUpperCase());

    const ltOut = {
      totalLevels: 26,
      completedLevels: overallDone,

      overallDone,
      overallPerfect,
      lowerDone,
      lowerPerfect,
      upperDone,
      upperPerfect,

      // ✅ NEW: display-ready lists
      lowerDoneList,
      upperDoneList,
      lowerPerfectList,
      upperPerfectList,
      overallDoneList,
      overallPerfectList,

      // Existing maps (good for detailed UI)
      letters: {
        lower: { done: maps.lowerDone, perfect: maps.lowerPerfect },
        upper: { done: maps.upperDone, perfect: maps.upperPerfect },
      },

      lastPlayedAt: summary.lastPlayedAt || admin.firestore.Timestamp.now(),
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "scheduled_rollup",
    };

    const nextByGame = {
      ...existingByGame,
      "letter-tracing": ltOut,
    };

    batch.set(
      kidRef,
      {
        summary: {
          ...summary,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        progress: {
          ...existingProgress,
          byGame: nextByGame,
        },
      },
      { merge: true }
    );

    batchCount++;
    kidsUpdated++;

    if (batchCount >= 500) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();

  await configRef.update({
    lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRunLabel: label,
  });

  return { kidsUpdated, sessionsProcessed: sessionsSnap.size, from: lastRunAt, to: now };
}

/**
 * Scheduled runs (IST aligned via UTC times)
 */
export const batchInsightsRollup11am = onSchedule(
  {
    schedule: "30 5 * * *", // 05:30 UTC = 11:00 IST
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("11am", db);
  }
);

export const batchInsightsRollup5pm = onSchedule(
  {
    schedule: "30 11 * * *", // 11:30 UTC = 17:00 IST
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("5pm", db);
  }
);

export const batchInsightsRollup11pm = onSchedule(
  {
    schedule: "30 17 * * *", // 17:30 UTC = 23:00 IST
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("11pm", db);
  }
);
