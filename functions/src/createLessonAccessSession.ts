import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";
const ACCESS_WINDOW_MINUTES = 50;
const IST_OFFSET_MINUTES = 330;

type CallerAuth = {
  uid: string;
  token?: Record<string, unknown>;
};

type CreateLessonAccessRequest = {
  lessonId?: unknown;
};

type CreateLessonAccessResponse = {
  accessId: string;
  expiresAtMs: number;
  lessonOpenCountToday: number;
  totalLessonOpensToday: number;
  lessonTitle: string;
};

type ResolveLessonAccessRequest = {
  accessId?: unknown;
};

type ResolveLessonAccessResponse = {
  lessonTitle: string;
  canvaEmbedUrl: string;
  expiresAtMs: number;
};

function normalizeRole(rawRole: unknown): string {
  if (typeof rawRole !== "string") return "";
  const role = rawRole.trim().toLowerCase();
  if (role === "learningpartner") return "learning-partner";
  return role;
}

function dateKeyFromMsIST(ms: number): string {
  const istMs = ms + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeCanvaEmbedUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== "string") return "";
  const candidate = rawUrl.trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    if (!(host === "canva.com" || host.endsWith(".canva.com"))) return "";
    if (parsed.protocol !== "https:") return "";
    const path = parsed.pathname.toLowerCase();
    const isEditablePath = path.includes("/edit");
    const isViewPath = path.includes("/view");
    if (isEditablePath || !isViewPath) return "";
    parsed.searchParams.set("embed", "1");
    parsed.searchParams.set("ui", "0");
    return parsed.toString();
  } catch {
    return "";
  }
}

function getCanvaNormalizationFailureReason(rawUrl: unknown): string {
  if (typeof rawUrl !== "string") return "non-string";
  const candidate = rawUrl.trim();
  if (!candidate) return "empty";
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    if (!(host === "canva.com" || host.endsWith(".canva.com"))) return "invalid-domain";
    if (parsed.protocol !== "https:") return "invalid-protocol";
    const path = parsed.pathname.toLowerCase();
    if (path.includes("/edit")) return "editable-link";
    if (!path.includes("/view")) return "missing-view-path";
    return "ok";
  } catch {
    return "invalid-url";
  }
}

