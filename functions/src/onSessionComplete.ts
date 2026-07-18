// functions/src/onSessionComplete.ts
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";
const ATTENDANCE_OPEN_DELAY_MS = 30 * 60 * 1000;
const ATTENDANCE_CLOSE_WINDOW_MS = 24 * 60 * 60 * 1000;

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "unknown";

type AttendanceEntry = {
  status?: AttendanceStatus;
  notes?: string;
  mastery?: number;
  topics?: string[];
};

interface SessionData {
  enrollmentId?: string;
  courseId?: string;
  teacherId?: string;
  kidIds?: string[];
  kidId?: string;
  studentId?: string;
  status?: string;
  notes?: string;
  date?: string;
  startTime?: string;
  startAt?: unknown;

  // NEW: attendance stored directly in the session doc by Teacher UI
  attendance?: Record<string, AttendanceEntry>;

  // Idempotency + lock
  creditsProcessed?: boolean;
  creditsProcessedAt?: Timestamp;

  creditsProcessing?: boolean;
  creditsProcessingAt?: Timestamp;
  creditsProcessingBy?: string;
  creditsProcessingError?: string;
  revenueAccrued?: boolean;
  locked?: boolean;
  isLocked?: boolean;
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
const COMPLETION_BLOCKED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "reschedule_requested",
  "rescheduled",
  "no_show",
  "noshow",
  "consumed",
  "settled",
  "paid",
  "locked",
]);

const ACTIVE_ENROLLMENT_STATUSES = new Set([
  "trial",
  "active",
  "current",
  "enrolled",
  "ongoing",
  "pending_teacher",
  "pending_payment",
  "paused",
]);

function nowMs() {
  return Date.now();
}

function toNumber(x: any, fallback = 0) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function clampMin0(n: number) {
  return n < 0 ? 0 : n;
}

function normalizeStatus(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function normalizeCallerRole(value: unknown): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "learningpartner") return "learning-partner";
  return raw;
}

function normalizeEnrollmentStatus(value: unknown): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "active";
  if (raw === "canceled") return "cancelled";
  return raw;
}

