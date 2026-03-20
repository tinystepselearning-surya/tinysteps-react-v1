// functions/src/createSessionsFromSchedule.ts
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {onCall, HttpsError} from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";
const IST_OFFSET_MINUTES = 330; // +05:30
const MAX_BATCH = 400; // Firestore limit is 500
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ScheduleConfig {
  timezone?: string;
  weekdays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  timeHHmm: string; // "HH:MM" in IST
  durationMins: number;
}

interface EnrollmentDoc {
  id?: string;
  kidId?: string;
  kidIds?: string[];
  parentId?: string;
  parentIds?: string[];
  teacherId?: string;
  courseId?: string;
  feePerClass?: number;
  currency?: string;
  joinUrl?: string;
  schedule?: ScheduleConfig;
  startDate?: admin.firestore.Timestamp;
  startDateYmd?: string;
  classesStartDate?: admin.firestore.Timestamp;
  classesStartDateYmd?: string;
}

interface CreateSessionsRequest {
  enrollmentId: string;
  weeksAhead?: number;
  replaceFuture?: boolean;
  startDate?: string; // YYYY-MM-DD; classes start date
  endDate?: string; // YYYY-MM-DD inclusive; optional override for weeksAhead
}

interface CreateSessionsResponse {
  created: number;
  skipped: number;
  replaced: number;
  rangeStart: string;
  rangeEnd: string;
  rangeStartYmd: string;
  rangeEndYmd: string;
}

function isValidYmd(value: string): boolean {
  return YMD_RE.test(value);
}

