// functions/src/createSessionsFromSchedule.ts
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {ensureAdmin} from "./helpers/adminGuard";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";
const IST_OFFSET_MINUTES = 330; // +05:30
const MAX_BATCH = 400; // Firestore limit is 500
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const REPLACEABLE_SESSION_STATUSES = new Set(["", "scheduled", "upcoming", "planned", "open"]);
const NON_REPLACEABLE_SESSION_STATUSES = new Set([
  "completed",
  "in_progress",
  "cancelled",
  "canceled",
  "no_show",
  "noshow",
  "reschedule_requested",
  "rescheduled",
  "consumed",
  "settled",
  "paid",
  "locked",
]);

interface WeeklySlotConfigRaw {
  weekday?: number;
  time?: string;
  durationMinutes?: number;
  durationMins?: number;
}

interface ScheduleConfig {
  timezone?: string;
  // Weekday mapping follows JS Date.getDay(): 0=Sun, 1=Mon, ... 6=Sat.
  weeklySlots?: WeeklySlotConfigRaw[];
  weekdays?: number[];
  timeHHmm?: string;
  durationMins?: number;
  plannedSessions?: number; // optional exact class count target within selected range
}

interface NormalizedWeeklySlot {
  weekday: number;
  timeHHmm: string;
  hour: number;
  minute: number;
  durationMinutes: number;
}

interface SessionFinancialLinkState {
  chargeExists: boolean;
  chargeStatus: string;
  chargePaidAmount: number;
  earningExists: boolean;
  earningStatus: string;
  earningPaidAmount: number;
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
  plannedSessions?: number; // optional exact class count target within selected range
  replaceFuture?: boolean;
  startDate?: string; // YYYY-MM-DD; classes start date
  endDate?: string; // YYYY-MM-DD inclusive; optional override for weeksAhead
}

