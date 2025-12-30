import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

type TagDelta = { attempts?: number; correct?: number; wrong?: number };
type SkillResult = { tag: string; attempts: number; correct: number; wrong: number };

function safeNum(v: any, d = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}

function clamp01to100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function normalizeSkillResults(data: any): SkillResult[] {
  // 1) If skillResults exists and is array, normalize it
  if (Array.isArray(data?.skillResults)) {
    return data.skillResults
      .map((r: any): SkillResult => ({
        tag: String(r?.tag ?? r?.id ?? ""),
        attempts: safeNum(r?.attempts ?? r?.tries ?? 0),
        correct: safeNum(r?.correct ?? r?.right ?? 0),
        wrong: safeNum(r?.wrong ?? r?.incorrect ?? 0),
      }))
      .filter((r: SkillResult) => !!r.tag);
  }

  // 2) If tagDeltas exists, convert it
  const td = data?.tagDeltas;
  if (td && typeof td === "object") {
    return Object.entries(td)
      .map(([tag, v]: [string, any]): SkillResult => ({
        tag: String(tag || ""),
        attempts: safeNum(v?.attempts ?? 0),
        correct: safeNum(v?.correct ?? 0),
        wrong: safeNum(v?.wrong ?? 0),
      }))
      .filter((r: SkillResult) => !!r.tag);
  }

  // 3) If skillTags exists, create minimal results
  const tags = Array.isArray(data?.skillTags) ? data.skillTags : [];
  return tags
    .map((t: any): SkillResult => ({ tag: String(t), attempts: 1, correct: 1, wrong: 0 }))
    .filter((r: SkillResult) => !!r.tag);
}

/**
 * recordLevelResult (Callable)
 * ✅ Writes session to: kids/{kidId}/gameSessions/{eventId}
 * ✅ Adds createdAt + endedAt + durationSec (what rollups expect)
 * ✅ Accepts either accuracy OR accuracyPct, and durationSec OR timeSpentSec/timeSpentMs
 */
export const recordLevelResult = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

  const data = (request.data ?? {}) as any;

  // Required identifiers
  const eventId = String(data.eventId || "");
  const kidId = String(data.kidId || "");
  const gameId = String(data.gameId || "");
  const progressDocId = String(data.progressDocId || "");
  const levelId = data.levelId;

  if (!eventId) throw new HttpsError("invalid-argument", "Missing eventId");
  if (!kidId) throw new HttpsError("invalid-argument", "Missing kidId");
  if (!gameId) throw new HttpsError("invalid-argument", "Missing gameId");
  if (!progressDocId) throw new HttpsError("invalid-argument", "Missing progressDocId");
  if (levelId === undefined || levelId === null) throw new HttpsError("invalid-argument", "Missing levelId");

  const schemaVersion = safeNum(data.schemaVersion, 1);
  if (schemaVersion !== 1) throw new HttpsError("invalid-argument", "schemaVersion must be 1");

  // Normalize metrics
  const accuracy = clamp01to100(safeNum(data.accuracy, safeNum(data.accuracyPct, 0)));

  const durationSec = safeNum(
    data.durationSec,
    safeNum(
      data.timeSpentSec,
      data.timeSpentMs ? Math.round(safeNum(data.timeSpentMs) / 1000) : 0
    )
  );

  const attempts = safeNum(data.attempts, 1);
  const correct = safeNum(data.correct, 1);
  const wrong = safeNum(data.wrong, 0);

  const pointsEarned = safeNum(data.pointsEarned, safeNum(data.points, safeNum(data.score, 0)));

  const skillTags = Array.isArray(data.skillTags) ? data.skillTags.map((t: any) => String(t)) : [];

  // ✅ Use TagDelta so TS doesn't complain it is unused
  const tagDeltas: Record<string, TagDelta> | undefined =
    data.tagDeltas && typeof data.tagDeltas === "object"
      ? (data.tagDeltas as Record<string, TagDelta>)
      : undefined;

  const skillResults = normalizeSkillResults(data);

  const masteredItems = Array.isArray(data.masteredItems)
    ? data.masteredItems.map((x: any) => String(x)).filter(Boolean)
    : [];

  // ✅ Idempotent per kid
  const sessionRef = db.doc(`kids/${kidId}/gameSessions/${eventId}`);
  const existing = await sessionRef.get();
  if (existing.exists) {
    return { success: true, message: "Session already recorded", eventId };
  }

  await sessionRef.set({
    schemaVersion: 1,
    eventId,
    kidId,
    gameId,
    progressDocId,
    levelId,
    accuracy,
    attempts,
    correct,
    wrong,
    durationSec,
    pointsEarned,
    skillTags,
    tagDeltas: tagDeltas ?? null,
    skillResults,
    masteredItems,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    endedAt: admin.firestore.FieldValue.serverTimestamp(),
    recordedBy: request.auth.uid,
  });

  return { success: true, message: "Level result recorded", eventId };
});
