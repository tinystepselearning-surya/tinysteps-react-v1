import type {
  AssessmentSummary,
  ReadingDomainScores,
  SchoolGrade,
  SchoolSection,
  SchoolStructureSnapshot,
} from '../types/SchoolProgramme';
import type { SectionProgrammeHealth } from './schoolIntelligence';
import {
  PROGRAMME_HEALTH_MINIMUM_ASSESSMENT_COVERAGE_PERCENT,
  assessmentCoveragePercent,
  latestAssessmentForSection,
  latestPostBaselineAssessmentForSection,
  timestampMillis,
} from './schoolIntelligence';

export interface GradeAnalytics {
  gradeId: string;
  gradeLabel: string;
  sections: number;
  students: number;
  averageReadingLevel: number | null;
}

export interface DomainProgressMetric {
  key: keyof ReadingDomainScores;
  label: string;
  baseline: number | null;
  current: number | null;
  change: number | null;
}

export interface SchoolAnalyticsSummary {
  students: number;
  grades: number;
  sections: number;
  teachers: number;
  onTrack: number;
  needsSupport: number;
  intervention: number;
  insufficientData: number;
  baselineReadingLevel: number | null;
  currentReadingLevel: number | null;
  readingLevelGrowth: number | null;
  matchedGrowthSections: number;
  baselineEvidenceSections: number;
  currentEvidenceSections: number;
  gradesSummary: GradeAnalytics[];
  domainProgress: DomainProgressMetric[];
}

const weightedAverage = (
  rows: Array<{ value: number; weight: number }>,
): number | null => {
  const valid = rows.filter(
    (row) => Number.isFinite(row.value) && Number.isFinite(row.weight) && row.weight > 0,
  );
  if (!valid.length) return null;
  const totalWeight = valid.reduce((sum, row) => sum + row.weight, 0);
  if (!totalWeight) return null;
  return Math.round(
    (valid.reduce((sum, row) => sum + row.value * row.weight, 0) / totalWeight) * 100,
  ) / 100;
};

const hasMinimumCoverage = (assessment: AssessmentSummary | null | undefined): assessment is AssessmentSummary => {
  if (!assessment) return false;
  const coverage = assessmentCoveragePercent(assessment);
  return (
    coverage !== null &&
    coverage >= PROGRAMME_HEALTH_MINIMUM_ASSESSMENT_COVERAGE_PERCENT
  );
};

const baselineForSection = (
  assessments: AssessmentSummary[],
  sectionId: string,
): AssessmentSummary | null =>
  assessments
    .filter((item) => item.sectionId === sectionId && item.checkpoint === 'baseline')
    .sort((a, b) => timestampMillis(b.assessedAt) - timestampMillis(a.assessedAt))[0] || null;

const DOMAIN_LABELS: Record<keyof ReadingDomainScores, string> = {
  phonologicalAwareness: 'Phonological awareness',
  soundKnowledge: 'Sound knowledge',
  blendingDecoding: 'Blending & decoding',
  segmentingEncoding: 'Segmenting & spelling',
  connectedText: 'Connected-text reading',
  comprehension: 'Comprehension',
};

