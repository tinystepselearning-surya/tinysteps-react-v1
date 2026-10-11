/**
 * October 2026 cutover: bounded, synchronous Today + Tomorrow reconciliation
 * after a Student Management timetable/lifecycle/teacher change.
 *
 * Enrollment creation NEVER calls this module. The nightly generator creates
 * tomorrow's sessions; this module fixes only the two already-visible days.
 *
 * Disabled until the daily cutover is explicitly activated in each callable's
 * Cloud Run environment. Zero Firestore reads when disabled.
 */
import * as admin from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {
  addDaysYmd,
  buildRollingScheduledSessionPayload,
  normalizeRollingMaterializerSlots,
  rollingSessionId,
  type RollingMaterializationOccurrence,
} from './rollingScheduleMaterializer';
import {isFutureScheduleExceptionSession} from './futureScheduleInspection';

export const DAY_WINDOW_SYNC_START_YMD = '2026-10-12';
const IST_OFFSET_MS = 330 * 60 * 1000;
const MAX_DAY_SESSIONS = 40;
const MAX_CANDIDATE_SESSIONS = 12;
const AUTO_SOURCE = 'rolling_schedule';
const ACTIVE_ENROLLMENT_STATES = new Set([
  'active', 'enrolled', 'current', 'ongoing', 'pending_payment', 'pending_lp',
]);
const PENDING_SESSION_STATES = new Set(['scheduled', 'upcoming', 'planned', 'open']);

type Enrollment = Record<string, unknown>;

export type DayWindowSyncResult = {
  state: 'disabled' | 'synchronized';
  targetDays: string[];
  created: number;
  updated: number;
  removed: number;
  preserved: number;
  conflicts: number;
};

export const dayWindowSyncWritesEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => String(env.TIMETABLE_DAY_SYNC_ENABLED || '').trim().toLowerCase() === 'true';

export function indiaDay(now = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

const str = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const isObject = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

function childIdFromEnrollment(enrollment: Enrollment): string {
  const list = Array.isArray(enrollment.kidIds) ? enrollment.kidIds : [];
  return str(enrollment.kidId) || list.map(str).find(Boolean) ||
    str(enrollment.studentId) || str(enrollment.childId);
}

function isActiveEnrollment(enrollment: Enrollment): boolean {
  return !enrollment.archived && !enrollment.isArchived && !enrollment.archivedAt &&
    ACTIVE_ENROLLMENT_STATES.has(str(enrollment.status).toLowerCase());
}

function isActiveChild(child: Enrollment | null): boolean {
  if (!child || child.archived || child.isArchived || child.archivedAt ||
    child.deleted || child.isDeleted || child.deletedAt) return false;
  const status = str(child.status).toLowerCase();
  return status === '' || status === 'active';
}

function dateStartYmd(enrollment: Enrollment): string | null {
  for (const value of [
    enrollment.classesStartDateYmd, enrollment.startDateYmd,
    enrollment.classesStartDate, enrollment.startDate,
  ]) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = (value as {toDate?: () => Date} | null)?.toDate?.();
    if (date instanceof Date && Number.isFinite(date.getTime())) return indiaDay(date);
  }
  return null;
}

function revision(enrollment: Enrollment): number {
  const schedule = isObject(enrollment.schedule) ? enrollment.schedule : {};
  const num = Number(schedule.revision);
  return Number.isInteger(num) && num >= 1 ? num : 1;
}

function dateToUtcMs(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date);
}

