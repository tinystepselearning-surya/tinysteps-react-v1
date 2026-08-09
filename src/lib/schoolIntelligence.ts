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

/**
 * Internal programme-management guardrail, not a standardized or psychometric
 * cut score. A section-level health label should not be inferred from a very
 * small assessed sample. Raw coverage remains visible in assessment reporting.
 */
export const PROGRAMME_HEALTH_MINIMUM_ASSESSMENT_COVERAGE_PERCENT = 75;

export interface SectionProgrammeHealth {
  sectionId: string;
  programmeReferenceReadingLevel: number | null;
  demonstratedReadingLevel: number | null;
  benchmarkGap: number | null;
  curriculumPercent: number;
  teacherTrainingPercent: number | null;
  assessmentCoveragePercent?: number | null;
  latestAssessment: AssessmentSummary | null;
  status: ProgrammeHealthStatus;
  reason: string;
}

export const timestampMillis = (value: unknown): number => {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === 'function') return toMillis.call(value);
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const latestByTime = (assessments: AssessmentSummary[]): AssessmentSummary | null =>
  assessments
    .slice()
    .sort((a, b) => timestampMillis(b.assessedAt) - timestampMillis(a.assessedAt))[0] || null;

export function latestAssessmentForSection(
  assessments: AssessmentSummary[],
  sectionId: string,
): AssessmentSummary | null {
  return latestByTime(assessments.filter((item) => item.sectionId === sectionId));
}

export function latestBaselineAssessmentForSection(
  assessments: AssessmentSummary[],
  sectionId: string,
): AssessmentSummary | null {
  return latestByTime(
    assessments.filter(
      (item) => item.sectionId === sectionId && item.checkpoint === 'baseline',
    ),
  );
}

export function latestPostBaselineAssessmentForSection(
  assessments: AssessmentSummary[],
  sectionId: string,
): AssessmentSummary | null {
  const baseline = latestBaselineAssessmentForSection(assessments, sectionId);
  const baselineAt = baseline ? timestampMillis(baseline.assessedAt) : 0;
  return latestByTime(
    assessments.filter((item) => {
      if (item.sectionId !== sectionId || item.checkpoint === 'baseline') return false;
      const assessedAt = timestampMillis(item.assessedAt);
      return baselineAt <= 0 || assessedAt <= 0 || assessedAt > baselineAt;
    }),
  );
}

export function assessmentCoveragePercent(
  assessment: AssessmentSummary | null,
  fallbackSectionCount = 0,
): number | null {
  if (!assessment) return null;
  const denominator =
    assessment.sectionStudentCountSnapshot > 0
      ? assessment.sectionStudentCountSnapshot
      : fallbackSectionCount;
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((assessment.studentsAssessed / denominator) * 10000) / 100,
    ),
  );
}

