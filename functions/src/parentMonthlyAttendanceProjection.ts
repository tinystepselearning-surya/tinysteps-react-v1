import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { normalizeSessionStatus } from './helpers/status';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const PROCESSED_EVENT_WINDOW = 128;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const STATUS_FIELDS = [
  'completed',
  'in_progress',
  'scheduled',
  'cancelled',
  'no_show',
  'reschedule_requested',
] as const;

type AttendanceStatusField = (typeof STATUS_FIELDS)[number];
type ParentMonthTarget = { parentId: string; monthKey: string };

type AttendanceContribution = {
  status: string;
  kidIds: string[];
  startMs: number;
  upcoming: boolean;
  attendanceByKid: Record<string, string>;
};

type AttendanceTotals = {
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

type AttendanceKidBucket = AttendanceTotals & { kidId: string };

type AttendanceProjectionState = {
  totals: AttendanceTotals;
  byKid: Record<string, AttendanceKidBucket>;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
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
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
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

export function resolveSessionMonthKey(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;

  const explicitMonth = String(data.monthKey || '').trim();
  if (MONTH_RE.test(explicitMonth)) return explicitMonth;

  const date = String(data.date || '').trim();
  if (YMD_RE.test(date)) return date.slice(0, 7);

  return monthKeyFromDateIST(data.startAt || data.scheduledAt || data.createdAt || null);
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

function projectionInputs(session: Record<string, unknown> | null): Record<string, unknown> | null {
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
    startMs: toDate(session.startAt || session.date || session.createdAt || null)?.getTime() || 0,
    kidIds,
    attendanceByKid,
  };
}

export function shouldRefreshParentMonthAttendance(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): boolean {
  const before = projectionInputs(beforeData);
  const after = projectionInputs(afterData);
  if (!before && !after) return false;
  return JSON.stringify(before) !== JSON.stringify(after);
}

function buildContribution(
  session: Record<string, unknown> | null,
  nowMs: number,
): AttendanceContribution | null {
  if (!session) return null;
  const target = resolveSessionAttendanceTarget(session);
  if (!target) return null;
  const status = normalizeSessionStatus(session.status);
  const startMs = toDate(session.startAt || session.date || session.createdAt || null)?.getTime() || 0;
  const kidIds = resolveSessionKidIds(session);
  const attendanceByKid: Record<string, string> = {};
  kidIds.forEach((kidId) => {
    attendanceByKid[kidId] = resolveKidAttendanceStatus(session, kidId);
  });
  return {
    status,
    kidIds,
    startMs,
    upcoming:
      (status === 'scheduled' || status === 'in_progress') &&
      startMs > 0 &&
      startMs >= nowMs,
    attendanceByKid,
  };
}

function emptyTotals(): AttendanceTotals {
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

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTotals(raw: unknown): AttendanceTotals {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const totals = emptyTotals();
  (Object.keys(totals) as Array<keyof AttendanceTotals>).forEach((key) => {
    totals[key] = Math.max(0, numeric(source[key]));
  });
  return totals;
}

function normalizeKidBucket(kidId: string, raw: unknown): AttendanceKidBucket {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    kidId,
    ...normalizeTotals(source),
  };
}

function normalizeProjectionState(attendance: Record<string, unknown> | null): AttendanceProjectionState {
  const byKidRaw =
    attendance?.byKid && typeof attendance.byKid === 'object'
      ? (attendance.byKid as Record<string, unknown>)
      : {};
  const byKid: Record<string, AttendanceKidBucket> = {};
  Object.entries(byKidRaw).forEach(([kidId, raw]) => {
    byKid[kidId] = normalizeKidBucket(kidId, raw);
  });
  return {
    totals: normalizeTotals(attendance?.totals),
    byKid,
  };
}

function statusField(status: string): AttendanceStatusField | 'other' {
  return (STATUS_FIELDS as readonly string[]).includes(status)
    ? (status as AttendanceStatusField)
    : 'other';
}

function mutateCounter(target: Record<string, unknown>, key: string, delta: number): void {
  target[key] = Math.max(0, numeric(target[key]) + delta);
}

function finalizeProjectionState(state: AttendanceProjectionState): AttendanceProjectionState {
  Object.entries(state.byKid).forEach(([kidId, bucket]) => {
    const attendanceMarked = bucket.present + bucket.late + bucket.absent;
    bucket.attendanceMarked = attendanceMarked;
    bucket.attendancePct =
      attendanceMarked > 0
        ? Math.round(((bucket.present + bucket.late) / attendanceMarked) * 100)
        : 0;
    if (
      bucket.total === 0 &&
      bucket.completed === 0 &&
      bucket.in_progress === 0 &&
      bucket.scheduled === 0 &&
      bucket.cancelled === 0 &&
      bucket.no_show === 0 &&
      bucket.reschedule_requested === 0 &&
      bucket.other === 0
    ) {
      delete state.byKid[kidId];
    }
  });

  state.totals.attendanceMarked =
    state.totals.present + state.totals.late + state.totals.absent;
  state.totals.attendancePct =
    state.totals.attendanceMarked > 0
      ? Math.round(
          ((state.totals.present + state.totals.late) /
            state.totals.attendanceMarked) *
            100,
        )
      : 0;
  return state;
}

export function applyAttendanceContribution(
  state: AttendanceProjectionState,
  contribution: AttendanceContribution | null,
  direction: 1 | -1,
): AttendanceProjectionState {
  if (!contribution) return state;
  const statusKey = statusField(contribution.status);

  contribution.kidIds.forEach((rawKidId) => {
    const kidId = sanitizeKidId(rawKidId);
    const bucket = state.byKid[kidId] || normalizeKidBucket(kidId, null);
    state.byKid[kidId] = bucket;

    mutateCounter(state.totals as unknown as Record<string, unknown>, 'total', direction);
    mutateCounter(bucket as unknown as Record<string, unknown>, 'total', direction);
    mutateCounter(state.totals as unknown as Record<string, unknown>, statusKey, direction);
    mutateCounter(bucket as unknown as Record<string, unknown>, statusKey, direction);

    if (contribution.upcoming) {
      mutateCounter(state.totals as unknown as Record<string, unknown>, 'upcoming', direction);
      mutateCounter(bucket as unknown as Record<string, unknown>, 'upcoming', direction);
    }

    if (contribution.status !== 'completed') return;
    const attendanceStatus = contribution.attendanceByKid[kidId] || '';
    if (attendanceStatus === 'present') {
      mutateCounter(state.totals as unknown as Record<string, unknown>, 'present', direction);
      mutateCounter(bucket as unknown as Record<string, unknown>, 'present', direction);
    } else if (attendanceStatus === 'late') {
      mutateCounter(state.totals as unknown as Record<string, unknown>, 'late', direction);
      mutateCounter(bucket as unknown as Record<string, unknown>, 'late', direction);
    } else if (attendanceStatus === 'absent' || attendanceStatus === 'no_show') {
      mutateCounter(state.totals as unknown as Record<string, unknown>, 'absent', direction);
      mutateCounter(bucket as unknown as Record<string, unknown>, 'absent', direction);
    }
  });

  return finalizeProjectionState(state);
}

function eventWindow(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(-PROCESSED_EVENT_WINDOW);
}

export function rememberProcessedEvent(existing: unknown, eventId: string): string[] {
  const current = eventWindow(existing);
  if (!eventId || current.includes(eventId)) return current;
  return [...current, eventId].slice(-PROCESSED_EVENT_WINDOW);
}

function contributionForTarget(
  data: Record<string, unknown> | null,
  target: ParentMonthTarget,
  nowMs: number,
): AttendanceContribution | null {
  const candidateTarget = resolveSessionAttendanceTarget(data);
  if (
    !candidateTarget ||
    candidateTarget.parentId !== target.parentId ||
    candidateTarget.monthKey !== target.monthKey
  ) {
    return null;
  }
  return buildContribution(data, nowMs);
}

function collectTargets(
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

async function bootstrapParentMonthAttendance(
  db: admin.firestore.Firestore,
  target: ParentMonthTarget,
  eventId: string,
  nowMs: number,
): Promise<void> {
  const monthRange = monthDateRangeFromKey(target.monthKey);
  if (!monthRange) return;

  // This is intentionally month-bounded. Never fall back to scanning a parent's full
  // class-session history. A missing compound index should fail visibly rather than
  // silently turning one session write into an unbounded historical read.
  const sessionsSnap = await db
    .collection('classSessions')
    .where('parentId', '==', target.parentId)
    .where('date', '>=', monthRange.startYmd)
    .where('date', '<=', monthRange.endYmd)
    .get();

  let state: AttendanceProjectionState = {
    totals: emptyTotals(),
    byKid: {},
  };
  sessionsSnap.docs.forEach((docSnap) => {
    const session = (docSnap.data() || {}) as Record<string, unknown>;
    const sessionTarget = resolveSessionAttendanceTarget(session);
    if (
      !sessionTarget ||
      sessionTarget.parentId !== target.parentId ||
      sessionTarget.monthKey !== target.monthKey
    ) {
      return;
    }
    state = applyAttendanceContribution(state, buildContribution(session, nowMs), 1);
  });

  const ref = db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);
  await ref.set(
    {
      parentId: target.parentId,
      monthKey: target.monthKey,
      attendance: {
        schemaVersion: 2,
        modelType: 'attendance_v2_incremental',
        refreshedAt: FieldValue.serverTimestamp(),
        generatedAtMs: nowMs,
        processedEventIds: rememberProcessedEvent([], eventId),
        totals: state.totals,
        byKid: state.byKid,
      },
    },
    { merge: true },
  );
}

async function applyIncrementalAttendanceEvent(
  db: admin.firestore.Firestore,
  target: ParentMonthTarget,
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
  eventId: string,
  nowMs: number,
): Promise<'updated' | 'duplicate' | 'bootstrap'> {
  const ref = db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);

  let needsBootstrap = false;
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const docData = snap.exists ? ((snap.data() || {}) as Record<string, unknown>) : {};
    const attendance =
      docData.attendance && typeof docData.attendance === 'object'
        ? (docData.attendance as Record<string, unknown>)
        : null;

    if (!attendance) {
      needsBootstrap = true;
      return 'bootstrap' as const;
    }

    const processed = eventWindow(attendance.processedEventIds);
    if (eventId && processed.includes(eventId)) return 'duplicate' as const;

    let state = normalizeProjectionState(attendance);
    state = applyAttendanceContribution(
      state,
      contributionForTarget(beforeData, target, nowMs),
      -1,
    );
    state = applyAttendanceContribution(
      state,
      contributionForTarget(afterData, target, nowMs),
      1,
    );

    tx.set(
      ref,
      {
        parentId: target.parentId,
        monthKey: target.monthKey,
        attendance: {
          schemaVersion: 2,
          modelType: 'attendance_v2_incremental',
          refreshedAt: FieldValue.serverTimestamp(),
          generatedAtMs: nowMs,
          processedEventIds: rememberProcessedEvent(processed, eventId),
          totals: state.totals,
          byKid: state.byKid,
        },
      },
      { merge: true },
    );
    return 'updated' as const;
  });

  if (needsBootstrap || result === 'bootstrap') {
    await bootstrapParentMonthAttendance(db, target, eventId, nowMs);
    return 'bootstrap';
  }
  return result;
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

    const targets = collectTargets(beforeData, afterData);
    if (targets.length === 0) return;

    const db = admin.firestore();
    const eventId = String(event.id || '').trim();
    const nowMs = Date.now();

    for (const target of targets) {
      try {
        const mode = await applyIncrementalAttendanceEvent(
          db,
          target,
          beforeData,
          afterData,
          eventId,
          nowMs,
        );
        logger.debug('Refreshed parent monthly attendance read model', {
          sessionId: event.params.sessionId,
          parentId: target.parentId,
          monthKey: target.monthKey,
          mode,
        });
      } catch (error) {
        logger.error('Parent monthly attendance projection refresh failed', {
          sessionId: event.params.sessionId,
          parentId: target.parentId,
          monthKey: target.monthKey,
          eventId,
          error: error instanceof Error ? error.message : String(error || ''),
        });
        throw error;
      }
    }
  },
);
