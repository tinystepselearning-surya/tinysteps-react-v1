import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GRAMMAR_PROGRAMMATIC_PAGES,
  GRAMMAR_PROGRAMMATIC_SEQUENCE,
} from '../../lib/grammarProgrammaticRegistry.js';
import {
  GRAMMAR_REFERENCE_EXTENSION_PAGES,
  GRAMMAR_REFERENCE_EXTENSION_PATHS,
  GRAMMAR_REFERENCE_EXTENSION_REVISION,
  GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO,
} from '../../lib/grammarReferenceExtensionRegistry.js';
import {
  GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST,
} from '../../lib/grammarReferenceExtensionSeoManifest.js';
import {
  GRAMMAR_KNOWLEDGE_PAGES,
  GRAMMAR_KNOWLEDGE_PATHS,
} from '../../lib/grammarKnowledgeRegistry.js';
import {
  GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS,
} from '../../lib/grammarVocabularyAuthorityRequirements.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { AI_ANSWER_LAYER_2_LEARNING_CONCEPTS } from '../../lib/aiAnswerLayerRegistry.js';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const knowledgeWordCount = (page: (typeof GRAMMAR_REFERENCE_EXTENSION_PAGES)[number]) => countWords([
  page.quickAnswer,
  page.concept,
  page.whyItMatters,
  ...page.examples,
  ...page.commonMistakes,
  ...page.practicePrompts,
  ...page.rulePoints,
  ...page.workedExamples.flatMap((item) => [item.example, item.explanation]),
  page.teachingNote,
  ...page.trickyCases,
  ...page.faqs.flatMap((item) => [item.question, item.answer]),
].join(' '));

const FIRST_BATCH_IDS = [
  'determiners',
  'countable-uncountable-nouns',
  'noun-phrases',
  'verb-forms-irregular-verbs',
  'word-order-focus',
  'common-grammar-mistakes',
];

