import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import {
  doesEnrollmentOccupyCourseSlot,
  normalizeEnrollmentStatus,
  normalizeManualSessionState,
} from './helpers/status';
import { repairEnrollmentFutureSessionsFromScheduleInternal } from './createSessionsFromSchedule';
import {
  buildCanonicalTeacherWriteFields,
  buildEnrollmentTeacherWriteFields,
  resolveCanonicalTeacherIdForWrite,
} from './helpers/teacherIdentity';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_BATCH = 450;

const ACTIVE_LIKE = new Set([
  'trial',
  'active',
  'paused',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
]);

const TERMINAL = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'archived', 'inactive']);
const NON_REASSIGNABLE_SESSION_STATUSES = new Set([
  'completed',
  'cancelled',
  'canceled',
  'rescheduled',
  'reschedule',
  'replacement',
  'approved_request',
  'paid',
  'settled',
  'consumed',
  'locked',
  'no_show',
  'noshow',
  'attended',
  'present',
  'absent',
]);
const SCHEDULE_EXCEPTION_SOURCE_TOKENS = [
  'makeup',
  'manual',
  'one_off',
  'one-off',
  'adhoc',
  'ad_hoc',
  'rescheduled',
  'reschedule',
  'replacement',
  'approved_request',
] as const;

const OPERATIONAL_ENROLLMENT_KEYS_COLLECTION = 'operationalEnrollmentKeys';
const ENROLLMENT_CREATION_OPERATIONS_COLLECTION = 'enrollmentCreationOperations';
const ENROLLMENT_TRANSITIONS_COLLECTION = 'enrollmentCourseTransitions';

async function ensureEnrollmentCreator(auth: any, kidId: string): Promise<void> {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  if (auth.token?.role === 'admin' || auth.token?.admin === true) return;

  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(auth.uid).get();
  const user = userSnap.data() || {};
  const roles = Array.isArray(user.roles) ? user.roles.map((role: unknown) => String(role)) : [];
  const isAdmin = user.role === 'admin' || roles.includes('admin');
  if (isAdmin) return;

  const normalizedRole = String(user.role || '').replace(/[-_\s]/g, '').toLowerCase();
  const isLearningPartner = normalizedRole === 'learningpartner' ||
    roles.some((role: string) => role.replace(/[-_\s]/g, '').toLowerCase() === 'learningpartner');
  if (!isLearningPartner) {
    throw new HttpsError('permission-denied', 'Admin or assigned Learning Partner access required');
  }

  const kidSnap = await db.collection('kids').doc(kidId).get();
  if (!kidSnap.exists) throw new HttpsError('not-found', 'Canonical child was not found');
  const kid = kidSnap.data() || {};
  const assignedLearningPartners = new Set([
    toOptionalId(kid.lpId),
    toOptionalId(kid.primaryLpId),
    ...toStringList(kid.assignedLPs),
  ].filter((uid): uid is string => Boolean(uid)));
  if (!assignedLearningPartners.has(auth.uid)) {
    throw new HttpsError('permission-denied', 'Learning Partner is not assigned to this child');
  }
}

type TeacherIdentity = {
  teacherId: string;
  teacherIds: string[];
  teacherName: string | null;
  teacherDisplayName: string | null;
  teacherEmail: string | null;
};

type StudentIdentity = {
  kidId: string | null;
  kidIds: string[];
  studentId: string | null;
  childId: string | null;
  studentName: string | null;
  kidName: string | null;
  childName: string | null;
  studentFullName: string | null;
  kidFullName: string | null;
  childFullName: string | null;
};

type EnrollmentIdentity = {
  enrollmentId: string;
  courseId: string | null;
  courseName: string | null;
  parentId: string | null;
  parentIds: string[];
  joinUrl: string | null;
};

type KidSyncSummary = {
  kidUpdated: boolean;
  teacherIds: string[];
  primaryTeacherId: string | null;
};

function resolveKidIdFromEnrollment(data: any): string | null {
  return (
    toOptionalId(data?.kidId) ||
    toOptionalId(Array.isArray(data?.kidIds) ? data.kidIds[0] : null) ||
    toOptionalId(data?.studentId) ||
    toOptionalId(data?.childId) ||
    null
  );
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  value.forEach((item) => {
    const text = typeof item === 'string' ? item.trim() : '';
    if (!text || seen.has(text)) return;
    seen.add(text);
    normalized.push(text);
  });
  return normalized;
}

function toOptionalId(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const direct =
      toOptionalId(row.id) ||
      toOptionalId(row.uid) ||
      toOptionalId(row.userId) ||
      toOptionalId(row.kidId) ||
      toOptionalId(row.studentId);
    if (direct) return direct;
    if (typeof row.path === 'string') {
      const parts = row.path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1];
    }
    const pathLike = (row as any)._path;
    if (pathLike && Array.isArray(pathLike.segments)) {
      const segs = pathLike.segments.filter((seg: unknown) => typeof seg === 'string');
      if (segs.length > 0) return String(segs[segs.length - 1] || '').trim() || null;
    }
  }
  return null;
}

export function buildOperationalEnrollmentKeyId(kidId: string, courseId: string): string {
  return `${encodeURIComponent(kidId.trim())}__${encodeURIComponent(courseId.trim())}`;
}

async function findOperationalSameCourseEnrollmentIds(args: {
  db: FirebaseFirestore.Firestore;
  kidId: string;
  courseId: string;
  excludeEnrollmentId?: string;
}): Promise<string[]> {
  const { db, kidId, courseId, excludeEnrollmentId } = args;
  const snapshots = await Promise.all([
    db.collection('enrollments').where('kidId', '==', kidId).where('courseId', '==', courseId).get(),
    db.collection('enrollments').where('studentId', '==', kidId).where('courseId', '==', courseId).get(),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId).where('courseId', '==', courseId).get(),
  ]);
  const matches = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  snapshots.forEach((snapshot) => snapshot.docs.forEach((docSnap) => matches.set(docSnap.id, docSnap)));
  return Array.from(matches.values())
    .filter((docSnap) => docSnap.id !== excludeEnrollmentId)
    .filter((docSnap) => doesEnrollmentOccupyCourseSlot((docSnap.data() || {}) as Record<string, unknown>))
    .map((docSnap) => docSnap.id);
}

async function createEnrollmentInternal(
  data: Record<string, unknown>,
  actor: string,
  reservedByOperationId?: string,
) {
  const operationId = String(data.operationId || '').trim();
  const requestedKidId = String(data.kidId || data.studentId || '').trim();
  const requestedCourseId = String(data.courseId || '').trim();
  if (!operationId || !requestedKidId || !requestedCourseId) {
    throw new HttpsError('invalid-argument', 'operationId, kidId, and courseId are required');
  }
  if (operationId.length > 150) throw new HttpsError('invalid-argument', 'operationId is too long');

  const db = admin.firestore();
  const operationRef = db.collection(ENROLLMENT_CREATION_OPERATIONS_COLLECTION).doc(operationId);
  const existingOperation = await operationRef.get();
  if (existingOperation.exists) {
    const data = existingOperation.data() || {};
    if (data.kidId !== requestedKidId || data.courseId !== requestedCourseId) {
      throw new HttpsError('already-exists', 'operationId was already used for a different enrollment request');
    }
    return { ok: true, enrollmentId: String(data.enrollmentId || ''), idempotentReplay: true };
  }

  const [kidSnap, courseSnap] = await Promise.all([
    db.collection('kids').doc(requestedKidId).get(),
    db.collection('courses').doc(requestedCourseId).get(),
  ]);
  if (!kidSnap.exists) throw new HttpsError('not-found', 'Canonical child was not found');
  if (!courseSnap.exists) throw new HttpsError('not-found', 'Canonical course was not found');
  const kid = (kidSnap.data() || {}) as Record<string, unknown>;
  const course = (courseSnap.data() || {}) as Record<string, unknown>;
  const canonicalKidId = kidSnap.id;
  const canonicalCourseId = courseSnap.id;
  if (String(course.status || '').trim().toLowerCase() !== 'active') {
    throw new HttpsError('failed-precondition', 'Selected course is not active and cannot be assigned');
  }
  const existingOperational = await findOperationalSameCourseEnrollmentIds({
    db,
    kidId: canonicalKidId,
    courseId: canonicalCourseId,
  });
  if (existingOperational.length > 0) {
    throw new HttpsError(
      'already-exists',
      `An operational enrollment already exists for this child and course: ${existingOperational[0]}`,
    );
  }

  const teacherId = toOptionalId(data.teacherId);
  if (teacherId) {
    const teacherSnap = await db.collection('users').doc(teacherId).get();
    if (!teacherSnap.exists) throw new HttpsError('not-found', 'Selected teacher was not found');
  }
  const ratePerSession = Number(data.ratePerSession ?? data.feePerClass ?? course.ratePerSession ?? 0);
  const teacherPayPerSession = Number(data.teacherPayPerSession ?? 0);
  const creditsTotal = Math.max(0, Math.floor(Number(data.creditsTotal ?? 0)));
  if (!Number.isFinite(ratePerSession) || ratePerSession <= 0) {
    throw new HttpsError('invalid-argument', 'fee per class must be a positive number');
  }
  if (!Number.isFinite(teacherPayPerSession) || teacherPayPerSession < 0) {
    throw new HttpsError('invalid-argument', 'teacherPayPerSession must be a non-negative number');
  }
  const schedule = data.schedule;
  if (schedule != null && (typeof schedule !== 'object' || Array.isArray(schedule))) {
    throw new HttpsError('invalid-argument', 'schedule must be an object');
  }

  const parentIds = toStringList(kid.parentIds);
  const parentId = toOptionalId(kid.primaryParentId) || toOptionalId(kid.parentId) || parentIds[0] || null;
  if (!parentId) throw new HttpsError('failed-precondition', 'Child is not linked to a parent');
  if (!parentIds.includes(parentId)) parentIds.unshift(parentId);
  const assignedLpId =
    toOptionalId(kid.lpId) || toOptionalId(kid.primaryLpId) || toStringList(kid.assignedLPs)[0] || null;
  const kidName =
    toOptionalId(kid.fullName) || toOptionalId(kid.name) || toOptionalId(kid.displayName) || canonicalKidId;
  const courseName =
    toOptionalId(course.title) || toOptionalId(course.name) || toOptionalId(course.courseName) || canonicalCourseId;
  const enrollmentRef = db.collection('enrollments').doc();
  const keyRef = db.collection(OPERATIONAL_ENROLLMENT_KEYS_COLLECTION)
    .doc(buildOperationalEnrollmentKeyId(canonicalKidId, canonicalCourseId));
  const auditRef = db.collection('auditLogs').doc();
  await db.runTransaction(async (tx) => {
    const [operationCheck, keySnap] = await Promise.all([tx.get(operationRef), tx.get(keyRef)]);
    if (operationCheck.exists) return;
    const keyData = keySnap.data() || {};
    const ownsReservation = Boolean(
      reservedByOperationId && keyData.reservationOperationId === reservedByOperationId,
    );
    if (keySnap.exists && !ownsReservation) {
      throw new HttpsError('already-exists', 'Another operational enrollment already reserves this child and course');
    }
    const enrollmentPayload = removeUndefinedDeep({
      enrollmentId: enrollmentRef.id,
      kidId: canonicalKidId,
      studentId: canonicalKidId,
      kidIds: [canonicalKidId],
      studentName: kidName,
      kidName,
      childName: kidName,
      kidNames: [kidName],
      parentId,
      parentIds,
      courseId: canonicalCourseId,
      courseName,
      ...buildEnrollmentTeacherWriteFields(teacherId),
      lpId: assignedLpId,
      status: 'active',
      ratePerSession,
      feePerClass: ratePerSession,
      teacherPayPerSession,
      currency: String(data.currency || 'INR'),
      billingCycle: String(data.billingCycle || 'monthly'),
      creditsTotal,
      creditsUsed: 0,
      creditsRemaining: creditsTotal,
      topicProgress: {},
      ...(schedule ? { schedule } : {}),
      ...(toOptionalId(data.classesStartDate) ? { classesStartDateYmd: toOptionalId(data.classesStartDate) } : {}),
      enrollmentDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
      creationOperationId: operationId,
    });
    tx.create(enrollmentRef, enrollmentPayload);
    tx.set(keyRef, {
      enrollmentId: enrollmentRef.id,
      kidId: canonicalKidId,
      courseId: canonicalCourseId,
      heldAt: FieldValue.serverTimestamp(),
      heldBy: actor,
    });
    tx.create(operationRef, {
      operationId,
      enrollmentId: enrollmentRef.id,
      kidId: canonicalKidId,
      courseId: canonicalCourseId,
      state: 'complete',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor,
    });
    tx.create(auditRef, {
      type: 'enrollment_created',
      action: 'create',
      enrollmentId: enrollmentRef.id,
      kidId: canonicalKidId,
      courseId: canonicalCourseId,
      operationId,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor,
    });
  });
  const committedOperation = await operationRef.get();
  const committedEnrollmentId = String(committedOperation.data()?.enrollmentId || enrollmentRef.id);
  return {
    ok: true,
    enrollmentId: committedEnrollmentId,
    idempotentReplay: committedEnrollmentId !== enrollmentRef.id,
  };
}

