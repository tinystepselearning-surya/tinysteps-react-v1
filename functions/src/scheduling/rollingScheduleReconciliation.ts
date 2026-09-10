import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {FieldValue, Timestamp} from 'firebase-admin/firestore';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {normalizeEnrollmentStatus, normalizeSessionStatus} from '../helpers/status';
import {
  ROLLING_SCHEDULE_DELIVERY_MODE,
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  ROLLING_SCHEDULE_SESSION_SOURCE,
  ROLLING_SCHEDULE_TIME_ZONE,
  buildRollingMaterializationPlan,
  materializeRollingEnrollmentWindowInternal,
  type RollingMaterializationOccurrence,
} from './rollingScheduleMaterializer';
import {
  buildCanonicalRollingScheduleDefinition,
  canCancelRollingLifecycleSession,
  isCanonicalRollingEnrollment,
  isRollingScheduleExceptionSession,
  resolveRollingLifecycleTodayYmd,
  type SaveRollingEnrollmentScheduleInput,
} from './rollingScheduleLifecycle';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_RECONCILIATION_OCCURRENCES = 128;

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

export type ReconcileRollingEnrollmentScheduleInput = SaveRollingEnrollmentScheduleInput;

export type RollingScheduleEditPlan = {
  fromRevision: number;
  toRevision: number;
  anchorYmd: string;
  horizonEndYmd: string;
  previousOccurrenceIds: string[];
  nextOccurrenceIds: string[];
  staleOccurrenceIds: string[];
  retainedOccurrenceIds: string[];
  addedOccurrenceIds: string[];
  nextOccurrencesById: Map<string, RollingMaterializationOccurrence>;
};

export type ReconcileRollingEnrollmentScheduleResult = {
  ok: true;
  enrollmentId: string;
  scheduleChanged: boolean;
  scheduleRevision: number;
  horizonDays: number;
  status: string;
  orchestrationState: 'reconciled' | 'saved_paused' | 'unchanged';
  staleCandidates: number;
  cancelledStaleSessions: number;
  protectedStaleSessions: number;
  retainedCandidates: number;
  patchedRetainedSessions: number;
  protectedRetainedSessions: number;
  restoredPreviouslyReconciledSessions: number;
  addedCandidates: number;
  materializedSessionsCreated: number;
  materializedSessionsPreserved: number;
  nextMaterializationDueYmd: string | null;
};

type ReconciliationCounts = {
  cancelledStaleSessions: number;
  protectedStaleSessions: number;
  patchedRetainedSessions: number;
  protectedRetainedSessions: number;
  restoredPreviouslyReconciledSessions: number;
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

function validateYmd(value: unknown, fieldName: string): string {
  const text = optionalText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new HttpsError('invalid-argument', `${fieldName} must be YYYY-MM-DD`);
  }
  const [year, month, day] = text.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new HttpsError('invalid-argument', `${fieldName} is not a valid calendar date`);
  }
  return text;
}

function ymdToIstMidnightTimestamp(ymd: string): Timestamp {
  const [year, month, day] = ymd.split('-').map(Number);
  return Timestamp.fromMillis(Date.UTC(year, month - 1, day) - 330 * 60 * 1000);
}

function scheduleRevision(enrollment: Record<string, unknown>): number {
  const schedule = isRecordLike(enrollment.schedule) ? enrollment.schedule : {};
  const parsed = Number(schedule.revision);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 0;
}

function classesStartYmd(enrollment: Record<string, unknown>): string | null {
  return optionalText(enrollment.classesStartDateYmd) || optionalText(enrollment.startDateYmd);
}