describe('GV3 first Grammar reference-extension publication batch', () => {
  it('preserves the 38-step Grammar progression while publishing six separate reference extensions', () => {
    expect(GRAMMAR_PROGRAMMATIC_SEQUENCE).toHaveLength(38);
    expect(GRAMMAR_PROGRAMMATIC_PAGES).toHaveLength(32);
    expect(GRAMMAR_REFERENCE_EXTENSION_REVISION).toBe('2026-09-27-gv3');
    expect(GRAMMAR_REFERENCE_EXTENSION_PAGES).toHaveLength(6);
    expect(GRAMMAR_REFERENCE_EXTENSION_PAGES.map((page) => page.id)).toEqual(FIRST_BATCH_IDS);
    expect(GRAMMAR_REFERENCE_EXTENSION_PAGES.map((page) => page.referenceOrder)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(GRAMMAR_KNOWLEDGE_PAGES).toHaveLength(38);
    expect(GRAMMAR_KNOWLEDGE_PATHS).toHaveLength(38);
    expect(new Set(GRAMMAR_KNOWLEDGE_PATHS).size).toBe(38);
  });

  it('publishes only topics already approved as GV1 reference-extension requirements', () => {
    const requirementIds = new Set(GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS.map((item) => item.id));
    for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
      expect(requirementIds.has(page.id), page.id).toBe(true);
      expect(page.state).toBe('reference-extension');
      expect(page.publicationApproved).toBe(true);
      expect(page.publicationBatch).toBe('gv3-first-reference-batch');
      expect(page.hubPath).toBe('/resources/grammar');
    }
    expect(GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS).toHaveLength(12);
  });

  it('meets the stronger GV1 authority-content floor for every published reference page', () => {
    for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
      expect(countWords(page.quickAnswer), page.id).toBeGreaterThanOrEqual(20);
      expect(countWords(page.concept), page.id).toBeGreaterThanOrEqual(20);
      expect(countWords(page.whyItMatters), page.id).toBeGreaterThanOrEqual(25);
      expect(knowledgeWordCount(page), page.id).toBeGreaterThanOrEqual(600);
      expect(page.rulePoints, page.id).toHaveLength(3);
      expect(page.workedExamples, page.id).toHaveLength(3);
      expect(page.examples, page.id).toHaveLength(3);
      expect(page.commonMistakes, page.id).toHaveLength(3);
      expect(page.trickyCases, page.id).toHaveLength(2);
      expect(page.practicePrompts, page.id).toHaveLength(3);
      expect(page.faqs, page.id).toHaveLength(2);
      expect(page.sources.length, page.id).toBeGreaterThanOrEqual(2);
      expect(new Set(page.sources.map((source) => source.url)).size, page.id).toBe(page.sources.length);
      for (const source of page.sources) {
        expect(source.url.startsWith('https://'), page.id + ':' + source.id).toBe(true);
        expect(source.publisher.length, page.id + ':' + source.id).toBeGreaterThan(3);
        expect(source.note.length, page.id + ':' + source.id).toBeGreaterThan(20);
      }
    }
  });

  it('keeps a lightweight manifest aligned with all six rich-content pages', () => {
    expect(GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST).toHaveLength(6);
    expect(GRAMMAR_REFERENCE_EXTENSION_PATHS).toHaveLength(6);
    expect(new Set(GRAMMAR_REFERENCE_EXTENSION_PATHS).size).toBe(6);
    for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
      const manifest = GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST.find((entry) => entry.id === page.id);
      expect(manifest?.path, page.id).toBe(page.path);
      expect(manifest?.cardTitle, page.id).toBe(page.cardTitle);
      expect(manifest?.relatedPaths, page.id).toEqual(page.relatedPaths);
      expect(GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO[page.path]?.canonicalPath, page.id).toBe(page.path);
      expect(GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO[page.path]?.title, page.id).toBe(page.seoTitle);
    }
  });

  it('wires every GV3 page into routing, SEO, canonical ownership and the public discovery graph', () => {
    const manifestPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    const owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) => entry.id.startsWith('gv3-grammar-ref-'));
    expect(owners).toHaveLength(6);

    for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
      expect(manifestPaths.has(page.path), page.path).toBe(true);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.path).toBe(page.path);
      const owner = owners.find((entry) => entry.ownerPath === page.path);
      expect(owner?.subject, page.id).toBe('grammar-writing');
      expect(owner?.intent, page.id).toBe('informational');
      expect(owner?.ownerRole, page.id).toBe('skill-guide');
      expect(owner?.hubPath, page.id).toBe('/resources/grammar');
    }
  });

  it('adds all six reference guides to the AI concept layer without turning the Grammar programme into an answer owner', () => {
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(96);
    const grammarItems = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/grammar/'),
    );
    expect(grammarItems).toHaveLength(38);
    for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
      const item = grammarItems.find((candidate) => candidate.canonicalPath === page.path);
      expect(item?.answer, page.id).toBe(page.quickAnswer);
      expect(item?.hubPath, page.id).toBe('/resources/grammar');
      expect(item?.canonicalPath, page.id).not.toBe('/grammar');
    }
  });

  it('uses the shared Grammar renderer but labels reference pages separately from the 38-step curriculum sequence', () => {
    const renderer = read('src/pages/GrammarKnowledgePage.tsx');
    const hub = read('src/pages/SubjectResourcesPage.tsx');
    const referenceGrid = read('src/components/resources/GrammarReferenceExtensionGuideGrid.tsx');

    expect(renderer).toContain('getGrammarKnowledgePageBySlug');
    expect(renderer).toContain("page.state === 'reference-extension'");
    expect(renderer).toContain('Grammar reference library');
    expect(renderer).toContain('Reference guide');
    expect(renderer).toContain('Continue the grammar reference library');
    expect(hub).toContain('<GrammarReferenceExtensionGuideGrid />');
    expect(referenceGrid).toContain('they do not add hidden curriculum steps');
    expect(referenceGrid).toContain('GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST');
  });

  it('publishes all six pages to the machine grammar corpus with visible source references', () => {
    const generator = read('scripts/generate-rss.mjs');
    const audit = read('scripts/audit-ai-answer-layers.mjs');

    expect(generator).toContain('GRAMMAR_KNOWLEDGE_PAGES');
    expect(generator).toContain("page.state === 'reference-extension' ? 'grammar-reference-extension'");
    expect(generator).toContain('grammarReferences');
    expect(audit).toContain('GRAMMAR_KNOWLEDGE_PAGES');
    expect(audit).toContain('38 governed grammar knowledge pages');
  });
});
