import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_KNOWLEDGE_STAGES,
} from '../../lib/grammarVocabularyAuthorityRequirements.js';
import {
  VOCABULARY_AUTHORITY_PAGES,
  VOCABULARY_AUTHORITY_REVISION,
} from '../../lib/vocabularyAuthorityRegistry.js';
import {
  VOCABULARY_AUTHORITY_PATHS,
  VOCABULARY_AUTHORITY_ROUTE_MANIFEST,
  VOCABULARY_HUB_PATH,
  VOCABULARY_RESOURCE_SEO,
} from '../../lib/vocabularyAuthoritySeoManifest.js';
import {
  VOCABULARY_LEXICAL_ENTRIES_BY_ID,
  VOCABULARY_LEXICAL_ENTRIES,
} from '../../lib/vocabularyLexicalModel';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { getCommercialC7R3Handoff } from '../../lib/commercialC7ContextualHandoffImplementation';
import {
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
} from '../../lib/aiAnswerLayerRegistry.js';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const knowledgeWordCount = (page: (typeof VOCABULARY_AUTHORITY_PAGES)[number]) => countWords([
  page.quickAnswer,
  page.concept,
  page.whyItMatters,
  ...page.coreIdeas,
  ...page.workedExamples.flatMap((item) => [item.example, item.explanation]),
  ...page.examples,
  ...page.commonMistakes,
  ...page.trickyCases,
  page.teachingNote,
  ...page.practicePrompts,
  ...page.faqs.flatMap((item) => [item.question, item.answer]),
].join(' '));

const FIRST_BATCH_IDS = [
  'everyday-vocabulary',
  'feelings-emotions',
  'school-vocabulary',
  'synonyms-antonyms',
  'context-clues',
  'word-families-prefixes-suffixes',
];

