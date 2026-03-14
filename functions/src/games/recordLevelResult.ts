import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { normalizeGameIdentity } from "./helpers/normalizeGameIdentity";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

type TagDelta = { attempts?: number; correct?: number; wrong?: number };
type SkillResult = { tag: string; attempts: number; correct: number; wrong: number };

type CatalogStatus = {
  cached: boolean;
  checked: boolean;
  patched: boolean;
  patchedPaths?: string[];
  reason?: string;
};

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
        tag: String(r?.tag ?? r?.id ?? "").trim(),
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
        tag: String(tag || "").trim(),
        attempts: safeNum(v?.attempts ?? 0),
        correct: safeNum(v?.correct ?? 0),
        wrong: safeNum(v?.wrong ?? 0),
      }))
      .filter((r: SkillResult) => !!r.tag);
  }

  // 3) If skillTags exists, create minimal results
  const tags = Array.isArray(data?.skillTags) ? data.skillTags : [];
  return tags
    .map((t: any): SkillResult => ({
      tag: String(t).trim(),
      attempts: 1,
      correct: 1,
      wrong: 0,
    }))
    .filter((r: SkillResult) => !!r.tag);
}

// Merge duplicate tags (safe if client sends duplicates)
function mergeSkillResults(list: SkillResult[]): SkillResult[] {
  const map = new Map<string, SkillResult>();
  for (const r of list || []) {
    const tag = String(r?.tag || "").trim();
    if (!tag) continue;

    const prev = map.get(tag);
    if (!prev) {
      map.set(tag, {
        tag,
        attempts: safeNum(r.attempts, 0),
        correct: safeNum(r.correct, 0),
        wrong: safeNum(r.wrong, 0),
      });
      continue;
    }

    prev.attempts += safeNum(r.attempts, 0);
    prev.correct += safeNum(r.correct, 0);
    prev.wrong += safeNum(r.wrong, 0);
  }
  return Array.from(map.values()).filter((r) => !!r.tag);
}

function sumTotals(skillResults: SkillResult[]) {
  return skillResults.reduce(
    (acc, r) => {
      acc.attempts += safeNum(r.attempts, 0);
      acc.correct += safeNum(r.correct, 0);
      acc.wrong += safeNum(r.wrong, 0);
      return acc;
    },
    { attempts: 0, correct: 0, wrong: 0 }
  );
}

// Flexible “linked user” check for your kid doc
function isAllowedForKidDoc(kidData: any, uid: string): boolean {
  if (!kidData || !uid) return false;

  const direct = [
    kidData.uid,
    kidData.ownerUid,
    kidData.parentUid,
    kidData.teacherUid,
    kidData.learningPartnerUid,
    kidData.createdBy,
  ]
    .filter(Boolean)
    .map(String);

  if (direct.includes(uid)) return true;

  const arrays = [
    kidData.parentIds,
    kidData.teacherIds,
    kidData.learningPartnerIds,
    kidData.adminIds,
    kidData.allowedUids,
  ];

  for (const a of arrays) {
    if (Array.isArray(a) && a.map(String).includes(uid)) return true;
  }

  return false;
}

function isAlreadyExistsErr(err: any): boolean {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return (
    code.includes("already-exists") ||
    code.includes("ALREADY_EXISTS") ||
    msg.includes("already exists") ||
    msg.includes("already-exists")
  );
}

/**
 * recordLevelResult (Callable)
 * ✅ region: asia-south1 (matches client)
 * ✅ permission check: only linked users (or admin claim) can write kid sessions
 * ✅ writes: kids/{kidId}/gameSessions/{eventId}
 * ✅ stores BOTH durationSec and timeSpentSec for compatibility
 * ✅ accepts accuracy OR accuracyPct, durationSec OR timeSpentSec/timeSpentMs
 * ✅ idempotent via doc.create()
 * ✅ returns shape expected by your client wrapper
 */
