import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// A parent should never have anywhere close to this many class records in one month.
// Keep the hard caps from V2 so one write cannot accidentally trigger an unbounded scan.
export const MAX_PARENT_MONTH_ATTENDANCE_SESSIONS = 250;
export const MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS = 500;

export type CanonicalClassSessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'reschedule_requested'
  | 'rescheduled'
  | 'other';

export type ParentMonthClassAttendanceTarget = {
  parentId: string;
  monthKey: string;
  requiresCompatibility?: boolean;
};

type AttendanceQueryMode =
  | 'parentId_date_month_bounded'
  | 'parentId_capped_compatibility';

export type ClassAttendanceCanonicalTotals = {
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  inProgressSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  rescheduleRequestedSessions: number;
  rescheduledSessions: number;
  otherSessions: number;
  upcomingSessions: number;
  unresolvedPastSessions: number;
  pendingTimeUnknownSessions: number;
  presentSessions: number;
  lateSessions: number;
  absentSessions: number;
  attendanceMarkedSessions: number;
  attendanceUnmarkedCompletedSessions: number;
  attendancePct: number;
  pendingSessionStartAtMs: number[];
};

/**
 * Deprecated V2-compatible aliases are intentionally retained while P5/P8 migrate.
 * Every alias is derived from the canonical field in the same object; it is not a
 * second calculation or semantic source.
 */
export type ClassAttendanceCompatibilityAliases = {
  total: number;
  completed: number;
  scheduled: number;
  in_progress: number;
  cancelled: number;
  no_show: number;
  reschedule_requested: number;
  rescheduled: number;
  other: number;
  upcoming: number;
  unresolvedPast: number;
  present: number;
  late: number;
  absent: number;
  attendanceMarked: number;
};

export type ClassAttendanceProjectionTotals =
  ClassAttendanceCanonicalTotals & ClassAttendanceCompatibilityAliases;

export type ClassAttendanceProjectionKidBucket = ClassAttendanceProjectionTotals & {
  kidId: string;
  monthKey: string;
};

export type ParentMonthClassAttendanceProjection = {
  totals: ClassAttendanceProjectionTotals;
  byKid: Record<string, ClassAttendanceProjectionKidBucket>;
  sourceSessionRecords: number;
  unassignedSessionRecords: number;
  legacyKidAliasOnlySessionRecords: number;
};

// Backward-compatible type exports for existing imports/tests.
export type AttendanceProjectionTotals = ClassAttendanceProjectionTotals;
export type AttendanceProjectionKidBucket = ClassAttendanceProjectionKidBucket;
export type AttendanceProjection = ParentMonthClassAttendanceProjection;

