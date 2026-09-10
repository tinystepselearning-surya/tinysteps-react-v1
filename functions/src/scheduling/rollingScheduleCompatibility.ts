import * as admin from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError, onCall, type CallableRequest} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {
  doesEnrollmentOccupyCourseSlot,
  normalizeEnrollmentStatus,
} from '../helpers/status';
import {
  createEnrollment as legacyCreateEnrollment,
  setEnrollmentStatus as legacySetEnrollmentStatus,
  transitionEnrollmentCourse as legacyTransitionEnrollmentCourse,
} from '../lifecycle';
import {
  createSessionsFromSchedule as legacyCreateSessionsFromSchedule,
  pauseEnrollmentUpcomingSessions as legacyPauseEnrollmentUpcomingSessions,
  repairCancelledFutureRegularSessionsForEnrollment as legacyRepairCancelledFutureRegularSessionsForEnrollment,
  repairEnrollmentFutureSessionsFromSchedule as legacyRepairEnrollmentFutureSessionsFromSchedule,
  resumeEnrollmentSchedule as legacyResumeEnrollmentSchedule,
  saveEnrollmentScheduleAndGenerateSessions as legacySaveEnrollmentScheduleAndGenerateSessions,
} from '../createSessionsFromSchedule';
import {
  ROLLING_SCHEDULE_CONTRACT_VERSION,
  ROLLING_SCHEDULE_DELIVERY_MODE,
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  ROLLING_SCHEDULE_SESSION_SOURCE,
  ROLLING_SCHEDULE_TIME_ZONE,
  addDaysYmd,
  buildRollingMaterializationPlan,
  materializeRollingEnrollmentWindowInternal,
} from './rollingScheduleMaterializer';
import {
  buildCanonicalRollingScheduleDefinition,
  isCanonicalRollingEnrollment,
  resolveRollingLifecycleTodayYmd,
  setRollingEnrollmentLifecycle,
} from './rollingScheduleLifecycle';
import {reconcileRollingEnrollmentSchedule} from './rollingScheduleReconciliation';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const TERMINAL_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'archived',
  'inactive',
]);

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isRecordLike = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

async function runCallable<T>(callable: {run: (request: CallableRequest<any>) => T}, request: CallableRequest<any>): Promise<Awaited<T>> {
  return await callable.run(request) as Awaited<T>;
}

async function readEnrollment(enrollmentId: string): Promise<Record<string, unknown>> {
  const snap = await admin.firestore().collection('enrollments').doc(enrollmentId).get();
  if (!snap.exists) throw new HttpsError('not-found', `Enrollment ${enrollmentId} not found`);
  return {id: snap.id, ...(snap.data() || {})};
}

function requireEnrollmentId(request: CallableRequest<any>): string {
  const enrollmentId = text(request.data?.enrollmentId);
  if (!enrollmentId) throw new HttpsError('invalid-argument', 'enrollmentId is required');
  return enrollmentId;
}

function legacyCompatibleGenerationResponse(
  materialized: Awaited<ReturnType<typeof materializeRollingEnrollmentWindowInternal>>,
  dryRun = false,
) {
  const rangeStart = materialized.anchorYmd;
  const rangeEnd = materialized.horizonEndYmd;
  return {
    created: dryRun ? 0 : materialized.createdCount,
    skipped: materialized.existingCount + materialized.raceAlreadyExistsCount,
    replaced: 0,
    cancelledBlockersRestored: 0,
    cancelledBlockersSkipped: 0,
    plannedSessionsTarget: null,
    plannedSessionsGenerated: materialized.expectedCount,
    plannedSessionsConsumed: 0,
    plannedSessionsActiveFuture: materialized.expectedCount,
    plannedSessionsPausedFuture: 0,
    plannedSessionsRemaining: 0,
    plannedSessionsUnfilled: 0,
    plannedSessionsCapReached: false,
    rangeStart,
    rangeEnd,
    rangeStartYmd: rangeStart,
    rangeEndYmd: rangeEnd,
    rolling: true,
    horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
    nextMaterializationDueYmd: materialized.materialization.nextMaterializationDueYmd,
  };
}

