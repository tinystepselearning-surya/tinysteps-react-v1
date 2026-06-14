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
const PAUSED_SESSION_STATUS = "paused";
const ACTIVE_FUTURE_OPERATIONAL_STATUSES = new Set(["", "scheduled", "upcoming", "planned", "open", "in_progress"]);
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
const CONSUMED_SESSION_STATUSES = new Set(["completed", "consumed", "settled", "paid"]);
const NON_ACTIVE_ENROLLMENT_STATUSES = new Set(["completed", "discontinued", "expired", "cancelled", "archived", "inactive"]);
const SCHEDULE_EXCEPTION_SOURCE_TOKENS = [
  "ad_hoc",
  "adhoc",
  "makeup",
  "reschedule",
  "manual_one_off",
  "approved_request",
  "one_off",
];

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
  weeksAhead?: number;
  plannedSessions?: number; // optional exact class count target within selected range
  endDateYmd?: string | null;
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
  studentId?: string;
  childId?: string;
  studentName?: string;
  kidName?: string;
  childName?: string;
  parentId?: string;
  parentIds?: string[];
  teacherId?: string;
  teacherIds?: string[];
  teacherName?: string;
  teacherEmail?: string;
  courseId?: string;
  courseName?: string;
  courseTitle?: string;
  courseLabel?: string;
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
  plannedSessionsConsumed: number;
  plannedSessionsActiveFuture: number;
  plannedSessionsPausedFuture: number;
  plannedSessionsRemaining: number;
  plannedSessionsUnfilled: number;
  plannedSessionsCapReached: boolean;
  rangeStart: string;
  rangeEnd: string;
  rangeStartYmd: string;
  rangeEndYmd: string;
}

interface SaveEnrollmentScheduleAndGenerateRequest {
  enrollmentId: string;
  enrollmentStartDate: string;
  classesStartDate: string;
  endDate?: string;
  feePerClass: number;
  joinUrl?: string | null;
  currency?: string | null;
  weeklySlots: WeeklySlotConfigRaw[];
  weeksAhead?: number;
  plannedSessions?: number;
  idempotencyKey?: string | null;
}

interface SaveEnrollmentScheduleAndGenerateResponse extends CreateSessionsResponse {
  idempotentReplay: boolean;
  orchestrationState: "generated" | "replayed";
}

interface PauseEnrollmentUpcomingSessionsRequest {
  enrollmentId: string;
  count: number;
}

interface PauseEnrollmentUpcomingSessionsResponse extends CreateSessionsResponse {
  pausedCount: number;
  pauseBatchId: string;
}

interface ResumeEnrollmentScheduleRequest {
  enrollmentId: string;
}

interface ResumeEnrollmentScheduleResponse extends CreateSessionsResponse {
  resumedCount: number;
}

interface RepairEnrollmentFutureSessionsRequest {
  enrollmentId: string;
  dryRun?: boolean;
}

interface RepairPlanSessionPreview {
  sessionId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  action: "create" | "patch" | "cancel_duplicate" | "cancel_stale" | "cancel_excess" | "skip_unsafe";
  reasons: string[];
  replacementSessionId?: string | null;
}

interface RepairTeacherAliasProblem {
  sessionId: string;
  date: string | null;
  startTime: string | null;
  expectedTeacherId: string | null;
  actualTeacherRefs: string[];
  missingFields: string[];
  mismatchedFields: string[];
}

interface RepairFinalCounts {
  createCount: number;
  patchCount: number;
  cancelCount: number;
  unsafeSkippedCount: number;
  teacherAliasProblemCount: number;
}

interface RepairEnrollmentFutureSessionsResponse extends CreateSessionsResponse {
  dryRun: boolean;
  repairBatchId: string | null;
  missingSessionsToCreate: RepairPlanSessionPreview[];
  staleSessionsToUpdate: RepairPlanSessionPreview[];
  duplicateOldTimeSessions: RepairPlanSessionPreview[];
  unsafeSessionsSkipped: RepairPlanSessionPreview[];
  teacherAliasProblems: RepairTeacherAliasProblem[];
  finalCounts: RepairFinalCounts;
}

function normalizeIdempotencyKey(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  return raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 120);
}

function toOptionalText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => toOptionalText(entry))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );
}

function resolveEnrollmentTeacherIdentity(enrollment: EnrollmentDoc): { teacherId: string | null; teacherIds: string[] } {
  const teacherIds = toStringList(enrollment.teacherIds);
  const teacherId =
    toOptionalText(enrollment.teacherId) ||
    toOptionalText((enrollment as Record<string, unknown>).assignedTeacherId) ||
    toOptionalText((enrollment as Record<string, unknown>).primaryTeacherId) ||
    toOptionalText((enrollment as Record<string, unknown>).teacherUid) ||
    toOptionalText((enrollment as Record<string, unknown>).teacher_id) ||
    teacherIds[0] ||
    null;

  if (teacherId && !teacherIds.includes(teacherId)) {
    teacherIds.unshift(teacherId);
  }

  return { teacherId, teacherIds };
}

function removeUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedDeep(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const cleaned: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        const nextValue = removeUndefinedDeep(item);
        if (nextValue !== undefined) {
          cleaned[key] = nextValue;
        }
      });
      return cleaned;
    }
  }
  return value;
}

function toPauseCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const parsed = Math.floor(n);
  if (![1, 2, 3, 5, 10].includes(parsed)) return 0;
  return parsed;
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

/**
 * Safely parse YYYY-MM-DD to a Firestore Timestamp at IST midnight.
 * Throws HttpsError if invalid to provide clear feedback.
 */
function parseYmdToIstMidnightTimestamp(ymd: string, fieldName: string): admin.firestore.Timestamp {
  if (!isValidYmd(ymd)) {
    throw new HttpsError("invalid-argument", `${fieldName} must be YYYY-MM-DD format`);
  }
  const [yStr, mStr, dStr] = ymd.split("-");
  const year = Number(yStr);
  const month = Number(mStr) - 1; // JS months are 0-indexed
  const day = Number(dStr);
  
  // Create date in UTC, then shift to IST context
  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  if (Number.isNaN(utcDate.getTime())) {
    throw new HttpsError("invalid-argument", `${fieldName} "${ymd}" is invalid`);
  }
  
  // Shift backward by IST offset to get IST midnight as UTC time
  const istMidnightUtc = new Date(utcDate.getTime() - IST_OFFSET_MINUTES * 60 * 1000);
  
  return admin.firestore.Timestamp.fromDate(istMidnightUtc);
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

function normalizeEnrollmentStatus(value: unknown): string {
  const raw = normalizeStatus(value);
  if (!raw) return "active";
  if (raw === "pending_teacher") return "trial";
  if (raw === "pending_payment" || raw === "pending_lp") return "active";
  if (raw === "enrolled" || raw === "current" || raw === "ongoing") return "active";
  if (raw === "canceled") return "cancelled";
  return raw;
}

function isEnrollmentOperationallyActive(enrollmentLike: Record<string, unknown>): boolean {
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return false;
  }
  return !NON_ACTIVE_ENROLLMENT_STATUSES.has(normalizeEnrollmentStatus(enrollmentLike.status));
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

function isScheduleExceptionSession(raw: Record<string, unknown>): boolean {
  if (raw.isAdHoc === true || raw.isMakeup === true) return true;
  if (raw.makeupCreditId || raw.makeupForSessionId) return true;

  const adHocType = String(raw.adHocType || "").trim().toLowerCase();
  if (adHocType && (adHocType.includes("one_off") || adHocType.includes("adhoc") || adHocType.includes("ad_hoc"))) {
    return true;
  }

  const source = String(raw.source || "").trim().toLowerCase();
  if (!source) return false;
  return SCHEDULE_EXCEPTION_SOURCE_TOKENS.some((token) => source.includes(token));
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

function resolveSessionSignature(args: {
  raw: Record<string, unknown>;
  fallbackTeacherId: string | null;
}): string | null {
  const {raw, fallbackTeacherId} = args;
  const ymd = resolveSessionYmd(raw);
  if (!ymd) return null;

  let timeHHmm = typeof raw.startTime === "string" ? raw.startTime.trim() : "";
  if (!TIME_HHMM_RE.test(timeHHmm)) {
    const startAt = toDateMaybe(raw.startAt);
    if (startAt) {
      const contextMs = startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
      timeHHmm = formatHHmmFromContextMs(contextMs);
    }
  }
  if (!TIME_HHMM_RE.test(timeHHmm)) return null;

  const durationRaw = Number(raw.durationMinutes ?? raw.durationMins);
  if (!Number.isFinite(durationRaw) || durationRaw <= 0) return null;
  const durationMinutes = normalizeDurationMinutes(durationRaw);

  const teacherIdRaw =
    typeof raw.teacherId === "string" && raw.teacherId.trim() ?
      raw.teacherId.trim() :
      (fallbackTeacherId || "");

  return `${ymd}|${timeHHmm}|${durationMinutes}|${teacherIdRaw}`;
}

function resolveSessionSlotPattern(args: {
  raw: Record<string, unknown>;
  fallbackTeacherId: string | null;
}): string | null {
  const {raw, fallbackTeacherId} = args;
  const ymd = resolveSessionYmd(raw);
  if (!ymd || !isValidYmd(ymd)) return null;
  const parsedDate = toContextDateFromYmd(ymd);
  if (!parsedDate) return null;
  const weekday = parsedDate.getUTCDay();

  let timeHHmm = typeof raw.startTime === "string" ? raw.startTime.trim() : "";
  if (!TIME_HHMM_RE.test(timeHHmm)) {
    const startAt = toDateMaybe(raw.startAt);
    if (startAt) {
      const contextMs = startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
      timeHHmm = formatHHmmFromContextMs(contextMs);
    }
  }
  if (!TIME_HHMM_RE.test(timeHHmm)) return null;

  const durationRaw = Number(raw.durationMinutes ?? raw.durationMins);
  if (!Number.isFinite(durationRaw) || durationRaw <= 0) return null;
  const durationMinutes = normalizeDurationMinutes(durationRaw);

  const teacherIdRaw =
    typeof raw.teacherId === "string" && raw.teacherId.trim() ?
      raw.teacherId.trim() :
      (fallbackTeacherId || "");

  return `${weekday}|${timeHHmm}|${durationMinutes}|${teacherIdRaw}`;
}

function resolvePrimarySessionKidId(raw: Record<string, unknown>): string | null {
  const direct = String(raw.kidId || raw.studentId || "").trim();
  if (direct) return direct;
  if (Array.isArray(raw.kidIds) && raw.kidIds.length > 0) {
    const first = String(raw.kidIds[0] || "").trim();
    if (first) return first;
  }
  return null;
}

function resolveAttendanceStatus(raw: Record<string, unknown>, kidId: string | null): string | null {
  if (!kidId) return null;
  const attendanceRaw = raw.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== "object") return null;
  const attendance = attendanceRaw as Record<string, unknown>;
  const entry = attendance[kidId];
  if (!entry) return null;
  if (typeof entry === "string") return normalizeStatus(entry);
  if (entry && typeof entry === "object") {
    return normalizeStatus((entry as Record<string, unknown>).status);
  }
  return null;
}

function hasPresentOrLateAttendance(raw: Record<string, unknown>): boolean {
  const kidId = resolvePrimarySessionKidId(raw);
  const attendanceStatus = resolveAttendanceStatus(raw, kidId);
  return attendanceStatus === "present" || attendanceStatus === "late";
}

function isRegularConsumedSession(raw: Record<string, unknown>, financial: SessionFinancialLinkState | undefined): boolean {
  if (isScheduleExceptionSession(raw)) return false;
  if (normalizeStatus(raw.status) === PAUSED_SESSION_STATUS) return false;
  if (raw.revenueSuppressed === true) return false;
  if (raw.revenueAccrued === true) return true;
  if (hasFinancialLink(financial)) return true;
  const status = normalizeStatus(raw.status);
  if (!CONSUMED_SESSION_STATUSES.has(status)) return false;
  if (status !== "completed") return true;
  const attendanceRaw = raw.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== "object") return true;
  return hasPresentOrLateAttendance(raw);
}

