import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {FieldValue, Timestamp} from 'firebase-admin/firestore';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {
  doesEnrollmentOccupyCourseSlot,
  normalizeEnrollmentStatus,
  normalizeSessionStatus,
} from '../helpers/status';
import {
  ROLLING_SCHEDULE_CONTRACT_VERSION,
  ROLLING_SCHEDULE_DELIVERY_MODE,
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  ROLLING_SCHEDULE_TIME_ZONE,
  addDaysYmd,
  buildRollingMaterializationPlan,
  createFirestoreRollingScheduleMaterializerStore,
  materializeRollingEnrollmentWindowInternal,
  normalizeRollingMaterializerSlots,
  rollingSessionId,
  type RollingMaterializationOccurrence,
  type RollingScheduleMaterializationState,
} from './rollingScheduleMaterializer';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const OPERATIONAL_ENROLLMENT_KEYS_COLLECTION = 'operationalEnrollmentKeys';
const MAX_LIFECYCLE_WINDOW_OCCURRENCES = 64;

const TERMINAL_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'archived',
  'inactive',
]);

const PROTECTED_SESSION_STATUSES = new Set([
  'completed',
  'consumed',
  'settled',
  'paid',
  'locked',
  'attended',
  'present',
  'late',
  'absent',
  'no_show',
  'noshow',
  'rescheduled',
  'reschedule',
  'replacement',
  'approved_request',
]);

const SCHEDULE_EXCEPTION_TOKENS = [
  'makeup',
  'manual',
  'one_off',
  'one-off',
  'adhoc',
  'ad_hoc',
  'reschedule',
  'replacement',
  'approved_request',
  'historical',
] as const;

export type RollingLifecycleTarget = 'active' | 'paused' | 'discontinued';

export type SaveRollingEnrollmentScheduleInput = {
  enrollmentId: string;
  enrollmentStartDate: string;
  classesStartDate: string;
  feePerClass: number;
  currency?: string;
  joinUrl?: string | null;
  weeklySlots: Array<{
    weekday: number;
    time: string;
    durationMinutes: number;
  }>;
  idempotencyKey?: string;
};

export type SaveRollingEnrollmentScheduleResult = {
  ok: true;
  enrollmentId: string;
  scheduleRevision: number;
  deliveryMode: 'rolling';
  horizonDays: number;
  orchestrationState: 'activated' | 'saved_paused' | 'replayed';
  idempotentReplay: boolean;
  initialMaterialization: {
    expectedCount: number;
    existingCount: number;
    createdCount: number;
    raceAlreadyExistsCount: number;
    materializedThroughYmd: string;
    nextOccurrenceYmd: string | null;
    nextMaterializationDueYmd: string | null;
  } | null;
  pausedSessionsCancelled: number;
};

export type SetRollingEnrollmentLifecycleResult = {
  ok: true;
  enrollmentId: string;
  previousStatus: string;
  status: RollingLifecycleTarget;
  cancelledSessionsCount: number;
  restoredSessionsCount: number;
  materializedSessionsCreated: number;
  materializedSessionsPreserved: number;
  nextMaterializationDueYmd: string | null;
};

type LifecycleOccurrenceIdentity = Pick<
  RollingMaterializationOccurrence,
  'date' | 'startTime' | 'startAtUtcMs' | 'sessionId'
>;

type CanonicalScheduleDefinition = {
  schemaVersion: number;
  deliveryMode: 'rolling';
  timezone: string;
  revision: number;
  weeklySlots: Array<{weekday: number; time: string; durationMinutes: number}>;
  weekdays: number[];
  timeHHmm: string;
  durationMins: number;
};

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalText(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim();
    return text || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function normalizeIdempotencyKey(value: unknown): string | null {
  const text = optionalText(value);
  if (!text) return null;
  if (text.length > 180) throw new HttpsError('invalid-argument', 'idempotencyKey is too long');
  return text;
}

function validateYmd(value: unknown, fieldName: string): string {
  const text = optionalText(value);
  if (!text) throw new HttpsError('invalid-argument', `${fieldName} is required`);
  try {
    addDaysYmd(text, 0);
  } catch {
    throw new HttpsError('invalid-argument', `${fieldName} must be YYYY-MM-DD`);
  }
  return text;
}

function ymdToIstMidnightTimestamp(ymd: string): Timestamp {
  const [year, month, day] = ymd.split('-').map(Number);
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000;
  return Timestamp.fromMillis(utcMs);
}

export function resolveRollingLifecycleTodayYmd(now = new Date()): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function normalizeRollingLifecycleTarget(value: unknown): RollingLifecycleTarget | null {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'active' || raw === 'resume' || raw === 'resumed') return 'active';
  if (raw === 'paused' || raw === 'pause') return 'paused';
  if (raw === 'discontinued' || raw === 'discontinue') return 'discontinued';
  return null;
}

