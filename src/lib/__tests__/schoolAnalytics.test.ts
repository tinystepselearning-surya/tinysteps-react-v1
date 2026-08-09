import { describe, expect, it } from 'vitest';

import { buildSchoolAnalytics } from '../schoolAnalytics';
import type {
  AssessmentSummary,
  SchoolStructureSnapshot,
} from '../../types/SchoolProgramme';
import type { SectionProgrammeHealth } from '../schoolIntelligence';

const structure: SchoolStructureSnapshot = {
  academicYears: [],
  currentAcademicYear: null,
  grades: [
    {
      id: 'ukg',
      schoolId: 'school-a',
      academicYearId: 'ay',
      gradeKey: 'ukg',
      label: 'UKG',
      sortOrder: 30,
      status: 'active',
    },
  ],
  sections: [
    {
      id: 'a',
      schoolId: 'school-a',
      academicYearId: 'ay',
      gradeId: 'ukg',
      gradeKey: 'ukg',
      gradeLabel: 'UKG',
      sectionName: 'A',
      studentCount: 20,
      teacherIds: ['t1'],
      status: 'active',
    },
    {
      id: 'b',
      schoolId: 'school-a',
      academicYearId: 'ay',
      gradeId: 'ukg',
      gradeKey: 'ukg',
      gradeLabel: 'UKG',
      sectionName: 'B',
      studentCount: 20,
      teacherIds: ['t2'],
      status: 'active',
    },
  ],
  teachers: [
    { id: 't1', schoolId: 'school-a', name: 'T1', email: null, phone: null, designation: null, status: 'active' },
    { id: 't2', schoolId: 'school-a', name: 'T2', email: null, phone: null, designation: null, status: 'active' },
  ],
  totals: { grades: 1, sections: 2, students: 40, teachers: 2 },
};

const assessment = (
  id: string,
  sectionId: string,
  checkpoint: AssessmentSummary['checkpoint'],
  averageReadingLevel: number,
  blending: number,
  studentsAssessed = 20,
): AssessmentSummary => ({
  id,
  schoolId: 'school-a',
  academicYearId: 'ay',
  sectionId,
  gradeId: 'ukg',
  gradeKey: 'ukg',
  gradeLabel: 'UKG',
  sectionName: sectionId.toUpperCase(),
  checkpoint,
  studentsAssessed,
  sectionStudentCountSnapshot: 20,
  averageReadingLevel,
  levelDistribution: {
    TS0: 0, TS1: 0, TS2: 0, TS3: studentsAssessed,
    TS4: 0, TS5: 0, TS6: 0, TS7: 0, TS8: 0, TS9: 0,
  },
  domainScores: {
    phonologicalAwareness: null,
    soundKnowledge: null,
    blendingDecoding: blending,
    segmentingEncoding: null,
    connectedText: null,
    comprehension: null,
  },
  assessmentVersion: 'TSERB-1.0',
  notes: null,
  assessedAt:
    checkpoint === 'baseline'
      ? Date.parse('2026-06-01T00:00:00Z')
      : Date.parse('2026-08-01T00:00:00Z'),
  assessedBy: 'lp',
  assessedByName: 'LP',
});

const health = (sectionId: string): SectionProgrammeHealth => ({
  sectionId,
  expectedReadingLevel: 3,
  demonstratedReadingLevel: 3,
  benchmarkGap: 0,
  curriculumPercent: 50,
  teacherTrainingPercent: 67,
  latestAssessment: null,
  status: 'on_track',
  reason: 'ok',
});

describe('school analytics', () => {
  it('does not invent growth from an unmatched baseline-only section', () => {
    const result = buildSchoolAnalytics({
      structure,
      assessments: [
        assessment('a-base', 'a', 'baseline', 2, 40),
        assessment('a-mid', 'a', 'mid', 3, 70),
        assessment('b-base', 'b', 'baseline', 1, 20),
      ],
      healthBySection: new Map([
        ['a', health('a')],
        ['b', health('b')],
      ]),
    });

    expect(result.matchedGrowthSections).toBe(1);
    expect(result.readingLevelGrowth).toBe(1);
    expect(result.domainProgress.find((item) => item.key === 'blendingDecoding')).toMatchObject({
      baseline: 40,
      current: 70,
      change: 30,
    });
  });

  it('weights section growth by matched assessed cohort size', () => {
    const result = buildSchoolAnalytics({
      structure,
      assessments: [
        assessment('a-base', 'a', 'baseline', 2, 40, 20),
        assessment('a-mid', 'a', 'mid', 3, 60, 20),
        assessment('b-base', 'b', 'baseline', 2, 40, 10),
        assessment('b-mid', 'b', 'mid', 4, 80, 10),
      ],
      healthBySection: new Map([
        ['a', health('a')],
        ['b', health('b')],
      ]),
    });

    expect(result.matchedGrowthSections).toBe(2);
    expect(result.readingLevelGrowth).toBe(1.33);
  });
});
