export type GrammarResourceLevel = 'beginner' | 'advanced';

export type GrammarCurriculumRef = Readonly<{
  courseId: 'basic-grammar' | 'advanced-grammar';
  lessonNumber: number;
}>;

export type GrammarPublishedResourcePage = Readonly<{
  id: string;
  slug: string;
  path: string;
  level: GrammarResourceLevel;
  stageOrder: number;
  progressionRank: number;
  label: string;
  cardTitle: string;
  parentQuestion: string;
  quickAnswer: string;
  teachingBoundary: string;
  examples: readonly string[];
  teachingSteps: readonly string[];
  commonMistakes: readonly string[];
  practiceIdeas: readonly string[];
  curriculumRefs: readonly GrammarCurriculumRef[];
  prerequisiteIds: readonly string[];
  nextIds: readonly string[];
  relatedPaths: readonly string[];
  practicePaths: readonly string[];
  publicationState: 'published';
}>;

export declare const GRAMMAR_PUBLICATION_REVISION: string;
export declare const GRAMMAR_PUBLICATION_PREFIX: '/resources/grammar';
export declare const GRAMMAR_PUBLISHED_RESOURCE_PAGES: readonly GrammarPublishedResourcePage[];
export declare const GRAMMAR_PUBLISHED_RESOURCE_PATHS: readonly string[];
export declare const GRAMMAR_PUBLISHED_RESOURCE_SEO: Readonly<Record<string, Readonly<{
  title: string;
  description: string;
  canonicalPath: string;
  robots: string;
  ogType: 'website';
}>>>;

export declare function getPublishedGrammarResourcePageBySlug(slug: unknown): GrammarPublishedResourcePage | null;
export declare function getPublishedGrammarResourcePageById(id: unknown): GrammarPublishedResourcePage | null;
export declare function getPublishedGrammarResourcePageByPath(pathname: unknown): GrammarPublishedResourcePage | null;
export declare function getPublishedGrammarResourcePagesForStage(level: GrammarResourceLevel, stageOrder: number): readonly GrammarPublishedResourcePage[];