type MutableTotals = {
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  inProgressSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  rescheduleRequestedSessions: number;
  rescheduledSessions: number;
  otherSessions: number;
  upcomingSessions: number;
  unresolvedPastSessions: number;
  pendingTimeUnknownSessions: number;
  presentSessions: number;
  lateSessions: number;
  absentSessions: number;
  pendingSessionStartAtMs: number[];
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number };
    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    if (typeof candidate.seconds === 'number') {
      const parsed = new Date(candidate.seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function monthKeyFromDateIST(value: unknown): string | null {
  const base = toDate(value);
  if (!base) return null;
  const istDate = new Date(base.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthDateRangeFromKey(monthKey: string): { startYmd: string; endYmd: string } | null {
  if (!MONTH_RE.test(monthKey)) return null;
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startYmd: `${yearRaw}-${monthRaw}-01`,
    endYmd: `${yearRaw}-${monthRaw}-${String(lastDay).padStart(2, '0')}`,
  };
}

function istYmdTimeToMs(date: string, time: string): number | null {
  if (!YMD_RE.test(date) || !TIME_RE.test(time)) return null;
  const [yearRaw, monthRaw, dayRaw] = date.split('-');
  const [hourRaw, minuteRaw] = time.split(':');
  const utcMs = Date.UTC(
    Number(yearRaw),
    Number(monthRaw) - 1,
    Number(dayRaw),
    Number(hourRaw),
    Number(minuteRaw),
    0,
    0,
  ) - IST_OFFSET_MINUTES * 60 * 1000;
  return Number.isFinite(utcMs) ? utcMs : null;
}

export function resolveSessionStartMs(session: Record<string, unknown>): number | null {
  const direct = toDate(session.startAt || session.scheduledAt || null);
  if (direct) return direct.getTime();

  const date = normalizeText(session.date);
  const startTime = normalizeText(session.startTime);
  return istYmdTimeToMs(date, startTime);
}

/**
 * Session month belongs to the scheduled class date/time. Generic createdAt/updatedAt
 * timestamps must never move a class into another month merely because it was edited.
 */
export function resolveSessionMonthKey(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;

  const date = normalizeText(data.date);
  if (YMD_RE.test(date)) return date.slice(0, 7);

  const fromStartAt = monthKeyFromDateIST(data.startAt || data.scheduledAt || null);
  if (fromStartAt) return fromStartAt;

  const explicitMonth = normalizeText(data.monthKey);
  return MONTH_RE.test(explicitMonth) ? explicitMonth : null;
}

function hasCanonicalSessionDate(data: Record<string, unknown> | null | undefined): boolean {
  return YMD_RE.test(normalizeText(data?.date));
}

export function normalizeCanonicalClassSessionStatus(value: unknown): CanonicalClassSessionStatus {
  const raw = normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (!raw || raw === 'upcoming' || raw === 'planned' || raw === 'open') return 'scheduled';
  if (raw === 'inprogress') return 'in_progress';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'noshow') return 'no_show';
  if (raw === 'reschedulerequested') return 'reschedule_requested';
  if (
    raw === 'scheduled' ||
    raw === 'in_progress' ||
    raw === 'completed' ||
    raw === 'cancelled' ||
    raw === 'no_show' ||
    raw === 'reschedule_requested' ||
    raw === 'rescheduled'
  ) {
    return raw;
  }
  return 'other';
}

function normalizeAttendanceStatus(value: unknown): 'present' | 'late' | 'absent' | '' {
  const raw = normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'present') return 'present';
  if (raw === 'late') return 'late';
  if (raw === 'absent' || raw === 'no_show' || raw === 'noshow') return 'absent';
  return '';
}

function normalizeParentId(value: unknown): string {
  return normalizeText(value);
}

export function resolveSessionClassAttendanceTarget(
  data: Record<string, unknown> | null | undefined,
): ParentMonthClassAttendanceTarget | null {
  const parentId = normalizeParentId(data?.parentId);
  const monthKey = resolveSessionMonthKey(data);
  if (!parentId || !monthKey) return null;
  return { parentId, monthKey };
}

// Compatibility name retained for V2 callers/tests.
export const resolveSessionAttendanceTarget = resolveSessionClassAttendanceTarget;

/**
 * Canonical child identity comes only from kidId/kidIds. Legacy studentId/childId aliases
 * are diagnostic migration signals and are never allowed to silently create a competing
 * child row in the parent read model.
 */
export function resolveCanonicalSessionKidIds(session: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const directKidId = normalizeText(session.kidId);
  if (directKidId) ids.add(directKidId);
  if (Array.isArray(session.kidIds)) {
    session.kidIds.forEach((value) => {
      const kidId = normalizeText(value);
      if (kidId) ids.add(kidId);
    });
  }
  return Array.from(ids).sort();
}

function hasLegacyKidAliasOnly(session: Record<string, unknown>): boolean {
  if (resolveCanonicalSessionKidIds(session).length > 0) return false;
  return Boolean(
    normalizeText(session.studentId) ||
    normalizeText(session.studentUid) ||
    normalizeText(session.childId) ||
    normalizeText(session.linkedStudentId),
  );
}

function resolveKidAttendanceStatus(
  session: Record<string, unknown>,
  kidId: string,
): 'present' | 'late' | 'absent' | '' {
  const attendanceRaw = session.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== 'object') return '';
  const entry = (attendanceRaw as Record<string, unknown>)[kidId];
  if (!entry) return '';
  if (typeof entry === 'string') return normalizeAttendanceStatus(entry);
  if (typeof entry === 'object' && entry !== null) {
    return normalizeAttendanceStatus((entry as Record<string, unknown>).status);
  }
  return '';
}

function projectionFingerprint(
  session: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!session) return null;
  const target = resolveSessionClassAttendanceTarget(session);
  const kidIds = resolveCanonicalSessionKidIds(session);
  const attendanceByKid: Record<string, string> = {};
  kidIds.forEach((kidId) => {
    attendanceByKid[kidId] = resolveKidAttendanceStatus(session, kidId);
  });
  return {
    parentId: target?.parentId || '',
    monthKey: target?.monthKey || '',
    status: normalizeCanonicalClassSessionStatus(session.status),
    startMs: resolveSessionStartMs(session) || 0,
    kidIds,
    legacyKidAliasOnly: hasLegacyKidAliasOnly(session),
    attendanceByKid,
  };
}

