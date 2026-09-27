import { describe, expect, it } from 'vitest';
import {
  PUBLIC_VOCABULARY_LEVELS,
  PUBLIC_VOCABULARY_WORDS,
  PUBLIC_VOCABULARY_WORDS_BY_ID,
} from '../../lib/publicVocabularyContent';
import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_KNOWLEDGE_STAGES,
} from '../../lib/grammarVocabularyAuthorityRequirements.js';
import {
  VOCABULARY_DIFFICULTY_BANDS,
  VOCABULARY_LEXICAL_ENTRIES,
  VOCABULARY_LEXICAL_ENTRIES_BY_ID,
  VOCABULARY_LEXICAL_ENTRY_IDS,
  VOCABULARY_LEXICAL_MODEL_REVISION,
  VOCABULARY_SEMANTIC_DOMAINS,
  toLegacyPublicVocabularyWord,
} from '../../lib/vocabularyLexicalModel';

const EXPECTED_LEGACY_IDS = [
  'run', 'jump', 'eat', 'read', 'write', 'draw', 'sing', 'dance', 'carry', 'open',
  'happy', 'sad', 'angry', 'tired', 'excited', 'scared', 'proud', 'bored', 'calm', 'surprised',
  'big', 'small', 'soft', 'loud', 'bright', 'clean', 'cold', 'sweet', 'fast', 'slow',
  'pencil', 'teacher', 'classroom', 'lesson', 'homework', 'notebook', 'question', 'answer', 'library', 'practice',
  'family', 'garden', 'market', 'bottle', 'window', 'kitchen', 'blanket', 'street', 'neighbour', 'morning',
];

