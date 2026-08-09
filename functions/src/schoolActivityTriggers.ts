import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  onDocumentCreated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore';

import { normalizeRole } from './helpers/roles';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

async function actorKind(uid: string | null): Promise<string | null> {
  if (!uid) return null;
  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    if (!snap.exists) return null;
    return normalizeRole((snap.data() || {}).role);
  } catch (error) {
    logger.warn('school activity actor lookup failed', { uid, error: String(error) });
    return null;
  }
}

async function writeActivity(input: {
  schoolId: string;
  academicYearId?: string | null;
  entityType: string;
  entityId: string;
  type: string;
  summary: string;
  actorUid: string | null;
  metadata?: Record<string, unknown>;
}) {
  const kind = await actorKind(input.actorUid);
  await admin
    .firestore()
    .collection('schools')
    .doc(input.schoolId)
    .collection('activity')
    .doc()
    .set({
      schemaVersion: 1,
      schoolId: input.schoolId,
      academicYearId: input.academicYearId || null,
      entityType: input.entityType,
      entityId: input.entityId,
      type: input.type,
      summary: input.summary,
      actorUid: input.actorUid,
      actorKind: kind,
      metadata: input.metadata || {},
      occurredAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

function afterData(event: any): admin.firestore.DocumentData | null {
  return event.data?.after?.exists ? event.data.after.data() || {} : null;
}

function beforeData(event: any): admin.firestore.DocumentData | null {
  return event.data?.before?.exists ? event.data.before.data() || {} : null;
}

function actorFrom(data: admin.firestore.DocumentData | null): string | null {
  if (!data) return null;
  return (
    stringValue(data.updatedBy) ||
    stringValue(data.latestVerifiedBy) ||
    stringValue(data.latestTrainingBy) ||
    stringValue(data.createdBy) ||
    null
  );
}

function actionType(
  before: admin.firestore.DocumentData | null,
  after: admin.firestore.DocumentData | null,
): 'created' | 'updated' | 'archived' {
  if (!before && after) return 'created';
  if (before && after && before.status !== 'inactive' && after.status === 'inactive') {
    return 'archived';
  }
  return 'updated';
}

export const onSchoolAcademicYearActivity = onDocumentWritten(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}', region: REGION },
  async (event) => {
    const after = afterData(event);
    const before = beforeData(event);
    if (!after) return;
    const action = actionType(before, after);
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'academicYear',
      entityId: event.params.academicYearId,
      type: `academic_year_${action}`,
      summary: `Academic year ${String(after.label || event.params.academicYearId)} ${action}.`,
      actorUid: actorFrom(after),
      metadata: { status: after.status || null },
    });
  },
);

export const onSchoolGradeActivity = onDocumentWritten(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}/grades/{gradeId}', region: REGION },
  async (event) => {
    const after = afterData(event);
    const before = beforeData(event);
    if (!after) return;
    const action = actionType(before, after);
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'grade',
      entityId: event.params.gradeId,
      type: `grade_${action}`,
      summary: `${String(after.label || event.params.gradeId)} ${action}.`,
      actorUid: actorFrom(after),
      metadata: { status: after.status || null },
    });
  },
);

export const onSchoolSectionActivity = onDocumentWritten(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}/sections/{sectionId}', region: REGION },
  async (event) => {
    const after = afterData(event);
    const before = beforeData(event);
    if (!after) return;
    const action = actionType(before, after);
    const sectionLabel = `${String(after.gradeLabel || '')} ${String(after.sectionName || event.params.sectionId)}`.trim();
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'section',
      entityId: event.params.sectionId,
      type: `section_${action}`,
      summary: `${sectionLabel} ${action}.`,
      actorUid: actorFrom(after),
      metadata: {
        status: after.status || null,
        studentCount: Number(after.studentCount || 0),
        teacherCount: Array.isArray(after.teacherIds) ? after.teacherIds.length : 0,
      },
    });
  },
);

export const onSchoolTeacherActivity = onDocumentWritten(
  { document: 'schools/{schoolId}/teachers/{teacherId}', region: REGION },
  async (event) => {
    const after = afterData(event);
    const before = beforeData(event);
    if (!after) return;
    const action = actionType(before, after);
    await writeActivity({
      schoolId: event.params.schoolId,
      entityType: 'teacher',
      entityId: event.params.teacherId,
      type: `teacher_${action}`,
      summary: `School teacher ${String(after.name || event.params.teacherId)} ${action}.`,
      actorUid: actorFrom(after),
      metadata: { status: after.status || null, designation: after.designation || null },
    });
  },
);

export const onSchoolCurriculumActivity = onDocumentWritten(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}/curriculumProgress/{sectionId}', region: REGION },
  async (event) => {
    const after = afterData(event);
    if (!after) return;
    const sectionLabel = `${String(after.gradeLabel || '')} ${String(after.sectionName || event.params.sectionId)}`.trim();
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'curriculumProgress',
      entityId: event.params.sectionId,
      type: 'curriculum_progress_updated',
      summary: `${sectionLabel} curriculum verified at ${String(after.stageLabel || 'Not started')}.`,
      actorUid: actorFrom(after),
      metadata: {
        courseId: after.courseId || null,
        stageOrder: Number(after.stageOrder || 0),
        progressPercent: Number(after.progressPercent || 0),
        status: after.status || null,
      },
    });
  },
);

export const onSchoolTrainingActivity = onDocumentWritten(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}/teacherTraining/{teacherId}', region: REGION },
  async (event) => {
    const after = afterData(event);
    if (!after) return;
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'teacherTraining',
      entityId: event.params.teacherId,
      type: 'teacher_training_updated',
      summary: `${String(after.teacherName || event.params.teacherId)} training updated to ${Number(after.progressPercent || 0)}%.`,
      actorUid: actorFrom(after),
      metadata: {
        progressPercent: Number(after.progressPercent || 0),
        status: after.status || null,
      },
    });
  },
);

export const onSchoolReviewActivity = onDocumentCreated(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}/reviews/{reviewId}', region: REGION },
  async (event) => {
    const data = event.data?.data() || {};
    const scopeLabel = data.sectionId
      ? `${String(data.gradeLabel || '')} ${String(data.sectionName || '')}`.trim()
      : 'Whole-school';
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'review',
      entityId: event.params.reviewId,
      type: 'review_recorded',
      summary: `${scopeLabel} implementation review recorded.`,
      actorUid: stringValue(data.reviewedBy) || stringValue(data.createdBy),
      metadata: {
        implementationRating: data.implementationRating || null,
        overallStatus: data.overallStatus || null,
      },
    });
  },
);

export const onSchoolAssessmentActivity = onDocumentCreated(
  { document: 'schools/{schoolId}/academicYears/{academicYearId}/assessmentSummaries/{assessmentId}', region: REGION },
  async (event) => {
    const data = event.data?.data() || {};
    const sectionLabel = `${String(data.gradeLabel || '')} ${String(data.sectionName || '')}`.trim();
    await writeActivity({
      schoolId: event.params.schoolId,
      academicYearId: event.params.academicYearId,
      entityType: 'assessment',
      entityId: event.params.assessmentId,
      type: 'assessment_recorded',
      summary: `${sectionLabel} ${String(data.checkpoint || 'reading')} benchmark recorded.`,
      actorUid: stringValue(data.assessedBy) || stringValue(data.createdBy),
      metadata: {
        checkpoint: data.checkpoint || null,
        studentsAssessed: Number(data.studentsAssessed || 0),
        averageReadingLevel: Number(data.averageReadingLevel || 0),
        assessmentVersion: data.assessmentVersion || null,
      },
    });
  },
);
