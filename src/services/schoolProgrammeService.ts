import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebaseConfig';
import callFunction from '../lib/callFunctions';
import { toSchoolRecord } from './schoolService';
import type { SchoolRecord } from '../types/School';
import type {
  SchoolAcademicYear,
  SchoolGrade,
  SchoolSection,
  SchoolStructureSnapshot,
  SchoolTeacherRecord,
} from '../types/SchoolProgramme';

const nullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const entityStatus = (value: unknown): 'active' | 'inactive' =>
  String(value || '').toLowerCase() === 'inactive' ? 'inactive' : 'active';

export const toAcademicYear = (id: string, data: Record<string, any>): SchoolAcademicYear => ({
  id,
  schoolId: String(data.schoolId || ''),
  label: String(data.label || id),
  startYear: Number(data.startYear || 0),
  endYear: Number(data.endYear || 0),
  status:
    data.status === 'current' || data.status === 'closed'
      ? data.status
      : 'planned',
  createdAt: data.createdAt,
  createdBy: nullableString(data.createdBy) || undefined,
  updatedAt: data.updatedAt,
  updatedBy: nullableString(data.updatedBy) || undefined,
});

export const toSchoolGrade = (id: string, data: Record<string, any>): SchoolGrade => ({
  id,
  schoolId: String(data.schoolId || ''),
  academicYearId: String(data.academicYearId || ''),
  gradeKey: String(data.gradeKey || id),
  label: String(data.label || id),
  sortOrder: Number(data.sortOrder || 0),
  status: entityStatus(data.status),
  createdAt: data.createdAt,
  createdBy: nullableString(data.createdBy) || undefined,
  updatedAt: data.updatedAt,
  updatedBy: nullableString(data.updatedBy) || undefined,
});

export const toSchoolSection = (
  id: string,
  data: Record<string, any>,
): SchoolSection => ({
  id,
  schoolId: String(data.schoolId || ''),
  academicYearId: String(data.academicYearId || ''),
  gradeId: String(data.gradeId || ''),
  gradeKey: String(data.gradeKey || ''),
  gradeLabel: String(data.gradeLabel || ''),
  sectionName: String(data.sectionName || id),
  studentCount: Math.max(0, Number(data.studentCount || 0)),
  teacherIds: stringArray(data.teacherIds),
  status: entityStatus(data.status),
  createdAt: data.createdAt,
  createdBy: nullableString(data.createdBy) || undefined,
  updatedAt: data.updatedAt,
  updatedBy: nullableString(data.updatedBy) || undefined,
});

export const toSchoolTeacher = (
  id: string,
  data: Record<string, any>,
): SchoolTeacherRecord => ({
  id,
  schoolId: String(data.schoolId || ''),
  name: String(data.name || 'Unnamed teacher'),
  email: nullableString(data.email),
  phone: nullableString(data.phone),
  designation: nullableString(data.designation),
  status: entityStatus(data.status),
  createdAt: data.createdAt,
  createdBy: nullableString(data.createdBy) || undefined,
  updatedAt: data.updatedAt,
  updatedBy: nullableString(data.updatedBy) || undefined,
});

