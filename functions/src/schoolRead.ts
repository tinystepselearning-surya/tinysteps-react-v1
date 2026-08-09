import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  ensureSchoolReader,
  type SchoolReaderKind,
} from './helpers/schoolAuthorization';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

type RowKind =
  | 'academicYear'
  | 'grade'
  | 'section'
  | 'teacher'
  | 'curriculum'
  | 'training'
  | 'review'
  | 'assessment'
  | 'activity';

function requiredString(value: unknown, field: string, max = 128): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }
  const next = value.trim();
  if (next.length > max) {
    throw new HttpsError('invalid-argument', `${field} is too long`);
  }
  return next;
}

function optionalString(value: unknown, max = 128): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Expected a string value');
  }
  const next = value.trim();
  if (!next) return null;
  if (next.length > max) {
    throw new HttpsError('invalid-argument', 'String value is too long');
  }
  return next;
}

function serialize(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      output[key] = serialize(child);
    }
    return output;
  }
  return value;
}

function baseRow(item: admin.firestore.QueryDocumentSnapshot): Record<string, unknown> {
  return {
    id: item.id,
    ...(serialize(item.data()) as Record<string, unknown>),
  };
}

function removeFields(
  row: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> {
  const next = { ...row };
  for (const field of fields) delete next[field];
  return next;
}

function principalSafeRow(
  row: Record<string, unknown>,
  kind: RowKind,
): Record<string, unknown> {
  const commonInternal = ['createdBy', 'updatedBy'];
  if (kind === 'academicYear' || kind === 'grade' || kind === 'section' || kind === 'teacher') {
    return removeFields(row, commonInternal);
  }
  if (kind === 'curriculum') {
    return removeFields(row, [
      ...commonInternal,
      'notes',
      'latestVerifiedBy',
    ]);
  }
  if (kind === 'training') {
    return removeFields(row, [
      ...commonInternal,
      'notes',
      'latestTrainingBy',
    ]);
  }
  if (kind === 'review') {
    return removeFields(row, [
      ...commonInternal,
      'reviewedBy',
    ]);
  }
  if (kind === 'assessment') {
    return removeFields(row, [
      ...commonInternal,
      'notes',
      'assessedBy',
    ]);
  }
  if (kind === 'activity') return {};
  return row;
}

function rows(
  snapshot: admin.firestore.QuerySnapshot,
  readerKind: SchoolReaderKind,
  kind: RowKind,
): Array<Record<string, unknown>> {
  return snapshot.docs.map((item) => {
    const row = baseRow(item);
    return readerKind === 'schoolAdmin' ? principalSafeRow(row, kind) : row;
  });
}

export const schoolGetProgrammeSnapshot = onCall(
  { region: REGION, memory: '512MiB', timeoutSeconds: 60 },
  async (request) => {
    const schoolId = requiredString(request.data?.schoolId, 'schoolId');
    const preferredAcademicYearId = optionalString(
      request.data?.academicYearId,
      128,
    );
    const reader = await ensureSchoolReader(request.auth, schoolId);

    const yearCollection = reader.schoolRef.collection('academicYears');
    const yearSnap = await yearCollection.get();
    const academicYears = rows(yearSnap, reader.kind, 'academicYear');

    const currentAcademicYearId =
      preferredAcademicYearId ||
      (typeof reader.school.currentAcademicYearId === 'string'
        ? reader.school.currentAcademicYearId
        : null) ||
      (academicYears.find((item) => item.status === 'current')?.id as string | undefined) ||
      (academicYears
        .slice()
        .sort((a, b) => Number(b.startYear || 0) - Number(a.startYear || 0))[0]
        ?.id as string | undefined) ||
      null;

    const teacherPromise = reader.schoolRef.collection('teachers').get();

    if (!currentAcademicYearId) {
      const teacherSnap = await teacherPromise;
      return {
        ok: true,
        schoolId,
        readerKind: reader.kind,
        currentAcademicYearId: null,
        academicYears,
        grades: [],
        sections: [],
        teachers: rows(teacherSnap, reader.kind, 'teacher'),
        curriculum: [],
        training: [],
        reviews: [],
        assessments: [],
        activity: [],
      };
    }

    const yearRef = yearCollection.doc(currentAcademicYearId);
    const yearExists = academicYears.some((item) => item.id === currentAcademicYearId);
    if (!yearExists) {
      throw new HttpsError('not-found', 'Academic year not found');
    }

    const [
      teacherSnap,
      gradeSnap,
      sectionSnap,
      curriculumSnap,
      trainingSnap,
      reviewSnap,
      assessmentSnap,
      activitySnap,
    ] = await Promise.all([
      teacherPromise,
      yearRef.collection('grades').get(),
      yearRef.collection('sections').get(),
      yearRef.collection('curriculumProgress').get(),
      yearRef.collection('teacherTraining').get(),
      yearRef.collection('reviews').orderBy('reviewedAt', 'asc').get(),
      yearRef.collection('assessmentSummaries').orderBy('assessedAt', 'asc').get(),
      reader.kind === 'schoolAdmin'
        ? Promise.resolve(null)
        : reader.schoolRef
            .collection('activity')
            .orderBy('occurredAt', 'desc')
            .limit(100)
            .get(),
    ]);

    return {
      ok: true,
      schoolId,
      readerKind: reader.kind,
      currentAcademicYearId,
      academicYears,
      grades: rows(gradeSnap, reader.kind, 'grade'),
      sections: rows(sectionSnap, reader.kind, 'section'),
      teachers: rows(teacherSnap, reader.kind, 'teacher'),
      curriculum: rows(curriculumSnap, reader.kind, 'curriculum'),
      training: rows(trainingSnap, reader.kind, 'training'),
      reviews: rows(reviewSnap, reader.kind, 'review'),
      assessments: rows(assessmentSnap, reader.kind, 'assessment'),
      activity: activitySnap
        ? rows(activitySnap, reader.kind, 'activity')
        : [],
    };
  },
);
