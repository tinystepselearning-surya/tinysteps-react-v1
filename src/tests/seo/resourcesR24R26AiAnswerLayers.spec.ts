import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AI_ANSWER_LAYER_1_PARENT_PROBLEMS,
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
  AI_ANSWER_LAYER_ALL_ITEMS,
  AI_ANSWER_LAYER_MACHINE_JSON_PATH,
  AI_ANSWER_LAYER_MACHINE_TEXT_PATH,
  getAiAnswerLayerSubjectItems,
} from '../../lib/aiAnswerLayerRegistry.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';
import { GRAMMAR_PROGRAMMATIC_PAGES } from '../../lib/grammarProgrammaticRegistry.js';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Resources R24-R26 AI answer layers', () => {
  it('reconciles all frozen parent problem systems into Layer 1', () => {
    expect(AI_ANSWER_LAYER_1_PARENT_PROBLEMS).toHaveLength(28);
    expect(getAiAnswerLayerSubjectItems(1, 'phonics-reading')).toHaveLength(9);
    expect(getAiAnswerLayerSubjectItems(1, 'grammar-writing')).toHaveLength(10);
    expect(getAiAnswerLayerSubjectItems(1, 'speaking-communication')).toHaveLength(9);
  });

  it('builds Layer 2 from curated concepts plus governed phonics and grammar resources', () => {
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);
    expect(GRAMMAR_PROGRAMMATIC_PAGES).toHaveLength(15);
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(73);
    const phonics = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/phonics/'),
    );
    const grammar = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/grammar/'),
    );
    expect(phonics).toHaveLength(31);
    expect(grammar).toHaveLength(15);
    expect(new Set(phonics.map((item) => item.canonicalPath)).size).toBe(31);
    expect(new Set(grammar.map((item) => item.canonicalPath)).size).toBe(15);
  });

  it('keeps Layer 3 focused on existing practice owners', () => {
    expect(AI_ANSWER_LAYER_3_PRACTICE_ACTIONS).toHaveLength(11);
    expect(AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.every((item) => Boolean(item.answer))).toBe(true);
    expect(AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.some((item) => item.canonicalPath === '/book-demo')).toBe(false);
  });

  it('keeps canonical ownership intact and routes every item through a Resources subject hub', () => {
    expect(new Set(AI_ANSWER_LAYER_ALL_ITEMS.map((item) => item.id)).size).toBe(AI_ANSWER_LAYER_ALL_ITEMS.length);
    for (const item of AI_ANSWER_LAYER_ALL_ITEMS) {
      expect(item.canonicalPath.startsWith('/')).toBe(true);
      expect(item.hubPath.startsWith('/resources/')).toBe(true);
      expect(['/phonics', '/grammar', '/speaking', '/book-demo']).not.toContain(item.canonicalPath);
    }
  });

  it('adds the explicit answer directory at /resources while preserving the frozen subject-hub teaching structure', () => {
    const component = read('src/components/resources/AiAnswerLayerDirectory.tsx');
    const resources = read('src/pages/ResourcesPage.tsx');
    const subjects = read('src/pages/SubjectResourcesPage.tsx');
    expect(component).toContain('Start with a question → understand the skill → choose practice');
    expect(component).not.toContain('search engines and AI retrieval systems');
    expect(component).not.toContain('canonical owner');
    expect(component).toContain('data-ai-answer-layer');
    expect(component).toContain('data-ai-query');
    expect(resources).toContain('<AiAnswerLayerDirectory />');
    expect(subjects).toContain('Learn the pathway');
    expect(subjects).toContain('Practise the skill');
    expect(subjects).toContain('Solve a problem');
    expect(subjects).not.toContain('AiAnswerLayerDirectory');
  });

  it('generates machine-readable JSON/text and advertises them through llms discovery', () => {
    const generator = read('scripts/generate-rss.mjs');
    expect(AI_ANSWER_LAYER_MACHINE_JSON_PATH).toBe('/ai-resource-index.json');
    expect(AI_ANSWER_LAYER_MACHINE_TEXT_PATH).toBe('/ai-resource-index.txt');
    expect(generator).toContain('buildAiResourceIndex');
    expect(generator).toContain('buildAiResourceText');
    expect(generator).toContain('buildAiAnswerLlmSection');
    expect(generator).toContain('AI Answer Layers — problem, concept, practice');
  });

  it('connects the full current content corpus instead of only the earlier curated blog subset', () => {
    const generator = read('scripts/generate-rss.mjs');
    expect(generator).toContain('buildEditorialBlogCorpus');
    expect(generator).not.toContain('buildRetiredEditorialSourceCorpus');
    expect(generator).toContain('buildProgrammaticPhonicsCorpus');
    expect(generator).toContain('buildProgrammaticGrammarCorpus');
    expect(generator).toContain('buildPublicRouteCorpus');
    expect(generator).toContain('PUBLIC_ROUTE_MANIFEST');
    expect(generator).toContain('buildCompleteBlogLlmSection');
    expect(generator).toContain('Complete Editorial Blog Corpus');
    expect(generator).toContain('editorial_blogs: editorialBlogs');
    expect(generator).not.toContain('retired_editorial_sources:');
    expect(generator).not.toContain('editorial_source_records:');
    expect(generator).toContain('programmatic_phonics_guides: programmaticPhonics');
    expect(generator).toContain('programmatic_grammar_guides: programmaticGrammar');
    expect(generator).toContain('additional_public_routes: publicRoutes');
    expect(generator).toContain('supporting-only-noindex');

    const audit = read('scripts/audit-ai-answer-layers.mjs');
    expect(audit).toContain('expectedLiveBlogCount');
    expect(audit).toContain('editorial-blog-baseline-regression');
    expect(audit).toContain('retired-lineage-leak');
    expect(audit).toContain('programmatic-grammar-corpus-count');
    expect(audit).toContain('public-route-manifest-coverage');
  });
});