function scheduleFingerprint(args: {
  schedule: Record<string, unknown>;
  classesStartDateYmd: string;
}): string {
  const weeklySlots = Array.isArray(args.schedule.weeklySlots)
    ? args.schedule.weeklySlots.map((raw) => {
        const slot = isRecordLike(raw) ? raw : {};
        return {
          weekday: Number(slot.weekday),
          time: String(slot.time || ''),
          durationMinutes: Number(slot.durationMinutes ?? slot.durationMins),
        };
      })
    : [];
  return JSON.stringify({
    timezone: String(args.schedule.timezone || ROLLING_SCHEDULE_TIME_ZONE),
    classesStartDateYmd: args.classesStartDateYmd,
    weeklySlots,
  });
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

export function canPatchRollingScheduleSession(args: {
  session: Record<string, unknown>;
  enrollmentId: string;
  occurrenceStartAtUtcMs: number;
  nowMs: number;
  externallyFinanceLinked: boolean;
}): boolean {
  if (args.occurrenceStartAtUtcMs <= args.nowMs) return false;
  if (optionalText(args.session.enrollmentId) !== args.enrollmentId) return false;
  const status = normalizeSessionStatus(args.session.status);
  if (status !== 'scheduled') return false;
  if (PROTECTED_SESSION_STATUSES.has(status)) return false;
  if (hasAttendance(args.session)) return false;
  if (hasInlineFinanceOrLockMarkers(args.session)) return false;
  if (args.externallyFinanceLinked) return false;
  if (isRollingScheduleExceptionSession(args.session)) return false;
  return true;
}

export function canRestoreReconciledRollingSession(args: {
  session: Record<string, unknown>;
  enrollmentId: string;
  occurrenceStartAtUtcMs: number;
  nowMs: number;
  externallyFinanceLinked: boolean;
}): boolean {
  if (args.occurrenceStartAtUtcMs <= args.nowMs) return false;
  if (optionalText(args.session.enrollmentId) !== args.enrollmentId) return false;
  if (normalizeSessionStatus(args.session.status) !== 'cancelled') return false;
  if (hasAttendance(args.session)) return false;
  if (hasInlineFinanceOrLockMarkers(args.session)) return false;
  if (args.externallyFinanceLinked) return false;
  if (isRollingScheduleExceptionSession(args.session)) return false;
  const marker = isRecordLike(args.session.rollingScheduleReconciliationCancellation)
    ? args.session.rollingScheduleReconciliationCancellation
    : {};
  return String(marker.source || '') === 'rolling_schedule_reconciliation';
}

function activePlanningEnrollment(enrollment: Record<string, unknown>): Record<string, unknown> {
  return {
    ...enrollment,
    status: 'active',
    archived: false,
    isArchived: false,
    archivedAt: null,
  };
}

export function buildRollingScheduleEditPlan(args: {
  enrollmentId: string;
  previousEnrollment: Record<string, unknown>;
  nextEnrollment: Record<string, unknown>;
  anchorYmd: string;
}): RollingScheduleEditPlan {
  const previousPlan = buildRollingMaterializationPlan({
    enrollmentId: args.enrollmentId,
    enrollment: activePlanningEnrollment(args.previousEnrollment),
    anchorYmd: args.anchorYmd,
  });
  const nextPlan = buildRollingMaterializationPlan({
    enrollmentId: args.enrollmentId,
    enrollment: activePlanningEnrollment(args.nextEnrollment),
    anchorYmd: args.anchorYmd,
  });
  const previousIds = previousPlan.occurrences.map((row) => row.sessionId);
  const nextIds = nextPlan.occurrences.map((row) => row.sessionId);
  const previousSet = new Set(previousIds);
  const nextSet = new Set(nextIds);
  const unionSize = new Set([...previousIds, ...nextIds]).size;
  if (unionSize > MAX_RECONCILIATION_OCCURRENCES) {
    throw new HttpsError(
      'failed-precondition',
      `Rolling schedule edit exceeds bounded occurrence cap of ${MAX_RECONCILIATION_OCCURRENCES}`,
    );
  }
  return {
    fromRevision: scheduleRevision(args.previousEnrollment),
    toRevision: scheduleRevision(args.nextEnrollment),
    anchorYmd: args.anchorYmd,
    horizonEndYmd: nextPlan.horizonEndYmd,
    previousOccurrenceIds: previousIds,
    nextOccurrenceIds: nextIds,
    staleOccurrenceIds: previousIds.filter((id) => !nextSet.has(id)),
    retainedOccurrenceIds: nextIds.filter((id) => previousSet.has(id)),
    addedOccurrenceIds: nextIds.filter((id) => !previousSet.has(id)),
    nextOccurrencesById: new Map(nextPlan.occurrences.map((row) => [row.sessionId, row])),
  };
}

function buildMutableSchedulePatch(args: {
  occurrence: RollingMaterializationOccurrence;
  scheduleRevision: number;
  joinUrl: string | null;
  actorUid: string;
}): Record<string, unknown> {
  return {
    startAt: Timestamp.fromMillis(args.occurrence.startAtUtcMs),
    endAt: Timestamp.fromMillis(args.occurrence.endAtUtcMs),
    date: args.occurrence.date,
    startTime: args.occurrence.startTime,
    endTime: args.occurrence.endTime,
    durationMins: args.occurrence.durationMinutes,
    durationMinutes: args.occurrence.durationMinutes,
    source: ROLLING_SCHEDULE_SESSION_SOURCE,
    scheduleDeliveryMode: ROLLING_SCHEDULE_DELIVERY_MODE,
    scheduleRevision: args.scheduleRevision,
    scheduleOccurrenceKey: args.occurrence.occurrenceKey,
    scheduleMaterializationVersion: ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
    joinUrl: args.joinUrl || FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: args.actorUid,
  };
}

function buildPreviousEnrollmentFromMarker(
  enrollment: Record<string, unknown>,
  marker: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!isRecordLike(marker.previousSchedule)) return null;
  return {
    ...enrollment,
    schedule: marker.previousSchedule,
    classesStartDateYmd:
      optionalText(marker.previousClassesStartDateYmd) || classesStartYmd(enrollment) || undefined,
  };
}

