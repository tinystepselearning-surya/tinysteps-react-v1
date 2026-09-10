import * as admin from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError, onCall, type CallableRequest} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {normalizeEnrollmentStatus} from '../helpers/status';
import {
  createEnrollment as legacyCreateEnrollment,
  setEnrollmentStatus as legacySetEnrollmentStatus,
} from '../lifecycle';
import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  materializeRollingEnrollmentWindowInternal,
  normalizeRollingMaterializerSlots,
} from './rollingScheduleMaterializer';
import {
  buildCanonicalRollingScheduleDefinition,
  isCanonicalRollingEnrollment,
  resolveRollingLifecycleTodayYmd,
  setRollingEnrollmentLifecycle,
} from './rollingScheduleLifecycle';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

type RecordLike = Record<string, unknown>;

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isRecordLike = (value: unknown): value is RecordLike => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

async function runCallable<T>(
  callable: {run: (request: CallableRequest<any>) => T},
  request: CallableRequest<any>,
): Promise<Awaited<T>> {
  return await callable.run(request) as Awaited<T>;
}

async function readEnrollment(enrollmentId: string): Promise<RecordLike> {
  const snap = await admin.firestore().collection('enrollments').doc(enrollmentId).get();
  if (!snap.exists) throw new HttpsError('not-found', `Enrollment ${enrollmentId} not found`);
  return {id: snap.id, ...(snap.data() || {})};
}

function validateYmd(value: unknown, fieldName: string): string {
  const ymd = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new HttpsError('invalid-argument', `${fieldName} must be YYYY-MM-DD`);
  }
  const [year, month, day] = ymd.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new HttpsError('invalid-argument', `${fieldName} must be a valid calendar date`);
  }
  return ymd;
}

function resolveKidId(enrollment: RecordLike): string {
  const kidId = text(enrollment.kidId)
    || text(Array.isArray(enrollment.kidIds) ? enrollment.kidIds[0] : null)
    || text(enrollment.studentId)
    || text(enrollment.childId);
  if (!kidId) throw new HttpsError('failed-precondition', 'Current enrollment has no canonical child identity');
  return kidId;
}

function buildTransitionSlots(scheduleLike: unknown) {
  const slots = normalizeRollingMaterializerSlots(scheduleLike);
  if (!slots.length) throw new HttpsError('failed-precondition', 'The continuing timetable has no valid weekly slots');
  return slots.map((slot) => ({
    weekday: slot.weekday,
    time: slot.time,
    durationMinutes: slot.durationMinutes,
  }));
}

/**
 * Production course-transition cutover.
 *
 * Every transition after rollout creates the destination enrollment with a canonical
 * rolling schedule and fills only its exact 14-day physical window. It never invokes
 * createSessionsFromSchedule/repairEnrollmentFutureSessionsFromSchedule. Existing legacy
 * source enrollments may still be completed through the old lifecycle callable, but that
 * terminal path only cancels their old future rows and cannot generate new finite sessions.
 */