function toContextDateFromYmd(ymd: string): Date | null {
  if (!isValidYmd(ymd)) return null;
  const [yStr, mStr, dStr] = ymd.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function toYmdFromContextDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIstTodayYmd(): string {
  const shifted = new Date(Date.now() + IST_OFFSET_MINUTES * 60 * 1000);
  return toYmdFromContextDate(shifted);
}

function toYmdFromDateLike(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const v = value.trim();
    if (isValidYmd(v)) return v;
    const parsed = new Date(v);
    if (!Number.isNaN(parsed.getTime())) {
      const shifted = new Date(parsed.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
      return toYmdFromContextDate(shifted);
    }
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const shifted = new Date(value.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
    return toYmdFromContextDate(shifted);
  }

  const maybeTimestamp = value as {toDate?: () => Date};
  if (typeof maybeTimestamp.toDate === "function") {
    const dt = maybeTimestamp.toDate();
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
      const shifted = new Date(dt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
      return toYmdFromContextDate(shifted);
    }
  }

  return null;
}

function resolveSessionYmd(raw: Record<string, unknown>): string | null {
  const dateField = raw.date;
  if (typeof dateField === "string" && isValidYmd(dateField)) {
    return dateField;
  }
  return toYmdFromDateLike(raw.startAt);
}

function formatHHmmFromContextMs(contextMs: number): string {
  const d = new Date(contextMs);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * createSessionsFromSchedule
 *
 * Gen2 callable function, region: asia-south1
 *
 * Input: {
 *   enrollmentId: string,
 *   weeksAhead?: number,
 *   replaceFuture?: boolean,
 *   startDate?: string,
 *   endDate?: string,
 * }
 *
 * Output: {
 *   created: number,
 *   skipped: number,
 *   replaced: number,
 *   rangeStart: string,
 *   rangeEnd: string,
 *   rangeStartYmd: string,
 *   rangeEndYmd: string,
 * }
 */
export const createSessionsFromSchedule = onCall(
  {region: REGION},
  async (request): Promise<CreateSessionsResponse> => {
    const input = (request.data || {}) as Partial<CreateSessionsRequest>;
    const enrollmentId = typeof input.enrollmentId === "string" ? input.enrollmentId.trim() : "";

    if (!enrollmentId) {
      throw new HttpsError("invalid-argument", "enrollmentId required");
    }

    const requestedStartYmd = typeof input.startDate === "string" ? input.startDate.trim() : "";
    const requestedEndYmd = typeof input.endDate === "string" ? input.endDate.trim() : "";
    if (requestedStartYmd && !isValidYmd(requestedStartYmd)) {
      throw new HttpsError("invalid-argument", "startDate must be YYYY-MM-DD");
    }
    if (requestedEndYmd && !isValidYmd(requestedEndYmd)) {
      throw new HttpsError("invalid-argument", "endDate must be YYYY-MM-DD");
    }

    const weeksAheadRaw = Number(input.weeksAhead);
    const weeksAhead = Number.isFinite(weeksAheadRaw) ?
      Math.max(1, Math.min(52, Math.floor(weeksAheadRaw))) :
      4;
    const replaceFuture = input.replaceFuture === undefined ? true : Boolean(input.replaceFuture);

    const db = admin.firestore();
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();

    if (!enrollmentSnap.exists) {
      throw new HttpsError("not-found", `Enrollment ${enrollmentId} not found`);
    }

    const enrollment = enrollmentSnap.data() as EnrollmentDoc;
    const schedule = enrollment.schedule;

    if (!schedule || !Array.isArray(schedule.weekdays) || schedule.weekdays.length === 0) {
      throw new HttpsError("failed-precondition", "Enrollment has no schedule configured");
    }

    const {weekdays, timeHHmm, durationMins} = schedule;

    const [hhStr, mmStr] = String(timeHHmm || "").split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      throw new HttpsError("invalid-argument", "Invalid schedule.timeHHmm format");
    }

    const dur = Math.max(10, Math.min(180, Number(durationMins) || 35));

    const rangeStartYmd =
      requestedStartYmd ||
      toYmdFromDateLike(enrollment.classesStartDateYmd) ||
      toYmdFromDateLike(enrollment.classesStartDate) ||
      toYmdFromDateLike(enrollment.startDateYmd) ||
      toYmdFromDateLike(enrollment.startDate) ||
      toIstTodayYmd();

    const rangeStartDate = toContextDateFromYmd(rangeStartYmd);
    if (!rangeStartDate) {
      throw new HttpsError("invalid-argument", "Unable to resolve a valid start date");
    }

    let rangeEndDate: Date;
    if (requestedEndYmd) {
      const explicitEnd = toContextDateFromYmd(requestedEndYmd);
      if (!explicitEnd) {
        throw new HttpsError("invalid-argument", "Invalid endDate");
      }
      if (explicitEnd.getTime() < rangeStartDate.getTime()) {
        throw new HttpsError("invalid-argument", "endDate must be >= startDate");
      }
      rangeEndDate = explicitEnd;
    } else {
      rangeEndDate = new Date(rangeStartDate.getTime());
      rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + (weeksAhead * 7 - 1));
    }

    const rangeEndYmd = toYmdFromContextDate(rangeEndDate);

    // Build session metadata
    const kidId = enrollment.kidId || (enrollment.kidIds && enrollment.kidIds[0]) || null;
    const kidIds = enrollment.kidIds || (kidId ? [kidId] : []);
    const parentId = enrollment.parentId || (enrollment.parentIds && enrollment.parentIds[0]) || null;
    const parentIds = enrollment.parentIds || (parentId ? [parentId] : []);
    const teacherId = enrollment.teacherId || null;
    const courseId = enrollment.courseId || null;
    const feeAmount = Number(enrollment.feePerClass || 0);
    const currency = enrollment.currency || "INR";
    const joinUrl = enrollment.joinUrl || null;
    const todayYmd = toIstTodayYmd();

    let replaced = 0;
    if (replaceFuture) {
      const existingSnap = await db.collection("classSessions")
        .where("enrollmentId", "==", enrollmentId)
        .get();

      let deleteBatch = db.batch();
      let deleteOps = 0;

      for (const sessionDoc of existingSnap.docs) {
        const raw = sessionDoc.data() as Record<string, unknown>;
        const sessionYmd = resolveSessionYmd(raw);
        if (!sessionYmd) continue;
        const status = String(raw.status || "").toLowerCase();

        // Keep historical attendance intact; replace only upcoming sessions.
        if (sessionYmd < todayYmd) continue;
        if (status === "completed") continue;
        if (requestedEndYmd && sessionYmd > rangeEndYmd) continue;

        deleteBatch.delete(sessionDoc.ref);
        deleteOps += 1;
        replaced += 1;

        if (deleteOps >= MAX_BATCH) {
          await deleteBatch.commit();
          deleteBatch = db.batch();
          deleteOps = 0;
        }
      }

      if (deleteOps > 0) {
        await deleteBatch.commit();
      }
    }

    let created = 0;
    let skipped = 0;
    let writeBatch = db.batch();
    let writeOps = 0;

    const uniqueKidIds = new Set<string>();
    kidIds.forEach((id) => {
      if (id) uniqueKidIds.add(id);
    });

    for (
      let d = new Date(rangeStartDate.getTime());
      d.getTime() <= rangeEndDate.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dayOfWeek = d.getUTCDay();
      if (!weekdays.includes(dayOfWeek)) continue;

      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const date = d.getUTCDate();

      const istStartContextMs = Date.UTC(year, month, date, hh, mm, 0, 0);
      const startAtUtcMs = istStartContextMs - IST_OFFSET_MINUTES * 60 * 1000;
      const startAtDate = new Date(startAtUtcMs);
      const endAtDate = new Date(startAtUtcMs + dur * 60 * 1000);

      const ymd = `${year}${String(month + 1).padStart(2, "0")}${String(date).padStart(2, "0")}`;
      const hhmmCompact = `${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}`;
      const sessionId = `${enrollmentId}_${ymd}_${hhmmCompact}`;

      const classSessionRef = db.collection("classSessions").doc(sessionId);
      const existing = await classSessionRef.get();
      if (existing.exists) {
        skipped += 1;
        continue;
      }

      const endTime = formatHHmmFromContextMs(istStartContextMs + dur * 60 * 1000);

      const payload = {
        enrollmentId,
        kidId,
        kidIds,
        parentId,
        parentIds,
        teacherId,
        courseId,

        startAt: admin.firestore.Timestamp.fromDate(startAtDate),
        endAt: admin.firestore.Timestamp.fromDate(endAtDate),

        date: toYmdFromContextDate(d),
        startTime: timeHHmm,
        endTime,
        durationMins: dur,
        durationMinutes: dur,

        status: "scheduled",
        attendance: null,

        feeAmount,
        currency,

        joinUrl,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "system",
        updatedBy: "system",
        source: replaceFuture ? "enrollmentScheduleReplace" : "enrollmentSchedule",
      };

      writeBatch.set(classSessionRef, payload);
      created += 1;
      writeOps += 1;

      if (writeOps >= MAX_BATCH) {
        await writeBatch.commit();
        writeBatch = db.batch();
        writeOps = 0;
      }
    }

    if (writeOps > 0) {
      await writeBatch.commit();
    }

    if (teacherId && uniqueKidIds.size > 0) {
      const kidIdList = Array.from(uniqueKidIds);
      for (let i = 0; i < kidIdList.length; i += MAX_BATCH) {
        const chunk = kidIdList.slice(i, i + MAX_BATCH);
        const kidBatch = db.batch();
        chunk.forEach((id) => {
          const kidRef = db.collection("kids").doc(id);
          kidBatch.set(
            kidRef,
            {
              teacherIds: admin.firestore.FieldValue.arrayUnion(teacherId),
              teacherId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: "system",
            },
            {merge: true},
          );
        });
        await kidBatch.commit();
      }
    }

    const rangeStartIso = `${rangeStartYmd}T00:00:00+05:30`;
    const rangeEndIso = `${rangeEndYmd}T23:59:59+05:30`;

    logger.info("Sessions generated from schedule", {
      enrollmentId,
      replaceFuture,
      created,
      skipped,
      replaced,
      rangeStartYmd,
      rangeEndYmd,
      weeksAhead,
      hasEndDateOverride: Boolean(requestedEndYmd),
    });

    return {
      created,
      skipped,
      replaced,
      rangeStart: rangeStartIso,
      rangeEnd: rangeEndIso,
      rangeStartYmd,
      rangeEndYmd,
    };
  },
);
