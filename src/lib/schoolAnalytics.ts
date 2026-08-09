import type {
  AssessmentSummary,
  ReadingDomainScores,
  SchoolGrade,
  SchoolSection,
  SchoolStructureSnapshot,
} from '../types/SchoolProgramme';
import type { SectionProgrammeHealth } from './schoolIntelligence';
import { latestAssessmentForSection } from './schoolIntelligence';

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
  gradesSummary: GradeAnalytics[];
  domainProgress: DomainProgressMetric[];
}

const timestampMillis = (value: unknown): number => {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const fn = (value as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') return fn.call(value);
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

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

  const baselineReadingLevel = weightedAverage(
    activeSections
      .map((section) => baselineBySection.get(section.id))
      .filter((item): item is AssessmentSummary => Boolean(item))
      .map((item) => ({ value: item.averageReadingLevel, weight: item.studentsAssessed })),
  );
  const currentReadingLevel = weightedAverage(
    activeSections
      .map((section) => latestBySection.get(section.id))
      .filter((item): item is AssessmentSummary => Boolean(item))
      .map((item) => ({ value: item.averageReadingLevel, weight: item.studentsAssessed })),
  );

  const gradesSummary = activeGrades.map((grade: SchoolGrade) => {
    const sections = activeSections.filter((section: SchoolSection) => section.gradeId === grade.id);
    const assessments = sections
      .map((section) => latestBySection.get(section.id))
      .filter((item): item is AssessmentSummary => Boolean(item));
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
    const baseline = weightedAverage(
      activeSections
        .map((section) => baselineBySection.get(section.id))
        .filter((item): item is AssessmentSummary => Boolean(item))
        .filter((item) => item.domainScores[key] !== null)
        .map((item) => ({ value: item.domainScores[key] as number, weight: item.studentsAssessed })),
    );
    const current = weightedAverage(
      activeSections
        .map((section) => latestBySection.get(section.id))
        .filter((item): item is AssessmentSummary => Boolean(item))
        .filter((item) => item.domainScores[key] !== null)
        .map((item) => ({ value: item.domainScores[key] as number, weight: item.studentsAssessed })),
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
    readingLevelGrowth:
      baselineReadingLevel !== null && currentReadingLevel !== null
        ? Math.round((currentReadingLevel - baselineReadingLevel) * 100) / 100
        : null,
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
    [],
    ['Metric', 'Value'],
    ['Students', String(input.analytics.students)],
    ['Classes', String(input.analytics.grades)],
    ['Sections', String(input.analytics.sections)],
    ['Teachers', String(input.analytics.teachers)],
    ['Sections On Track', String(input.analytics.onTrack)],
    ['Needs Support', String(input.analytics.needsSupport)],
    ['Intervention', String(input.analytics.intervention)],
    ['Baseline TS Level', input.analytics.baselineReadingLevel?.toFixed(2) || ''],
    ['Current TS Level', input.analytics.currentReadingLevel?.toFixed(2) || ''],
    ['Growth', input.analytics.readingLevelGrowth?.toFixed(2) || ''],
    [],
    ['Grade', 'Sections', 'Students', 'Current TS Level'],
    ...input.analytics.gradesSummary.map((item) => [
      item.gradeLabel,
      String(item.sections),
      String(item.students),
      item.averageReadingLevel?.toFixed(2) || '',
    ]),
    [],
    ['Domain', 'Baseline', 'Current', 'Change'],
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