interface CreateSessionsResponse {
  created: number;
  skipped: number;
  replaced: number;
  plannedSessionsTarget: number | null;
  plannedSessionsGenerated: number;
  plannedSessionsUnfilled: number;
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

function toPlannedSessions(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(1, Math.min(365, Math.floor(n)));
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "object" && value !== null) {
    const maybeTimestamp = value as {toDate?: () => Date; seconds?: number};
    if (typeof maybeTimestamp.toDate === "function") {
      const dt = maybeTimestamp.toDate();
      if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
    }
    if (typeof maybeTimestamp.seconds === "number") {
      const dt = new Date(maybeTimestamp.seconds * 1000);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function normalizeStatus(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function resolveSessionStartMs(raw: Record<string, unknown>): number | null {
  const startAt = toDateMaybe(raw.startAt);
  if (startAt) return startAt.getTime();

  const dateYmd = typeof raw.date === "string" ? raw.date.trim() : "";
  const startTime = typeof raw.startTime === "string" ? raw.startTime.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    const withTimeIso =
      /^\d{2}:\d{2}$/.test(startTime) ?
        `${dateYmd}T${startTime}:00+05:30` :
        `${dateYmd}T00:00:00+05:30`;
    const parsed = Date.parse(withTimeIso);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function hasAttendanceMarked(raw: Record<string, unknown>): boolean {
  const attendance = raw.attendance;
  if (!attendance) return false;
  if (attendance === null) return false;
  if (typeof attendance !== "object") return true;
  if (Array.isArray(attendance)) return attendance.length > 0;
  return Object.keys(attendance as Record<string, unknown>).length > 0;
}

function hasSessionFinanceOrLockMarkers(raw: Record<string, unknown>): boolean {
  if (raw.revenueAccrued === true) return true;
  if (Number(raw.accruedAmount || 0) > 0) return true;
  if (typeof raw.accruedMonthKey === "string" && raw.accruedMonthKey.trim()) return true;
  if (raw.creditsProcessed === true || raw.creditsProcessing === true) return true;
  if (raw.locked === true || raw.isLocked === true) return true;

  const markerFields = [
    "lockedAt",
    "consumedAt",
    "settledAt",
    "paidAt",
    "billedAt",
    "invoicedAt",
  ] as const;
  for (const field of markerFields) {
    if (raw[field]) return true;
  }

  const statusLikeFields = [
    "billingStatus",
    "paymentStatus",
    "earningStatus",
  ] as const;
  for (const field of statusLikeFields) {
    const normalized = normalizeStatus(raw[field]);
    if (normalized === "paid" || normalized === "settled" || normalized === "consumed" || normalized === "locked") {
      return true;
    }
  }

  return false;
}

function hasFinancialLink(state: SessionFinancialLinkState | undefined): boolean {
  if (!state) return false;
  const hasChargeLink = state.chargeExists && state.chargeStatus !== "void";
  const hasEarningLink = state.earningExists && state.earningStatus !== "void";
  return hasChargeLink || hasEarningLink || state.chargePaidAmount > 0 || state.earningPaidAmount > 0;
}

function isSessionReplaceable(args: {
  raw: Record<string, unknown>;
  financial: SessionFinancialLinkState | undefined;
  nowMs: number;
}): boolean {
  const {raw, financial, nowMs} = args;
  const sessionStartMs = resolveSessionStartMs(raw);

  // Forward-only rule: replace strictly future sessions (startAt > now).
  if (sessionStartMs === null || sessionStartMs <= nowMs) return false;

  const status = normalizeStatus(raw.status);
  if (NON_REPLACEABLE_SESSION_STATUSES.has(status)) return false;
  if (!REPLACEABLE_SESSION_STATUSES.has(status)) return false;
  if (hasAttendanceMarked(raw)) return false;
  if (hasSessionFinanceOrLockMarkers(raw)) return false;
  if (hasFinancialLink(financial)) return false;

  return true;
}

function defaultFinancialLinkState(): SessionFinancialLinkState {
  return {
    chargeExists: false,
    chargeStatus: "",
    chargePaidAmount: 0,
    earningExists: false,
    earningStatus: "",
    earningPaidAmount: 0,
  };
}

function isValidWeekday(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6;
}

function parseTimeHHmm(value: unknown): {timeHHmm: string; hour: number; minute: number} | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!TIME_HHMM_RE.test(raw)) return null;
  const [hourStr, minuteStr] = raw.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return {timeHHmm: raw, hour, minute};
}

function normalizeDurationMinutes(value: unknown, fallback = 35): number {
  const n = Number(value);
  const safe = Number.isFinite(n) && n > 0 ? n : fallback;
  return Math.max(10, Math.min(180, Math.floor(safe)));
}

function sortNormalizedWeeklySlots(slots: NormalizedWeeklySlot[]): NormalizedWeeklySlot[] {
  return [...slots].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.timeHHmm.localeCompare(b.timeHHmm, undefined, {numeric: true});
  });
}

function normalizeScheduleSlotsOrThrow(schedule: ScheduleConfig | undefined): NormalizedWeeklySlot[] {
  if (!schedule) return [];

  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length > 0) {
    const normalizedFromWeeklySlots: NormalizedWeeklySlot[] = [];
    const seenKeys = new Set<string>();

    for (const rawSlot of schedule.weeklySlots) {
      const weekday = Number(rawSlot?.weekday);
      if (!isValidWeekday(weekday)) {
        throw new HttpsError("invalid-argument", "Invalid schedule.weeklySlots weekday");
      }

      const parsedTime = parseTimeHHmm(rawSlot?.time);
      if (!parsedTime) {
        throw new HttpsError("invalid-argument", "Invalid schedule.weeklySlots time; expected HH:MM");
      }

      const durationRaw = Number(rawSlot?.durationMinutes ?? rawSlot?.durationMins);
      if (!Number.isFinite(durationRaw) || durationRaw <= 0) {
        throw new HttpsError("invalid-argument", "Invalid schedule.weeklySlots duration");
      }

      const dedupeKey = `${weekday}_${parsedTime.timeHHmm}`;
      if (seenKeys.has(dedupeKey)) {
        throw new HttpsError("invalid-argument", "Duplicate schedule.weeklySlots entries");
      }
      seenKeys.add(dedupeKey);

      normalizedFromWeeklySlots.push({
        weekday,
        timeHHmm: parsedTime.timeHHmm,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        durationMinutes: normalizeDurationMinutes(durationRaw, 35),
      });
    }

    return sortNormalizedWeeklySlots(normalizedFromWeeklySlots);
  }

  if (!Array.isArray(schedule.weekdays) || schedule.weekdays.length === 0) {
    return [];
  }

  const parsedLegacyTime = parseTimeHHmm(schedule.timeHHmm);
  if (!parsedLegacyTime) {
    throw new HttpsError("invalid-argument", "Invalid schedule.timeHHmm format");
  }
  const legacyDuration = normalizeDurationMinutes(schedule.durationMins, 35);