function isFutureOperationalRegularSession(args: {
  raw: Record<string, unknown>;
  nowMs: number;
  configuredSlotPatterns: Set<string>;
  fallbackTeacherId: string | null;
}): boolean {
  const { raw, nowMs, configuredSlotPatterns, fallbackTeacherId } = args;
  if (isScheduleExceptionSession(raw)) return false;
  const status = normalizeStatus(raw.status);
  if (!ACTIVE_FUTURE_OPERATIONAL_STATUSES.has(status)) return false;
  if (status === PAUSED_SESSION_STATUS) return false;
  const startMs = resolveSessionStartMs(raw);
  if (startMs === null || startMs <= nowMs) return false;
  const slotPattern = resolveSessionSlotPattern({ raw, fallbackTeacherId });
  if (!slotPattern || !configuredSlotPatterns.has(slotPattern)) return false;
  return true;
}

function isFuturePausedRegularSession(args: {
  raw: Record<string, unknown>;
  nowMs: number;
  configuredSlotPatterns: Set<string>;
  fallbackTeacherId: string | null;
}): boolean {
  const { raw, nowMs, configuredSlotPatterns, fallbackTeacherId } = args;
  if (isScheduleExceptionSession(raw)) return false;
  const status = normalizeStatus(raw.status);
  if (status !== PAUSED_SESSION_STATUS) return false;
  const startMs = resolveSessionStartMs(raw);
  if (startMs === null || startMs <= nowMs) return false;
  const slotPattern = resolveSessionSlotPattern({ raw, fallbackTeacherId });
  if (!slotPattern || !configuredSlotPatterns.has(slotPattern)) return false;
  return true;
}