export async function listAssignedSchoolsForLearningPartner(
  learningPartnerId: string,
): Promise<SchoolRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools'),
      where('learningPartnerId', '==', learningPartnerId),
    ),
  );
  return snap.docs
    .map((item) => toSchoolRecord(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSchoolStructure(
  schoolId: string,
  preferredAcademicYearId?: string | null,
): Promise<SchoolStructureSnapshot> {
  const schoolSnap = await getDoc(doc(db, 'schools', schoolId));
  if (!schoolSnap.exists()) throw new Error('School not found');
  const school = schoolSnap.data();
  const academicYearSnap = await getDocs(
    collection(db, 'schools', schoolId, 'academicYears'),
  );
  const academicYears = academicYearSnap.docs
    .map((item) => toAcademicYear(item.id, item.data()))
    .sort((a, b) => b.startYear - a.startYear);

  const requestedId = preferredAcademicYearId ||
    (typeof school.currentAcademicYearId === 'string'
      ? school.currentAcademicYearId
      : null);
  const currentAcademicYear =
    academicYears.find((item) => item.id === requestedId) ||
    academicYears.find((item) => item.status === 'current') ||
    academicYears[0] ||
    null;

  const teacherSnap = await getDocs(collection(db, 'schools', schoolId, 'teachers'));
  const teachers = teacherSnap.docs
    .map((item) => toSchoolTeacher(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!currentAcademicYear) {
    return {
      academicYears,
      currentAcademicYear: null,
      grades: [],
      sections: [],
      teachers,
      totals: { grades: 0, sections: 0, students: 0, teachers: teachers.length },
    };
  }

  const [gradeSnap, sectionSnap] = await Promise.all([
    getDocs(
      collection(
        db,
        'schools',
        schoolId,
        'academicYears',
        currentAcademicYear.id,
        'grades',
      ),
    ),
    getDocs(
      collection(
        db,
        'schools',
        schoolId,
        'academicYears',
        currentAcademicYear.id,
        'sections',
      ),
    ),
  ]);

  const grades = gradeSnap.docs
    .map((item) => toSchoolGrade(item.id, item.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  const sections = sectionSnap.docs
    .map((item) => toSchoolSection(item.id, item.data()))
    .sort((a, b) =>
      a.gradeLabel.localeCompare(b.gradeLabel) || a.sectionName.localeCompare(b.sectionName),
    );

  return {
    academicYears,
    currentAcademicYear,
    grades,
    sections,
    teachers,
    totals: {
      grades: grades.filter((item) => item.status === 'active').length,
      sections: sections.filter((item) => item.status === 'active').length,
      students: sections
        .filter((item) => item.status === 'active')
        .reduce((sum, item) => sum + item.studentCount, 0),
      teachers: teachers.filter((item) => item.status === 'active').length,
    },
  };
}

export const createAcademicYear = (input: {
  schoolId: string;
  startYear: number;
  endYear?: number;
  label?: string;
  makeCurrent?: boolean;
}) => callFunction<{ ok: true; schoolId: string; academicYearId: string }>(
  'schoolCreateAcademicYear',
  input,
);

export const setCurrentAcademicYear = (input: {
  schoolId: string;
  academicYearId: string;
}) => callFunction<{ ok: true; schoolId: string; academicYearId: string }>(
  'schoolSetCurrentAcademicYear',
  input,
);

export const upsertSchoolGrade = (input: {
  schoolId: string;
  academicYearId: string;
  gradeId?: string;
  gradeKey: string;
  label: string;
  sortOrder: number;
  status?: 'active' | 'inactive';
}) => callFunction<{ ok: true; gradeId: string }>('schoolUpsertGrade', input);

export const setSchoolGradeStatus = (input: {
  schoolId: string;
  academicYearId: string;
  gradeId: string;
  status: 'active' | 'inactive';
}) => callFunction<{ ok: true; gradeId: string }>('schoolSetGradeStatus', input);

export const upsertSchoolTeacher = (input: {
  schoolId: string;
  teacherId?: string;
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  status?: 'active' | 'inactive';
}) => callFunction<{ ok: true; teacherId: string }>('schoolUpsertTeacher', input);

export const setSchoolTeacherStatus = (input: {
  schoolId: string;
  teacherId: string;
  status: 'active' | 'inactive';
}) => callFunction<{ ok: true; teacherId: string }>('schoolSetTeacherStatus', input);

export const upsertSchoolSection = (input: {
  schoolId: string;
  academicYearId: string;
  sectionId?: string;
  gradeId: string;
  sectionName: string;
  studentCount: number;
  teacherIds: string[];
  status?: 'active' | 'inactive';
}) => callFunction<{ ok: true; sectionId: string }>('schoolUpsertSection', input);

export const setSchoolSectionStatus = (input: {
  schoolId: string;
  academicYearId: string;
  sectionId: string;
  status: 'active' | 'inactive';
}) => callFunction<{ ok: true; sectionId: string }>('schoolSetSectionStatus', input);