  const legacySlots: NormalizedWeeklySlot[] = [];
  const seenLegacyKeys = new Set<string>();
  for (const rawDay of schedule.weekdays) {
    const weekday = Number(rawDay);
    if (!isValidWeekday(weekday)) {
      throw new HttpsError("invalid-argument", "Invalid schedule.weekdays value");
    }
    const dedupeKey = `${weekday}_${parsedLegacyTime.timeHHmm}`;
    if (seenLegacyKeys.has(dedupeKey)) continue;
    seenLegacyKeys.add(dedupeKey);

    legacySlots.push({
      weekday,
      timeHHmm: parsedLegacyTime.timeHHmm,
      hour: parsedLegacyTime.hour,
      minute: parsedLegacyTime.minute,
      durationMinutes: legacyDuration,
    });
  }

  return sortNormalizedWeeklySlots(legacySlots);
}

/**
 * createSessionsFromSchedule
 *
 * Gen2 callable function, region: asia-south1
 *
 * Input: {
 *   enrollmentId: string,
 *   weeksAhead?: number,
 *   plannedSessions?: number,
 *   replaceFuture?: boolean,
 *   startDate?: string,
 *   endDate?: string,
 * }
 *
 * Output: {
 *   created: number,
 *   skipped: number,
 *   replaced: number,
 *   plannedSessionsTarget: number | null,
 *   plannedSessionsGenerated: number,
 *   plannedSessionsUnfilled: number,
 *   rangeStart: string,
 *   rangeEnd: string,
 *   rangeStartYmd: string,
 *   rangeEndYmd: string,
 * }
 */