describe('GV4 Vocabulary hub and first authority publication batch', () => {
  it('preserves the original six-guide GV4 publication inside the additive Vocabulary architecture', () => {
    expect(VOCABULARY_AUTHORITY_REVISION).toBe('2026-09-27-gv5');
    expect(VOCABULARY_HUB_PATH).toBe('/resources/vocabulary');
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS).toHaveLength(16);
    expect(VOCABULARY_KNOWLEDGE_STAGES).toHaveLength(6);
    expect(VOCABULARY_AUTHORITY_PAGES).toHaveLength(10);
    expect(VOCABULARY_AUTHORITY_PATHS).toHaveLength(10);

    const firstBatch = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv4-first-authority-batch');
    expect(firstBatch).toHaveLength(6);
    expect(firstBatch.map((page) => page.id)).toEqual(FIRST_BATCH_IDS);

    const requirementIds = new Set(VOCABULARY_AUTHORITY_REQUIREMENTS.map((item) => item.id));
    for (const page of firstBatch) {
      expect(requirementIds.has(page.id), page.id).toBe(true);
      expect(page.publicationApproved).toBe(true);
      expect(page.hubPath).toBe('/resources/vocabulary');
      expect(page.practicePath).toBe('/free-games/word-meaning-flashcards');
    }
  });

  it('keeps every still-unpublished authority topic out of public routing', () => {
    const published = new Set(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id));
    const publicPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    const remaining = VOCABULARY_AUTHORITY_REQUIREMENTS.filter((item) => !published.has(item.id));

    expect(remaining).toHaveLength(6);
    for (const item of remaining) {
      expect(publicPaths.has(item.proposedPath), item.id).toBe(false);
    }
  });

  it('meets the GV1 authority-content floor with visible evidence and guided practice', () => {
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      expect(knowledgeWordCount(page), page.id).toBeGreaterThanOrEqual(600);
      expect(countWords(page.quickAnswer), page.id).toBeGreaterThanOrEqual(20);
      expect(countWords(page.whyItMatters), page.id).toBeGreaterThanOrEqual(25);
      expect(page.coreIdeas, page.id).toHaveLength(3);
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
        expect(source.note.length, page.id + ':' + source.id).toBeGreaterThan(30);
      }
    }
  });

  it('connects the GV2 lexical baseline to published guides without duplicating or mutating the 50-word practice dataset', () => {
    expect(VOCABULARY_LEXICAL_ENTRIES).toHaveLength(50);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      for (const id of page.featuredWordIds) {
        expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID[id], page.id + ':' + id).toBeTruthy();
      }
    }

    const everyday = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'everyday-vocabulary');
    const feelings = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'feelings-emotions');
    const school = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'school-vocabulary');
    expect(everyday?.featuredWordIds.length).toBe(10);
    expect(feelings?.featuredWordIds.length).toBe(10);
    expect(school?.featuredWordIds.length).toBe(10);
  });

  it('wires hub and guides through routes, SEO, canonical ownership and central Resources discovery', () => {
    const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    expect(routePaths.has(VOCABULARY_HUB_PATH)).toBe(true);
    expect(ROUTE_SEO_REGISTRY[VOCABULARY_HUB_PATH]?.canonicalPath).toBe(VOCABULARY_HUB_PATH);
    expect(VOCABULARY_RESOURCE_SEO[VOCABULARY_HUB_PATH]?.ogType).toBe('website');

    const hubOwner = CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === 'gv4-vocabulary-hub');
    expect(hubOwner?.ownerPath).toBe(VOCABULARY_HUB_PATH);
    expect(hubOwner?.ownerRole).toBe('subject-hub');
    expect(hubOwner?.subject).toBe('vocabulary');
    expect(getCommercialC7R3Handoff(VOCABULARY_HUB_PATH)).toBeNull();

    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      expect(routePaths.has(page.path), page.path).toBe(true);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.path).toBe(page.path);
      const ownerId = `${page.publicationBatch === 'gv5-natural-english-transfer' ? 'gv5' : 'gv4'}-vocabulary-${page.id}`;
      const owner = CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === ownerId);
      expect(owner?.ownerPath, page.id).toBe(page.path);
      expect(owner?.ownerRole, page.id).toBe('skill-guide');
      expect(owner?.subject, page.id).toBe('vocabulary');
      expect(owner?.hubPath, page.id).toBe('/resources/vocabulary');
      expect(getCommercialC7R3Handoff(page.path), page.id).toBeNull();
    }

    const routes = read('src/app/routes.tsx');
    const resources = read('src/pages/ResourcesPage.tsx');
    expect(routes).toContain("const VocabularyHubPage = lazy(() => import('../pages/VocabularyHubPage'))");
    expect(routes).toContain("const VocabularyKnowledgePage = lazy(() => import('../pages/VocabularyKnowledgePage'))");
    expect(routes).toContain("{ path: 'resources/vocabulary', element: <VocabularyHubPage /> }");
    expect(routes).toContain("{ path: 'resources/vocabulary/:slug', element: <VocabularyKnowledgePage /> }");
    expect(resources).toContain("to: '/resources/vocabulary'");
    expect(resources).toContain("title: 'Vocabulary'");
  });

  it('keeps Vocabulary Adventure as the practice layer rather than the knowledge owner', () => {
    const pageSource = read('src/pages/VocabularyKnowledgePage.tsx');
    const hubSource = read('src/pages/VocabularyHubPage.tsx');

    expect(pageSource).toContain('Practise in Vocabulary Adventure');
    expect(pageSource).toContain('page.practicePath');
    expect(hubSource).toContain('The game practises meanings, context clues, synonyms, antonyms and word recall');
    expect(hubSource).toContain('It stays the practice layer');
    expect(VOCABULARY_AUTHORITY_PAGES.every((page) => page.practicePath === '/free-games/word-meaning-flashcards')).toBe(true);
  });

  it('keeps Vocabulary concepts aligned with all published guides and one practice owner', () => {
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(106);
    const vocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/vocabulary/'),
    );
    expect(vocabulary).toHaveLength(10);
    expect(new Set(vocabulary.map((item) => item.canonicalPath)).size).toBe(10);
    for (const item of vocabulary) {
      expect(item.subject).toBe('vocabulary');
      expect(item.hubPath).toBe('/resources/vocabulary');
      expect(item.practicePaths).toEqual(['/free-games/word-meaning-flashcards']);
    }

    expect(AI_ANSWER_LAYER_3_PRACTICE_ACTIONS).toHaveLength(12);
    const practice = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.find((item) => item.id === 'practice-vocabulary');
    expect(practice?.canonicalPath).toBe('/free-games/word-meaning-flashcards');
    expect(practice?.hubPath).toBe('/resources/vocabulary');
  });

  it('exposes source-backed vocabulary pages through the generated AI corpus contract', () => {
    const generator = read('scripts/generate-rss.mjs');
    const audit = read('scripts/audit-ai-answer-layers.mjs');
    expect(generator).toContain('buildVocabularyAuthorityCorpus');
    expect(generator).toContain('vocabulary_authority_guides: vocabularyAuthority');
    expect(generator).toContain("content_type: 'vocabulary-authority-guide'");
    expect(generator).toContain('VOCABULARY_AUTHORITY_PAGES');
    expect(audit).toContain('vocabulary-authority-corpus-count');
    expect(audit).toContain('vocabulary-reference-depth');
    expect(audit).toContain('vocabulary-practice-link');
  });

  it('supports Vocabulary breadcrumbs without turning an unpublished path into a breadcrumb target', () => {
    const breadcrumbs = read('src/lib/breadcrumbAeoGeoRegistry.js');
    expect(breadcrumbs).toContain("'/resources/vocabulary': 'Vocabulary'");
    expect(breadcrumbs).toContain("path.startsWith('/resources/vocabulary/')");
    expect(breadcrumbs).toContain("aboutName: 'Vocabulary learning for children'");
    expect(VOCABULARY_AUTHORITY_ROUTE_MANIFEST).toHaveLength(10);
  });
});