/** Metadata-only session writes terminate before any projection query/read. */
export function shouldRefreshParentMonthClassAttendance(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): boolean {
  return JSON.stringify(projectionFingerprint(beforeData)) !== JSON.stringify(projectionFingerprint(afterData));
}

// Compatibility name retained for V2 callers/tests.
export const shouldRefreshParentMonthAttendance = shouldRefreshParentMonthClassAttendance;

export function collectParentMonthClassAttendanceTargets(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): ParentMonthClassAttendanceTarget[] {
  const targets = new Map<string, ParentMonthClassAttendanceTarget>();
  [beforeData, afterData].forEach((data) => {
    const target = resolveSessionClassAttendanceTarget(data);
    if (!target) return;
    const key = `${target.parentId}__${target.monthKey}`;
    const requiresCompatibility = !hasCanonicalSessionDate(data);
    const existing = targets.get(key);
    if (existing) {
      if (requiresCompatibility) existing.requiresCompatibility = true;
      return;
    }
    targets.set(key, requiresCompatibility ? { ...target, requiresCompatibility: true } : target);
  });
  return Array.from(targets.values());
}

// Compatibility name retained for V2 callers/tests.
export const collectParentMonthAttendanceTargets = collectParentMonthClassAttendanceTargets;

export function isMissingAttendanceIndexError(error: unknown): boolean {
  if (!error) return false;
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = String(candidate.code || '').toLowerCase();
  const message = `${String(candidate.message || '')} ${String(candidate.details || '')}`.toLowerCase();
  return (
    message.includes('requires an index') ||
    (message.includes('index') && (code === '9' || code === 'failed-precondition'))
  );
}

function emptyMutableTotals(): MutableTotals {
  return {
    totalSessions: 0,
    completedSessions: 0,
    scheduledSessions: 0,
    inProgressSessions: 0,
    cancelledSessions: 0,
    noShowSessions: 0,
    rescheduleRequestedSessions: 0,
    rescheduledSessions: 0,
    otherSessions: 0,
    upcomingSessions: 0,
    unresolvedPastSessions: 0,
    pendingTimeUnknownSessions: 0,
    presentSessions: 0,
    lateSessions: 0,
    absentSessions: 0,
    pendingSessionStartAtMs: [],
  };
}

function incrementLifecycle(totals: MutableTotals, status: CanonicalClassSessionStatus): void {
  totals.totalSessions += 1;
  if (status === 'completed') totals.completedSessions += 1;
  else if (status === 'scheduled') totals.scheduledSessions += 1;
  else if (status === 'in_progress') totals.inProgressSessions += 1;
  else if (status === 'cancelled') totals.cancelledSessions += 1;
  else if (status === 'no_show') totals.noShowSessions += 1;
  else if (status === 'reschedule_requested') totals.rescheduleRequestedSessions += 1;
  else if (status === 'rescheduled') totals.rescheduledSessions += 1;
  else totals.otherSessions += 1;
}

function incrementPendingTimeBucket(
  totals: MutableTotals,
  status: CanonicalClassSessionStatus,
  startMs: number | null,
  nowMs: number,
): void {
  if (status !== 'scheduled' && status !== 'in_progress') return;
  if (!startMs || startMs <= 0) {
    totals.pendingTimeUnknownSessions += 1;
    return;
  }
  totals.pendingSessionStartAtMs.push(startMs);
  if (startMs >= nowMs) totals.upcomingSessions += 1;
  else totals.unresolvedPastSessions += 1;
}

function incrementCompletedAttendance(
  totals: MutableTotals,
  status: CanonicalClassSessionStatus,
  attendanceStatus: 'present' | 'late' | 'absent' | '',
): void {
  if (status !== 'completed') return;
  if (attendanceStatus === 'present') totals.presentSessions += 1;
  else if (attendanceStatus === 'late') totals.lateSessions += 1;
  else if (attendanceStatus === 'absent') totals.absentSessions += 1;
}

