import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { ensureSchoolManager } from './helpers/schoolAuthorization';
import {
  curriculumPercent,
  requireSchoolCourse,
  requireSchoolStage,
} from './helpers/schoolCurriculum';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const CORE_TRAINING_TRACK_ID = 'tiny-steps-school-phonics-v1';
const CORE_TRAINING_TRACK_LABEL = 'Tiny Steps School Phonics Training';
const CORE_TRAINING_TOTAL = 6;

const required = (value: unknown, field: string, max = 128): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }
  const next = value.trim();
  if (next.length > max) throw new HttpsError('invalid-argument', `${field} is too long`);
  return next;
};

const optional = (value: unknown, max = 1000): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Expected a string');
  const next = value.trim();
  if (!next) return null;
  if (next.length > max) throw new HttpsError('invalid-argument', 'Text is too long');
  return next;
};

const integer = (value: unknown, field: string, min: number, max: number): number => {
  const next = Number(value);
  if (!Number.isInteger(next) || next < min || next > max) {
    throw new HttpsError('invalid-argument', `${field} must be an integer between ${min} and ${max}`);
  }
  return next;
};

const progressStatus = (
  value: unknown,
  stageOrder: number,
  totalStages: number,
): 'not_started' | 'on_track' | 'needs_attention' | 'completed' => {
  if (stageOrder === 0) return 'not_started';
  const next = String(
    value || (stageOrder === totalStages ? 'completed' : 'on_track'),
  ).trim().toLowerCase();
  if (
    next === 'not_started' ||
    next === 'on_track' ||
    next === 'needs_attention' ||
    next === 'completed'
  ) {
    if (next === 'not_started' && stageOrder > 0) {
      throw new HttpsError('invalid-argument', 'A started curriculum stage cannot be marked not started');
    }
    return next;
  }
  throw new HttpsError('invalid-argument', 'Invalid curriculum progress status');
};

const trainingStatus = (
  value: unknown,
  completedUnits: number,
): 'not_started' | 'on_track' | 'training_due' | 'completed' => {
  if (completedUnits === 0) return 'not_started';
  if (completedUnits === CORE_TRAINING_TOTAL) return 'completed';
  const next = String(value || 'on_track').trim().toLowerCase();
  if (next === 'on_track' || next === 'training_due') return next;
  throw new HttpsError('invalid-argument', 'Invalid teacher training status');
};

async function requireAcademicYear(
  schoolId: string,
  academicYearId: string,
): Promise<admin.firestore.DocumentReference> {
  const ref = admin
    .firestore()
    .collection('schools')
    .doc(schoolId)
    .collection('academicYears')
    .doc(academicYearId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Academic year not found');
  const data = snap.data() || {};
  if (String(data.status || '').toLowerCase() === 'closed') {
    throw new HttpsError(
      'failed-precondition',
      'Closed academic years are read-only. Make the year current before updating programme progress.',
    );
  }
  return ref;
}

async function requireSection(
  yearRef: admin.firestore.DocumentReference,
  sectionId: string,
): Promise<admin.firestore.DocumentSnapshot> {
  const snap = await yearRef.collection('sections').doc(sectionId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Section not found');
  return snap;
}

export const schoolUpdateCurriculumProgress = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = required(request.data?.schoolId, 'schoolId');
    const academicYearId = required(request.data?.academicYearId, 'academicYearId');
    const sectionId = required(request.data?.sectionId, 'sectionId');
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const yearRef = await requireAcademicYear(schoolId, academicYearId);
    const sectionSnap = await requireSection(yearRef, sectionId);
    const section = sectionSnap.data() || {};
    if (String(section.status || 'active').toLowerCase() !== 'active') {
      throw new HttpsError('failed-precondition', 'Curriculum progress can only be updated for active sections');
    }

    const course = requireSchoolCourse(request.data?.courseId);
    const requestedStageOrder = Number(request.data?.stageOrder);
    if (
      !Number.isInteger(requestedStageOrder) ||
      requestedStageOrder < 0 ||
      requestedStageOrder > course.stages.length
    ) {
      throw new HttpsError(
        'invalid-argument',
        `stageOrder must be an integer from 0 to ${course.stages.length}`,
      );
    }
    const stage = requireSchoolStage(course, requestedStageOrder);
    const status = progressStatus(
      request.data?.status,
      requestedStageOrder,
      course.stages.length,
    );
    const notes = optional(request.data?.notes, 1200);

    const db = admin.firestore();
    const currentRef = yearRef.collection('curriculumProgress').doc(sectionId);
    const historyRef = yearRef.collection('curriculumProgressHistory').doc();

    await db.runTransaction(async (tx) => {
      const previousSnap = await tx.get(currentRef);
      const previous = previousSnap.exists ? previousSnap.data() || {} : {};
      const now = admin.firestore.FieldValue.serverTimestamp();
      const current = {
        schemaVersion: 2,
        schoolId,
        academicYearId,
        sectionId,
        gradeId: String(section.gradeId || ''),
        gradeKey: String(section.gradeKey || ''),
        gradeLabel: String(section.gradeLabel || ''),
        sectionName: String(section.sectionName || sectionId),
        courseId: course.id,
        courseLabel: course.label,
        stageOrder: requestedStageOrder,
        totalStages: course.stages.length,
        stageLabel: stage?.label || 'Not started',
        programmeReferenceReadingLevel:
          stage?.programmeReferenceReadingLevel ?? 0,
        progressPercent: curriculumPercent(requestedStageOrder, course.stages.length),
        status,
        notes,
        latestVerifiedAt: now,
        latestVerifiedBy: manager.uid,
        updatedAt: now,
        updatedBy: manager.uid,
      };

      tx.set(currentRef, current, { merge: true });
      tx.set(historyRef, {
        schemaVersion: 2,
        schoolId,
        academicYearId,
        sectionId,
        changedAt: now,
        changedBy: manager.uid,
        previous: previousSnap.exists
          ? {
              courseId: previous.courseId || null,
              stageOrder: previous.stageOrder ?? null,
              status: previous.status || null,
              progressPercent: previous.progressPercent ?? null,
              programmeReferenceReadingLevel:
                previous.programmeReferenceReadingLevel ??
                previous.expectedReadingLevel ??
                null,
            }
          : null,
        next: {
          courseId: course.id,
          stageOrder: requestedStageOrder,
          status,
          progressPercent: current.progressPercent,
          programmeReferenceReadingLevel:
            current.programmeReferenceReadingLevel,
        },
        notes,
      });
    });

    return {
      ok: true,
      schoolId,
      academicYearId,
      sectionId,
      courseId: course.id,
      stageOrder: requestedStageOrder,
      status,
    };
  },
);