async function syncRollingWindowJoinUrl(
  enrollmentId: string,
  enrollment: Record<string, unknown>,
  todayYmd: string,
): Promise<number> {
  const plan = buildRollingMaterializationPlan({enrollmentId, enrollment, anchorYmd: todayYmd});
  if (!plan.occurrences.length) return 0;
  const db = admin.firestore();
  const refs = plan.occurrences.map((row) => db.collection('classSessions').doc(row.sessionId));
  const snaps = await db.getAll(...refs);
  const joinUrl = text(enrollment.joinUrl) || null;
  const eligible = snaps.filter((snap) => {
    if (!snap.exists) return false;
    const data = (snap.data() || {}) as Record<string, unknown>;
    const status = String(data.status || '').trim().toLowerCase();
    return String(data.source || '').trim().toLowerCase() === ROLLING_SCHEDULE_SESSION_SOURCE
      && (status === 'scheduled' || status === 'upcoming' || status === 'planned' || status === 'open')
      && (data.attendance == null || (isRecordLike(data.attendance) && Object.keys(data.attendance).length === 0));
  });
  if (!eligible.length) return 0;
  const batch = db.batch();
  eligible.forEach((snap) => {
    batch.set(snap.ref, {
      joinUrl: joinUrl || FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'system:rolling_schedule_compatibility',
    }, {merge: true});
  });
  await batch.commit();
  return eligible.length;
}

async function materializeRollingCompatibility(
  enrollmentId: string,
  request: CallableRequest<any>,
  dryRun = false,
) {
  const enrollment = await readEnrollment(enrollmentId);
  const status = normalizeEnrollmentStatus(enrollment.status);
  if (status === 'paused' || TERMINAL_STATUSES.has(status)) {
    const todayYmd = resolveRollingLifecycleTodayYmd();
    return {
      created: 0,
      skipped: 0,
      replaced: 0,
      cancelledBlockersRestored: 0,
      cancelledBlockersSkipped: 0,
      plannedSessionsTarget: null,
      plannedSessionsGenerated: 0,
      plannedSessionsConsumed: 0,
      plannedSessionsActiveFuture: 0,
      plannedSessionsPausedFuture: 0,
      plannedSessionsRemaining: 0,
      plannedSessionsUnfilled: 0,
      plannedSessionsCapReached: false,
      rangeStart: todayYmd,
      rangeEnd: addDaysYmd(todayYmd, ROLLING_SCHEDULE_HORIZON_DAYS),
      rangeStartYmd: todayYmd,
      rangeEndYmd: addDaysYmd(todayYmd, ROLLING_SCHEDULE_HORIZON_DAYS),
      rolling: true,
      horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
      nextMaterializationDueYmd: null,
    };
  }
  if (status !== 'active' && status !== 'trial') {
    throw new HttpsError('failed-precondition', 'Rolling enrollment is not operationally active');
  }
  const todayYmd = resolveRollingLifecycleTodayYmd();
  const materialized = await materializeRollingEnrollmentWindowInternal(admin.firestore(), {
    enrollmentId,
    anchorYmd: todayYmd,
    actorId: request.auth?.uid || 'system:rolling_schedule_compatibility',
    dryRun,
  });
  if (!dryRun) {
    const fresh = await readEnrollment(enrollmentId);
    await syncRollingWindowJoinUrl(enrollmentId, fresh, todayYmd);
  }
  return legacyCompatibleGenerationResponse(materialized, dryRun);
}

/**
 * Compatibility gate for the previous lifecycle callable name. Every reachable old
 * admin screen can safely keep calling setEnrollmentStatus during the cutover: rolling
 * enrollments are delegated to the rolling lifecycle, while legacy enrollments retain
 * their established behavior.
 */
