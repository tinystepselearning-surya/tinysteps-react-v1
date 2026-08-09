import { describe, expect, it } from 'vitest';

import { deriveSectionProgrammeHealth } from '../schoolIntelligence';
import type {
  AssessmentSummary,
  SchoolSection,
  SectionCurriculumProgress,
  TeacherTrainingProgress,
} from '../../types/SchoolProgramme';

const section = (overrides: Partial<SchoolSection> = {}): SchoolSection => ({
  id: 'section-a',
  schoolId: 'school-a',
  academicYearId: 'ay-2026-2027',
  gradeId: 'ukg',
  gradeKey: 'ukg',
  gradeLabel: 'UKG',
  sectionName: 'A',
  studentCount: 30,
  teacherIds: ['teacher-1'],
  status: 'active',
  ...overrides,
});

const curriculum = (
  overrides: Partial<SectionCurriculumProgress> = {},
): SectionCurriculumProgress => ({
  id: 'section-a',
  schoolId: 'school-a',
  academicYearId: 'ay-2026-2027',
  sectionId: 'section-a',
  gradeId: 'ukg',
  gradeKey: 'ukg',
  gradeLabel: 'UKG',
  sectionName: 'A',
  courseId: 'early-phonics',
  courseLabel: 'Early Phonics',
  stageOrder: 3,
  totalStages: 6,
  stageLabel: 'Stage 3',
  programmeReferenceReadingLevel: 4,
  progressPercent: 50,
  status: 'on_track',
  notes: null,
  latestVerifiedAt: Date.parse('2026-08-01T00:00:00Z'),
  ...overrides,
});

const assessment = (
  overrides: Partial<AssessmentSummary> = {},
): AssessmentSummary => ({
  id: 'assessment-1',
  schoolId: 'school-a',
  academicYearId: 'ay-2026-2027',
  sectionId: 'section-a',
  gradeId: 'ukg',
  gradeKey: 'ukg',
  gradeLabel: 'UKG',
  sectionName: 'A',
  checkpoint: 'mid',
  studentsAssessed: 30,
  sectionStudentCountSnapshot: 30,
  averageReadingLevel: 3.5,
  levelDistribution: {
    TS0: 0, TS1: 0, TS2: 0, TS3: 15, TS4: 15,
    TS5: 0, TS6: 0, TS7: 0, TS8: 0, TS9: 0,
  },
  domainScores: {
    phonologicalAwareness: 80,
    soundKnowledge: 80,
    blendingDecoding: 70,
    segmentingEncoding: 65,
    connectedText: 60,
    comprehension: 60,
  },
  assessmentVersion: 'TSERB-1.0',
  notes: null,
  assessedAt: Date.parse('2026-08-05T00:00:00Z'),
  assessedBy: 'lp-1',
  assessedByName: 'LP',
  ...overrides,
});

const training = (
  overrides: Partial<TeacherTrainingProgress> = {},
): TeacherTrainingProgress => ({
  id: 'teacher-1',
  schoolId: 'school-a',
  academicYearId: 'ay-2026-2027',
  teacherId: 'teacher-1',
  teacherName: 'Teacher One',
  trainingTrackId: 'tiny-steps-school-phonics-v1',
  trainingTrackLabel: 'Tiny Steps School Phonics Training',
  completedUnits: 4,
  totalUnits: 6,
  currentStage: 4,
  progressPercent: 67,
  status: 'on_track',
  notes: null,
  ...overrides,
});

const trainingMap = (...records: TeacherTrainingProgress[]) =>
  new Map(records.map((record) => [record.teacherId, record]));

describe('school programme health', () => {
  it('does not label a section healthy before a teacher is assigned', () => {
    const result = deriveSectionProgrammeHealth({
      section: section({ teacherIds: [] }),
      curriculum: curriculum(),
      trainingByTeacher: new Map(),
      assessments: [assessment()],
    });

    expect(result.status).toBe('insufficient_data');
  });

  it('requires a verified curriculum stage', () => {
    const result = deriveSectionProgrammeHealth({
      section: section(),
      curriculum: null,
      trainingByTeacher: trainingMap(training()),
      assessments: [assessment()],
    });

    expect(result.status).toBe('insufficient_data');
  });

  it('requires a fresh benchmark after curriculum advances materially later', () => {
    const result = deriveSectionProgrammeHealth({
      section: section(),
      curriculum: curriculum({ latestVerifiedAt: Date.parse('2026-08-30T00:00:00Z') }),
      trainingByTeacher: trainingMap(training()),
      assessments: [assessment({ assessedAt: Date.parse('2026-08-01T00:00:00Z') })],
    });

    expect(result.status).toBe('insufficient_data');
    expect(result.reason).toContain('fresh checkpoint');
  });

  it('flags a material reading gap for intervention even with training evidence', () => {
    const result = deriveSectionProgrammeHealth({
      section: section(),
      curriculum: curriculum({ programmeReferenceReadingLevel: 5 }),
      trainingByTeacher: trainingMap(training({ progressPercent: 100 })),
      assessments: [assessment({ averageReadingLevel: 3 })],
    });

    expect(result.status).toBe('intervention');
  });

  it('flags missing assigned-teacher training as needs support', () => {
    const result = deriveSectionProgrammeHealth({
      section: section({ teacherIds: ['teacher-1', 'teacher-2'] }),
      curriculum: curriculum({ programmeReferenceReadingLevel: 4 }),
      trainingByTeacher: trainingMap(training()),
      assessments: [assessment({ averageReadingLevel: 4 })],
    });

    expect(result.status).toBe('needs_support');
    expect(result.reason).toContain('training progress is missing');
  });

  it('marks a section on track only when reading and training evidence are both established', () => {
    const result = deriveSectionProgrammeHealth({
      section: section(),
      curriculum: curriculum({ programmeReferenceReadingLevel: 4 }),
      trainingByTeacher: trainingMap(training({ progressPercent: 67 })),
      assessments: [assessment({ averageReadingLevel: 3.5 })],
    });

    expect(result.status).toBe('on_track');
    expect(result.benchmarkGap).toBe(-0.5);
    expect(result.programmeReferenceReadingLevel).toBe(4);
  });
});
