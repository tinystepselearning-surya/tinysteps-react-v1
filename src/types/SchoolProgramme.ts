import type { SchoolPhonicsCourseId } from '../constants/schoolCurriculum';

export type AcademicYearStatus = 'planned' | 'current' | 'closed';
export type SchoolEntityStatus = 'active' | 'inactive';

export interface SchoolAcademicYear {
  id: string;
  schoolId: string;
  label: string;
  startYear: number;
  endYear: number;
  status: AcademicYearStatus;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SchoolGrade {
  id: string;
  schoolId: string;
  academicYearId: string;
  gradeKey: string;
  label: string;
  sortOrder: number;
  status: SchoolEntityStatus;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SchoolSection {
  id: string;
  schoolId: string;
  academicYearId: string;
  gradeId: string;
  gradeKey: string;
  gradeLabel: string;
  sectionName: string;
  studentCount: number;
  teacherIds: string[];
  status: SchoolEntityStatus;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SchoolTeacherRecord {
  id: string;
  schoolId: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  status: SchoolEntityStatus;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export type CurriculumProgressStatus =
  | 'not_started'
  | 'on_track'
  | 'needs_attention'
  | 'completed';

export interface SectionCurriculumProgress {
  id: string;
  schoolId: string;
  academicYearId: string;
  sectionId: string;
  gradeId: string;
  gradeKey: string;
  gradeLabel: string;
  sectionName: string;
  courseId: SchoolPhonicsCourseId;
  courseLabel: string;
  stageOrder: number;
  totalStages: number;
  stageLabel: string;
  expectedReadingLevel: number;
  progressPercent: number;
  status: CurriculumProgressStatus;
  notes: string | null;
  latestVerifiedAt?: unknown;
  latestVerifiedBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export type TeacherTrainingStatus =
  | 'not_started'
  | 'on_track'
  | 'training_due'
  | 'completed';

export interface TeacherTrainingProgress {
  id: string;
  schoolId: string;
  academicYearId: string;
  teacherId: string;
  teacherName: string;
  trainingTrackId: string;
  trainingTrackLabel: string;
  completedUnits: number;
  totalUnits: number;
  currentStage: number;
  progressPercent: number;
  status: TeacherTrainingStatus;
  notes: string | null;
  latestTrainingAt?: unknown;
  latestTrainingBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SchoolStructureSnapshot {
  academicYears: SchoolAcademicYear[];
  currentAcademicYear: SchoolAcademicYear | null;
  grades: SchoolGrade[];
  sections: SchoolSection[];
  teachers: SchoolTeacherRecord[];
  totals: {
    grades: number;
    sections: number;
    students: number;
    teachers: number;
  };
}

export interface SchoolProgressSnapshot {
  curriculum: SectionCurriculumProgress[];
  training: TeacherTrainingProgress[];
}

export const DEFAULT_SCHOOL_GRADES: Array<{
  gradeKey: string;
  label: string;
  sortOrder: number;
}> = [
  { gradeKey: 'nursery', label: 'Nursery', sortOrder: 10 },
  { gradeKey: 'lkg', label: 'LKG', sortOrder: 20 },
  { gradeKey: 'ukg', label: 'UKG', sortOrder: 30 },
  { gradeKey: 'grade-1', label: 'Grade 1', sortOrder: 40 },
  { gradeKey: 'grade-2', label: 'Grade 2', sortOrder: 50 },
];
