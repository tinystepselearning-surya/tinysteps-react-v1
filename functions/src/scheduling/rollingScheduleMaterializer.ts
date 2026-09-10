import * as admin from 'firebase-admin';
import {FieldValue, Timestamp} from 'firebase-admin/firestore';
import {
  buildCanonicalTeacherWriteFields,
  resolveCanonicalTeacherIdForWrite,
} from '../helpers/teacherIdentity';
import {buildSessionFinancialTermsSnapshot} from '../helpers/sessionFinancialRates';

export const ROLLING_SCHEDULE_TIME_ZONE = 'Asia/Kolkata';
export const ROLLING_SCHEDULE_HORIZON_DAYS = 14;
export const ROLLING_SCHEDULE_CONTRACT_VERSION = 1;
export const ROLLING_SCHEDULE_MATERIALIZATION_VERSION = 1;
export const ROLLING_SCHEDULE_DELIVERY_MODE = 'rolling';
export const ROLLING_SCHEDULE_SESSION_SOURCE = 'rolling_schedule';
export const MAX_ROLLING_WINDOW_OCCURRENCES = 64;

const IST_OFFSET_MINUTES = 330;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ACTIVE_STATUS_ALIASES = new Set([
  '',
  'active',
  'trial',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
  'pending_lp',
]);

export type RollingMaterializerSlot = {
  weekday: number;
  time: string;
  hour: number;
  minute: number;
  durationMinutes: number;
};

export type RollingMaterializationOccurrence = {
  date: string;
  weekday: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startAtUtcMs: number;
  endAtUtcMs: number;
  occurrenceKey: string;
  sessionId: string;
};

export type RollingScheduleMaterializationState = {
  schemaVersion: number;
  horizonDays: number;
  scheduleRevision: number;
  materializedThroughYmd: string;
  nextOccurrenceYmd: string | null;
  nextMaterializationDueYmd: string | null;
};

export type RollingMaterializationPlan = {
  enrollmentId: string;
  anchorYmd: string;
  horizonEndYmd: string;
  scheduleRevision: number;
  revisionResetRequired: boolean;
  occurrences: RollingMaterializationOccurrence[];
  materialization: RollingScheduleMaterializationState;
};

export type RollingScheduleMaterializerStore = {
  getEnrollment: (enrollmentId: string) => Promise<Record<string, unknown> | null>;
  getSessionsByIds: (sessionIds: string[]) => Promise<Map<string, Record<string, unknown>>>;
  createSessionIfAbsent: (
    sessionId: string,
    payload: Record<string, unknown>,
  ) => Promise<'created' | 'already_exists'>;
  updateEnrollmentMaterialization: (
    enrollmentId: string,
    materialization: RollingScheduleMaterializationState,
  ) => Promise<void>;
};

export type MaterializeRollingEnrollmentWindowInput = {
  enrollmentId: string;
  anchorYmd: string;
  actorId?: string;
  dryRun?: boolean;
};

export type MaterializeRollingEnrollmentWindowResult = {
  enrollmentId: string;
  anchorYmd: string;
  horizonEndYmd: string;
  scheduleRevision: number;
  revisionResetRequired: boolean;
  expectedCount: number;
  existingCount: number;
  wouldCreateCount: number;
  createdCount: number;
  raceAlreadyExistsCount: number;
  metadataUpdated: boolean;
  createdSessionIds: string[];
  preservedExistingSessionIds: string[];
  materialization: RollingScheduleMaterializationState;
};

type ScheduleLike = {
  timezone?: unknown;
  revision?: unknown;
  weeklySlots?: Array<{
    weekday?: unknown;
    time?: unknown;
    durationMinutes?: unknown;
    durationMins?: unknown;
  }>;
  weekdays?: unknown[];
  timeHHmm?: unknown;
  durationMins?: unknown;
  weeksAhead?: unknown;
  plannedSessions?: unknown;
  endDateYmd?: unknown;
};

type ParsedYmd = {
  year: number;
  month: number;
  day: number;
  utcMs: number;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalText(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((entry) => optionalText(entry)).filter((entry): entry is string => Boolean(entry))),
  );
}

