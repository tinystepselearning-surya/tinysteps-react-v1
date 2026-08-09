import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebaseConfig';
import callFunction from '../lib/callFunctions';
import { toSchoolRecord } from './schoolService';
import { toAssessmentSummary, toSchoolReview } from './schoolEvidenceService';
import type { SchoolRecord } from '../types/School';
import type {
  CurriculumProgressStatus,
  SchoolAcademicYear,
  SchoolActivityRecord,
  SchoolGrade,
  SchoolProgrammeBundle,
  SchoolProgressSnapshot,
  SchoolSection,
  SchoolStructureSnapshot,
  SchoolTeacherRecord,
  SectionCurriculumProgress,
  TeacherTrainingProgress,
  TeacherTrainingStatus,
} from '../types/SchoolProgramme';
import type { SchoolPhonicsCourseId } from '../constants/schoolCurriculum';

const nullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const entityStatus = (value: unknown): 'active' | 'inactive' =>
  String(value || '').toLowerCase() === 'inactive' ? 'inactive' : 'active';

const rowObject = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {};

const rawRows = (value: unknown): Record<string, any>[] =>
  Array.isArray(value) ? value.map(rowObject) : [];

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

const curriculumStatus = (value: unknown): CurriculumProgressStatus => {
  const next = String(value || 'not_started');
  if (next === 'on_track' || next === 'needs_attention' || next === 'completed') return next;
  return 'not_started';
};

export const toCurriculumProgress = (
  id: string,
  data: Record<string, any>,
): SectionCurriculumProgress => ({
  id,
  schoolId: String(data.schoolId || ''),
  academicYearId: String(data.academicYearId || ''),
  sectionId: String(data.sectionId || id),
  gradeId: String(data.gradeId || ''),
  gradeKey: String(data.gradeKey || ''),
  gradeLabel: String(data.gradeLabel || ''),
  sectionName: String(data.sectionName || id),
  courseId: String(data.courseId || 'phonics-foundations') as SchoolPhonicsCourseId,
  courseLabel: String(data.courseLabel || ''),
  stageOrder: Number(data.stageOrder || 0),
  totalStages: Number(data.totalStages || 6),
  stageLabel: String(data.stageLabel || 'Not started'),
  programmeReferenceReadingLevel: Number(
    data.programmeReferenceReadingLevel ?? data.expectedReadingLevel ?? 0,
  ),
  progressPercent: Number(data.progressPercent || 0),
  status: curriculumStatus(data.status),
  notes: nullableString(data.notes),
  latestVerifiedAt: data.latestVerifiedAt,
  latestVerifiedBy: nullableString(data.latestVerifiedBy) || undefined,
  updatedAt: data.updatedAt,
  updatedBy: nullableString(data.updatedBy) || undefined,
});

const trainingStatus = (value: unknown): TeacherTrainingStatus => {
  const next = String(value || 'not_started');
  if (next === 'on_track' || next === 'training_due' || next === 'completed') return next;
  return 'not_started';
};

export const toTeacherTrainingProgress = (
  id: string,
  data: Record<string, any>,
): TeacherTrainingProgress => ({
  id,
  schoolId: String(data.schoolId || ''),
  academicYearId: String(data.academicYearId || ''),
  teacherId: String(data.teacherId || id),
  teacherName: String(data.teacherName || id),
  trainingTrackId: String(data.trainingTrackId || 'tiny-steps-school-phonics-v1'),
  trainingTrackLabel: String(data.trainingTrackLabel || 'Tiny Steps School Phonics Training'),
  completedUnits: Number(data.completedUnits || 0),
  totalUnits: Number(data.totalUnits || 0),
  currentStage: Number(data.currentStage || 0),
  progressPercent: Number(data.progressPercent || 0),
  status: trainingStatus(data.status),
  notes: nullableString(data.notes),
  latestTrainingAt: data.latestTrainingAt,
  latestTrainingBy: nullableString(data.latestTrainingBy) || undefined,
  updatedAt: data.updatedAt,
  updatedBy: nullableString(data.updatedBy) || undefined,
});

