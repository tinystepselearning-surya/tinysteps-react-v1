import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C1_AI_VISIBILITY,
  COMMERCIAL_C1_KEYWORD_UNIVERSE,
  COMMERCIAL_C1_POLICY,
  COMMERCIAL_C1_SOURCE_STATUS,
  COMMERCIAL_C1_STATUS,
} from '../../lib/commercialC1SearchUniverse';

const subjects = ['phonics','reading','grammar','writing','spoken_english','public_speaking','communication','broad_english','tutor'];

describe('Commercial C1 search universe', () => {
  it('stays research-only until C2', () => {
    expect(COMMERCIAL_C1_STATUS).toBe('research-complete');
    expect(COMMERCIAL_C1_POLICY.researchOnly).toBe(true);
    expect(COMMERCIAL_C1_POLICY.canonicalKeywordOwnershipAllowed).toBe(false);
    expect(COMMERCIAL_C1_POLICY.ownershipBeginsAt).toBe('C2');
  });

  it('classifies every researched query', () => {
    expect(COMMERCIAL_C1_KEYWORD_UNIVERSE.length).toBeGreaterThanOrEqual(45);
    expect(new Set(COMMERCIAL_C1_KEYWORD_UNIVERSE.map((row) => row.id)).size).toBe(COMMERCIAL_C1_KEYWORD_UNIVERSE.length);
    for (const row of COMMERCIAL_C1_KEYWORD_UNIVERSE) {
      expect(row.subject).toBeTruthy();
      expect(row.intent).toBeTruthy();
      expect(row.parentStage).toBeTruthy();
      expect(row.recommendedAction).toBeTruthy();
      expect(row.evidence.length).toBeGreaterThan(0);
    }
  });

  it('covers every planned commercial subject', () => {
    for (const subject of subjects) {
      expect(COMMERCIAL_C1_KEYWORD_UNIVERSE.some((row) => row.subject === subject), subject).toBe(true);
    }
  });

  it('does not fabricate authenticated GSC query metrics', () => {
    expect(COMMERCIAL_C1_SOURCE_STATUS.authenticatedQueryLevelGsc).toBe('unavailable-in-this-execution');
    for (const row of COMMERCIAL_C1_KEYWORD_UNIVERSE) {
      expect(row.currentRank).toBeNull();
      expect(row.impressions).toBeNull();
      expect(row.ctr).toBeNull();
    }
  });

  it('keeps the five uploaded generative-search periods as supporting evidence', () => {
    expect(COMMERCIAL_C1_AI_VISIBILITY.map((row) => row.impressions)).toEqual([1037,3037,7207,9756,2722]);
  });
});
