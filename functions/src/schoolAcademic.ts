import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { ensureSchoolManager } from './helpers/schoolAuthorization';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_STUDENTS_PER_SECTION = 500;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimString = (value: unknown, field: string, max = 160): string => {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }
  const next = value.trim();
  if (!next) throw new HttpsError('invalid-argument', `${field} is required`);
  if (next.length > max) {
    throw new HttpsError('invalid-argument', `${field} must be ${max} characters or fewer`);
  }
  return next;
};

const optionalString = (value: unknown, max = 160): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Expected a string value');
  }
  const next = value.trim();
  if (!next) return null;
  if (next.length > max) {
    throw new HttpsError('invalid-argument', `Value must be ${max} characters or fewer`);
  }
  return next;
};

const optionalEmail = (value: unknown): string | null => {
  const email = optionalString(value, 200);
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    throw new HttpsError('invalid-argument', 'Invalid teacher email address');
  }
  return normalized;
};

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const integer = (
  value: unknown,
  field: string,
  min: number,
  max: number,
): number => {
  const next = Number(value);
  if (!Number.isInteger(next) || next < min || next > max) {
    throw new HttpsError(
      'invalid-argument',
      `${field} must be an integer between ${min} and ${max}`,
    );
  }
  return next;
};

const schoolIdFrom = (value: unknown): string => trimString(value, 'schoolId', 128);
const yearIdFrom = (value: unknown): string => trimString(value, 'academicYearId', 128);

const normalizeEntityStatus = (value: unknown): 'active' | 'inactive' => {
  const next = String(value || 'active').trim().toLowerCase();
  if (next === 'active' || next === 'inactive') return next;
  throw new HttpsError('invalid-argument', 'Invalid status');
};

const normalizeGradeKey = (value: unknown, label: string): string => {
  const source = optionalString(value, 80) || label;
  const normalized = slug(source);
  if (!normalized) throw new HttpsError('invalid-argument', 'Invalid grade/class name');
  return normalized;
};

async function requireAcademicYear(
  schoolId: string,
  academicYearId: string,
  options: { allowClosed?: boolean } = {},
): Promise<{
  ref: admin.firestore.DocumentReference;
  data: admin.firestore.DocumentData;
}> {
  const ref = admin
    .firestore()
    .collection('schools')
    .doc(schoolId)
    .collection('academicYears')
    .doc(academicYearId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Academic year not found');
  const data = snap.data() || {};
  if (!options.allowClosed && String(data.status || '').toLowerCase() === 'closed') {
    throw new HttpsError(
      'failed-precondition',
      'Closed academic years are read-only. Make the year current before changing its structure.',
    );
  }
  return { ref, data };
}

async function ensureTeacherNotAssignedToCurrentSections(
  schoolRef: admin.firestore.DocumentReference,
  school: admin.firestore.DocumentData,
  teacherId: string,
): Promise<void> {
  const currentAcademicYearId =
    typeof school.currentAcademicYearId === 'string'
      ? school.currentAcademicYearId.trim()
      : '';
  if (!currentAcademicYearId) return;

  const sections = await schoolRef
    .collection('academicYears')
    .doc(currentAcademicYearId)
    .collection('sections')
    .where('status', '==', 'active')
    .get();
  const assigned = sections.docs.find((item) => {
    const teacherIds = item.data().teacherIds;
    return Array.isArray(teacherIds) && teacherIds.includes(teacherId);
  });
  if (assigned) {
    const data = assigned.data();
    throw new HttpsError(
      'failed-precondition',
      `Remove this teacher from ${String(data.gradeLabel || '')} ${String(data.sectionName || assigned.id)}`.trim() +
        ' before deactivating the teacher.',
    );
  }
}

export const schoolCreateAcademicYear = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const startYear = integer(request.data?.startYear, 'startYear', 2020, 2100);
    const endYear = integer(request.data?.endYear ?? startYear + 1, 'endYear', 2021, 2101);
    if (endYear !== startYear + 1) {
      throw new HttpsError('invalid-argument', 'Academic year must span exactly one year');
    }

    const label =
      optionalString(request.data?.label, 40) ||
      `${startYear}–${String(endYear).slice(-2)}`;
    const makeCurrent = request.data?.makeCurrent === true;
    const academicYearId = `ay-${startYear}-${endYear}`;
    const db = admin.firestore();
    const yearRef = manager.schoolRef.collection('academicYears').doc(academicYearId);

    await db.runTransaction(async (tx) => {
      const [existing, schoolSnap] = await Promise.all([
        tx.get(yearRef),
        tx.get(manager.schoolRef),
      ]);
      if (existing.exists) {
        throw new HttpsError('already-exists', 'This academic year already exists');
      }
      if (!schoolSnap.exists) throw new HttpsError('not-found', 'School not found');

      const school = schoolSnap.data() || {};
      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.set(yearRef, {
        schemaVersion: 1,
        schoolId,
        label,
        startYear,
        endYear,
        status: makeCurrent ? 'current' : 'planned',
        createdAt: now,
        createdBy: manager.uid,
        updatedAt: now,
        updatedBy: manager.uid,
      });

      if (makeCurrent) {
        const oldCurrentId =
          typeof school.currentAcademicYearId === 'string'
            ? school.currentAcademicYearId.trim()
            : '';
        if (oldCurrentId && oldCurrentId !== academicYearId) {
          tx.set(
            manager.schoolRef.collection('academicYears').doc(oldCurrentId),
            { status: 'closed', updatedAt: now, updatedBy: manager.uid },
            { merge: true },
          );
        }
        tx.update(manager.schoolRef, {
          currentAcademicYearId: academicYearId,
          updatedAt: now,
          updatedBy: manager.uid,
        });
      }
    });

    return { ok: true, schoolId, academicYearId };
  },
);