export const transitionEnrollmentCourse = onCall(
  {region: REGION, memory: '256MiB', timeoutSeconds: 180},
  async (request) => {
    await ensureAdmin(request.auth);
    const data = (request.data || {}) as RecordLike;
    const operationId = text(data.operationId);
    const oldEnrollmentId = text(data.oldEnrollmentId);
    const newCourseId = text(data.newCourseId);
    const newTeacherId = text(data.newTeacherId);
    const reason = text(data.reason);
    if (!operationId || !oldEnrollmentId || !newCourseId || !newTeacherId || !reason) {
      throw new HttpsError(
        'invalid-argument',
        'operationId, oldEnrollmentId, newCourseId, newTeacherId, and reason are required',
      );
    }

    const db = admin.firestore();
    const actor = request.auth?.uid || 'admin';
    const transitionRef = db.collection('enrollmentCourseTransitions').doc(operationId);
    const prior = await transitionRef.get();
    if (prior.exists) {
      const priorData = prior.data() || {};
      if (
        String(priorData.oldEnrollmentId || '') !== oldEnrollmentId
        || String(priorData.newCourseId || '') !== newCourseId
      ) {
        throw new HttpsError('already-exists', 'operationId belongs to a different course transition');
      }
      if (String(priorData.state || '') === 'complete') {
        return {
          ok: true,
          operationId,
          state: 'complete',
          oldEnrollmentId,
          newEnrollmentId: priorData.newEnrollmentId || null,
          cancelledSessionsCount: priorData.cancelledSessionsCount || 0,
          reconciliation: priorData.reconciliation || null,
          idempotentReplay: true,
          rolling: Boolean(priorData.rolling),
        };
      }
      if (priorData.rolling !== true) {
        throw new HttpsError(
          'failed-precondition',
          'A pre-cutover course transition is partially complete and requires explicit recovery before retrying',
        );
      }
    }

    const oldEnrollment = await readEnrollment(oldEnrollmentId);
    const oldStatus = normalizeEnrollmentStatus(oldEnrollment.status);
    if (
      oldStatus === 'discontinued'
      || oldStatus === 'expired'
      || oldStatus === 'cancelled'
      || oldStatus === 'archived'
      || oldStatus === 'inactive'
    ) {
      throw new HttpsError('failed-precondition', 'Current enrollment is already terminal');
    }

    const kidId = resolveKidId(oldEnrollment);
    const classesStartDateYmd = validateYmd(data.classesStartDate, 'classesStartDate');
    const scheduleLike = isRecordLike(data.newSchedule) ? data.newSchedule : oldEnrollment.schedule;
    if (!isRecordLike(scheduleLike)) {
      throw new HttpsError('invalid-argument', 'newSchedule is required');
    }
    const weeklySlots = buildTransitionSlots(scheduleLike);
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

    const ratePerSession = Number(
      data.ratePerSession
      ?? courseSnap.data()?.ratePerSession
      ?? oldEnrollment.ratePerSession
      ?? oldEnrollment.feePerClass
      ?? 0,
    );
    const teacherPayPerSession = Number(data.teacherPayPerSession ?? oldEnrollment.teacherPayPerSession ?? 0);
    if (!Number.isFinite(ratePerSession) || ratePerSession <= 0) {
      throw new HttpsError('failed-precondition', 'Next course requires a positive parent session rate');
    }
    if (!Number.isFinite(teacherPayPerSession) || teacherPayPerSession < 0) {
      throw new HttpsError('failed-precondition', 'Next course teacher rate is invalid');
    }

    await transitionRef.set({
      operationId,
      oldEnrollmentId,
      oldCourseId: text(oldEnrollment.courseId) || null,
      newCourseId,
      newTeacherId,
      reason,
      state: 'creating_rolling_enrollment',
      rolling: true,
      createdAt: prior.exists ? (prior.data()?.createdAt || FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
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
        ratePerSession,
        teacherPayPerSession,
        creditsTotal: Math.max(0, Math.floor(Number(data.creditsTotal ?? 0))),
        currency: text(data.currency) || text(oldEnrollment.currency) || 'INR',
        billingCycle: text(data.billingCycle) || text(oldEnrollment.billingCycle) || 'monthly',
      },
    });
    const newEnrollmentId = text(creation.enrollmentId);
    if (!newEnrollmentId) throw new HttpsError('internal', 'Next enrollment creation did not return an enrollmentId');

    const newEnrollmentRef = db.collection('enrollments').doc(newEnrollmentId);
    const inheritedJoinUrl = text(data.joinUrl)
      || text(oldEnrollment.joinUrl)
      || text(oldEnrollment.meetingLink)
      || text(oldEnrollment.classLink)
      || null;
    await newEnrollmentRef.set({
      joinUrl: inheritedJoinUrl,
      previousEnrollmentId: oldEnrollmentId,
      transitionOperationId: operationId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
    }, {merge: true});

    const materialized = await materializeRollingEnrollmentWindowInternal(db, {
      enrollmentId: newEnrollmentId,
      anchorYmd: resolveRollingLifecycleTodayYmd(),
      actorId: actor,
    });

    let cancelledSessionsCount = 0;
    const freshOld = await readEnrollment(oldEnrollmentId);
    const freshOldStatus = normalizeEnrollmentStatus(freshOld.status);
    if (freshOldStatus !== 'completed') {
      if (isCanonicalRollingEnrollment(freshOld)) {
        const stopped = await runCallable(setRollingEnrollmentLifecycle, {
          ...request,
          data: {
            enrollmentId: oldEnrollmentId,
            status: 'discontinued',
            reason: `course_transition:${reason}`,
          },
        });
        cancelledSessionsCount = Number(stopped.cancelledSessionsCount || 0);
        await db.collection('enrollments').doc(oldEnrollmentId).set({
          status: 'completed',
          completedAt: FieldValue.serverTimestamp(),
          completedBy: actor,
          completionReason: reason,
          endedAt: FieldValue.serverTimestamp(),
          nextEnrollmentId: newEnrollmentId,
          transitionOperationId: operationId,
          'scheduleMaterialization.lifecycleState': 'completed',
          'scheduleMaterialization.nextOccurrenceYmd': null,
          'scheduleMaterialization.nextMaterializationDueYmd': null,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, {merge: true});
      } else {
        const completed = await runCallable(legacySetEnrollmentStatus, {
          ...request,
          data: {enrollmentId: oldEnrollmentId, status: 'completed', reason},
        });
        cancelledSessionsCount = Number(completed.cancelledSessionsCount || 0);
        await db.collection('enrollments').doc(oldEnrollmentId).set({
          nextEnrollmentId: newEnrollmentId,
          transitionOperationId: operationId,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, {merge: true});
      }
    }

    const reconciliation = {
      rolling: true,
      horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
      created: materialized.createdCount,
      preserved: materialized.existingCount + materialized.raceAlreadyExistsCount,
      nextMaterializationDueYmd: materialized.materialization.nextMaterializationDueYmd,
    };
    await transitionRef.set({
      state: 'complete',
      newEnrollmentId,
      cancelledSessionsCount,
      reconciliation,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
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
  },
);