export const schoolUpdateTeacherTraining = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = required(request.data?.schoolId, 'schoolId');
    const academicYearId = required(request.data?.academicYearId, 'academicYearId');
    const teacherId = required(request.data?.teacherId, 'teacherId');
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const yearRef = await requireAcademicYear(schoolId, academicYearId);

    const teacherRef = manager.schoolRef.collection('teachers').doc(teacherId);
    const teacherSnap = await teacherRef.get();
    if (!teacherSnap.exists) throw new HttpsError('not-found', 'School teacher not found');
    const teacher = teacherSnap.data() || {};
    if (String(teacher.status || 'active').toLowerCase() !== 'active') {
      throw new HttpsError('failed-precondition', 'Training can only be updated for active teachers');
    }

    const trainingTrackId = optional(request.data?.trainingTrackId, 100) || CORE_TRAINING_TRACK_ID;
    if (trainingTrackId !== CORE_TRAINING_TRACK_ID) {
      throw new HttpsError('invalid-argument', 'Unsupported school teacher-training track');
    }
    const completedUnits = integer(
      request.data?.completedUnits ?? request.data?.currentStage ?? 0,
      'completedUnits',
      0,
      CORE_TRAINING_TOTAL,
    );
    const currentStage = integer(
      request.data?.currentStage ?? completedUnits,
      'currentStage',
      0,
      CORE_TRAINING_TOTAL,
    );
    if (currentStage !== completedUnits) {
      throw new HttpsError(
        'invalid-argument',
        'currentStage and completedUnits must match for the sequential training pathway',
      );
    }
    if (
      request.data?.totalUnits !== undefined &&
      Number(request.data.totalUnits) !== CORE_TRAINING_TOTAL
    ) {
      throw new HttpsError(
        'invalid-argument',
        `totalUnits must be ${CORE_TRAINING_TOTAL} for the current training pathway`,
      );
    }

    const status = trainingStatus(request.data?.status, completedUnits);
    const notes = optional(request.data?.notes, 1200);
    const progressPercent = Math.round((completedUnits / CORE_TRAINING_TOTAL) * 100);

    const db = admin.firestore();
    const currentRef = yearRef.collection('teacherTraining').doc(teacherId);
    const historyRef = yearRef.collection('teacherTrainingHistory').doc();

    await db.runTransaction(async (tx) => {
      const previousSnap = await tx.get(currentRef);
      const previous = previousSnap.exists ? previousSnap.data() || {} : {};
      const now = admin.firestore.FieldValue.serverTimestamp();

      tx.set(
        currentRef,
        {
          schemaVersion: 2,
          schoolId,
          academicYearId,
          teacherId,
          teacherName: String(teacher.name || teacherId),
          trainingTrackId: CORE_TRAINING_TRACK_ID,
          trainingTrackLabel: CORE_TRAINING_TRACK_LABEL,
          completedUnits,
          totalUnits: CORE_TRAINING_TOTAL,
          currentStage,
          progressPercent,
          status,
          notes,
          latestTrainingAt: now,
          latestTrainingBy: manager.uid,
          updatedAt: now,
          updatedBy: manager.uid,
        },
        { merge: true },
      );

      tx.set(historyRef, {
        schemaVersion: 2,
        schoolId,
        academicYearId,
        teacherId,
        teacherName: String(teacher.name || teacherId),
        changedAt: now,
        changedBy: manager.uid,
        previous: previousSnap.exists
          ? {
              completedUnits: previous.completedUnits ?? null,
              totalUnits: previous.totalUnits ?? null,
              currentStage: previous.currentStage ?? null,
              status: previous.status || null,
            }
          : null,
        next: {
          completedUnits,
          totalUnits: CORE_TRAINING_TOTAL,
          currentStage,
          status,
          progressPercent,
        },
        notes,
      });
    });

    return {
      ok: true,
      schoolId,
      academicYearId,
      teacherId,
      completedUnits,
      totalUnits: CORE_TRAINING_TOTAL,
      progressPercent,
      status,
    };
  },
);
