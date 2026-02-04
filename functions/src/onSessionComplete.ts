// functions/src/onSessionComplete.ts
import * as admin from "firebase-admin";
import * as functionsV1 from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "unknown";

type AttendanceEntry = {
  status?: AttendanceStatus;
  notes?: string;
  mastery?: number;
  topics?: string[];
};

interface SessionData {
  courseId?: string;
  teacherId?: string;
  kidIds?: string[];
  status?: string;

  // NEW: attendance stored directly in the session doc by Teacher UI
  attendance?: Record<string, AttendanceEntry>;

  // Idempotency + lock
  creditsProcessed?: boolean;
  creditsProcessedAt?: admin.firestore.Timestamp;

  creditsProcessing?: boolean;
  creditsProcessingAt?: admin.firestore.Timestamp;
  creditsProcessingBy?: string;
  creditsProcessingError?: string;
}

interface CreditChange {
  kidId: string;
  enrollmentId: string;
  previousRemaining: number;
  newRemaining: number;
  previousUsed: number;
  newUsed: number;
  attendanceStatus: string | null;
}

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes

function nowMs() {
  return Date.now();
}

function toNumber(x: any, fallback = 0) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function clampMin0(n: number) {
  return n < 0 ? 0 : n;
}

async function assertCanFinalizeSession(uid: string, session: SessionData) {
  // Teacher assigned to the session: allowed
  if (session.teacherId && uid === session.teacherId) return;

  // Otherwise allow admin / rm (from Firestore role or claims)
  const db = admin.firestore();

  // Prefer Firestore role
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = userSnap.exists ? (userSnap.data() as any)?.role : null;

  if (role === "admin" || role === "rm") return;

  // Fallback: custom claims (if you use them)
  // (We don’t have the claims here in trigger, so callable checks claims earlier.)
  throw new HttpsError("permission-denied", "Not allowed to finalize this session.");
}

async function acquireProcessingLock(
  sessionRef: admin.firestore.DocumentReference,
  actor: string
): Promise<SessionData> {
  const db = admin.firestore();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists) throw new HttpsError("not-found", "Session not found.");

    const session = snap.data() as SessionData;

    // Already processed => skip
    if (session.creditsProcessed) return session;

    // In-progress lock check
    if (session.creditsProcessing && session.creditsProcessingAt?.toMillis) {
      const ageMs = nowMs() - session.creditsProcessingAt.toMillis();
      if (ageMs < LOCK_TTL_MS) {
        throw new HttpsError(
          "failed-precondition",
          "Credits processing already in progress. Please retry in a minute."
        );
      }
    }

    tx.set(
      sessionRef,
      {
        creditsProcessing: true,
        creditsProcessingAt: admin.firestore.FieldValue.serverTimestamp(),
        creditsProcessingBy: actor,
        creditsProcessingError: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return session;
  });
}