export const createEnrollment = onCall({ region: REGION }, async (request) => {
  const data = (request.data || {}) as Record<string, unknown>;
  const requestedKidId = String(data.kidId || data.studentId || '').trim();
  if (request.auth?.uid && !requestedKidId) {
    throw new HttpsError('invalid-argument', 'operationId, kidId, and courseId are required');
  }
  await ensureEnrollmentCreator(request.auth, requestedKidId);
  return createEnrollmentInternal(
    data,
    request.auth?.uid || 'admin',
  );
});

type CourseTransitionState =
  | 'validated'
  | 'old_enrollment_completed'
  | 'old_sessions_reconciled'
  | 'new_enrollment_created'
  | 'new_sessions_generated'
  | 'complete'
  | 'failed';

export const transitionEnrollmentCourse = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);
  const data = (request.data || {}) as Record<string, unknown>;
  const operationId = String(data.operationId || '').trim();
  const oldEnrollmentId = String(data.oldEnrollmentId || '').trim();
  const newCourseId = String(data.newCourseId || '').trim();
  const newTeacherId = String(data.newTeacherId || '').trim();
  const reason = String(data.reason || '').trim();
  if (!operationId || !oldEnrollmentId || !newCourseId || !newTeacherId || !reason) {
    throw new HttpsError(
      'invalid-argument',
      'operationId, oldEnrollmentId, newCourseId, newTeacherId, and reason are required',
    );
  }
  if (!isPlainObject(data.newSchedule)) {
    throw new HttpsError('invalid-argument', 'newSchedule is required');
  }
  const db = admin.firestore();
  const actor = request.auth?.uid || 'admin';
  const transitionRef = db.collection(ENROLLMENT_TRANSITIONS_COLLECTION).doc(operationId);

  try {
    let transitionSnap = await transitionRef.get();
    if (!transitionSnap.exists) {
      const oldRef = db.collection('enrollments').doc(oldEnrollmentId);
      const [oldSnap, courseSnap, teacherSnap] = await Promise.all([
        oldRef.get(),
        db.collection('courses').doc(newCourseId).get(),
        db.collection('users').doc(newTeacherId).get(),
      ]);
      if (!oldSnap.exists) throw new HttpsError('not-found', 'Current enrollment was not found');
      if (!courseSnap.exists) throw new HttpsError('not-found', 'Next course was not found');
      if (!teacherSnap.exists) throw new HttpsError('not-found', 'Next teacher was not found');
      const oldEnrollment = (oldSnap.data() || {}) as Record<string, unknown>;
      if (!doesEnrollmentOccupyCourseSlot(oldEnrollment)) {
        throw new HttpsError('failed-precondition', 'Current enrollment is already terminal');
      }
      const kidId = resolveKidIdFromEnrollment(oldEnrollment);
      const oldCourseId = toOptionalId(oldEnrollment.courseId);
      if (!kidId || !oldCourseId) {
        throw new HttpsError('failed-precondition', 'Current enrollment has incomplete child/course identity');
      }
      const conflicts = await findOperationalSameCourseEnrollmentIds({ db, kidId, courseId: newCourseId });
      if (conflicts.length > 0) {
        throw new HttpsError('already-exists', `Next course already has an operational enrollment: ${conflicts[0]}`);
      }
      const newKeyRef = db.collection(OPERATIONAL_ENROLLMENT_KEYS_COLLECTION)
        .doc(buildOperationalEnrollmentKeyId(kidId, newCourseId));
      await db.runTransaction(async (tx) => {
        const [operationCheck, keySnap] = await Promise.all([tx.get(transitionRef), tx.get(newKeyRef)]);
        if (operationCheck.exists) return;
        if (keySnap.exists) throw new HttpsError('already-exists', 'Next course is already reserved');
        tx.create(newKeyRef, {
          kidId,
          courseId: newCourseId,
          reservationOperationId: operationId,
          state: 'reserved',
          heldAt: FieldValue.serverTimestamp(),
          heldBy: actor,
        });
        tx.create(transitionRef, removeUndefinedDeep({
          operationId,
          oldEnrollmentId,
          oldCourseId,
          kidId,
          newCourseId,
          newTeacherId,
          newSchedule: data.newSchedule,
          classesStartDate: toOptionalId(data.classesStartDate),
          ratePerSession: Number(data.ratePerSession ?? courseSnap.data()?.ratePerSession ?? 0),
          teacherPayPerSession: Number(data.teacherPayPerSession ?? 0),
          creditsTotal: Math.max(0, Math.floor(Number(data.creditsTotal ?? 0))),
          currency: String(data.currency || oldEnrollment.currency || 'INR'),
          billingCycle: String(data.billingCycle || oldEnrollment.billingCycle || 'monthly'),
          reason,
          state: 'validated',
          retryable: true,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: actor,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }) as Record<string, unknown>);
      });
      transitionSnap = await transitionRef.get();
    }

    let transition = (transitionSnap.data() || {}) as Record<string, unknown>;
    if (transition.oldEnrollmentId !== oldEnrollmentId || transition.newCourseId !== newCourseId) {
      throw new HttpsError('already-exists', 'operationId belongs to a different course transition');
    }
    if (String(transition.reason || '') !== reason || String(transition.newTeacherId || '') !== newTeacherId) {
      throw new HttpsError('already-exists', 'Transition retry inputs do not match the stored operation');
    }
    let state = String(transition.state || '') as CourseTransitionState;
    if (state === 'failed') {
      state = String(transition.resumeState || '') as CourseTransitionState;
      if (!state || state === 'failed') throw new HttpsError('failed-precondition', 'Transition has no safe resume state');
      await transitionRef.set({ state, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor }, { merge: true });
    }

    if (state === 'validated') {
      const oldRef = db.collection('enrollments').doc(oldEnrollmentId);
      const oldSnap = await oldRef.get();
      if (!oldSnap.exists) throw new HttpsError('not-found', 'Current enrollment disappeared during transition');
      const kidId = String(transition.kidId || '');
      const oldCourseId = String(transition.oldCourseId || '');
      const oldKeyRef = db.collection(OPERATIONAL_ENROLLMENT_KEYS_COLLECTION)
        .doc(buildOperationalEnrollmentKeyId(kidId, oldCourseId));
      await db.runTransaction(async (tx) => {
        const keySnap = await tx.get(oldKeyRef);
        tx.set(oldRef, {
          status: 'completed',
          completedAt: FieldValue.serverTimestamp(),
          completedBy: actor,
          completionReason: reason,
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
          transitionOperationId: operationId,
        }, { merge: true });
        if (keySnap.exists && keySnap.data()?.enrollmentId === oldEnrollmentId) tx.delete(oldKeyRef);
        tx.set(transitionRef, {
          state: 'old_enrollment_completed',
          oldEnrollmentCompletedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, { merge: true });
      });
      state = 'old_enrollment_completed';
    }

    if (state === 'old_enrollment_completed') {
      const cancelledSessionsCount = await cancelFutureSessionsByEnrollmentId(
        oldEnrollmentId,
        'course_transition_completed',
        actor,
      );
      await transitionRef.set({
        state: 'old_sessions_reconciled',
        cancelledSessionsCount,
        oldSessionsReconciledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor,
      }, { merge: true });
      state = 'old_sessions_reconciled';
    }

    if (state === 'old_sessions_reconciled') {
      transition = ((await transitionRef.get()).data() || {}) as Record<string, unknown>;
      const enrollmentResult = await createEnrollmentInternal({
        operationId: `transition-create-${operationId}`,
        kidId: transition.kidId,
        courseId: transition.newCourseId,
        teacherId: transition.newTeacherId,
        schedule: transition.newSchedule,
        classesStartDate: transition.classesStartDate,
        ratePerSession: transition.ratePerSession,
        teacherPayPerSession: transition.teacherPayPerSession,
        creditsTotal: transition.creditsTotal,
        currency: transition.currency,
        billingCycle: transition.billingCycle,
      }, actor, operationId);
      const newEnrollmentId = enrollmentResult.enrollmentId;
      await Promise.all([
        db.collection('enrollments').doc(oldEnrollmentId).set({
          nextEnrollmentId: newEnrollmentId,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, { merge: true }),
        db.collection('enrollments').doc(newEnrollmentId).set({
          previousEnrollmentId: oldEnrollmentId,
          transitionOperationId: operationId,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, { merge: true }),
        transitionRef.set({
          state: 'new_enrollment_created',
          newEnrollmentId,
          newEnrollmentCreatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, { merge: true }),
      ]);
      state = 'new_enrollment_created';
    }

    if (state === 'new_enrollment_created') {
      transition = ((await transitionRef.get()).data() || {}) as Record<string, unknown>;
      const newEnrollmentId = String(transition.newEnrollmentId || '');
      const reconciliation = await repairEnrollmentFutureSessionsFromScheduleInternal({
        enrollmentId: newEnrollmentId,
        dryRun: false,
        actorUid: actor,
      });
      await transitionRef.set({
        state: 'new_sessions_generated',
        reconciliation,
        newSessionsGeneratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor,
      }, { merge: true });
      state = 'new_sessions_generated';
    }

    if (state === 'new_sessions_generated') {
      transition = ((await transitionRef.get()).data() || {}) as Record<string, unknown>;
      const auditRef = db.collection('auditLogs').doc();
      const batch = db.batch();
      batch.set(transitionRef, {
        state: 'complete',
        retryable: false,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor,
      }, { merge: true });
      batch.create(auditRef, {
        type: 'enrollment_course_transition_completed',
        action: 'transition',
        operationId,
        oldEnrollmentId,
        newEnrollmentId: transition.newEnrollmentId,
        kidId: transition.kidId,
        oldCourseId: transition.oldCourseId,
        newCourseId,
        reason,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: actor,
      });
      await batch.commit();
    }

    const finalData = (await transitionRef.get()).data() || {};
    return {
      ok: true,
      operationId,
      state: finalData.state,
      oldEnrollmentId,
      newEnrollmentId: finalData.newEnrollmentId || null,
      cancelledSessionsCount: finalData.cancelledSessionsCount || 0,
      reconciliation: finalData.reconciliation || null,
    };
  } catch (error) {
    const current = await transitionRef.get();
    if (current.exists) {
      const currentState = String(current.data()?.state || 'validated');
      if (currentState !== 'complete') {
        await transitionRef.set({
          state: 'failed',
          resumeState: currentState === 'failed' ? current.data()?.resumeState || 'validated' : currentState,
          failedStep: currentState,
          failureCode: error instanceof HttpsError ? error.code : 'internal',
          failureMessage: error instanceof Error ? error.message : String(error),
          retryable: true,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor,
        }, { merge: true });
      }
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Course transition failed and can be retried with the same operationId');
  }
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function removeUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    const cleanedItems = value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined);
    return cleanedItems;
  }

  if (isPlainObject(value)) {
    const cleaned: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => {
      const nextValue = removeUndefinedDeep(item);
      if (nextValue !== undefined) {
        cleaned[key] = nextValue;
      }
    });
    return cleaned;
  }

  return value;
}

function normalizeStatusValue(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveLikeEnrollmentStatus(value: unknown): boolean {
  return ACTIVE_LIKE.has(normalizeEnrollmentStatus(value));
}

function enrollmentHasConfiguredSchedule(enrollment: Record<string, unknown>): boolean {
  const schedule = isPlainObject(enrollment.schedule) ? enrollment.schedule : {};
  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length > 0) return true;
  return Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0 && Boolean(nonEmptyString(schedule.timeHHmm));
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function cleanStudentDisplayName(value: unknown): string | null {
  const text = nonEmptyString(value);
  if (!text) return null;
  if (/^\d+\s+assigned$/i.test(text)) return null;
  if (/^assigned$/i.test(text)) return null;
  if (/^\d+\s+students?$/i.test(text)) return null;
  if (/^(student|child|kid)$/i.test(text)) return null;
  return text;
}

function isLikelyCourseIdLike(value: unknown, courseId?: string | null): boolean {
  const text = nonEmptyString(value);
  if (!text) return false;
  const lower = text.toLowerCase();
  const normalizedCourseId = nonEmptyString(courseId)?.toLowerCase() || '';
  if (normalizedCourseId && lower === normalizedCourseId) return true;
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(text);
}

function collectTeacherIds(record: Record<string, unknown> | undefined): string[] {
  if (!record) return [];
  return Array.from(
    new Set(
      [
        ...toStringList(record.teacherIds),
        toOptionalId(record.teacherId),
        toOptionalId((record as any).assignedTeacherId),
        toOptionalId((record as any).primaryTeacherId),
        toOptionalId((record as any).teacherUid),
        toOptionalId((record as any).teacher_id),
      ].filter((item): item is string => Boolean(item)),
    ),
  );
}

function collectKidIds(record: Record<string, unknown> | undefined): string[] {
  if (!record) return [];
  return Array.from(
    new Set(
      [
        ...toStringList(record.kidIds),
        toOptionalId(record.kidId),
        toOptionalId((record as any).studentId),
        toOptionalId((record as any).childId),
      ].filter((item): item is string => Boolean(item)),
    ),
  );
}

function resolveStudentNameParts(record: Record<string, unknown> | undefined): {
  studentName: string | null;
  kidName: string | null;
  childName: string | null;
  studentFullName: string | null;
  kidFullName: string | null;
  childFullName: string | null;
} {
  if (!record) {
    return {
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    };
  }
  const canonicalName =
    cleanStudentDisplayName((record as any).studentName) ||
    cleanStudentDisplayName((record as any).kidName) ||
    cleanStudentDisplayName((record as any).childName) ||
    cleanStudentDisplayName((record as any).studentFullName) ||
    cleanStudentDisplayName((record as any).kidFullName) ||
    cleanStudentDisplayName((record as any).childFullName) ||
    cleanStudentDisplayName((record as any).fullName) ||
    cleanStudentDisplayName((record as any).displayName) ||
    cleanStudentDisplayName((record as any).name) ||
    null;
  return {
    studentName: cleanStudentDisplayName((record as any).studentName) || canonicalName,
    kidName: cleanStudentDisplayName((record as any).kidName) || canonicalName,
    childName: cleanStudentDisplayName((record as any).childName) || canonicalName,
    studentFullName: cleanStudentDisplayName((record as any).studentFullName) || canonicalName,
    kidFullName: cleanStudentDisplayName((record as any).kidFullName) || canonicalName,
    childFullName: cleanStudentDisplayName((record as any).childFullName) || canonicalName,
  };
}

function resolveCourseName(record: Record<string, unknown> | undefined): string | null {
  if (!record) return null;
  return (
    nonEmptyString((record as any).courseName) ||
    nonEmptyString((record as any).courseTitle) ||
    nonEmptyString((record as any).courseLabel) ||
    nonEmptyString((record as any).programName) ||
    nonEmptyString((record as any).subject) ||
    null
  );
}

export function buildTeacherReassignmentJoinLinkPatch(joinUrl: string | null): Record<string, unknown> {
  const normalizedJoinUrl = nonEmptyString(joinUrl);
  return {
    joinUrl: normalizedJoinUrl,
    meetingLink: null,
    classLink: null,
  };
}

function buildTeacherIdentity(input: {
  teacherId: string;
  teacherName?: string | null;
  teacherDisplayName?: string | null;
  teacherEmail?: string | null;
}): TeacherIdentity {
  return {
    teacherId: input.teacherId,
    teacherIds: [input.teacherId],
    teacherName: input.teacherName || input.teacherId,
    teacherDisplayName: input.teacherDisplayName || input.teacherName || input.teacherId,
    teacherEmail: input.teacherEmail || null,
  };
}

function buildStudentIdentity(input: {
  enrollment: Record<string, unknown>;
  kid: Record<string, unknown> | undefined;
}): StudentIdentity {
  const enrollmentKidIds = collectKidIds(input.enrollment);
  const kidRecord = input.kid;
  const kidId =
    resolveKidIdFromEnrollment(input.enrollment) ||
    toOptionalId(kidRecord?.id) ||
    null;
  const mergedKidIds = Array.from(
    new Set([
      ...enrollmentKidIds,
      ...collectKidIds(kidRecord),
      ...(kidId ? [kidId] : []),
    ]),
  );
  const enrollmentName = resolveStudentNameParts(input.enrollment);
  const kidNameParts = resolveStudentNameParts(kidRecord);
  return {
    kidId,
    kidIds: mergedKidIds,
    studentId: toOptionalId((input.enrollment as any).studentId) || kidId,
    childId: toOptionalId((input.enrollment as any).childId) || kidId,
    studentName: enrollmentName.studentName || kidNameParts.studentName,
    kidName: enrollmentName.kidName || kidNameParts.kidName,
    childName: enrollmentName.childName || kidNameParts.childName,
    studentFullName: enrollmentName.studentFullName || kidNameParts.studentFullName,
    kidFullName: enrollmentName.kidFullName || kidNameParts.kidFullName,
    childFullName: enrollmentName.childFullName || kidNameParts.childFullName,
  };
}

function buildEnrollmentIdentity(input: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
}): EnrollmentIdentity {
  const parentIds = toStringList(input.enrollment.parentIds);
  const parentId = toOptionalId(input.enrollment.parentId) || parentIds[0] || null;
  const mergedParentIds = Array.from(new Set([...(parentId ? [parentId] : []), ...parentIds]));
  return {
    enrollmentId: input.enrollmentId,
    courseId:
      toOptionalId(input.enrollment.courseId) ||
      toOptionalId((input.enrollment as any).course_id) ||
      toOptionalId((input.enrollment as any).course) ||
      null,
    courseName: resolveCourseName(input.enrollment),
    parentId,
    parentIds: mergedParentIds,
    joinUrl:
      nonEmptyString((input.enrollment as any).joinUrl) ||
      nonEmptyString((input.enrollment as any).meetingLink) ||
      nonEmptyString((input.enrollment as any).classLink) ||
      null,
  };
}

function resolveSessionTeacherIds(record: Record<string, unknown>): string[] {
  return collectTeacherIds(record);
}

function resolveSessionKidIds(record: Record<string, unknown>): string[] {
  return collectKidIds(record);
}

function resolveSessionIsFuture(raw: Record<string, unknown>, nowMs: number): boolean {
  const startAt = raw?.startAt;
  if (typeof (startAt as any)?.toMillis === 'function') {
    return (startAt as any).toMillis() >= nowMs;
  }
  if (startAt) {
    const parsedStartAt = new Date(startAt as any);
    if (!Number.isNaN(parsedStartAt.getTime())) {
      return parsedStartAt.getTime() >= nowMs;
    }
  }

  const dateYmd = String(raw?.date || '').trim();
  const startTime = String(raw?.startTime || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    const withTimeIso =
      /^\d{2}:\d{2}$/.test(startTime)
        ? `${dateYmd}T${startTime}:00+05:30`
        : `${dateYmd}T00:00:00+05:30`;
    const parsed = Date.parse(withTimeIso);
    if (!Number.isNaN(parsed)) {
      return parsed >= nowMs;
    }
  }
  return false;
}

async function getQueryDocs(
  queryRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const snap = await queryRef.get();
  return snap.docs;
}

function mergeDocMaps(
  target: Map<string, FirebaseFirestore.QueryDocumentSnapshot>,
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
) {
  docs.forEach((docSnap) => {
    if (!target.has(docSnap.id)) {
      target.set(docSnap.id, docSnap);
    }
  });
}

type SessionRepairQueryPlan = {
  key: string;
  field: string;
  op: '==' | 'array-contains';
  value: string;
  source:
    | 'enrollmentId'
    | 'kidId'
    | 'studentId'
    | 'childId'
    | 'kidIds'
    | 'studentIds'
    | 'childIds'
    | 'childrenIds';
  legacy: boolean;
};

const appendSessionRepairQueryPlan = (
  plans: SessionRepairQueryPlan[],
  seen: Set<string>,
  field: SessionRepairQueryPlan['field'],
  op: SessionRepairQueryPlan['op'],
  rawValue: unknown,
  source: SessionRepairQueryPlan['source'],
  legacy = false,
) => {
  const value = toOptionalId(rawValue);
  if (!value) return;
  const key = `${field}|${op}|${value}`;
  if (seen.has(key)) return;
  seen.add(key);
  plans.push({ key, field, op, value, source, legacy });
};

export function buildSessionRepairQueryCoverage(
  enrollmentId: string,
  studentIdentity: StudentIdentity,
): SessionRepairQueryPlan[] {
  const plans: SessionRepairQueryPlan[] = [];
  const seen = new Set<string>();

  appendSessionRepairQueryPlan(plans, seen, 'enrollmentId', '==', enrollmentId, 'enrollmentId');

  const kidId = toOptionalId(studentIdentity.kidId);
  const studentId = toOptionalId(studentIdentity.studentId);
  const childId = toOptionalId(studentIdentity.childId);

  appendSessionRepairQueryPlan(plans, seen, 'kidId', '==', kidId, 'kidId');
  appendSessionRepairQueryPlan(plans, seen, 'kidIds', 'array-contains', kidId, 'kidIds');

  appendSessionRepairQueryPlan(plans, seen, 'studentId', '==', studentId, 'studentId');
  appendSessionRepairQueryPlan(plans, seen, 'studentIds', 'array-contains', studentId, 'studentIds');
  if (kidId && kidId !== studentId) {
    appendSessionRepairQueryPlan(plans, seen, 'studentId', '==', kidId, 'studentId', true);
    appendSessionRepairQueryPlan(plans, seen, 'studentIds', 'array-contains', kidId, 'studentIds', true);
  }

  appendSessionRepairQueryPlan(plans, seen, 'childId', '==', childId, 'childId');
  appendSessionRepairQueryPlan(plans, seen, 'childIds', 'array-contains', childId, 'childIds');
  appendSessionRepairQueryPlan(plans, seen, 'childrenIds', 'array-contains', childId, 'childrenIds');
  if (kidId && kidId !== childId) {
    appendSessionRepairQueryPlan(plans, seen, 'childId', '==', kidId, 'childId', true);
    appendSessionRepairQueryPlan(plans, seen, 'childIds', 'array-contains', kidId, 'childIds', true);
    appendSessionRepairQueryPlan(plans, seen, 'childrenIds', 'array-contains', kidId, 'childrenIds', true);
  }

  return plans;
}

export function buildSessionRepairPatch(args: {
  existing: Record<string, unknown>;
  teacher: TeacherIdentity;
  student: StudentIdentity;
  enrollment: EnrollmentIdentity;
  actorIdentity: string | null;
  previousTeacherId: string | null;
  previousTeacherName?: string | null;
  previousTeacherEmail?: string | null;
  includeEnrollmentId: boolean;
}): Record<string, unknown> {
  const {
    existing,
    teacher,
    student,
    enrollment,
    actorIdentity,
    previousTeacherId,
    previousTeacherName,
    previousTeacherEmail,
    includeEnrollmentId,
  } = args;
  const currentStudentName = nonEmptyString((existing as any).studentName);
  const currentKidName = nonEmptyString((existing as any).kidName);
  const currentChildName = nonEmptyString((existing as any).childName);
  const currentStudentFullName = nonEmptyString((existing as any).studentFullName);
  const currentKidFullName = nonEmptyString((existing as any).kidFullName);
  const currentChildFullName = nonEmptyString((existing as any).childFullName);
  const currentStudentNameClean = cleanStudentDisplayName(currentStudentName);
  const currentKidNameClean = cleanStudentDisplayName(currentKidName);
  const currentChildNameClean = cleanStudentDisplayName(currentChildName);
  const currentStudentFullNameClean = cleanStudentDisplayName(currentStudentFullName);
  const currentKidFullNameClean = cleanStudentDisplayName(currentKidFullName);
  const currentChildFullNameClean = cleanStudentDisplayName(currentChildFullName);
  const currentCourseName =
    nonEmptyString((existing as any).courseName) ||
    nonEmptyString((existing as any).courseTitle) ||
    nonEmptyString((existing as any).courseLabel);
  const enrollmentCourseDisplay = enrollment.courseName || null;
  const shouldReplaceCourseSnapshot =
    !currentCourseName ||
    (enrollmentCourseDisplay &&
      (isLikelyCourseIdLike(currentCourseName, enrollment.courseId) || currentCourseName !== enrollmentCourseDisplay));
  const kidIds = resolveSessionKidIds(existing);
  const mergedKidIds = Array.from(
    new Set([
      ...kidIds,
      ...student.kidIds,
      ...(student.kidId ? [student.kidId] : []),
    ]),
  );
  const parentIds = Array.from(
    new Set([
      ...toStringList((existing as any).parentIds),
      ...enrollment.parentIds,
      ...((enrollment.parentId && !toStringList((existing as any).parentIds).includes(enrollment.parentId))
        ? [enrollment.parentId]
        : []),
    ]),
  );

  return removeUndefinedDeep({
    ...buildCanonicalTeacherWriteFields(teacher.teacherId),
    teacherName: teacher.teacherName,
    teacherDisplayName: teacher.teacherDisplayName,
    teacherEmail: teacher.teacherEmail,
    ...(includeEnrollmentId ? { enrollmentId: enrollment.enrollmentId } : {}),
    ...(student.kidId && !toOptionalId((existing as any).kidId) ? { kidId: student.kidId } : {}),
    ...(student.studentId && !toOptionalId((existing as any).studentId) ? { studentId: student.studentId } : {}),
    ...(student.childId && !toOptionalId((existing as any).childId) ? { childId: student.childId } : {}),
    ...(mergedKidIds.length > 0 ? { kidIds: mergedKidIds } : {}),
    ...(currentStudentNameClean ? {} : student.studentName ? { studentName: student.studentName } : {}),
    ...(currentKidNameClean ? {} : student.kidName ? { kidName: student.kidName } : {}),
    ...(currentChildNameClean ? {} : student.childName ? { childName: student.childName } : {}),
    ...(currentStudentFullNameClean ? {} : student.studentFullName ? { studentFullName: student.studentFullName } : {}),
    ...(currentKidFullNameClean ? {} : student.kidFullName ? { kidFullName: student.kidFullName } : {}),
    ...(currentChildFullNameClean ? {} : student.childFullName ? { childFullName: student.childFullName } : {}),
    ...(toOptionalId((existing as any).courseId) ? {} : enrollment.courseId ? { courseId: enrollment.courseId } : {}),
    ...(shouldReplaceCourseSnapshot && enrollment.courseName ? { courseName: enrollment.courseName, courseTitle: enrollment.courseName } : {}),
    ...(toOptionalId((existing as any).parentId) ? {} : enrollment.parentId ? { parentId: enrollment.parentId } : {}),
    ...(parentIds.length > 0 ? { parentIds } : {}),
    ...buildTeacherReassignmentJoinLinkPatch(enrollment.joinUrl),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorIdentity,
    reassignedFromTeacherId: previousTeacherId || null,
    teacherReassignedFrom: previousTeacherId || null,
    ...(previousTeacherId ? { previousTeacherId } : {}),
    ...(previousTeacherName ? { previousTeacherName } : {}),
    ...(previousTeacherEmail ? { previousTeacherEmail } : {}),
    reassignedAt: FieldValue.serverTimestamp(),
    teacherReassignedAt: FieldValue.serverTimestamp(),
  }) as Record<string, unknown>;
}

async function syncKidTeacherOwnership(args: {
  db: FirebaseFirestore.Firestore;
  kidId: string;
  newTeacherId: string;
  enrollmentId: string;
  actorIdentity: string | null;
}): Promise<KidSyncSummary> {
  const { db, kidId, newTeacherId, enrollmentId, actorIdentity } = args;
  const kidRef = db.collection('kids').doc(kidId);
  const kidSnap = await kidRef.get();
  if (!kidSnap.exists) {
    return { kidUpdated: false, teacherIds: [newTeacherId], primaryTeacherId: newTeacherId };
  }

  const enrollmentQueries = [
    db.collection('enrollments').where('kidId', '==', kidId),
    db.collection('enrollments').where('studentId', '==', kidId),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId),
  ];
  const activeTeacherIds = new Set<string>();
  const seenEnrollmentIds = new Set<string>();
  for (const enrollmentQuery of enrollmentQueries) {
    const snap = await enrollmentQuery.get();
    snap.docs.forEach((docSnap) => {
      if (seenEnrollmentIds.has(docSnap.id)) return;
      seenEnrollmentIds.add(docSnap.id);
      const data = (docSnap.data() || {}) as Record<string, unknown>;
      if (!isActiveLikeEnrollmentStatus(data.status) && docSnap.id !== enrollmentId) return;
      collectTeacherIds(data).forEach((teacherId) => activeTeacherIds.add(teacherId));
    });
  }
  activeTeacherIds.add(newTeacherId);

  const kidData = (kidSnap.data() || {}) as Record<string, unknown>;
  const currentPrimaryTeacherId = toOptionalId((kidData as any).teacherId);
  const nextTeacherIds = Array.from(activeTeacherIds);
  let nextPrimaryTeacherId: string | null = currentPrimaryTeacherId;
  if (nextTeacherIds.length === 1) {
    nextPrimaryTeacherId = nextTeacherIds[0];
  } else if (!nextPrimaryTeacherId || !activeTeacherIds.has(nextPrimaryTeacherId)) {
    nextPrimaryTeacherId = newTeacherId;
  }

  const patch = removeUndefinedDeep({
    teacherIds: nextTeacherIds,
    ...(nextPrimaryTeacherId ? { teacherId: nextPrimaryTeacherId } : {}),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorIdentity,
  }) as Record<string, unknown>;
  await kidRef.set(patch, { merge: true });

  return {
    kidUpdated: true,
    teacherIds: nextTeacherIds,
    primaryTeacherId: nextPrimaryTeacherId,
  };
}

