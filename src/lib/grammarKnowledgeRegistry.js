import {
  GRAMMAR_PROGRAMMATIC_PAGES,
  getGrammarProgrammaticPageByPath,
  getGrammarProgrammaticPageBySlug,
} from './grammarProgrammaticRegistry.js';
import {
  GRAMMAR_REFERENCE_EXTENSION_PAGES,
  getGrammarReferenceExtensionPageByPath,
  getGrammarReferenceExtensionPageBySlug,
} from './grammarReferenceExtensionRegistry.js';

const freezeList = (values = []) => Object.freeze([...values]);

export const GRAMMAR_KNOWLEDGE_PAGES = freezeList([
  ...GRAMMAR_PROGRAMMATIC_PAGES,
  ...GRAMMAR_REFERENCE_EXTENSION_PAGES,
]);

export const GRAMMAR_KNOWLEDGE_PATHS = freezeList(
  GRAMMAR_KNOWLEDGE_PAGES.map((page) => page.path),
);

export const getGrammarKnowledgePageBySlug = (slug) =>
  getGrammarProgrammaticPageBySlug(slug)
  ?? getGrammarReferenceExtensionPageBySlug(slug)
  ?? null;

export const getGrammarKnowledgePageByPath = (pathname) =>
  getGrammarProgrammaticPageByPath(pathname)
  ?? getGrammarReferenceExtensionPageByPath(pathname)
  ?? null;

if (GRAMMAR_KNOWLEDGE_PAGES.length !== 38) {
  throw new Error(`GV3 expected 38 total published Grammar knowledge pages; found ${GRAMMAR_KNOWLEDGE_PAGES.length}.`);
}
if (new Set(GRAMMAR_KNOWLEDGE_PATHS).size !== GRAMMAR_KNOWLEDGE_PATHS.length) {
  throw new Error('Grammar knowledge paths must remain unique across progression and reference-extension pages.');
}