export const schoolSetCurrentAcademicYear = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const academicYearId = yearIdFrom(request.data?.academicYearId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const targetRef = manager.schoolRef.collection('academicYears').doc(academicYearId);
    const db = admin.firestore();

    await db.runTransaction(async (tx) => {
      const [schoolSnap, targetSnap] = await Promise.all([
        tx.get(manager.schoolRef),
        tx.get(targetRef),
      ]);
      if (!schoolSnap.exists) throw new HttpsError('not-found', 'School not found');
      if (!targetSnap.exists) throw new HttpsError('not-found', 'Academic year not found');

      const school = schoolSnap.data() || {};
      const oldCurrentId =
        typeof school.currentAcademicYearId === 'string'
          ? school.currentAcademicYearId.trim()
          : '';
      const now = admin.firestore.FieldValue.serverTimestamp();

      if (oldCurrentId && oldCurrentId !== academicYearId) {
        tx.set(
          manager.schoolRef.collection('academicYears').doc(oldCurrentId),
          { status: 'closed', updatedAt: now, updatedBy: manager.uid },
          { merge: true },
        );
      }

      tx.set(
        targetRef,
        { status: 'current', updatedAt: now, updatedBy: manager.uid },
        { merge: true },
      );
      tx.update(manager.schoolRef, {
        currentAcademicYearId: academicYearId,
        updatedAt: now,
        updatedBy: manager.uid,
      });
    });

    return { ok: true, schoolId, academicYearId };
  },
);

export const schoolUpsertGrade = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const academicYearId = yearIdFrom(request.data?.academicYearId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const { ref: yearRef } = await requireAcademicYear(schoolId, academicYearId);
    const label = trimString(request.data?.label, 'Grade label', 80);
    const gradeKey = normalizeGradeKey(request.data?.gradeKey, label);
    const sortOrder = integer(request.data?.sortOrder ?? 0, 'sortOrder', 0, 1000);
    const status = normalizeEntityStatus(request.data?.status);
    const requestedGradeId = optionalString(request.data?.gradeId, 128);
    const gradeId = requestedGradeId || gradeKey;
    const ref = yearRef.collection('grades').doc(gradeId);
    const snap = await ref.get();

    if (!requestedGradeId && snap.exists) {
      throw new HttpsError('already-exists', 'This class/grade already exists');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set(
      {
        schemaVersion: 1,
        schoolId,
        academicYearId,
        gradeKey,
        label,
        labelSearch: label.toLowerCase(),
        sortOrder,
        status,
        ...(snap.exists ? {} : { createdAt: now, createdBy: manager.uid }),
        updatedAt: now,
        updatedBy: manager.uid,
      },
      { merge: true },
    );

    return { ok: true, schoolId, academicYearId, gradeId };
  },
);

export const schoolSetGradeStatus = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const academicYearId = yearIdFrom(request.data?.academicYearId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const { ref: yearRef } = await requireAcademicYear(schoolId, academicYearId);
    const gradeId = trimString(request.data?.gradeId, 'gradeId', 128);
    const status = normalizeEntityStatus(request.data?.status);
    const ref = yearRef.collection('grades').doc(gradeId);
    if (!(await ref.get()).exists) throw new HttpsError('not-found', 'Grade not found');

    if (status === 'inactive') {
      const activeSections = await yearRef
        .collection('sections')
        .where('gradeId', '==', gradeId)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      if (!activeSections.empty) {
        throw new HttpsError(
          'failed-precondition',
          'Deactivate or move all active sections in this class before deactivating the class.',
        );
      }
    }

    await ref.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: manager.uid,
    });
    return { ok: true, gradeId, status };
  },
);

export const schoolUpsertTeacher = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const name = trimString(request.data?.name, 'Teacher name', 120);
    const email = optionalEmail(request.data?.email);
    const phone = optionalString(request.data?.phone, 40);
    const designation = optionalString(request.data?.designation, 120);
    const status = normalizeEntityStatus(request.data?.status);
    const teacherId = optionalString(request.data?.teacherId, 128);
    const ref = teacherId
      ? manager.schoolRef.collection('teachers').doc(teacherId)
      : manager.schoolRef.collection('teachers').doc();
    const snap = await ref.get();
    if (teacherId && !snap.exists) {
      throw new HttpsError('not-found', 'School teacher not found');
    }
    const now = admin.firestore.FieldValue.serverTimestamp();

    await ref.set(
      {
        schemaVersion: 1,
        schoolId,
        name,
        nameSearch: name.toLowerCase(),
        email,
        phone,
        designation,
        status,
        ...(snap.exists ? {} : { createdAt: now, createdBy: manager.uid }),
        updatedAt: now,
        updatedBy: manager.uid,
      },
      { merge: true },
    );

    return { ok: true, schoolId, teacherId: ref.id };
  },
);

