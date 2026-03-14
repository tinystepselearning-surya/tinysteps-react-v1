import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { normalizeGameIdentity } from "./games/helpers/normalizeGameIdentity";

const TOTAL_ROUNDS = 8;
const TOTAL_LEVELS = 7;
const MAX_POSSIBLE_STARS = TOTAL_ROUNDS * TOTAL_LEVELS;

type ProgressStatus = "not_started" | "getting_started" | "in_progress" | "progressing" | "completed";

interface GameProgressData {
  gameId?: string;
  title?: string;
  areaPractised?: string;
  expertiseArea?: string;
  started?: boolean;
  totalLevels?: number;
  levelsCompleted?: number;
  completedLevelCount?: number;
  completedLevels?: number[] | number | Record<string, unknown>;
  progressStatus?: string;
  totalTimeSpentMs?: number;
  timeSpentMs?: number;
  timeSpentSec?: number;
  durationSec?: number;
  bestStarsByLevel?: Record<string, number>;
  resume?: {
    level?: number;
    round?: number;
    stars?: number;
    questions?: any[];
  };
  lastPlayedAt?: admin.firestore.Timestamp;
}

interface GameSummaryData {
  gameId: string;
  progressDocId: string;
  title: string;
  areaPractised: string;
  expertiseArea: string;
  started: boolean;
  totalLevels: number;
  levelsCompleted: number;
  progressStatus: ProgressStatus;
  totalTimeSpentMs: number;
  lastPlayedAt: admin.firestore.Timestamp;
  bestStarsTotal: number;
  completedLevelCount: number;
  hasResume: boolean;
  completionPercent: number;
  updatedAt: admin.firestore.Timestamp;
  version: number;
}

const GAME_SUMMARY_META: Record<string, { title: string; areaPractised: string; expertiseArea: string }> = {
  "letter-tracing": {
    title: "Letter Tracing",
    areaPractised: "Letter formation",
    expertiseArea: "phonics",
  },
  "letter-tracing-sounds": {
    title: "Letter Tracing + Sounds",
    areaPractised: "Letter formation with sound support",
    expertiseArea: "phonics",
  },
  "letter-sound-match": {
    title: "Letter Sounds",
    areaPractised: "Letter-sound recognition",
    expertiseArea: "phonics",
  },
  "balloon-pop": {
    title: "Balloon Pop",
    areaPractised: "Sound matching",
    expertiseArea: "phonics",
  },
  "sound-detective": {
    title: "Sound Listening",
    areaPractised: "Listening and sound identification",
    expertiseArea: "phonics",
  },
  "my-first-words": {
    title: "My First Words",
    areaPractised: "Word blending",
    expertiseArea: "phonics",
  },
  "cvc-word-builder": {
    title: "CVC Word Builder",
    areaPractised: "CVC blending and spelling",
    expertiseArea: "phonics",
  },
};

export const onGameProgressWrite = onDocumentWritten(
  {
    document: "kids/{kidId}/gameProgress/{gameId}",
    region: "asia-south1",
  },
  async (event) => {
    const { kidId, gameId } = event.params;
    const snapshot = event.data;

    if (!snapshot || !snapshot.after.exists) {
      try {
        await admin.firestore().doc(`kids/${kidId}/gameSummaries/${gameId}`).delete();
      } catch (error) {
        logger.error(`Failed to delete summary for kid=${kidId}, game=${gameId}:`, error);
      }
      return;
    }

    const progressData = snapshot.after.data() as GameProgressData;
    const now = admin.firestore.Timestamp.now();
    const rawGameId = String(progressData.gameId || gameId || "").trim();
    const { gameId: canonicalGameId, progressDocId } = normalizeGameIdentity(rawGameId, gameId);
    const meta = GAME_SUMMARY_META[canonicalGameId] || GAME_SUMMARY_META[gameId];

    const bestStarsTotal = calculateBestStarsTotal(progressData.bestStarsByLevel);
    const levelsCompleted = getCompletedLevelsCount(
      progressData.completedLevels,
      progressData.bestStarsByLevel,
      progressData.completedLevelCount,
      progressData.levelsCompleted
    );
    const totalLevels = getTotalLevels(progressData.totalLevels);
    const started =
      progressData.started === true || levelsCompleted > 0 || typeof progressData.lastPlayedAt !== "undefined";
    const progressStatus = resolveProgressStatus(progressData.progressStatus, started, levelsCompleted, totalLevels);
    const totalTimeSpentMs = getTotalTimeSpentMs(
      progressData.totalTimeSpentMs,
      progressData.timeSpentMs,
      progressData.timeSpentSec,
      progressData.durationSec
    );
    const hasResume = checkHasResume(progressData.resume);
    const completionPercent = calculateCompletionPercent(bestStarsTotal, levelsCompleted, totalLevels);

    const summaryData: GameSummaryData = {
      gameId: canonicalGameId,
      progressDocId,
      title: String(progressData.title || meta?.title || canonicalGameId || gameId),
      areaPractised: String(progressData.areaPractised || meta?.areaPractised || "Practice"),
      expertiseArea: String(progressData.expertiseArea || meta?.expertiseArea || "general_english"),
      started,
      totalLevels,
      levelsCompleted,
      progressStatus,
      totalTimeSpentMs,
      lastPlayedAt: progressData.lastPlayedAt || now,
      bestStarsTotal,
      completedLevelCount: levelsCompleted,
      hasResume,
      completionPercent,
      updatedAt: now,
      version: 2,
    };

    try {
      await admin.firestore().doc(`kids/${kidId}/gameSummaries/${gameId}`).set(summaryData, { merge: true });
      logger.info(
        `Summary updated for kid=${kidId}, game=${gameId}: levels=${levelsCompleted}/${totalLevels}, status=${progressStatus}`
      );
    } catch (error) {
      logger.error(`Failed to write summary for kid=${kidId}, game=${gameId}:`, error);
    }
  }
);