export function isCanonicalRollingEnrollment(enrollment: Record<string, unknown>): boolean {
  if (!isRecordLike(enrollment.schedule)) return false;
  return (
    Number(enrollment.schedule.schemaVersion) === ROLLING_SCHEDULE_CONTRACT_VERSION &&
    String(enrollment.schedule.deliveryMode || '').trim().toLowerCase() === ROLLING_SCHEDULE_DELIVERY_MODE &&
    String(enrollment.schedule.timezone || '').trim() === ROLLING_SCHEDULE_TIME_ZONE
  );
}

function currentScheduleRevision(enrollment: Record<string, unknown>): number {
  if (!isRecordLike(enrollment.schedule)) return 0;
  const parsed = Number(enrollment.schedule.revision);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 0;
}

function classesStartYmd(enrollment: Record<string, unknown>): string | null {
  return optionalText(enrollment.classesStartDateYmd) || optionalText(enrollment.startDateYmd);
}

function canonicalSlotRows(scheduleLike: unknown): Array<{weekday: number; time: string; durationMinutes: number}> {
  return normalizeRollingMaterializerSlots(scheduleLike).map((slot) => ({
    weekday: slot.weekday,
    time: slot.time,
    durationMinutes: slot.durationMinutes,
  }));
}

function recurrenceFingerprint(args: {
  scheduleLike: unknown;
  classesStartDateYmd: string | null;
}): string {
  let slots: Array<{weekday: number; time: string; durationMinutes: number}> = [];
  try {
    slots = canonicalSlotRows(args.scheduleLike);
  } catch {
    slots = [];
  }
  return JSON.stringify({
    timezone: ROLLING_SCHEDULE_TIME_ZONE,
    classesStartDateYmd: args.classesStartDateYmd || null,
    weeklySlots: slots,
  });
}

export function buildCanonicalRollingScheduleDefinition(args: {
  existingEnrollment: Record<string, unknown>;
  weeklySlots: Array<{weekday: number; time: string; durationMinutes: number}>;
  classesStartDateYmd: string;
}): {schedule: CanonicalScheduleDefinition; recurrenceChanged: boolean} {
  const normalized = canonicalSlotRows({
    timezone: ROLLING_SCHEDULE_TIME_ZONE,
    weeklySlots: args.weeklySlots,
  });
  if (!normalized.length) throw new HttpsError('invalid-argument', 'weeklySlots required');

  const existingFingerprint = recurrenceFingerprint({
    scheduleLike: args.existingEnrollment.schedule,
    classesStartDateYmd: classesStartYmd(args.existingEnrollment),
  });
  const nextFingerprint = JSON.stringify({
    timezone: ROLLING_SCHEDULE_TIME_ZONE,
    classesStartDateYmd: args.classesStartDateYmd,
    weeklySlots: normalized,
  });
  const alreadyRolling = isCanonicalRollingEnrollment(args.existingEnrollment);
  const recurrenceChanged = !alreadyRolling || existingFingerprint !== nextFingerprint;
  const previousRevision = currentScheduleRevision(args.existingEnrollment);
  const revision = recurrenceChanged ? Math.max(previousRevision + 1, 1) : Math.max(previousRevision, 1);
  const first = normalized[0];
  const weekdays = Array.from(new Set(normalized.map((slot) => slot.weekday))).sort((a, b) => a - b);

  return {
    recurrenceChanged,
    schedule: {
      schemaVersion: ROLLING_SCHEDULE_CONTRACT_VERSION,
      deliveryMode: ROLLING_SCHEDULE_DELIVERY_MODE,
      timezone: ROLLING_SCHEDULE_TIME_ZONE,
      revision,
      weeklySlots: normalized,
      // Temporary aliases preserve readers that still understand the legacy shape.
      // They do not control rolling generation and will be retired in Brick 9.
      weekdays,
      timeHHmm: first.time,
      durationMins: first.durationMinutes,
    },
  };
}

function buildOperationalEnrollmentKeyId(kidId: string, courseId: string): string {
  return `${encodeURIComponent(kidId.trim())}__${encodeURIComponent(courseId.trim())}`;
}