/** Pure two-day plan. No generation for earlier/past start times. */
export function planTodayTomorrowForEnrollment(args: {
  enrollmentId: string;
  enrollment: Enrollment;
  todayYmd: string;
  nowMs: number;
  activeChild: boolean;
}): RollingMaterializationOccurrence[] {
  if (!args.activeChild || !isActiveEnrollment(args.enrollment)) return [];
  // Legacy enrollments may omit the class-start cutoff. Their authoritative
  // weekly timetable is still valid (same policy as the nightly planner).
  const startYmd = dateStartYmd(args.enrollment);
  const slots = normalizeRollingMaterializerSlots(args.enrollment.schedule);
  if (!slots.length) {
    // An active enrollment with a missing timetable is a data-quality error,
    // not permission to delete every existing pending class.
    throw new HttpsError('failed-precondition',
      'Active enrollment has no recurring timetable. Repair Student Management first.');
  }
  const days = [args.todayYmd, addDaysYmd(args.todayYmd, 1)];
  const occurrences: RollingMaterializationOccurrence[] = [];
  for (const date of days) {
    if (startYmd && date < startYmd) continue;
    const midnightUtcMs = dateToUtcMs(date);
    const weekday = new Date(midnightUtcMs).getUTCDay();
    for (const slot of slots) {
      if (slot.weekday !== weekday) continue;
      const startAtUtcMs = midnightUtcMs +
        (slot.hour * 60 + slot.minute) * 60000 - IST_OFFSET_MS;
      if (startAtUtcMs <= args.nowMs) continue;
      const endAtUtcMs = startAtUtcMs + slot.durationMinutes * 60000;
      const endMinutes = (slot.hour * 60 + slot.minute + slot.durationMinutes) % 1440;
      const endTime = [Math.floor(endMinutes / 60), endMinutes % 60]
        .map((v) => String(v).padStart(2, '0')).join(':');
      occurrences.push({
        date, weekday, startTime: slot.time, endTime,
        durationMinutes: slot.durationMinutes,
        startAtUtcMs, endAtUtcMs,
        occurrenceKey: `${date}|${slot.time}|${slot.durationMinutes}`,
        sessionId: rollingSessionId(args.enrollmentId, date, slot.time),
      });
    }
  }
  if (occurrences.length > MAX_CANDIDATE_SESSIONS) {
    throw new HttpsError('failed-precondition', 'Two-day timetable exceeds the per-enrollment safety cap');
  }
  return occurrences.sort((a, b) => a.startAtUtcMs - b.startAtUtcMs);
}

function sessionStartMs(session: Enrollment): number | null {
  const startAt = session.startAt as {toMillis?: () => number} | undefined;
  const millis = startAt?.toMillis?.();
  return Number.isFinite(millis) ? Number(millis) : null;
}

function hasAttendanceOrFinance(session: Enrollment): boolean {
  const attendance = session.attendance;
  const marked = attendance != null && attendance !== '' &&
    (!isObject(attendance) || Object.keys(attendance).length > 0);
  return marked || Boolean(
    session.billingChargeId || session.teacherEarningId ||
    session.financeLocked || session.financeLock || session.lockedAt ||
    session.paidAt || session.settledAt || session.billedAt || session.invoicedAt ||
    session.billingProcessed || session.revenueProcessed ||
    session.revenueAccrued || session.teacherPayProcessed ||
    Number(session.accruedAmount || 0) > 0
  );
}

/** Public for regression tests. Only untouched future AUTO sessions can move. */
export function canMutateAutoSession(args: {
  session: Enrollment;
  enrollmentId: string;
  nowMs: number;
  externallyFinanceLinked: boolean;
}): boolean {
  const {session} = args;
  const status = str(session.status).toLowerCase();
  const startMs = sessionStartMs(session);
  return str(session.enrollmentId) === args.enrollmentId &&
    str(session.source).toLowerCase() === AUTO_SOURCE &&
    !isFutureScheduleExceptionSession(session) &&
    PENDING_SESSION_STATES.has(status) &&
    startMs !== null && startMs > args.nowMs &&
    !hasAttendanceOrFinance(session) &&
    !args.externallyFinanceLinked;
}

function needsUpdate(existing: Enrollment, target: Enrollment): boolean {
  const strKeys = [
    'teacherId', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid',
    'teacher_id', 'teacherName', 'courseId', 'joinUrl', 'date', 'startTime',
    'endTime', 'scheduleOccurrenceKey', 'financialTermsCurrency',
  ];
  const numberKeys = [
    'durationMins', 'durationMinutes', 'feePerClass', 'feeAmount',
    'teacherPayPerSession', 'billingRateSnapshot',
    'teacherPayRateSnapshot', 'scheduleRevision',
  ];
  if (strKeys.some((key) => str(existing[key]) !== str(target[key]))) return true;
  if (numberKeys.some((key) => Number(existing[key] ?? 0) !== Number(target[key] ?? 0))) {
    return true;
  }
  const start = sessionStartMs(existing);
  const nextStart = sessionStartMs(target);
  const end = (existing.endAt as {toMillis?: () => number} | undefined)?.toMillis?.();
  const nextEnd = (target.endAt as {toMillis?: () => number} | undefined)?.toMillis?.();
  return start !== nextStart || end !== nextEnd;
}

