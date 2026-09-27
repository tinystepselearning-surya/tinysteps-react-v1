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
import {
  VOCABULARY_LEXICAL_ENTRIES,
  VOCABULARY_LEXICAL_ENTRIES_BY_ID,
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

const GV5B_IDS = [
  'action-words',
  'describing-words',
  'home-family-routines',
  'food-clothes-body',
  'nature-weather-places-transport',
  'multiple-meaning-confused-words',
];

describe('GV5B Vocabulary foundation completion', () => {
  it('completes all sixteen frozen authority requirements in frozen progression order', () => {
    expect(VOCABULARY_AUTHORITY_REVISION).toBe('2026-09-27-gv5b');
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS).toHaveLength(16);
    expect(VOCABULARY_KNOWLEDGE_STAGES).toHaveLength(6);
    expect(VOCABULARY_AUTHORITY_PAGES).toHaveLength(16);
    expect(VOCABULARY_AUTHORITY_PATHS).toHaveLength(16);
    expect(VOCABULARY_AUTHORITY_ROUTE_MANIFEST).toHaveLength(16);

    expect(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id)).toEqual(
      VOCABULARY_AUTHORITY_REQUIREMENTS.map((item) => item.id),
    );
    expect(VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((page) => page.id)).toEqual(
      VOCABULARY_AUTHORITY_REQUIREMENTS.map((item) => item.id),
    );

    const gv4 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv4-first-authority-batch');
    const gv5 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5-natural-english-transfer');
    const gv5b = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5b-foundation-completion');
    expect(gv4).toHaveLength(6);
    expect(gv5).toHaveLength(4);
    expect(gv5b).toHaveLength(6);
    expect(gv5b.map((page) => page.id)).toEqual(GV5B_IDS);
  });

  it('publishes every formerly deferred route with self-canonical SEO and one GV5B owner', () => {
    const routes = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    const gv5b = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5b-foundation-completion');

    for (const page of gv5b) {
      expect(routes.has(page.path), page.path).toBe(true);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.path).toBe(page.path);

      const owner = CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === 'gv5b-vocabulary-' + page.id);
      expect(owner?.ownerPath, page.id).toBe(page.path);
      expect(owner?.ownerRole, page.id).toBe('skill-guide');
      expect(owner?.subject, page.id).toBe('vocabulary');
      expect(owner?.hubPath, page.id).toBe(VOCABULARY_HUB_PATH);
      expect(getCommercialC7R3Handoff(page.path), page.id).toBeNull();
    }

    const publishedIds = new Set(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id));
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS.filter((item) => !publishedIds.has(item.id))).toHaveLength(0);
  });

  it('meets the authority-content floor for all six completion guides', () => {
    const gv5b = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5b-foundation-completion');
    for (const page of gv5b) {
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
      expect(page.practicePath, page.id).toBe('/free-games/word-meaning-flashcards');
    }
  });

  it('reuses the frozen 50-word lexical baseline without adding synthetic lexical entries', () => {
    expect(VOCABULARY_LEXICAL_ENTRIES).toHaveLength(50);
    const gv5b = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5b-foundation-completion');
    for (const page of gv5b) {
      for (const id of page.featuredWordIds) {
        expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID[id], page.id + ':' + id).toBeTruthy();
      }
    }

    expect(gv5b.find((page) => page.id === 'action-words')?.featuredWordIds).toHaveLength(10);
    expect(gv5b.find((page) => page.id === 'describing-words')?.featuredWordIds).toHaveLength(10);
    expect(gv5b.find((page) => page.id === 'home-family-routines')?.featuredWordIds.length).toBeGreaterThan(0);
  });

  it('moves AI Layer 2 to 112 while preserving one Vocabulary practice owner in Layer 3', () => {
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(112);
    const vocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/vocabulary/'),
    );
    expect(vocabulary).toHaveLength(16);
    expect(new Set(vocabulary.map((item) => item.canonicalPath)).size).toBe(16);

    const gv5bPaths = new Set(
      VOCABULARY_AUTHORITY_PAGES
        .filter((page) => page.publicationBatch === 'gv5b-foundation-completion')
        .map((page) => page.path),
    );
    expect(vocabulary.filter((item) => gv5bPaths.has(item.canonicalPath))).toHaveLength(6);
    for (const item of vocabulary.filter((entry) => gv5bPaths.has(entry.canonicalPath))) {
      expect(item.subject).toBe('vocabulary');
      expect(item.hubPath).toBe('/resources/vocabulary');
      expect(item.practicePaths).toEqual(['/free-games/word-meaning-flashcards']);
    }

    expect(AI_ANSWER_LAYER_3_PRACTICE_ACTIONS).toHaveLength(12);
    const practice = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.find((item) => item.id === 'practice-vocabulary');
    expect(practice?.canonicalPath).toBe('/free-games/word-meaning-flashcards');
    expect(practice?.hubPath).toBe('/resources/vocabulary');
  });

  it('keeps vocabulary/grammar ownership boundaries explicit', () => {
    expect(ROUTE_SEO_REGISTRY['/resources/grammar/verbs-for-kids']?.canonicalPath).toBe('/resources/grammar/verbs-for-kids');
    expect(ROUTE_SEO_REGISTRY['/resources/grammar/adjectives-for-kids']?.canonicalPath).toBe('/resources/grammar/adjectives-for-kids');
    expect(ROUTE_SEO_REGISTRY['/resources/grammar/easily-confused-words-for-kids']).toBeUndefined();

    const action = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'action-words');
    const describing = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'describing-words');
    const confused = VOCABULARY_AUTHORITY_PAGES.find((page) => page.id === 'multiple-meaning-confused-words');
    expect(action?.path).toBe('/resources/vocabulary/action-words-for-kids');
    expect(describing?.path).toBe('/resources/vocabulary/describing-words-for-kids');
    expect(confused?.path).toBe('/resources/vocabulary/multiple-meaning-confused-words-for-kids');
  });

  it('presents the complete estate through the hub and generated corpus contract', () => {
    const hub = read('src/pages/VocabularyHubPage.tsx');
    const generator = read('scripts/generate-rss.mjs');
    const audit = read('scripts/audit-ai-answer-layers.mjs');

    expect(hub).toContain('Explore all sixteen vocabulary authority guides');
    expect(hub).toContain('All sixteen frozen authority topics are now published');
    expect(generator).toContain('vocabulary_authority_guides: vocabularyAuthority');
    expect(audit).toContain('vocabulary-authority-corpus-count');
    expect(audit).toContain('vocabulary-reference-depth');
    expect(audit).toContain('vocabulary-practice-link');
  });
});