export const setEnrollmentStatus = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacySetEnrollmentStatus, request);
  }

  const requested = normalizeEnrollmentStatus(request.data?.status);
  if (requested === 'unknown') {
    throw new HttpsError('invalid-argument', `Unsupported enrollment status: ${String(request.data?.status || '')}`);
  }
  const previousStatus = normalizeEnrollmentStatus(enrollment.status);
  const reason = text(request.data?.reason) || undefined;

  if (requested === 'paused') {
    const result = await runCallable(setRollingEnrollmentLifecycle, {
      ...request,
      data: {enrollmentId, status: 'paused', reason},
    });
    return {
      ok: true,
      updatedEnrollmentId: enrollmentId,
      cancelledSessionsCount: result.cancelledSessionsCount,
      reactivated: false,
      reconciliation: null,
      message: 'Enrollment set to paused',
      rollingLifecycle: result,
    };
  }

  if (requested === 'active' || requested === 'trial') {
    const result = await runCallable(setRollingEnrollmentLifecycle, {
      ...request,
      data: {enrollmentId, status: 'active', reason},
    });
    if (requested === 'trial') {
      await admin.firestore().collection('enrollments').doc(enrollmentId).set({
        status: 'trial',
        'scheduleMaterialization.lifecycleState': 'active',
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: request.auth?.uid || 'admin',
      }, {merge: true});
    }
    return {
      ok: true,
      updatedEnrollmentId: enrollmentId,
      cancelledSessionsCount: 0,
      reactivated: previousStatus !== 'active' && previousStatus !== 'trial',
      reconciliation: result,
      message: `Enrollment set to ${requested}`,
      rollingLifecycle: result,
    };
  }

  if (TERMINAL_STATUSES.has(requested)) {
    const result = await runCallable(setRollingEnrollmentLifecycle, {
      ...request,
      data: {enrollmentId, status: 'discontinued', reason},
    });
    const patch: Record<string, unknown> = {
      status: requested,
      'scheduleMaterialization.lifecycleState': requested,
      'scheduleMaterialization.nextOccurrenceYmd': null,
      'scheduleMaterialization.nextMaterializationDueYmd': null,
      endedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid || 'admin',
    };
    if (reason) patch.endReason = reason;
    if (requested === 'archived') {
      patch.archived = true;
      patch.isArchived = true;
      patch.archivedAt = FieldValue.serverTimestamp();
    }
    await admin.firestore().collection('enrollments').doc(enrollmentId).set(patch, {merge: true});
    return {
      ok: true,
      updatedEnrollmentId: enrollmentId,
      cancelledSessionsCount: result.cancelledSessionsCount,
      reactivated: false,
      reconciliation: null,
      message: `Enrollment set to ${requested}`,
      rollingLifecycle: result,
    };
  }

  throw new HttpsError('failed-precondition', 'Unsupported rolling enrollment lifecycle transition');
});

export const pauseEnrollmentUpcomingSessions = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacyPauseEnrollmentUpcomingSessions, request);
  }
  const result = await runCallable(setRollingEnrollmentLifecycle, {
    ...request,
    data: {enrollmentId, status: 'paused', reason: 'legacy_pause_entry_point'},
  });
  return {
    ...(await materializeRollingCompatibility(enrollmentId, request, true)),
    pausedCount: result.cancelledSessionsCount,
    pauseBatchId: `rolling:${enrollmentId}`,
    rollingLifecycle: result,
  };
});

export const resumeEnrollmentSchedule = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacyResumeEnrollmentSchedule, request);
  }
  const result = await runCallable(setRollingEnrollmentLifecycle, {
    ...request,
    data: {enrollmentId, status: 'active', reason: 'legacy_resume_entry_point'},
  });
  const response = await materializeRollingCompatibility(enrollmentId, request, true);
  return {
    ...response,
    resumedCount: result.restoredSessionsCount + result.materializedSessionsCreated,
    rollingLifecycle: result,
  };
});

export const createSessionsFromSchedule = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacyCreateSessionsFromSchedule, request);
  }
  return materializeRollingCompatibility(enrollmentId, request, false);
});

export const repairEnrollmentFutureSessionsFromSchedule = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacyRepairEnrollmentFutureSessionsFromSchedule, request);
  }
  const dryRun = request.data?.dryRun === undefined ? true : Boolean(request.data?.dryRun);
  return {
    ...(await materializeRollingCompatibility(enrollmentId, request, dryRun)),
    dryRun,
    rollingRepair: true,
  };
});

export const repairCancelledFutureRegularSessionsForEnrollment = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacyRepairCancelledFutureRegularSessionsForEnrollment, request);
  }
  const dryRun = request.data?.dryRun === undefined ? true : Boolean(request.data?.dryRun);
  return {
    ...(await materializeRollingCompatibility(enrollmentId, request, dryRun)),
    dryRun,
    rollingRepair: true,
  };
});

