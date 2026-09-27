import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  VOCABULARY_AUTHORITY_PAGES,
} from '../../lib/vocabularyAuthorityRegistry.js';
import {
  VOCABULARY_AUTHORITY_PATHS,
  VOCABULARY_AUTHORITY_ROUTE_MANIFEST,
  VOCABULARY_AUTHORITY_REVISION,
  VOCABULARY_HUB_SEO,
} from '../../lib/vocabularyAuthoritySeoManifest.js';
import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_HUB_REQUIREMENT,
} from '../../lib/grammarVocabularyAuthorityRequirements.js';
import {
  VOCABULARY_LEXICAL_ENTRIES,
  VOCABULARY_LEXICAL_MODEL_REVISION,
} from '../../lib/vocabularyLexicalModel';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { AI_ANSWER_LAYER_2_LEARNING_CONCEPTS } from '../../lib/aiAnswerLayerRegistry.js';
import { CENTRAL_RESOURCE_SUBJECT_HUBS } from '../../lib/centralResourceSystem.js';
import { getCommercialC7R1Mapping } from '../../lib/commercialC7KnowledgeOwnerMapping';
import { getCommercialC7R2NextStepRule } from '../../lib/commercialC7IntentNextStepRules';
import { getCommercialC7R3Handoff } from '../../lib/commercialC7ContextualHandoffImplementation';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const knowledgeWords = (page: (typeof VOCABULARY_AUTHORITY_PAGES)[number]) => countWords([
  page.quickAnswer,
  page.concept,
  page.whyItMatters,
  ...page.teachingPoints,
  ...page.wordGroups.flatMap((group) => [group.label, ...group.words, group.note]),
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
  it('publishes exactly the six approved first-batch Vocabulary authority topics', () => {
    expect(VOCABULARY_AUTHORITY_REVISION).toBe('2026-09-27-gv4');
    expect(VOCABULARY_AUTHORITY_ROUTE_MANIFEST).toHaveLength(6);
    expect(VOCABULARY_AUTHORITY_PAGES).toHaveLength(6);
    expect(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id)).toEqual(FIRST_BATCH_IDS);
    expect(VOCABULARY_AUTHORITY_PAGES.map((page) => page.path)).toEqual(VOCABULARY_AUTHORITY_PATHS);
    expect(new Set(VOCABULARY_AUTHORITY_PATHS).size).toBe(6);

    const approvedIds = new Set(VOCABULARY_AUTHORITY_REQUIREMENTS.map((item) => item.id));
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      expect(approvedIds.has(page.id), page.id).toBe(true);
      expect(page.state).toBe('vocabulary-authority');
      expect(page.publicationApproved).toBe(true);
      expect(page.publicationBatch).toBe('gv4-first-authority-batch');
      expect(page.hubPath).toBe('/resources/vocabulary');
      expect(page.practicePath).toBe('/free-games/word-meaning-flashcards');
    }

    expect(VOCABULARY_AUTHORITY_REQUIREMENTS).toHaveLength(16);
    expect(VOCABULARY_HUB_REQUIREMENT.proposedPath).toBe('/resources/vocabulary');
    expect(VOCABULARY_HUB_REQUIREMENT.practicePath).toBe('/free-games/word-meaning-flashcards');
  });

  it('meets the GV1 authority quality floor without thin one-word child routes', () => {
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      expect(knowledgeWords(page), page.id).toBeGreaterThanOrEqual(600);
      expect(countWords(page.quickAnswer), page.id).toBeGreaterThanOrEqual(20);
      expect(countWords(page.whyItMatters), page.id).toBeGreaterThanOrEqual(25);
      expect(page.teachingPoints, page.id).toHaveLength(3);
      expect(page.wordGroups, page.id).toHaveLength(3);
      expect(page.workedExamples, page.id).toHaveLength(3);
      expect(page.examples.length, page.id).toBeGreaterThanOrEqual(3);
      expect(page.commonMistakes, page.id).toHaveLength(3);
      expect(page.trickyCases, page.id).toHaveLength(2);
      expect(page.practicePrompts, page.id).toHaveLength(3);
      expect(page.faqs, page.id).toHaveLength(2);
      expect(page.sources.length, page.id).toBeGreaterThanOrEqual(2);
      expect(new Set(page.sources.map((source) => source.url)).size, page.id).toBe(page.sources.length);
      expect(page.path.split('/').filter(Boolean)).toHaveLength(3);
      for (const source of page.sources) {
        expect(source.url.startsWith('https://'), page.id + ':' + source.id).toBe(true);
        expect(source.note.length, page.id + ':' + source.id).toBeGreaterThan(30);
      }
    }
  });

  it('keeps the merged GV2 lexical model and Vocabulary Adventure practice contract intact', () => {
    expect(VOCABULARY_LEXICAL_MODEL_REVISION).toBe('2026-09-27-gv2');
    expect(VOCABULARY_LEXICAL_ENTRIES).toHaveLength(50);
    const game = read('src/pages/kids/games/reading/WordMeaningFlashcards.tsx');
    expect(game).toContain('PUBLIC_VOCABULARY_WORDS');
    expect(game).toContain('Vocabulary Adventure');
    expect(game).toContain('to="/resources/vocabulary"');
    expect(game).toContain('Open the Vocabulary knowledge library');
    expect(game).not.toContain('canonical knowledge owner');
  });

  it('publishes the hub and six guides through public routes, SEO and app routing', () => {
    const paths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    expect(paths.has('/resources/vocabulary')).toBe(true);
    expect(ROUTE_SEO_REGISTRY['/resources/vocabulary']).toMatchObject({
      canonicalPath: '/resources/vocabulary',
      ogType: 'website',
    });
    expect(VOCABULARY_HUB_SEO.canonicalPath).toBe('/resources/vocabulary');

    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      expect(paths.has(page.path), page.path).toBe(true);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.id).toBe(page.path);
      expect(ROUTE_SEO_REGISTRY[page.path]?.ogType, page.id).toBe('article');
    }

    const routes = read('src/app/routes.tsx');
    expect(routes).toContain("const VocabularyResourcesPage = lazy(() => import('../pages/VocabularyResourcesPage'));");
    expect(routes).toContain("const VocabularyKnowledgePage = lazy(() => import('../pages/VocabularyKnowledgePage'));");
    expect(routes).toContain("{ path: 'resources/vocabulary', element: <VocabularyResourcesPage /> },");
    expect(routes).toContain("{ path: 'resources/vocabulary/:slug', element: <VocabularyKnowledgePage /> },");
  });

  it('adds one Vocabulary discovery owner plus six governed guide owners without reopening frozen subject-hub baselines', () => {
    const vocabOwners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) =>
      entry.id === 'vocabulary-resource-discovery' || entry.id.startsWith('gv4-vocabulary-'),
    );
    expect(vocabOwners).toHaveLength(7);

    const hub = vocabOwners.find((entry) => entry.id === 'vocabulary-resource-discovery');
    expect(hub).toMatchObject({
      subject: 'vocabulary-language',
      intent: 'informational',
      ownerPath: '/resources/vocabulary',
      ownerRole: 'subject-hub',
      hubPath: '/resources/vocabulary',
    });

    const guideOwners = vocabOwners.filter((entry) => entry.id.startsWith('gv4-vocabulary-'));
    expect(guideOwners).toHaveLength(6);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const owner = guideOwners.find((entry) => entry.ownerPath === page.path);
      expect(owner?.subject, page.id).toBe('vocabulary-language');
      expect(owner?.intent, page.id).toBe('informational');
      expect(owner?.ownerRole, page.id).toBe('skill-guide');
      expect(owner?.hubPath, page.id).toBe('/resources/vocabulary');
    }

    expect(CENTRAL_RESOURCE_SUBJECT_HUBS).toEqual([
      '/resources/phonics',
      '/resources/grammar',
      '/resources/speaking',
    ]);
  });

  it('keeps the new Vocabulary family soft-discovery in frozen C7 instead of inventing a broad-English commercial handoff', () => {
    const paths = ['/resources/vocabulary', ...VOCABULARY_AUTHORITY_PAGES.map((page) => page.path)];
    for (const path of paths) {
      const mapping = getCommercialC7R1Mapping(path);
      const rule = getCommercialC7R2NextStepRule(path);
      expect(mapping?.primaryCommercialOwner, path).toBeNull();
      expect(mapping?.decision, path).toBe('HOLD_SOFT_DISCOVERY');
      expect(rule?.ruleClass, path).toBe('SOFT_DISCOVERY');
      expect(rule?.primaryDestination, path).toBeNull();
      expect(rule?.secondaryDestination, path).toBeNull();
      expect(getCommercialC7R3Handoff(path), path).toBeNull();
    }
  });

  it('adds six Vocabulary concepts to Layer 2 and keeps practice separate from knowledge ownership', () => {
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(102);
    const vocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/vocabulary/'),
    );
    expect(vocabulary).toHaveLength(6);
    expect(new Set(vocabulary.map((item) => item.canonicalPath)).size).toBe(6);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const item = vocabulary.find((entry) => entry.canonicalPath === page.path);
      expect(item?.answer, page.id).toBe(page.quickAnswer);
      expect(item?.hubPath, page.id).toBe('/resources/vocabulary');
      expect(item?.practicePaths, page.id).toEqual(['/free-games/word-meaning-flashcards']);
    }
    expect(vocabulary.some((item) => item.canonicalPath === '/free-games/word-meaning-flashcards')).toBe(false);
  });

  it('adds Vocabulary discovery to the central Resources page without mutating the frozen three-hub architecture', () => {
    const resources = read('src/pages/ResourcesPage.tsx');
    const hub = read('src/pages/VocabularyResourcesPage.tsx');
    const guide = read('src/pages/VocabularyKnowledgePage.tsx');

    expect(resources).toContain("title: 'Vocabulary'");
    expect(resources).toContain("to: '/resources/vocabulary'");
    expect(hub).toContain('Vocabulary resources for kids');
    expect(hub).toContain('Vocabulary Adventure remains the practice surface');
    expect(hub).toContain('Tiny Steps progression bands are internal instructional bands, not claimed CEFR equivalence');
    expect(guide).toContain('Vocabulary authority guide');
    expect(guide).toContain('References and further reading');
    expect(guide).toContain('Practise in Vocabulary Adventure');
  });

  it('connects the GV4 pages to the dedicated machine corpus and visible evidence', () => {
    const generator = read('scripts/generate-rss.mjs');
    const audit = read('scripts/audit-ai-answer-layers.mjs');
    expect(generator).toContain('buildVocabularyAuthorityCorpus');
    expect(generator).toContain("content_type: 'vocabulary-authority-guide'");
    expect(generator).toContain('vocabulary_authority_guides: vocabularyAuthority');
    expect(generator).toContain('vocabularyReferences');
    expect(audit).toContain('vocabulary-authority-corpus-count');
    expect(audit).toContain('vocabulary-reference-depth');
  });
});
