import { HttpsError } from 'firebase-functions/v2/https';

export type SchoolPhonicsCourseId =
  | 'phonics-foundations'
  | 'early-phonics'
  | 'advanced-phonics';

export interface SchoolCurriculumStageDefinition {
  stageOrder: number;
  label: string;
  programmeReferenceReadingLevel: number;
}

export interface SchoolCurriculumCourseDefinition {
  id: SchoolPhonicsCourseId;
  label: string;
  stages: SchoolCurriculumStageDefinition[];
}

export const SCHOOL_PHONICS_COURSES: SchoolCurriculumCourseDefinition[] = [
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

export function requireSchoolCourse(courseId: unknown): SchoolCurriculumCourseDefinition {
  if (typeof courseId !== 'string') {
    throw new HttpsError('invalid-argument', 'courseId is required');
  }
  const course = SCHOOL_PHONICS_COURSES.find((item) => item.id === courseId.trim());
  if (!course) throw new HttpsError('invalid-argument', 'Unsupported phonics course');
  return course;
}

export function requireSchoolStage(
  course: SchoolCurriculumCourseDefinition,
  stageOrderInput: unknown,
): SchoolCurriculumStageDefinition | null {
  const stageOrder = Number(stageOrderInput);
  if (stageOrder === 0) return null;
  if (!Number.isInteger(stageOrder)) {
    throw new HttpsError(
      'invalid-argument',
      `stageOrder must be an integer from 0 to ${course.stages.length}`,
    );
  }
  const stage = course.stages.find((item) => item.stageOrder === stageOrder);
  if (!stage) throw new HttpsError('invalid-argument', 'Invalid curriculum stage');
  return stage;
}

export const curriculumPercent = (stageOrder: number, totalStages = 6): number =>
  Math.max(0, Math.min(100, Math.round((stageOrder / totalStages) * 100)));
