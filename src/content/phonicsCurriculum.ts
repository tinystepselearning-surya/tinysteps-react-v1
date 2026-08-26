import {
  CANONICAL_PHONICS_COURSE_LABELS,
  CANONICAL_PHONICS_STAGE_DEFINITIONS,
  CANONICAL_PHONICS_TOPICS,
  PHONICS_CURRICULUM_REVISION as SHARED_PHONICS_CURRICULUM_REVISION,
  type CanonicalPhonicsCourseId,
  type CanonicalPhonicsRubricType,
  type CanonicalPhonicsStage,
  type CanonicalPhonicsTopic,
} from '../../functions/src/phonicsCurriculumConfig';

export type PhonicsCourseId = CanonicalPhonicsCourseId;
export type PhonicsLessonRubric = CanonicalPhonicsRubricType;
export type PhonicsStage = CanonicalPhonicsStage;
export type PhonicsLesson = CanonicalPhonicsTopic;

export type PhonicsCourseDefinition = {
  id: PhonicsCourseId;
  label: string;
  publicSlug: string;
  lessonCount: number;
  summary: string;
  stages: PhonicsStage[];
};

/**
 * Browser adapter for the shared server-safe canonical phonics source.
 *
 * Lesson ids, labels, ordering, stages, rubric metadata and curriculum revision
 * are imported directly from functions/src/phonicsCurriculumConfig.ts. Do not
 * recreate phonics lesson arrays or rubric inference in the web client.
 */
export const PHONICS_CURRICULUM_REVISION = SHARED_PHONICS_CURRICULUM_REVISION;

export const PHONICS_STAGE_DEFINITIONS: Record<PhonicsCourseId, PhonicsStage[]> =
  CANONICAL_PHONICS_STAGE_DEFINITIONS;

export const PHONICS_LESSONS_BY_COURSE: Record<PhonicsCourseId, PhonicsLesson[]> = {
  'phonics-foundations': CANONICAL_PHONICS_TOPICS.filter(
    (topic) => topic.courseId === 'phonics-foundations',
  ),
  'early-phonics': CANONICAL_PHONICS_TOPICS.filter(
    (topic) => topic.courseId === 'early-phonics',
  ),
  'advanced-phonics': CANONICAL_PHONICS_TOPICS.filter(
    (topic) => topic.courseId === 'advanced-phonics',
  ),
};

export const PHONICS_COURSES: Record<PhonicsCourseId, PhonicsCourseDefinition> = {
  'phonics-foundations': {
    id: 'phonics-foundations',
    label: CANONICAL_PHONICS_COURSE_LABELS['phonics-foundations'],
    publicSlug: 'phonics-foundation',
    lessonCount: PHONICS_LESSONS_BY_COURSE['phonics-foundations'].length,
    summary: '31 lessons covering individual letter sounds, short vowels, structured revision, and a grand revision.',
    stages: PHONICS_STAGE_DEFINITIONS['phonics-foundations'],
  },
  'early-phonics': {
    id: 'early-phonics',
    label: CANONICAL_PHONICS_COURSE_LABELS['early-phonics'],
    publicSlug: 'phonics-brush-up',
    lessonCount: PHONICS_LESSONS_BY_COURSE['early-phonics'].length,
    summary: '40 lessons progressing through sound sets, phonics rules, digraphs, vowel teams, Magic E, controlling R, diphthongs, and advanced sound patterns.',
    stages: PHONICS_STAGE_DEFINITIONS['early-phonics'],
  },
  'advanced-phonics': {
    id: 'advanced-phonics',
    label: CANONICAL_PHONICS_COURSE_LABELS['advanced-phonics'],
    publicSlug: 'phonics-advanced',
    lessonCount: PHONICS_LESSONS_BY_COURSE['advanced-phonics'].length,
    summary: '30 lessons consolidating core rules before advanced vowel families, controlling R, SHUN, diphthongs, and lazy-vowel patterns.',
    stages: PHONICS_STAGE_DEFINITIONS['advanced-phonics'],
  },
};

export const PHONICS_CURRICULUM_TOPICS: PhonicsLesson[] = CANONICAL_PHONICS_TOPICS;

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