function parseYmdStrict(value: string, fieldName: string): ParsedYmd {
  const raw = String(value || '').trim();
  if (!YMD_RE.test(raw)) throw new Error(`${fieldName} must be YYYY-MM-DD`);
  const [yearText, monthText, dayText] = raw.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const parsed = new Date(utcMs);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${fieldName} is not a valid calendar date`);
  }
  return {year, month, day, utcMs};
}

function ymdFromUtcMs(utcMs: number): string {
  const date = new Date(utcMs);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function addDaysYmd(ymd: string, days: number): string {
  const parsed = parseYmdStrict(ymd, 'ymd');
  return ymdFromUtcMs(parsed.utcMs + Math.trunc(days) * 24 * 60 * 60 * 1000);
}

function dateLikeToIndiaYmd(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (YMD_RE.test(raw)) {
      try {
        parseYmdStrict(raw, 'date');
        return raw;
      } catch {
        return null;
      }
    }
  }

  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (isRecordLike(value)) {
    const toDate = value.toDate;
    if (typeof toDate === 'function') {
      try {
        const parsed = (toDate as () => Date)();
        if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) date = parsed;
      } catch {
        date = null;
      }
    }
    if (!date) {
      const seconds = Number(value.seconds ?? value._seconds);
      if (Number.isFinite(seconds)) date = new Date(seconds * 1000);
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return ymdFromUtcMs(Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  ));
}

function resolveClassesStartDateYmd(enrollment: Record<string, unknown>): string | null {
  return (
    dateLikeToIndiaYmd(enrollment.classesStartDateYmd) ||
    dateLikeToIndiaYmd(enrollment.classesStartDate) ||
    dateLikeToIndiaYmd(enrollment.startDateYmd) ||
    dateLikeToIndiaYmd(enrollment.startDate) ||
    null
  );
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function normalizeDuration(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Schedule duration must be a positive number');
  return Math.max(10, Math.min(180, Math.floor(parsed)));
}

function parseTime(value: unknown): {time: string; hour: number; minute: number} {
  const raw = typeof value === 'string' ? value.trim() : '';
  const match = HHMM_RE.exec(raw);
  if (!match) throw new Error('Schedule time must be HH:MM in 24-hour time');
  return {time: raw, hour: Number(match[1]), minute: Number(match[2])};
}

function normalizeWeekday(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    throw new Error('Schedule weekday must be an integer from 0 to 6');
  }
  return parsed;
}

export function normalizeRollingMaterializerSlots(scheduleLike: unknown): RollingMaterializerSlot[] {
  if (!isRecordLike(scheduleLike)) return [];
  const schedule = scheduleLike as ScheduleLike;
  const timezone = optionalText(schedule.timezone) || ROLLING_SCHEDULE_TIME_ZONE;
  if (timezone !== ROLLING_SCHEDULE_TIME_ZONE) {
    throw new Error(`Unsupported rolling schedule timezone: ${timezone}`);
  }

  const result: RollingMaterializerSlot[] = [];
  const identityKeys = new Set<string>();

  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length > 0) {
    schedule.weeklySlots.forEach((slot) => {
      const weekday = normalizeWeekday(slot?.weekday);
      const parsedTime = parseTime(slot?.time);
      const durationMinutes = normalizeDuration(slot?.durationMinutes ?? slot?.durationMins);
      const identityKey = `${weekday}|${parsedTime.time}`;
      if (identityKeys.has(identityKey)) {
        throw new Error('Conflicting weekly slots share the same weekday and start time');
      }
      identityKeys.add(identityKey);
      result.push({
        weekday,
        time: parsedTime.time,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        durationMinutes,
      });
    });
  } else if (Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0) {
    const parsedTime = parseTime(schedule.timeHHmm);
    const durationMinutes = normalizeDuration(schedule.durationMins ?? 35);
    schedule.weekdays.forEach((rawWeekday) => {
      const weekday = normalizeWeekday(rawWeekday);
      const identityKey = `${weekday}|${parsedTime.time}`;
      if (identityKeys.has(identityKey)) return;
      identityKeys.add(identityKey);
      result.push({
        weekday,
        time: parsedTime.time,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        durationMinutes,
      });
    });
  }

  return result.sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    if (a.time !== b.time) return a.time.localeCompare(b.time, undefined, {numeric: true});
    return a.durationMinutes - b.durationMinutes;
  });
}

export function rollingSessionId(enrollmentId: string, date: string, startTime: string): string {
  const safeEnrollmentId = String(enrollmentId || '').trim();
  if (!safeEnrollmentId) throw new Error('enrollmentId is required');
  parseYmdStrict(date, 'date');
  const parsedTime = parseTime(startTime);
  return `${safeEnrollmentId}_${date.replace(/-/g, '')}_${parsedTime.time.replace(':', '')}`;
}

function occurrenceFor(
  enrollmentId: string,
  date: string,
  slot: RollingMaterializerSlot,
): RollingMaterializationOccurrence {
  const parsed = parseYmdStrict(date, 'date');
  const startContextMs = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    slot.hour,
    slot.minute,
  );
  const startAtUtcMs = startContextMs - IST_OFFSET_MINUTES * 60 * 1000;
  const endAtUtcMs = startAtUtcMs + slot.durationMinutes * 60 * 1000;
  const endMinutes = (slot.hour * 60 + slot.minute + slot.durationMinutes) % (24 * 60);
  const endTime = `${pad2(Math.floor(endMinutes / 60))}:${pad2(endMinutes % 60)}`;
  return {
    date,
    weekday: new Date(parsed.utcMs).getUTCDay(),
    startTime: slot.time,
    endTime,
    durationMinutes: slot.durationMinutes,
    startAtUtcMs,
    endAtUtcMs,
    occurrenceKey: `${date}|${slot.time}|${slot.durationMinutes}`,
    sessionId: rollingSessionId(enrollmentId, date, slot.time),
  };
}

function enumerateOccurrences(args: {
  enrollmentId: string;
  fromYmd: string;
  toYmd: string;
  classesStartDateYmd: string | null;
  slots: RollingMaterializerSlot[];
}): RollingMaterializationOccurrence[] {
  const {enrollmentId, fromYmd, toYmd, classesStartDateYmd, slots} = args;
  const from = parseYmdStrict(fromYmd, 'fromYmd');
  const to = parseYmdStrict(toYmd, 'toYmd');
  if (to.utcMs < from.utcMs) throw new Error('toYmd must be on or after fromYmd');

  let effectiveStartMs = from.utcMs;
  if (classesStartDateYmd) {
    effectiveStartMs = Math.max(effectiveStartMs, parseYmdStrict(classesStartDateYmd, 'classesStartDateYmd').utcMs);
  }
  if (effectiveStartMs > to.utcMs) return [];

  const slotsByWeekday = new Map<number, RollingMaterializerSlot[]>();
  slots.forEach((slot) => {
    const rows = slotsByWeekday.get(slot.weekday) || [];
    rows.push(slot);
    slotsByWeekday.set(slot.weekday, rows);
  });

  const occurrences: RollingMaterializationOccurrence[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (let dayMsUtc = effectiveStartMs; dayMsUtc <= to.utcMs; dayMsUtc += dayMs) {
    const date = ymdFromUtcMs(dayMsUtc);
    const weekday = new Date(dayMsUtc).getUTCDay();
    const daySlots = slotsByWeekday.get(weekday) || [];
    daySlots.forEach((slot) => occurrences.push(occurrenceFor(enrollmentId, date, slot)));
  }

  return occurrences.sort((a, b) => a.startAtUtcMs - b.startAtUtcMs);
}

function nextOccurrenceAfter(args: {
  enrollmentId: string;
  afterYmd: string;
  classesStartDateYmd: string | null;
  slots: RollingMaterializerSlot[];
}): RollingMaterializationOccurrence | null {
  const firstCandidate = addDaysYmd(args.afterYmd, 1);
  const searchStart = args.classesStartDateYmd && args.classesStartDateYmd > firstCandidate
    ? args.classesStartDateYmd
    : firstCandidate;
  const searchEnd = addDaysYmd(searchStart, 7);
  const occurrences = enumerateOccurrences({
    enrollmentId: args.enrollmentId,
    fromYmd: searchStart,
    toYmd: searchEnd,
    classesStartDateYmd: args.classesStartDateYmd,
    slots: args.slots,
  });
  return occurrences[0] || null;
}

function isOperationallyActive(enrollment: Record<string, unknown>): boolean {
  if (enrollment.archivedAt || enrollment.archived === true || enrollment.isArchived === true) return false;
  const status = String(enrollment.status || '').trim().toLowerCase();
  return ACTIVE_STATUS_ALIASES.has(status);
}

function scheduleRevision(enrollment: Record<string, unknown>): number {
  const schedule = isRecordLike(enrollment.schedule) ? enrollment.schedule : {};
  return normalizePositiveInteger(schedule.revision, 1);
}

function persistedMaterializationRevision(enrollment: Record<string, unknown>): number | null {
  if (!isRecordLike(enrollment.scheduleMaterialization)) return null;
  const parsed = Number(enrollment.scheduleMaterialization.scheduleRevision);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : null;
}

export function buildRollingMaterializationPlan(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  anchorYmd: string;
}): RollingMaterializationPlan {
  const enrollmentId = String(args.enrollmentId || '').trim();
  if (!enrollmentId) throw new Error('enrollmentId is required');
  parseYmdStrict(args.anchorYmd, 'anchorYmd');
  if (!isOperationallyActive(args.enrollment)) {
    throw new Error('Enrollment is not operationally active for rolling materialization');
  }

  const slots = normalizeRollingMaterializerSlots(args.enrollment.schedule);
  if (!slots.length) throw new Error('Enrollment has no recurring schedule configured');

  const teacherResolution = resolveCanonicalTeacherIdForWrite(args.enrollment);
  if (!teacherResolution.teacherId || teacherResolution.source === 'ambiguous_legacy') {
    throw new Error('Enrollment requires one canonical teacher before rolling materialization');
  }

  const horizonEndYmd = addDaysYmd(args.anchorYmd, ROLLING_SCHEDULE_HORIZON_DAYS);
  const classesStartDateYmd = resolveClassesStartDateYmd(args.enrollment);
  const currentRevision = scheduleRevision(args.enrollment);
  const previousRevision = persistedMaterializationRevision(args.enrollment);
  const occurrences = enumerateOccurrences({
    enrollmentId,
    fromYmd: args.anchorYmd,
    toYmd: horizonEndYmd,
    classesStartDateYmd,
    slots,
  });
  if (occurrences.length > MAX_ROLLING_WINDOW_OCCURRENCES) {
    throw new Error(`Rolling window exceeds safe occurrence cap of ${MAX_ROLLING_WINDOW_OCCURRENCES}`);
  }

  const nextOccurrence = nextOccurrenceAfter({
    enrollmentId,
    afterYmd: horizonEndYmd,
    classesStartDateYmd,
    slots,
  });
  const nextOccurrenceYmd = nextOccurrence?.date || null;
  const nextMaterializationDueYmd = nextOccurrenceYmd
    ? addDaysYmd(nextOccurrenceYmd, -ROLLING_SCHEDULE_HORIZON_DAYS)
    : null;

  return {
    enrollmentId,
    anchorYmd: args.anchorYmd,
    horizonEndYmd,
    scheduleRevision: currentRevision,
    revisionResetRequired: previousRevision !== null && previousRevision !== currentRevision,
    occurrences,
    materialization: {
      schemaVersion: ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
      horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
      scheduleRevision: currentRevision,
      materializedThroughYmd: horizonEndYmd,
      nextOccurrenceYmd,
      nextMaterializationDueYmd,
    },
  };
}

export function buildRollingScheduledSessionPayload(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  occurrence: RollingMaterializationOccurrence;
  scheduleRevision: number;
  actorId: string;
}): Record<string, unknown> {
  const {enrollmentId, enrollment, occurrence, actorId} = args;
  const teacherResolution = resolveCanonicalTeacherIdForWrite(enrollment);
  const teacherId = teacherResolution.teacherId;
  if (!teacherId || teacherResolution.source === 'ambiguous_legacy') {
    throw new Error('Enrollment requires one canonical teacher before session creation');
  }

  const kidId =
    optionalText(enrollment.kidId) ||
    stringList(enrollment.kidIds)[0] ||
    optionalText(enrollment.studentId) ||
    optionalText(enrollment.childId);
  if (!kidId) throw new Error('Enrollment requires a child identity before session creation');
  const kidIds = stringList(enrollment.kidIds);
  if (!kidIds.includes(kidId)) kidIds.unshift(kidId);
  const studentId = optionalText(enrollment.studentId) || kidId;
  const childId = optionalText(enrollment.childId) || kidId;

  const parentIds = stringList(enrollment.parentIds);
  const parentId = optionalText(enrollment.parentId) || parentIds[0] || null;
  if (parentId && !parentIds.includes(parentId)) parentIds.unshift(parentId);

  const financialSnapshot = buildSessionFinancialTermsSnapshot({}, enrollment);
  if (!financialSnapshot) {
    throw new Error('Enrollment requires a positive billing rate before session creation');
  }

  const studentName =
    optionalText(enrollment.studentName) ||
    optionalText(enrollment.kidName) ||
    optionalText(enrollment.childName);
  const kidName = optionalText(enrollment.kidName) || studentName;
  const childName = optionalText(enrollment.childName) || studentName;
  const courseId = optionalText(enrollment.courseId);
  const courseName =
    optionalText(enrollment.courseName) ||
    optionalText(enrollment.courseTitle) ||
    optionalText(enrollment.courseLabel) ||
    courseId;
  const teacherName = optionalText(enrollment.teacherName);
  const teacherEmail = optionalText(enrollment.teacherEmail);
  const joinUrl = optionalText(enrollment.joinUrl);
  const safeActorId = String(actorId || 'system').trim() || 'system';

  const payload: Record<string, unknown> = {
    enrollmentId,
    kidId,
    kidIds,
    studentId,
    childId,
    ...(studentName ? {studentName} : {}),
    ...(kidName ? {kidName} : {}),
    ...(childName ? {childName} : {}),
    ...(parentId ? {parentId} : {}),
    ...(parentIds.length ? {parentIds} : {}),
    ...buildCanonicalTeacherWriteFields(teacherId),
    ...(teacherName ? {teacherName} : {}),
    ...(teacherEmail ? {teacherEmail} : {}),
    ...(courseId ? {courseId} : {}),
    ...(courseName ? {courseName, courseTitle: courseName, courseLabel: courseName} : {}),
    startAt: Timestamp.fromMillis(occurrence.startAtUtcMs),
    endAt: Timestamp.fromMillis(occurrence.endAtUtcMs),
    date: occurrence.date,
    startTime: occurrence.startTime,
    endTime: occurrence.endTime,
    durationMins: occurrence.durationMinutes,
    durationMinutes: occurrence.durationMinutes,
    status: 'scheduled',
    attendance: null,
    feeAmount: financialSnapshot.billingRateSnapshot,
    feePerClass: financialSnapshot.billingRateSnapshot,
    teacherPayPerSession: financialSnapshot.teacherPayRateSnapshot,
    currency: financialSnapshot.financialTermsCurrency,
    ...financialSnapshot,
    ...(joinUrl ? {joinUrl} : {}),
    source: ROLLING_SCHEDULE_SESSION_SOURCE,
    scheduleDeliveryMode: ROLLING_SCHEDULE_DELIVERY_MODE,
    scheduleRevision: args.scheduleRevision,
    scheduleOccurrenceKey: occurrence.occurrenceKey,
    scheduleMaterializationVersion: ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: safeActorId,
    updatedBy: safeActorId,
  };
  return payload;
}

export async function materializeRollingEnrollmentWithStore(
  store: RollingScheduleMaterializerStore,
  input: MaterializeRollingEnrollmentWindowInput,
): Promise<MaterializeRollingEnrollmentWindowResult> {
  const enrollmentId = String(input.enrollmentId || '').trim();
  if (!enrollmentId) throw new Error('enrollmentId is required');
  parseYmdStrict(input.anchorYmd, 'anchorYmd');

  const enrollment = await store.getEnrollment(enrollmentId);
  if (!enrollment) throw new Error(`Enrollment ${enrollmentId} was not found`);
  const plan = buildRollingMaterializationPlan({enrollmentId, enrollment, anchorYmd: input.anchorYmd});
  const sessionIds = plan.occurrences.map((occurrence) => occurrence.sessionId);
  const existing = sessionIds.length ? await store.getSessionsByIds(sessionIds) : new Map<string, Record<string, unknown>>();
  const missing = plan.occurrences.filter((occurrence) => !existing.has(occurrence.sessionId));
  const existingIds = plan.occurrences
    .filter((occurrence) => existing.has(occurrence.sessionId))
    .map((occurrence) => occurrence.sessionId);

  if (input.dryRun) {
    return {
      enrollmentId,
      anchorYmd: plan.anchorYmd,
      horizonEndYmd: plan.horizonEndYmd,
      scheduleRevision: plan.scheduleRevision,
      revisionResetRequired: plan.revisionResetRequired,
      expectedCount: plan.occurrences.length,
      existingCount: existingIds.length,
      wouldCreateCount: missing.length,
      createdCount: 0,
      raceAlreadyExistsCount: 0,
      metadataUpdated: false,
      createdSessionIds: [],
      preservedExistingSessionIds: existingIds,
      materialization: plan.materialization,
    };
  }

  const createdSessionIds: string[] = [];
  let raceAlreadyExistsCount = 0;
  for (const occurrence of missing) {
    const payload = buildRollingScheduledSessionPayload({
      enrollmentId,
      enrollment,
      occurrence,
      scheduleRevision: plan.scheduleRevision,
      actorId: input.actorId || 'system',
    });
    const outcome = await store.createSessionIfAbsent(occurrence.sessionId, payload);
    if (outcome === 'created') createdSessionIds.push(occurrence.sessionId);
    else raceAlreadyExistsCount += 1;
  }

  await store.updateEnrollmentMaterialization(enrollmentId, plan.materialization);

  return {
    enrollmentId,
    anchorYmd: plan.anchorYmd,
    horizonEndYmd: plan.horizonEndYmd,
    scheduleRevision: plan.scheduleRevision,
    revisionResetRequired: plan.revisionResetRequired,
    expectedCount: plan.occurrences.length,
    existingCount: existingIds.length,
    wouldCreateCount: missing.length,
    createdCount: createdSessionIds.length,
    raceAlreadyExistsCount,
    metadataUpdated: true,
    createdSessionIds,
    preservedExistingSessionIds: existingIds,
    materialization: plan.materialization,
  };
}

function isAlreadyExistsError(error: unknown): boolean {
  const raw = error as {code?: unknown; message?: unknown};
  const code = String(raw?.code || '').toLowerCase();
  const message = String(raw?.message || '').toLowerCase();
  return (
    code === '6' ||
    code.includes('already-exists') ||
    code.includes('already_exists') ||
    message.includes('already exists') ||
    message.includes('already-exists')
  );
}

export function createFirestoreRollingScheduleMaterializerStore(
  db: admin.firestore.Firestore,
): RollingScheduleMaterializerStore {
  return {
    async getEnrollment(enrollmentId) {
      const snap = await db.collection('enrollments').doc(enrollmentId).get();
      return snap.exists ? (snap.data() as Record<string, unknown>) : null;
    },
    async getSessionsByIds(sessionIds) {
      const result = new Map<string, Record<string, unknown>>();
      if (!sessionIds.length) return result;
      if (sessionIds.length > MAX_ROLLING_WINDOW_OCCURRENCES) {
        throw new Error('Rolling materializer refused an unexpectedly large point-read set');
      }
      const refs = sessionIds.map((sessionId) => db.collection('classSessions').doc(sessionId));
      const snaps = await db.getAll(...refs);
      snaps.forEach((snap) => {
        if (snap.exists) result.set(snap.id, snap.data() as Record<string, unknown>);
      });
      return result;
    },
    async createSessionIfAbsent(sessionId, payload) {
      try {
        await db.collection('classSessions').doc(sessionId).create(payload);
        return 'created';
      } catch (error) {
        if (isAlreadyExistsError(error)) return 'already_exists';
        throw error;
      }
    },
    async updateEnrollmentMaterialization(enrollmentId, materialization) {
      await db.collection('enrollments').doc(enrollmentId).update({
        'scheduleMaterialization.schemaVersion': materialization.schemaVersion,
        'scheduleMaterialization.horizonDays': materialization.horizonDays,
        'scheduleMaterialization.scheduleRevision': materialization.scheduleRevision,
        'scheduleMaterialization.materializedThroughYmd': materialization.materializedThroughYmd,
        'scheduleMaterialization.nextOccurrenceYmd': materialization.nextOccurrenceYmd,
        'scheduleMaterialization.nextMaterializationDueYmd': materialization.nextMaterializationDueYmd,
      });
    },
  };
}

export async function materializeRollingEnrollmentWindowInternal(
  db: admin.firestore.Firestore,
  input: MaterializeRollingEnrollmentWindowInput,
): Promise<MaterializeRollingEnrollmentWindowResult> {
  return materializeRollingEnrollmentWithStore(
    createFirestoreRollingScheduleMaterializerStore(db),
    input,
  );
}
