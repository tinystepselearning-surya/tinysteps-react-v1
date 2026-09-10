import { describe, expect, it } from 'vitest';
import { getPhonicsReadingSkill } from '../../lib/phonicsReadingTaxonomy.js';
import {
  PHONICS_READING_PROBLEMS,
  getPhonicsReadingProblem,
} from '../../lib/phonicsReadingProblemRegistry.js';

const EXPECTED_IDS = [
  'letter-sounds-known-cannot-blend',
  'guesses-words',
  'slow-decoding',
  'vowel-confusion',
  'unfamiliar-word-decoding',
  'decodes-but-lacks-fluency',
  'reads-without-comprehension',
  'spelling-segmenting-difficulty',
  'memorises-instead-of-reads',
];

describe('Session A PH4 parent reading problems', () => {
  it('models exactly the nine frozen problems', () => {
    expect(PHONICS_READING_PROBLEMS.map((entry) => entry.id)).toEqual(EXPECTED_IDS);
    expect(new Set(EXPECTED_IDS).size).toBe(9);
  });

  it('connects every problem to diagnosis, skills, practice, next step and assessment', () => {
    for (const entry of PHONICS_READING_PROBLEMS) {
      expect(entry.diagnosisChecks.length).toBeGreaterThan(0);
      expect(entry.skillIds.length).toBeGreaterThan(0);
      expect(entry.practicePaths.length).toBeGreaterThan(0);
      expect(entry.nextStepPaths.length).toBeGreaterThan(0);
      expect(entry.assessmentPath).toBe('/book-demo');
      expect(getPhonicsReadingProblem(entry.id)).toBe(entry);
      for (const skillId of entry.skillIds) expect(getPhonicsReadingSkill(skillId)).not.toBeNull();
      for (const path of [...entry.practicePaths, ...entry.nextStepPaths]) expect(path.startsWith('/')).toBe(true);
    }
  });

  it('keeps data-only held problems from acquiring dedicated URLs', () => {
    const held = PHONICS_READING_PROBLEMS.filter((entry) => entry.ownerState === 'hold-no-url');
    expect(held.map((entry) => entry.id)).toEqual(['spelling-segmenting-difficulty', 'memorises-instead-of-reads']);
    expect(held.every((entry) => entry.ownerPath === null)).toBe(true);
  });
});