function hasAttendanceMarked(raw: Record<string, unknown>): boolean {
  const attendance = raw.attendance;
  if (!attendance) return false;
  if (attendance === null) return false;
  if (typeof attendance !== 'object') return true;
  if (Array.isArray(attendance)) return attendance.length > 0;
  return Object.keys(attendance as Record<string, unknown>).length > 0;
}

function hasSessionFinanceOrLockMarkers(raw: Record<string, unknown>): boolean {
  if (raw.revenueAccrued === true) return true;
  if (Number(raw.accruedAmount || 0) > 0) return true;
  if (typeof raw.accruedMonthKey === 'string' && raw.accruedMonthKey.trim()) return true;
  if (raw.creditsProcessed === true || raw.creditsProcessing === true) return true;
  if (raw.locked === true || raw.isLocked === true) return true;

  const markerFields = ['lockedAt', 'consumedAt', 'settledAt', 'paidAt', 'billedAt', 'invoicedAt'] as const;
  for (const field of markerFields) {
    if (raw[field]) return true;
  }

  const statusLikeFields = ['billingStatus', 'paymentStatus', 'earningStatus'] as const;
  for (const field of statusLikeFields) {
    const normalized = normalizeStatusValue(raw[field]);
    if (normalized === 'paid' || normalized === 'settled' || normalized === 'consumed' || normalized === 'locked') {
      return true;
    }
  }

  return false;
}