const toActivity = (id: string, data: Record<string, any>): SchoolActivityRecord => ({
  id,
  schoolId: String(data.schoolId || ''),
  type: String(data.type || 'unknown'),
  summary: String(data.summary || ''),
  academicYearId: nullableString(data.academicYearId),
  entityType: nullableString(data.entityType),
  entityId: nullableString(data.entityId),
  actorUid: nullableString(data.actorUid),
  actorKind: nullableString(data.actorKind),
  occurredAt: data.occurredAt,
  metadata:
    data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? data.metadata as Record<string, unknown>
      : {},
});

interface RawProgrammeSnapshot {
  ok: true;
  schoolId: string;
  readerKind: 'admin' | 'learningPartner' | 'schoolAdmin';
  currentAcademicYearId: string | null;
  academicYears: Record<string, any>[];
  grades: Record<string, any>[];
  sections: Record<string, any>[];
  teachers: Record<string, any>[];
  curriculum: Record<string, any>[];
  training: Record<string, any>[];
  reviews: Record<string, any>[];
  assessments: Record<string, any>[];
  activity: Record<string, any>[];
}

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

export async function getSchoolProgrammeBundle(
  schoolId: string,
  preferredAcademicYearId?: string | null,
): Promise<SchoolProgrammeBundle> {
  const raw = await callFunction<RawProgrammeSnapshot>('schoolGetProgrammeSnapshot', {
    schoolId,
    academicYearId: preferredAcademicYearId || null,
  });

  const academicYears = rawRows(raw.academicYears)
    .map((item) => toAcademicYear(String(item.id || ''), item))
    .sort((a, b) => b.startYear - a.startYear);
  const currentAcademicYear =
    academicYears.find((item) => item.id === raw.currentAcademicYearId) || null;
  const grades = rawRows(raw.grades)
    .map((item) => toSchoolGrade(String(item.id || ''), item))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  const sections = rawRows(raw.sections)
    .map((item) => toSchoolSection(String(item.id || ''), item))
    .sort((a, b) => a.gradeLabel.localeCompare(b.gradeLabel) || a.sectionName.localeCompare(b.sectionName));
  const teachers = rawRows(raw.teachers)
    .map((item) => toSchoolTeacher(String(item.id || ''), item))
    .sort((a, b) => a.name.localeCompare(b.name));
  const curriculum = rawRows(raw.curriculum)
    .map((item) => toCurriculumProgress(String(item.id || ''), item));
  const training = rawRows(raw.training)
    .map((item) => toTeacherTrainingProgress(String(item.id || ''), item));
  const reviews = rawRows(raw.reviews)
    .map((item) => toSchoolReview(String(item.id || ''), item));
  const assessments = rawRows(raw.assessments)
    .map((item) => toAssessmentSummary(String(item.id || ''), item));
  const activity = rawRows(raw.activity)
    .map((item) => toActivity(String(item.id || ''), item));

  const structure: SchoolStructureSnapshot = {
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

  return {
    readerKind: raw.readerKind,
    structure,
    progress: { curriculum, training },
    evidence: { reviews, assessments },
    activity,
  };
}

export async function getSchoolStructure(
  schoolId: string,
  preferredAcademicYearId?: string | null,
): Promise<SchoolStructureSnapshot> {
  return (await getSchoolProgrammeBundle(schoolId, preferredAcademicYearId)).structure;
}

export async function getSchoolProgress(
  schoolId: string,
  academicYearId: string,
): Promise<SchoolProgressSnapshot> {
  return (await getSchoolProgrammeBundle(schoolId, academicYearId)).progress;
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

export const updateSectionCurriculumProgress = (input: {
  schoolId: string;
  academicYearId: string;
  sectionId: string;
  courseId: SchoolPhonicsCourseId;
  stageOrder: number;
  status?: CurriculumProgressStatus;
  notes?: string;
}) => callFunction<{ ok: true; sectionId: string; stageOrder: number }>(
  'schoolUpdateCurriculumProgress',
  input,
);

export const updateTeacherTraining = (input: {
  schoolId: string;
  academicYearId: string;
  teacherId: string;
  trainingTrackId?: string;
  trainingTrackLabel?: string;
  completedUnits: number;
  totalUnits: number;
  currentStage?: number;
  status?: TeacherTrainingStatus;
  notes?: string;
}) => callFunction<{ ok: true; teacherId: string; progressPercent: number }>(
  'schoolUpdateTeacherTraining',
  input,
);
