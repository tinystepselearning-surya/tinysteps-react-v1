import { describe, expect, it } from 'vitest';
import {
  AUTHORITY_PAGE_REQUIRED_SECTIONS,
  AUTHORITY_PUBLICATION_GATES,
  GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS,
  GRAMMAR_VOCABULARY_AUTHORITY_REVISION,
  GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS,
  GRAMMAR_VOCABULARY_SOURCE_BASIS,
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_HUB_REQUIREMENT,
  VOCABULARY_KNOWLEDGE_STAGES,
} from '../../lib/grammarVocabularyAuthorityRequirements.js';
import {
  GRAMMAR_PROGRAMMATIC_PATHS,
  GRAMMAR_PROGRAMMATIC_SEQUENCE,
} from '../../lib/grammarProgrammaticRegistry.js';

const EXPECTED_GRAMMAR_REFERENCE_IDS = [
  'determiners',
  'countable-uncountable-nouns',
  'noun-phrases',
  'prepositional-phrases',
  'phrasal-verbs-particles',
  'verb-forms-irregular-verbs',
  'gerunds-infinitives-verb-patterns',
  'word-order-focus',
  'word-formation',
  'grammar-collocations',
  'easily-confused-words',
  'common-grammar-mistakes',
];

const EXPECTED_VOCABULARY_STAGE_IDS = [
  'everyday-foundations',
  'word-relationships',
  'word-building',
  'vocabulary-in-context',
  'natural-english',
  'transfer-speaking-writing',
];

const EXPECTED_VOCABULARY_TOPIC_IDS = [
  'everyday-vocabulary',
  'action-words',
  'feelings-emotions',
  'describing-words',
  'school-vocabulary',
  'home-family-routines',
  'food-clothes-body',
  'nature-weather-places-transport',
  'synonyms-antonyms',
  'multiple-meaning-confused-words',
  'word-families-prefixes-suffixes',
  'context-clues',
  'vocabulary-collocations',
  'phrasal-verbs-expressions',
  'vocabulary-for-writing',
  'vocabulary-for-speaking',
];

