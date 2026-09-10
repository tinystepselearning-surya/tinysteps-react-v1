import { describe, expect, it } from 'vitest';
import { PHONICS_KNOWLEDGE_DATASET } from '../../content/phonicsKnowledge';
import { PHONICS_READING_PROBLEMS } from '../../lib/phonicsReadingProblemRegistry.js';
import { PHONICS_PRACTICE_CAPABILITIES } from '../../lib/phonicsPracticeCapabilityRegistry';
import {
  PHONICS_READING_SEMANTIC_EDGES,
  PHONICS_READING_SEMANTIC_NODES,
  getPhonicsReadingSemanticOrphans,
  isPhonicsReadingSkillReachable,
} from '../../lib/phonicsReadingSemanticGraph';

describe('Session A PH6 unified semantic graph', () => {
  it('connects the full structured-literacy progression to the comprehension transition', () => {
    expect(isPhonicsReadingSkillReachable('phonemic-awareness', 'comprehension-transition')).toBe(true);
    expect(isPhonicsReadingSkillReachable('letter-sounds', 'fluency')).toBe(true);
  });

  it('connects every R8 pattern, parent problem and practice capability', () => {
    for (const concept of PHONICS_KNOWLEDGE_DATASET) {
      expect(PHONICS_READING_SEMANTIC_EDGES.some((edge) => edge.to === `pattern:${concept.id}` && edge.relation === 'teaches-pattern'), concept.id).toBe(true);
    }
    for (const problem of PHONICS_READING_PROBLEMS) {
      expect(PHONICS_READING_SEMANTIC_EDGES.some((edge) => edge.from === `problem:${problem.id}` && edge.relation === 'diagnose-skill'), problem.id).toBe(true);
      expect(PHONICS_READING_SEMANTIC_EDGES.some((edge) => edge.from === `problem:${problem.id}` && edge.relation === 'problem-practice'), problem.id).toBe(true);
    }
    for (const practice of PHONICS_PRACTICE_CAPABILITIES) {
      expect(PHONICS_READING_SEMANTIC_EDGES.some((edge) => edge.to === `practice:${practice.id}`), practice.id).toBe(true);
    }
  });

  it('has no duplicate semantic edges and no non-owner orphan nodes', () => {
    const keys = PHONICS_READING_SEMANTIC_EDGES.map((edge) => `${edge.from}|${edge.relation}|${edge.to}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(getPhonicsReadingSemanticOrphans().filter((entry) => entry.kind !== 'owner')).toEqual([]);
    expect(new Set(PHONICS_READING_SEMANTIC_NODES.map((entry) => entry.id)).size).toBe(PHONICS_READING_SEMANTIC_NODES.length);
  });

  it('retains the R16 reading transition inside the composed graph', () => {
    expect(PHONICS_READING_SEMANTIC_EDGES.some((edge) => edge.from === 'owner:reading-comprehension-bridge' && edge.to === 'owner:story-comprehension-diagnostic')).toBe(true);
    expect(PHONICS_READING_SEMANTIC_EDGES.some((edge) => edge.from === 'skill:fluency' && edge.to === 'owner:reading-fluency-guide')).toBe(true);
  });
});