function isScheduleExceptionSession(raw: Record<string, unknown>): boolean {
  if (raw.isAdHoc === true || raw.isMakeup === true) return true;
  if (
    raw.makeupCreditId ||
    raw.makeupForSessionId ||
    raw.rescheduledFromSessionId ||
    raw.replacementSessionId
  ) return true;

  const adHocType = String(raw.adHocType || '').trim().toLowerCase();
  if (adHocType && (adHocType.includes('one_off') || adHocType.includes('adhoc') || adHocType.includes('ad_hoc'))) {
    return true;
  }

  const signals = [raw.source, raw.sessionType, raw.createdByFlow]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  return signals.some((signal) =>
    SCHEDULE_EXCEPTION_SOURCE_TOKENS.some((token) => signal.includes(token)),
  );
}

function buildEnrollmentCanonicalPatch(enrollmentId: string, enrollment: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    enrollmentId,
  };

  const kidId = resolveKidIdFromEnrollment(enrollment);
  const kidIds = toStringList(enrollment.kidIds);
  if (kidId && !kidIds.includes(kidId)) kidIds.unshift(kidId);
  if (kidId) patch.kidId = kidId;
  if (kidIds.length > 0) patch.kidIds = kidIds;

  const parentIds = toStringList(enrollment.parentIds);
  const parentId = toOptionalId(enrollment.parentId) || parentIds[0] || null;
  if (parentId && !parentIds.includes(parentId)) parentIds.unshift(parentId);
  if (parentId) patch.parentId = parentId;
  if (parentIds.length > 0) patch.parentIds = parentIds;

  const teacherIds = toStringList(enrollment.teacherIds);
  const teacherId =
    toOptionalId(enrollment.teacherId) ||
    toOptionalId((enrollment as any).assignedTeacherId) ||
    toOptionalId((enrollment as any).assignedTeacher) ||
    teacherIds[0] ||
    null;
  if (teacherId && !teacherIds.includes(teacherId)) teacherIds.unshift(teacherId);
  if (teacherId) patch.teacherId = teacherId;
  if (teacherIds.length > 0) patch.teacherIds = teacherIds;

  return patch;
}