describe('GV1 grammar + vocabulary authority requirements', () => {
  it('preserves the completed 38-step Grammar progression and adds a separate 12-topic reference-extension requirement layer', () => {
    expect(GRAMMAR_PROGRAMMATIC_SEQUENCE).toHaveLength(38);
    expect(GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS.map((item) => item.id)).toEqual(EXPECTED_GRAMMAR_REFERENCE_IDS);
    expect(GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS).toHaveLength(12);

    const existingPaths = new Set(GRAMMAR_PROGRAMMATIC_PATHS);
    for (const item of GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS) {
      expect(item.layer).toBe('grammar-reference-extension');
      expect(item.hubPath).toBe('/resources/grammar');
      expect(item.publicationApproved).toBe(false);
      expect(existingPaths.has(item.proposedPath), item.id).toBe(false);
      expect(item.rationale?.length, item.id).toBeGreaterThan(90);
      expect(item.childOutcomes.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.practiceTargets?.length, item.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('defines a six-stage, sixteen-resource Vocabulary authority architecture without pretending the practice game is the knowledge owner', () => {
    expect(VOCABULARY_KNOWLEDGE_STAGES.map((stage) => stage.id)).toEqual(EXPECTED_VOCABULARY_STAGE_IDS);
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS.map((item) => item.id)).toEqual(EXPECTED_VOCABULARY_TOPIC_IDS);
    expect(VOCABULARY_HUB_REQUIREMENT.proposedPath).toBe('/resources/vocabulary');
    expect(VOCABULARY_HUB_REQUIREMENT.role).toBe('canonical-vocabulary-learning-hub');
    expect(VOCABULARY_HUB_REQUIREMENT.practicePath).toBe('/free-games/word-meaning-flashcards');
    expect(VOCABULARY_HUB_REQUIREMENT.publicationApproved).toBe(false);

    const stagedIds = VOCABULARY_KNOWLEDGE_STAGES.flatMap((stage) => stage.topicIds);
    expect(stagedIds).toHaveLength(16);
    expect(new Set(stagedIds).size).toBe(16);
    expect(new Set(stagedIds)).toEqual(new Set(EXPECTED_VOCABULARY_TOPIC_IDS));

    for (const item of VOCABULARY_AUTHORITY_REQUIREMENTS) {
      expect(item.layer).toBe('vocabulary-authority');
      expect(item.hubPath).toBe('/resources/vocabulary');
      expect(item.publicationApproved).toBe(false);
      expect(item.semanticDomains?.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.childOutcomes.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.practiceModes?.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.crossLinks?.length, item.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('freezes a stronger authority-page quality contract before any new route can be published', () => {
    expect(GRAMMAR_VOCABULARY_AUTHORITY_REVISION).toBe('2026-09-27-gv1');
    expect(AUTHORITY_PUBLICATION_GATES.minimumKnowledgeWords).toBe(600);
    expect(AUTHORITY_PUBLICATION_GATES.minimumAuthoritativeReferences).toBe(2);
    expect(AUTHORITY_PUBLICATION_GATES.minimumWorkedExamples).toBe(3);
    expect(AUTHORITY_PUBLICATION_GATES.minimumFaqs).toBe(2);
    expect(AUTHORITY_PUBLICATION_GATES.requireNoThinChildRoutes).toBe(true);
    expect(AUTHORITY_PUBLICATION_GATES.requireIndexableOnlyWhenComplete).toBe(true);
    expect(AUTHORITY_PUBLICATION_GATES.requireAiCorpusInclusionOnlyWhenPublished).toBe(true);

    expect(AUTHORITY_PAGE_REQUIRED_SECTIONS).toEqual([
      'direct-answer',
      'why-it-matters',
      'core-rules-or-meaning',
      'worked-examples',
      'common-mistakes-or-confusions',
      'tricky-cases-or-usage-notes',
      'guided-practice',
      'parent-teacher-note',
      'faqs',
      'references',
      'related-learning',
    ]);

    for (const item of [...GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS, ...VOCABULARY_AUTHORITY_REQUIREMENTS]) {
      expect(item.requiredSections).toEqual(AUTHORITY_PAGE_REQUIRED_SECTIONS);
      expect(item.evidenceFamilyIds.length, item.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('records the British Council vocabulary benchmarks and Cambridge grammar benchmark that motivated the gap analysis', () => {
    expect(GRAMMAR_VOCABULARY_SOURCE_BASIS.britishCouncilVocabularyA1A2.url).toBe(
      'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2',
    );
    expect(GRAMMAR_VOCABULARY_SOURCE_BASIS.britishCouncilVocabularyB1B2.url).toBe(
      'https://learnenglish.britishcouncil.org/free-resources/vocabulary/b1-b2',
    );
    expect(GRAMMAR_VOCABULARY_SOURCE_BASIS.cambridgeGrammar.url).toBe(
      'https://dictionary.cambridge.org/grammar/british-grammar/',
    );
  });

  it('makes cross-domain ownership explicit instead of creating competing Grammar, Reading, Speaking or Writing owners', () => {
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.grammarCoreBoundary).toContain('38-step Grammar sequence');
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.vocabularyBoundary).toContain('practice surface');
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.wordFormationBoundary).toContain('cross-domain');
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.collocationBoundary).toContain('Vocabulary owns');
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.phrasalVerbBoundary).toContain('Grammar owns');
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.readingBoundary).toContain('must not claim phonics decoding');
    expect(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS.speakingWritingBoundary).toContain('without becoming commercial programme owners');
  });

  it('keeps all proposed authority paths unique and inside the intended Resources namespaces', () => {
    const all = [...GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS, ...VOCABULARY_AUTHORITY_REQUIREMENTS];
    const ids = all.map((item) => item.id);
    const paths = all.map((item) => item.proposedPath);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);

    for (const item of GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS) {
      expect(item.proposedPath.startsWith('/resources/grammar/'), item.id).toBe(true);
    }
    for (const item of VOCABULARY_AUTHORITY_REQUIREMENTS) {
      expect(item.proposedPath.startsWith('/resources/vocabulary/'), item.id).toBe(true);
    }
  });
});
