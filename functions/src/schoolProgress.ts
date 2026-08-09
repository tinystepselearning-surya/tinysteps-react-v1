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

const progressStatus = (
  value: unknown,
  stageOrder: number,
): 'not_started' | 'on_track' | 'needs_attention' | 'completed' => {
  if (stageOrder === 0) return 'not_started';
  const next = String(value || (stageOrder === 6 ? 'completed' : 'on_track')).trim().toLowerCase();
  if (
    next === 'not_started' ||
    next === 'on_track' ||
    next === 'needs_attention' ||
    next === 'completed'
  ) {
    return next;
  }
  throw new HttpsError('invalid-argument', 'Invalid curriculum progress status');
};

async function requireSection(
  schoolId: string,
  academicYearId: string,
  sectionId: string,
): Promise<admin.firestore.DocumentSnapshot> {
  const snap = await admin
    .firestore()
    .collection('schools')
    .doc(schoolId)
    .collection('academicYears')
    .doc(academicYearId)
    .collection('sections')
    .doc(sectionId)
    .get();
  if (!snap.exists) throw new HttpsError('not-found', 'Section not found');
  return snap;
}

export const schoolUpdateCurriculumProgress = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const schoolId = required(request.data?.schoolId, 'schoolId');
    const academicYearId = required(request.data?.academicYearId, 'academicYearId');
    const sectionId = required(request.data?.sectionId, 'sectionId');
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const sectionSnap = await requireSection(schoolId, academicYearId, sectionId);
    const section = sectionSnap.data() || {};
    if (String(section.status || 'active').toLowerCase() !== 'active') {
      throw new HttpsError('failed-precondition', 'Curriculum progress can only be updated for active sections');
    }

    const course = requireSchoolCourse(request.data?.courseId);
    const requestedStageOrder = Number(request.data?.stageOrder);
    if (!Number.isInteger(requestedStageOrder) || requestedStageOrder < 0 || requestedStageOrder > 6) {
      throw new HttpsError('invalid-argument', 'stageOrder must be an integer from 0 to 6');
    }
    const stage = requireSchoolStage(course, requestedStageOrder);
    const status = progressStatus(request.data?.status, requestedStageOrder);
    const notes = optional(request.data?.notes, 1200);

    const db = admin.firestore();
    const yearRef = manager.schoolRef.collection('academicYears').doc(academicYearId);
    const currentRef = yearRef.collection('curriculumProgress').doc(sectionId);
    const historyRef = yearRef.collection('curriculumProgressHistory').doc();

    await db.runTransaction(async (tx) => {
      const previousSnap = await tx.get(currentRef);
      const previous = previousSnap.exists ? previousSnap.data() || {} : {};
      const now = admin.firestore.FieldValue.serverTimestamp();
      const current = {
        schemaVersion: 1,
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
        expectedReadingLevel: stage?.expectedReadingLevel ?? 0,
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
        schemaVersion: 1,
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
            }
          : null,
        next: {
          courseId: course.id,
          stageOrder: requestedStageOrder,
          status,
          progressPercent: current.progressPercent,
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