function resolveKidId(enrollment: Record<string, unknown>): string | null {
  return (
    optionalText(enrollment.kidId) ||
    (Array.isArray(enrollment.kidIds) ? optionalText(enrollment.kidIds[0]) : null) ||
    optionalText(enrollment.studentId) ||
    optionalText(enrollment.childId)
  );
}

function resolveCourseId(enrollment: Record<string, unknown>): string | null {
  return optionalText(enrollment.courseId);
}

async function findOperationalConflict(args: {
  db: admin.firestore.Firestore;
  enrollmentId: string;
  kidId: string;
  courseId: string;
}): Promise<string | null> {
  const {db, enrollmentId, kidId, courseId} = args;
  const snapshots = await Promise.all([
    db.collection('enrollments').where('kidId', '==', kidId).where('courseId', '==', courseId).get(),
    db.collection('enrollments').where('studentId', '==', kidId).where('courseId', '==', courseId).get(),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId).where('courseId', '==', courseId).get(),
  ]);
  const docs = new Map<string, admin.firestore.QueryDocumentSnapshot>();
  snapshots.forEach((snap) => snap.docs.forEach((docSnap) => docs.set(docSnap.id, docSnap)));
  for (const docSnap of docs.values()) {
    if (docSnap.id === enrollmentId) continue;
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    if (doesEnrollmentOccupyCourseSlot(data)) return docSnap.id;
  }
  return null;
}

