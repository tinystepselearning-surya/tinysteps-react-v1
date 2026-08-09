import type {
  AssessmentSummary,
  SchoolSection,
  SectionCurriculumProgress,
  TeacherTrainingProgress,
} from '../types/SchoolProgramme';

export type ProgrammeHealthStatus =
  | 'on_track'
  | 'needs_support'
  | 'intervention'
  | 'insufficient_data';

export interface SectionProgrammeHealth {
  sectionId: string;
  expectedReadingLevel: number | null;
  demonstratedReadingLevel: number | null;
  benchmarkGap: number | null;
  curriculumPercent: number;
  teacherTrainingPercent: number | null;
  latestAssessment: AssessmentSummary | null;
  status: ProgrammeHealthStatus;
  reason: string;
}

const timestampMillis = (value: unknown): number => {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === 'function') return toMillis.call(value);
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export function latestAssessmentForSection(
  assessments: AssessmentSummary[],
  sectionId: string,
): AssessmentSummary | null {
  return assessments
    .filter((item) => item.sectionId === sectionId)
    .sort((a, b) => timestampMillis(b.assessedAt) - timestampMillis(a.assessedAt))[0] || null;
}

export function deriveSectionProgrammeHealth(input: {
  section: SchoolSection;
  curriculum: SectionCurriculumProgress | null;
  trainingByTeacher: Map<string, TeacherTrainingProgress>;
  assessments: AssessmentSummary[];
}): SectionProgrammeHealth {
  const { section, curriculum, trainingByTeacher, assessments } = input;
  const latestAssessment = latestAssessmentForSection(assessments, section.id);
  const trainingValues = section.teacherIds
    .map((teacherId) => trainingByTeacher.get(teacherId)?.progressPercent)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const teacherTrainingPercent = trainingValues.length
    ? Math.round(trainingValues.reduce((sum, value) => sum + value, 0) / trainingValues.length)
    : null;

  if (!curriculum || curriculum.stageOrder <= 0) {
    return {
      sectionId: section.id,
      expectedReadingLevel: null,
      demonstratedReadingLevel: latestAssessment?.averageReadingLevel ?? null,
      benchmarkGap: null,
      curriculumPercent: curriculum?.progressPercent ?? 0,
      teacherTrainingPercent,
      latestAssessment,
      status: 'insufficient_data',
      reason: 'Curriculum stage has not yet been verified.',
    };
  }

  if (!latestAssessment) {
    return {
      sectionId: section.id,
      expectedReadingLevel: curriculum.expectedReadingLevel,
      demonstratedReadingLevel: null,
      benchmarkGap: null,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      latestAssessment: null,
      status: 'insufficient_data',
      reason: 'No reading benchmark has been recorded for this section yet.',
    };
  }

  const gap = Math.round(
    (latestAssessment.averageReadingLevel - curriculum.expectedReadingLevel) * 100,
  ) / 100;

  if (gap >= -0.75 && (teacherTrainingPercent === null || teacherTrainingPercent >= 60)) {
    return {
      sectionId: section.id,
      expectedReadingLevel: curriculum.expectedReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: gap,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      latestAssessment,
      status: 'on_track',
      reason: 'Demonstrated reading is close to the internal programme expectation.',
    };
  }

  if (gap >= -1.75 && (teacherTrainingPercent === null || teacherTrainingPercent >= 40)) {
    return {
      sectionId: section.id,
      expectedReadingLevel: curriculum.expectedReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: gap,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      latestAssessment,
      status: 'needs_support',
      reason: 'Reading performance is below the internal programme expectation and should be reviewed.',
    };
  }

  return {
    sectionId: section.id,
    expectedReadingLevel: curriculum.expectedReadingLevel,
    demonstratedReadingLevel: latestAssessment.averageReadingLevel,
    benchmarkGap: gap,
    curriculumPercent: curriculum.progressPercent,
    teacherTrainingPercent,
    latestAssessment,
    status: 'intervention',
    reason: 'The section shows a material gap against the internal programme expectation.',
  };
}

export function buildSectionHealthMap(input: {
  sections: SchoolSection[];
  curriculum: SectionCurriculumProgress[];
  training: TeacherTrainingProgress[];
  assessments: AssessmentSummary[];
}): Map<string, SectionProgrammeHealth> {
  const curriculumBySection = new Map(input.curriculum.map((item) => [item.sectionId, item]));
  const trainingByTeacher = new Map(input.training.map((item) => [item.teacherId, item]));
  return new Map(
    input.sections.map((section) => [
      section.id,
      deriveSectionProgrammeHealth({
        section,
        curriculum: curriculumBySection.get(section.id) || null,
        trainingByTeacher,
        assessments: input.assessments,
      }),
    ]),
  );
}