function timestampToMs(value: unknown): number {
  if (typeof value === 'object' && value !== null && typeof (value as any).toMillis === 'function') {
    const ms = Number((value as any).toMillis());
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

async function resolveCallerRole(auth: CallerAuth): Promise<string> {
  const tokenRole = normalizeRole(auth.token?.role);
  if (tokenRole) return tokenRole;

  const userSnap = await admin.firestore().collection("users").doc(auth.uid).get();
  const roleFromDoc = normalizeRole(userSnap.data()?.role);
  return roleFromDoc;
}

function ensureTeacherOrAdminRole(role: string): void {
  if (role === "teacher" || role === "admin") return;
  throw new HttpsError("permission-denied", "Only teachers or admins can open lesson access sessions.");
}

function cleanLessonId(rawLessonId: unknown): string {
  if (typeof rawLessonId !== "string") {
    throw new HttpsError("invalid-argument", "lessonId is required.");
  }
  const lessonId = rawLessonId.trim();
  if (!lessonId) {
    throw new HttpsError("invalid-argument", "lessonId is required.");
  }
  return lessonId;
}

function cleanAccessId(rawAccessId: unknown): string {
  if (typeof rawAccessId !== 'string') {
    throw new HttpsError('invalid-argument', 'accessId is required.');
  }
  const accessId = rawAccessId.trim();
  if (!accessId) {
    throw new HttpsError('invalid-argument', 'accessId is required.');
  }
  return accessId;
}

export const createLessonAccessSession = onCall<CreateLessonAccessRequest>(
  { region: REGION },
  async (request): Promise<CreateLessonAccessResponse> => {
    const auth = request.auth as CallerAuth | null;
    if (!auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const lessonId = cleanLessonId(request.data?.lessonId);
    const role = await resolveCallerRole(auth);
    ensureTeacherOrAdminRole(role);

    const db = admin.firestore();
    const lessonRef = db.collection("lessons").doc(lessonId);
    const lessonSnap = await lessonRef.get();
    if (!lessonSnap.exists) {
      throw new HttpsError("not-found", "Lesson not found.");
    }

    const lessonData = lessonSnap.data() || {};
    if (lessonData.active === false) {
      throw new HttpsError("failed-precondition", "This lesson is inactive.");
    }

    const lessonTitle = String(lessonData.title || "Lesson").trim() || "Lesson";

    const teacherName =
      (typeof auth.token?.name === "string" && auth.token.name.trim()) ||
      (typeof auth.token?.email === "string" && auth.token.email.trim()) ||
      "Teacher";

    const nowMs = Date.now();
    const expiresAtMs = nowMs + ACCESS_WINDOW_MINUTES * 60 * 1000;
    const nowTs = admin.firestore.Timestamp.fromMillis(nowMs);
    const expiresAtTs = admin.firestore.Timestamp.fromMillis(expiresAtMs);
    const dateKey = dateKeyFromMsIST(nowMs);
    const dateKeyCompact = dateKey.replace(/-/g, "");

    const accessRef = db.collection("lessonAccessSessions").doc();
    const lessonDailyRef = db
      .collection("lessonDailyAudit")
      .doc(`${auth.uid}_${lessonId}_${dateKeyCompact}`);
    const teacherDailyRef = db
      .collection("teacherDailyAccess")
      .doc(`${auth.uid}_${dateKeyCompact}`);

    let lessonOpenCountToday = 1;
    let totalLessonOpensToday = 1;

    await db.runTransaction(async (tx) => {
      const lessonDailySnap = await tx.get(lessonDailyRef);
      const teacherDailySnap = await tx.get(teacherDailyRef);

      const previousLessonCount = lessonDailySnap.exists
        ? Number(lessonDailySnap.data()?.openCount || 0)
        : 0;
      lessonOpenCountToday = previousLessonCount + 1;

      const previousTotalCount = teacherDailySnap.exists
        ? Number(teacherDailySnap.data()?.totalLessonOpens || 0)
        : 0;
      totalLessonOpensToday = previousTotalCount + 1;

      const previousDistinctCount = teacherDailySnap.exists
        ? Number(teacherDailySnap.data()?.distinctLessonCount || 0)
        : 0;
      const nextDistinctCount = previousDistinctCount + (lessonDailySnap.exists ? 0 : 1);

      const firstOpenedAt = lessonDailySnap.exists
        ? lessonDailySnap.data()?.firstOpenedAt || nowTs
        : nowTs;

      tx.set(accessRef, {
        lessonId,
        lessonTitle,
        teacherUid: auth.uid,
        teacherName,
        createdAt: nowTs,
        expiresAt: expiresAtTs,
        dateKey,
        status: "active",
        revokedAt: null,
        revokedBy: null,
        revokeReason: null,
      });

      tx.set(
        lessonDailyRef,
        {
          teacherUid: auth.uid,
          teacherName,
          lessonId,
          lessonTitle,
          dateKey,
          openCount: lessonOpenCountToday,
          firstOpenedAt,
          lastOpenedAt: nowTs,
        },
        { merge: true }
      );

      tx.set(
        teacherDailyRef,
        {
          teacherUid: auth.uid,
          teacherName,
          dateKey,
          totalLessonOpens: totalLessonOpensToday,
          distinctLessonCount: nextDistinctCount,
          lastAccessedAt: nowTs,
        },
        { merge: true }
      );
    });

    return {
      accessId: accessRef.id,
      expiresAtMs,
      lessonOpenCountToday,
      totalLessonOpensToday,
      lessonTitle,
    };
  }
);

export const resolveLessonAccessViewer = onCall<ResolveLessonAccessRequest>(
  { region: REGION },
  async (request): Promise<ResolveLessonAccessResponse> => {
    let accessId = "";
    let stage = "entered callable";
    let sessionFound = false;
    let lessonFound = false;
    let hasCanvaEmbedUrl = false;
    let hasCanvaViewUrl = false;
    let selectedUrl: "none" | "canvaEmbedUrl" | "canvaViewUrl" = "none";
    let normalizationFailureReason = "not-started";

    const throwResolveError = (
      code: "unauthenticated" | "permission-denied" | "not-found" | "failed-precondition" | "invalid-argument",
      message: string,
      extra: Record<string, unknown> = {}
    ): never => {
      console.error("[resolveLessonAccessViewer]", {
        code,
        message,
        accessId,
        sessionFound,
        lessonFound,
        hasCanvaEmbedUrl,
        hasCanvaViewUrl,
        selectedUrl,
        normalizationFailureReason,
        ...extra,
      });
      throw new HttpsError(code, message);
    };

    try {
      console.info('[resolveLessonAccessViewer] entered callable', {
        hasAuthUid: !!request.auth?.uid,
      });

      stage = 'auth validated';
      const auth = request.auth as CallerAuth | null;
      if (!auth?.uid) {
        throwResolveError('unauthenticated', 'Authentication required.');
      }

      const callerAuth = auth as CallerAuth;

      stage = 'auth validated';
      const role = await resolveCallerRole(callerAuth);
      ensureTeacherOrAdminRole(role);

      stage = 'access id validated';
      try {
        accessId = cleanAccessId(request.data?.accessId);
      } catch (error) {
        if (error instanceof HttpsError) {
          throwResolveError('invalid-argument', error.message, { originalCode: error.code });
        }
        throw error;
      }

      const db = admin.firestore();

      stage = 'access session fetched';
      const accessRef = db.collection('lessonAccessSessions').doc(accessId);
      const accessSnap = await accessRef.get();
      sessionFound = accessSnap.exists;

      if (!accessSnap.exists) {
        throwResolveError('not-found', 'Access session not found. Reopen the lesson from library.');
      }

      stage = 'access session fetched';
      const unsafeAccessData = accessSnap.data();
      const accessData =
        typeof unsafeAccessData === 'object' && unsafeAccessData !== null ? unsafeAccessData : {};

      stage = 'session entitlement validated';
      const teacherUid = String(accessData.teacherUid || '').trim();
      if (role !== 'admin' && teacherUid !== callerAuth.uid) {
        throwResolveError('permission-denied', 'This lesson access does not belong to your account.');
      }

      stage = 'status-check';
      const status = String(accessData.status || 'active').trim().toLowerCase();
      if (status === 'revoked') {
        throwResolveError('permission-denied', 'This lesson access has been revoked by admin.');
      }

      stage = 'expiry-check';
      const expiresAtMs = timestampToMs(accessData.expiresAt);
      if (!expiresAtMs) {
        throwResolveError('failed-precondition', 'Lesson access is invalid. Reopen from library.');
      }

      if (Date.now() >= expiresAtMs || status === 'expired') {
        throwResolveError('failed-precondition', 'Lesson access has expired. Reopen from library.');
      }

      stage = 'session entitlement validated';
      const lessonId = String(accessData.lessonId || '').trim();
      if (!lessonId) {
        throwResolveError('failed-precondition', 'Lesson access is invalid. Reopen from library.');
      }

      stage = 'lesson fetched';
      const lessonSnap = await db.collection('lessons').doc(lessonId).get();
      lessonFound = lessonSnap.exists;
      if (!lessonSnap.exists) {
        throwResolveError('not-found', 'Lesson not found.');
      }

      stage = 'lesson fetched';
      const unsafeLessonData = lessonSnap.data();
      const lessonData =
        typeof unsafeLessonData === 'object' && unsafeLessonData !== null ? unsafeLessonData : {};
      if (lessonData.active === false) {
        throwResolveError('failed-precondition', 'This lesson is inactive.');
      }

      stage = 'raw URLs inspected';
      const rawEmbedUrl = typeof lessonData.canvaEmbedUrl === 'string' ? lessonData.canvaEmbedUrl : '';
      const rawViewUrl = typeof lessonData.canvaViewUrl === 'string' ? lessonData.canvaViewUrl : '';
      hasCanvaEmbedUrl = !!rawEmbedUrl.trim();
      hasCanvaViewUrl = !!rawViewUrl.trim();
      const hasAnyCanvaUrl = !!rawEmbedUrl.trim() || !!rawViewUrl.trim();
      if (!hasAnyCanvaUrl) {
        normalizationFailureReason = 'missing-both-url-fields';
        throwResolveError('failed-precondition', 'Lesson is missing a Canva view link.');
      }

      stage = 'embed normalized';
      const normalizedEmbedUrl = normalizeCanvaEmbedUrl(rawEmbedUrl);
      if (normalizedEmbedUrl) {
        selectedUrl = 'canvaEmbedUrl';
        normalizationFailureReason = 'ok';
      }
      const normalizedViewUrl = normalizedEmbedUrl ? '' : normalizeCanvaEmbedUrl(rawViewUrl);
      if (!normalizedEmbedUrl && normalizedViewUrl) {
        selectedUrl = 'canvaViewUrl';
        normalizationFailureReason = 'ok';
      }

      const canvaEmbedUrl = normalizedEmbedUrl || normalizedViewUrl;
      if (!canvaEmbedUrl) {
        const embedReason = getCanvaNormalizationFailureReason(rawEmbedUrl);
        const viewReason = getCanvaNormalizationFailureReason(rawViewUrl);
        normalizationFailureReason = `embed:${embedReason}|view:${viewReason}`;
        throwResolveError('invalid-argument', 'Lesson has an invalid Canva view link. Use a Canva /view URL (not /edit).');
      }

      stage = 'response-build';
      stage = 'response built';
      const lessonTitle =
        String(accessData.lessonTitle || '').trim() || String(lessonData.title || 'Lesson').trim() || 'Lesson';

      return {
        lessonTitle,
        canvaEmbedUrl,
        expiresAtMs,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      const isDevRuntime = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
      const unknownError = error as Error;
      const firstStackLine = typeof unknownError?.stack === 'string'
        ? unknownError.stack.split('\n').map((line) => line.trim()).filter(Boolean)[0] || ''
        : '';
      const debugDetails = {
        stage,
        accessId,
        sessionFound,
        lessonFound,
        hasCanvaEmbedUrl,
        hasCanvaViewUrl,
        selectedSource: selectedUrl,
        normalizeReason: normalizationFailureReason,
        rawErrorMessage: unknownError?.message || String(error),
        firstStackLine,
      };
      console.error('[resolveLessonAccessViewer] unhandled runtime error', {
        ...debugDetails,
        errorName: unknownError?.name || 'UnknownError',
        errorStack: unknownError?.stack || null,
      });
      if (isDevRuntime) {
        throw new HttpsError('internal', 'resolveLessonAccessViewer crashed unexpectedly', debugDetails);
      }
      throw new HttpsError('internal', 'resolveLessonAccessViewer crashed unexpectedly');
    }
  }
);