export function buildRollingLifecycleOccurrenceIdentities(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
}): LifecycleOccurrenceIdentity[] {
  const slots = normalizeRollingMaterializerSlots(args.enrollment.schedule);
  if (!slots.length) return [];
  const startLowerBound = classesStartYmd(args.enrollment);
  const horizonEndYmd = addDaysYmd(args.todayYmd, ROLLING_SCHEDULE_HORIZON_DAYS);
  const rows: LifecycleOccurrenceIdentity[] = [];

  for (let offset = 0; offset <= ROLLING_SCHEDULE_HORIZON_DAYS; offset += 1) {
    const date = addDaysYmd(args.todayYmd, offset);
    if (startLowerBound && date < startLowerBound) continue;
    if (date > horizonEndYmd) break;
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    for (const slot of slots) {
      if (slot.weekday !== weekday) continue;
      const startAtUtcMs =
        Date.UTC(year, month - 1, day, slot.hour, slot.minute, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000;
      rows.push({
        date,
        startTime: slot.time,
        startAtUtcMs,
        sessionId: rollingSessionId(args.enrollmentId, date, slot.time),
      });
    }
  }

  rows.sort((a, b) => a.startAtUtcMs - b.startAtUtcMs);
  if (rows.length > MAX_LIFECYCLE_WINDOW_OCCURRENCES) {
    throw new HttpsError(
      'failed-precondition',
      `Rolling lifecycle window exceeds safe occurrence cap of ${MAX_LIFECYCLE_WINDOW_OCCURRENCES}`,
    );
  }
  return rows;
}

function hasAttendance(session: Record<string, unknown>): boolean {
  const attendance = session.attendance;
  if (attendance === null || attendance === undefined || attendance === '') return false;
  if (isRecordLike(attendance)) return Object.keys(attendance).length > 0;
  return true;
}

function hasInlineFinanceOrLockMarkers(session: Record<string, unknown>): boolean {
  return Boolean(
    session.billingChargeId ||
    session.teacherEarningId ||
    session.financeLocked ||
    session.financeLock ||
    session.lockedAt ||
    session.paidAt ||
    session.settledAt ||
    session.billingProcessed === true ||
    session.revenueProcessed === true ||
    session.teacherPayProcessed === true,
  );
}

export function isRollingScheduleExceptionSession(session: Record<string, unknown>): boolean {
  if (session.historicalCorrection === true || session.isAdHoc === true || session.isManual === true) return true;
  if (session.manualSessionState != null || session.makeupCreditId != null || session.rescheduleCreditId != null) return true;
  const haystack = [
    session.source,
    session.adHocType,
    session.manualSessionType,
    session.rescheduleSource,
    session.replacementSource,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join('|');
  return SCHEDULE_EXCEPTION_TOKENS.some((token) => haystack.includes(token));
}

export function canCancelRollingLifecycleSession(args: {
  session: Record<string, unknown>;
  occurrenceStartAtUtcMs: number;
  nowMs: number;
  externallyFinanceLinked: boolean;
}): boolean {
  if (args.occurrenceStartAtUtcMs <= args.nowMs) return false;
  const status = normalizeSessionStatus(args.session.status);
  if (status === 'cancelled') return false;
  if (PROTECTED_SESSION_STATUSES.has(status)) return false;
  if (hasAttendance(args.session)) return false;
  if (hasInlineFinanceOrLockMarkers(args.session)) return false;
  if (args.externallyFinanceLinked) return false;
  if (isRollingScheduleExceptionSession(args.session)) return false;
  return true;
}

export function canRestorePausedRollingSession(args: {
  session: Record<string, unknown>;
  occurrenceStartAtUtcMs: number;
  nowMs: number;
  externallyFinanceLinked: boolean;
}): boolean {
  if (args.occurrenceStartAtUtcMs <= args.nowMs) return false;
  if (normalizeSessionStatus(args.session.status) !== 'cancelled') return false;
  if (hasAttendance(args.session)) return false;
  if (hasInlineFinanceOrLockMarkers(args.session)) return false;
  if (args.externallyFinanceLinked) return false;
  if (isRollingScheduleExceptionSession(args.session)) return false;
  const marker = isRecordLike(args.session.rollingLifecycleCancellation)
    ? args.session.rollingLifecycleCancellation
    : {};
  return (
    String(marker.source || '') === 'rolling_schedule_lifecycle' &&
    String(marker.reason || '') === 'enrollment_paused'
  );
}

async function externallyFinanceLinkedSessionIds(
  db: admin.firestore.Firestore,
  sessionIds: string[],
): Promise<Set<string>> {
  if (!sessionIds.length) return new Set();
  if (sessionIds.length > MAX_LIFECYCLE_WINDOW_OCCURRENCES) {
    throw new HttpsError('failed-precondition', 'Lifecycle finance lookup exceeded bounded window');
  }
  const chargeRefs = sessionIds.map((id) => db.collection('billingCharges').doc(id));
  const earningRefs = sessionIds.map((id) => db.collection('teacherEarnings').doc(id));
  const [chargeSnaps, earningSnaps] = await Promise.all([
    db.getAll(...chargeRefs),
    db.getAll(...earningRefs),
  ]);
  const linked = new Set<string>();
  chargeSnaps.forEach((snap) => {
    if (snap.exists) linked.add(snap.id);
  });
  earningSnaps.forEach((snap) => {
    if (snap.exists) linked.add(snap.id);
  });
  return linked;
}

async function cancelRollingLifecycleWindow(args: {
  db: admin.firestore.Firestore;
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
  reason: 'enrollment_paused' | 'enrollment_discontinued';
  actorUid: string;
}): Promise<number> {
  const occurrences = buildRollingLifecycleOccurrenceIdentities({
    enrollmentId: args.enrollmentId,
    enrollment: args.enrollment,
    todayYmd: args.todayYmd,
  });
  if (!occurrences.length) return 0;
  const sessionIds = occurrences.map((row) => row.sessionId);
  const store = createFirestoreRollingScheduleMaterializerStore(args.db);
  const [sessions, financeLinked] = await Promise.all([
    store.getSessionsByIds(sessionIds),
    externallyFinanceLinkedSessionIds(args.db, sessionIds),
  ]);
  const nowMs = Date.now();
  const byId = new Map(occurrences.map((row) => [row.sessionId, row]));
  const toCancel = Array.from(sessions.entries()).filter(([sessionId, session]) => {
    const occurrence = byId.get(sessionId);
    if (!occurrence) return false;
    return canCancelRollingLifecycleSession({
      session,
      occurrenceStartAtUtcMs: occurrence.startAtUtcMs,
      nowMs,
      externallyFinanceLinked: financeLinked.has(sessionId),
    });
  });
  if (!toCancel.length) return 0;

  const batch = args.db.batch();
  toCancel.forEach(([sessionId]) => {
    batch.set(
      args.db.collection('classSessions').doc(sessionId),
      {
        status: 'cancelled',
        cancelledReason: args.reason,
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: args.actorUid,
        rollingLifecycleCancellation: {
          source: 'rolling_schedule_lifecycle',
          reason: args.reason,
          scheduleRevision: currentScheduleRevision(args.enrollment),
          cancelledAt: FieldValue.serverTimestamp(),
          cancelledBy: args.actorUid,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: args.actorUid,
      },
      {merge: true},
    );
  });
  await batch.commit();
  return toCancel.length;
}

async function restorePausedRollingWindow(args: {
  db: admin.firestore.Firestore;
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
  actorUid: string;
}): Promise<number> {
  const occurrences = buildRollingLifecycleOccurrenceIdentities({
    enrollmentId: args.enrollmentId,
    enrollment: args.enrollment,
    todayYmd: args.todayYmd,
  });
  if (!occurrences.length) return 0;
  const sessionIds = occurrences.map((row) => row.sessionId);
  const store = createFirestoreRollingScheduleMaterializerStore(args.db);
  const [sessions, financeLinked] = await Promise.all([
    store.getSessionsByIds(sessionIds),
    externallyFinanceLinkedSessionIds(args.db, sessionIds),
  ]);
  const nowMs = Date.now();
  const byId = new Map(occurrences.map((row) => [row.sessionId, row]));
  const toRestore = Array.from(sessions.entries()).filter(([sessionId, session]) => {
    const occurrence = byId.get(sessionId);
    if (!occurrence) return false;
    return canRestorePausedRollingSession({
      session,
      occurrenceStartAtUtcMs: occurrence.startAtUtcMs,
      nowMs,
      externallyFinanceLinked: financeLinked.has(sessionId),
    });
  });
  if (!toRestore.length) return 0;

  const batch = args.db.batch();
  toRestore.forEach(([sessionId, session]) => {
    const marker = isRecordLike(session.rollingLifecycleCancellation)
      ? session.rollingLifecycleCancellation
      : {};
    batch.set(
      args.db.collection('classSessions').doc(sessionId),
      {
        status: 'scheduled',
        attendance: null,
        cancelledReason: FieldValue.delete(),
        cancelledAt: FieldValue.delete(),
        cancelledBy: FieldValue.delete(),
        rollingLifecycleCancellation: {
          ...marker,
          restoredAt: FieldValue.serverTimestamp(),
          restoredBy: args.actorUid,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: args.actorUid,
      },
      {merge: true},
    );
  });
  await batch.commit();
  return toRestore.length;
}

function plainMaterializationResult(result: Awaited<ReturnType<typeof materializeRollingEnrollmentWindowInternal>>) {
  return {
    expectedCount: result.expectedCount,
    existingCount: result.existingCount,
    createdCount: result.createdCount,
    raceAlreadyExistsCount: result.raceAlreadyExistsCount,
    materializedThroughYmd: result.materialization.materializedThroughYmd,
    nextOccurrenceYmd: result.materialization.nextOccurrenceYmd,
    nextMaterializationDueYmd: result.materialization.nextMaterializationDueYmd,
  };
}

export const saveRollingEnrollmentSchedule = onCall(
  {region: REGION, memory: '256MiB', timeoutSeconds: 120},
  async (request): Promise<SaveRollingEnrollmentScheduleResult> => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as Partial<SaveRollingEnrollmentScheduleInput>;
    const enrollmentId = optionalText(input.enrollmentId);
    if (!enrollmentId) throw new HttpsError('invalid-argument', 'enrollmentId required');
    const enrollmentStartDateYmd = validateYmd(input.enrollmentStartDate, 'enrollmentStartDate');
    const classesStartDateYmd = validateYmd(input.classesStartDate, 'classesStartDate');
    const feePerClass = Number(input.feePerClass);
    if (!Number.isFinite(feePerClass) || feePerClass <= 0) {
      throw new HttpsError('invalid-argument', 'feePerClass must be > 0');
    }
    if (!Array.isArray(input.weeklySlots) || !input.weeklySlots.length) {
      throw new HttpsError('invalid-argument', 'weeklySlots required');
    }
    const currency = optionalText(input.currency) || 'INR';
    const joinUrl = optionalText(input.joinUrl);
    const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
    const actorUid = request.auth?.uid || 'admin';
    const db = admin.firestore();
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);

    let scheduleRevision = 0;
    let replayResult: SaveRollingEnrollmentScheduleResult | null = null;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(enrollmentRef);
      if (!snap.exists) throw new HttpsError('not-found', `Enrollment ${enrollmentId} not found`);
      const enrollment = (snap.data() || {}) as Record<string, unknown>;
      const normalizedStatus = normalizeEnrollmentStatus(enrollment.status);
      if (TERMINAL_STATUSES.has(normalizedStatus)) {
        throw new HttpsError('failed-precondition', 'Cannot activate a rolling schedule on a terminal enrollment');
      }

      const activation = isRecordLike(enrollment.rollingScheduleActivation)
        ? enrollment.rollingScheduleActivation
        : {};
      if (
        idempotencyKey &&
        optionalText(activation.lastRequestKey) === idempotencyKey &&
        String(activation.state || '') === 'success' &&
        isRecordLike(activation.lastResult)
      ) {
        replayResult = activation.lastResult as unknown as SaveRollingEnrollmentScheduleResult;
        return;
      }

      const {schedule, recurrenceChanged} = buildCanonicalRollingScheduleDefinition({
        existingEnrollment: enrollment,
        weeklySlots: input.weeklySlots as SaveRollingEnrollmentScheduleInput['weeklySlots'],
        classesStartDateYmd,
      });
      scheduleRevision = schedule.revision;

      // Brick 5 activates rolling delivery and allows idempotent re-saves of the
      // same recurrence. Changing an already-rolling recurrence requires Brick 6's
      // bounded schedule-edit reconciliation so stale future sessions cannot leak.
      if (isCanonicalRollingEnrollment(enrollment) && recurrenceChanged) {
        throw new HttpsError(
          'failed-precondition',
          'Recurring timetable changes require rolling schedule reconciliation',
        );
      }

      tx.update(enrollmentRef, {
        startDate: ymdToIstMidnightTimestamp(enrollmentStartDateYmd),
        startDateYmd: enrollmentStartDateYmd,
        classesStartDate: ymdToIstMidnightTimestamp(classesStartDateYmd),
        classesStartDateYmd,
        feePerClass,
        ratePerSession: feePerClass,
        currency,
        joinUrl,
        'schedule.schemaVersion': schedule.schemaVersion,
        'schedule.deliveryMode': schedule.deliveryMode,
        'schedule.timezone': schedule.timezone,
        'schedule.revision': schedule.revision,
        'schedule.weeklySlots': schedule.weeklySlots,
        'schedule.weekdays': schedule.weekdays,
        'schedule.timeHHmm': schedule.timeHHmm,
        'schedule.durationMins': schedule.durationMins,
        'schedule.weeksAhead': FieldValue.delete(),
        'schedule.plannedSessions': FieldValue.delete(),
        'schedule.endDateYmd': FieldValue.delete(),
        'scheduleMaterialization.schemaVersion': ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
        'scheduleMaterialization.horizonDays': ROLLING_SCHEDULE_HORIZON_DAYS,
        'scheduleMaterialization.scheduleRevision': schedule.revision,
        'scheduleMaterialization.nextOccurrenceYmd': null,
        'scheduleMaterialization.nextMaterializationDueYmd': null,
        'scheduleMaterialization.lifecycleState': normalizedStatus,
        'rollingScheduleActivation.state': 'in_progress',
        'rollingScheduleActivation.lastRequestKey': idempotencyKey,
        'rollingScheduleActivation.startedAt': FieldValue.serverTimestamp(),
        'rollingScheduleActivation.startedBy': actorUid,
        'rollingScheduleActivation.error': FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
    });

    const replay = replayResult as SaveRollingEnrollmentScheduleResult | null;
    if (replay) {
      return {
        ...replay,
        idempotentReplay: true,
        orchestrationState: 'replayed',
      };
    }

    try {
      const freshSnap = await enrollmentRef.get();
      if (!freshSnap.exists) throw new HttpsError('not-found', `Enrollment ${enrollmentId} not found`);
      const freshEnrollment = (freshSnap.data() || {}) as Record<string, unknown>;
      const status = normalizeEnrollmentStatus(freshEnrollment.status);
      const todayYmd = resolveRollingLifecycleTodayYmd();
      let materialization: SaveRollingEnrollmentScheduleResult['initialMaterialization'] = null;
      let pausedSessionsCancelled = 0;
      let orchestrationState: SaveRollingEnrollmentScheduleResult['orchestrationState'];

      if (status === 'paused') {
        pausedSessionsCancelled = await cancelRollingLifecycleWindow({
          db,
          enrollmentId,
          enrollment: freshEnrollment,
          todayYmd,
          reason: 'enrollment_paused',
          actorUid,
        });
        orchestrationState = 'saved_paused';
      } else {
        const result = await materializeRollingEnrollmentWindowInternal(db, {
          enrollmentId,
          anchorYmd: todayYmd,
          actorId: actorUid,
        });
        materialization = plainMaterializationResult(result);
        orchestrationState = 'activated';
      }

      const response: SaveRollingEnrollmentScheduleResult = {
        ok: true,
        enrollmentId,
        scheduleRevision: scheduleRevision || currentScheduleRevision(freshEnrollment),
        deliveryMode: ROLLING_SCHEDULE_DELIVERY_MODE,
        horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
        orchestrationState,
        idempotentReplay: false,
        initialMaterialization: materialization,
        pausedSessionsCancelled,
      };
      await enrollmentRef.update({
        'rollingScheduleActivation.state': 'success',
        'rollingScheduleActivation.completedAt': FieldValue.serverTimestamp(),
        'rollingScheduleActivation.completedBy': actorUid,
        'rollingScheduleActivation.lastResult': response,
        'rollingScheduleActivation.error': FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await enrollmentRef.update({
        'rollingScheduleActivation.state': 'failed',
        'rollingScheduleActivation.failedAt': FieldValue.serverTimestamp(),
        'rollingScheduleActivation.failedBy': actorUid,
        'rollingScheduleActivation.error': message,
        'scheduleMaterialization.nextOccurrenceYmd': null,
        'scheduleMaterialization.nextMaterializationDueYmd': null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
      logger.error('saveRollingEnrollmentSchedule failed closed', {enrollmentId, message});
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Failed to activate rolling schedule: ${message}`);
    }
  },
);

export const setRollingEnrollmentLifecycle = onCall(
  {region: REGION, memory: '256MiB', timeoutSeconds: 120},
  async (request): Promise<SetRollingEnrollmentLifecycleResult> => {
    await ensureAdmin(request.auth);
    const enrollmentId = optionalText(request.data?.enrollmentId);
    const target = normalizeRollingLifecycleTarget(request.data?.status ?? request.data?.action);
    const reason = optionalText(request.data?.reason);
    if (!enrollmentId || !target) {
      throw new HttpsError(
        'invalid-argument',
        'enrollmentId and lifecycle target (active, paused, discontinued) are required',
      );
    }

    const actorUid = request.auth?.uid || 'admin';
    const db = admin.firestore();
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const snap = await enrollmentRef.get();
    if (!snap.exists) throw new HttpsError('not-found', `Enrollment ${enrollmentId} not found`);
    const enrollment = (snap.data() || {}) as Record<string, unknown>;
    if (!isCanonicalRollingEnrollment(enrollment)) {
      throw new HttpsError('failed-precondition', 'Enrollment is not activated for rolling scheduling');
    }

    const previousStatus = normalizeEnrollmentStatus(enrollment.status);
    if (target === 'active' && TERMINAL_STATUSES.has(previousStatus)) {
      throw new HttpsError('failed-precondition', 'A discontinued or terminal enrollment cannot be resumed');
    }
    if (target === 'paused' && TERMINAL_STATUSES.has(previousStatus)) {
      throw new HttpsError('failed-precondition', 'A terminal enrollment cannot be paused');
    }

    const todayYmd = resolveRollingLifecycleTodayYmd();
    const prospectiveActiveEnrollment: Record<string, unknown> = {
      ...enrollment,
      status: 'active',
      archived: false,
      isArchived: false,
      archivedAt: null,
    };

    // Resume must be proven materializable before status changes. Pause and
    // discontinue intentionally do not depend on teacher/fee health; stopping
    // delivery must remain possible even when enrollment data needs repair.
    let resumePlan: ReturnType<typeof buildRollingMaterializationPlan> | null = null;
    if (target === 'active') {
      resumePlan = buildRollingMaterializationPlan({
        enrollmentId,
        enrollment: prospectiveActiveEnrollment,
        anchorYmd: todayYmd,
      });
    }

    const kidId = resolveKidId(enrollment);
    const courseId = resolveCourseId(enrollment);
    const shouldHoldCourseSlot = target !== 'discontinued';
    if (shouldHoldCourseSlot && (!kidId || !courseId)) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot activate or pause an enrollment without canonical child and course identity',
      );
    }
    if (target === 'active' && kidId && courseId) {
      const conflict = await findOperationalConflict({db, enrollmentId, kidId, courseId});
      if (conflict) {
        throw new HttpsError(
          'already-exists',
          `Another operational enrollment already exists for this child and course: ${conflict}`,
        );
      }
    }

    const keyRef = kidId && courseId
      ? db.collection(OPERATIONAL_ENROLLMENT_KEYS_COLLECTION).doc(buildOperationalEnrollmentKeyId(kidId, courseId))
      : null;
    const auditRef = db.collection('auditLogs').doc();
    await db.runTransaction(async (tx) => {
      const keySnap = keyRef ? await tx.get(keyRef) : null;
      if (shouldHoldCourseSlot && keySnap?.exists && keySnap.data()?.enrollmentId !== enrollmentId) {
        throw new HttpsError('already-exists', 'Another enrollment already reserves this child and course');
      }

      const patch: Record<string, unknown> = {
        status: target,
        'scheduleMaterialization.nextOccurrenceYmd': null,
        'scheduleMaterialization.nextMaterializationDueYmd': null,
        'scheduleMaterialization.lifecycleState': target,
        'scheduleMaterialization.lifecycleChangedAt': FieldValue.serverTimestamp(),
        'scheduleMaterialization.lifecycleChangedBy': actorUid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      };
      if (target === 'active') {
        patch.archived = false;
        patch.isArchived = false;
        patch.archivedAt = FieldValue.delete();
        patch.endedAt = FieldValue.delete();
      } else if (target === 'discontinued') {
        patch.endedAt = FieldValue.serverTimestamp();
        if (reason) patch.endReason = reason;
      }
      tx.update(enrollmentRef, patch);

      if (keyRef && shouldHoldCourseSlot) {
        tx.set(
          keyRef,
          {
            enrollmentId,
            kidId,
            courseId,
            heldAt: FieldValue.serverTimestamp(),
            heldBy: actorUid,
          },
          {merge: true},
        );
      } else if (keyRef && keySnap?.exists && keySnap.data()?.enrollmentId === enrollmentId) {
        tx.delete(keyRef);
      }

      tx.create(auditRef, {
        type: 'rolling_enrollment_lifecycle_changed',
        action: target,
        enrollmentId,
        kidId: kidId || null,
        courseId: courseId || null,
        previousStatus,
        status: target,
        reason: reason || null,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: actorUid,
      });
    });

    let cancelledSessionsCount = 0;
    let restoredSessionsCount = 0;
    let materializedSessionsCreated = 0;
    let materializedSessionsPreserved = 0;
    let nextMaterializationDueYmd: string | null = null;

    if (target === 'paused' || target === 'discontinued') {
      cancelledSessionsCount = await cancelRollingLifecycleWindow({
        db,
        enrollmentId,
        enrollment,
        todayYmd,
        reason: target === 'paused' ? 'enrollment_paused' : 'enrollment_discontinued',
        actorUid,
      });
    } else {
      const resumedEnrollment = {...prospectiveActiveEnrollment, status: 'active'};
      restoredSessionsCount = await restorePausedRollingWindow({
        db,
        enrollmentId,
        enrollment: resumedEnrollment,
        todayYmd,
        actorUid,
      });
      const materialized = await materializeRollingEnrollmentWindowInternal(db, {
        enrollmentId,
        anchorYmd: todayYmd,
        actorId: actorUid,
      });
      materializedSessionsCreated = materialized.createdCount;
      materializedSessionsPreserved = materialized.existingCount + materialized.raceAlreadyExistsCount;
      nextMaterializationDueYmd = materialized.materialization.nextMaterializationDueYmd;
      // Referencing the preflight plan makes the ordering guarantee explicit and
      // prevents a future refactor from moving materialization validation after
      // the lifecycle status write.
      if (!resumePlan || resumePlan.scheduleRevision !== materialized.scheduleRevision) {
        throw new HttpsError('internal', 'Rolling resume schedule revision changed during activation');
      }
    }

    logger.info('setRollingEnrollmentLifecycle completed', {
      enrollmentId,
      previousStatus,
      status: target,
      cancelledSessionsCount,
      restoredSessionsCount,
      materializedSessionsCreated,
      materializedSessionsPreserved,
      nextMaterializationDueYmd,
    });

    return {
      ok: true,
      enrollmentId,
      previousStatus,
      status: target,
      cancelledSessionsCount,
      restoredSessionsCount,
      materializedSessionsCreated,
      materializedSessionsPreserved,
      nextMaterializationDueYmd,
    };
  },
);

export function buildSuspendedRollingMaterializationState(args: {
  materialization: RollingScheduleMaterializationState;
}): RollingScheduleMaterializationState {
  return {
    ...args.materialization,
    nextOccurrenceYmd: null,
    nextMaterializationDueYmd: null,
  };
}
