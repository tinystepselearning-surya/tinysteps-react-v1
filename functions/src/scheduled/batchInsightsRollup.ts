import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { normalizeGameIdentity } from "../games/helpers/normalizeGameIdentity";

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
  pointsEarned?: number;
  points?: number;
  score?: number;

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

type CatalogGame = {
  gameId: string;
  title: string;
  areaPractised: string;
  totalLevels: number;
  order: number;
};

type RecommendationReasonCode = "resume" | "start" | "review";

type RecommendationCandidate = {
  gameId: string;
  title: string;
  areaPractised: string;
  totalLevels: number;
  levelsCompleted: number;
  completionPercent: number;
  progressStatus: "not_started" | "getting_started" | "in_progress" | "progressing" | "completed";
  lastPlayedAtMs: number;
  totalTimeSpentMs: number;
  order: number;
  hasCanonicalSignal: boolean;
};

type JourneyStageDefinition = {
  id: number;
  gameIds: string[];
};

type JourneyStageScore = {
  stageId: number;
  progressPct: number | null;
  signalCount: number;
};

const JOURNEY_STAGE_DEFINITIONS: JourneyStageDefinition[] = [
  {
    id: 1,
    gameIds: ["letter-tracing", "letter-tracing-sounds", "letter-sound-match", "balloon-pop", "sound-detective"],
  },
  { id: 2, gameIds: ["my-first-words", "cvc-word-builder"] },
  { id: 3, gameIds: ["sentence-stepper"] },
  { id: 4, gameIds: ["story-reading", "comprehension", "new-words"] },
  { id: 5, gameIds: ["build-better-sentences", "grammar-fix", "collocation-builder", "idiom-in-a-sentence"] },
  { id: 6, gameIds: ["speaking-practice", "argument-practice", "presentation-practice"] },
  // Stage 7 is intentionally defined in v2 even if no canonical game docs exist yet.
  // This keeps backend journey semantics aligned with the frontend 7-stage model.
  { id: 7, gameIds: [] },
];

const JOURNEY_STAGE_COUNT = JOURNEY_STAGE_DEFINITIONS.length;

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

function sessionPoints(session: GameSessionData): number {
  const raw =
    typeof session.pointsEarned === "number"
      ? session.pointsEarned
      : typeof session.points === "number"
      ? session.points
      : typeof session.score === "number"
      ? session.score
      : 0;
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.round(raw));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function stdDev(values: number[]): number {
  if (!Array.isArray(values) || values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => {
      const delta = value - mean;
      return sum + delta * delta;
    }, 0) / values.length;
  return Math.sqrt(variance);
}