export function buildSchoolAnalytics(input: {
  structure: SchoolStructureSnapshot;
  assessments: AssessmentSummary[];
  healthBySection: Map<string, SectionProgrammeHealth>;
}): SchoolAnalyticsSummary {
  const activeSections = input.structure.sections.filter((item) => item.status === 'active');
  const activeGrades = input.structure.grades.filter((item) => item.status === 'active');
  const activeTeachers = input.structure.teachers.filter((item) => item.status === 'active');
  const healthValues = activeSections
    .map((section) => input.healthBySection.get(section.id))
    .filter((item): item is SectionProgrammeHealth => Boolean(item));

  const latestBySection = new Map(
    activeSections.map((section) => [
      section.id,
      latestAssessmentForSection(input.assessments, section.id),
    ]),
  );
  const baselineBySection = new Map(
    activeSections.map((section) => [
      section.id,
      baselineForSection(input.assessments, section.id),
    ]),
  );
  const postBaselineBySection = new Map(
    activeSections.map((section) => [
      section.id,
      latestPostBaselineAssessmentForSection(input.assessments, section.id),
    ]),
  );

  const eligibleBaselines = activeSections
    .map((section) => baselineBySection.get(section.id))
    .filter(hasMinimumCoverage);
  const eligibleLatest = activeSections
    .map((section) => latestBySection.get(section.id))
    .filter(hasMinimumCoverage);

  const baselineReadingLevel = weightedAverage(
    eligibleBaselines.map((item) => ({
      value: item.averageReadingLevel,
      weight: item.studentsAssessed,
    })),
  );

  const currentReadingLevel = weightedAverage(
    eligibleLatest.map((item) => ({
      value: item.averageReadingLevel,
      weight: item.studentsAssessed,
    })),
  );

  const matchedAssessmentPairs = activeSections
    .map((section) => ({
      baseline: baselineBySection.get(section.id),
      current: postBaselineBySection.get(section.id),
    }))
    .filter(
      (pair): pair is { baseline: AssessmentSummary; current: AssessmentSummary } =>
        hasMinimumCoverage(pair.baseline) && hasMinimumCoverage(pair.current),
    );

  const matchedGrowthRows = matchedAssessmentPairs.map((pair) => ({
    value: pair.current.averageReadingLevel - pair.baseline.averageReadingLevel,
    weight: Math.min(pair.baseline.studentsAssessed, pair.current.studentsAssessed),
  }));

  const gradesSummary = activeGrades.map((grade: SchoolGrade) => {
    const sections = activeSections.filter((section: SchoolSection) => section.gradeId === grade.id);
    const assessments = sections
      .map((section) => latestBySection.get(section.id))
      .filter(hasMinimumCoverage);
    return {
      gradeId: grade.id,
      gradeLabel: grade.label,
      sections: sections.length,
      students: sections.reduce((sum, section) => sum + section.studentCount, 0),
      averageReadingLevel: weightedAverage(
        assessments.map((item) => ({ value: item.averageReadingLevel, weight: item.studentsAssessed })),
      ),
    };
  });

  const domainKeys = Object.keys(DOMAIN_LABELS) as Array<keyof ReadingDomainScores>;
  const domainProgress = domainKeys.map((key) => {
    const eligiblePairs = matchedAssessmentPairs.filter(
      (pair) => pair.baseline.domainScores[key] !== null && pair.current.domainScores[key] !== null,
    );
    const baseline = weightedAverage(
      eligiblePairs.map((pair) => ({
        value: pair.baseline.domainScores[key] as number,
        weight: Math.min(pair.baseline.studentsAssessed, pair.current.studentsAssessed),
      })),
    );
    const current = weightedAverage(
      eligiblePairs.map((pair) => ({
        value: pair.current.domainScores[key] as number,
        weight: Math.min(pair.baseline.studentsAssessed, pair.current.studentsAssessed),
      })),
    );
    return {
      key,
      label: DOMAIN_LABELS[key],
      baseline,
      current,
      change:
        baseline !== null && current !== null
          ? Math.round((current - baseline) * 100) / 100
          : null,
    };
  });

  return {
    students: activeSections.reduce((sum, item) => sum + item.studentCount, 0),
    grades: activeGrades.length,
    sections: activeSections.length,
    teachers: activeTeachers.length,
    onTrack: healthValues.filter((item) => item.status === 'on_track').length,
    needsSupport: healthValues.filter((item) => item.status === 'needs_support').length,
    intervention: healthValues.filter((item) => item.status === 'intervention').length,
    insufficientData: healthValues.filter((item) => item.status === 'insufficient_data').length,
    baselineReadingLevel,
    currentReadingLevel,
    readingLevelGrowth: weightedAverage(matchedGrowthRows),
    matchedGrowthSections: matchedGrowthRows.length,
    baselineEvidenceSections: eligibleBaselines.length,
    currentEvidenceSections: eligibleLatest.length,
    gradesSummary,
    domainProgress,
  };
}

export function buildSchoolSummaryCsv(input: {
  schoolName: string;
  academicYearLabel: string;
  analytics: SchoolAnalyticsSummary;
}): string {
  const rows: string[][] = [
    ['Tiny Steps School Partnership Report'],
    ['School', input.schoolName],
    ['Academic Year', input.academicYearLabel],
    ['Assessment interpretation', 'TS levels are Tiny Steps internal instructional descriptors; they are not standardized, norm-referenced, age-standardized or diagnostic scores.'],
    ['Evidence guardrail', `Aggregate reading/growth metrics use section assessments meeting the internal ${PROGRAMME_HEALTH_MINIMUM_ASSESSMENT_COVERAGE_PERCENT}% coverage guardrail.`],
    ['Growth interpretation', 'Matched growth is matched at section level; it does not imply the exact same individual children were assessed unless separately verified by the school.'],
    [],
    ['Metric', 'Value'],
    ['Students', String(input.analytics.students)],
    ['Classes', String(input.analytics.grades)],
    ['Sections', String(input.analytics.sections)],
    ['Teachers', String(input.analytics.teachers)],
    ['Sections On Track', String(input.analytics.onTrack)],
    ['Needs Support', String(input.analytics.needsSupport)],
    ['Intervention', String(input.analytics.intervention)],
    ['Insufficient Data', String(input.analytics.insufficientData)],
    ['Baseline Evidence Sections', String(input.analytics.baselineEvidenceSections)],
    ['Latest Evidence Sections', String(input.analytics.currentEvidenceSections)],
    ['Baseline TS Level', input.analytics.baselineReadingLevel?.toFixed(2) || ''],
    ['Latest TS Level', input.analytics.currentReadingLevel?.toFixed(2) || ''],
    ['Matched Section Growth', input.analytics.readingLevelGrowth?.toFixed(2) || ''],
    ['Matched Growth Sections', String(input.analytics.matchedGrowthSections)],
    [],
    ['Grade', 'Sections', 'Students', 'Latest TS Level'],
    ...input.analytics.gradesSummary.map((item) => [
      item.gradeLabel,
      String(item.sections),
      String(item.students),
      item.averageReadingLevel?.toFixed(2) || '',
    ]),
    [],
    ['Domain (coverage-qualified matched sections only)', 'Baseline', 'Later checkpoint', 'Change'],
    ...input.analytics.domainProgress.map((item) => [
      item.label,
      item.baseline?.toFixed(2) || '',
      item.current?.toFixed(2) || '',
      item.change?.toFixed(2) || '',
    ]),
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(escape).join(',')).join('\n');
}
