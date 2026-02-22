// functions/src/createSessionsFromSchedule.ts
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";

// IST offset: +05:30 = 330 minutes ahead of UTC
const IST_OFFSET_MINUTES = 330;

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
}

/**
 * createSessionsFromSchedule
 * 
 * Gen2 callable function, region: asia-south1
 * 
 * Input: { enrollmentId: string, weeksAhead?: number }
 * Output: { created: number, skipped: number, rangeStart: string, rangeEnd: string }
 * 
 * Logic:
 * - Reads enrollment.schedule (weekdays, timeHHmm, durationMins)
 * - Generates session docs for next N weeks (default 4)
 * - Skips duplicates (checks if session doc exists by ID)
 * - Uses IST timezone (Asia/Kolkata) → converts to UTC timestamps
 * - Session fields: enrollmentId, teacherId, kidId/kidIds, parentId, startAt, endAt, status, feeAmount
 */
export const createSessionsFromSchedule = onCall(
  { region: REGION },
  async (request) => {
    const { enrollmentId, weeksAhead = 4 } = request.data || {};

    if (!enrollmentId || typeof enrollmentId !== "string") {
      throw new HttpsError("invalid-argument", "enrollmentId required");
    }

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

    const { weekdays, timeHHmm, durationMins } = schedule;

    // Parse timeHHmm (e.g., "16:30")
    const [hhStr, mmStr] = timeHHmm.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      throw new HttpsError("invalid-argument", "Invalid timeHHmm format");
    }

    const dur = Math.max(10, Math.min(180, Number(durationMins) || 35));

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

    // Determine range start (from enrollment.startDate or today in IST)
    let rangeStartDate: Date;
    if (enrollment.startDate) {
      rangeStartDate = enrollment.startDate.toDate();
    } else {
      // Today in IST
      const nowUtc = new Date();
      const nowIstMs = nowUtc.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
      rangeStartDate = new Date(nowIstMs);
    }

    // Set to midnight IST
    rangeStartDate.setUTCHours(0, 0, 0, 0);

    // Range end: weeksAhead * 7 days
    const rangeEndDate = new Date(rangeStartDate.getTime() + (weeksAhead * 7 - 1) * 24 * 60 * 60 * 1000);
    rangeEndDate.setUTCHours(23, 59, 59, 999);

    let created = 0;
    let skipped = 0;

    const batch = db.batch();
    let batchOps = 0;
    const MAX_BATCH = 400; // Firestore limit is 500, stay safe

    // Iterate over days in range
    for (let d = new Date(rangeStartDate); d <= rangeEndDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getUTCDay(); // 0=Sun..6=Sat (in IST context since we're treating d as IST)
      if (!weekdays.includes(dayOfWeek)) continue;

      // Build startAt in IST → convert to UTC
      // d is already in IST context (UTC ms adjusted)
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const date = d.getUTCDate();

      // Create IST datetime: YYYY-MM-DD HH:MM in IST
      // Convert to UTC: subtract IST offset
      const istMs = Date.UTC(year, month, date, hh, mm, 0, 0);
      const startAtUtcMs = istMs - IST_OFFSET_MINUTES * 60 * 1000;
      const startAtDate = new Date(startAtUtcMs);
      const endAtDate = new Date(startAtUtcMs + dur * 60 * 1000);

      // Generate session ID (deterministic)
      const ymd = `${year}${String(month + 1).padStart(2, "0")}${String(date).padStart(2, "0")}`;
      const hhmmCompact = `${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}`;
      const sessionId = `${enrollmentId}_${ymd}_${hhmmCompact}`;

      const classSessionRef = db.collection("classSessions").doc(sessionId);
      const existing = await classSessionRef.get();
      if (existing.exists) {
        skipped += 1;
        continue;
      }
      // Prepare session doc
      const payload = {
        // linkage
        enrollmentId,
        kidId,
        kidIds,
        parentId,
        parentIds,
        teacherId,
        courseId,

        // timing (preferred)
        startAt: admin.firestore.Timestamp.fromDate(startAtDate),
        endAt: admin.firestore.Timestamp.fromDate(endAtDate),

        // legacy fallback fields
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`,
        startTime: timeHHmm,

        // status/attendance
        status: "scheduled",
        attendance: null,

        // billing snapshot
        feeAmount,
        currency,

        // meeting link
        joinUrl,

        // audit
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "system",
        updatedBy: "system",
        source: "enrollmentSchedule",
      };

      batch.set(classSessionRef, payload);

      created += 1;
      batchOps += 1;

      // Commit batch if nearing limit
      if (batchOps >= MAX_BATCH) {
        await batch.commit();
        batchOps = 0;
      }
    }

    // Commit remaining
    if (batchOps > 0) {
      await batch.commit();
    }

    logger.info("Sessions created from schedule", {
      enrollmentId,
      created,
      skipped,
      rangeStart: rangeStartDate.toISOString(),
      rangeEnd: rangeEndDate.toISOString(),
    });

    return {
      created,
      skipped,
      rangeStart: rangeStartDate.toISOString(),
      rangeEnd: rangeEndDate.toISOString(),
    };
  }
);
