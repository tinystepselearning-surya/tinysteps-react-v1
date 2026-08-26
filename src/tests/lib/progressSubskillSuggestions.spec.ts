import { describe, expect, it } from 'vitest';
import {
  deriveProgressSubskillSuggestions,
  resolveProgressSubskillSelection,
} from '../../lib/progressSubskillSuggestions';
import type { ProgressSkillDefinition } from '../../lib/progressSkills';

const skills: ProgressSkillDefinition[] = [
  { key: 'alpha', label: 'Alpha', area: 'phonics' },
  { key: 'beta', label: 'Beta', area: 'phonics' },
  { key: 'gamma', label: 'Gamma', area: 'phonics' },
  { key: 'delta', label: 'Delta', area: 'phonics' },
  { key: 'epsilon', label: 'Epsilon', area: 'phonics' },
];

describe('progress subskill suggestions', () => {
  it('derives strengths from 3-4 stars and practice from 1-2 stars', () => {
    expect(deriveProgressSubskillSuggestions({
      alpha: 4,
      beta: 3,
      gamma: 2,
      delta: 1,
      epsilon: 0,
    }, skills)).toEqual({
      strengths: ['Alpha', 'Beta'],
      needsPractice: ['Delta', 'Gamma'],
    });
  });

  it('never suggests unrated skills or overlaps the two groups', () => {
    const result = deriveProgressSubskillSuggestions({
      alpha: 4,
      beta: 0,
      gamma: 2,
      delta: 0,
      epsilon: 3,
    }, skills);

    expect(result.strengths).toEqual(['Alpha', 'Epsilon']);
    expect(result.needsPractice).toEqual(['Gamma']);
    expect(result.strengths.some((label) => result.needsPractice.includes(label))).toBe(false);
  });

  it('preserves legacy teacher selections when no source marker exists', () => {
    expect(resolveProgressSubskillSelection({
      progressRatings: { alpha: 4, beta: 1 },
      progressSkills: skills,
      savedStrengths: ['Beta', 'Alpha'],
      savedNeedsPractice: ['Alpha', 'Gamma'],
    })).toEqual({
      source: 'teacher',
      strengths: ['Beta', 'Alpha'],
      needsPractice: ['Gamma'],
    });
  });

  it('re-derives from stars when the saved source is stars', () => {
    expect(resolveProgressSubskillSelection({
      progressRatings: { alpha: 4, beta: 1, gamma: 2 },
      progressSkills: skills,
      savedSource: 'stars',
      savedStrengths: ['Beta'],
      savedNeedsPractice: ['Alpha'],
    })).toEqual({
      source: 'stars',
      strengths: ['Alpha'],
      needsPractice: ['Beta', 'Gamma'],
    });
  });

  it('preserves an explicit teacher override and filters stale labels', () => {
    expect(resolveProgressSubskillSelection({
      progressRatings: { alpha: 4, beta: 1 },
      progressSkills: skills,
      savedSource: 'teacher',
      savedStrengths: ['Alpha', 'Old skill'],
      savedNeedsPractice: ['Beta', 'Old skill'],
    })).toEqual({
      source: 'teacher',
      strengths: ['Alpha'],
      needsPractice: ['Beta'],
    });
  });
});