function getTimestampMillis(value: unknown): number {
  if (value && typeof (value as any).toMillis === "function") {
    return Number((value as any).toMillis()) || 0;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeTimeForIstParse(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return null;
  const seconds = match[3] || "00";
  return `${match[1]}:${match[2]}:${seconds}`;
}

function getSessionStartMillis(session: SessionData): number | null {
  const startAtMs = getTimestampMillis(session.startAt);
  if (startAtMs > 0) return startAtMs;

  const dateYmd = String(session.date || "").trim();
  const startTime = normalizeTimeForIstParse(session.startTime);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
  const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
  return Number.isNaN(parsed) ? null : parsed;
}

function getAttendanceAllowedAtMillis(session: SessionData): number | null {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + ATTENDANCE_OPEN_DELAY_MS;
}

function getAttendanceWindowCloseMillis(session: SessionData): number | null {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + ATTENDANCE_CLOSE_WINDOW_MS;
}

function canCallerOverrideAttendanceTime(role: string): boolean {
  return role === "admin";
}

async function resolveCallerRoleFromAuth(
  auth: { uid?: string; token?: Record<string, unknown> } | null,
): Promise<string> {
  const tokenRole = normalizeCallerRole(auth?.token?.role);
  if (tokenRole) return tokenRole;
  const uid = String(auth?.uid || "").trim();
  if (!uid) return "";
  const userSnap = await admin.firestore().collection("users").doc(uid).get();
  return normalizeCallerRole(userSnap.data()?.role);
}

function resolveEnrollmentKidIds(enrollment: any): string[] {
  const out: string[] = [];
  const pushId = (raw: unknown) => {
    const id = String(raw || "").trim();
    if (id) out.push(id);
  };

  pushId(enrollment?.kidId);
  pushId(enrollment?.studentId);
  if (Array.isArray(enrollment?.kidIds)) {
    enrollment.kidIds.forEach((id: unknown) => pushId(id));
  }
  return Array.from(new Set(out));
}

export type EnrollmentIdentityCandidate = {
  id: string;
  data: Record<string, unknown>;
};

export type LegacyEnrollmentSelection =
  | { ok: true; enrollmentId: string }
  | { ok: false; reason: "missing" | "ambiguous"; candidateIds: string[] };

export type ExactEnrollmentIdentityValidation =
  | { ok: true }
  | { ok: false; reason: "missing" | "course_mismatch" | "kid_mismatch" };

export function validateExactEnrollmentIdentity(
  exists: boolean,
  enrollment: Record<string, unknown> | undefined,
  kidId: string,
  courseId: string
): ExactEnrollmentIdentityValidation {
  if (!exists || !enrollment) return { ok: false, reason: "missing" };
  if (String(enrollment.courseId || "").trim() !== courseId) {
    return { ok: false, reason: "course_mismatch" };
  }
  if (!resolveEnrollmentKidIds(enrollment).includes(kidId)) {
    return { ok: false, reason: "kid_mismatch" };
  }
  return { ok: true };
}

/**
 * Legacy sessions without enrollmentId are accepted only when student + course
 * identity resolves to exactly one operational enrollment. Never guess by
 * recency or status priority: that can move Phonics credits onto Grammar or a
 * replacement enrollment.
 */
export function selectUnambiguousLegacyEnrollment(
  candidates: EnrollmentIdentityCandidate[],
  kidId: string,
  courseId: string
): LegacyEnrollmentSelection {
  const matching = candidates.filter((candidate) => {
    const data = candidate.data as any;
    return String(data?.courseId || "").trim() === courseId &&
      resolveEnrollmentKidIds(data).includes(kidId) &&
      ACTIVE_ENROLLMENT_STATUSES.has(normalizeEnrollmentStatus(data?.status));
  });
  const distinctIds = Array.from(new Set(matching.map((candidate) => candidate.id)));
  if (distinctIds.length === 1) return { ok: true, enrollmentId: distinctIds[0] };
  return {
    ok: false,
    reason: distinctIds.length === 0 ? "missing" : "ambiguous",
    candidateIds: distinctIds,
  };
}

async function queryEnrollmentCandidates(
  db: admin.firestore.Firestore,
  kidId: string,
  courseId: string,
  withStatusFilter: boolean,
  sessionId: string
): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  const candidates = new Map<string, admin.firestore.QueryDocumentSnapshot>();
  const statusList = Array.from(ACTIVE_ENROLLMENT_STATUSES);

  const runQuery = async (
    source: "kidId" | "studentId" | "kidIds",
    baseQuery: admin.firestore.Query
  ) => {
    try {
      const q = withStatusFilter ? baseQuery.where("status", "in", statusList) : baseQuery;
      const snap = await q.limit(10).get();
      snap.docs.forEach((docSnap) => candidates.set(docSnap.id, docSnap));
    } catch (err) {
      if (withStatusFilter) {
        logger.warn("Enrollment candidate query with status filter failed; falling back", {
          sessionId,
          kidId,
          courseId,
          source,
          error: err instanceof Error ? err.message : String(err),
        });
      } else {
        logger.error("Enrollment candidate query failed", {
          sessionId,
          kidId,
          courseId,
          source,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      throw err;
    }
  };

  await runQuery(
    "kidId",
    db.collection("enrollments").where("kidId", "==", kidId).where("courseId", "==", courseId)
  );
  await runQuery(
    "studentId",
    db.collection("enrollments").where("studentId", "==", kidId).where("courseId", "==", courseId)
  );
  await runQuery(
    "kidIds",
    db.collection("enrollments").where("kidIds", "array-contains", kidId).where("courseId", "==", courseId)
  );

  return Array.from(candidates.values());
}

async function resolveEnrollmentForSessionKid(
  db: admin.firestore.Firestore,
  kidId: string,
  courseId: string,
  sessionId: string,
  sessionEnrollmentId?: string
): Promise<admin.firestore.DocumentSnapshot> {
  const exactEnrollmentId = String(sessionEnrollmentId || "").trim();
  if (exactEnrollmentId) {
    const exactSnap = await db.collection("enrollments").doc(exactEnrollmentId).get();
    const exactData = exactSnap.data() as any;
    const exactKidIds = resolveEnrollmentKidIds(exactData);
    const exactCourseId = String(exactData?.courseId || "").trim();
    const validation = validateExactEnrollmentIdentity(
      exactSnap.exists,
      exactData,
      kidId,
      courseId
    );
    if (!validation.ok) {
      logger.error("Session enrollment identity mismatch", {
        integrityEvent: "session_enrollment_identity_mismatch",
        sessionId,
        enrollmentId: exactEnrollmentId,
        kidId,
        courseId,
        enrollmentExists: exactSnap.exists,
        enrollmentCourseId: exactCourseId || null,
        enrollmentKidIds: exactKidIds,
        reason: validation.reason,
      });
      throw new HttpsError(
        "failed-precondition",
        "Session enrollment identity does not match its student and course."
      );
    }
    return exactSnap;
  }

  let candidates: admin.firestore.QueryDocumentSnapshot[] = [];
  let usedFallbackWithoutStatus = false;

  try {
    candidates = await queryEnrollmentCandidates(db, kidId, courseId, true, sessionId);
  } catch {
    usedFallbackWithoutStatus = true;
  }

  if (candidates.length === 0) {
    usedFallbackWithoutStatus = true;
    try {
      candidates = await queryEnrollmentCandidates(db, kidId, courseId, false, sessionId);
    } catch {
      candidates = [];
    }
  }

  const selection = selectUnambiguousLegacyEnrollment(
    candidates.map((candidate) => ({ id: candidate.id, data: candidate.data() })),
    kidId,
    courseId
  );
  if (!selection.ok) {
    logger.error("Legacy session enrollment identity could not be resolved safely", {
      integrityEvent: "legacy_session_enrollment_resolution_failed",
      sessionId,
      kidId,
      courseId,
      reason: selection.reason,
      candidateIds: selection.candidateIds,
      tried: ["kidId", "studentId", "kidIds"],
      usedFallbackWithoutStatus,
    });
    throw new HttpsError(
      "failed-precondition",
      selection.reason === "ambiguous" ?
        "Legacy session matches multiple operational enrollments." :
        "Legacy session has no matching operational enrollment."
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selection.enrollmentId);
  if (!selected) {
    throw new HttpsError("failed-precondition", "Legacy enrollment resolution failed.");
  }
  return selected;
}

function resolveSessionKidIds(session: SessionData): string[] {
  const baseKidIds = Array.isArray(session.kidIds) ? session.kidIds : [];
  const fallbackKidId = session.kidId || session.studentId || null;
  const combined = fallbackKidId ? [...baseKidIds, fallbackKidId] : baseKidIds;
  return Array.from(new Set(combined.map((id) => String(id || "").trim()).filter(Boolean)));
}

function resolveAttendanceEntryStatus(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (value && typeof value === "object" && typeof (value as any).status === "string") {
    return String((value as any).status).trim().toLowerCase();
  }
  return "";
}

function hasRequiredAttendanceForCompletion(
  session: SessionData,
  attendance: Record<string, AttendanceEntry> | null | undefined
): boolean {
  if (!attendance || typeof attendance !== "object") return false;
  const keys = Object.keys(attendance);
  if (keys.length === 0) return false;

  const sessionKidIds = resolveSessionKidIds(session);
  if (sessionKidIds.length === 0) {
    return keys.some((kidId) => resolveAttendanceEntryStatus((attendance as any)[kidId]));
  }

  return sessionKidIds.every((kidId) => resolveAttendanceEntryStatus((attendance as any)[kidId]));
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
        creditsProcessingAt: FieldValue.serverTimestamp(),
        creditsProcessingBy: actor,
        creditsProcessingError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
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
      creditsProcessing: FieldValue.delete(),
      creditsProcessingAt: FieldValue.delete(),
      creditsProcessingBy: FieldValue.delete(),
      creditsProcessingError: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function markProcessed(sessionRef: admin.firestore.DocumentReference) {
  await sessionRef.set(
    {
      creditsProcessed: true,
      creditsProcessedAt: FieldValue.serverTimestamp(),
      creditsProcessing: FieldValue.delete(),
      creditsProcessingAt: FieldValue.delete(),
      creditsProcessingBy: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
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
  const sessionRef = db.collection("classSessions").doc(sessionId);
  const caller = opts.callerUid || "trigger";

  // Acquire lock (prevents double-charging trigger+callable)
  const session = await acquireProcessingLock(sessionRef, caller);

  try {
    // If already processed, exit cleanly
    if (session.creditsProcessed) {
      logger.info("processSessionCompletion: already processed, skipping", { sessionId });
      return { success: true, skipped: true, creditsEarnedForTeacher: 0 };
    }

    const { courseId, teacherId, enrollmentId } = session;

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

      const enrollmentDoc = await resolveEnrollmentForSessionKid(
        db,
        kidId,
        courseId,
        sessionId,
        enrollmentId
      );

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
          updatedAt: FieldValue.serverTimestamp(),
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
            createdAt: FieldValue.serverTimestamp(),
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
        enrollmentId: enrollmentId || creditChanges[0]?.enrollmentId || null,
        courseId,
        teacherId,
        kidIds,
        creditsEarned: creditsEarnedForTeacher,
        creditChanges,
        createdAt: FieldValue.serverTimestamp(),
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
 * Callable (v2): Backend-controlled completion/finalization path.
 * Teacher and admin clients should use this instead of direct client-side
 * `status: "completed"` writes on classSessions.
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

    const incomingAttendance =
      request.data?.attendance && typeof request.data.attendance === "object" && !Array.isArray(request.data.attendance) ?
        (request.data.attendance as Record<string, AttendanceEntry>) :
        null;
    const sessionNotesRaw = typeof request.data?.sessionNotes === "string" ? request.data.sessionNotes : "";
    const sessionNotes = sessionNotesRaw.trim();

    const db = admin.firestore();
    const sessionRef = db.collection("classSessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) throw new HttpsError("not-found", "Session not found.");

    const session = sessionSnap.data() as SessionData;
    await assertCanFinalizeSession(uid, session);
    const callerRole = await resolveCallerRoleFromAuth({
      uid,
      token: (request.auth?.token || {}) as Record<string, unknown>,
    });

    const attendanceAllowedAtMs = getAttendanceAllowedAtMillis(session);
    const attendanceWindowCloseMs = getAttendanceWindowCloseMillis(session);
    if (
      !canCallerOverrideAttendanceTime(callerRole)
    ) {
      if (attendanceAllowedAtMs === null || attendanceWindowCloseMs === null) {
        throw new HttpsError(
          "failed-precondition",
          "Attendance time could not be verified. Please contact admin."
        );
      }
      if (Date.now() < attendanceAllowedAtMs) {
        throw new HttpsError(
          "failed-precondition",
          "Attendance can be marked 30 minutes after class start."
        );
      }
      if (Date.now() > attendanceWindowCloseMs) {
        throw new HttpsError(
          "failed-precondition",
          "Attendance window has closed. Please contact admin to update this attendance."
        );
      }
    }

    const currentStatus = normalizeStatus(session.status);
    if (COMPLETION_BLOCKED_STATUSES.has(currentStatus)) {
      throw new HttpsError(
        "failed-precondition",
        "Session cannot be completed from its current status."
      );
    }
    if (session.creditsProcessing || session.locked || session.isLocked) {
      throw new HttpsError(
        "failed-precondition",
        "Session is currently locked for processing."
      );
    }

    if (session.creditsProcessed === true || session.revenueAccrued === true) {
      return { success: true, skipped: true, creditsEarnedForTeacher: 0 };
    }

    const attendanceForCompletion = incomingAttendance || session.attendance || null;
    if (!hasRequiredAttendanceForCompletion(session, attendanceForCompletion)) {
      throw new HttpsError(
        "failed-precondition",
        "Attendance must be marked before completing a session."
      );
    }

    const updates: Record<string, unknown> = {
      status: "completed",
      attendance: attendanceForCompletion,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    };
    if (sessionNotes) {
      updates.notes = sessionNotes;
    }

    await sessionRef.set(updates, { merge: true });

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