export function isLifecycleSessionProtected(raw: Record<string, unknown>): boolean {
  const status = normalizeStatusValue(raw.status);
  if (NON_REASSIGNABLE_SESSION_STATUSES.has(status) || status === 'paused') return true;
  if (hasAttendanceMarked(raw) || hasSessionFinanceOrLockMarkers(raw)) return true;
  return isScheduleExceptionSession(raw);
}

export function isEligibleFutureSessionForLifecycleCancellation(
  raw: Record<string, unknown>,
  nowMs: number,
): boolean {
  return resolveSessionIsFuture(raw, nowMs) && !isLifecycleSessionProtected(raw);
}

async function hasExternalFinancialLink(
  db: FirebaseFirestore.Firestore,
  docSnap: FirebaseFirestore.DocumentSnapshot,
): Promise<boolean> {
  try {
    const [chargeSnap, earningSnap] = await Promise.all([
      db.collection('billingCharges').doc(docSnap.id).get(),
      db.collection('teacherEarnings').doc(docSnap.id).get(),
    ]);
    if (chargeSnap.exists || earningSnap.exists) return true;

    const raw = (docSnap.data() || {}) as Record<string, unknown>;
    const enrollmentId = toOptionalId(raw.enrollmentId);
    const dateYmd = nonEmptyString(raw.date);
    const startTime = nonEmptyString(raw.startTime);
    if (!enrollmentId || !dateYmd || !startTime) return false;
    const [chargeFallbackSnap, earningFallbackSnap] = await Promise.all([
      db.collection('billingCharges')
        .where('enrollmentId', '==', enrollmentId)
        .where('date', '==', dateYmd)
        .where('startTime', '==', startTime)
        .limit(1)
        .get(),
      db.collection('teacherEarnings')
        .where('enrollmentId', '==', enrollmentId)
        .where('date', '==', dateYmd)
        .where('startTime', '==', startTime)
        .limit(1)
        .get(),
    ]);
    return !chargeFallbackSnap.empty || !earningFallbackSnap.empty;
  } catch (error) {
    logger.warn('Lifecycle cancellation skipped because finance links could not be verified', {
      sessionId: docSnap.id,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return true;
  }
}

const MANUAL_SESSION_SOURCE = 'admin_manual_adhoc';
const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function buildAdminManualSessionId(enrollmentId: string, date: string, startTime: string): string {
  return `${enrollmentId}_${date.replace(/-/g, '')}_${startTime.replace(':', '')}`;
}

export function resolveAdminManualSessionTimes(date: string, startTime: string, durationMins: number): {
  startAt: Date;
  endAt: Date;
  endTime: string;
  durationMins: number;
} {
  if (!YMD_PATTERN.test(date) || !TIME_PATTERN.test(startTime)) {
    throw new HttpsError('invalid-argument', 'date and startTime must use YYYY-MM-DD and HH:mm');
  }
  const duration = Math.max(10, Math.min(180, Math.floor(Number(durationMins))));
  if (!Number.isFinite(duration)) throw new HttpsError('invalid-argument', 'durationMins must be a number');
  const startAt = new Date(`${date}T${startTime}:00+05:30`);
  if (Number.isNaN(startAt.getTime())) throw new HttpsError('invalid-argument', 'Invalid manual session time');
  const endAt = new Date(startAt.getTime() + duration * 60_000);
  const istEnd = new Date(endAt.getTime() + 330 * 60_000);
  const endTime = `${String(istEnd.getUTCHours()).padStart(2, '0')}:${String(istEnd.getUTCMinutes()).padStart(2, '0')}`;
  return { startAt, endAt, endTime, durationMins: duration };
}

function isManualSessionDocument(raw: Record<string, unknown>): boolean {
  if (normalizeManualSessionState(raw.manualSessionState)) return true;
  if (raw.isAdHoc === true) return true;
  const adHocType = String(raw.adHocType || '').trim().toLowerCase();
  const source = String(raw.source || '').trim().toLowerCase();
  return adHocType.includes('one_off') || adHocType.includes('adhoc') || source === MANUAL_SESSION_SOURCE;
}

export const createAdminManualSession = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);
  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const date = String(request.data?.date || '').trim();
  const startTime = String(request.data?.startTime || '').trim();
  const reason = String(request.data?.reason || '').trim();
  const durationInput = Number(request.data?.durationMins);
  if (!enrollmentId || !reason) {
    throw new HttpsError('invalid-argument', 'enrollmentId and a non-empty reason are required');
  }
  const timing = resolveAdminManualSessionTimes(date, startTime, durationInput);
  const db = admin.firestore();
  const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists) throw new HttpsError('not-found', 'Enrollment not found');
  const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;
  const enrollmentStatus = normalizeEnrollmentStatus(enrollment.status);
  if (enrollmentStatus !== 'active' && enrollmentStatus !== 'trial') {
    throw new HttpsError('failed-precondition', 'Manual sessions require an operational enrollment');
  }
  const kidId = resolveKidIdFromEnrollment(enrollment);
  const courseId = toOptionalId(enrollment.courseId);
  const teacherResolution = resolveCanonicalTeacherIdForWrite(enrollment);
  if (teacherResolution.source === 'ambiguous_legacy') {
    throw new HttpsError(
      'failed-precondition',
      'Enrollment has conflicting legacy teacher identities. Repair canonical teacherId before creating a manual session.',
    );
  }
  const teacherId = teacherResolution.teacherId;
  if (!kidId || !courseId || !teacherId) {
    throw new HttpsError('failed-precondition', 'Enrollment is missing canonical child, course, or teacher identity');
  }
  const sessionId = buildAdminManualSessionId(enrollmentId, date, startTime);
  const sessionRef = db.collection('classSessions').doc(sessionId);
  const actor = request.auth?.uid || 'admin';
  const auditRef = db.collection('auditLogs').doc();
  const result = await db.runTransaction(async (tx) => {
    const existing = await tx.get(sessionRef);
    if (existing.exists) {
      const existingData = (existing.data() || {}) as Record<string, unknown>;
      if (
        isManualSessionDocument(existingData) &&
        normalizeManualSessionState(existingData.manualSessionState) === 'approved' &&
        String(existingData.enrollmentId || '') === enrollmentId
      ) {
        return { alreadyExisted: true };
      }
      throw new HttpsError('already-exists', 'A different session already exists for this enrollment, date, and time');
    }
    const kidIds = Array.from(new Set([kidId, ...toStringList(enrollment.kidIds)]));
    const parentIds = toStringList(enrollment.parentIds);
    const parentId = toOptionalId(enrollment.parentId) || parentIds[0] || null;
    const sessionPayload = removeUndefinedDeep({
      enrollmentId,
      kidId,
      kidIds,
      studentId: toOptionalId(enrollment.studentId) || kidId,
      studentName: toOptionalId(enrollment.studentName) || toOptionalId(enrollment.kidName),
      kidName: toOptionalId(enrollment.kidName) || toOptionalId(enrollment.studentName),
      parentId,
      parentIds,
      ...buildCanonicalTeacherWriteFields(teacherId),
      teacherName: toOptionalId(enrollment.teacherName),
      courseId,
      courseName: toOptionalId(enrollment.courseName) || toOptionalId(enrollment.courseLabel),
      date,
      startTime,
      endTime: timing.endTime,
      durationMinutes: timing.durationMins,
      durationMins: timing.durationMins,
      startAt: Timestamp.fromDate(timing.startAt),
      endAt: Timestamp.fromDate(timing.endAt),
      status: 'scheduled',
      attendance: null,
      isAdHoc: true,
      adHocType: 'admin_one_off',
      source: MANUAL_SESSION_SOURCE,
      manualSessionState: 'approved',
      manualSessionReason: reason,
      approvedBy: actor,
      approvedAt: FieldValue.serverTimestamp(),
      createdBy: actor,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(sessionRef, sessionPayload);
    tx.create(auditRef, {
      type: 'admin_manual_session_created',
      action: 'create',
      sessionId,
      enrollmentId,
      kidId,
      courseId,
      teacherId,
      reason,
      createdBy: actor,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { alreadyExisted: false };
  });
  return { ok: true, sessionId, ...result };
});

export const cancelAdminManualSession = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);
  const sessionId = String(request.data?.sessionId || '').trim();
  const reason = String(request.data?.reason || '').trim();
  if (!sessionId || !reason) throw new HttpsError('invalid-argument', 'sessionId and a non-empty reason are required');
  const db = admin.firestore();
  const sessionRef = db.collection('classSessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found');
  const raw = (sessionSnap.data() || {}) as Record<string, unknown>;
  if (!isManualSessionDocument(raw)) throw new HttpsError('failed-precondition', 'Only manual sessions can use this operation');
  const manualState = normalizeManualSessionState(raw.manualSessionState);
  const status = normalizeStatusValue(raw.status);
  if (manualState === 'cancelled' || manualState === 'withdrawn' || status === 'cancelled') {
    return { ok: true, sessionId, alreadyCancelled: true };
  }
  if (manualState === 'completed' || status === 'completed' || hasAttendanceMarked(raw) || hasSessionFinanceOrLockMarkers(raw)) {
    throw new HttpsError('failed-precondition', 'This manual session contains protected historical or financial data');
  }
  if (await hasExternalFinancialLink(db, sessionSnap)) {
    throw new HttpsError('failed-precondition', 'This manual session is linked to protected finance records');
  }
  const actor = request.auth?.uid || 'admin';
  const auditRef = db.collection('auditLogs').doc();
  const batch = db.batch();
  batch.set(sessionRef, {
    status: 'cancelled',
    manualSessionState: 'cancelled',
    manualSessionCancellationReason: reason,
    cancelledReason: 'admin_manual_session_cancelled',
    cancelledBy: actor,
    cancelledAt: FieldValue.serverTimestamp(),
    updatedBy: actor,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.create(auditRef, {
    type: 'admin_manual_session_cancelled',
    action: 'cancel',
    sessionId,
    enrollmentId: toOptionalId(raw.enrollmentId),
    kidId: toOptionalId(raw.kidId),
    courseId: toOptionalId(raw.courseId),
    teacherId: toOptionalId(raw.teacherId),
    reason,
    createdBy: actor,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { ok: true, sessionId, alreadyCancelled: false };
});

async function cancelEligibleFutureSessions(args: {
  docs: FirebaseFirestore.QueryDocumentSnapshot[];
  reason: string;
  actorUid: string | null;
  scope: 'enrollment' | 'kid';
}): Promise<number> {
  const db = admin.firestore();
  const nowMs = Date.now();
  const uniqueDocs = Array.from(new Map(args.docs.map((docSnap) => [docSnap.id, docSnap])).values());
  const candidates = uniqueDocs.filter((docSnap) =>
    isEligibleFutureSessionForLifecycleCancellation(
      (docSnap.data() || {}) as Record<string, unknown>,
      nowMs,
    ),
  );
  const financeChecks = await Promise.all(
    candidates.map(async (docSnap) => ({
      docSnap,
      protectedByFinance: await hasExternalFinancialLink(db, docSnap),
    })),
  );
  const eligible = financeChecks.filter((entry) => !entry.protectedByFinance).map((entry) => entry.docSnap);

  for (let index = 0; index < eligible.length; index += MAX_BATCH) {
    const batch = db.batch();
    eligible.slice(index, index + MAX_BATCH).forEach((docSnap) => {
      batch.set(docSnap.ref, {
        status: 'cancelled',
        cancelledReason: args.reason,
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: args.actorUid || 'system',
        lifecycleReconciliation: {
          scope: args.scope,
          reason: args.reason,
          reconciledAt: FieldValue.serverTimestamp(),
          reconciledBy: args.actorUid || 'system',
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: args.actorUid || 'system',
      }, { merge: true });
    });
    await batch.commit();
  }
  return eligible.length;
}

async function cancelFutureSessionsByEnrollmentId(enrollmentId: string, reason: string, actorUid: string | null) {
  const db = admin.firestore();
  const snap = await db.collection('classSessions').where('enrollmentId', '==', enrollmentId).get();
  return cancelEligibleFutureSessions({ docs: snap.docs, reason, actorUid, scope: 'enrollment' });
}

async function cancelFutureSessionsByKidId(kidId: string, reason: string, actorUid: string | null) {
  const db = admin.firestore();
  const [singleSnap, arraySnap] = await Promise.all([
    db.collection('classSessions').where('kidId', '==', kidId).get(),
    db.collection('classSessions').where('kidIds', 'array-contains', kidId).get(),
  ]);
  return cancelEligibleFutureSessions({
    docs: [...singleSnap.docs, ...arraySnap.docs],
    reason,
    actorUid,
    scope: 'kid',
  });
}

async function repairFutureSessionsForEnrollment(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  teacher: TeacherIdentity;
  previousTeacherId: string | null;
  previousTeacherName?: string | null;
  previousTeacherEmail?: string | null;
  actorIdentity: string | null;
  kidRecord?: Record<string, unknown>;
  dryRun?: boolean;
}) {
  const {
    enrollmentId,
    enrollment,
    teacher,
    previousTeacherId,
    previousTeacherName,
    previousTeacherEmail,
    actorIdentity,
    kidRecord,
    dryRun = false,
  } = args;
  const db = admin.firestore();
  const nowMs = Date.now();
  const studentIdentity = buildStudentIdentity({ enrollment, kid: kidRecord });
  const enrollmentIdentity = buildEnrollmentIdentity({ enrollmentId, enrollment });
  const queryCoverage = buildSessionRepairQueryCoverage(enrollmentId, studentIdentity);
  const primaryDocs = await Promise.all(
    queryCoverage.map((plan) =>
      getQueryDocs(db.collection('classSessions').where(plan.field, plan.op as any, plan.value)),
    ),
  );
  const allDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  primaryDocs.forEach((docs) => mergeDocMaps(allDocs, docs));

  const skipReasonCounts: Record<string, number> = {
    pastSession: 0,
    completedOrStatusLocked: 0,
    attendanceMarked: 0,
    financeLinked: 0,
    financeLinkUnverified: 0,
    makeupOrManual: 0,
    rescheduledOrException: 0,
    missingDateTime: 0,
    teacherMismatch: 0,
    courseMismatch: 0,
    kidMismatch: 0,
  };
  const incrementSkip = (reason: keyof typeof skipReasonCounts) => {
    skipReasonCounts[reason] = (skipReasonCounts[reason] || 0) + 1;
  };

  const checkFinanceLinked = async (
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<'linked' | 'clear' | 'unverified'> => {
    try {
      const [chargeSnap, earningSnap] = await Promise.all([
        db.collection('billingCharges').doc(sessionId).get(),
        db.collection('teacherEarnings').doc(sessionId).get(),
      ]);
      if (chargeSnap.exists || earningSnap.exists) {
        return 'linked';
      }

      const dateYmd = String(data.date || '').trim();
      const startTime = String(data.startTime || '').trim();
      if (!dateYmd || !startTime) {
        return 'unverified';
      }

      const [chargeFallbackSnap, earningFallbackSnap] = await Promise.all([
        db
          .collection('billingCharges')
          .where('enrollmentId', '==', enrollmentId)
          .where('date', '==', dateYmd)
          .where('startTime', '==', startTime)
          .limit(1)
          .get(),
        db
          .collection('teacherEarnings')
          .where('enrollmentId', '==', enrollmentId)
          .where('date', '==', dateYmd)
          .where('startTime', '==', startTime)
          .limit(1)
          .get(),
      ]);

      if (!chargeFallbackSnap.empty || !earningFallbackSnap.empty) {
        return 'linked';
      }
      return 'clear';
    } catch {
      return 'unverified';
    }
  };

  const docsToUpdate: Array<{
    ref: FirebaseFirestore.DocumentReference;
    patch: Record<string, unknown>;
    matchedBy: 'enrollmentId' | 'legacyIdentity';
    backfilledIdentity: boolean;
  }> = [];
  const previousTeacherIds = previousTeacherId ? [previousTeacherId] : [];
  let sessionsMatchedByEnrollmentId = 0;
  let sessionsMatchedByLegacyIdentity = 0;

  for (const docSnap of allDocs.values()) {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const matchedByEnrollmentId = toOptionalId((data as any).enrollmentId) === enrollmentId;
    const sessionKidIds = resolveSessionKidIds(data);
    const sessionTeacherIds = resolveSessionTeacherIds(data);
    const sessionCourseId = toOptionalId((data as any).courseId);
    const kidMatches =
      studentIdentity.kidIds.length === 0 ||
      sessionKidIds.some((kidId) => studentIdentity.kidIds.includes(kidId));
    if (!kidMatches) {
      incrementSkip('kidMismatch');
      continue;
    }
    if (
      enrollmentIdentity.courseId &&
      sessionCourseId &&
      sessionCourseId !== enrollmentIdentity.courseId
    ) {
      incrementSkip('courseMismatch');
      continue;
    }
    const legacyTeacherMatch =
      previousTeacherIds.length > 0 &&
      sessionTeacherIds.some((teacherId) => previousTeacherIds.includes(teacherId));
    if (!matchedByEnrollmentId && !legacyTeacherMatch) {
      incrementSkip('teacherMismatch');
      continue;
    }

    const hasStartAt = Boolean(data.startAt);
    const hasDateAndTime =
      typeof data.date === 'string' &&
      String(data.date).trim().length > 0 &&
      typeof data.startTime === 'string' &&
      String(data.startTime).trim().length > 0;
    if (!hasStartAt && !hasDateAndTime) {
      incrementSkip('missingDateTime');
      continue;
    }
    if (!resolveSessionIsFuture(data, nowMs)) {
      incrementSkip('pastSession');
      continue;
    }
    const status = normalizeStatusValue(data.status);
    if (NON_REASSIGNABLE_SESSION_STATUSES.has(status)) {
      if (status === 'rescheduled' || status === 'reschedule') {
        incrementSkip('rescheduledOrException');
      } else {
        incrementSkip('completedOrStatusLocked');
      }
      continue;
    }
    if (hasSessionFinanceOrLockMarkers(data)) {
      incrementSkip('completedOrStatusLocked');
      continue;
    }
    if (hasAttendanceMarked(data)) {
      incrementSkip('attendanceMarked');
      continue;
    }
    if (isScheduleExceptionSession(data)) {
      const source = String(data.source || '').trim().toLowerCase();
      if (source.includes('reschedule')) {
        incrementSkip('rescheduledOrException');
      } else {
        incrementSkip('makeupOrManual');
      }
      continue;
    }

    const financeLinkStatus = await checkFinanceLinked(docSnap.id, data);
    if (financeLinkStatus === 'linked') {
      incrementSkip('financeLinked');
      continue;
    }
    if (financeLinkStatus === 'unverified') {
      incrementSkip('financeLinkUnverified');
      continue;
    }

    const patch = buildSessionRepairPatch({
      existing: data,
      teacher,
      student: studentIdentity,
      enrollment: enrollmentIdentity,
      actorIdentity,
      previousTeacherId,
      previousTeacherName,
      previousTeacherEmail,
      includeEnrollmentId: !matchedByEnrollmentId,
    });
    const backfilledIdentity =
      (!nonEmptyString((data as any).studentName) && Boolean((patch as any).studentName)) ||
      (!nonEmptyString((data as any).kidName) && Boolean((patch as any).kidName)) ||
      (!nonEmptyString((data as any).childName) && Boolean((patch as any).childName)) ||
      (!nonEmptyString((data as any).courseName) && Boolean((patch as any).courseName)) ||
      (!Array.isArray((data as any).teacherIds) && Array.isArray((patch as any).teacherIds)) ||
      (!toOptionalId((data as any).enrollmentId) && Boolean((patch as any).enrollmentId));
    docsToUpdate.push({
      ref: docSnap.ref,
      patch,
      matchedBy: matchedByEnrollmentId ? 'enrollmentId' : 'legacyIdentity',
      backfilledIdentity,
    });
    if (matchedByEnrollmentId) {
      sessionsMatchedByEnrollmentId += 1;
    } else {
      sessionsMatchedByLegacyIdentity += 1;
    }
  }

  if (!dryRun) {
    for (let index = 0; index < docsToUpdate.length; index += MAX_BATCH) {
      const batch = db.batch();
      docsToUpdate.slice(index, index + MAX_BATCH).forEach((entry) => {
        batch.set(entry.ref, entry.patch, { merge: true });
      });
      await batch.commit();
    }
  }

  const sessionsScanned = allDocs.size;
  const sessionsSkipped = sessionsScanned - docsToUpdate.length;
  const summary = {
    sessionsScanned,
    sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity,
    sessionsUpdated: docsToUpdate.length,
    sessionsWouldUpdate: docsToUpdate.length,
    sessionsSkipped,
    identitySnapshotsBackfilled: docsToUpdate.filter((entry) => entry.backfilledIdentity).length,
    skipReasonCounts,
    queryCoverageUsed: queryCoverage.map((plan) => `${plan.source}:${plan.field}:${plan.op}${plan.legacy ? ':legacy' : ''}`),
    queriesAttempted: queryCoverage.length,
  };
  logger.info('repairFutureSessionsForEnrollment summary', {
    enrollmentId,
    kidId: studentIdentity.kidId,
    studentId: studentIdentity.studentId,
    childId: studentIdentity.childId,
    oldTeacherId: previousTeacherId || null,
    newTeacherId: teacher.teacherId,
    queriesAttempted: summary.queriesAttempted,
    queryCoverageUsed: summary.queryCoverageUsed,
    sessionsScanned: summary.sessionsScanned,
    sessionsUpdated: summary.sessionsUpdated,
    sessionsSkipped: summary.sessionsSkipped,
    skipReasonCounts: summary.skipReasonCounts,
    dryRun,
  });
  return summary;
}

export const setEnrollmentStatus = onCall({ region: REGION }, async (request) => {
  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const rawStatus = String(request.data?.status || '').trim();
  const reason = request.data?.reason ? String(request.data.reason) : null;
  const actor = request.auth?.uid || null;
  const callerRoleRaw = request.auth?.token?.role;
  const callerRolesRaw = request.auth?.token?.roles;
  const callerRole =
    typeof callerRoleRaw === 'string'
      ? callerRoleRaw
      : Array.isArray(callerRolesRaw)
        ? callerRolesRaw.filter((role) => typeof role === 'string').join(',')
        : 'unknown';

  if (!enrollmentId || !rawStatus) {
    throw new HttpsError('invalid-argument', 'enrollmentId and status are required');
  }

  try {
    await ensureAdmin(request.auth);

    const db = admin.firestore();
    const enrRef = db.collection('enrollments').doc(enrollmentId);
    const enrSnap = await enrRef.get();

    if (!enrSnap.exists) {
      throw new HttpsError('not-found', 'Enrollment not found');
    }

    const canonicalStatus = normalizeEnrollmentStatus(rawStatus);
    if (canonicalStatus === 'unknown') {
      throw new HttpsError('invalid-argument', `Unsupported enrollment status: ${rawStatus}`);
    }
    const isTerminal = TERMINAL.has(canonicalStatus);
    const enrollmentData = (enrSnap.data() || {}) as Record<string, unknown>;
    const previousStatus = normalizeEnrollmentStatus(enrollmentData.status);
    const isReactivation =
      (canonicalStatus === 'active' || canonicalStatus === 'trial') &&
      previousStatus !== 'active' &&
      previousStatus !== 'trial';
    const updates: Record<string, any> = {
      ...buildEnrollmentCanonicalPatch(enrollmentId, enrollmentData),
      status: canonicalStatus,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
    };

    if (reason) updates.endReason = reason;
    if (isTerminal) updates.endedAt = FieldValue.serverTimestamp();
    if (canonicalStatus === 'archived') {
      updates.archived = true;
      updates.isArchived = true;
      updates.archivedAt = FieldValue.serverTimestamp();
    } else if (canonicalStatus === 'active' || canonicalStatus === 'trial') {
      updates.archived = false;
      updates.isArchived = false;
      updates.archivedAt = FieldValue.delete();
      updates.endedAt = FieldValue.delete();
    }

    const cleanPatch = removeUndefinedDeep(updates) as Record<string, unknown>;
    console.log('[setEnrollmentStatus] writing patch keys', Object.keys(cleanPatch));
    const canonicalKidId = resolveKidIdFromEnrollment(enrollmentData);
    const canonicalCourseId = toOptionalId(enrollmentData.courseId);
    const shouldHoldCourseSlot = doesEnrollmentOccupyCourseSlot({
      ...enrollmentData,
      ...cleanPatch,
      status: canonicalStatus,
    });
    if (shouldHoldCourseSlot && (!canonicalKidId || !canonicalCourseId)) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot activate or pause an enrollment without canonical child and course identity',
      );
    }
    if (isReactivation && canonicalKidId && canonicalCourseId) {
      const conflicts = await findOperationalSameCourseEnrollmentIds({
        db,
        kidId: canonicalKidId,
        courseId: canonicalCourseId,
        excludeEnrollmentId: enrollmentId,
      });
      if (conflicts.length > 0) {
        throw new HttpsError(
          'already-exists',
          `Another operational enrollment already exists for this child and course: ${conflicts[0]}`,
        );
      }
    }
    const courseSlotRef = canonicalKidId && canonicalCourseId
      ? db.collection(OPERATIONAL_ENROLLMENT_KEYS_COLLECTION)
          .doc(buildOperationalEnrollmentKeyId(canonicalKidId, canonicalCourseId))
      : null;
    await db.runTransaction(async (tx) => {
      const keySnap = courseSlotRef ? await tx.get(courseSlotRef) : null;
      if (shouldHoldCourseSlot && keySnap?.exists && keySnap.data()?.enrollmentId !== enrollmentId) {
        throw new HttpsError('already-exists', 'Another enrollment already reserves this child and course');
      }
      tx.set(enrRef, cleanPatch, { merge: true });
      if (courseSlotRef && shouldHoldCourseSlot) {
        tx.set(courseSlotRef, {
          enrollmentId,
          kidId: canonicalKidId,
          courseId: canonicalCourseId,
          heldAt: FieldValue.serverTimestamp(),
          heldBy: actor || 'system',
        }, { merge: true });
      } else if (courseSlotRef && keySnap?.exists && keySnap.data()?.enrollmentId === enrollmentId) {
        tx.delete(courseSlotRef);
      }
    });

    let cancelledSessions = 0;
    if (canonicalStatus === 'paused') {
      cancelledSessions = await cancelFutureSessionsByEnrollmentId(enrollmentId, 'enrollment_paused', actor);
    } else if (isTerminal) {
      const cancellationReason = canonicalStatus === 'archived' ? 'enrollment_archived' : 'enrollment_ended';
      cancelledSessions = await cancelFutureSessionsByEnrollmentId(enrollmentId, cancellationReason, actor);
    }

    const reconciliation = isReactivation && enrollmentHasConfiguredSchedule(enrollmentData)
      ? await repairEnrollmentFutureSessionsFromScheduleInternal({
          enrollmentId,
          dryRun: false,
          actorUid: actor,
        })
      : null;

    return {
      ok: true,
      updatedEnrollmentId: enrollmentId,
      cancelledSessionsCount: cancelledSessions,
      reactivated: isReactivation,
      reconciliation,
      message: `Enrollment set to ${canonicalStatus}`,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error('[setEnrollmentStatus] unexpected failure', {
      enrollmentId,
      requestedStatus: rawStatus || 'unknown',
      callerUid: actor,
      callerRole,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    logger.error('setEnrollmentStatus failed', {
      enrollmentId,
      requestedStatus: rawStatus || 'unknown',
      reason: reason || null,
      actor,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new HttpsError('internal', 'Failed to update enrollment status. Please retry or contact support.');
  }
});

export const reassignEnrollmentTeacher = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const newTeacherId = String(request.data?.newTeacherId || '').trim();

  if (!enrollmentId || !newTeacherId) {
    throw new HttpsError('invalid-argument', 'enrollmentId and newTeacherId are required');
  }
  const actorIdentity =
    (typeof request.auth?.token?.email === 'string' && request.auth?.token?.email.trim())
      ? request.auth.token.email.trim()
      : (request.auth?.uid || null);

  const db = admin.firestore();
  const enrRef = db.collection('enrollments').doc(enrollmentId);
  const enrSnap = await enrRef.get();

  if (!enrSnap.exists) {
    throw new HttpsError('not-found', 'Enrollment not found');
  }

  const enrollment = (enrSnap.data() || {}) as Record<string, unknown>;
  const canonicalKidId = toOptionalId(enrollment.kidId);
  if (!canonicalKidId) {
    throw new HttpsError(
      'failed-precondition',
      'Cannot reassign teacher because this enrollment has a broken student link. Repair the student link first.'
    );
  }

  const canonicalKidSnap = await db.collection('kids').doc(canonicalKidId).get();
  if (!canonicalKidSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Cannot reassign teacher because the linked child profile no longer exists.'
    );
  }

  const courseId = toOptionalId(enrollment.courseId) || toOptionalId((enrollment as any).course_id) || toOptionalId((enrollment as any).course);
  if (courseId) {
    const duplicatesSnap = await db
      .collection('enrollments')
      .where('kidId', '==', canonicalKidId)
      .where('courseId', '==', courseId)
      .get();
    const hasOtherActiveLike = duplicatesSnap.docs.some((docSnap) => {
      if (docSnap.id === enrollmentId) return false;
      const data = docSnap.data() || {};
      const archived = data.archived === true || Boolean(data.archivedAt);
      if (archived) return false;
      const status = normalizeEnrollmentStatus(String(data.status || ''));
      return !TERMINAL.has(status);
    });
    if (hasOtherActiveLike) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot reassign teacher because another active enrollment exists for the same child and course. Resolve duplicate active enrollments first.'
      );
    }
  }

  const previousTeacherId = toOptionalId(enrollment.teacherId);
  const previousTeacherNameFromEnrollment = toOptionalId((enrollment as any).teacherName);
  const previousTeacherEmailFromEnrollment = toOptionalId((enrollment as any).teacherEmail);
  if (previousTeacherId && previousTeacherId === newTeacherId) {
    throw new HttpsError('failed-precondition', 'Selected teacher is already assigned to this enrollment.');
  }
  const teacherSnap = await db.collection('users').doc(newTeacherId).get();
  if (!teacherSnap.exists) {
    throw new HttpsError('failed-precondition', 'Selected teacher profile does not exist.');
  }
  const teacherData = (teacherSnap.data() || {}) as Record<string, unknown>;
  const teacherRole = normalizeStatusValue((teacherData as any).role);
  const teacherRoles = Array.isArray((teacherData as any).roles)
    ? ((teacherData as any).roles as unknown[])
        .map((role) => normalizeStatusValue(role))
        .filter(Boolean)
    : [];
  if (teacherRole !== 'teacher' && !teacherRoles.includes('teacher')) {
    throw new HttpsError('failed-precondition', 'Selected user is not a teacher.');
  }

  const newTeacherDisplayName = toOptionalId((teacherData as any).displayName);
  const newTeacherEmail = toOptionalId((teacherData as any).email);
  const newTeacherName = newTeacherDisplayName
    || toOptionalId((teacherData as any).name)
    || newTeacherEmail
    || newTeacherId;

  let previousTeacherName = previousTeacherNameFromEnrollment;
  let previousTeacherEmail = previousTeacherEmailFromEnrollment;
  if (previousTeacherId && (!previousTeacherName || !previousTeacherEmail)) {
    const previousTeacherSnap = await db.collection('users').doc(previousTeacherId).get();
    if (previousTeacherSnap.exists) {
      const previousTeacherData = (previousTeacherSnap.data() || {}) as Record<string, unknown>;
      if (!previousTeacherName) {
        previousTeacherName =
          toOptionalId((previousTeacherData as any).displayName) ||
          toOptionalId((previousTeacherData as any).name) ||
          null;
      }
      if (!previousTeacherEmail) {
        previousTeacherEmail = toOptionalId((previousTeacherData as any).email);
      }
    }
  }
  const reassignmentReason = toOptionalId(request.data?.reassignmentReason);
  const replacementJoinUrl =
    nonEmptyString(request.data?.joinUrl) ||
    nonEmptyString(request.data?.meetingLink) ||
    nonEmptyString(request.data?.classLink) ||
    null;
  const teacherIdentity = buildTeacherIdentity({
    teacherId: newTeacherId,
    teacherName: newTeacherName,
    teacherDisplayName: newTeacherDisplayName || newTeacherName,
    teacherEmail: newTeacherEmail,
  });
  const studentIdentity = buildStudentIdentity({
    enrollment,
    kid: canonicalKidSnap.exists ? ({ id: canonicalKidSnap.id, ...(canonicalKidSnap.data() || {}) } as Record<string, unknown>) : undefined,
  });
  const enrollmentIdentity = buildEnrollmentIdentity({ enrollmentId, enrollment });

  const enrollmentPatch: Record<string, unknown> = {
    ...buildCanonicalTeacherWriteFields(newTeacherId),
    teacherName: newTeacherName,
    teacherEmail: newTeacherEmail || null,
    teacherDisplayName: newTeacherDisplayName || newTeacherName,
    ...(studentIdentity.kidId ? { kidId: studentIdentity.kidId } : {}),
    ...(studentIdentity.studentId ? { studentId: studentIdentity.studentId } : {}),
    ...(studentIdentity.kidIds.length > 0 ? { kidIds: studentIdentity.kidIds } : {}),
    ...(studentIdentity.studentName ? { studentName: studentIdentity.studentName } : {}),
    ...(studentIdentity.kidName ? { kidName: studentIdentity.kidName } : {}),
    ...(studentIdentity.childName ? { childName: studentIdentity.childName } : {}),
    ...(enrollmentIdentity.courseId ? { courseId: enrollmentIdentity.courseId } : {}),
    ...(enrollmentIdentity.courseName ? { courseName: enrollmentIdentity.courseName } : {}),
    ...(enrollmentIdentity.parentId ? { parentId: enrollmentIdentity.parentId } : {}),
    ...(enrollmentIdentity.parentIds.length > 0 ? { parentIds: enrollmentIdentity.parentIds } : {}),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorIdentity,
    teacherReassignedAt: FieldValue.serverTimestamp(),
    teacherReassignedBy: actorIdentity,
    reassignedAt: FieldValue.serverTimestamp(),
    reassignedBy: actorIdentity,
    previousTeacherId: previousTeacherId || null,
    previousTeacherName: previousTeacherName || null,
    previousTeacherEmail: previousTeacherEmail || null,
    ...buildTeacherReassignmentJoinLinkPatch(replacementJoinUrl),
  };
  if (reassignmentReason) enrollmentPatch.reassignmentReason = reassignmentReason;

  const cleanEnrollmentPatch = removeUndefinedDeep(enrollmentPatch) as Record<string, unknown>;
  await enrRef.set(cleanEnrollmentPatch, { merge: true });

  const sessionUpdateSummary = await repairFutureSessionsForEnrollment({
    enrollmentId,
    enrollment: {
      ...enrollment,
      ...cleanEnrollmentPatch,
    },
    teacher: teacherIdentity,
    previousTeacherId,
    previousTeacherName,
    previousTeacherEmail,
    actorIdentity,
    kidRecord: canonicalKidSnap.exists ? ({ id: canonicalKidSnap.id, ...(canonicalKidSnap.data() || {}) } as Record<string, unknown>) : undefined,
  });
  logger.info('reassignEnrollmentTeacher completed', {
    enrollmentId,
    kidId: canonicalKidId,
    studentId: studentIdentity.studentId,
    childId: studentIdentity.childId,
    oldTeacherId: previousTeacherId || null,
    newTeacherId,
    queriesAttempted: sessionUpdateSummary.queriesAttempted,
    queryCoverageUsed: sessionUpdateSummary.queryCoverageUsed,
    sessionsScanned: sessionUpdateSummary.sessionsScanned,
    sessionsUpdated: sessionUpdateSummary.sessionsUpdated,
    sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
    skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
  });
  const kidSyncSummary = isActiveLikeEnrollmentStatus(enrollment.status)
    ? await syncKidTeacherOwnership({
        db,
        kidId: canonicalKidId,
        newTeacherId,
        enrollmentId,
        actorIdentity,
      })
    : { kidUpdated: false, teacherIds: [], primaryTeacherId: null };

  const auditRef = enrRef.collection('teacherReassignments').doc();
  await auditRef.set(
    {
      enrollmentId,
      kidId: canonicalKidId,
      studentId:
        toOptionalId((enrollment as any).studentId) ||
        toOptionalId((enrollment as any).kidId) ||
        null,
      studentName:
        toOptionalId((enrollment as any).studentName) ||
        toOptionalId((enrollment as any).childName) ||
        toOptionalId((enrollment as any).kidName) ||
        null,
      courseId: courseId || null,
      courseName:
        toOptionalId((enrollment as any).courseName) ||
        toOptionalId((enrollment as any).courseTitle) ||
        null,
      oldTeacherId: previousTeacherId || null,
      oldTeacherName: previousTeacherName || null,
      oldTeacherEmail: previousTeacherEmail || null,
      newTeacherId,
      newTeacherName,
      newTeacherEmail: newTeacherEmail || null,
      changedBy: actorIdentity,
      changedAt: FieldValue.serverTimestamp(),
      reason: reassignmentReason || null,
      sessionsScanned: sessionUpdateSummary.sessionsScanned,
      sessionsMatchedByEnrollmentId: sessionUpdateSummary.sessionsMatchedByEnrollmentId,
      sessionsMatchedByLegacyIdentity: sessionUpdateSummary.sessionsMatchedByLegacyIdentity,
      sessionsUpdated: sessionUpdateSummary.sessionsUpdated,
      sessionsWouldUpdate: sessionUpdateSummary.sessionsWouldUpdate,
      sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
      identitySnapshotsBackfilled: sessionUpdateSummary.identitySnapshotsBackfilled,
      skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
      queryCoverageUsed: sessionUpdateSummary.queryCoverageUsed,
      queriesAttempted: sessionUpdateSummary.queriesAttempted,
      kidUpdated: kidSyncSummary.kidUpdated,
      kidTeacherIds: kidSyncSummary.teacherIds,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    updatedEnrollmentId: enrollmentId,
    updatedSessionsCount: sessionUpdateSummary.sessionsUpdated,
    sessionsScanned: sessionUpdateSummary.sessionsScanned,
    sessionsMatchedByEnrollmentId: sessionUpdateSummary.sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity: sessionUpdateSummary.sessionsMatchedByLegacyIdentity,
    sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
    identitySnapshotsBackfilled: sessionUpdateSummary.identitySnapshotsBackfilled,
    sessionsWouldUpdate: sessionUpdateSummary.sessionsWouldUpdate,
    kidsUpdated: kidSyncSummary.kidUpdated ? 1 : 0,
    skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
    queryCoverageUsed: sessionUpdateSummary.queryCoverageUsed,
    queriesAttempted: sessionUpdateSummary.queriesAttempted,
    message: 'Enrollment teacher updated',
  };
});

export const repairEnrollmentTeacherSessionConsistency = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const dryRun = request.data?.dryRun === undefined ? true : Boolean(request.data?.dryRun);
  const enrollmentIdFilter = toOptionalId(request.data?.enrollmentId);
  const db = admin.firestore();
  const actorIdentity =
    (typeof request.auth?.token?.email === 'string' && request.auth?.token?.email.trim())
      ? request.auth.token.email.trim()
      : (request.auth?.uid || null);

  const enrollmentDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  if (enrollmentIdFilter) {
    const enrollmentSnap = await db.collection('enrollments').doc(enrollmentIdFilter).get();
    if (enrollmentSnap.exists) {
      enrollmentDocs.push(enrollmentSnap as FirebaseFirestore.QueryDocumentSnapshot);
    }
  } else {
    const enrollmentsSnap = await db.collection('enrollments').get();
    enrollmentDocs.push(...enrollmentsSnap.docs);
  }

  let totalEnrollmentsScanned = 0;
  let sessionsScanned = 0;
  let sessionsMatchedByEnrollmentId = 0;
  let sessionsMatchedByLegacyIdentity = 0;
  let sessionsUpdated = 0;
  let sessionsSkipped = 0;
  let kidsUpdated = 0;
  let identitySnapshotsBackfilled = 0;
  const skipReasonCounts: Record<string, number> = {};
  const queryCoverageUsed = new Set<string>();
  let queriesAttempted = 0;

  for (const docSnap of enrollmentDocs) {
    const enrollment = (docSnap.data() || {}) as Record<string, unknown>;
    if (!isActiveLikeEnrollmentStatus(enrollment.status)) continue;
    const teacherId = toOptionalId(enrollment.teacherId);
    const kidId = resolveKidIdFromEnrollment(enrollment);
    if (!teacherId || !kidId) continue;

    totalEnrollmentsScanned += 1;
    const kidSnap = await db.collection('kids').doc(kidId).get();
    const summary = await repairFutureSessionsForEnrollment({
      enrollmentId: docSnap.id,
      enrollment,
      teacher: buildTeacherIdentity({
        teacherId,
        teacherName:
          toOptionalId((enrollment as any).teacherName) ||
          toOptionalId((enrollment as any).teacherDisplayName) ||
          teacherId,
        teacherDisplayName:
          toOptionalId((enrollment as any).teacherDisplayName) ||
          toOptionalId((enrollment as any).teacherName) ||
          teacherId,
        teacherEmail: toOptionalId((enrollment as any).teacherEmail),
      }),
      previousTeacherId:
        toOptionalId((enrollment as any).previousTeacherId) ||
        teacherId,
      previousTeacherName: toOptionalId((enrollment as any).previousTeacherName),
      previousTeacherEmail: toOptionalId((enrollment as any).previousTeacherEmail),
      actorIdentity,
      kidRecord: kidSnap.exists ? ({ id: kidSnap.id, ...(kidSnap.data() || {}) } as Record<string, unknown>) : undefined,
      dryRun,
    });
    sessionsScanned += summary.sessionsScanned;
    sessionsMatchedByEnrollmentId += summary.sessionsMatchedByEnrollmentId;
    sessionsMatchedByLegacyIdentity += summary.sessionsMatchedByLegacyIdentity;
    sessionsUpdated += summary.sessionsUpdated;
    sessionsSkipped += summary.sessionsSkipped;
    identitySnapshotsBackfilled += summary.identitySnapshotsBackfilled;
    queriesAttempted += summary.queriesAttempted;
    summary.queryCoverageUsed.forEach((entry) => queryCoverageUsed.add(entry));
    Object.entries(summary.skipReasonCounts).forEach(([key, value]) => {
      skipReasonCounts[key] = (skipReasonCounts[key] || 0) + value;
    });

    if (!dryRun) {
      const kidSummary = await syncKidTeacherOwnership({
        db,
        kidId,
        newTeacherId: teacherId,
        enrollmentId: docSnap.id,
        actorIdentity,
      });
      if (kidSummary.kidUpdated) kidsUpdated += 1;
    }
  }

  logger.info('repairEnrollmentTeacherSessionConsistency completed', {
    dryRun,
    totalEnrollmentsScanned,
    sessionsScanned,
    sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity,
    sessionsUpdated,
    sessionsWouldUpdate: sessionsUpdated,
    sessionsSkipped,
    kidsUpdated,
    identitySnapshotsBackfilled,
    skipReasonCounts,
    queriesAttempted,
    queryCoverageUsed: Array.from(queryCoverageUsed),
  });

  return {
    ok: true,
    dryRun,
    totalEnrollmentsScanned,
    sessionsScanned,
    sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity,
    sessionsUpdated,
    sessionsWouldUpdate: sessionsUpdated,
    sessionsSkipped,
    skipReasonCounts,
    kidsUpdated,
    identitySnapshotsBackfilled,
    queriesAttempted,
    queryCoverageUsed: Array.from(queryCoverageUsed),
  };
});

export const archiveKid = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const kidId = String(request.data?.kidId || '').trim();
  const reason = request.data?.reason ? String(request.data.reason) : null;

  if (!kidId) {
    throw new HttpsError('invalid-argument', 'kidId is required');
  }

  const db = admin.firestore();
  const kidRef = db.collection('kids').doc(kidId);
  const kidSnap = await kidRef.get();

  if (!kidSnap.exists) {
    throw new HttpsError('not-found', 'Kid not found');
  }

  const enrollments: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  const queries = [
    db.collection('enrollments').where('kidId', '==', kidId),
    db.collection('enrollments').where('studentId', '==', kidId),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId),
  ];

  for (const q of queries) {
    const snap = await q.get();
    snap.docs.forEach((docSnap) => enrollments.push(docSnap));
  }

  const seen = new Set<string>();
  for (const docSnap of enrollments) {
    if (seen.has(docSnap.id)) continue;
    seen.add(docSnap.id);
    const status = normalizeEnrollmentStatus((docSnap.data() as any)?.status || '');
    const activeLike = status === 'active' || status === 'trial';
    if (activeLike) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot archive kid with active enrollments'
      );
    }
  }

  await kidRef.set(
    {
      status: 'archived',
      archivedAt: FieldValue.serverTimestamp(),
      archivedReason: reason || null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid || null,
    },
    { merge: true }
  );

  const cancelledSessions = await cancelFutureSessionsByKidId(
    kidId,
    'kid_archived',
    request.auth?.uid || null,
  );

  return {
    ok: true,
    cancelledSessionsCount: cancelledSessions,
    message: 'Kid archived',
  };
});