function patchExisting(payload: Enrollment, actorId: string): Enrollment {
  const {createdAt: _createdAt, createdBy: _createdBy,
    status: _status, attendance: _attendance, ...mutable} = payload;
  return {
    ...mutable,
    teacherName: payload.teacherName || FieldValue.delete(),
    teacherEmail: payload.teacherEmail || FieldValue.delete(),
    joinUrl: payload.joinUrl || FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorId,
  };
}

const empty = (state: 'disabled' | 'synchronized', days: string[]): DayWindowSyncResult => ({
  state, targetDays: days, created: 0, updated: 0,
  removed: 0, preserved: 0, conflicts: 0,
});

/**
 * One bounded transaction. The enrollment and its two date buckets are read
 * transactionally, so changes to recurrence/session documents cause retries.
 *
 * The query requires the already deployed classSessions(enrollmentId,date)
 * composite index. External billingCharges/teacherEarnings are read by exact
 * session IDs only. No collection-wide scans.
 */
export async function syncTodayTomorrowForEnrollment(args: {
  db: admin.firestore.Firestore;
  enrollmentId: string;
  actorId: string;
  expectedRevision?: number;
  now?: Date;
  enabled?: boolean;
}): Promise<DayWindowSyncResult> {
  const now = args.now || new Date();
  const todayYmd = indiaDay(now);
  const days = [todayYmd, addDaysYmd(todayYmd, 1)];
  if (args.enabled !== true && !(args.enabled === undefined && dayWindowSyncWritesEnabled())) {
    return empty('disabled', days);
  }
  if (todayYmd < DAY_WINDOW_SYNC_START_YMD) {
    throw new HttpsError('failed-precondition', 'Today/Tomorrow sync cannot run before October 12 IST');
  }
  const {db, enrollmentId} = args;
  const actorId = args.actorId || 'admin';
  const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
  const sessionCollection = db.collection('classSessions');
  const sessionsQuery = sessionCollection
    .where('enrollmentId', '==', enrollmentId)
    .where('date', 'in', days)
    .limit(MAX_DAY_SESSIONS + 1);

  return db.runTransaction(async (tx) => {
    const [enrollmentSnap, sessionSnap] = await Promise.all([
      tx.get(enrollmentRef), tx.get(sessionsQuery),
    ]);
    if (!enrollmentSnap.exists) throw new HttpsError('not-found', 'Enrollment not found for day sync');
    if (sessionSnap.size > MAX_DAY_SESSIONS) {
      throw new HttpsError('failed-precondition', 'Too many sessions in two-day enrollment window');
    }
    const enrollment = (enrollmentSnap.data() || {}) as Enrollment;
    if (args.expectedRevision !== undefined &&
      revision(enrollment) !== args.expectedRevision) {
      throw new HttpsError('aborted', 'Timetable changed again during Today/Tomorrow sync; retry');
    }
    const kidId = childIdFromEnrollment(enrollment);
    const childSnap = kidId ? await tx.get(db.collection('kids').doc(kidId)) : null;
    if (isActiveEnrollment(enrollment) && (!kidId || !childSnap?.exists)) {
      throw new HttpsError('failed-precondition',
        'Active enrollment is missing its linked child profile; no sessions modified.');
    }
    const childActive = isActiveChild(
      childSnap?.exists ? (childSnap.data() || {}) as Enrollment : null
    );
    const desired = planTodayTomorrowForEnrollment({
      enrollmentId, enrollment, todayYmd, nowMs: now.getTime(),
      activeChild: childActive,
    });
    const expected = new Map(desired.map((row) => [row.sessionId, row]));
    const existing = sessionSnap.docs;
    const allIds = Array.from(new Set([
      ...existing.map((snap) => snap.id), ...expected.keys(),
    ]));
    // Read financial link records before attempting any session mutation.
    // An externally linked session is immutable even when still scheduled.
    const financeSnaps = await Promise.all(allIds.flatMap((id) => [
      tx.get(db.collection('billingCharges').doc(id)),
      tx.get(db.collection('teacherEarnings').doc(id)),
    ]));
    const linked = new Set<string>();
    allIds.forEach((id, i) => {
      if (financeSnaps[2 * i].exists || financeSnaps[2 * i + 1].exists) linked.add(id);
    });

    // A manual or separate-course class already scheduled for the SAME child
    // and time must not be duplicated by a new recurrence.
    const kidSessions = desired.length && kidId
      ? await tx.get(sessionCollection.where('kidId', '==', kidId)
        .where('date', 'in', days).limit(MAX_DAY_SESSIONS + 1))
      : null;
    if (kidSessions && kidSessions.size > MAX_DAY_SESSIONS) {
      throw new HttpsError('failed-precondition', 'Student has too many sessions in two-day window');
    }
    const collisionSlots = new Set((kidSessions?.docs || [])
      .filter((doc) => PENDING_SESSION_STATES.has(str(doc.data().status).toLowerCase()))
      .map((doc) => `${str(doc.data().date)}|${str(doc.data().startTime)}|${doc.id}`));

    // A future generated class which has gained attendance/finance evidence
    // cannot be moved or silently duplicated at a replacement time. Fail
    // atomically; do not create a second billable occurrence for that date.
    const protectedStale = existing.some((snap) => {
      const row = snap.data() as Enrollment;
      const start = sessionStartMs(row);
      return !expected.has(snap.id) &&
        str(row.source).toLowerCase() === AUTO_SOURCE &&
        !isFutureScheduleExceptionSession(row) &&
        PENDING_SESSION_STATES.has(str(row.status).toLowerCase()) &&
        start !== null && start > now.getTime() &&
        !canMutateAutoSession({
          session: row, enrollmentId, nowMs: now.getTime(),
          externallyFinanceLinked: linked.has(snap.id),
        });
    });
    if (protectedStale) {
      throw new HttpsError('failed-precondition',
        'Timetable changed, but a financially or operationally protected future class cannot be moved. Review the existing class before retrying.');
    }

    const result = empty('synchronized', days);
    const existingIds = new Set(existing.map((doc) => doc.id));
    const writes: Array<() => void> = [];

    for (const snap of existing) {
      const record = snap.data() as Enrollment;
      const target = expected.get(snap.id);
      const mutable = canMutateAutoSession({
        session: record, enrollmentId, nowMs: now.getTime(),
        externallyFinanceLinked: linked.has(snap.id),
      });
      if (!mutable) {
        result.preserved += 1;
        continue;
      }
      if (!target) {
        writes.push(() => tx.delete(snap.ref));
        result.removed += 1;
      } else {
        const payload = buildRollingScheduledSessionPayload({
          enrollmentId, enrollment, occurrence: target,
          scheduleRevision: revision(enrollment), actorId,
        });
        if (needsUpdate(record, payload)) {
          writes.push(() => tx.update(snap.ref, patchExisting(payload, actorId)));
          result.updated += 1;
        } else {
          result.preserved += 1;
        }
      }
    }

    for (const occurrence of desired) {
      if (existingIds.has(occurrence.sessionId)) continue;
      // Same time on another currently-booked session blocks creation. A stale
      // session being removed by this transaction is explicitly excluded.
      const hasCollision = [...collisionSlots].some((entry) => {
        const [date, time, id] = entry.split('|');
        return date === occurrence.date && time === occurrence.startTime &&
          id !== occurrence.sessionId &&
          !existing.some((snap) => snap.id === id &&
            !expected.has(id) &&
            canMutateAutoSession({
              session: snap.data() as Enrollment, enrollmentId,
              nowMs: now.getTime(), externallyFinanceLinked: linked.has(id),
            }));
      });
      if (linked.has(occurrence.sessionId)) {
        throw new HttpsError('failed-precondition',
          'A financial record already references an absent future class. Manual review is required before regeneration.');
      }
      if (hasCollision) {
        result.conflicts += 1;
        continue;
      }
      const payload = buildRollingScheduledSessionPayload({
        enrollmentId, enrollment, occurrence,
        scheduleRevision: revision(enrollment), actorId,
      });
      writes.push(() => tx.create(sessionCollection.doc(occurrence.sessionId), payload));
      result.created += 1;
    }
    // A failure during planning or finance validation cannot partially write.
    for (const write of writes) write();
    return result;
  });
}
