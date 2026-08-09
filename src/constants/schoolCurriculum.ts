export type SchoolPhonicsCourseId =
  | 'phonics-foundations'
  | 'early-phonics'
  | 'advanced-phonics';

export interface SchoolCurriculumStage {
  stageOrder: number;
  label: string;
  programmeReferenceReadingLevel: number;
}

export interface SchoolCurriculumCourse {
  id: SchoolPhonicsCourseId;
  label: string;
  stages: SchoolCurriculumStage[];
}

/**
 * School programme stage labels intentionally mirror the existing Tiny Steps
 * teacher progress editor so the B2B portal does not invent a second phonics
 * progression. `programmeReferenceReadingLevel` is an internal implementation
 * reference mapped to TS-0…TS-9; it is not an age norm, population norm, or
 * standardized benchmark.
 */
export const SCHOOL_PHONICS_COURSES: SchoolCurriculumCourse[] = [
  {
    id: 'phonics-foundations',
    label: 'Phonics Foundations',
    stages: [
      { stageOrder: 1, label: 'Stage 1 — First letter sounds', programmeReferenceReadingLevel: 1 },
      { stageOrder: 2, label: 'Stage 2 — Letter sounds set 2', programmeReferenceReadingLevel: 1.5 },
      { stageOrder: 3, label: 'Stage 3 — Letter sounds set 3', programmeReferenceReadingLevel: 2 },
      { stageOrder: 4, label: 'Stage 4 — Letter sounds set 4', programmeReferenceReadingLevel: 2.25 },
      { stageOrder: 5, label: 'Stage 5 — Letter sounds set 5', programmeReferenceReadingLevel: 2.5 },
      { stageOrder: 6, label: 'Stage 6 — Short vowels + review', programmeReferenceReadingLevel: 3 },
    ],
  },
  {
    id: 'early-phonics',
    label: 'Early Phonics',
    stages: [
      { stageOrder: 1, label: 'Stage 1 — Sound sets 1–5', programmeReferenceReadingLevel: 3 },
      { stageOrder: 2, label: 'Stage 2 — Sound sets 6–7 + short vowels', programmeReferenceReadingLevel: 3.5 },
      { stageOrder: 3, label: 'Stage 3 — Digraphs + silent letters', programmeReferenceReadingLevel: 4 },
      { stageOrder: 4, label: 'Stage 4 — Vowel teams + long vowels', programmeReferenceReadingLevel: 4.75 },
      { stageOrder: 5, label: 'Stage 5 — Magic E', programmeReferenceReadingLevel: 5.25 },
      { stageOrder: 6, label: 'Stage 6 — Longer words + review', programmeReferenceReadingLevel: 6 },
    ],
  },
  {
    id: 'advanced-phonics',
    label: 'Advanced Phonics',
    stages: [
      { stageOrder: 1, label: 'Stage 1 — Diphthongs', programmeReferenceReadingLevel: 6 },
      { stageOrder: 2, label: 'Stage 2 — Bossy R', programmeReferenceReadingLevel: 6.5 },
      { stageOrder: 3, label: 'Stage 3 — Special sounds + silent letters', programmeReferenceReadingLevel: 7 },
      { stageOrder: 4, label: 'Stage 4 — Alternate vowels', programmeReferenceReadingLevel: 7.5 },
      { stageOrder: 5, label: 'Stage 5 — Endings', programmeReferenceReadingLevel: 8 },
      { stageOrder: 6, label: 'Stage 6 — Revision', programmeReferenceReadingLevel: 9 },
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