function finalizeTotals(source: MutableTotals): ClassAttendanceProjectionTotals {
  const pendingSessionStartAtMs = [...source.pendingSessionStartAtMs].sort((a, b) => a - b);
  const attendanceMarkedSessions =
    source.presentSessions + source.lateSessions + source.absentSessions;
  const attendanceUnmarkedCompletedSessions = Math.max(
    0,
    source.completedSessions - attendanceMarkedSessions,
  );
  const attendancePct = attendanceMarkedSessions > 0
    ? Math.round(((source.presentSessions + source.lateSessions) / attendanceMarkedSessions) * 100)
    : 0;

  const canonical: ClassAttendanceCanonicalTotals = {
    ...source,
    pendingSessionStartAtMs,
    attendanceMarkedSessions,
    attendanceUnmarkedCompletedSessions,
    attendancePct,
  };

  return {
    ...canonical,
    total: canonical.totalSessions,
    completed: canonical.completedSessions,
    scheduled: canonical.scheduledSessions,
    in_progress: canonical.inProgressSessions,
    cancelled: canonical.cancelledSessions,
    no_show: canonical.noShowSessions,
    reschedule_requested: canonical.rescheduleRequestedSessions,
    rescheduled: canonical.rescheduledSessions,
    other: canonical.otherSessions,
    upcoming: canonical.upcomingSessions,
    unresolvedPast: canonical.unresolvedPastSessions,
    present: canonical.presentSessions,
    late: canonical.lateSessions,
    absent: canonical.absentSessions,
    attendanceMarked: canonical.attendanceMarkedSessions,
  };
}

export function classAttendanceTotalsInvariantErrors(
  totals: ClassAttendanceCanonicalTotals,
): string[] {
  const errors: string[] = [];
  const lifecycleTotal =
    totals.completedSessions +
    totals.scheduledSessions +
    totals.inProgressSessions +
    totals.cancelledSessions +
    totals.noShowSessions +
    totals.rescheduleRequestedSessions +
    totals.rescheduledSessions +
    totals.otherSessions;
  if (lifecycleTotal !== totals.totalSessions) {
    errors.push('class lifecycle states must sum to totalSessions');
  }

  const pendingTotal = totals.scheduledSessions + totals.inProgressSessions;
  const pendingTimeTotal =
    totals.upcomingSessions +
    totals.unresolvedPastSessions +
    totals.pendingTimeUnknownSessions;
  if (pendingTimeTotal !== pendingTotal) {
    errors.push('pending time buckets must sum to scheduled + inProgress sessions');
  }
  if (
    totals.pendingSessionStartAtMs.length !==
    totals.upcomingSessions + totals.unresolvedPastSessions
  ) {
    errors.push('pendingSessionStartAtMs must represent every time-resolved pending session');
  }

  if (
    totals.presentSessions + totals.lateSessions + totals.absentSessions !==
    totals.attendanceMarkedSessions
  ) {
    errors.push('attendance statuses must sum to attendanceMarkedSessions');
  }
  if (
    totals.attendanceMarkedSessions + totals.attendanceUnmarkedCompletedSessions !==
    totals.completedSessions
  ) {
    errors.push('completed sessions must reconcile to marked + unmarked attendance');
  }

  const expectedAttendancePct = totals.attendanceMarkedSessions > 0
    ? Math.round(((totals.presentSessions + totals.lateSessions) / totals.attendanceMarkedSessions) * 100)
    : 0;
  if (totals.attendancePct !== expectedAttendancePct) {
    errors.push('attendancePct must be derived from present + late over marked attendance');
  }
  if (totals.attendancePct < 0 || totals.attendancePct > 100) {
    errors.push('attendancePct must stay between 0 and 100');
  }
  return errors;
}

export function classAttendanceProjectionInvariantErrors(
  projection: ParentMonthClassAttendanceProjection,
): string[] {
  const errors = classAttendanceTotalsInvariantErrors(projection.totals)
    .map((error) => `totals: ${error}`);
  Object.entries(projection.byKid).forEach(([kidId, row]) => {
    classAttendanceTotalsInvariantErrors(row).forEach((error) => {
      errors.push(`${kidId}: ${error}`);
    });
  });
  return errors;
}