export const saveEnrollmentScheduleAndGenerateSessions = onCall({region: REGION}, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = requireEnrollmentId(request);
  const enrollment = await readEnrollment(enrollmentId);
  if (!isCanonicalRollingEnrollment(enrollment)) {
    return runCallable(legacySaveEnrollmentScheduleAndGenerateSessions, request);
  }
  const result = await runCallable(reconcileRollingEnrollmentSchedule, {
    ...request,
    data: {
      enrollmentId,
      enrollmentStartDate: request.data?.enrollmentStartDate,
      classesStartDate: request.data?.classesStartDate,
      feePerClass: request.data?.feePerClass,
      currency: request.data?.currency,
      joinUrl: request.data?.joinUrl,
      weeklySlots: request.data?.weeklySlots,
    },
  });
  return {
    created: result.materializedSessionsCreated,
    skipped: result.materializedSessionsPreserved,
    replaced: result.cancelledStaleSessions,
    cancelledBlockersRestored: result.restoredPreviouslyReconciledSessions,
    cancelledBlockersSkipped: result.protectedStaleSessions + result.protectedRetainedSessions,
    plannedSessionsTarget: null,
    plannedSessionsGenerated: result.materializedSessionsCreated + result.materializedSessionsPreserved,
    plannedSessionsConsumed: 0,
    plannedSessionsActiveFuture: result.materializedSessionsCreated + result.materializedSessionsPreserved,
    plannedSessionsPausedFuture: result.status === 'paused' ? result.materializedSessionsPreserved : 0,
    plannedSessionsRemaining: 0,
    plannedSessionsUnfilled: 0,
    plannedSessionsCapReached: false,
    rangeStart: resolveRollingLifecycleTodayYmd(),
    rangeEnd: addDaysYmd(resolveRollingLifecycleTodayYmd(), ROLLING_SCHEDULE_HORIZON_DAYS),
    rangeStartYmd: resolveRollingLifecycleTodayYmd(),
    rangeEndYmd: addDaysYmd(resolveRollingLifecycleTodayYmd(), ROLLING_SCHEDULE_HORIZON_DAYS),
    idempotentReplay: false,
    orchestrationState: 'generated',
    rollingReconciliation: result,
  };
});

/**
 * Generic enrollment creation remains intentionally unconfigured when no schedule is
 * supplied: the admin schedule screen is the authority that activates recurrence.
 * If an integration supplies a canonical rolling schedule at creation time, this wrapper
 * verifies it has a teacher and immediately establishes the exact 14-day materialization
 * state so no active rolling enrollment is left without a due pointer contract.
 */
export const createEnrollment = onCall({region: REGION}, async (request) => {
  const schedule = isRecordLike(request.data?.schedule) ? request.data.schedule : null;
  const scheduleIsRolling = Boolean(
    schedule
    && Number(schedule.schemaVersion) === ROLLING_SCHEDULE_CONTRACT_VERSION
    && String(schedule.deliveryMode || '').trim().toLowerCase() === ROLLING_SCHEDULE_DELIVERY_MODE
    && String(schedule.timezone || '').trim() === ROLLING_SCHEDULE_TIME_ZONE,
  );
  if (scheduleIsRolling && !text(request.data?.teacherId)) {
    throw new HttpsError('failed-precondition', 'A canonical rolling enrollment requires a teacher before creation');
  }
  const created = await runCallable(legacyCreateEnrollment, request);
  if (!scheduleIsRolling) return created;
  const enrollmentId = text(created.enrollmentId);
  if (!enrollmentId) throw new HttpsError('internal', 'Enrollment creation did not return an enrollmentId');
  const materialized = await materializeRollingEnrollmentWindowInternal(admin.firestore(), {
    enrollmentId,
    anchorYmd: resolveRollingLifecycleTodayYmd(),
    actorId: request.auth?.uid || 'system:rolling_schedule_compatibility',
  });
  return {...created, rollingMaterialization: legacyCompatibleGenerationResponse(materialized)};
});

/**
 * Rolling course transitions deliberately avoid the legacy transition generator. A new
 * enrollment is created with a canonical rolling schedule, temporarily held paused while
 * the transition is assembled, activated through the rolling lifecycle (which fills only
 * 14 days), and only then is the previous enrollment discontinued/completed. Legacy
 * enrollments continue to use the existing transition state machine unchanged.
 */
