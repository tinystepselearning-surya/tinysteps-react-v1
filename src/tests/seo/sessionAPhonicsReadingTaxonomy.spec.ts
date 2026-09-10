import { describe, expect, it } from 'vitest';
import { getPhonicsKnowledgeConcept } from '../../content/phonicsKnowledge/index.js';
import {
  PHONICS_READING_TAXONOMY,
  PHONICS_READING_TAXONOMY_ORDER,
  PHONICS_READING_TEACHING_STAGES,
  getPhonicsReadingProgression,
  getPhonicsReadingSkill,
  getPhonicsReadingSkillsByStage,
} from '../../lib/phonicsReadingTaxonomy.js';

const EXPECTED_ORDER = [
  'phonemic-awareness',
  'letter-sounds',
  'blending',
  'segmenting',
  'cvc',
  'digraphs',
  'blends',
  'long-vowels',
  'vowel-teams',
  'spelling-rules',
  'r-controlled',
  'advanced-patterns',
  'multisyllabic-decoding',
  'fluency',
  'comprehension-transition',
] as const;

describe('Session A PH1 phonics and reading taxonomy', () => {
  it('freezes the complete structured-literacy progression in the intended order', () => {
    expect(PHONICS_READING_TAXONOMY_ORDER).toEqual(EXPECTED_ORDER);
    expect(getPhonicsReadingProgression()).toBe(PHONICS_READING_TAXONOMY);
    expect(Object.isFrozen(PHONICS_READING_TAXONOMY)).toBe(true);
    expect(new Set(PHONICS_READING_TAXONOMY_ORDER).size).toBe(EXPECTED_ORDER.length);
  });

  it('keeps every skill structurally complete and internally connected', () => {
    for (const skill of PHONICS_READING_TAXONOMY) {
      expect(PHONICS_READING_TEACHING_STAGES).toContain(skill.teachingStage);
      expect(skill.label.trim().length).toBeGreaterThan(0);
      expect(skill.skill.trim().length).toBeGreaterThan(0);
      expect(skill.learningBoundary.trim().length).toBeGreaterThan(0);
      expect(skill.exceptions.length).toBeGreaterThan(0);
      expect(skill.pronunciationConventions.length).toBeGreaterThan(0);
      expect(getPhonicsReadingSkill(skill.id)).toBe(skill);

      for (const relationId of [...skill.prerequisiteIds, ...skill.relatedSkillIds, ...skill.nextSkillIds]) {
        expect(getPhonicsReadingSkill(relationId), `${skill.id} -> ${relationId}`).not.toBeNull();
        expect(relationId).not.toBe(skill.id);
      }
    }
  });

  it('allows only real R8 knowledge concept IDs in PH1', () => {
    for (const skill of PHONICS_READING_TAXONOMY) {
      for (const conceptId of skill.knowledgeConceptIds) {
        expect(getPhonicsKnowledgeConcept(conceptId), `${skill.id} -> ${conceptId}`).not.toBeNull();
      }
    }
  });

  it('returns immutable stage views and null for unknown skills', () => {
    for (const stage of PHONICS_READING_TEACHING_STAGES) {
      const entries = getPhonicsReadingSkillsByStage(stage);
      expect(Object.isFrozen(entries)).toBe(true);
      expect(entries.every((entry) => entry.teachingStage === stage)).toBe(true);
    }
    expect(getPhonicsReadingSkill('not-a-real-skill')).toBeNull();
  });
});