/** Pure aggregation used by the function and unit tests. */
export function buildParentMonthClassAttendanceProjection(
  sessions: Array<Record<string, unknown>>,
  monthKey: string,
  nowMs = Date.now(),
): ParentMonthClassAttendanceProjection {
  const totals = emptyMutableTotals();
  const byKid = new Map<string, MutableTotals>();
  let sourceSessionRecords = 0;
  let unassignedSessionRecords = 0;
  let legacyKidAliasOnlySessionRecords = 0;

  const getKidBucket = (kidId: string): MutableTotals => {
    const existing = byKid.get(kidId);
    if (existing) return existing;
    const next = emptyMutableTotals();
    byKid.set(kidId, next);
    return next;
  };

  sessions.forEach((session) => {
    if (resolveSessionMonthKey(session) !== monthKey) return;
    sourceSessionRecords += 1;

    const kidIds = resolveCanonicalSessionKidIds(session);
    if (kidIds.length === 0) {
      unassignedSessionRecords += 1;
      if (hasLegacyKidAliasOnly(session)) legacyKidAliasOnlySessionRecords += 1;
      return;
    }

    const status = normalizeCanonicalClassSessionStatus(session.status);
    const startMs = resolveSessionStartMs(session);

    kidIds.forEach((kidId) => {
      const bucket = getKidBucket(kidId);
      const attendanceStatus = resolveKidAttendanceStatus(session, kidId);

      incrementLifecycle(totals, status);
      incrementLifecycle(bucket, status);
      incrementPendingTimeBucket(totals, status, startMs, nowMs);
      incrementPendingTimeBucket(bucket, status, startMs, nowMs);
      incrementCompletedAttendance(totals, status, attendanceStatus);
      incrementCompletedAttendance(bucket, status, attendanceStatus);
    });
  });

  const byKidObject: Record<string, ClassAttendanceProjectionKidBucket> = {};
  for (const [kidId, bucket] of byKid.entries()) {
    byKidObject[kidId] = {
      kidId,
      monthKey,
      ...finalizeTotals(bucket),
    };
  }

  return {
    totals: finalizeTotals(totals),
    byKid: byKidObject,
    sourceSessionRecords,
    unassignedSessionRecords,
    legacyKidAliasOnlySessionRecords,
  };
}

// Compatibility name retained for V2 callers/tests.
export const buildParentMonthAttendanceProjection = buildParentMonthClassAttendanceProjection;

async function loadCappedCompatibilitySessions(
  db: admin.firestore.Firestore,
  target: ParentMonthClassAttendanceTarget,
  reason: 'missing_index' | 'legacy_session_without_date',
): Promise<{
  sessions: Array<Record<string, unknown>>;
  sourceDocumentsRead: number;
  queryMode: AttendanceQueryMode;
}> {
  logger.warn('Using capped parent class-attendance compatibility query', {
    parentId: target.parentId,
    monthKey: target.monthKey,
    reason,
    maxDocuments: MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS + 1,
  });

  const compatibilitySnap = await db
    .collection('classSessions')
    .where('parentId', '==', target.parentId)
    .limit(MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS + 1)
    .get();

  if (compatibilitySnap.size > MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS) {
    throw new Error(
      `Parent class-attendance compatibility query exceeded safe cap (${target.parentId}, >${MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS} sessions). Create/verify the parentId+date composite index and canonical session dates before retrying.`,
    );
  }

  const sessions = compatibilitySnap.docs
    .map((docSnap) => (docSnap.data() || {}) as Record<string, unknown>)
    .filter((session) => {
      const sessionTarget = resolveSessionClassAttendanceTarget(session);
      return sessionTarget?.parentId === target.parentId && sessionTarget.monthKey === target.monthKey;
    });

  if (sessions.length > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
    throw new Error(
      `Parent-month class-attendance projection exceeded safe cap (${target.parentId}/${target.monthKey}, >${MAX_PARENT_MONTH_ATTENDANCE_SESSIONS} sessions)`,
    );
  }

  return {
    sessions,
    sourceDocumentsRead: compatibilitySnap.size,
    queryMode: 'parentId_capped_compatibility',
  };
}