function isRetryableReconciliation(
  enrollment: Record<string, unknown>,
  targetFingerprint: string,
): {marker: Record<string, unknown>; previousEnrollment: Record<string, unknown>} | null {
  const marker = isRecordLike(enrollment.rollingScheduleReconciliation)
    ? enrollment.rollingScheduleReconciliation
    : {};
  const state = String(marker.state || '').trim().toLowerCase();
  if (state !== 'failed' && state !== 'in_progress') return null;
  if (String(marker.targetFingerprint || '') !== targetFingerprint) return null;
  if (Number(marker.targetScheduleRevision) !== scheduleRevision(enrollment)) return null;
  const previousEnrollment = buildPreviousEnrollmentFromMarker(enrollment, marker);
  return previousEnrollment ? {marker, previousEnrollment} : null;
}

async function reconcileSessionsAndPersistSchedule(args: {
  db: admin.firestore.Firestore;
  enrollmentId: string;
  initialEnrollment: Record<string, unknown>;
  previousEnrollment: Record<string, unknown>;
  nextEnrollment: Record<string, unknown>;
  editPlan: RollingScheduleEditPlan;
  targetFingerprint: string;
  actorUid: string;
  enrollmentStartDateYmd: string;
  classesStartDateYmd: string;
  feePerClass: number;
  currency: string;
  joinUrl: string | null;
  isRetry: boolean;
}): Promise<ReconciliationCounts> {
  const enrollmentRef = args.db.collection('enrollments').doc(args.enrollmentId);
  const allSessionIds = Array.from(
    new Set([...args.editPlan.previousOccurrenceIds, ...args.editPlan.nextOccurrenceIds]),
  );
  const sessionRefs = allSessionIds.map((id) => args.db.collection('classSessions').doc(id));
  const chargeRefs = allSessionIds.map((id) => args.db.collection('billingCharges').doc(id));
  const earningRefs = allSessionIds.map((id) => args.db.collection('teacherEarnings').doc(id));
  const expectedCurrentRevision = scheduleRevision(args.initialEnrollment);
  const expectedCurrentFingerprint = scheduleFingerprint({
    schedule: args.initialEnrollment.schedule as Record<string, unknown>,
    classesStartDateYmd: classesStartYmd(args.initialEnrollment) || args.classesStartDateYmd,
  });
  const staleSet = new Set(args.editPlan.staleOccurrenceIds);
  const retainedSet = new Set(args.editPlan.retainedOccurrenceIds);
  const nextSet = new Set(args.editPlan.nextOccurrenceIds);
  const nowMs = Date.now();

  return args.db.runTransaction(async (tx) => {
    const enrollmentSnap = await tx.get(enrollmentRef);
    if (!enrollmentSnap.exists) throw new HttpsError('not-found', `Enrollment ${args.enrollmentId} not found`);
    const liveEnrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;
    const liveFingerprint = scheduleFingerprint({
      schedule: (isRecordLike(liveEnrollment.schedule) ? liveEnrollment.schedule : {}) as Record<string, unknown>,
      classesStartDateYmd: classesStartYmd(liveEnrollment) || args.classesStartDateYmd,
    });
    if (scheduleRevision(liveEnrollment) !== expectedCurrentRevision || liveFingerprint !== expectedCurrentFingerprint) {
      throw new HttpsError('aborted', 'Enrollment schedule changed while reconciliation was being prepared');
    }

    // All class/finance reads stay bounded to the union of old and new 14-day
    // deterministic occurrence IDs. There is deliberately no classSessions query.
    const [sessionSnaps, chargeSnaps, earningSnaps] = await Promise.all([
      Promise.all(sessionRefs.map((ref) => tx.get(ref))),
      Promise.all(chargeRefs.map((ref) => tx.get(ref))),
      Promise.all(earningRefs.map((ref) => tx.get(ref))),
    ]);
    const financeLinked = new Set<string>();
    chargeSnaps.forEach((snap) => {
      if (snap.exists) financeLinked.add(snap.id);
    });
    earningSnaps.forEach((snap) => {
      if (snap.exists) financeLinked.add(snap.id);
    });
    const sessions = new Map<string, Record<string, unknown>>();
    sessionSnaps.forEach((snap) => {
      if (snap.exists) sessions.set(snap.id, (snap.data() || {}) as Record<string, unknown>);
    });

    const counts: ReconciliationCounts = {
      cancelledStaleSessions: 0,
      protectedStaleSessions: 0,
      patchedRetainedSessions: 0,
      protectedRetainedSessions: 0,
      restoredPreviouslyReconciledSessions: 0,
    };

    for (const sessionId of allSessionIds) {
      const session = sessions.get(sessionId);
      if (!session) continue;
      const nextOccurrence = args.editPlan.nextOccurrencesById.get(sessionId);

      if (staleSet.has(sessionId)) {
        const previousOccurrence = buildRollingMaterializationPlan({
          enrollmentId: args.enrollmentId,
          enrollment: activePlanningEnrollment(args.previousEnrollment),
          anchorYmd: args.editPlan.anchorYmd,
        }).occurrences.find((row) => row.sessionId === sessionId);
        if (
          previousOccurrence &&
          canCancelRollingLifecycleSession({
            session,
            occurrenceStartAtUtcMs: previousOccurrence.startAtUtcMs,
            nowMs,
            externallyFinanceLinked: financeLinked.has(sessionId),
          })
        ) {
          tx.set(
            args.db.collection('classSessions').doc(sessionId),
            {
              status: 'cancelled',
              cancelledReason: 'rolling_schedule_reconciled',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelledBy: args.actorUid,
              rollingScheduleReconciliationCancellation: {
                source: 'rolling_schedule_reconciliation',
                fromScheduleRevision: args.editPlan.fromRevision,
                toScheduleRevision: args.editPlan.toRevision,
                cancelledAt: FieldValue.serverTimestamp(),
                cancelledBy: args.actorUid,
              },
              updatedAt: FieldValue.serverTimestamp(),
              updatedBy: args.actorUid,
            },
            {merge: true},
          );
          counts.cancelledStaleSessions += 1;
        } else {
          counts.protectedStaleSessions += 1;
        }
        continue;
      }

      if (!nextSet.has(sessionId) || !nextOccurrence) continue;
      const canPatch = canPatchRollingScheduleSession({
        session,
        enrollmentId: args.enrollmentId,
        occurrenceStartAtUtcMs: nextOccurrence.startAtUtcMs,
        nowMs,
        externallyFinanceLinked: financeLinked.has(sessionId),
      });
      const canRestore = canRestoreReconciledRollingSession({
        session,
        enrollmentId: args.enrollmentId,
        occurrenceStartAtUtcMs: nextOccurrence.startAtUtcMs,
        nowMs,
        externallyFinanceLinked: financeLinked.has(sessionId),
      });

      if (canPatch || canRestore) {
        tx.set(
          args.db.collection('classSessions').doc(sessionId),
          {
            ...buildMutableSchedulePatch({
              occurrence: nextOccurrence,
              scheduleRevision: args.editPlan.toRevision,
              joinUrl: args.joinUrl,
              actorUid: args.actorUid,
            }),
            ...(canRestore
              ? {
                  status: 'scheduled',
                  attendance: null,
                  cancelledReason: FieldValue.delete(),
                  cancelledAt: FieldValue.delete(),
                  cancelledBy: FieldValue.delete(),
                  rollingScheduleReconciliationCancellation: FieldValue.delete(),
                }
              : {}),
          },
          {merge: true},
        );
        if (canRestore) counts.restoredPreviouslyReconciledSessions += 1;
        else if (retainedSet.has(sessionId)) counts.patchedRetainedSessions += 1;
        continue;
      }

      if (retainedSet.has(sessionId)) counts.protectedRetainedSessions += 1;
    }

    const nextSchedule = args.nextEnrollment.schedule as Record<string, unknown>;
    const previousSchedule = args.previousEnrollment.schedule as Record<string, unknown>;
    tx.update(enrollmentRef, {
      startDate: ymdToIstMidnightTimestamp(args.enrollmentStartDateYmd),
      startDateYmd: args.enrollmentStartDateYmd,
      classesStartDate: ymdToIstMidnightTimestamp(args.classesStartDateYmd),
      classesStartDateYmd: args.classesStartDateYmd,
      feePerClass: args.feePerClass,
      ratePerSession: args.feePerClass,
      currency: args.currency,
      joinUrl: args.joinUrl,
      'schedule.schemaVersion': nextSchedule.schemaVersion,
      'schedule.deliveryMode': nextSchedule.deliveryMode,
      'schedule.timezone': nextSchedule.timezone,
      'schedule.revision': nextSchedule.revision,
      'schedule.weeklySlots': nextSchedule.weeklySlots,
      'schedule.weekdays': nextSchedule.weekdays,
      'schedule.timeHHmm': nextSchedule.timeHHmm,
      'schedule.durationMins': nextSchedule.durationMins,
      'schedule.weeksAhead': FieldValue.delete(),
      'schedule.plannedSessions': FieldValue.delete(),
      'schedule.endDateYmd': FieldValue.delete(),
      'scheduleMaterialization.schemaVersion': ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
      'scheduleMaterialization.horizonDays': ROLLING_SCHEDULE_HORIZON_DAYS,
      'scheduleMaterialization.scheduleRevision': args.editPlan.toRevision,
      'scheduleMaterialization.nextOccurrenceYmd': null,
      'scheduleMaterialization.nextMaterializationDueYmd': null,
      'rollingScheduleReconciliation.state': 'in_progress',
      'rollingScheduleReconciliation.targetFingerprint': args.targetFingerprint,
      'rollingScheduleReconciliation.targetScheduleRevision': args.editPlan.toRevision,
      'rollingScheduleReconciliation.previousSchedule': args.isRetry
        ? (isRecordLike(args.initialEnrollment.rollingScheduleReconciliation)
            ? args.initialEnrollment.rollingScheduleReconciliation.previousSchedule
            : previousSchedule)
        : previousSchedule,
      'rollingScheduleReconciliation.previousClassesStartDateYmd': args.isRetry
        ? (isRecordLike(args.initialEnrollment.rollingScheduleReconciliation)
            ? args.initialEnrollment.rollingScheduleReconciliation.previousClassesStartDateYmd
            : classesStartYmd(args.previousEnrollment))
        : classesStartYmd(args.previousEnrollment),
      'rollingScheduleReconciliation.startedAt': FieldValue.serverTimestamp(),
      'rollingScheduleReconciliation.startedBy': args.actorUid,
      'rollingScheduleReconciliation.error': FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: args.actorUid,
    });

    return counts;
  });
}