function calculateBestStarsTotal(bestStarsByLevel?: Record<string, number>): number {
  if (!bestStarsByLevel) return 0;
  return Object.values(bestStarsByLevel).reduce((sum, stars) => {
    const validStars = typeof stars === "number" && Number.isFinite(stars) ? Math.max(0, stars) : 0;
    return sum + validStars;
  }, 0);
}

function getCompletedLevelsCount(
  completedLevels?: GameProgressData["completedLevels"],
  bestStarsByLevel?: GameProgressData["bestStarsByLevel"],
  completedLevelCountRaw?: GameProgressData["completedLevelCount"],
  levelsCompletedRaw?: GameProgressData["levelsCompleted"]
): number {
  const explicitCount =
    (typeof completedLevelCountRaw === "number" && Number.isFinite(completedLevelCountRaw)
      ? Math.max(0, Math.floor(completedLevelCountRaw))
      : null) ??
    (typeof levelsCompletedRaw === "number" && Number.isFinite(levelsCompletedRaw)
      ? Math.max(0, Math.floor(levelsCompletedRaw))
      : null);
  if (explicitCount !== null) return explicitCount;

  if (Array.isArray(completedLevels)) return completedLevels.length;
  if (typeof completedLevels === "number" && Number.isFinite(completedLevels)) {
    return Math.max(0, Math.floor(completedLevels));
  }
  if (completedLevels && typeof completedLevels === "object") {
    return Object.keys(completedLevels).length;
  }
  if (bestStarsByLevel && typeof bestStarsByLevel === "object") {
    return Object.values(bestStarsByLevel).reduce((count, stars) => {
      const n = typeof stars === "number" && Number.isFinite(stars) ? stars : 0;
      return count + (n > 0 ? 1 : 0);
    }, 0);
  }
  return 0;
}

function getTotalLevels(totalLevelsRaw?: GameProgressData["totalLevels"]): number {
  if (typeof totalLevelsRaw === "number" && Number.isFinite(totalLevelsRaw)) {
    return Math.max(0, Math.floor(totalLevelsRaw));
  }
  return 0;
}

function getTotalTimeSpentMs(
  totalTimeSpentMsRaw?: GameProgressData["totalTimeSpentMs"],
  timeSpentMsRaw?: GameProgressData["timeSpentMs"],
  timeSpentSecRaw?: GameProgressData["timeSpentSec"],
  durationSecRaw?: GameProgressData["durationSec"]
): number {
  if (typeof totalTimeSpentMsRaw === "number" && Number.isFinite(totalTimeSpentMsRaw)) {
    return Math.max(0, Math.floor(totalTimeSpentMsRaw));
  }
  if (typeof timeSpentMsRaw === "number" && Number.isFinite(timeSpentMsRaw)) {
    return Math.max(0, Math.floor(timeSpentMsRaw));
  }
  if (typeof timeSpentSecRaw === "number" && Number.isFinite(timeSpentSecRaw)) {
    return Math.max(0, Math.floor(timeSpentSecRaw * 1000));
  }
  if (typeof durationSecRaw === "number" && Number.isFinite(durationSecRaw)) {
    return Math.max(0, Math.floor(durationSecRaw * 1000));
  }
  return 0;
}

function checkHasResume(resume?: GameProgressData["resume"]): boolean {
  if (!resume) return false;
  const hasRound = typeof resume.round === "number" && resume.round > 0;
  const hasStars = typeof resume.stars === "number" && resume.stars > 0;
  return hasRound || hasStars;
}

function resolveProgressStatus(
  raw: string | undefined,
  started: boolean,
  levelsCompleted: number,
  totalLevels: number
): ProgressStatus {
  const normalized = String(raw || "").trim().toLowerCase();
  if (normalized === "not_started") return "not_started";
  if (normalized === "getting_started") return "getting_started";
  if (normalized === "in_progress") return "in_progress";
  if (normalized === "progressing") return "progressing";
  if (normalized === "completed") return "completed";

  if (!started && levelsCompleted <= 0) return "not_started";
  if (totalLevels > 0 && levelsCompleted >= totalLevels) return "completed";
  if (levelsCompleted <= 0) return "getting_started";
  if (totalLevels > 0 && levelsCompleted / totalLevels >= 0.5) return "progressing";
  return "in_progress";
}

function calculateCompletionPercent(bestStarsTotal: number, levelsCompleted: number, totalLevels: number): number {
  if (totalLevels > 0) {
    const byLevels = (Math.max(0, levelsCompleted) / totalLevels) * 100;
    return Math.min(100, Math.max(0, byLevels));
  }
  if (bestStarsTotal <= 0) return 0;
  const percent = (bestStarsTotal / MAX_POSSIBLE_STARS) * 100;
  return Math.min(100, Math.max(0, percent));
}
