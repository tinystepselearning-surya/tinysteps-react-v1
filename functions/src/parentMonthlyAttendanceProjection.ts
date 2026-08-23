import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { normalizeSessionStatus } from './helpers/status';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

// A parent should never have anywhere close to this many class records in one month.
// The guard converts an unexpected data-shape problem into a visible failure instead of
// silently turning one session write into an unbounded historical scan.
export const MAX_PARENT_MONTH_ATTENDANCE_SESSIONS = 250;

type ParentMonthTarget = { parentId: string; monthKey: string };

export type AttendanceProjectionTotals = {
  total: number;
  completed: number;
  in_progress: number;
  scheduled: number;
  cancelled: number;
  no_show: number;
  reschedule_requested: number;
  other: number;
  upcoming: number;
  present: number;
  late: number;
  absent: number;
  attendanceMarked: number;
  attendancePct: number;
};

export type AttendanceProjectionKidBucket = AttendanceProjectionTotals & {
  kidId: string;
};

export type AttendanceProjection = {
  totals: AttendanceProjectionTotals;
  byKid: Record<string, AttendanceProjectionKidBucket>;
};

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

function normalizeParentId(value: unknown): string {
  return String(value || '').trim();
}

function normalizeAttendanceStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function sanitizeKidId(value: unknown): string {
  const id = String(value || '').trim();
  return id || '_unassigned';
}

/**
 * Class-session month ownership must come from the scheduled class date/time, never from
 * generic updatedAt/createdAt timestamps. Using updatedAt can move an old class into the
 * month in which somebody edited it and can force unrelated month projections to refresh.
 */
export function resolveSessionMonthKey(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;

  const date = String(data.date || '').trim();
  if (YMD_RE.test(date)) return date.slice(0, 7);

  const fromStartAt = monthKeyFromDateIST(data.startAt || data.scheduledAt || null);
  if (fromStartAt) return fromStartAt;

  // Keep a narrow compatibility fallback for historical records that explicitly persisted
  // a class month but lack canonical date/startAt. Do not infer from updatedAt/createdAt.
  const explicitMonth = String(data.monthKey || '').trim();
  return MONTH_RE.test(explicitMonth) ? explicitMonth : null;
}

export function resolveSessionAttendanceTarget(
  data: Record<string, unknown> | null | undefined,
): ParentMonthTarget | null {
  const parentId = normalizeParentId(data?.parentId);
  const monthKey = resolveSessionMonthKey(data);
  if (!parentId || !monthKey) return null;
  return { parentId, monthKey };
}

function resolveSessionKidIds(session: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const directKidId = String(session.kidId || session.studentId || '').trim();
  if (directKidId) ids.add(directKidId);
  if (Array.isArray(session.kidIds)) {
    session.kidIds.forEach((raw) => {
      const normalized = String(raw || '').trim();
      if (normalized) ids.add(normalized);
    });
  }
  if (ids.size === 0) ids.add('_unassigned');
  return Array.from(ids).sort();
}

function resolveKidAttendanceStatus(session: Record<string, unknown>, kidId: string): string {
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
  const target = resolveSessionAttendanceTarget(session);
  const kidIds = resolveSessionKidIds(session);
  const attendanceByKid: Record<string, string> = {};
  kidIds.forEach((kidId) => {
    attendanceByKid[kidId] = resolveKidAttendanceStatus(session, kidId);
  });
  return {
    parentId: target?.parentId || '',
    monthKey: target?.monthKey || '',
    status: normalizeSessionStatus(session.status),
    startMs:
      toDate(session.startAt || session.scheduledAt || null)?.getTime() || 0,
    kidIds,
    attendanceByKid,
  };
}

/**
 * Most class-session writes are not attendance projection changes (notes, audit metadata,
 * links, timestamps, recordings, etc.). Those writes should terminate before any Firestore
 * read. Only fields that can change the parent-month attendance projection are compared.
 */
export function shouldRefreshParentMonthAttendance(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): boolean {
  return (
    JSON.stringify(projectionFingerprint(beforeData)) !==
    JSON.stringify(projectionFingerprint(afterData))
  );
}

export function collectParentMonthAttendanceTargets(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): ParentMonthTarget[] {
  const targets = new Map<string, ParentMonthTarget>();
  [beforeData, afterData].forEach((data) => {
    const target = resolveSessionAttendanceTarget(data);
    if (target) targets.set(`${target.parentId}__${target.monthKey}`, target);
  });
  return Array.from(targets.values());
}

function emptyTotals(): AttendanceProjectionTotals {
  return {
    total: 0,
    completed: 0,
    in_progress: 0,
    scheduled: 0,
    cancelled: 0,
    no_show: 0,
    reschedule_requested: 0,
    other: 0,
    upcoming: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceMarked: 0,
    attendancePct: 0,
  };
}

function emptyKidBucket(kidId: string): AttendanceProjectionKidBucket {
  return { kidId, ...emptyTotals() };
}

function incrementStatus(
  totals: AttendanceProjectionTotals,
  bucket: AttendanceProjectionKidBucket,
  status: string,
): void {
  const knownStatus = [
    'completed',
    'in_progress',
    'scheduled',
    'cancelled',
    'no_show',
    'reschedule_requested',
  ].includes(status);
  const key = knownStatus
    ? (status as
        | 'completed'
        | 'in_progress'
        | 'scheduled'
        | 'cancelled'
        | 'no_show'
        | 'reschedule_requested')
    : 'other';
  totals[key] += 1;
  bucket[key] += 1;
}

