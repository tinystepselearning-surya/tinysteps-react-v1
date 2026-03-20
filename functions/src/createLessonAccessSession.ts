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
    if (!parsed.hostname.endsWith("canva.com")) return "";
    if (parsed.protocol !== "https:") return "";
    parsed.searchParams.set("embed", "1");
    parsed.searchParams.set("ui", "0");
    return parsed.toString();
  } catch {
    return "";
  }
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
    const canvaEmbedUrl = normalizeCanvaEmbedUrl(
      lessonData.canvaEmbedUrl || lessonData.canvaViewUrl || ""
    );
    if (!canvaEmbedUrl) {
      throw new HttpsError("failed-precondition", "Lesson does not have a valid Canva embed URL.");
    }

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
        canvaEmbedUrl,
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
