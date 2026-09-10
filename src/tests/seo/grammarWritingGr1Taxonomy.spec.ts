import { describe, expect, it } from 'vitest';
import { GRAMMAR_WRITING_KNOWLEDGE_DOMAINS } from '../../lib/grammarWritingKnowledgeArchitecture.js';
import {
  GRAMMAR_WRITING_SKILL_EDGES,
  GRAMMAR_WRITING_SKILL_TAXONOMY,
  GRAMMAR_WRITING_TAXONOMY_ROOT_ID,
  GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID,
  getGrammarWritingNextSkills,
  getGrammarWritingPrerequisiteSkills,
  getGrammarWritingSkill,
  getGrammarWritingSkillsForDomain,
} from '../../lib/grammarWritingKnowledgeTaxonomy.js';

const EXPECTED_SKILLS = [
  'sentence-foundations',
  'nouns-pronouns',
  'verbs',
  'adjectives-adverbs',
  'articles-determiners',
  'prepositions',
  'conjunctions',
  'subject-verb-agreement',
  'tenses',
  'clauses-sentence-combining',
  'punctuation',
  'paragraph-writing',
  'descriptive-narrative-writing',
  'editing-revision',
];

describe('GR1 grammar and writing knowledge taxonomy', () => {
  it('freezes the requested fourteen-node conceptual model in explicit order', () => {
    expect(GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.id)).toEqual(EXPECTED_SKILLS);
    expect(GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.order)).toEqual(
      Array.from({ length: EXPECTED_SKILLS.length }, (_, index) => index + 1),
    );
    expect(GRAMMAR_WRITING_TAXONOMY_ROOT_ID).toBe('sentence-foundations');
    expect(GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID).toBe('editing-revision');
  });

  it('reuses every R17 domain rather than creating a competing domain system', () => {
    const r17DomainIds = GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((domain) => domain.id);
    for (const domainId of r17DomainIds) {
      expect(getGrammarWritingSkillsForDomain(domainId).length, `${domainId} should be represented in GR1`).toBeGreaterThan(0);
    }
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      expect(r17DomainIds).toContain(skill.primaryDomainId);
    }
  });

  it('makes prerequisite and next-skill relationships reciprocal and resolvable', () => {
    const ids = new Set(GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.id));
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      for (const prerequisiteId of skill.prerequisiteSkillIds) {
        expect(ids.has(prerequisiteId)).toBe(true);
        expect(getGrammarWritingSkill(prerequisiteId)?.nextSkillIds).toContain(skill.id);
      }
      for (const nextId of skill.nextSkillIds) {
        expect(ids.has(nextId)).toBe(true);
        expect(getGrammarWritingSkill(nextId)?.prerequisiteSkillIds).toContain(skill.id);
      }
    }
  });

  it('keeps the graph non-rigid while still giving each non-root skill prerequisites and each non-terminal skill a next step', () => {
    expect(getGrammarWritingPrerequisiteSkills(GRAMMAR_WRITING_TAXONOMY_ROOT_ID)).toHaveLength(0);
    expect(getGrammarWritingNextSkills(GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID)).toHaveLength(0);

    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      if (skill.id !== GRAMMAR_WRITING_TAXONOMY_ROOT_ID) expect(skill.prerequisiteSkillIds.length).toBeGreaterThan(0);
      if (skill.id !== GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID) expect(skill.nextSkillIds.length).toBeGreaterThan(0);
    }

    expect(getGrammarWritingNextSkills('sentence-foundations').map((item) => item.id)).toEqual([
      'nouns-pronouns',
      'verbs',
      'punctuation',
    ]);
    expect(getGrammarWritingNextSkills('tenses').map((item) => item.id)).toEqual([
      'clauses-sentence-combining',
      'paragraph-writing',
      'descriptive-narrative-writing',
      'editing-revision',
    ]);
  });

  it('keeps GR1 conceptual and does not publish URLs or canonical ownership', () => {
    const forbiddenKeys = ['path', 'ownerPath', 'proposedPath', 'canonicalTopicId', 'queryIntent', 'publicationApproved'];
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      for (const key of forbiddenKeys) expect(Object.prototype.hasOwnProperty.call(skill, key)).toBe(false);
    }
  });

  it('leaves detailed tense decomposition to GR2 while preserving the canonical tense node', () => {
    const tense = getGrammarWritingSkill('tenses');
    expect(tense?.primaryDomainId).toBe('verb-tense-agreement');
    expect(tense?.includedConcepts).toEqual(['present time', 'past time', 'future time', 'tense choice and consistency']);
    expect(tense?.summary).toContain('GR2');
  });

  it('exposes stable edge data for downstream semantic and practice bricks', () => {
    expect(GRAMMAR_WRITING_SKILL_EDGES.length).toBeGreaterThan(20);
    expect(new Set(GRAMMAR_WRITING_SKILL_EDGES.map((edge) => `${edge.sourceSkillId}->${edge.targetSkillId}`)).size).toBe(
      GRAMMAR_WRITING_SKILL_EDGES.length,
    );
    expect(GRAMMAR_WRITING_SKILL_EDGES.every((edge) => edge.relation === 'next')).toBe(true);
  });
});
