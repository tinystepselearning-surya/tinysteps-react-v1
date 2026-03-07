/**
 * Tiny Steps Games Engine - Record Level Result
 *
 * Client-side wrapper for submitting level completion results.
 * Calls a Cloud Function (recordLevelResult) via Firebase Functions.
 *
 * This keeps the client code clean and delegates validation/writes to the backend.
 */

import type { LevelResult } from "./types";

/**
 * Catalog patch status
 */
export interface CatalogStatus {
  cached: boolean;
  checked: boolean;
  patched: boolean;
  patchedPaths?: string[];
  reason?: string;
}

/**
 * Response from recordLevelResult Cloud Function
 */
export interface RecordLevelResultResponse {
  success: boolean;
  progressDocId: string;
  completedLevelsCount: number;
  tagsUpdated: number;
  summaryUpdated: boolean;
  catalogStatus: CatalogStatus;
}

/**
 * Record a level result by calling the backend Cloud Function.
 *
 * ✅ Robust to games that don't send tagDeltas (ex: LetterTracingGame).
 * ✅ Maps legacy fields (scorePct/points/timeSpentMs) into the new payload.
 *
 * @param result - Complete level result data
 * @returns Response object with progress details
 * @throws Error if Cloud Function is not deployed or fails
 */
export async function recordLevelResult(
  result: LevelResult
): Promise<RecordLevelResultResponse> {
  try {
    const shouldDebugRecordLevelResult =
      import.meta.env.DEV &&
      typeof window !== "undefined" &&
      (window as any).__TS_DEBUG_GAME_RECORDING__ === true;
    const [{ httpsCallable, getFunctions }, firebase] = await Promise.all([
      import("firebase/functions"),
      import("../../lib/firebaseConfig"),
    ]);

    // IMPORTANT: ensure region matches your deployed functions
    // firebaseConfig should export `app`. If it doesn't, export it there and use it here.
    const functions = getFunctions(firebase.app, "asia-south1");
    const callable = httpsCallable(functions, "recordLevelResult");

    // Generate or retrieve eventId for idempotency
    const storageKey = `ts:eventId:${result.kidId}:${result.gameId}:${result.levelId}`;
    let eventId = (result as any).eventId as string | undefined;

    if (!eventId) {
      eventId =
        sessionStorage.getItem(storageKey) ??
        (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
      sessionStorage.setItem(storageKey, eventId);
    }

    // -----------------------------
    // ✅ Normalize inputs (safe)
    // -----------------------------
    const r: any = result as any;

    // tagDeltas may be missing for some games (ex: Letter Tracing).
    // If missing, build minimal deltas from skillTags (treat as 1 correct attempt each).
    const safeTagDeltas: Record<
      string,
      { attempts: number; correct: number; wrong: number }
    > =
      r.tagDeltas && Object.keys(r.tagDeltas).length > 0
        ? r.tagDeltas
        : Object.fromEntries(
            ((r.skillTags ?? []) as string[]).map((tag) => [
              tag,
              { attempts: 1, correct: 1, wrong: 0 },
            ])
          );

    // Support alternate/legacy names (LetterTracingGame often uses these)
    const accuracy =
      r.accuracyPct ?? r.scorePct ?? 0;

    const pointsEarned =
      r.score ?? r.points ?? 0;

    const timeSpentSec =
      r.durationSec ??
      (typeof r.timeSpentMs === "number" ? Math.round(r.timeSpentMs / 1000) : 0);

    const completed =
      typeof r.completed === "boolean" ? r.completed : true;

    const attempts = Object.values(safeTagDeltas).reduce(
      (sum, td) => sum + (td?.attempts ?? 0),
      0
    );
    const correct = Object.values(safeTagDeltas).reduce(
      (sum, td) => sum + (td?.correct ?? 0),
      0
    );
    const wrong = Object.values(safeTagDeltas).reduce(
      (sum, td) => sum + (td?.wrong ?? 0),
      0
    );

    // Add required fields for backend validation
    const payload = {
      ...result,
      completed,
      schemaVersion: 1 as const,
      eventId,
      progressDocId: result.progressDocId || result.gameId,

      // normalized fields used by backend
      accuracy,
      attempts,
      correct,
      wrong,
      timeSpentSec,
      pointsEarned,

      // normalized skill results
      skillResults: Object.entries(safeTagDeltas).map(([tag, delta]) => ({
        tag,
        attempts: delta.attempts,
        correct: delta.correct,
        wrong: delta.wrong,
      })),
    };

    // Ensure resume/lastPos timestamp is present when lastPos is provided
    if ((r as any).lastPos) {
      (payload as any).lastPos = (r as any).lastPos;
      (payload as any).lastPosUpdatedAt = (r as any).lastPosUpdatedAt ?? Date.now();
    }

    if (shouldDebugRecordLevelResult) {
      console.debug("[recordLevelResult] sending", {
        kidId: result.kidId,
        gameId: result.gameId,
        levelId: result.levelId,
        eventId,
        schemaVersion: 1,
      });
    }

    const response = await callable(payload);
    const data = response.data as RecordLevelResultResponse;

    if (!data?.success) {
      throw new Error("Failed to record level result");
    }

    // Clear eventId on success (idempotency complete)
    sessionStorage.removeItem(storageKey);

    if (shouldDebugRecordLevelResult) {
      console.debug("[recordLevelResult] Level result recorded successfully:", {
        gameId: result.gameId,
        levelId: result.levelId,
        completed,
        progressDocId: data.progressDocId,
        completedLevelsCount: data.completedLevelsCount,
        tagsUpdated: data.tagsUpdated,
        catalogStatus: data.catalogStatus,
      });
    }

    return data;
  } catch (error: any) {
    // Provide helpful error messages for common issues
    if (error?.code === "functions/not-found") {
      throw new Error(
        'Cloud Function "recordLevelResult" not found in asia-south1. ' +
          "Please deploy backend functions (asia-south1) before using game recording."
      );
    }

    console.error("[recordLevelResult] Failed to record level result:", error);
    throw error;
  }
}
