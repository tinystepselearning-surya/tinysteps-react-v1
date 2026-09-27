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
} from '../../lib/vocabularyAuthoritySeoManifest.js';
import { VOCABULARY_LEXICAL_ENTRIES } from '../../lib/vocabularyLexicalModel';
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

const GV5_IDS = [
  'vocabulary-collocations',
  'phrasal-verbs-expressions',
  'vocabulary-for-writing',
  'vocabulary-for-speaking',
];

describe('GV5 Vocabulary natural English and transfer publication', () => {
  it('publishes exactly four GV5 guides on top of the preserved six-guide GV4 batch', () => {
    expect(VOCABULARY_AUTHORITY_REVISION).toBe('2026-09-27-gv5b');
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS).toHaveLength(16);
    expect(VOCABULARY_KNOWLEDGE_STAGES).toHaveLength(6);
    expect(VOCABULARY_AUTHORITY_PAGES).toHaveLength(16);
    expect(VOCABULARY_AUTHORITY_PATHS).toHaveLength(16);
    expect(VOCABULARY_AUTHORITY_ROUTE_MANIFEST).toHaveLength(16);

    const gv4 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv4-first-authority-batch');
    const gv5 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5-natural-english-transfer');
    expect(gv4).toHaveLength(6);
    expect(gv5).toHaveLength(4);
    expect(gv5.map((page) => page.id)).toEqual(GV5_IDS);
    expect(gv5.map((page) => page.stageId)).toEqual([
      'natural-english',
      'natural-english',
      'transfer-speaking-writing',
      'transfer-speaking-writing',
    ]);
  });

  it('preserves the GV5 batch while the six deferred requirements are now completed by GV5B', () => {
    const publishedIds = new Set(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id));
    const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    const remaining = VOCABULARY_AUTHORITY_REQUIREMENTS.filter((item) => !publishedIds.has(item.id));
    expect(remaining).toHaveLength(0);
    for (const item of VOCABULARY_AUTHORITY_REQUIREMENTS) {
      expect(routePaths.has(item.proposedPath), item.id).toBe(true);
      expect(ROUTE_SEO_REGISTRY[item.proposedPath]?.canonicalPath, item.id).toBe(item.proposedPath);
    }
  });

  it('meets the authority content and evidence floor for every GV5 guide', () => {
    const gv5 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5-natural-english-transfer');
    for (const page of gv5) {
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
      expect(page.practicePath).toBe('/free-games/word-meaning-flashcards');
    }
  });

  it('preserves Vocabulary Adventure and the exact 50-word lexical baseline', () => {
    expect(VOCABULARY_LEXICAL_ENTRIES).toHaveLength(50);
    expect(AI_ANSWER_LAYER_3_PRACTICE_ACTIONS).toHaveLength(12);
    const practice = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.find((item) => item.id === 'practice-vocabulary');
    expect(practice?.canonicalPath).toBe('/free-games/word-meaning-flashcards');
    expect(practice?.hubPath).toBe(VOCABULARY_HUB_PATH);

    const gv5 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5-natural-english-transfer');
    expect(gv5.every((page) => page.featuredWordIds.length === 0)).toBe(true);
  });

  it('assigns one informational canonical owner to each GV5 guide without C7 commercial handoffs', () => {
    const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    const gv5 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5-natural-english-transfer');
    for (const page of gv5) {
      expect(routePaths.has(page.path), page.path).toBe(true);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.path).toBe(page.path);
      const owner = CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === 'gv5-vocabulary-' + page.id);
      expect(owner?.ownerPath, page.id).toBe(page.path);
      expect(owner?.ownerRole, page.id).toBe('skill-guide');
      expect(owner?.subject, page.id).toBe('vocabulary');
      expect(owner?.hubPath, page.id).toBe('/resources/vocabulary');
      expect(getCommercialC7R3Handoff(page.path), page.id).toBeNull();
    }
  });

  it('extends Layer 2 and the hub presentation without widening practice or conversion ownership', () => {
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(112);
    const vocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/vocabulary/'),
    );
    expect(vocabulary).toHaveLength(16);

    const gv5Paths = new Set(
      VOCABULARY_AUTHORITY_PAGES
        .filter((page) => page.publicationBatch === 'gv5-natural-english-transfer')
        .map((page) => page.path),
    );
    expect(vocabulary.filter((item) => gv5Paths.has(item.canonicalPath)).length).toBe(4);
    for (const item of vocabulary.filter((entry) => gv5Paths.has(entry.canonicalPath))) {
      expect(item.subject).toBe('vocabulary');
      expect(item.hubPath).toBe('/resources/vocabulary');
      expect(item.practicePaths).toEqual(['/free-games/word-meaning-flashcards']);
    }

    const hub = read('src/pages/VocabularyHubPage.tsx');
    expect(hub).toContain('Explore all sixteen vocabulary authority guides');
    expect(hub).toContain('six GV4 guides, four GV5 natural-English and transfer guides, and six GV5B foundation-completion guides');
  });

  it('keeps cross-domain ownership descriptive rather than publishing competing Grammar owners', () => {
    const collocations = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'vocabulary-collocations');
    const phrasal = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'phrasal-verbs-expressions');
    expect(collocations?.path).toBe('/resources/vocabulary/collocations-for-kids');
    expect(phrasal?.path).toBe('/resources/vocabulary/phrasal-verbs-common-expressions-for-kids');
    expect(ROUTE_SEO_REGISTRY['/resources/grammar/collocations-for-kids']).toBeUndefined();
    expect(ROUTE_SEO_REGISTRY['/resources/grammar/phrasal-verbs-for-kids']).toBeUndefined();
  });
});