async function fetchFinancialStateBySessionId(
  db: admin.firestore.Firestore,
  sessionIds: string[],
): Promise<Map<string, SessionFinancialLinkState>> {
  const financialBySessionId = new Map<string, SessionFinancialLinkState>();
  if (!sessionIds.length) return financialBySessionId;
  for (let i = 0; i < sessionIds.length; i += MAX_BATCH) {
    const idChunk = sessionIds.slice(i, i + MAX_BATCH);
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
  return financialBySessionId;
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

      const normalizedDuration = normalizeDurationMinutes(durationRaw, 35);

      const dedupeKey = `${weekday}_${parsedTime.timeHHmm}_${normalizedDuration}`;
      if (seenKeys.has(dedupeKey)) {
        throw new HttpsError("invalid-argument", "Duplicate schedule.weeklySlots entries");
      }
      seenKeys.add(dedupeKey);

      normalizedFromWeeklySlots.push({
        weekday,
        timeHHmm: parsedTime.timeHHmm,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        durationMinutes: normalizedDuration,
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
 * Internal deterministic session generation helper.
 * Shared by:
 * 1) createSessionsFromSchedule (existing callable)
 * 2) saveEnrollmentScheduleAndGenerateSessions (new orchestration callable)
 */
async function generateSessionsFromScheduleInternal(
  input: Partial<CreateSessionsRequest>,
): Promise<CreateSessionsResponse> {
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
  if (!isEnrollmentOperationallyActive(enrollment as unknown as Record<string, unknown>)) {
    throw new HttpsError("failed-precondition", "Enrollment is not active");
  }
  const schedule = enrollment.schedule;
  const weeklySlots = normalizeScheduleSlotsOrThrow(schedule);
  if (weeklySlots.length === 0 && !replaceFuture) {
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
    const lookaheadDaysFromWeeks = weeksAhead * 7;
    const lookaheadDaysForPlanned = plannedSessionsTarget ? 400 : lookaheadDaysFromWeeks;
    const lookaheadDays = Math.max(lookaheadDaysFromWeeks, lookaheadDaysForPlanned);
    rangeEndDate = new Date(rangeStartDate.getTime());
    rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + (lookaheadDays - 1));
  }

  const rangeEndYmd = toYmdFromContextDate(rangeEndDate);

  const kidId = enrollment.kidId || (enrollment.kidIds && enrollment.kidIds[0]) || null;
  const kidIds = enrollment.kidIds || (kidId ? [kidId] : []);
  const studentId = enrollment.studentId || kidId || null;
  const childId = enrollment.childId || kidId || null;
  const parentId = enrollment.parentId || (enrollment.parentIds && enrollment.parentIds[0]) || null;
  const parentIds = enrollment.parentIds || (parentId ? [parentId] : []);
  const {teacherId, teacherIds} = resolveEnrollmentTeacherIdentity(enrollment);
  const courseId = enrollment.courseId || null;
  const feeAmount = Number(enrollment.feePerClass || 0);
  const currency = enrollment.currency || "INR";
  const joinUrl = enrollment.joinUrl || null;
  const [kidSnap, courseSnap, teacherSnap] = await Promise.all([
    kidId ? db.collection("kids").doc(kidId).get() : Promise.resolve(null),
    courseId ? db.collection("courses").doc(courseId).get() : Promise.resolve(null),
    teacherId ? db.collection("users").doc(teacherId).get() : Promise.resolve(null),
  ]);
  const kidData = kidSnap?.exists ? (kidSnap.data() as Record<string, unknown>) : null;
  const courseData = courseSnap?.exists ? (courseSnap.data() as Record<string, unknown>) : null;
  const teacherData = teacherSnap?.exists ? (teacherSnap.data() as Record<string, unknown>) : null;
  const studentName =
    toOptionalText(enrollment.studentName) ||
    toOptionalText(enrollment.kidName) ||
    toOptionalText(enrollment.childName) ||
    toOptionalText(kidData?.studentName) ||
    toOptionalText(kidData?.fullName) ||
    toOptionalText(kidData?.displayName) ||
    toOptionalText(kidData?.name) ||
    null;
  const kidName = toOptionalText(enrollment.kidName) || studentName;
  const childName = toOptionalText(enrollment.childName) || studentName;
  const courseName =
    toOptionalText(enrollment.courseName) ||
    toOptionalText((enrollment as Record<string, unknown>).courseLabel) ||
    toOptionalText((enrollment as Record<string, unknown>).courseTitle) ||
    toOptionalText(courseData?.title) ||
    toOptionalText(courseData?.name) ||
    courseId ||
    null;
  const teacherName =
    toOptionalText(enrollment.teacherName) ||
    toOptionalText(teacherData?.displayName) ||
    toOptionalText(teacherData?.name) ||
    toOptionalText(teacherData?.email) ||
    teacherId ||
    null;
  const teacherEmail =
    toOptionalText(enrollment.teacherEmail) ||
    toOptionalText(teacherData?.email) ||
    null;

  const existingSnap = await db.collection("classSessions")
    .where("enrollmentId", "==", enrollmentId)
    .get();
  const nowMs = Date.now();
  const financialBySessionId = await fetchFinancialStateBySessionId(
    db,
    existingSnap.docs.map((docSnap) => docSnap.id),
  );

  const configuredSessionSignatures = new Set<string>();
  const configuredSlotPatterns = new Set<string>();
  weeklySlots.forEach((slot) => {
    configuredSlotPatterns.add(`${slot.weekday}|${slot.timeHHmm}|${slot.durationMinutes}|${teacherId || ""}`);
  });
  for (
    let d = new Date(rangeStartDate.getTime());
    d.getTime() <= rangeEndDate.getTime();
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dayOfWeek = d.getUTCDay();
    const daySlots = slotsByWeekday.get(dayOfWeek);
    if (!daySlots || daySlots.length === 0) continue;

    const ymd = toYmdFromContextDate(d);
    for (const slot of daySlots) {
      configuredSessionSignatures.add(`${ymd}|${slot.timeHHmm}|${slot.durationMinutes}|${teacherId || ""}`);
    }
  }
  const sessionSignatureCounts = new Map<string, number>();
  for (const sessionDoc of existingSnap.docs) {
    const raw = sessionDoc.data() as Record<string, unknown>;
    const signature = resolveSessionSignature({raw, fallbackTeacherId: teacherId});
    if (signature) {
      const [sessionYmd] = signature.split("|");
      if (sessionYmd >= rangeStartYmd && sessionYmd <= rangeEndYmd) {
        sessionSignatureCounts.set(signature, (sessionSignatureCounts.get(signature) || 0) + 1);
      }
    }
  }

  let replaced = 0;
  if (replaceFuture) {
    let deleteBatch = db.batch();
    let deleteOps = 0;

    for (const sessionDoc of existingSnap.docs) {
      const raw = sessionDoc.data() as Record<string, unknown>;
      const financial = financialBySessionId.get(sessionDoc.id);
      const signature = resolveSessionSignature({raw, fallbackTeacherId: teacherId});
      const slotPattern = resolveSessionSlotPattern({raw, fallbackTeacherId: teacherId});
      const sessionYmd = resolveSessionYmd(raw);

      if (!isSessionReplaceable({raw, financial, nowMs})) continue;
      if (isScheduleExceptionSession(raw)) continue;

      const isWithinReplacementRange =
        typeof sessionYmd === "string" && sessionYmd >= rangeStartYmd && sessionYmd <= rangeEndYmd;
      const isSlotPatternStale = !!slotPattern && !configuredSlotPatterns.has(slotPattern);
      const isRemovedOrChangedSignature =
        isWithinReplacementRange && (!signature || !configuredSessionSignatures.has(signature));
      const isDuplicateUpcomingSignature = signature ? (sessionSignatureCounts.get(signature) || 0) > 1 : false;
      if (!isRemovedOrChangedSignature && !isDuplicateUpcomingSignature && !isSlotPatternStale) continue;

      deleteBatch.delete(sessionDoc.ref);
      deleteOps += 1;
      replaced += 1;

      if (signature) {
        const current = sessionSignatureCounts.get(signature) || 0;
        if (current <= 1) {
          sessionSignatureCounts.delete(signature);
        } else {
          sessionSignatureCounts.set(signature, current - 1);
        }
      }

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

  const postCleanupSnap = replaceFuture ?
    await db.collection("classSessions").where("enrollmentId", "==", enrollmentId).get() :
    existingSnap;

  const activeFutureRegularDocs: Array<{
    docRef: admin.firestore.DocumentReference;
    signature: string;
    startMs: number;
  }> = [];
  const pausedFutureRegularDocs: Array<{ signature: string; startMs: number }> = [];
  let plannedSessionsConsumed = 0;
  const occupiedRegularSignatures = new Set<string>();
  const postCleanupSignatureCounts = new Map<string, number>();

  for (const sessionDoc of postCleanupSnap.docs) {
    const raw = sessionDoc.data() as Record<string, unknown>;
    const signature = resolveSessionSignature({ raw, fallbackTeacherId: teacherId });
    if (!signature) continue;
    occupiedRegularSignatures.add(signature);
    postCleanupSignatureCounts.set(signature, (postCleanupSignatureCounts.get(signature) || 0) + 1);

    const financial = financialBySessionId.get(sessionDoc.id);
    if (isRegularConsumedSession(raw, financial)) {
      plannedSessionsConsumed += 1;
      continue;
    }

    const startMs = resolveSessionStartMs(raw);
    if (startMs === null) continue;

    if (
      isFutureOperationalRegularSession({
        raw,
        nowMs,
        configuredSlotPatterns,
        fallbackTeacherId: teacherId,
      })
    ) {
      activeFutureRegularDocs.push({
        docRef: sessionDoc.ref,
        signature,
        startMs,
      });
      continue;
    }

    if (
      isFuturePausedRegularSession({
        raw,
        nowMs,
        configuredSlotPatterns,
        fallbackTeacherId: teacherId,
      })
    ) {
      pausedFutureRegularDocs.push({ signature, startMs });
    }
  }

  activeFutureRegularDocs.sort((a, b) => a.startMs - b.startMs);
  pausedFutureRegularDocs.sort((a, b) => a.startMs - b.startMs);

  const targetActiveFutureRegular = plannedSessionsTarget ?
    Math.max(plannedSessionsTarget - plannedSessionsConsumed, 0) :
    Number.MAX_SAFE_INTEGER;

  if (replaceFuture && activeFutureRegularDocs.length > targetActiveFutureRegular) {
    let trimBatch = db.batch();
    let trimOps = 0;
    const removable = activeFutureRegularDocs.slice(targetActiveFutureRegular);
    for (const entry of removable) {
      trimBatch.delete(entry.docRef);
      trimOps += 1;
      replaced += 1;
      occupiedRegularSignatures.delete(entry.signature);
      const current = postCleanupSignatureCounts.get(entry.signature) || 0;
      if (current <= 1) {
        postCleanupSignatureCounts.delete(entry.signature);
      } else {
        postCleanupSignatureCounts.set(entry.signature, current - 1);
      }
      if (trimOps >= MAX_BATCH) {
        await trimBatch.commit();
        trimBatch = db.batch();
        trimOps = 0;
      }
    }
    if (trimOps > 0) {
      await trimBatch.commit();
    }
    activeFutureRegularDocs.splice(targetActiveFutureRegular);
  }

  let additionalNeeded = Math.max(targetActiveFutureRegular - activeFutureRegularDocs.length, 0);
  plannedSessionsGenerated = plannedSessionsConsumed + activeFutureRegularDocs.length;

  for (const candidate of sessionCandidates) {
    if (additionalNeeded <= 0) break;

    const candidateYmd = toYmdFromContextDate(candidate.sessionDate);
    const candidateSignature = `${candidateYmd}|${candidate.startTime}|${candidate.durationMinutes}|${teacherId || ""}`;
    if (occupiedRegularSignatures.has(candidateSignature) || (postCleanupSignatureCounts.get(candidateSignature) || 0) > 0) {
      skipped += 1;
      continue;
    }

    const classSessionRef = db.collection("classSessions").doc(candidate.sessionId);
    const existing = await classSessionRef.get();
    if (existing.exists) {
      skipped += 1;
      continue;
    }

    const payload = removeUndefinedDeep({
      enrollmentId,
      kidId,
      kidIds,
      ...(studentId ? {studentId} : {}),
      ...(childId ? {childId} : {}),
      ...(studentName ? {studentName} : {}),
      ...(kidName ? {kidName} : {}),
      ...(childName ? {childName} : {}),
      parentId,
      parentIds,
      teacherId,
      ...(teacherIds.length > 0 ? {teacherIds} : {}),
      ...(teacherName ? {teacherName} : {}),
      ...(teacherEmail ? {teacherEmail} : {}),
      ...(teacherId ? {assignedTeacherId: teacherId, primaryTeacherId: teacherId, teacherUid: teacherId, teacher_id: teacherId} : {}),
      courseId,
      ...(courseName ? {courseName} : {}),
      ...(courseName ? {courseTitle: courseName, courseLabel: courseName} : {}),
      startAt: admin.firestore.Timestamp.fromDate(candidate.startAtDate),
      endAt: admin.firestore.Timestamp.fromDate(candidate.endAtDate),
      date: candidateYmd,
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
    }) as Record<string, unknown>;

    writeBatch.set(classSessionRef, payload);
    created += 1;
    writeOps += 1;
    occupiedRegularSignatures.add(candidateSignature);
    postCleanupSignatureCounts.set(candidateSignature, (postCleanupSignatureCounts.get(candidateSignature) || 0) + 1);
    additionalNeeded -= 1;
    plannedSessionsGenerated += 1;

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
  const plannedSessionsActiveFuture = plannedSessionsGenerated - plannedSessionsConsumed;
  const plannedSessionsRemaining = plannedSessionsTarget ?
    Math.max(plannedSessionsTarget - plannedSessionsConsumed, 0) :
    0;
  const plannedSessionsUnfilled = plannedSessionsTarget ?
    Math.max(plannedSessionsTarget - plannedSessionsGenerated, 0) :
    0;
  const plannedSessionsCapReached = Boolean(plannedSessionsTarget && plannedSessionsConsumed >= plannedSessionsTarget);
  const plannedSessionsPausedFuture = pausedFutureRegularDocs.length;

  logger.info("Sessions generated from schedule", {
    enrollmentId,
    replaceFuture,
    created,
    skipped,
    replaced,
    plannedSessionsTarget,
    plannedSessionsGenerated,
    plannedSessionsConsumed,
    plannedSessionsActiveFuture,
    plannedSessionsPausedFuture,
    plannedSessionsRemaining,
    plannedSessionsUnfilled,
    plannedSessionsCapReached,
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
    plannedSessionsConsumed,
    plannedSessionsActiveFuture,
    plannedSessionsPausedFuture,
    plannedSessionsRemaining,
    plannedSessionsUnfilled,
    plannedSessionsCapReached,
    rangeStart: rangeStartIso,
    rangeEnd: rangeEndIso,
    rangeStartYmd,
    rangeEndYmd,
  };
}

type RepairSessionDocInfo = {
  id: string;
  ref: admin.firestore.DocumentReference;
  raw: Record<string, unknown>;
  financial: SessionFinancialLinkState | undefined;
  startMs: number | null;
  signature: string | null;
  slotPattern: string | null;
};

type RepairSessionCandidate = {
  sessionId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  signature: string;
  startAtDate: Date;
  endAtDate: Date;
};

type RepairContext = {
  enrollmentId: string;
  enrollment: EnrollmentDoc;
  weeklySlots: NormalizedWeeklySlot[];
  rangeStartYmd: string;
  rangeEndYmd: string;
  plannedSessionsTarget: number | null;
  kidId: string | null;
  kidIds: string[];
  studentId: string | null;
  childId: string | null;
  parentId: string | null;
  parentIds: string[];
  teacherId: string | null;
  teacherIds: string[];
  courseId: string | null;
  feeAmount: number;
  currency: string;
  joinUrl: string | null;
  studentName: string | null;
  kidName: string | null;
  childName: string | null;
  parentName: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  courseName: string | null;
  sessions: RepairSessionDocInfo[];
  configuredSlotPatterns: Set<string>;
};

type RepairPlan = {
  created: number;
  skipped: number;
  replaced: number;
  plannedSessionsTarget: number | null;
  plannedSessionsGenerated: number;
  plannedSessionsConsumed: number;
  plannedSessionsActiveFuture: number;
  plannedSessionsPausedFuture: number;
  plannedSessionsRemaining: number;
  plannedSessionsUnfilled: number;
  plannedSessionsCapReached: boolean;
  rangeStartYmd: string;
  rangeEndYmd: string;
  missingSessionsToCreate: RepairPlanSessionPreview[];
  staleSessionsToUpdate: RepairPlanSessionPreview[];
  duplicateOldTimeSessions: RepairPlanSessionPreview[];
  unsafeSessionsSkipped: RepairPlanSessionPreview[];
  teacherAliasProblems: RepairTeacherAliasProblem[];
  finalCounts: RepairFinalCounts;
  createWrites: Array<{ ref: admin.firestore.DocumentReference; payload: Record<string, unknown> }>;
  patchWrites: Array<{ ref: admin.firestore.DocumentReference; payload: Record<string, unknown> }>;
  cancelWrites: Array<{ ref: admin.firestore.DocumentReference; payload: Record<string, unknown> }>;
  auditWrites: Array<{ ref: admin.firestore.DocumentReference; payload: Record<string, unknown> }>;
};

function collectSessionTeacherRefs(raw: Record<string, unknown>): string[] {
  return Array.from(
    new Set(
      [
        ...(Array.isArray(raw.teacherIds) ? raw.teacherIds : []),
        raw.teacherId,
        raw.assignedTeacherId,
        raw.primaryTeacherId,
        raw.teacherUid,
        raw.teacher_id,
      ]
        .map((entry) => toOptionalText(entry))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );
}

function normalizeSnapshotName(value: unknown): string | null {
  const name = toOptionalText(value);
  if (!name) return null;
  if (/^\d+\s+assigned$/i.test(name)) return null;
  if (/^assigned$/i.test(name)) return null;
  if (/^\d+\s+students?$/i.test(name)) return null;
  if (/^(student|child|kid)$/i.test(name)) return null;
  if (/^student name pending$/i.test(name)) return null;
  return name;
}

function resolveUserName(data: Record<string, unknown> | null, fallback: unknown): string | null {
  return (
    normalizeSnapshotName(data?.displayName) ||
    normalizeSnapshotName(data?.name) ||
    normalizeSnapshotName(data?.fullName) ||
    normalizeSnapshotName(data?.studentName) ||
    normalizeSnapshotName(data?.childName) ||
    normalizeSnapshotName(data?.kidName) ||
    normalizeSnapshotName(fallback)
  );
}

function buildCanonicalSessionFields(args: {
  context: RepairContext;
  candidate: RepairSessionCandidate;
}): Record<string, unknown> {
  const { context, candidate } = args;
  return removeUndefinedDeep({
    enrollmentId: context.enrollmentId,
    kidId: context.kidId,
    kidIds: context.kidIds,
    ...(context.studentId ? { studentId: context.studentId } : {}),
    ...(context.childId ? { childId: context.childId } : {}),
    ...(context.studentName ? { studentName: context.studentName, studentNameSnapshot: context.studentName } : {}),
    ...(context.kidName ? { kidName: context.kidName } : {}),
    ...(context.childName ? { childName: context.childName } : {}),
    ...(context.parentName ? { parentName: context.parentName, parentNameSnapshot: context.parentName } : {}),
    parentId: context.parentId,
    parentIds: context.parentIds,
    teacherId: context.teacherId,
    ...(context.teacherIds.length > 0 ? { teacherIds: context.teacherIds } : {}),
    ...(context.teacherId ? {
      assignedTeacherId: context.teacherId,
      primaryTeacherId: context.teacherId,
      teacherUid: context.teacherId,
      teacher_id: context.teacherId,
    } : {}),
    ...(context.teacherName ? { teacherName: context.teacherName, teacherNameSnapshot: context.teacherName } : {}),
    ...(context.teacherEmail ? { teacherEmail: context.teacherEmail } : {}),
    courseId: context.courseId,
    ...(context.courseName ? {
      courseName: context.courseName,
      courseTitle: context.courseName,
      courseLabel: context.courseName,
      subject: context.courseName,
    } : {}),
    startAt: admin.firestore.Timestamp.fromDate(candidate.startAtDate),
    endAt: admin.firestore.Timestamp.fromDate(candidate.endAtDate),
    date: candidate.date,
    startTime: candidate.startTime,
    endTime: candidate.endTime,
    durationMinutes: candidate.durationMinutes,
    durationMins: candidate.durationMinutes,
    status: "scheduled",
    attendance: null,
    feeAmount: context.feeAmount,
    currency: context.currency,
    joinUrl: context.joinUrl,
  }) as Record<string, unknown>;
}

function sameScalar(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  const aDate = toDateMaybe(a);
  const bDate = toDateMaybe(b);
  if (aDate && bDate) return aDate.getTime() === bDate.getTime();
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => sameScalar(value, b[index]));
  }
  return false;
}

function buildCanonicalPatch(existing: Record<string, unknown>, canonical: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  Object.entries(canonical).forEach(([key, value]) => {
    if (!sameScalar(existing[key], value)) {
      patch[key] = value;
    }
  });
  return patch;
}

function inspectTeacherAliasProblem(
  session: RepairSessionDocInfo,
  expectedTeacherId: string | null,
): RepairTeacherAliasProblem | null {
  if (!expectedTeacherId) return null;
  const raw = session.raw;
  const actualTeacherRefs = collectSessionTeacherRefs(raw);
  const missingFields: string[] = [];
  const mismatchedFields: string[] = [];

  const directAliases: Array<["teacherId" | "assignedTeacherId" | "primaryTeacherId" | "teacherUid" | "teacher_id", unknown]> = [
    ["teacherId", raw.teacherId],
    ["assignedTeacherId", raw.assignedTeacherId],
    ["primaryTeacherId", raw.primaryTeacherId],
    ["teacherUid", raw.teacherUid],
    ["teacher_id", raw.teacher_id],
  ];

  directAliases.forEach(([field, value]) => {
    const normalized = toOptionalText(value);
    if (!normalized) {
      missingFields.push(field);
      return;
    }
    if (normalized !== expectedTeacherId) {
      mismatchedFields.push(field);
    }
  });

  const teacherIds = Array.isArray(raw.teacherIds) ? raw.teacherIds : [];
  if (!teacherIds.length) {
    missingFields.push("teacherIds");
  } else if (!teacherIds.map((entry) => toOptionalText(entry)).includes(expectedTeacherId)) {
    mismatchedFields.push("teacherIds");
  }

  if (missingFields.length === 0 && mismatchedFields.length === 0) return null;

  return {
    sessionId: session.id,
    date: resolveSessionYmd(raw),
    startTime: toOptionalText(raw.startTime),
    expectedTeacherId,
    actualTeacherRefs,
    missingFields,
    mismatchedFields,
  };
}

function explainUnsafeRepairReasons(session: RepairSessionDocInfo, nowMs: number): string[] {
  const reasons: string[] = [];
  const { raw, financial } = session;
  const startMs = session.startMs;
  if (startMs === null || startMs <= nowMs) reasons.push("past_or_missing_start");
  const status = normalizeStatus(raw.status);
  if (NON_REPLACEABLE_SESSION_STATUSES.has(status)) reasons.push(`status_${status || "unknown"}`);
  if (!REPLACEABLE_SESSION_STATUSES.has(status)) reasons.push(`non_replaceable_${status || "unknown"}`);
  if (hasAttendanceMarked(raw)) reasons.push("attendance_marked");
  if (hasSessionFinanceOrLockMarkers(raw)) reasons.push("finance_or_lock_marker");
  if (hasFinancialLink(financial)) reasons.push("finance_linked");
  if (isScheduleExceptionSession(raw)) reasons.push("schedule_exception");
  return Array.from(new Set(reasons));
}

async function loadRepairContext(args: {
  enrollmentId: string;
}): Promise<RepairContext> {
  const { enrollmentId } = args;
  const db = admin.firestore();
  const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists) {
    throw new HttpsError("not-found", `Enrollment ${enrollmentId} not found`);
  }

  const enrollment = enrollmentSnap.data() as EnrollmentDoc;
  if (!isEnrollmentOperationallyActive(enrollment as unknown as Record<string, unknown>)) {
    throw new HttpsError("failed-precondition", "Enrollment is not active");
  }

  const weeklySlots = normalizeScheduleSlotsOrThrow(enrollment.schedule);
  if (weeklySlots.length === 0) {
    throw new HttpsError("failed-precondition", "Enrollment has no schedule configured");
  }

  const plannedSessionsTarget = toPlannedSessions(enrollment.schedule?.plannedSessions);
  const weeksAhead = Number.isFinite(Number(enrollment.schedule?.weeksAhead)) ?
    Math.max(1, Math.min(52, Math.floor(Number(enrollment.schedule?.weeksAhead)))) :
    8;
  const rangeStartYmd =
    toYmdFromDateLike(enrollment.classesStartDateYmd) ||
    toYmdFromDateLike(enrollment.classesStartDate) ||
    toYmdFromDateLike(enrollment.startDateYmd) ||
    toYmdFromDateLike(enrollment.startDate) ||
    toIstTodayYmd();
  const requestedEndYmd =
    typeof enrollment.schedule?.endDateYmd === "string" && enrollment.schedule.endDateYmd.trim() ?
      enrollment.schedule.endDateYmd.trim() :
      "";
  const rangeStartDate = toContextDateFromYmd(rangeStartYmd);
  if (!rangeStartDate) {
    throw new HttpsError("invalid-argument", "Unable to resolve schedule start date");
  }
  const rangeEndDate = requestedEndYmd ?
    toContextDateFromYmd(requestedEndYmd) :
    new Date(rangeStartDate.getTime() + (Math.max(weeksAhead * 7, plannedSessionsTarget ? 400 : weeksAhead * 7) - 1) * 24 * 60 * 60 * 1000);
  if (!rangeEndDate) {
    throw new HttpsError("invalid-argument", "Unable to resolve schedule end date");
  }
  const rangeEndYmd = toYmdFromContextDate(rangeEndDate);

  const kidId = enrollment.kidId || (enrollment.kidIds && enrollment.kidIds[0]) || null;
  const kidIds = enrollment.kidIds || (kidId ? [kidId] : []);
  const studentId = enrollment.studentId || kidId || null;
  const childId = enrollment.childId || kidId || null;
  const parentId = enrollment.parentId || (enrollment.parentIds && enrollment.parentIds[0]) || null;
  const parentIds = enrollment.parentIds || (parentId ? [parentId] : []);
  const { teacherId, teacherIds } = resolveEnrollmentTeacherIdentity(enrollment);
  const courseId = enrollment.courseId || null;
  const feeAmount = Number(enrollment.feePerClass || 0);
  const currency = enrollment.currency || "INR";
  const joinUrl = enrollment.joinUrl || null;

  const [kidSnap, parentSnap, courseSnap, teacherSnap, sessionsSnap] = await Promise.all([
    kidId ? db.collection("kids").doc(kidId).get() : Promise.resolve(null),
    parentId ? db.collection("users").doc(parentId).get() : Promise.resolve(null),
    courseId ? db.collection("courses").doc(courseId).get() : Promise.resolve(null),
    teacherId ? db.collection("users").doc(teacherId).get() : Promise.resolve(null),
    db.collection("classSessions").where("enrollmentId", "==", enrollmentId).get(),
  ]);

  const kidData = kidSnap?.exists ? (kidSnap.data() as Record<string, unknown>) : null;
  const parentData = parentSnap?.exists ? (parentSnap.data() as Record<string, unknown>) : null;
  const courseData = courseSnap?.exists ? (courseSnap.data() as Record<string, unknown>) : null;
  const teacherData = teacherSnap?.exists ? (teacherSnap.data() as Record<string, unknown>) : null;

  const studentName =
    normalizeSnapshotName(enrollment.studentName) ||
    normalizeSnapshotName(enrollment.kidName) ||
    normalizeSnapshotName(enrollment.childName) ||
    resolveUserName(kidData, null) ||
    null;
  const kidName = normalizeSnapshotName(enrollment.kidName) || studentName;
  const childName = normalizeSnapshotName(enrollment.childName) || studentName;
  const parentName = resolveUserName(parentData, (enrollment as Record<string, unknown>).parentName);
  const teacherName =
    resolveUserName(teacherData, enrollment.teacherName) ||
    teacherId;
  const teacherEmail = toOptionalText(enrollment.teacherEmail) || toOptionalText(teacherData?.email) || null;
  const courseName =
    normalizeSnapshotName(enrollment.courseName) ||
    normalizeSnapshotName((enrollment as Record<string, unknown>).courseLabel) ||
    normalizeSnapshotName((enrollment as Record<string, unknown>).courseTitle) ||
    normalizeSnapshotName(courseData?.title) ||
    normalizeSnapshotName(courseData?.name) ||
    courseId ||
    null;

  const financialBySessionId = await fetchFinancialStateBySessionId(
    db,
    sessionsSnap.docs.map((docSnap) => docSnap.id),
  );
  const configuredSlotPatterns = new Set<string>();
  weeklySlots.forEach((slot) => {
    configuredSlotPatterns.add(`${slot.weekday}|${slot.timeHHmm}|${slot.durationMinutes}|${teacherId || ""}`);
  });

  const sessions = sessionsSnap.docs.map((docSnap) => {
    const raw = (docSnap.data() || {}) as Record<string, unknown>;
    return {
      id: docSnap.id,
      ref: docSnap.ref,
      raw,
      financial: financialBySessionId.get(docSnap.id),
      startMs: resolveSessionStartMs(raw),
      signature: resolveSessionSignature({ raw, fallbackTeacherId: teacherId }),
      slotPattern: resolveSessionSlotPattern({ raw, fallbackTeacherId: teacherId }),
    };
  });

  return {
    enrollmentId,
    enrollment,
    weeklySlots,
    rangeStartYmd,
    rangeEndYmd,
    plannedSessionsTarget,
    kidId,
    kidIds,
    studentId,
    childId,
    parentId,
    parentIds,
    teacherId,
    teacherIds,
    courseId,
    feeAmount,
    currency,
    joinUrl,
    studentName,
    kidName,
    childName,
    parentName,
    teacherName,
    teacherEmail,
    courseName,
    sessions,
    configuredSlotPatterns,
  };
}

export function buildRepairEnrollmentFutureSessionsPlan(args: {
  context: RepairContext;
  nowMs: number;
  repairBatchId: string;
  actorUid: string | null;
}): RepairPlan {
  const { context, nowMs, repairBatchId, actorUid } = args;
  const actorIdentity = actorUid || "repairEnrollmentFutureSessionsFromSchedule";
  const slotsByWeekday = new Map<number, NormalizedWeeklySlot[]>();
  context.weeklySlots.forEach((slot) => {
    const existing = slotsByWeekday.get(slot.weekday) || [];
    existing.push(slot);
    slotsByWeekday.set(slot.weekday, existing);
  });

  let plannedSessionsConsumed = 0;
  const pausedFutureRegularDocs: RepairSessionDocInfo[] = [];
  const safeFutureRegularBySignature = new Map<string, RepairSessionDocInfo[]>();
  const safeFutureRegularOutsideTarget: RepairSessionDocInfo[] = [];
  const unsafeFutureRegular = new Map<string, RepairSessionDocInfo[]>();
  const teacherAliasProblems: RepairTeacherAliasProblem[] = [];

  context.sessions.forEach((session) => {
    const teacherAliasProblem = inspectTeacherAliasProblem(session, context.teacherId);
    if (teacherAliasProblem) {
      teacherAliasProblems.push(teacherAliasProblem);
    }

    if (isRegularConsumedSession(session.raw, session.financial)) {
      plannedSessionsConsumed += 1;
      return;
    }

    if (isFuturePausedRegularSession({
      raw: session.raw,
      nowMs,
      configuredSlotPatterns: context.configuredSlotPatterns,
      fallbackTeacherId: context.teacherId,
    })) {
      pausedFutureRegularDocs.push(session);
      return;
    }

    if (session.startMs === null || session.startMs <= nowMs) return;
    if (isScheduleExceptionSession(session.raw)) return;

    if (!isSessionReplaceable({ raw: session.raw, financial: session.financial, nowMs })) {
      const signature = session.signature || `unsafe:${session.id}`;
      const existing = unsafeFutureRegular.get(signature) || [];
      existing.push(session);
      unsafeFutureRegular.set(signature, existing);
      return;
    }

    if (session.signature) {
      const existing = safeFutureRegularBySignature.get(session.signature) || [];
      existing.push(session);
      safeFutureRegularBySignature.set(session.signature, existing);
    } else {
      safeFutureRegularOutsideTarget.push(session);
    }
  });

  const targetActiveFutureRegular = context.plannedSessionsTarget ?
    Math.max(context.plannedSessionsTarget - plannedSessionsConsumed, 0) :
    Number.MAX_SAFE_INTEGER;

  const sessionCandidates: RepairSessionCandidate[] = [];
  const rangeStartDate = toContextDateFromYmd(context.rangeStartYmd)!;
  const rangeEndDate = toContextDateFromYmd(context.rangeEndYmd)!;
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
    const ymd = toYmdFromContextDate(d);

    for (const slot of daySlots) {
      const istStartContextMs = Date.UTC(year, month, date, slot.hour, slot.minute, 0, 0);
      const startAtUtcMs = istStartContextMs - IST_OFFSET_MINUTES * 60 * 1000;
      const startAtDate = new Date(startAtUtcMs);
      if (startAtDate.getTime() <= nowMs) continue;
      const endAtDate = new Date(startAtUtcMs + slot.durationMinutes * 60 * 1000);
      const hhmmCompact = `${String(slot.hour).padStart(2, "0")}${String(slot.minute).padStart(2, "0")}`;
      sessionCandidates.push({
        sessionId: `${context.enrollmentId}_${ymd.replace(/-/g, "")}_${hhmmCompact}`,
        date: ymd,
        startTime: slot.timeHHmm,
        endTime: formatHHmmFromContextMs(istStartContextMs + slot.durationMinutes * 60 * 1000),
        durationMinutes: slot.durationMinutes,
        signature: `${ymd}|${slot.timeHHmm}|${slot.durationMinutes}|${context.teacherId || ""}`,
        startAtDate,
        endAtDate,
      });
    }
  }

  sessionCandidates.sort((a, b) => a.startAtDate.getTime() - b.startAtDate.getTime());
  const targetCandidates = targetActiveFutureRegular === Number.MAX_SAFE_INTEGER ?
    sessionCandidates :
    sessionCandidates.slice(0, targetActiveFutureRegular);
  const targetSignatures = new Set(targetCandidates.map((candidate) => candidate.signature));

  const createWrites: RepairPlan["createWrites"] = [];
  const patchWrites: RepairPlan["patchWrites"] = [];
  const cancelWrites: RepairPlan["cancelWrites"] = [];
  const auditWrites: RepairPlan["auditWrites"] = [];
  const missingSessionsToCreate: RepairPlanSessionPreview[] = [];
  const staleSessionsToUpdate: RepairPlanSessionPreview[] = [];
  const duplicateOldTimeSessions: RepairPlanSessionPreview[] = [];
  const unsafeSessionsSkipped: RepairPlanSessionPreview[] = [];

  const buildAuditPayload = (
    sessionId: string,
    action: RepairPlanSessionPreview["action"],
    reasons: string[],
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ) => ({
    type: "enrollment_future_session_schedule_repair",
    enrollmentId: context.enrollmentId,
    sessionId,
    action,
    reasons,
    before,
    after,
    repairBatchId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: actorIdentity,
  });

  targetCandidates.forEach((candidate) => {
    const safeMatches = [...(safeFutureRegularBySignature.get(candidate.signature) || [])].sort((a, b) => a.id.localeCompare(b.id));
    const unsafeMatches = [...(unsafeFutureRegular.get(candidate.signature) || [])];
    if (unsafeMatches.length > 0 && safeMatches.length === 0) {
      unsafeMatches.forEach((session) => {
        unsafeSessionsSkipped.push({
          sessionId: session.id,
          date: candidate.date,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          status: toOptionalText(session.raw.status) || "scheduled",
          action: "skip_unsafe",
          reasons: explainUnsafeRepairReasons(session, nowMs),
        });
      });
      return;
    }

    if (safeMatches.length === 0) {
      const payload = {
        ...buildCanonicalSessionFields({ context, candidate }),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: actorIdentity,
        updatedBy: actorIdentity,
        source: "enrollmentScheduleRepair",
        repairBatchId,
      };
      createWrites.push({
        ref: admin.firestore().collection("classSessions").doc(candidate.sessionId),
        payload,
      });
      missingSessionsToCreate.push({
        sessionId: candidate.sessionId,
        date: candidate.date,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        status: "scheduled",
        action: "create",
        reasons: ["missing_future_regular_session"],
      });
      auditWrites.push({
        ref: admin.firestore().collection("auditLogs").doc(),
        payload: buildAuditPayload(candidate.sessionId, "create", ["missing_future_regular_session"], null, {
          date: candidate.date,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          teacherId: context.teacherId,
        }),
      });
      return;
    }

    const keepSession = safeMatches[0];
    const canonicalFields = buildCanonicalSessionFields({ context, candidate });
    const canonicalPatch = buildCanonicalPatch(keepSession.raw, canonicalFields);
    if (Object.keys(canonicalPatch).length > 0) {
      const patchPayload = {
        ...canonicalPatch,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: actorIdentity,
        repairBatchId,
      };
      patchWrites.push({ ref: keepSession.ref, payload: patchPayload });
      staleSessionsToUpdate.push({
        sessionId: keepSession.id,
        date: candidate.date,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        status: "scheduled",
        action: "patch",
        reasons: ["denormalized_fields_out_of_sync"],
      });
      auditWrites.push({
        ref: admin.firestore().collection("auditLogs").doc(),
        payload: buildAuditPayload(keepSession.id, "patch", ["denormalized_fields_out_of_sync"], {
          date: keepSession.raw.date,
          startTime: keepSession.raw.startTime,
          status: keepSession.raw.status,
        }, {
          date: candidate.date,
          startTime: candidate.startTime,
          status: "scheduled",
        }),
      });
    }

    safeMatches.slice(1).forEach((duplicate) => {
      cancelWrites.push({
        ref: duplicate.ref,
        payload: {
          status: "cancelled",
          cancelledReason: "schedule_repair_duplicate",
          replacedBySessionId: keepSession.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorIdentity,
          repairBatchId,
        },
      });
      staleSessionsToUpdate.push({
        sessionId: duplicate.id,
        date: candidate.date,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        status: "cancelled",
        action: "cancel_duplicate",
        reasons: ["duplicate_future_regular_session"],
        replacementSessionId: keepSession.id,
      });
      auditWrites.push({
        ref: admin.firestore().collection("auditLogs").doc(),
        payload: buildAuditPayload(duplicate.id, "cancel_duplicate", ["duplicate_future_regular_session"], {
          date: duplicate.raw.date,
          startTime: duplicate.raw.startTime,
          status: duplicate.raw.status,
        }, {
          status: "cancelled",
          replacedBySessionId: keepSession.id,
        }),
      });
    });
  });

  context.sessions.forEach((session) => {
    if (session.startMs === null || session.startMs <= nowMs) return;
    if (isScheduleExceptionSession(session.raw)) return;
    if (!isSessionReplaceable({ raw: session.raw, financial: session.financial, nowMs })) {
      if (resolveSessionSignature({ raw: session.raw, fallbackTeacherId: context.teacherId }) && !targetSignatures.has(resolveSessionSignature({ raw: session.raw, fallbackTeacherId: context.teacherId })!)) {
        unsafeSessionsSkipped.push({
          sessionId: session.id,
          date: resolveSessionYmd(session.raw) || context.rangeStartYmd,
          startTime: toOptionalText(session.raw.startTime) || "",
          endTime: toOptionalText(session.raw.endTime) || "",
          status: toOptionalText(session.raw.status) || "scheduled",
          action: "skip_unsafe",
          reasons: explainUnsafeRepairReasons(session, nowMs),
        });
      }
      return;
    }
    const signature = session.signature;
    if (!signature) {
      unsafeSessionsSkipped.push({
        sessionId: session.id,
        date: resolveSessionYmd(session.raw) || context.rangeStartYmd,
        startTime: toOptionalText(session.raw.startTime) || "",
        endTime: toOptionalText(session.raw.endTime) || "",
        status: toOptionalText(session.raw.status) || "scheduled",
        action: "skip_unsafe",
        reasons: ["missing_signature"],
      });
      return;
    }
    if (targetSignatures.has(signature)) return;

    const slotPattern = session.slotPattern;
    const date = resolveSessionYmd(session.raw) || context.rangeStartYmd;
    const startTime = toOptionalText(session.raw.startTime) || "";
    const endTime = toOptionalText(session.raw.endTime) || "";
    const action = slotPattern && context.configuredSlotPatterns.has(slotPattern) ? "cancel_excess" : "cancel_stale";
    const reasons = action === "cancel_excess" ? ["future_regular_session_beyond_planned_limit"] : ["future_regular_session_old_schedule_time"];

    cancelWrites.push({
      ref: session.ref,
      payload: {
        status: "cancelled",
        cancelledReason: action === "cancel_excess" ? "schedule_repair_excess" : "schedule_repair_old_time",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: actorIdentity,
        repairBatchId,
      },
    });

    const preview: RepairPlanSessionPreview = {
      sessionId: session.id,
      date,
      startTime,
      endTime,
      status: "cancelled",
      action,
      reasons,
    };
    if (action === "cancel_stale") {
      duplicateOldTimeSessions.push(preview);
    } else {
      staleSessionsToUpdate.push(preview);
    }

    auditWrites.push({
      ref: admin.firestore().collection("auditLogs").doc(),
      payload: buildAuditPayload(session.id, action, reasons, {
        date: session.raw.date,
        startTime: session.raw.startTime,
        status: session.raw.status,
      }, {
        status: "cancelled",
      }),
    });
  });

  const finalCounts: RepairFinalCounts = {
    createCount: missingSessionsToCreate.length,
    patchCount: staleSessionsToUpdate.filter((entry) => entry.action === "patch").length,
    cancelCount: staleSessionsToUpdate.filter((entry) => entry.action !== "patch").length + duplicateOldTimeSessions.length,
    unsafeSkippedCount: unsafeSessionsSkipped.length,
    teacherAliasProblemCount: teacherAliasProblems.length,
  };
  const plannedSessionsGenerated = plannedSessionsConsumed + targetCandidates.length;
  const plannedSessionsActiveFuture = targetCandidates.length;
  const plannedSessionsRemaining = context.plannedSessionsTarget ?
    Math.max(context.plannedSessionsTarget - plannedSessionsConsumed, 0) :
    0;
  const plannedSessionsUnfilled = context.plannedSessionsTarget ?
    Math.max(context.plannedSessionsTarget - plannedSessionsGenerated, 0) :
    0;
  const plannedSessionsCapReached = Boolean(context.plannedSessionsTarget && plannedSessionsConsumed >= context.plannedSessionsTarget);

  return {
    created: missingSessionsToCreate.length,
    skipped: targetCandidates.length - missingSessionsToCreate.length + unsafeSessionsSkipped.length,
    replaced: finalCounts.patchCount + finalCounts.cancelCount,
    plannedSessionsTarget: context.plannedSessionsTarget,
    plannedSessionsGenerated,
    plannedSessionsConsumed,
    plannedSessionsActiveFuture,
    plannedSessionsPausedFuture: pausedFutureRegularDocs.length,
    plannedSessionsRemaining,
    plannedSessionsUnfilled,
    plannedSessionsCapReached,
    rangeStartYmd: context.rangeStartYmd,
    rangeEndYmd: context.rangeEndYmd,
    missingSessionsToCreate,
    staleSessionsToUpdate,
    duplicateOldTimeSessions,
    unsafeSessionsSkipped,
    teacherAliasProblems,
    finalCounts,
    createWrites,
    patchWrites,
    cancelWrites,
    auditWrites,
  };
}

async function applyRepairPlan(plan: RepairPlan, dryRun: boolean): Promise<void> {
  if (dryRun) return;
  const db = admin.firestore();
  const allWrites = [...plan.createWrites, ...plan.patchWrites, ...plan.cancelWrites, ...plan.auditWrites];
  for (let index = 0; index < allWrites.length; index += MAX_BATCH) {
    const batch = db.batch();
    allWrites.slice(index, index + MAX_BATCH).forEach((entry) => {
      batch.set(entry.ref, entry.payload, { merge: true });
    });
    await batch.commit();
  }
}

export async function executeRepairEnrollmentFutureSessionsFromSchedule(args: {
  loadContext: () => Promise<RepairContext>;
  dryRun: boolean;
  actorUid: string | null;
  nowMs: number;
  repairBatchId: string;
  apply: (plan: RepairPlan, dryRun: boolean) => Promise<void>;
}): Promise<RepairPlan> {
  const context = await args.loadContext();
  const plan = buildRepairEnrollmentFutureSessionsPlan({
    context,
    nowMs: args.nowMs,
    repairBatchId: args.repairBatchId,
    actorUid: args.actorUid,
  });
  await args.apply(plan, args.dryRun);
  return plan;
}

async function repairEnrollmentFutureSessionsFromScheduleInternal(args: {
  enrollmentId: string;
  dryRun: boolean;
  actorUid: string | null;
}): Promise<RepairEnrollmentFutureSessionsResponse> {
  const repairBatchId = `schedule_repair_${args.enrollmentId}_${Date.now()}`;
  const plan = await executeRepairEnrollmentFutureSessionsFromSchedule({
    loadContext: () => loadRepairContext({ enrollmentId: args.enrollmentId }),
    dryRun: args.dryRun,
    actorUid: args.actorUid,
    nowMs: Date.now(),
    repairBatchId,
    apply: applyRepairPlan,
  });

  return {
    created: plan.created,
    skipped: plan.skipped,
    replaced: plan.replaced,
    plannedSessionsTarget: plan.plannedSessionsTarget,
    plannedSessionsGenerated: plan.plannedSessionsGenerated,
    plannedSessionsConsumed: plan.plannedSessionsConsumed,
    plannedSessionsActiveFuture: plan.plannedSessionsActiveFuture,
    plannedSessionsPausedFuture: plan.plannedSessionsPausedFuture,
    plannedSessionsRemaining: plan.plannedSessionsRemaining,
    plannedSessionsUnfilled: plan.plannedSessionsUnfilled,
    plannedSessionsCapReached: plan.plannedSessionsCapReached,
    rangeStart: `${plan.rangeStartYmd}T00:00:00+05:30`,
    rangeEnd: `${plan.rangeEndYmd}T23:59:59+05:30`,
    rangeStartYmd: plan.rangeStartYmd,
    rangeEndYmd: plan.rangeEndYmd,
    dryRun: args.dryRun,
    repairBatchId,
    missingSessionsToCreate: plan.missingSessionsToCreate,
    staleSessionsToUpdate: plan.staleSessionsToUpdate,
    duplicateOldTimeSessions: plan.duplicateOldTimeSessions,
    unsafeSessionsSkipped: plan.unsafeSessionsSkipped,
    teacherAliasProblems: plan.teacherAliasProblems,
    finalCounts: plan.finalCounts,
  };
}

export const createSessionsFromSchedule = onCall(
  {region: REGION},
  async (request): Promise<CreateSessionsResponse> => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as Partial<CreateSessionsRequest>;
    return generateSessionsFromScheduleInternal(input);
  },
);

export const saveEnrollmentScheduleAndGenerateSessions = onCall(
  {region: REGION},
  async (request): Promise<SaveEnrollmentScheduleAndGenerateResponse> => {
    await ensureAdmin(request.auth);

    const input = (request.data || {}) as Partial<SaveEnrollmentScheduleAndGenerateRequest>;
    const enrollmentId = typeof input.enrollmentId === "string" ? input.enrollmentId.trim() : "";
    if (!enrollmentId) {
      throw new HttpsError("invalid-argument", "enrollmentId required");
    }

    const enrollmentStartDateYmd =
      typeof input.enrollmentStartDate === "string" ? input.enrollmentStartDate.trim() : "";
    const classesStartDateYmd =
      typeof input.classesStartDate === "string" ? input.classesStartDate.trim() : "";
    const endDateYmd = typeof input.endDate === "string" ? input.endDate.trim() : "";

    if (!isValidYmd(enrollmentStartDateYmd)) {
      throw new HttpsError("invalid-argument", "enrollmentStartDate must be YYYY-MM-DD");
    }
    if (!isValidYmd(classesStartDateYmd)) {
      throw new HttpsError("invalid-argument", "classesStartDate must be YYYY-MM-DD");
    }
    if (endDateYmd && !isValidYmd(endDateYmd)) {
      throw new HttpsError("invalid-argument", "endDate must be YYYY-MM-DD");
    }
    if (endDateYmd && endDateYmd < classesStartDateYmd) {
      throw new HttpsError("invalid-argument", "endDate must be >= classesStartDate");
    }

    const feePerClass = Number(input.feePerClass);
    if (!Number.isFinite(feePerClass) || feePerClass <= 0) {
      throw new HttpsError("invalid-argument", "feePerClass must be > 0");
    }

    const rawSlots = Array.isArray(input.weeklySlots) ? input.weeklySlots : [];
    if (rawSlots.length === 0) {
      throw new HttpsError("invalid-argument", "weeklySlots required");
    }
    const normalizedSlots = normalizeScheduleSlotsOrThrow({weeklySlots: rawSlots});
    const firstSlot = normalizedSlots[0];
    const legacyWeekdays = Array.from(new Set(normalizedSlots.map((slot) => slot.weekday))).sort((a, b) => a - b);
    const weeksAheadRaw = Number(input.weeksAhead);
    const weeksAhead = Number.isFinite(weeksAheadRaw) ?
      Math.max(1, Math.min(52, Math.floor(weeksAheadRaw))) :
      8;
    const plannedSessions = toPlannedSessions(input.plannedSessions);
    const currency = typeof input.currency === "string" && input.currency.trim() ? input.currency.trim() : "INR";
    const joinUrl =
      typeof input.joinUrl === "string" && input.joinUrl.trim() ? input.joinUrl.trim() : null;
    const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);

    const db = admin.firestore();
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
    const actorUid = request.auth?.uid || null;

    // DIAGNOSTIC: Log all inputs before transaction
    logger.info("saveEnrollmentScheduleAndGenerateSessions - Starting", {
      enrollmentId,
      enrollmentStartDateYmd,
      classesStartDateYmd,
      feePerClass,
      currency,
      weeklySlots: normalizedSlots,
      weeksAhead,
      plannedSessions: plannedSessions ?? null,
      endDateYmd: endDateYmd || null,
      idempotencyKey: idempotencyKey || null,
      actorUid,
    });

    let replay: CreateSessionsResponse | null = null;
    
    try {
      replay = await db.runTransaction(async (tx) => {
        logger.info("Transaction started - fetching enrollment", {enrollmentId});
        const enrollmentSnap = await tx.get(enrollmentRef);
        if (!enrollmentSnap.exists) {
          logger.error("Enrollment not found", {enrollmentId});
          throw new HttpsError("not-found", `Enrollment ${enrollmentId} not found`);
        }
        logger.info("Enrollment fetched successfully", {enrollmentId});

        const enrollment = enrollmentSnap.data() as Record<string, unknown>;
        logger.info("Checking idempotency", {
          enrollmentId,
          hasScheduleGeneration: !!enrollment.scheduleGeneration,
        });
        const previousGeneration =
          enrollment.scheduleGeneration &&
          typeof enrollment.scheduleGeneration === "object" ?
            (enrollment.scheduleGeneration as Record<string, unknown>) :
            {};
        const previousKey = normalizeIdempotencyKey(previousGeneration.lastRequestKey);
        const previousState = normalizeStatus(previousGeneration.state);
      const previousResult =
        previousGeneration.lastResult &&
        typeof previousGeneration.lastResult === "object" ?
          (previousGeneration.lastResult as Partial<CreateSessionsResponse>) :
          null;

      if (idempotencyKey &&
        previousKey === idempotencyKey &&
        previousState === "success" &&
        previousResult &&
        typeof previousResult.created === "number" &&
        typeof previousResult.skipped === "number" &&
        typeof previousResult.replaced === "number" &&
        typeof previousResult.plannedSessionsGenerated === "number" &&
        typeof previousResult.rangeStart === "string" &&
        typeof previousResult.rangeEnd === "string" &&
        typeof previousResult.rangeStartYmd === "string" &&
        typeof previousResult.rangeEndYmd === "string") {
        logger.info("Idempotent replay - returning cached result", {
          enrollmentId,
          idempotencyKey,
        });
        return previousResult as CreateSessionsResponse;
      }

      logger.info("Building schedule payload", {enrollmentId});
      const schedulePayload: ScheduleConfig = {
        timezone: "Asia/Kolkata",
        weeklySlots: normalizedSlots.map((slot) => ({
          weekday: slot.weekday,
          time: slot.timeHHmm,
          durationMinutes: slot.durationMinutes,
        })),
        weekdays: legacyWeekdays,
        timeHHmm: firstSlot.timeHHmm,
        durationMins: firstSlot.durationMinutes,
        weeksAhead,
        plannedSessions: plannedSessions ?? undefined,
        endDateYmd: endDateYmd || null,
      };

      logger.info("Parsing dates for enrollment update", {
        enrollmentId,
        enrollmentStartDateYmd,
        classesStartDateYmd,
      });

      let enrollmentStartTimestamp: admin.firestore.Timestamp;
      let classesStartTimestamp: admin.firestore.Timestamp;
      
      try {
        enrollmentStartTimestamp = parseYmdToIstMidnightTimestamp(enrollmentStartDateYmd, "enrollmentStartDate");
        logger.info("Parsed enrollmentStartDate", {
          enrollmentId,
          ymd: enrollmentStartDateYmd,
          timestamp: enrollmentStartTimestamp.toDate().toISOString(),
        });
      } catch (parseError) {
        logger.error("Failed to parse enrollmentStartDate", {
          enrollmentId,
          ymd: enrollmentStartDateYmd,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        throw parseError;
      }

      try {
        classesStartTimestamp = parseYmdToIstMidnightTimestamp(classesStartDateYmd, "classesStartDate");
        logger.info("Parsed classesStartDate", {
          enrollmentId,
          ymd: classesStartDateYmd,
          timestamp: classesStartTimestamp.toDate().toISOString(),
        });
      } catch (parseError) {
        logger.error("Failed to parse classesStartDate", {
          enrollmentId,
          ymd: classesStartDateYmd,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        throw parseError;
      }

      logger.info("Writing enrollment update", {enrollmentId});
      tx.set(
        enrollmentRef,
        {
          startDate: enrollmentStartTimestamp,
          startDateYmd: enrollmentStartDateYmd,
          classesStartDate: classesStartTimestamp,
          classesStartDateYmd,
          feePerClass,
          currency,
          joinUrl,
          schedule: schedulePayload,
          scheduleGeneration: {
            state: "in_progress",
            lastRequestKey: idempotencyKey || null,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            startedBy: actorUid,
            error: admin.firestore.FieldValue.delete(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorUid,
        },
        {merge: true},
      );

      logger.info("Transaction complete - enrollment updated", {enrollmentId});
      return null;
    });
    } catch (txError) {
      // Transaction-level errors (enrollment not found, date parsing, etc.)
      const message = txError instanceof Error ? txError.message : String(txError);
      const stack = txError instanceof Error ? txError.stack : undefined;
      const errorCode = txError instanceof HttpsError ? txError.code : "unknown";
      
      logger.error("Transaction failed in saveEnrollmentScheduleAndGenerateSessions", {
        enrollmentId,
        error: message,
        errorCode,
        stack,
        enrollmentStartDateYmd,
        classesStartDateYmd,
        feePerClass,
        currency,
      });
      
      // Re-throw HttpsErrors as-is, wrap others
      if (txError instanceof HttpsError) {
        throw txError;
      }
      throw new HttpsError(
        "internal",
        `Schedule save transaction failed: ${message}`,
      );
    }

    if (replay) {
      logger.info("Returning idempotent replay result", {
        enrollmentId,
        replay,
      });
      const replayConsumed =
        typeof replay.plannedSessionsConsumed === "number" ?
          replay.plannedSessionsConsumed :
          0;
      const replayActiveFuture =
        typeof replay.plannedSessionsActiveFuture === "number" ?
          replay.plannedSessionsActiveFuture :
          Math.max((replay.plannedSessionsGenerated || 0) - replayConsumed, 0);
      const replayPausedFuture =
        typeof replay.plannedSessionsPausedFuture === "number" ? replay.plannedSessionsPausedFuture : 0;
      const replayRemaining =
        typeof replay.plannedSessionsRemaining === "number" ?
          replay.plannedSessionsRemaining :
          Math.max((replay.plannedSessionsTarget || 0) - replayConsumed, 0);
      const replayCapReached =
        replay.plannedSessionsCapReached ??
        Boolean(replay.plannedSessionsTarget && replayConsumed >= replay.plannedSessionsTarget);
      await enrollmentRef.set(
        {
          scheduleProgress: {
            plannedSessionsTarget: replay.plannedSessionsTarget ?? null,
            consumedCount: replayConsumed,
            activeFutureCount: replayActiveFuture,
            pausedFutureCount: replayPausedFuture,
            remainingCount: replayRemaining,
            plannedCompleted: replayCapReached,
            completionMessage: replayCapReached ?
              "Planned classes completed. Please contact Tiny Steps to continue the schedule." :
              null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: actorUid,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorUid,
        },
        {merge: true},
      );
      return {
        ...replay,
        plannedSessionsConsumed: replayConsumed,
        plannedSessionsActiveFuture: replayActiveFuture,
        plannedSessionsPausedFuture: replayPausedFuture,
        plannedSessionsRemaining: replayRemaining,
        plannedSessionsCapReached: replayCapReached,
        idempotentReplay: true,
        orchestrationState: "replayed",
      };
    }

    try {
      logger.info("Calling repairEnrollmentFutureSessionsFromScheduleInternal", {
        enrollmentId,
        dryRun: false,
      });
      
      const result = await repairEnrollmentFutureSessionsFromScheduleInternal({
        enrollmentId,
        dryRun: false,
        actorUid,
      });

      logger.info("repairEnrollmentFutureSessionsFromScheduleInternal succeeded", {
        enrollmentId,
        result,
      });

      await enrollmentRef.set(
        {
          scheduleGeneration: {
            state: "success",
            lastRequestKey: idempotencyKey || null,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedBy: actorUid,
            lastResult: result,
            error: admin.firestore.FieldValue.delete(),
          },
          scheduleProgress: {
            plannedSessionsTarget: result.plannedSessionsTarget ?? null,
            consumedCount: result.plannedSessionsConsumed,
            activeFutureCount: result.plannedSessionsActiveFuture,
            pausedFutureCount: result.plannedSessionsPausedFuture,
            remainingCount: result.plannedSessionsRemaining,
            plannedCompleted: result.plannedSessionsCapReached,
            completionMessage: result.plannedSessionsCapReached ?
              "Planned classes completed. Please contact Tiny Steps to continue the schedule." :
              null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: actorUid,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorUid,
        },
        {merge: true},
      );

      return {
        ...result,
        idempotentReplay: false,
        orchestrationState: "generated",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof HttpsError ? error.code : "internal";
      
      logger.error("Session generation failed", {
        enrollmentId,
        error: message,
        errorCode,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      await enrollmentRef.set(
        {
          scheduleGeneration: {
            state: "failed",
            lastRequestKey: idempotencyKey || null,
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            failedBy: actorUid,
            error: message,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorUid,
        },
        {merge: true},
      );
      
      // Re-throw with better error message if it's a generic error
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        "internal",
        `Failed to generate sessions: ${message}`,
        {originalError: message},
      );
    }
  },
);

export const repairEnrollmentFutureSessionsFromSchedule = onCall(
  { region: REGION, memory: "512MiB", timeoutSeconds: 300 },
  async (request): Promise<RepairEnrollmentFutureSessionsResponse> => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as Partial<RepairEnrollmentFutureSessionsRequest>;
    const enrollmentId = typeof input.enrollmentId === "string" ? input.enrollmentId.trim() : "";
    if (!enrollmentId) {
      throw new HttpsError("invalid-argument", "enrollmentId required");
    }

    return repairEnrollmentFutureSessionsFromScheduleInternal({
      enrollmentId,
      dryRun: input.dryRun === true,
      actorUid: request.auth?.uid || null,
    });
  },
);

export const pauseEnrollmentUpcomingSessions = onCall(
  {region: REGION},
  async (request): Promise<PauseEnrollmentUpcomingSessionsResponse> => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as Partial<PauseEnrollmentUpcomingSessionsRequest>;
    const enrollmentId = typeof input.enrollmentId === "string" ? input.enrollmentId.trim() : "";
    const pauseCount = toPauseCount(input.count);
    if (!enrollmentId || pauseCount <= 0) {
      throw new HttpsError("invalid-argument", "enrollmentId and valid count (1,2,3,5,10) are required");
    }

    const db = admin.firestore();
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
      throw new HttpsError("not-found", `Enrollment ${enrollmentId} not found`);
    }
    const enrollment = enrollmentSnap.data() as EnrollmentDoc;
    if (!isEnrollmentOperationallyActive(enrollment as unknown as Record<string, unknown>)) {
      throw new HttpsError("failed-precondition", "Enrollment is not active");
    }
    const weeklySlots = normalizeScheduleSlotsOrThrow(enrollment.schedule);
    if (!weeklySlots.length) {
      throw new HttpsError("failed-precondition", "Enrollment has no active weekly schedule");
    }

    const configuredSlotPatterns = new Set<string>();
    const {teacherId} = resolveEnrollmentTeacherIdentity(enrollment);
    weeklySlots.forEach((slot) => {
      configuredSlotPatterns.add(`${slot.weekday}|${slot.timeHHmm}|${slot.durationMinutes}|${teacherId || ""}`);
    });

    const sessionsSnap = await db.collection("classSessions").where("enrollmentId", "==", enrollmentId).get();
    const financialBySessionId = await fetchFinancialStateBySessionId(
      db,
      sessionsSnap.docs.map((docSnap) => docSnap.id),
    );
    const nowMs = Date.now();
    const candidates: Array<{ ref: admin.firestore.DocumentReference; startMs: number }> = [];
    for (const docSnap of sessionsSnap.docs) {
      const raw = docSnap.data() as Record<string, unknown>;
      const financial = financialBySessionId.get(docSnap.id);
      if (!isSessionReplaceable({raw, financial, nowMs})) continue;
      if (normalizeStatus(raw.status) === PAUSED_SESSION_STATUS) continue;
      if (
        !isFutureOperationalRegularSession({
          raw,
          nowMs,
          configuredSlotPatterns,
          fallbackTeacherId: teacherId,
        })
      ) {
        continue;
      }
      const startMs = resolveSessionStartMs(raw);
      if (startMs === null) continue;
      candidates.push({ ref: docSnap.ref, startMs });
    }
    candidates.sort((a, b) => a.startMs - b.startMs);
    const toPause = candidates.slice(0, pauseCount);
    const pauseBatchId = `pause_${enrollmentId}_${Date.now()}`;

    if (toPause.length > 0) {
      let batch = db.batch();
      let ops = 0;
      for (const entry of toPause) {
        batch.set(
          entry.ref,
          {
            status: PAUSED_SESSION_STATUS,
            pauseBy: request.auth?.uid || null,
            pauseBatchId,
            pauseReason: "admin_pause",
            pausedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: request.auth?.uid || null,
          },
          {merge: true},
        );
        ops += 1;
        if (ops >= MAX_BATCH) {
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
    }

    await enrollmentRef.set(
      {
        schedulePause: {
          active: toPause.length > 0,
          batchId: toPause.length > 0 ? pauseBatchId : null,
          requestedCount: pauseCount,
          remainingCount: toPause.length,
          pausedAt: admin.firestore.FieldValue.serverTimestamp(),
          pausedBy: request.auth?.uid || null,
          resumedAt: null,
          resumedBy: null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth?.uid || null,
      },
      {merge: true},
    );

    const regen = await generateSessionsFromScheduleInternal({
      enrollmentId,
      weeksAhead: Number(enrollment.schedule?.weeksAhead || 8),
      plannedSessions: toPlannedSessions(enrollment.schedule?.plannedSessions) || undefined,
      replaceFuture: true,
      startDate:
        toYmdFromDateLike(enrollment.classesStartDateYmd) ||
        toYmdFromDateLike(enrollment.classesStartDate) ||
        toYmdFromDateLike(enrollment.startDateYmd) ||
        toYmdFromDateLike(enrollment.startDate) ||
        toIstTodayYmd(),
      endDate: typeof enrollment.schedule?.endDateYmd === "string" && enrollment.schedule.endDateYmd.trim() ?
        enrollment.schedule.endDateYmd.trim() :
        undefined,
    });

    await enrollmentRef.set(
      {
        scheduleProgress: {
          plannedSessionsTarget: regen.plannedSessionsTarget ?? null,
          consumedCount: regen.plannedSessionsConsumed,
          activeFutureCount: regen.plannedSessionsActiveFuture,
          pausedFutureCount: regen.plannedSessionsPausedFuture,
          remainingCount: regen.plannedSessionsRemaining,
          plannedCompleted: regen.plannedSessionsCapReached,
          completionMessage: regen.plannedSessionsCapReached ?
            "Planned classes completed. Please contact Tiny Steps to continue the schedule." :
            null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: request.auth?.uid || null,
        },
      },
      {merge: true},
    );

    return {
      ...regen,
      pausedCount: toPause.length,
      pauseBatchId,
    };
  },
);

export const resumeEnrollmentSchedule = onCall(
  {region: REGION},
  async (request): Promise<ResumeEnrollmentScheduleResponse> => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as Partial<ResumeEnrollmentScheduleRequest>;
    const enrollmentId = typeof input.enrollmentId === "string" ? input.enrollmentId.trim() : "";
    if (!enrollmentId) {
      throw new HttpsError("invalid-argument", "enrollmentId required");
    }

    const db = admin.firestore();
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
      throw new HttpsError("not-found", `Enrollment ${enrollmentId} not found`);
    }
    const enrollment = enrollmentSnap.data() as EnrollmentDoc & { schedulePause?: Record<string, unknown> };
    if (!isEnrollmentOperationallyActive(enrollment as unknown as Record<string, unknown>)) {
      throw new HttpsError("failed-precondition", "Enrollment is not active");
    }
    const weeklySlots = normalizeScheduleSlotsOrThrow(enrollment.schedule);
    if (!weeklySlots.length) {
      throw new HttpsError("failed-precondition", "Enrollment has no active weekly schedule");
    }
    const configuredSlotPatterns = new Set<string>();
    const {teacherId} = resolveEnrollmentTeacherIdentity(enrollment);
    weeklySlots.forEach((slot) => {
      configuredSlotPatterns.add(`${slot.weekday}|${slot.timeHHmm}|${slot.durationMinutes}|${teacherId || ""}`);
    });

    const pauseBatchId =
      enrollment.schedulePause && typeof enrollment.schedulePause.batchId === "string" ?
        enrollment.schedulePause.batchId.trim() :
        "";

    const sessionsSnap = await db.collection("classSessions").where("enrollmentId", "==", enrollmentId).get();
    const nowMs = Date.now();
    const toResume: admin.firestore.DocumentReference[] = [];
    for (const docSnap of sessionsSnap.docs) {
      const raw = docSnap.data() as Record<string, unknown>;
      if (normalizeStatus(raw.status) !== PAUSED_SESSION_STATUS) continue;
      const startMs = resolveSessionStartMs(raw);
      if (startMs === null || startMs <= nowMs) continue;
      if (pauseBatchId) {
        const rowBatchId = typeof raw.pauseBatchId === "string" ? raw.pauseBatchId.trim() : "";
        if (rowBatchId !== pauseBatchId) continue;
      }
      const slotPattern = resolveSessionSlotPattern({raw, fallbackTeacherId: teacherId});
      if (!slotPattern || !configuredSlotPatterns.has(slotPattern)) continue;
      toResume.push(docSnap.ref);
    }

    if (toResume.length > 0) {
      let batch = db.batch();
      let ops = 0;
      for (const ref of toResume) {
        batch.set(
          ref,
          {
            status: "scheduled",
            resumedAt: admin.firestore.FieldValue.serverTimestamp(),
            resumedBy: request.auth?.uid || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: request.auth?.uid || null,
          },
          {merge: true},
        );
        ops += 1;
        if (ops >= MAX_BATCH) {
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
    }

    await enrollmentRef.set(
      {
        schedulePause: {
          active: false,
          remainingCount: 0,
          resumedAt: admin.firestore.FieldValue.serverTimestamp(),
          resumedBy: request.auth?.uid || null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth?.uid || null,
      },
      {merge: true},
    );

    const regen = await generateSessionsFromScheduleInternal({
      enrollmentId,
      weeksAhead: Number(enrollment.schedule?.weeksAhead || 8),
      plannedSessions: toPlannedSessions(enrollment.schedule?.plannedSessions) || undefined,
      replaceFuture: true,
      startDate:
        toYmdFromDateLike(enrollment.classesStartDateYmd) ||
        toYmdFromDateLike(enrollment.classesStartDate) ||
        toYmdFromDateLike(enrollment.startDateYmd) ||
        toYmdFromDateLike(enrollment.startDate) ||
        toIstTodayYmd(),
      endDate: typeof enrollment.schedule?.endDateYmd === "string" && enrollment.schedule.endDateYmd.trim() ?
        enrollment.schedule.endDateYmd.trim() :
        undefined,
    });

    await enrollmentRef.set(
      {
        scheduleProgress: {
          plannedSessionsTarget: regen.plannedSessionsTarget ?? null,
          consumedCount: regen.plannedSessionsConsumed,
          activeFutureCount: regen.plannedSessionsActiveFuture,
          pausedFutureCount: regen.plannedSessionsPausedFuture,
          remainingCount: regen.plannedSessionsRemaining,
          plannedCompleted: regen.plannedSessionsCapReached,
          completionMessage: regen.plannedSessionsCapReached ?
            "Planned classes completed. Please contact Tiny Steps to continue the schedule." :
            null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: request.auth?.uid || null,
        },
      },
      {merge: true},
    );

    return {
      ...regen,
      resumedCount: toResume.length,
    };
  },
);
