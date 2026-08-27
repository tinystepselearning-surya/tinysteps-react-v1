import {
  CANONICAL_PHONICS_TOPICS,
  PHONICS_CURRICULUM_REVISION as SHARED_PHONICS_CURRICULUM_REVISION,
  type CanonicalPhonicsCourseId,
  type CanonicalPhonicsTopic,
} from '../../functions/src/phonicsCurriculumConfig';

export type PhonicsCourseId = CanonicalPhonicsCourseId;

export type PhonicsLessonRubric =
  | 'single_sound'
  | 'short_vowels'
  | 'sound_set'
  | 'digraph'
  | 'vowel_team'
  | 'magic_e'
  | 'diphthong'
  | 'r_controlled'
  | 'alternate_vowel'
  | 'suffix_ending'
  | 'rule'
  | 'revision';

export type PhonicsStage = {
  stageOrder: number;
  label: string;
  start: number;
  end: number;
};

export type PhonicsLesson = Omit<CanonicalPhonicsTopic, 'rubricType'> & {
  rubricType: PhonicsLessonRubric;
};

export type PhonicsCourseDefinition = {
  id: PhonicsCourseId;
  label: string;
  publicSlug: string;
  lessonCount: number;
  summary: string;
  stages: PhonicsStage[];
};

/**
 * The server enforcement module is the single canonical lesson source for phonics.
 * The web curriculum derives its lesson order, ids, stage metadata and rubric type
 * from that source so frontend and server cannot silently drift.
 */
export const PHONICS_CURRICULUM_REVISION = SHARED_PHONICS_CURRICULUM_REVISION;

const PHONICS_COURSE_IDS = [
  'phonics-foundations',
  'early-phonics',
  'advanced-phonics',
] as const satisfies readonly PhonicsCourseId[];

const COURSE_PUBLIC_META: Record<
  PhonicsCourseId,
  Pick<PhonicsCourseDefinition, 'publicSlug' | 'summary'>
> = {
  'phonics-foundations': {
    publicSlug: 'phonics-foundation',
    summary: '31 lessons covering individual letter sounds, short vowels, structured revision, and a grand revision.',
  },
  'early-phonics': {
    publicSlug: 'phonics-brush-up',
    summary: '40 lessons progressing through sound sets, phonics rules, digraphs, vowel teams, Magic E, controlling R, diphthongs, and advanced sound patterns.',
  },
  'advanced-phonics': {
    publicSlug: 'phonics-advanced',
    summary: '30 lessons consolidating core rules before advanced vowel families, controlling R, SHUN, diphthongs, and lazy-vowel patterns.',
  },
};

const PHONICS_RUBRIC_TYPES = new Set<PhonicsLessonRubric>([
  'single_sound',
  'short_vowels',
  'sound_set',
  'digraph',
  'vowel_team',
  'magic_e',
  'diphthong',
  'r_controlled',
  'alternate_vowel',
  'suffix_ending',
  'rule',
  'revision',
]);

function toPhonicsLesson(topic: CanonicalPhonicsTopic): PhonicsLesson {
  if (!PHONICS_RUBRIC_TYPES.has(topic.rubricType as PhonicsLessonRubric)) {
    throw new Error(`Unsupported phonics rubric type ${topic.rubricType} for ${topic.id}`);
  }
  return {
    ...topic,
    rubricType: topic.rubricType as PhonicsLessonRubric,
  };
}

export const PHONICS_CURRICULUM_TOPICS: PhonicsLesson[] =
  CANONICAL_PHONICS_TOPICS.map(toPhonicsLesson);

export const PHONICS_LESSONS_BY_COURSE: Record<PhonicsCourseId, PhonicsLesson[]> =
  PHONICS_COURSE_IDS.reduce<Record<PhonicsCourseId, PhonicsLesson[]>>((acc, courseId) => {
    acc[courseId] = PHONICS_CURRICULUM_TOPICS.filter((topic) => topic.courseId === courseId);
    return acc;
  }, {
    'phonics-foundations': [],
    'early-phonics': [],
    'advanced-phonics': [],
  });

function deriveStages(courseId: PhonicsCourseId): PhonicsStage[] {
  const lessons = PHONICS_LESSONS_BY_COURSE[courseId];
  const stages = new Map<number, PhonicsStage>();

  lessons.forEach((lesson) => {
    const existing = stages.get(lesson.stageOrder);
    if (!existing) {
      stages.set(lesson.stageOrder, {
        stageOrder: lesson.stageOrder,
        label: lesson.stageLabel,
        start: lesson.lessonNumber,
        end: lesson.lessonNumber,
      });
      return;
    }
    if (existing.label !== lesson.stageLabel) {
      throw new Error(`Conflicting phonics stage labels for ${courseId} stage ${lesson.stageOrder}`);
    }
    existing.start = Math.min(existing.start, lesson.lessonNumber);
    existing.end = Math.max(existing.end, lesson.lessonNumber);
  });

  return Array.from(stages.values()).sort((a, b) => a.stageOrder - b.stageOrder);
}

export const PHONICS_STAGE_DEFINITIONS: Record<PhonicsCourseId, PhonicsStage[]> = {
  'phonics-foundations': deriveStages('phonics-foundations'),
  'early-phonics': deriveStages('early-phonics'),
  'advanced-phonics': deriveStages('advanced-phonics'),
};

function courseDefinition(courseId: PhonicsCourseId): PhonicsCourseDefinition {
  const lessons = PHONICS_LESSONS_BY_COURSE[courseId];
  const firstLesson = lessons[0];
  if (!firstLesson) throw new Error(`Missing canonical phonics lessons for ${courseId}`);
  return {
    id: courseId,
    label: firstLesson.courseLabel,
    lessonCount: lessons.length,
    stages: PHONICS_STAGE_DEFINITIONS[courseId],
    ...COURSE_PUBLIC_META[courseId],
  };
}

export const PHONICS_COURSES: Record<PhonicsCourseId, PhonicsCourseDefinition> = {
  'phonics-foundations': courseDefinition('phonics-foundations'),
  'early-phonics': courseDefinition('early-phonics'),
  'advanced-phonics': courseDefinition('advanced-phonics'),
};

export const PHONICS_DISPLAY_TITLES: Record<string, string> =
  PHONICS_CURRICULUM_TOPICS.reduce<Record<string, string>>((acc, lesson) => {
    acc[lesson.id] = lesson.displayTitle;
    return acc;
  }, {});

export function isPhonicsCourseId(value?: string | null): value is PhonicsCourseId {
  return Boolean(value && value in PHONICS_COURSES);
}

export function getPhonicsLessons(courseId?: string | null): PhonicsLesson[] {
  return isPhonicsCourseId(courseId) ? PHONICS_LESSONS_BY_COURSE[courseId] : [];
}

export function getPhonicsCourseByPublicSlug(slug?: string | null): PhonicsCourseDefinition | null {
  if (!slug) return null;
  return Object.values(PHONICS_COURSES).find((course) => course.publicSlug === slug) ?? null;
}