export const transitionEnrollmentCourse = onCall({region: REGION, memory: '256MiB', timeoutSeconds: 180}, async (request) => {
  await ensureAdmin(request.auth);
  const data = (request.data || {}) as Record<string, unknown>;
  const operationId = text(data.operationId);
  const oldEnrollmentId = text(data.oldEnrollmentId);
  const newCourseId = text(data.newCourseId);
  const newTeacherId = text(data.newTeacherId);
  const reason = text(data.reason);
  if (!operationId || !oldEnrollmentId || !newCourseId || !newTeacherId || !reason) {
    throw new HttpsError('invalid-argument', 'operationId, oldEnrollmentId, newCourseId, newTeacherId, and reason are required');
  }

  const db = admin.firestore();
  const oldEnrollment = await readEnrollment(oldEnrollmentId);
  if (!isCanonicalRollingEnrollment(oldEnrollment)) {
    return runCallable(legacyTransitionEnrollmentCourse, request);
  }
  if (!doesEnrollmentOccupyCourseSlot(oldEnrollment) && normalizeEnrollmentStatus(oldEnrollment.status) !== 'completed') {
    throw new HttpsError('failed-precondition', 'Current enrollment is already terminal');
  }

  const kidId = text(oldEnrollment.kidId) || text(oldEnrollment.studentId);
  if (!kidId) throw new HttpsError('failed-precondition', 'Current enrollment has no canonical child identity');
  const classesStartDateYmd = text(data.classesStartDate);
  if (!classesStartDateYmd) throw new HttpsError('invalid-argument', 'classesStartDate is required');
  try {
    addDaysYmd(classesStartDateYmd, 0);
  } catch {
    throw new HttpsError('invalid-argument', 'classesStartDate must be YYYY-MM-DD');
  }
  const newScheduleLike = isRecordLike(data.newSchedule) ? data.newSchedule : oldEnrollment.schedule;
  if (!isRecordLike(newScheduleLike)) throw new HttpsError('invalid-argument', 'newSchedule is required');
  const weeklySlots = Array.isArray(newScheduleLike.weeklySlots)
    ? newScheduleLike.weeklySlots.map((row) => {
        const slot = isRecordLike(row) ? row : {};
        return {
          weekday: Number(slot.weekday),
          time: text(slot.time),
          durationMinutes: Number(slot.durationMinutes ?? slot.durationMins ?? 35),
        };
      })
    : [];
  const canonical = buildCanonicalRollingScheduleDefinition({
    existingEnrollment: {},
    weeklySlots,
    classesStartDateYmd,
  });

  const [courseSnap, teacherSnap] = await Promise.all([
    db.collection('courses').doc(newCourseId).get(),
    db.collection('users').doc(newTeacherId).get(),
  ]);
  if (!courseSnap.exists || String(courseSnap.data()?.status || '').trim().toLowerCase() !== 'active') {
    throw new HttpsError('failed-precondition', 'Next course is missing or inactive');
  }
  if (!teacherSnap.exists) throw new HttpsError('failed-precondition', 'Next teacher was not found');

  const transitionRef = db.collection('enrollmentCourseTransitions').doc(operationId);
  const prior = await transitionRef.get();
  if (prior.exists && String(prior.data()?.state || '') === 'complete') {
    const priorData = prior.data() || {};
    if (String(priorData.oldEnrollmentId || '') !== oldEnrollmentId || String(priorData.newCourseId || '') !== newCourseId) {
      throw new HttpsError('already-exists', 'operationId belongs to a different course transition');
    }
    return {
      ok: true,
      operationId,
      state: 'complete',
      oldEnrollmentId,
      newEnrollmentId: priorData.newEnrollmentId || null,
      cancelledSessionsCount: priorData.cancelledSessionsCount || 0,
      reconciliation: priorData.reconciliation || null,
      idempotentReplay: true,
      rolling: true,
    };
  }

  await transitionRef.set({
    operationId,
    oldEnrollmentId,
    oldCourseId: text(oldEnrollment.courseId) || null,
    newCourseId,
    newTeacherId,
    reason,
    state: 'creating_new_enrollment',
    rolling: true,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid || 'admin',
    createdAt: prior.exists ? (prior.data()?.createdAt || FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
  }, {merge: true});

  const creation = await runCallable(legacyCreateEnrollment, {
    ...request,
    data: {
      operationId: `rolling-transition-create-${operationId}`,
      kidId,
      courseId: newCourseId,
      teacherId: newTeacherId,
      schedule: canonical.schedule,
      classesStartDate: classesStartDateYmd,
      ratePerSession: Number(data.ratePerSession ?? courseSnap.data()?.ratePerSession ?? oldEnrollment.ratePerSession ?? oldEnrollment.feePerClass ?? 0),
      teacherPayPerSession: Number(data.teacherPayPerSession ?? oldEnrollment.teacherPayPerSession ?? 0),
      creditsTotal: Math.max(0, Math.floor(Number(data.creditsTotal ?? 0))),
      currency: text(data.currency) || text(oldEnrollment.currency) || 'INR',
      billingCycle: text(data.billingCycle) || text(oldEnrollment.billingCycle) || 'monthly',
    },
  });
  const newEnrollmentId = text(creation.enrollmentId);
  if (!newEnrollmentId) throw new HttpsError('internal', 'Next enrollment creation did not return an enrollmentId');
  const newRef = db.collection('enrollments').doc(newEnrollmentId);
  const inheritedJoinUrl = text(data.joinUrl) || text(oldEnrollment.joinUrl) || text(oldEnrollment.meetingLink) || text(oldEnrollment.classLink) || null;

  // Hold the new enrollment paused before activating it through the rolling lifecycle.
  // If the function is retried, this remains idempotent and no finite generator is used.
  await newRef.set({
    status: 'paused',
    joinUrl: inheritedJoinUrl,
    previousEnrollmentId: oldEnrollmentId,
    transitionOperationId: operationId,
    'scheduleMaterialization.schemaVersion': ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
    'scheduleMaterialization.horizonDays': ROLLING_SCHEDULE_HORIZON_DAYS,
    'scheduleMaterialization.scheduleRevision': canonical.schedule.revision,
    'scheduleMaterialization.nextOccurrenceYmd': null,
    'scheduleMaterialization.nextMaterializationDueYmd': null,
    'scheduleMaterialization.lifecycleState': 'paused',
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid || 'admin',
  }, {merge: true});

  const activated = await runCallable(setRollingEnrollmentLifecycle, {
    ...request,
    data: {enrollmentId: newEnrollmentId, status: 'active', reason: 'course_transition_activation'},
  });

  let oldLifecycle: any = null;
  const freshOld = await readEnrollment(oldEnrollmentId);
  if (normalizeEnrollmentStatus(freshOld.status) !== 'completed') {
    oldLifecycle = await runCallable(setRollingEnrollmentLifecycle, {
      ...request,
      data: {enrollmentId: oldEnrollmentId, status: 'discontinued', reason: `course_transition:${reason}`},
    });
    await db.collection('enrollments').doc(oldEnrollmentId).set({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      completedBy: request.auth?.uid || 'admin',
      completionReason: reason,
      endedAt: FieldValue.serverTimestamp(),
      nextEnrollmentId: newEnrollmentId,
      transitionOperationId: operationId,
      'scheduleMaterialization.lifecycleState': 'completed',
      'scheduleMaterialization.nextOccurrenceYmd': null,
      'scheduleMaterialization.nextMaterializationDueYmd': null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid || 'admin',
    }, {merge: true});
  }

  const reconciliation = {
    rolling: true,
    horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
    created: activated.materializedSessionsCreated,
    preserved: activated.materializedSessionsPreserved,
    nextMaterializationDueYmd: activated.nextMaterializationDueYmd,
  };
  const cancelledSessionsCount = Number(oldLifecycle?.cancelledSessionsCount || 0);
  await transitionRef.set({
    state: 'complete',
    newEnrollmentId,
    cancelledSessionsCount,
    reconciliation,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid || 'admin',
  }, {merge: true});

  return {
    ok: true,
    operationId,
    state: 'complete',
    oldEnrollmentId,
    newEnrollmentId,
    cancelledSessionsCount,
    reconciliation,
    idempotentReplay: false,
    rolling: true,
  };
});
