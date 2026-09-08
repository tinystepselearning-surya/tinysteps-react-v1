import { SEMANTIC_FACTS } from '../config/semanticFacts';
import {
  catalogs as baseCatalogs,
  curriculumBySlug,
  type CourseCatalogItem,
} from './courses';

type PublicCourseSemanticMeta = {
  age: string;
  lessonCount: number;
};

const PUBLIC_COURSE_SEMANTIC_META: Record<string, PublicCourseSemanticMeta> = {
  [SEMANTIC_FACTS.programmes.phonics.levels.foundations.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.phonics.levels.foundations.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.phonics.levels.foundations.lessonCount,
  },
  [SEMANTIC_FACTS.programmes.phonics.levels.early.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.phonics.levels.early.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.phonics.levels.early.lessonCount,
  },
  [SEMANTIC_FACTS.programmes.phonics.levels.advanced.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.phonics.levels.advanced.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.phonics.levels.advanced.lessonCount,
  },
  [SEMANTIC_FACTS.programmes.grammar.levels.beginner.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.grammar.levels.beginner.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.grammar.levels.beginner.lessonCount,
  },
  [SEMANTIC_FACTS.programmes.grammar.levels.advanced.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.grammar.levels.advanced.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.grammar.levels.advanced.lessonCount,
  },
  [SEMANTIC_FACTS.programmes.speaking.levels.beginner.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.speaking.levels.beginner.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.speaking.levels.beginner.lessonCount,
  },
  [SEMANTIC_FACTS.programmes.speaking.levels.advanced.publicSlug]: {
    age: SEMANTIC_FACTS.programmes.speaking.levels.advanced.ageRange.label,
    lessonCount: SEMANTIC_FACTS.programmes.speaking.levels.advanced.lessonCount,
  },
};

/**
 * Public course catalog projection.
 *
 * `courses.ts` remains the detailed curriculum/content definition. Public-facing
 * age and lesson-count claims are overlaid from the Brick 1 semantic registry so
 * course pages, pricing and schema cannot drift from the approved entity facts.
 */
export const catalogs: CourseCatalogItem[] = baseCatalogs.map((course) => {
  const semantic = PUBLIC_COURSE_SEMANTIC_META[course.slug];
  if (!semantic) return course;

  return {
    ...course,
    age: semantic.age,
    duration: `${semantic.lessonCount} lessons`,
  };
});

export { curriculumBySlug };
export type { CourseCatalogItem } from './courses';
