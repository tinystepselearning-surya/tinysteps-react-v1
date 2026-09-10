import { describe, expect, it } from 'vitest';
import { PHONICS_KNOWLEDGE_DATASET } from '../../content/phonicsKnowledge/index.js';
import {
  PHONICS_READING_COVERAGE,
  PHONICS_READING_COVERAGE_STATES,
  getPhonicsReadingCoverage,
} from '../../lib/phonicsReadingCoverageRegistry.js';

describe('Session A PH3 phonics coverage governance', () => {
  it('assigns exactly one governed state to every R8 concept', () => {
    expect(PHONICS_READING_COVERAGE).toHaveLength(PHONICS_KNOWLEDGE_DATASET.length);
    expect(new Set(PHONICS_READING_COVERAGE.map((entry) => entry.conceptId)).size).toBe(PHONICS_KNOWLEDGE_DATASET.length);
    for (const concept of PHONICS_KNOWLEDGE_DATASET) {
      const coverage = getPhonicsReadingCoverage(concept.id);
      expect(coverage).not.toBeNull();
      expect(PHONICS_READING_COVERAGE_STATES).toContain(coverage?.state);
    }
  });

  it('never turns evidence-gated holds into public owners', () => {
    for (const entry of PHONICS_READING_COVERAGE) {
      if (entry.state === 'evidence-gated-hold') expect(entry.ownerPath).toBeNull();
      if (entry.state === 'canonical-owner') expect(entry.ownerPath?.startsWith('/')).toBe(true);
    }
  });
});