/** Pure aggregation used by the function and unit tests. */
export function buildParentMonthAttendanceProjection(
  sessions: Array<Record<string, unknown>>,
  monthKey: string,
  nowMs = Date.now(),
): AttendanceProjection {
  const totals = emptyTotals();
  const byKid = new Map<string, AttendanceProjectionKidBucket>();

  const getKidBucket = (kidId: string): AttendanceProjectionKidBucket => {
    const key = sanitizeKidId(kidId);
    const existing = byKid.get(key);
    if (existing) return existing;
    const next = emptyKidBucket(key);
    byKid.set(key, next);
    return next;
  };

  sessions.forEach((session) => {
    if (resolveSessionMonthKey(session) !== monthKey) return;

    const status = normalizeSessionStatus(session.status);
    const startMs =
      toDate(session.startAt || session.scheduledAt || null)?.getTime() || 0;
    const kidIds = resolveSessionKidIds(session);

    kidIds.forEach((kidId) => {
      const bucket = getKidBucket(kidId);
      totals.total += 1;
      bucket.total += 1;
      incrementStatus(totals, bucket, status);

      if (
        (status === 'scheduled' || status === 'in_progress') &&
        startMs > 0 &&
        startMs >= nowMs
      ) {
        totals.upcoming += 1;
        bucket.upcoming += 1;
      }

      if (status !== 'completed') return;
      const attendanceStatus = resolveKidAttendanceStatus(session, kidId);
      if (attendanceStatus === 'present') {
        totals.present += 1;
        bucket.present += 1;
      } else if (attendanceStatus === 'late') {
        totals.late += 1;
        bucket.late += 1;
      } else if (attendanceStatus === 'absent' || attendanceStatus === 'no_show') {
        totals.absent += 1;
        bucket.absent += 1;
      }
    });
  });

  const byKidObject: Record<string, AttendanceProjectionKidBucket> = {};
  for (const [kidId, bucket] of byKid.entries()) {
    bucket.attendanceMarked = bucket.present + bucket.late + bucket.absent;
    bucket.attendancePct =
      bucket.attendanceMarked > 0
        ? Math.round(((bucket.present + bucket.late) / bucket.attendanceMarked) * 100)
        : 0;
    byKidObject[kidId] = bucket;
  }

  totals.attendanceMarked = totals.present + totals.late + totals.absent;
  totals.attendancePct =
    totals.attendanceMarked > 0
      ? Math.round(((totals.present + totals.late) / totals.attendanceMarked) * 100)
      : 0;

  return { totals, byKid: byKidObject };
}

async function recomputeParentMonthAttendanceReadModel(
  db: admin.firestore.Firestore,
  target: ParentMonthTarget,
): Promise<number> {
  const monthRange = monthDateRangeFromKey(target.monthKey);
  if (!monthRange) return 0;

  // Strictly server-bounded by parent + canonical class date. There is intentionally NO
  // fallback to `where(parentId == ...).get()`: a missing index or bad schema must surface
  // as an error rather than create a hidden all-history read amplifier.
  const sessionsSnap = await db
    .collection('classSessions')
    .where('parentId', '==', target.parentId)
    .where('date', '>=', monthRange.startYmd)
    .where('date', '<=', monthRange.endYmd)
    .limit(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS + 1)
    .get();

  if (sessionsSnap.size > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
    throw new Error(
      `Parent-month attendance projection exceeded safe cap (${target.parentId}/${target.monthKey}, >${MAX_PARENT_MONTH_ATTENDANCE_SESSIONS} sessions)`,
    );
  }

  const sessions = sessionsSnap.docs.map(
    (docSnap) => (docSnap.data() || {}) as Record<string, unknown>,
  );
  const generatedAtMs = Date.now();
  const projection = buildParentMonthAttendanceProjection(
    sessions,
    target.monthKey,
    generatedAtMs,
  );

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
        schemaVersion: 2,
        modelType: 'attendance_v2_month_bounded',
        queryMode: 'parentId_date_month_bounded',
        sourceSessionCount: sessionsSnap.size,
        maxSourceSessionCount: MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
        refreshedAt: FieldValue.serverTimestamp(),
        generatedAtMs,
        totals: projection.totals,
        byKid: projection.byKid,
      },
    },
    { merge: true },
  );

  return sessionsSnap.size;
}

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

    if (!shouldRefreshParentMonthAttendance(beforeData, afterData)) {
      logger.debug('Skipped parent monthly attendance refresh: no projection-relevant change', {
        sessionId: event.params.sessionId,
      });
      return;
    }

    const targets = collectParentMonthAttendanceTargets(beforeData, afterData);
    if (targets.length === 0) return;

    const db = admin.firestore();
    for (const target of targets) {
      try {
        const sourceSessionCount = await recomputeParentMonthAttendanceReadModel(db, target);
        logger.debug('Refreshed bounded parent monthly attendance read model', {
          sessionId: event.params.sessionId,
          parentId: target.parentId,
          monthKey: target.monthKey,
          sourceSessionCount,
        });
      } catch (error) {
        logger.error('Bounded parent monthly attendance refresh failed', {
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