describe('GV2 vocabulary taxonomy and lexical model', () => {
  it('freezes the lexical model revision, progression bands and semantic-domain vocabulary', () => {
    expect(VOCABULARY_LEXICAL_MODEL_REVISION).toBe('2026-09-27-gv2');
    expect(VOCABULARY_DIFFICULTY_BANDS.map((band) => band.id)).toEqual([
      'foundation',
      'developing',
      'expanding',
      'transfer',
    ]);
    expect(VOCABULARY_DIFFICULTY_BANDS.map((band) => band.order)).toEqual([1, 2, 3, 4]);

    const domainIds = VOCABULARY_SEMANTIC_DOMAINS.map((domain) => domain.id);
    expect(domainIds).toEqual([
      'actions',
      'feelings-emotions',
      'description-properties',
      'school-learning',
      'home-family-routines',
      'places-environment',
      'everyday-objects',
      'word-relationships',
      'word-building',
      'context-inference',
      'natural-english',
      'speaking-transfer',
      'writing-transfer',
    ]);
  });

  it('migrates all 50 Vocabulary Adventure words into the canonical lexical model without changing their legacy order', () => {
    expect(VOCABULARY_LEXICAL_ENTRIES).toHaveLength(50);
    expect(VOCABULARY_LEXICAL_ENTRY_IDS).toEqual(EXPECTED_LEGACY_IDS);
    expect(new Set(VOCABULARY_LEXICAL_ENTRY_IDS).size).toBe(50);

    for (const entry of VOCABULARY_LEXICAL_ENTRIES) {
      expect(entry.migrationSource).toBe('publicVocabularyContent-v1');
      expect(entry.enrichmentStatus).toBe('legacy-baseline');
      expect(entry.difficultyBandId).toBe('foundation');
      expect(entry.stageId).toBe('everyday-foundations');
      expect(entry.childFriendlyMeaning.length, entry.id).toBeGreaterThan(8);
      expect(entry.exampleSentence.length, entry.id).toBeGreaterThan(8);
      expect(entry.semanticDomainIds.length, entry.id).toBeGreaterThan(0);
    }
  });

  it('makes the public Vocabulary Adventure a compatibility consumer of the lexical model rather than a second word dataset', () => {
    expect(PUBLIC_VOCABULARY_WORDS).toHaveLength(VOCABULARY_LEXICAL_ENTRIES.length);
    expect(PUBLIC_VOCABULARY_WORDS.map((entry) => entry.id)).toEqual(EXPECTED_LEGACY_IDS);

    for (const entry of VOCABULARY_LEXICAL_ENTRIES) {
      expect(PUBLIC_VOCABULARY_WORDS_BY_ID[entry.id]).toEqual(toLegacyPublicVocabularyWord(entry));
    }

    const categoryCounts = PUBLIC_VOCABULARY_WORDS.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.category] = (counts[entry.category] || 0) + 1;
      return counts;
    }, {});
    expect(categoryCounts).toEqual({
      action: 10,
      feeling: 10,
      describing: 10,
      school: 10,
      everyday: 10,
    });
  });

  it('maps every migrated word to a valid GV1 Vocabulary authority topic and semantic domain', () => {
    const stageIds = new Set(VOCABULARY_KNOWLEDGE_STAGES.map((stage) => stage.id));
    const topicIds = new Set(VOCABULARY_AUTHORITY_REQUIREMENTS.map((topic) => topic.id));
    const domainIds = new Set(VOCABULARY_SEMANTIC_DOMAINS.map((domain) => domain.id));

    for (const entry of VOCABULARY_LEXICAL_ENTRIES) {
      expect(stageIds.has(entry.stageId), entry.id).toBe(true);
      expect(topicIds.has(entry.primaryAuthorityTopicId), entry.id).toBe(true);
      for (const domainId of entry.semanticDomainIds) {
        expect(domainIds.has(domainId), `${entry.id} -> ${domainId}`).toBe(true);
      }
    }

    expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID.run.primaryAuthorityTopicId).toBe('action-words');
    expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID.happy.primaryAuthorityTopicId).toBe('feelings-emotions');
    expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID.big.primaryAuthorityTopicId).toBe('describing-words');
    expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID.teacher.primaryAuthorityTopicId).toBe('school-vocabulary');
    expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID.family.primaryAuthorityTopicId).toBe('home-family-routines');
    expect(VOCABULARY_LEXICAL_ENTRIES_BY_ID.market.primaryAuthorityTopicId).toBe('nature-weather-places-transport');
  });

  it('moves the synonym and antonym facts already used by the game into the lexical model', () => {
    const relationshipChallenges = PUBLIC_VOCABULARY_LEVELS.flatMap((level) => level.challenges)
      .filter((challenge) => challenge.mode === 'synonym' || challenge.mode === 'antonym');

    expect(relationshipChallenges).toHaveLength(10);

    for (const challenge of relationshipChallenges) {
      if (challenge.mode !== 'synonym' && challenge.mode !== 'antonym') continue;
      const entry = VOCABULARY_LEXICAL_ENTRIES.find((candidate) => candidate.headword === challenge.targetWord);
      expect(entry, challenge.id).toBeTruthy();
      const relationships = challenge.mode === 'synonym' ? entry?.synonyms : entry?.antonyms;
      expect(relationships, challenge.id).toContain(challenge.correctChoice);
    }
  });

  it('does not prematurely invent lexical enrichment that GV2 has not source-curated yet', () => {
    for (const entry of VOCABULARY_LEXICAL_ENTRIES) {
      expect(entry.wordFamily, entry.id).toEqual([]);
      expect(entry.collocations, entry.id).toEqual([]);
      expect(entry.commonConfusions, entry.id).toEqual([]);
      expect(entry.speakingPrompts, entry.id).toEqual([]);
      expect(entry.writingPrompts, entry.id).toEqual([]);
    }
  });

  it('keeps the GV1 authority pages unapproved while GV2 establishes the underlying vocabulary data model', () => {
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS).toHaveLength(16);
    for (const topic of VOCABULARY_AUTHORITY_REQUIREMENTS) {
      expect(topic.publicationApproved, topic.id).toBe(false);
    }
  });
});