export const recordLevelResult = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

  const data = (request.data ?? {}) as any;

  // Required identifiers
  const eventId = String(data.eventId || "").trim();
  const kidId = String(data.kidId || "").trim();
  const rawGameId = String(data.gameId || "").trim();
  const rawProgressDocId = String(data.progressDocId || data.gameId || "").trim();
  const { gameId, progressDocId } = normalizeGameIdentity(rawGameId, rawProgressDocId);
  const levelId = data.levelId;

  if (!eventId) throw new HttpsError("invalid-argument", "Missing eventId");
  if (!kidId) throw new HttpsError("invalid-argument", "Missing kidId");
  if (!gameId) throw new HttpsError("invalid-argument", "Missing gameId");
  if (!progressDocId) throw new HttpsError("invalid-argument", "Missing progressDocId");
  if (levelId === undefined || levelId === null) throw new HttpsError("invalid-argument", "Missing levelId");

  // Basic guardrails (prevents abuse)
  if (eventId.length > 200) throw new HttpsError("invalid-argument", "eventId too long");
  if (kidId.length > 200) throw new HttpsError("invalid-argument", "kidId too long");
  if (gameId.length > 120) throw new HttpsError("invalid-argument", "gameId too long");
  if (progressDocId.length > 120) throw new HttpsError("invalid-argument", "progressDocId too long");

  const schemaVersion = safeNum(data.schemaVersion, 1);
  if (schemaVersion !== 1) throw new HttpsError("invalid-argument", "schemaVersion must be 1");

  // ✅ Permission check (Callable bypasses Firestore rules, so we must do it here)
  const uid = request.auth.uid;
  const isAdminClaim = Boolean((request.auth.token as any)?.admin) || String((request.auth.token as any)?.role || "") === "admin";

  if (!isAdminClaim) {
    const kidRef = db.doc(`kids/${kidId}`);
    const kidSnap = await kidRef.get();
    if (!kidSnap.exists) throw new HttpsError("not-found", "Kid not found");

    const kidData = kidSnap.data() as any;
    if (!isAllowedForKidDoc(kidData, uid)) {
      throw new HttpsError("permission-denied", "Not allowed to record results for this child");
    }
  }

  // Skill results (normalized + merged)
  const rawSkillResults = normalizeSkillResults(data);
  const skillResults = mergeSkillResults(rawSkillResults);

  // Optional safety cap (avoid huge payload writes)
  if (skillResults.length > 500) {
    throw new HttpsError("invalid-argument", "Too many skillResults (max 500)");
  }

  // Compute totals from merged skillResults (used as fallback)
  const totals = sumTotals(skillResults);

  const attempts = safeNum(data.attempts, totals.attempts || 1);
  const correct = safeNum(data.correct, Number.isFinite(totals.correct) ? totals.correct : 0);
  const wrong = safeNum(data.wrong, Number.isFinite(totals.wrong) ? totals.wrong : 0);

  // Accuracy: prefer payload, else compute from correct/attempts
  const accuracyFromPayload = safeNum(data.accuracy, safeNum(data.accuracyPct, NaN));
  const accuracy =
    Number.isFinite(accuracyFromPayload)
      ? clamp01to100(accuracyFromPayload)
      : attempts > 0
        ? clamp01to100((correct / Math.max(1, attempts)) * 100)
        : 0;

  // Time spent: accept timeSpentSec, else durationSec, else timeSpentMs
  const timeSpentSec = safeNum(
    data.timeSpentSec,
    safeNum(
      data.durationSec,
      data.timeSpentMs ? Math.round(safeNum(data.timeSpentMs) / 1000) : 0
    )
  );

  const pointsEarned = safeNum(data.pointsEarned, safeNum(data.points, safeNum(data.score, 0)));
  const completed = typeof data.completed === "boolean" ? data.completed : true;

  const completedAt =
    typeof data.completedAt === "number" && Number.isFinite(data.completedAt) ? data.completedAt : Date.now();

  const skillTags = Array.isArray(data.skillTags)
    ? data.skillTags.map((t: any) => String(t).trim()).filter(Boolean)
    : [];

  const tagDeltas: Record<string, TagDelta> | null =
    data.tagDeltas && typeof data.tagDeltas === "object" ? (data.tagDeltas as Record<string, TagDelta>) : null;

  const masteredItems = Array.isArray(data.masteredItems)
    ? data.masteredItems.map((x: any) => String(x)).filter(Boolean)
    : [];

  const sessionRef = db.doc(`kids/${kidId}/gameSessions/${eventId}`);

  // ✅ Idempotent create (no race). If it exists, treat as success.
  try {
    await sessionRef.create({
      schemaVersion: 1,
      eventId,
      kidId,
      gameId,
      progressDocId,
      levelId,

      completed,
      completedAt,

      accuracy,
      attempts,
      correct,
      wrong,

      // store both names for compatibility with any rollups you already wrote
      timeSpentSec,
      durationSec: timeSpentSec,

      pointsEarned,

      skillTags,
      tagDeltas,
      skillResults,
      masteredItems,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      endedAt: admin.firestore.FieldValue.serverTimestamp(),

      recordedBy: uid,
    });
  } catch (err: any) {
    if (!isAlreadyExistsErr(err)) {
      console.error("[recordLevelResult] create failed:", err);
      throw new HttpsError("internal", "Failed to record level result");
    }

    const catalogStatus: CatalogStatus = {
      cached: false,
      checked: false,
      patched: false,
      reason: "duplicate eventId (idempotent)",
    };

    return {
      success: true,
      progressDocId,
      completedLevelsCount: 0,
      tagsUpdated: 0,
      summaryUpdated: false,
      catalogStatus,
      alreadyExisted: true,
      eventId,
    };
  }

  const catalogStatus: CatalogStatus = {
    cached: false,
    checked: false,
    patched: false,
    reason: "session recorded; rollup runs 3x/day",
  };

  return {
    success: true,
    progressDocId,
    completedLevelsCount: 0, // scheduled rollup computes totals
    tagsUpdated: skillResults.length,
    summaryUpdated: false, // scheduled rollup will update parent summary 3x/day
    catalogStatus,
    eventId,
  };
});