export function deriveSectionProgrammeHealth(input: {
  section: SchoolSection;
  curriculum: SectionCurriculumProgress | null;
  trainingByTeacher: Map<string, TeacherTrainingProgress>;
  assessments: AssessmentSummary[];
}): SectionProgrammeHealth {
  const { section, curriculum, trainingByTeacher, assessments } = input;
  const baselineAssessment = latestBaselineAssessmentForSection(assessments, section.id);
  const latestAssessment = latestPostBaselineAssessmentForSection(assessments, section.id);
  const latestEvidence = latestAssessment || baselineAssessment;
  const latestCoverage = assessmentCoveragePercent(latestEvidence, section.studentCount);
  const assignedTraining = section.teacherIds
    .map((teacherId) => trainingByTeacher.get(teacherId) || null);
  const trainingValues = assignedTraining
    .map((item) => item?.progressPercent)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const teacherTrainingPercent = trainingValues.length
    ? Math.round(trainingValues.reduce((sum, value) => sum + value, 0) / trainingValues.length)
    : null;

  if (section.teacherIds.length === 0) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum?.programmeReferenceReadingLevel ?? null,
      demonstratedReadingLevel:
        latestAssessment?.averageReadingLevel ?? baselineAssessment?.averageReadingLevel ?? null,
      benchmarkGap: null,
      curriculumPercent: curriculum?.progressPercent ?? 0,
      teacherTrainingPercent: null,
      assessmentCoveragePercent: latestCoverage,
      latestAssessment: latestEvidence,
      status: 'insufficient_data',
      reason: 'No school teacher is assigned to this section yet.',
    };
  }

  if (!curriculum || curriculum.stageOrder <= 0) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel: null,
      demonstratedReadingLevel:
        latestAssessment?.averageReadingLevel ?? baselineAssessment?.averageReadingLevel ?? null,
      benchmarkGap: null,
      curriculumPercent: curriculum?.progressPercent ?? 0,
      teacherTrainingPercent,
      assessmentCoveragePercent: latestCoverage,
      latestAssessment: latestEvidence,
      status: 'insufficient_data',
      reason: 'Curriculum stage has not yet been verified.',
    };
  }

  if (!latestAssessment) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum.programmeReferenceReadingLevel,
      demonstratedReadingLevel: baselineAssessment?.averageReadingLevel ?? null,
      benchmarkGap: null,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      assessmentCoveragePercent: latestCoverage,
      latestAssessment: baselineAssessment,
      status: 'insufficient_data',
      reason: baselineAssessment
        ? 'Only baseline reading evidence is available. Record a later checkpoint before interpreting implementation health.'
        : 'No reading benchmark has been recorded for this section yet.',
    };
  }

  const postBaselineCoverage = assessmentCoveragePercent(
    latestAssessment,
    section.studentCount,
  );
  if (
    postBaselineCoverage === null ||
    postBaselineCoverage < PROGRAMME_HEALTH_MINIMUM_ASSESSMENT_COVERAGE_PERCENT
  ) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum.programmeReferenceReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: null,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      assessmentCoveragePercent: postBaselineCoverage,
      latestAssessment,
      status: 'insufficient_data',
      reason:
        postBaselineCoverage === null
          ? 'Assessment coverage cannot be established for the latest checkpoint.'
          : `The latest checkpoint covers ${postBaselineCoverage.toFixed(0)}% of the section. At least ${PROGRAMME_HEALTH_MINIMUM_ASSESSMENT_COVERAGE_PERCENT}% coverage is required for the internal section-health signal.`,
    };
  }

  const assessmentAt = timestampMillis(latestAssessment.assessedAt);
  const curriculumVerifiedAt = timestampMillis(curriculum.latestVerifiedAt || curriculum.updatedAt);
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  if (
    assessmentAt > 0 &&
    curriculumVerifiedAt > 0 &&
    curriculumVerifiedAt - assessmentAt > fourteenDays
  ) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum.programmeReferenceReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: null,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      assessmentCoveragePercent: postBaselineCoverage,
      latestAssessment,
      status: 'insufficient_data',
      reason: 'The latest post-baseline reading checkpoint predates the current verified curriculum stage. A fresh checkpoint is needed.',
    };
  }

  const gap = Math.round(
    (
      latestAssessment.averageReadingLevel -
      curriculum.programmeReferenceReadingLevel
    ) * 100,
  ) / 100;

  if (gap < -1.75) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum.programmeReferenceReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: gap,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      assessmentCoveragePercent: postBaselineCoverage,
      latestAssessment,
      status: 'intervention',
      reason: 'The demonstrated reading level shows a material gap from the current internal programme reference and needs targeted intervention.',
    };
  }

  const missingTrainingRecords = assignedTraining.some((item) => item === null);
  if (missingTrainingRecords || teacherTrainingPercent === null) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum.programmeReferenceReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: gap,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      assessmentCoveragePercent: postBaselineCoverage,
      latestAssessment,
      status: 'needs_support',
      reason: 'Post-baseline reading evidence is available, but training progress is missing for one or more assigned teachers.',
    };
  }

  if (gap < -0.75 || teacherTrainingPercent < 60) {
    return {
      sectionId: section.id,
      programmeReferenceReadingLevel:
        curriculum.programmeReferenceReadingLevel,
      demonstratedReadingLevel: latestAssessment.averageReadingLevel,
      benchmarkGap: gap,
      curriculumPercent: curriculum.progressPercent,
      teacherTrainingPercent,
      assessmentCoveragePercent: postBaselineCoverage,
      latestAssessment,
      status: 'needs_support',
      reason:
        gap < -0.75
          ? 'Post-baseline reading performance is below the current internal programme reference and should be reviewed.'
          : 'Reading is close to the programme reference, but teacher training progress needs support.',
    };
  }

  return {
    sectionId: section.id,
    programmeReferenceReadingLevel:
      curriculum.programmeReferenceReadingLevel,
    demonstratedReadingLevel: latestAssessment.averageReadingLevel,
    benchmarkGap: gap,
    curriculumPercent: curriculum.progressPercent,
    teacherTrainingPercent,
    assessmentCoveragePercent: postBaselineCoverage,
    latestAssessment,
    status: 'on_track',
    reason: 'Post-baseline reading evidence is close to the current internal programme reference and teacher training progress is sufficiently established.',
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
