export type GrammarProgrammaticPublishedPage = {
  state: 'published';
  order: number;
  id: string;
  slug: string;
  cardTitle: string;
  seoTitle: string;
  seoDescription: string;
  quickAnswer: string;
  concept: string;
  examples: readonly string[];
  commonMistakes: readonly string[];
  practicePrompts: readonly string[];
  relatedPaths: readonly string[];
  hubPath: '/resources/grammar';
  path: string;
};

export type GrammarProgrammaticExistingOwner = {
  state: 'existing-owner';
  order: number;
  id: string;
  label: string;
  path: string;
  reason: string;
  hubPath: '/resources/grammar';
};

export type GrammarProgrammaticSequenceEntry =
  | GrammarProgrammaticPublishedPage
  | GrammarProgrammaticExistingOwner;

export const GRAMMAR_PROGRAMMATIC_REVISION: string;
export const GRAMMAR_PROGRAMMATIC_SEQUENCE: readonly GrammarProgrammaticSequenceEntry[];
export const GRAMMAR_PROGRAMMATIC_PAGES: readonly GrammarProgrammaticPublishedPage[];
export const GRAMMAR_PROGRAMMATIC_PATHS: readonly string[];
export function getGrammarProgrammaticPageBySlug(slug: string): GrammarProgrammaticPublishedPage | null;
export function getGrammarProgrammaticPageByPath(pathname: string): GrammarProgrammaticPublishedPage | null;