export const createSessionsFromSchedule = onCall(
  {region: REGION},
  async (request): Promise<CreateSessionsResponse> => {
    await ensureAdmin(request.auth);

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
    const weeklySlots = normalizeScheduleSlotsOrThrow(schedule);
    if (weeklySlots.length === 0) {
      throw new HttpsError("failed-precondition", "Enrollment has no schedule configured");
    }
    const requestedPlannedSessions = toPlannedSessions(input.plannedSessions);
    const enrollmentPlannedSessions = toPlannedSessions(schedule?.plannedSessions);
    const plannedSessionsTarget = requestedPlannedSessions || enrollmentPlannedSessions || null;
    const slotsByWeekday = new Map<number, NormalizedWeeklySlot[]>();
    weeklySlots.forEach((slot) => {
      const existing = slotsByWeekday.get(slot.weekday) || [];
      existing.push(slot);
      slotsByWeekday.set(slot.weekday, existing);
    });

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

    let replaced = 0;
    if (replaceFuture) {
      const existingSnap = await db.collection("classSessions")
        .where("enrollmentId", "==", enrollmentId)
        .get();
      const nowMs = Date.now();
      const financialBySessionId = new Map<string, SessionFinancialLinkState>();

      const existingSessionIds = existingSnap.docs.map((docSnap) => docSnap.id);
      for (let i = 0; i < existingSessionIds.length; i += MAX_BATCH) {
        const idChunk = existingSessionIds.slice(i, i + MAX_BATCH);
        const chargeRefs = idChunk.map((sessionId) => db.collection("billingCharges").doc(sessionId));
        const earningRefs = idChunk.map((sessionId) => db.collection("teacherEarnings").doc(sessionId));
        const [chargeSnaps, earningSnaps] = await Promise.all([
          db.getAll(...chargeRefs),
          db.getAll(...earningRefs),
        ]);

        chargeSnaps.forEach((chargeSnap, idx) => {
          const sessionId = idChunk[idx];
          const existing = financialBySessionId.get(sessionId) || defaultFinancialLinkState();
          const chargeData = chargeSnap.data() || {};
          const paidRaw = Number(chargeData.paidAmount);
          financialBySessionId.set(sessionId, {
            ...existing,
            chargeExists: chargeSnap.exists,
            chargeStatus: normalizeStatus(chargeData.status),
            chargePaidAmount: Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : 0,
          });
        });

        earningSnaps.forEach((earningSnap, idx) => {
          const sessionId = idChunk[idx];
          const existing = financialBySessionId.get(sessionId) || defaultFinancialLinkState();
          const earningData = earningSnap.data() || {};
          const paidRaw = Number(earningData.paidAmount);
          financialBySessionId.set(sessionId, {
            ...existing,
            earningExists: earningSnap.exists,
            earningStatus: normalizeStatus(earningData.status),
            earningPaidAmount: Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : 0,
          });
        });
      }

      let deleteBatch = db.batch();
      let deleteOps = 0;

      for (const sessionDoc of existingSnap.docs) {
        const raw = sessionDoc.data() as Record<string, unknown>;
        const financial = financialBySessionId.get(sessionDoc.id);

        if (requestedEndYmd) {
          const sessionYmd = resolveSessionYmd(raw);
          if (!sessionYmd || sessionYmd > rangeEndYmd) continue;
        }
        if (!isSessionReplaceable({raw, financial, nowMs})) continue;

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
    let plannedSessionsGenerated = 0;
    let writeBatch = db.batch();
    let writeOps = 0;

    const uniqueKidIds = new Set<string>();
    kidIds.forEach((id) => {
      if (id) uniqueKidIds.add(id);
    });

    type SessionCandidate = {
      sessionDate: Date;
      sessionId: string;
      startAtDate: Date;
      endAtDate: Date;
      startTime: string;
      endTime: string;
      durationMinutes: number;
    };

    const sessionCandidates: SessionCandidate[] = [];
    for (
      let d = new Date(rangeStartDate.getTime());
      d.getTime() <= rangeEndDate.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dayOfWeek = d.getUTCDay();
      const daySlots = slotsByWeekday.get(dayOfWeek);
      if (!daySlots || daySlots.length === 0) continue;

      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const date = d.getUTCDate();

      for (const slot of daySlots) {
        const istStartContextMs = Date.UTC(year, month, date, slot.hour, slot.minute, 0, 0);
        const startAtUtcMs = istStartContextMs - IST_OFFSET_MINUTES * 60 * 1000;
        const startAtDate = new Date(startAtUtcMs);
        const endAtDate = new Date(startAtUtcMs + slot.durationMinutes * 60 * 1000);
        const ymd = `${year}${String(month + 1).padStart(2, "0")}${String(date).padStart(2, "0")}`;
        const hhmmCompact = `${String(slot.hour).padStart(2, "0")}${String(slot.minute).padStart(2, "0")}`;
        const sessionId = `${enrollmentId}_${ymd}_${hhmmCompact}`;

        sessionCandidates.push({
          sessionDate: new Date(d.getTime()),
          sessionId,
          startAtDate,
          endAtDate,
          startTime: slot.timeHHmm,
          endTime: formatHHmmFromContextMs(istStartContextMs + slot.durationMinutes * 60 * 1000),
          durationMinutes: slot.durationMinutes,
        });
      }
    }

    sessionCandidates.sort((a, b) => a.startAtDate.getTime() - b.startAtDate.getTime());

    for (const candidate of sessionCandidates) {
      if (plannedSessionsTarget && plannedSessionsGenerated >= plannedSessionsTarget) {
        break;
      }
      plannedSessionsGenerated += 1;

      const classSessionRef = db.collection("classSessions").doc(candidate.sessionId);
      const existing = await classSessionRef.get();
      if (existing.exists) {
        skipped += 1;
        continue;
      }

      const payload = {
        enrollmentId,
        kidId,
        kidIds,
        parentId,
        parentIds,
        teacherId,
        courseId,

        startAt: admin.firestore.Timestamp.fromDate(candidate.startAtDate),
        endAt: admin.firestore.Timestamp.fromDate(candidate.endAtDate),

        date: toYmdFromContextDate(candidate.sessionDate),
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        durationMins: candidate.durationMinutes,
        durationMinutes: candidate.durationMinutes,

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
      plannedSessionsTarget,
      plannedSessionsGenerated,
      plannedSessionsUnfilled: plannedSessionsTarget ?
        Math.max(plannedSessionsTarget - plannedSessionsGenerated, 0) :
        0,
      rangeStartYmd,
      rangeEndYmd,
      weeksAhead,
      hasEndDateOverride: Boolean(requestedEndYmd),
    });

    return {
      created,
      skipped,
      replaced,
      plannedSessionsTarget,
      plannedSessionsGenerated,
      plannedSessionsUnfilled: plannedSessionsTarget ?
        Math.max(plannedSessionsTarget - plannedSessionsGenerated, 0) :
        0,
      rangeStart: rangeStartIso,
      rangeEnd: rangeEndIso,
      rangeStartYmd,
      rangeEndYmd,
    };
  },
);
