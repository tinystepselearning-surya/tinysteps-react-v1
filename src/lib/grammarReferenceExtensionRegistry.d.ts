export type GrammarReferenceExtensionPage = {
  state: 'reference-extension';
  referenceOrder: number;
  id: string;
  slug: string;
  cardTitle: string;
  seoTitle: string;
  seoDescription: string;
  quickAnswer: string;
  concept: string;
  whyItMatters: string;
  examples: readonly string[];
  commonMistakes: readonly string[];
  practicePrompts: readonly string[];
  relatedPaths: readonly string[];
  sourceIds: readonly string[];
  rulePoints: readonly string[];
  workedExamples: readonly {
    example: string;
    explanation: string;
  }[];
  teachingNote: string;
  trickyCases: readonly string[];
  faqs: readonly {
    question: string;
    answer: string;
  }[];
  sources: readonly {
    id: string;
    publisher: string;
    title: string;
    url: string;
    note: string;
  }[];
  hubPath: '/resources/grammar';
  path: string;
};

export const GRAMMAR_REFERENCE_EXTENSION_REVISION: string;
export const GRAMMAR_REFERENCE_EXTENSION_PAGES: readonly GrammarReferenceExtensionPage[];
export const GRAMMAR_REFERENCE_EXTENSION_PATHS: readonly string[];
export const GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO: Readonly<Record<string, {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: string;
}>>;
export function getGrammarReferenceExtensionPageBySlug(slug: string): GrammarReferenceExtensionPage | null;
export function getGrammarReferenceExtensionPageByPath(pathname: string): GrammarReferenceExtensionPage | null;
