import type { GrammarProgrammaticPublishedPage } from './grammarProgrammaticRegistry';
import type { GrammarReferenceExtensionPage } from './grammarReferenceExtensionRegistry';

export type GrammarKnowledgePage =
  | GrammarProgrammaticPublishedPage
  | GrammarReferenceExtensionPage;

export const GRAMMAR_KNOWLEDGE_PAGES: readonly GrammarKnowledgePage[];
export const GRAMMAR_KNOWLEDGE_PATHS: readonly string[];
export function getGrammarKnowledgePageBySlug(slug: string): GrammarKnowledgePage | null;
export function getGrammarKnowledgePageByPath(pathname: string): GrammarKnowledgePage | null;