async function loadBoundedParentMonthSessions(
  db: admin.firestore.Firestore,
  target: ParentMonthClassAttendanceTarget,
): Promise<{
  sessions: Array<Record<string, unknown>>;
  sourceDocumentsRead: number;
  queryMode: AttendanceQueryMode;
}> {
  const monthRange = monthDateRangeFromKey(target.monthKey);
  if (!monthRange) {
    return {
      sessions: [],
      sourceDocumentsRead: 0,
      queryMode: 'parentId_date_month_bounded',
    };
  }

  if (target.requiresCompatibility) {
    return loadCappedCompatibilitySessions(db, target, 'legacy_session_without_date');
  }

  try {
    const boundedSnap = await db
      .collection('classSessions')
      .where('parentId', '==', target.parentId)
      .where('date', '>=', monthRange.startYmd)
      .where('date', '<=', monthRange.endYmd)
      .limit(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS + 1)
      .get();

    if (boundedSnap.size > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
      throw new Error(
        `Parent-month class-attendance projection exceeded safe cap (${target.parentId}/${target.monthKey}, >${MAX_PARENT_MONTH_ATTENDANCE_SESSIONS} sessions)`,
      );
    }

    return {
      sessions: boundedSnap.docs.map(
        (docSnap) => (docSnap.data() || {}) as Record<string, unknown>,
      ),
      sourceDocumentsRead: boundedSnap.size,
      queryMode: 'parentId_date_month_bounded',
    };
  } catch (error) {
    if (!isMissingAttendanceIndexError(error)) throw error;
    return loadCappedCompatibilitySessions(db, target, 'missing_index');
  }
}

async function recomputeParentMonthClassAttendanceReadModel(
  db: admin.firestore.Firestore,
  target: ParentMonthClassAttendanceTarget,
): Promise<{
  sourceSessionCount: number;
  sourceDocumentsRead: number;
  queryMode: AttendanceQueryMode;
  childRowCount: number;
}> {
  const source = await loadBoundedParentMonthSessions(db, target);
  const generatedAtMs = Date.now();
  const projection = buildParentMonthClassAttendanceProjection(
    source.sessions,
    target.monthKey,
    generatedAtMs,
  );
  const invariantErrors = classAttendanceProjectionInvariantErrors(projection);
  if (invariantErrors.length > 0) {
    throw new Error(`Class-attendance projection invariant failure: ${invariantErrors.join('; ')}`);
  }

  const docRef = db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);

  await docRef.set(
    {
      parentId: target.parentId,
      monthKey: target.monthKey,
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        classAuthority: 'class_sessions',
        attendanceAuthority: 'completed_session_attendance',
        childRowsAuthoritative: true,
        totalsScope: 'parent_month_child_session_instances',
        timeClassificationAsOfMs: generatedAtMs,
        timeBucketsRecomputableFromPendingStarts: true,
        queryMode: source.queryMode,
        sourceSessionCount: source.sessions.length,
        sourceDocumentsRead: source.sourceDocumentsRead,
        maxSourceSessionCount: MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
        unassignedSessionRecords: projection.unassignedSessionRecords,
        legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
        refreshedAt: FieldValue.serverTimestamp(),
        generatedAtMs,
        totals: projection.totals,
        byKid: projection.byKid,
      },
    },
    { merge: true },
  );

  return {
    sourceSessionCount: source.sessions.length,
    sourceDocumentsRead: source.sourceDocumentsRead,
    queryMode: source.queryMode,
    childRowCount: Object.keys(projection.byKid).length,
  };
}

/**
 * Brick P4 canonical parent class/attendance projection. The function export name is
 * intentionally unchanged so deployment replaces V2 rather than creating a second writer.
 */
export const onClassSessionReadModelWrite = onDocumentWritten(
  {
    document: 'classSessions/{sessionId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.exists
      ? (change.before.data() as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? (change.after.data() as Record<string, unknown>)
      : null;

    if (!shouldRefreshParentMonthClassAttendance(beforeData, afterData)) {
      logger.debug('Skipped parent class-attendance refresh: no projection-relevant change', {
        sessionId: event.params.sessionId,
      });
      return;
    }

    const targets = collectParentMonthClassAttendanceTargets(beforeData, afterData);
    if (targets.length === 0) {
      logger.warn('Skipped parent class-attendance refresh: parent/month target unresolved', {
        sessionId: event.params.sessionId,
      });
      return;
    }

    const db = admin.firestore();
    for (const target of targets) {
      try {
        const result = await recomputeParentMonthClassAttendanceReadModel(db, target);
        logger.debug('Refreshed canonical parent class-attendance read model v3', {
          sessionId: event.params.sessionId,
          parentId: target.parentId,
          monthKey: target.monthKey,
          ...result,
        });
      } catch (error) {
        logger.error('Canonical parent class-attendance refresh failed', {
          sessionId: event.params.sessionId,
          parentId: target.parentId,
          monthKey: target.monthKey,
          error: error instanceof Error ? error.message : String(error || ''),
        });
        throw error;
      }
    }
  },
);
