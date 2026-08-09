export type SchoolPhonicsCourseId =
  | 'phonics-foundations'
  | 'early-phonics'
  | 'advanced-phonics';

export interface SchoolCurriculumStage {
  stageOrder: number;
  label: string;
  expectedReadingLevel: number;
}

export interface SchoolCurriculumCourse {
  id: SchoolPhonicsCourseId;
  label: string;
  stages: SchoolCurriculumStage[];
}

/**
 * School programme stage labels intentionally mirror the existing Tiny Steps
 * teacher progress editor so the B2B portal does not invent a second phonics
 * progression. `expectedReadingLevel` is an internal programme-health mapping
 * to TS-0…TS-9; it is not a population norm or standardized benchmark.
 */
export const SCHOOL_PHONICS_COURSES: SchoolCurriculumCourse[] = [
  {
    id: 'phonics-foundations',
    label: 'Phonics Foundations',
    stages: [
      { stageOrder: 1, label: 'Stage 1 — First letter sounds', expectedReadingLevel: 1 },
      { stageOrder: 2, label: 'Stage 2 — Letter sounds set 2', expectedReadingLevel: 1.5 },
      { stageOrder: 3, label: 'Stage 3 — Letter sounds set 3', expectedReadingLevel: 2 },
      { stageOrder: 4, label: 'Stage 4 — Letter sounds set 4', expectedReadingLevel: 2.25 },
      { stageOrder: 5, label: 'Stage 5 — Letter sounds set 5', expectedReadingLevel: 2.5 },
      { stageOrder: 6, label: 'Stage 6 — Short vowels + review', expectedReadingLevel: 3 },
    ],
  },
  {
    id: 'early-phonics',
    label: 'Early Phonics',
    stages: [
      { stageOrder: 1, label: 'Stage 1 — Sound sets 1–5', expectedReadingLevel: 3 },
      { stageOrder: 2, label: 'Stage 2 — Sound sets 6–7 + short vowels', expectedReadingLevel: 3.5 },
      { stageOrder: 3, label: 'Stage 3 — Digraphs + silent letters', expectedReadingLevel: 4 },
      { stageOrder: 4, label: 'Stage 4 — Vowel teams + long vowels', expectedReadingLevel: 4.75 },
      { stageOrder: 5, label: 'Stage 5 — Magic E', expectedReadingLevel: 5.25 },
      { stageOrder: 6, label: 'Stage 6 — Longer words + review', expectedReadingLevel: 6 },
    ],
  },
  {
    id: 'advanced-phonics',
    label: 'Advanced Phonics',
    stages: [
      { stageOrder: 1, label: 'Stage 1 — Diphthongs', expectedReadingLevel: 6 },
      { stageOrder: 2, label: 'Stage 2 — Bossy R', expectedReadingLevel: 6.5 },
      { stageOrder: 3, label: 'Stage 3 — Special sounds + silent letters', expectedReadingLevel: 7 },
      { stageOrder: 4, label: 'Stage 4 — Alternate vowels', expectedReadingLevel: 7.5 },
      { stageOrder: 5, label: 'Stage 5 — Endings', expectedReadingLevel: 8 },
      { stageOrder: 6, label: 'Stage 6 — Revision', expectedReadingLevel: 9 },
    ],
  },
];

export function getSchoolCurriculumCourse(
  courseId: string,
): SchoolCurriculumCourse | null {
  return SCHOOL_PHONICS_COURSES.find((course) => course.id === courseId) || null;
}

export function getSchoolCurriculumStage(
  courseId: string,
  stageOrder: number,
): SchoolCurriculumStage | null {
  const course = getSchoolCurriculumCourse(courseId);
  return course?.stages.find((stage) => stage.stageOrder === stageOrder) || null;
}

export function curriculumPercent(stageOrder: number, totalStages = 6): number {
  if (!Number.isFinite(stageOrder) || totalStages <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((stageOrder / totalStages) * 100)));
}