function toMs(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toFiniteNumber(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function toCountMaybe(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return null;
}

function firstString(...values: any[]): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizeRecommendationStatus(value: any): RecommendationCandidate["progressStatus"] | null {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "not_started") return "not_started";
  if (raw === "getting_started") return "getting_started";
  if (raw === "in_progress") return "in_progress";
  if (raw === "progressing") return "progressing";
  if (raw === "completed") return "completed";
  return null;
}

function deriveRecommendationStatus(
  started: boolean,
  levelsCompleted: number,
  totalLevels: number
): RecommendationCandidate["progressStatus"] {
  if (!started && levelsCompleted <= 0) return "not_started";
  if (totalLevels > 0 && levelsCompleted >= totalLevels) return "completed";
  if (levelsCompleted <= 0) return "getting_started";
  if (totalLevels > 0 && levelsCompleted / totalLevels >= 0.5) return "progressing";
  return "in_progress";
}

function resolveDocLevelsCompleted(doc: Record<string, any> | null | undefined): number | null {
  if (!doc || typeof doc !== "object") return null;
  const candidates = [
    toCountMaybe(doc.levelsCompleted),
    toCountMaybe(doc.completedLevelCount),
    toCountMaybe(doc.completedLevels),
    toCountMaybe(doc.completedItems),
    toCountMaybe(doc.masteredCount),
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number") return candidate;
  }
  return null;
}

function resolveDocTotalLevels(doc: Record<string, any> | null | undefined): number | null {
  if (!doc || typeof doc !== "object") return null;
  const candidates = [
    toCountMaybe(doc.totalLevels),
    toCountMaybe(doc.levelCount),
    toCountMaybe(doc.totalItems),
    toCountMaybe(doc.totalCount),
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number") return candidate;
  }
  return null;
}

function resolveDocTimeSpentMs(doc: Record<string, any> | null | undefined): number | null {
  if (!doc || typeof doc !== "object") return null;
  const directMs = [
    toFiniteNumber(doc.totalTimeSpentMs),
    toFiniteNumber(doc.timeSpentMs),
    toFiniteNumber(doc.totalTimeMs),
    toFiniteNumber(doc.durationMs),
  ].find((value): value is number => typeof value === "number");
  if (typeof directMs === "number") return Math.max(0, Math.floor(directMs));
  const seconds = [
    toFiniteNumber(doc.timeSpentSec),
    toFiniteNumber(doc.durationSec),
  ].find((value): value is number => typeof value === "number");
  if (typeof seconds === "number") return Math.max(0, Math.floor(seconds * 1000));
  return null;
}

function canonicalGameId(rawGameId: any, rawProgressDocId: any): string {
  const gameId = String(rawGameId || "").trim();
  const progressDocId = String(rawProgressDocId || "").trim();
  const normalized = normalizeGameIdentity(gameId || progressDocId, progressDocId || gameId);
  return String(normalized.gameId || gameId || progressDocId || "").trim();
}

function docFreshnessMs(doc: Record<string, any>): number {
  if (!doc || typeof doc !== "object") return 0;
  return Math.max(
    toMs(doc.updatedAt),
    toMs(doc.lastPlayedAt),
    toMs(doc.lastUpdatedAt),
    toMs(doc.createdAt)
  );
}

function buildCanonicalDocMap(
  docs: admin.firestore.QueryDocumentSnapshot[],
  { excludeOverview = false }: { excludeOverview?: boolean } = {}
): Map<string, Record<string, any>> {
  const out = new Map<string, Record<string, any>>();
  const freshness = new Map<string, number>();
  for (const snap of docs) {
    // __overview is an aggregate intelligence doc, not a per-game coverage signal.
    if (excludeOverview && snap.id === "__overview") continue;
    const row = (snap.data() || {}) as Record<string, any>;
    const canonicalId = canonicalGameId(row.gameId || snap.id, row.progressDocId || snap.id);
    if (!canonicalId) continue;
    const nextFreshness = docFreshnessMs(row);
    const prevFreshness = freshness.get(canonicalId) ?? -1;
    if (!out.has(canonicalId) || nextFreshness >= prevFreshness) {
      out.set(canonicalId, row);
      freshness.set(canonicalId, nextFreshness);
    }
  }
  return out;
}

function normalizeCatalogGames(catalogData: any): CatalogGame[] {
  const games = catalogData?.games;
  const entries: Array<[string, any]> = Array.isArray(games)
    ? games
        .map((game) => {
          const id = String(game?.id || game?.gameId || "").trim();
          return [id, game] as [string, any];
        })
        .filter(([id]) => !!id)
    : Object.entries(games && typeof games === "object" ? games : {});

  const map = new Map<string, CatalogGame>();
  for (const [id, row] of entries) {
    const canonicalId = canonicalGameId(id, id);
    if (!canonicalId) continue;
    if (row?.active === false) continue;
    const order =
      typeof row?.order === "number" && Number.isFinite(row.order)
        ? row.order
        : Number.MAX_SAFE_INTEGER;
    const totalLevels =
      typeof row?.totalLevels === "number" && Number.isFinite(row.totalLevels)
        ? Math.max(0, Math.floor(row.totalLevels))
        : 0;
    const game: CatalogGame = {
      gameId: canonicalId,
      title: firstString(row?.title, canonicalId) || canonicalId,
      areaPractised: firstString(row?.areaPractised, row?.subtitle, row?.description, "Practice") || "Practice",
      totalLevels,
      order,
    };
    const existing = map.get(canonicalId);
    if (!existing || game.order < existing.order) {
      map.set(canonicalId, game);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

function buildRecommendationCandidate({
  catalogGame,
  summaryDoc,
  progressDoc,
}: {
  catalogGame: CatalogGame;
  summaryDoc: Record<string, any> | null;
  progressDoc: Record<string, any> | null;
}): RecommendationCandidate {
  const levelsCompleted =
    resolveDocLevelsCompleted(summaryDoc) ??
    resolveDocLevelsCompleted(progressDoc) ??
    0;
  const totalLevels =
    resolveDocTotalLevels(summaryDoc) ??
    resolveDocTotalLevels(progressDoc) ??
    catalogGame.totalLevels;
  const completionPercentRaw =
    toFiniteNumber(summaryDoc?.completionPercent) ??
    (totalLevels > 0 ? (levelsCompleted / totalLevels) * 100 : 0);
  const completionPercent = clampPercent(completionPercentRaw);
  const status =
    normalizeRecommendationStatus(summaryDoc?.progressStatus) ??
    normalizeRecommendationStatus(progressDoc?.progressStatus) ??
    deriveRecommendationStatus(
      Boolean(summaryDoc?.started) || Boolean(progressDoc?.started) || levelsCompleted > 0,
      levelsCompleted,
      totalLevels
    );
  const lastPlayedAtMs = Math.max(toMs(summaryDoc?.lastPlayedAt), toMs(progressDoc?.lastPlayedAt));
  const totalTimeSpentMs =
    resolveDocTimeSpentMs(summaryDoc) ??
    resolveDocTimeSpentMs(progressDoc) ??
    0;

  return {
    gameId: catalogGame.gameId,
    title: firstString(summaryDoc?.title, progressDoc?.title, catalogGame.title) || catalogGame.gameId,
    areaPractised:
      firstString(
        summaryDoc?.areaPractised,
        progressDoc?.areaPractised,
        summaryDoc?.expertiseArea,
        progressDoc?.expertiseArea,
        catalogGame.areaPractised
      ) || "Practice",
    totalLevels: Math.max(0, Math.floor(totalLevels)),
    levelsCompleted: Math.max(0, Math.floor(levelsCompleted)),
    completionPercent,
    progressStatus: status,
    lastPlayedAtMs,
    totalTimeSpentMs: Math.max(0, Math.floor(totalTimeSpentMs)),
    order: catalogGame.order,
    hasCanonicalSignal: Boolean(summaryDoc) || Boolean(progressDoc),
  };
}

function chooseRecommendedNext({
  candidates,
  lastGameId,
}: {
  candidates: RecommendationCandidate[];
  lastGameId: string;
}): { candidate: RecommendationCandidate; reasonCode: RecommendationReasonCode } | null {
  if (!candidates.length) return null;

  const withRemaining = (candidate: RecommendationCandidate) => {
    if (candidate.totalLevels > 0) {
      return Math.max(0, candidate.totalLevels - candidate.levelsCompleted);
    }
    return Math.max(0, 100 - candidate.completionPercent);
  };

  const resume = candidates
    .filter(
      (candidate) =>
        (candidate.progressStatus === "getting_started" ||
          candidate.progressStatus === "in_progress" ||
          candidate.progressStatus === "progressing")
    )
    .sort((a, b) => {
      const remainingDiff = withRemaining(b) - withRemaining(a);
      if (remainingDiff !== 0) return remainingDiff;
      if (a.lastPlayedAtMs !== b.lastPlayedAtMs) return a.lastPlayedAtMs - b.lastPlayedAtMs;
      const aHead = a.gameId === lastGameId ? 1 : 0;
      const bHead = b.gameId === lastGameId ? 1 : 0;
      if (aHead !== bHead) return bHead - aHead;
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
  if (resume.length > 0) {
    return { candidate: resume[0], reasonCode: "resume" };
  }

  const start = candidates
    .filter(
      (candidate) =>
        candidate.progressStatus === "not_started" ||
        !candidate.hasCanonicalSignal
    )
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
  if (start.length > 0) {
    return { candidate: start[0], reasonCode: "start" };
  }

  const review = candidates
    .filter((candidate) => candidate.progressStatus === "completed")
    .sort((a, b) => {
      if (a.lastPlayedAtMs !== b.lastPlayedAtMs) return a.lastPlayedAtMs - b.lastPlayedAtMs;
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
  if (review.length > 0) {
    return { candidate: review[0], reasonCode: "review" };
  }

  return null;
}

function recommendationReasonText(reasonCode: RecommendationReasonCode, candidate: RecommendationCandidate): string {
  if (reasonCode === "resume") {
    return `Continue ${candidate.title} to build ${candidate.areaPractised} and finish remaining levels.`;
  }
  if (reasonCode === "start") {
    return `Start ${candidate.title} to begin ${candidate.areaPractised}.`;
  }
  return `Review ${candidate.title} to keep ${candidate.areaPractised} strong.`;
}

function recommendationMinutes(reasonCode: RecommendationReasonCode, candidate: RecommendationCandidate): number {
  if (candidate.totalTimeSpentMs > 0 && candidate.levelsCompleted > 0) {
    const avgLevelMin = candidate.totalTimeSpentMs / Math.max(1, candidate.levelsCompleted) / 60000;
    const remainingLevels =
      candidate.totalLevels > 0
        ? Math.max(1, candidate.totalLevels - candidate.levelsCompleted)
        : 1;
    const targetLevels = Math.max(1, Math.min(3, remainingLevels));
    const estimate = Math.round(avgLevelMin * targetLevels);
    return Math.max(3, Math.min(12, Number.isFinite(estimate) ? estimate : 0));
  }
  if (reasonCode === "resume") return 6;
  if (reasonCode === "start") return 5;
  return 4;
}

function resolveDocCompletionPercent(
  summaryDoc: Record<string, any> | null | undefined,
  progressDoc: Record<string, any> | null | undefined
): number | null {
  const direct = toFiniteNumber(summaryDoc?.completionPercent);
  if (typeof direct === "number") return clampPercent(direct);

  const levelsCompleted =
    resolveDocLevelsCompleted(summaryDoc) ??
    resolveDocLevelsCompleted(progressDoc) ??
    0;
  const totalLevels =
    resolveDocTotalLevels(summaryDoc) ??
    resolveDocTotalLevels(progressDoc) ??
    0;
  if (totalLevels > 0) {
    return clampPercent((levelsCompleted / totalLevels) * 100);
  }

  const status =
    normalizeRecommendationStatus(summaryDoc?.progressStatus) ??
    normalizeRecommendationStatus(progressDoc?.progressStatus);
  if (status === "completed") return 100;
  if (status === "not_started") return 0;
  if (status === "getting_started") return 15;
  if (status === "in_progress") return 40;
  if (status === "progressing") return 70;
  return null;
}

function resolveDocWeight(
  summaryDoc: Record<string, any> | null | undefined,
  progressDoc: Record<string, any> | null | undefined
): number {
  const totalLevels =
    resolveDocTotalLevels(summaryDoc) ??
    resolveDocTotalLevels(progressDoc) ??
    null;
  if (typeof totalLevels === "number" && Number.isFinite(totalLevels) && totalLevels > 0) {
    return Math.max(1, Math.floor(totalLevels));
  }
  return 1;
}

function scoreJourneyStages({
  summariesByGame,
  progressByGame,
}: {
  summariesByGame: Map<string, Record<string, any>>;
  progressByGame: Map<string, Record<string, any>>;
}): JourneyStageScore[] {
  return JOURNEY_STAGE_DEFINITIONS.map((stage) => {
    let weightedSum = 0;
    let weightTotal = 0;
    let signalCount = 0;

    for (const rawGameId of stage.gameIds) {
      const gameId = canonicalGameId(rawGameId, rawGameId);
      const summaryDoc = summariesByGame.get(gameId) || null;
      const progressDoc = progressByGame.get(gameId) || null;
      if (!summaryDoc && !progressDoc) continue;

      const percent = resolveDocCompletionPercent(summaryDoc, progressDoc);
      if (typeof percent !== "number") continue;
      const weight = resolveDocWeight(summaryDoc, progressDoc);
      weightedSum += percent * weight;
      weightTotal += weight;
      signalCount += 1;
    }

    const progressPct =
      signalCount > 0 && weightTotal > 0
        ? clampPercent(weightedSum / weightTotal)
        : null;

    return {
      stageId: stage.id,
      progressPct,
      signalCount,
    };
  });
}

function pickJourneyStage(scores: JourneyStageScore[]): { currentStageId: number; stageProgressPct: number } | null {
  if (!scores.length) return null;
  for (const score of scores) {
    if (score.progressPct === null) {
      return {
        currentStageId: score.stageId,
        stageProgressPct: 0,
      };
    }
    if (score.progressPct < 100) {
      return {
        currentStageId: score.stageId,
        stageProgressPct: clampPercent(score.progressPct),
      };
    }
  }

  const last = scores[scores.length - 1];
  return {
    currentStageId: last?.stageId || JOURNEY_STAGE_COUNT,
    stageProgressPct: 100,
  };
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
  const catalogSnap = await db.doc("config/gamesCatalog").get();
  const catalogGames = normalizeCatalogGames(catalogSnap.exists ? catalogSnap.data() : null);

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
    const [gameSummariesSnap, gameProgressSnap, activityHeadSnap] = await Promise.all([
      kidRef.collection("gameSummaries").get(),
      kidRef.collection("gameProgress").get(),
      kidRef.collection("activity").doc("head").get(),
    ]);

    let summary = (kidDoc.data()?.summary || {}) as Partial<KidSummary>;
    const existingProgress = (kidDoc.data()?.progress || {}) as any;
    const existingByGame = (existingProgress.byGame || {}) as any;
    const canonicalSummariesByGame = buildCanonicalDocMap(gameSummariesSnap.docs, { excludeOverview: true });
    const canonicalProgressByGame = buildCanonicalDocMap(gameProgressSnap.docs);
    const hasCanonicalRecommendationSignals =
      canonicalSummariesByGame.size > 0 || canonicalProgressByGame.size > 0;
    const activityHead = activityHeadSnap.exists ? (activityHeadSnap.data() as Record<string, any>) : null;

    const existingLT = existingByGame["letter-tracing"] || {};
    const maps = normalizeLetterMaps(existingLT);
    const existingTotalPointsRaw = (kidDoc.data()?.summary || {})?.totalPoints;
    let totalPointsLifetime =
      typeof existingTotalPointsRaw === "number" && Number.isFinite(existingTotalPointsRaw)
        ? Math.max(0, Math.round(existingTotalPointsRaw))
        : 0;

    for (const session of sessions) {
      summary = applySummaryUpdate(summary, session);
      totalPointsLifetime += sessionPoints(session);

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

    const overviewAccuracy10 =
      typeof summary.avgAccuracy10 === "number" && Number.isFinite(summary.avgAccuracy10)
        ? clampPercent(summary.avgAccuracy10)
        : null;
    const overviewSampleCount = Array.isArray(summary.last10Acc)
      ? Math.max(0, Math.min(10, summary.last10Acc.length))
      : 0;
    const overviewAccuracyValues = Array.isArray(summary.last10Acc)
      ? summary.last10Acc
          .map((value) => (typeof value === "number" && Number.isFinite(value) ? clampPercent(value) : null))
          .filter((value): value is number => typeof value === "number")
          .slice(0, 10)
      : [];
    const confidenceSampleCount = overviewAccuracyValues.length;
    let confidenceNow: number | null = null;
    if (confidenceSampleCount >= 3) {
      const base = overviewAccuracyValues.reduce((sum, value) => sum + value, 0) / confidenceSampleCount;
      const consistency = clampPercent(100 - 2 * stdDev(overviewAccuracyValues));
      confidenceNow = Math.round(0.75 * base + 0.25 * consistency);
    }
    let recommendedNext: Record<string, unknown> | null = null;
    if (hasCanonicalRecommendationSignals && catalogGames.length > 0) {
      const candidates = catalogGames.map((catalogGame) =>
        buildRecommendationCandidate({
          catalogGame,
          summaryDoc: canonicalSummariesByGame.get(catalogGame.gameId) || null,
          progressDoc: canonicalProgressByGame.get(catalogGame.gameId) || null,
        })
      );
      const lastGameId = canonicalGameId(activityHead?.lastGameId, activityHead?.lastProgressDocId);
      const selected = chooseRecommendedNext({ candidates, lastGameId });
      if (selected) {
        recommendedNext = {
          gameId: selected.candidate.gameId,
          reason: recommendationReasonText(selected.reasonCode, selected.candidate),
          estMinutes: recommendationMinutes(selected.reasonCode, selected.candidate),
          source: "scheduled_rollup",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          modelVersion: 1,
          reasonCode: selected.reasonCode,
        };
      }
    }
    const journeyStageScores = scoreJourneyStages({
      summariesByGame: canonicalSummariesByGame,
      progressByGame: canonicalProgressByGame,
    });
    const journeySignalCount = journeyStageScores.reduce((sum, stage) => sum + stage.signalCount, 0);
    const hasFoundationalJourneySignal = (journeyStageScores[0]?.signalCount ?? 0) > 0;
    const journeyData =
      journeySignalCount >= 3 && hasFoundationalJourneySignal
        ? pickJourneyStage(journeyStageScores)
        : null;
    // Parent Overview intelligence lives in gameSummaries/__overview; it is not a playable game doc.
    const overviewSummaryRef = db.collection("kids").doc(kidId).collection("gameSummaries").doc("__overview");

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

    const overviewPayload: Record<string, unknown> = {
      totalPointsLifetime,
      totalPointsSource: "scheduled_rollup",
      lastSessionAt: summary.lastPlayedAt || admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      version: 1,
    };
    if (overviewAccuracy10 !== null) {
      overviewPayload.learningLevelAccuracy10 = Math.round(overviewAccuracy10 * 100) / 100;
      overviewPayload.learningLevelSampleCount = overviewSampleCount;
      overviewPayload.learningLevelWindow = "last_10_sessions";
      overviewPayload.source = "scheduled_rollup";
    }
    if (confidenceNow !== null) {
      overviewPayload.confidenceNow = confidenceNow;
      overviewPayload.confidenceSource = "scheduled_rollup";
      overviewPayload.confidenceSampleCount = confidenceSampleCount;
      overviewPayload.confidenceWindow = "last_10_sessions";
      overviewPayload.confidenceModelVersion = 1;
      overviewPayload.confidenceLastSessionAt = summary.lastPlayedAt || admin.firestore.Timestamp.now();
    }
    if (recommendedNext) {
      overviewPayload.recommendedNext = recommendedNext;
    }
    if (journeyData) {
      overviewPayload.journeyCurrentStageId = Math.max(
        1,
        Math.min(JOURNEY_STAGE_COUNT, Math.round(journeyData.currentStageId))
      );
      overviewPayload.journeyStageProgressPct = clampPercent(journeyData.stageProgressPct);
      overviewPayload.journeySource = "scheduled_rollup";
      overviewPayload.journeyModelVersion = 2;
      overviewPayload.journeySignalCount = journeySignalCount;
      overviewPayload.journeyUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    batch.set(overviewSummaryRef, overviewPayload, { merge: true });

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
    region: "asia-south1",
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
    region: "asia-south1",
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
    region: "asia-south1",
  },
  async () => {
    const db = admin.firestore();
    await runBatchInsightsRollup("11pm", db);
  }
);
