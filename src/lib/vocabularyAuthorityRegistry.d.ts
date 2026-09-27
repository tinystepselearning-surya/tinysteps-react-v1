import type { VocabularyAuthoritySource } from './vocabularyAuthoritySources';

export type VocabularyAuthorityPage = Readonly<{
  state: 'vocabulary-authority';
  publicationApproved: true;
  publicationBatch: 'gv4-first-authority-batch';
  hubPath: '/resources/vocabulary';
  practicePath: '/free-games/word-meaning-flashcards';
  order: number;
  id: string;
  stageId: string;
  slug: string;
  path: string;
  cardTitle: string;
  seoTitle: string;
  seoDescription: string;
  parentQuestion: string;
  quickAnswer: string;
  concept: string;
  whyItMatters: string;
  teachingPoints: readonly string[];
  wordGroups: readonly Readonly<{
    label: string;
    words: readonly string[];
    note: string;
  }>[];
  workedExamples: readonly Readonly<{
    example: string;
    explanation: string;
  }>[];
  examples: readonly string[];
  commonMistakes: readonly string[];
  trickyCases: readonly string[];
  teachingNote: string;
  practicePrompts: readonly string[];
  faqs: readonly Readonly<{
    question: string;
    answer: string;
  }>[];
  sourceIds: readonly string[];
  sources: readonly VocabularyAuthoritySource[];
  relatedPaths: readonly string[];
}>;

export const VOCABULARY_AUTHORITY_PAGES: readonly VocabularyAuthorityPage[];
export const VOCABULARY_AUTHORITY_PATHS: readonly string[];
export const VOCABULARY_AUTHORITY_RESOURCE_SEO: Readonly<Record<string, Readonly<{
  title: string;
  description: string;
  canonicalPath: string;
  ogType: string;
}>>>;
export function getVocabularyAuthorityPageBySlug(slug: string): VocabularyAuthorityPage | null;
export function getVocabularyAuthorityPageByPath(pathname: string): VocabularyAuthorityPage | null;