async function releaseLockWithError(
  sessionRef: admin.firestore.DocumentReference,
  errorMessage: string
) {
  await sessionRef.set(
    {
      creditsProcessing: admin.firestore.FieldValue.delete(),
      creditsProcessingAt: admin.firestore.FieldValue.delete(),
      creditsProcessingBy: admin.firestore.FieldValue.delete(),
      creditsProcessingError: errorMessage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function markProcessed(sessionRef: admin.firestore.DocumentReference) {
  await sessionRef.set(
    {
      creditsProcessed: true,
      creditsProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
      creditsProcessing: admin.firestore.FieldValue.delete(),
      creditsProcessingAt: admin.firestore.FieldValue.delete(),
      creditsProcessingBy: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Main processor (shared by trigger + callable)
 */
async function processSessionCompletion(
  sessionId: string,
  opts: { callerUid?: string; enforcePermissions?: boolean }
) {
  const db = admin.firestore();
  const sessionRef = db.collection("sessions").doc(sessionId);
  const caller = opts.callerUid || "trigger";

  // Acquire lock (prevents double-charging trigger+callable)
  const session = await acquireProcessingLock(sessionRef, caller);

  try {
    // If already processed, exit cleanly
    if (session.creditsProcessed) {
      logger.info("processSessionCompletion: already processed, skipping", { sessionId });
      return { success: true, skipped: true, creditsEarnedForTeacher: 0 };
    }

    const { courseId, teacherId } = session;

    if (!courseId || !teacherId) {
      logger.warn("processSessionCompletion: missing core fields", { sessionId, courseId, teacherId });
      await releaseLockWithError(sessionRef, "Missing courseId/teacherId in session.");
      return { success: false, skipped: true, creditsEarnedForTeacher: 0 };
    }

    if (opts.enforcePermissions && opts.callerUid) {
      await assertCanFinalizeSession(opts.callerUid, session);
    }

    // Require completed status (your UI sets status: "completed")
    if (session.status !== "completed") {
      throw new HttpsError(
        "failed-precondition",
        "Session must be marked completed before finalization."
      );
    }

    const attendanceMap = session.attendance || {};
    const kidIdsRaw = Array.isArray(session.kidIds) && session.kidIds.length
      ? session.kidIds
      : Object.keys(attendanceMap);

    const kidIds = Array.from(new Set(kidIdsRaw.filter(Boolean)));

    if (kidIds.length === 0) {
      // Nothing to process, but mark processed to prevent repeats
      await markProcessed(sessionRef);
      return { success: true, skipped: false, creditsEarnedForTeacher: 0 };
    }

    let creditsEarnedForTeacher = 0;
    const creditChanges: CreditChange[] = [];

    for (const kidId of kidIds) {
      const att = attendanceMap[kidId];
      const status = (att?.status || "unknown") as AttendanceStatus;

      // Only decrement credits for present (optionally add "late" here if you want)
      if (status !== "present") continue;

      // Find enrollment for this kid + course
      const enrollmentQuery = await db
        .collection("enrollments")
        .where("kidId", "==", kidId)
        .where("courseId", "==", courseId)
        .limit(1)
        .get();

      if (enrollmentQuery.empty) {
        logger.warn("Enrollment not found", { sessionId, kidId, courseId });
        continue;
      }

      const enrollmentDoc = enrollmentQuery.docs[0];
      const enrollmentRef = enrollmentDoc.ref;

      // Update enrollment safely in a transaction (avoids race conditions)
      const change = await db.runTransaction(async (tx) => {
        const snap = await tx.get(enrollmentRef);
        const enrollment = snap.exists ? snap.data() : {};

        const currentRemaining = toNumber((enrollment as any)?.creditsRemaining, 0);
        const currentUsed = toNumber((enrollment as any)?.creditsUsed, 0);

        const newRemaining = clampMin0(currentRemaining - 1);
        const newUsed = currentUsed + 1;

        tx.update(enrollmentRef, {
          creditsRemaining: newRemaining,
          creditsUsed: newUsed,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: "onSessionComplete",
        });

        // Low-credit alert
        if (newRemaining <= 2) {
          const alertRef = db.collection("alerts").doc();
          tx.set(alertRef, {
            type: "low_credits",
            enrollmentId: enrollmentDoc.id,
            kidId,
            creditsRemaining: newRemaining,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "onSessionComplete",
          });
        }

        return {
          kidId,
          enrollmentId: enrollmentDoc.id,
          previousRemaining: currentRemaining,
          newRemaining,
          previousUsed: currentUsed,
          newUsed,
          attendanceStatus: status || null,
        } as CreditChange;
      });

      creditsEarnedForTeacher++;
      creditChanges.push(change);
    }

    // Mark processed (idempotency)
    await markProcessed(sessionRef);

    // Audit log (non-batched)
    try {
      const auditRef = db.collection("auditLogs").doc();
      await auditRef.set({
        type: "session_completion",
        sessionId,
        courseId,
        teacherId,
        kidIds,
        creditsEarned: creditsEarnedForTeacher,
        creditChanges,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "onSessionComplete",
      });
      logger.info("Session audit log written", {
        sessionId,
        auditLogId: auditRef.id,
        creditsEarnedForTeacher,
      });
    } catch (err) {
      logger.error("Failed to write session audit log", {
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Post-processing (best-effort)
    await Promise.all(
      kidIds.map((kidId) => recomputeStudentSummary(kidId, courseId))
    );

    await accrueTeacherEarnings(teacherId, sessionId, courseId, creditsEarnedForTeacher);

    logger.info("Session completed and processed", {
      sessionId,
      kidCount: kidIds.length,
      creditsEarnedForTeacher,
    });

    return { success: true, skipped: false, creditsEarnedForTeacher };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("processSessionCompletion failed", { sessionId, error: message });

    // release lock so user can retry
    await releaseLockWithError(sessionRef, message);

    // rethrow for callable UX
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Unable to finalize session. Please retry later.");
  }
}

/**
 * Firestore trigger (v1 Gen 1): run when status flips to "completed"
 * Kept as v1 to avoid "Upgrading from 1st Gen to 2nd Gen not supported" error
 */
export const onSessionCompleteTrigger = functionsV1
  .region(REGION)
  .firestore.document("sessions/{sessionId}")
  .onUpdate(async (change, context) => {
    const sessionId = context.params.sessionId as string;
    const before = change.before.data() as SessionData | undefined;
    const after = change.after.data() as SessionData | undefined;

    if (!after) return;

    const becameCompleted =
      (before?.status || "") !== "completed" && (after.status || "") === "completed";

    if (!becameCompleted) return;

    // If already processed, skip quickly
    if (after.creditsProcessed) return;

    try {
      await processSessionCompletion(sessionId, {
        callerUid: after.teacherId,
        enforcePermissions: false, // trigger runs server-side
      });
    } catch (err) {
      logger.error("onSessionCompleteTrigger error", {
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

/**
 * Callable (v2): For manual retry/admin operations only.
 * Teacher UI must NOT auto-call to prevent double-processing.
 */
export const onSessionComplete = onCall(
  {
    region: REGION,
    memory: "256MiB",
    timeoutSeconds: 120,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");

    const sessionId = (request.data?.sessionId || "").toString().trim();
    if (!sessionId) throw new HttpsError("invalid-argument", "sessionId is required.");

    // We don't block here based on claims alone because your system often uses Firestore roles.
    // Permission enforcement happens inside processSessionCompletion().

    const result = await processSessionCompletion(sessionId, {
      callerUid: uid,
      enforcePermissions: true,
    });

    return result;
  }
);

// ---- Helper stubs (keep yours / replace later) ----
async function recomputeStudentSummary(kidId: string, courseId: string) {
  logger.info("Recomputing summary (stub)", { kidId, courseId });
}

async function accrueTeacherEarnings(
  teacherId: string,
  sessionId: string,
  courseId: string,
  creditsEarned: number
) {
  if (!teacherId || creditsEarned <= 0) {
    logger.info("accrueTeacherEarnings: nothing to do", { teacherId, creditsEarned });
    return;
  }

  const db = admin.firestore();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthId = `${year}-${month}`;

  const earningsRef = db
    .collection("teachers")
    .doc(teacherId)
    .collection("earnings")
    .doc(monthId);

  await earningsRef.set(
    {
      teacherId,
      month: monthId,
      sessionsCompleted: admin.firestore.FieldValue.increment(1),
      creditsEarned: admin.firestore.FieldValue.increment(creditsEarned),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSessionId: sessionId,
      lastCourseId: courseId,
    },
    { merge: true }
  );

  logger.info("Teacher earnings updated", { teacherId, monthId, sessionId, creditsEarned });
}