export const schoolSetTeacherStatus = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const teacherId = trimString(request.data?.teacherId, 'teacherId', 128);
    const status = normalizeEntityStatus(request.data?.status);
    const ref = manager.schoolRef.collection('teachers').doc(teacherId);
    if (!(await ref.get()).exists) throw new HttpsError('not-found', 'School teacher not found');

    if (status === 'inactive') {
      await ensureTeacherNotAssignedToCurrentSections(
        manager.schoolRef,
        manager.school,
        teacherId,
      );
    }

    await ref.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: manager.uid,
    });
    return { ok: true, teacherId, status };
  },
);

export const schoolUpsertSection = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const academicYearId = yearIdFrom(request.data?.academicYearId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const { ref: yearRef } = await requireAcademicYear(schoolId, academicYearId);
    const gradeId = trimString(request.data?.gradeId, 'gradeId', 128);
    const gradeRef = yearRef.collection('grades').doc(gradeId);
    const gradeSnap = await gradeRef.get();
    if (!gradeSnap.exists) throw new HttpsError('not-found', 'Grade not found');
    const grade = gradeSnap.data() || {};
    if (String(grade.status || 'active').toLowerCase() !== 'active') {
      throw new HttpsError('failed-precondition', 'Sections can only belong to an active class/grade');
    }

    const sectionName = trimString(request.data?.sectionName, 'Section name', 60);
    const studentCount = integer(
      request.data?.studentCount ?? 0,
      'studentCount',
      0,
      MAX_STUDENTS_PER_SECTION,
    );
    const status = normalizeEntityStatus(request.data?.status);
    const rawTeacherIds: unknown[] = Array.isArray(request.data?.teacherIds)
      ? request.data.teacherIds
      : [];
    const teacherIds: string[] = Array.from(
      new Set<string>(
        rawTeacherIds.map(
          (value: unknown): string => trimString(value, 'teacherId', 128),
        ),
      ),
    );
    if (teacherIds.length > 10) {
      throw new HttpsError('invalid-argument', 'A section can have at most 10 teachers');
    }

    if (teacherIds.length) {
      const teacherSnaps = await Promise.all(
        teacherIds.map((teacherId: string) =>
          manager.schoolRef.collection('teachers').doc(teacherId).get(),
        ),
      );
      for (const teacherSnap of teacherSnaps) {
        if (!teacherSnap.exists) {
          throw new HttpsError('failed-precondition', `Teacher ${teacherSnap.id} was not found`);
        }
        const teacher = teacherSnap.data() || {};
        if (String(teacher.status || 'active').toLowerCase() !== 'active') {
          throw new HttpsError('failed-precondition', 'Only active teachers can be assigned');
        }
      }
    }

    const requestedSectionId = optionalString(request.data?.sectionId, 128);
    const sectionId =
      requestedSectionId || `${String(grade.gradeKey || gradeId)}-${slug(sectionName)}`;
    const ref = yearRef.collection('sections').doc(sectionId);
    const snap = await ref.get();
    if (!requestedSectionId && snap.exists) {
      throw new HttpsError('already-exists', 'This class and section already exists');
    }
    if (requestedSectionId && !snap.exists) {
      throw new HttpsError('not-found', 'Section not found');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set(
      {
        schemaVersion: 1,
        schoolId,
        academicYearId,
        gradeId,
        gradeKey: String(grade.gradeKey || gradeId),
        gradeLabel: String(grade.label || gradeId),
        sectionName,
        sectionNameSearch: sectionName.toLowerCase(),
        studentCount,
        teacherIds,
        status,
        ...(snap.exists ? {} : { createdAt: now, createdBy: manager.uid }),
        updatedAt: now,
        updatedBy: manager.uid,
      },
      { merge: true },
    );

    return { ok: true, schoolId, academicYearId, sectionId };
  },
);

export const schoolSetSectionStatus = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60, invoker: 'public', labels: { 'school-public-invoker': 'true' } },
  async (request) => {
    const schoolId = schoolIdFrom(request.data?.schoolId);
    const academicYearId = yearIdFrom(request.data?.academicYearId);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const { ref: yearRef } = await requireAcademicYear(schoolId, academicYearId);
    const sectionId = trimString(request.data?.sectionId, 'sectionId', 128);
    const status = normalizeEntityStatus(request.data?.status);
    const ref = yearRef.collection('sections').doc(sectionId);
    if (!(await ref.get()).exists) throw new HttpsError('not-found', 'Section not found');
    await ref.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: manager.uid,
    });
    return { ok: true, sectionId, status };
  },
);
