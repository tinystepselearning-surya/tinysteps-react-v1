import { describe, expect, it } from 'vitest';
import { PHONICS_KNOWLEDGE_DATASET } from '../../content/phonicsKnowledge';
import { R16_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/readingSemanticCanonicalOwnership.js';
import { PHONICS_READING_TAXONOMY } from '../../lib/phonicsReadingTaxonomy.js';
import { PHONICS_READING_COVERAGE } from '../../lib/phonicsReadingCoverageRegistry.js';
import { PHONICS_READING_PROBLEMS } from '../../lib/phonicsReadingProblemRegistry.js';
import { PHONICS_PRACTICE_CAPABILITIES } from '../../lib/phonicsPracticeCapabilityRegistry';
import { PHONICS_SOUND_ASSET_STATES, PHONICS_SOUND_REGISTRY } from '../../lib/phonicsSoundRegistry.js';
import { PHONICS_WORD_UTILITY_RECORDS } from '../../lib/phonicsWordUtilityRegistry.js';
import { getPhonicsWordUtilitiesBySkillId } from '../../lib/phonicsLearningDataRegistry.js';
import {
  getPhonicsReadingSemanticOrphans,
  isPhonicsReadingSkillReachable,
} from '../../lib/phonicsReadingSemanticGraph';

describe('Session A PH7 closure gate', () => {
  it('closes the taxonomy, pattern coverage and parent-problem inventories', () => {
    expect(PHONICS_READING_TAXONOMY).toHaveLength(15);
    expect(PHONICS_READING_COVERAGE).toHaveLength(PHONICS_KNOWLEDGE_DATASET.length);
    expect(PHONICS_READING_PROBLEMS).toHaveLength(9);
  });

  it('keeps sound and word readiness explicit and conservative', () => {
    expect(PHONICS_SOUND_ASSET_STATES).toEqual(['approved', 'pending', 'not-required']);
    expect(PHONICS_SOUND_REGISTRY.every((entry) => PHONICS_SOUND_ASSET_STATES.includes(entry.assetState))).toBe(true);
    expect(PHONICS_SOUND_REGISTRY.some((entry) => entry.assetState === 'expected-upload')).toBe(false);
    expect(PHONICS_WORD_UTILITY_RECORDS.every((entry) => entry.humanReviewState === 'pending')).toBe(true);
  });

  it('provides canonical word data for the skills R13 currently supports', () => {
    for (const skillId of ['letter-sounds', 'blending', 'segmenting', 'cvc', 'digraphs', 'vowel-teams', 'spelling-rules', 'r-controlled', 'advanced-patterns', 'multisyllabic-decoding']) {
      expect(getPhonicsWordUtilitiesBySkillId(skillId).length, skillId).toBeGreaterThan(0);
    }
  });

  it('links all parent problems to existing practice while protecting held URLs', () => {
    const practicePaths = new Set(PHONICS_PRACTICE_CAPABILITIES.map((entry) => entry.path));
    for (const problem of PHONICS_READING_PROBLEMS) {
      expect(problem.practicePaths.every((path) => practicePaths.has(path)), problem.id).toBe(true);
      if (problem.ownerState === 'hold-no-url') expect(problem.ownerPath).toBeNull();
    }
  });

  it('preserves canonical uniqueness and the complete learning journey', () => {
    const ids = R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id);
    const intents = R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.queryIntent.trim().toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(intents).size).toBe(intents.length);
    expect(isPhonicsReadingSkillReachable('phonemic-awareness', 'comprehension-transition')).toBe(true);
    expect(getPhonicsReadingSemanticOrphans().filter((entry) => entry.kind !== 'owner')).toEqual([]);
  });
});