export const reconcileRollingEnrollmentSchedule = onCall(
  {region: REGION, memory: '256MiB', timeoutSeconds: 120},
  async (request): Promise<ReconcileRollingEnrollmentScheduleResult> => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as Partial<ReconcileRollingEnrollmentScheduleInput>;
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
    const actorUid = request.auth?.uid || 'admin';
    const db = admin.firestore();
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const snap = await enrollmentRef.get();
    if (!snap.exists) throw new HttpsError('not-found', `Enrollment ${enrollmentId} not found`);
    const enrollment = (snap.data() || {}) as Record<string, unknown>;
    if (!isCanonicalRollingEnrollment(enrollment)) {
      throw new HttpsError('failed-precondition', 'Enrollment is not activated for rolling scheduling');
    }
    const status = normalizeEnrollmentStatus(enrollment.status);
    if (status !== 'active' && status !== 'trial' && status !== 'paused') {
      throw new HttpsError('failed-precondition', 'Only active, trial or paused rolling enrollments may edit recurrence');
    }

    const canonical = buildCanonicalRollingScheduleDefinition({
      existingEnrollment: enrollment,
      weeklySlots: input.weeklySlots as ReconcileRollingEnrollmentScheduleInput['weeklySlots'],
      classesStartDateYmd,
    });
    const nextSchedule = canonical.schedule as unknown as Record<string, unknown>;
    const targetFingerprint = scheduleFingerprint({schedule: nextSchedule, classesStartDateYmd});
    const retry = isRetryableReconciliation(enrollment, targetFingerprint);
    const scheduleChanged = canonical.recurrenceChanged || Boolean(retry);
    const targetSchedule = retry
      ? (enrollment.schedule as Record<string, unknown>)
      : nextSchedule;
    const targetRevision = retry ? scheduleRevision(enrollment) : canonical.schedule.revision;
    const nextEnrollment: Record<string, unknown> = {
      ...enrollment,
      status,
      startDateYmd: enrollmentStartDateYmd,
      classesStartDateYmd,
      feePerClass,
      ratePerSession: feePerClass,
      currency,
      joinUrl,
      schedule: targetSchedule,
      scheduleMaterialization: {
        ...(isRecordLike(enrollment.scheduleMaterialization) ? enrollment.scheduleMaterialization : {}),
        scheduleRevision: targetRevision,
      },
    };

    if (!scheduleChanged) {
      await enrollmentRef.update({
        startDate: ymdToIstMidnightTimestamp(enrollmentStartDateYmd),
        startDateYmd: enrollmentStartDateYmd,
        classesStartDate: ymdToIstMidnightTimestamp(classesStartDateYmd),
        classesStartDateYmd,
        feePerClass,
        ratePerSession: feePerClass,
        currency,
        joinUrl,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
      let materializedSessionsCreated = 0;
      let materializedSessionsPreserved = 0;
      let nextMaterializationDueYmd: string | null = null;
      if (status === 'active' || status === 'trial') {
        const materialized = await materializeRollingEnrollmentWindowInternal(db, {
          enrollmentId,
          anchorYmd: resolveRollingLifecycleTodayYmd(),
          actorId: actorUid,
        });
        materializedSessionsCreated = materialized.createdCount;
        materializedSessionsPreserved = materialized.existingCount + materialized.raceAlreadyExistsCount;
        nextMaterializationDueYmd = materialized.materialization.nextMaterializationDueYmd;
      }
      return {
        ok: true,
        enrollmentId,
        scheduleChanged: false,
        scheduleRevision: targetRevision,
        horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
        status,
        orchestrationState: status === 'paused' ? 'saved_paused' : 'unchanged',
        staleCandidates: 0,
        cancelledStaleSessions: 0,
        protectedStaleSessions: 0,
        retainedCandidates: 0,
        patchedRetainedSessions: 0,
        protectedRetainedSessions: 0,
        restoredPreviouslyReconciledSessions: 0,
        addedCandidates: 0,
        materializedSessionsCreated,
        materializedSessionsPreserved,
        nextMaterializationDueYmd,
      };
    }

    const previousEnrollment = retry?.previousEnrollment || enrollment;
    const todayYmd = resolveRollingLifecycleTodayYmd();
    const editPlan = buildRollingScheduleEditPlan({
      enrollmentId,
      previousEnrollment,
      nextEnrollment,
      anchorYmd: todayYmd,
    });
    // A retry uses the already-persisted target revision, while an initial edit
    // advances exactly once. Keep the planner response aligned with that target.
    editPlan.toRevision = targetRevision;

    let counts: ReconciliationCounts;
    try {
      counts = await reconcileSessionsAndPersistSchedule({
        db,
        enrollmentId,
        initialEnrollment: enrollment,
        previousEnrollment,
        nextEnrollment,
        editPlan,
        targetFingerprint,
        actorUid,
        enrollmentStartDateYmd,
        classesStartDateYmd,
        feePerClass,
        currency,
        joinUrl,
        isRetry: Boolean(retry),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('reconcileRollingEnrollmentSchedule transaction failed closed', {enrollmentId, message});
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Failed to reconcile rolling schedule: ${message}`);
    }

    let materializedSessionsCreated = 0;
    let materializedSessionsPreserved = 0;
    let nextMaterializationDueYmd: string | null = null;
    try {
      if (status === 'active' || status === 'trial') {
        const materialized = await materializeRollingEnrollmentWindowInternal(db, {
          enrollmentId,
          anchorYmd: todayYmd,
          actorId: actorUid,
        });
        materializedSessionsCreated = materialized.createdCount;
        materializedSessionsPreserved = materialized.existingCount + materialized.raceAlreadyExistsCount;
        nextMaterializationDueYmd = materialized.materialization.nextMaterializationDueYmd;
      }

      const response: ReconcileRollingEnrollmentScheduleResult = {
        ok: true,
        enrollmentId,
        scheduleChanged: true,
        scheduleRevision: targetRevision,
        horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
        status,
        orchestrationState: status === 'paused' ? 'saved_paused' : 'reconciled',
        staleCandidates: editPlan.staleOccurrenceIds.length,
        cancelledStaleSessions: counts.cancelledStaleSessions,
        protectedStaleSessions: counts.protectedStaleSessions,
        retainedCandidates: editPlan.retainedOccurrenceIds.length,
        patchedRetainedSessions: counts.patchedRetainedSessions,
        protectedRetainedSessions: counts.protectedRetainedSessions,
        restoredPreviouslyReconciledSessions: counts.restoredPreviouslyReconciledSessions,
        addedCandidates: editPlan.addedOccurrenceIds.length,
        materializedSessionsCreated,
        materializedSessionsPreserved,
        nextMaterializationDueYmd,
      };
      await enrollmentRef.update({
        'rollingScheduleReconciliation.state': 'success',
        'rollingScheduleReconciliation.completedAt': FieldValue.serverTimestamp(),
        'rollingScheduleReconciliation.completedBy': actorUid,
        'rollingScheduleReconciliation.lastResult': response,
        'rollingScheduleReconciliation.error': FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
      logger.info('reconcileRollingEnrollmentSchedule completed', response);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await enrollmentRef.update({
        'rollingScheduleReconciliation.state': 'failed',
        'rollingScheduleReconciliation.failedAt': FieldValue.serverTimestamp(),
        'rollingScheduleReconciliation.failedBy': actorUid,
        'rollingScheduleReconciliation.error': message,
        'scheduleMaterialization.nextOccurrenceYmd': null,
        'scheduleMaterialization.nextMaterializationDueYmd': null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
      logger.error('reconcileRollingEnrollmentSchedule materialization failed closed', {enrollmentId, message});
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Rolling schedule was saved but refill failed: ${message}`);
    }
  },
);
