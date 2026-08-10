import { describe, expect, it } from 'vitest';
import {
  CANONICAL_PHONICS_TOPICS,
  PHONICS_CURRICULUM_REVISION,
  canonicalizeCurriculumTopics,
  hasCanonicalPhonicsTopics,
} from '../src/phonicsCurriculumConfig';

describe('server canonical phonics curriculum', () => {
  it('keeps the approved 31/40/30 lesson counts', () => {
    expect(PHONICS_CURRICULUM_REVISION).toBe('2026-08-10');
    expect(CANONICAL_PHONICS_TOPICS.filter((topic) => topic.courseId === 'phonics-foundations')).toHaveLength(31);
    expect(CANONICAL_PHONICS_TOPICS.filter((topic) => topic.courseId === 'early-phonics')).toHaveLength(40);
    expect(CANONICAL_PHONICS_TOPICS.filter((topic) => topic.courseId === 'advanced-phonics')).toHaveLength(30);
    expect(CANONICAL_PHONICS_TOPICS).toHaveLength(101);
  });

  it('replaces stale phonics while preserving non-phonics topics', () => {
    const stale = [
      { id: 'early-phonics__lesson-41', courseId: 'early-phonics', area: 'phonics', label: 'Old revision' },
      { id: 'advanced-phonics__lesson-01', courseId: 'advanced-phonics', area: 'phonics', label: 'Old diphthong' },
      { id: 'basic-grammar__lesson-01', courseId: 'basic-grammar', area: 'grammar', label: 'Nouns' },
    ];

    const canonical = canonicalizeCurriculumTopics(stale);
    expect(canonical).toHaveLength(102);
    expect(canonical).toContainEqual(stale[2]);
    expect(canonical.some((topic: any) => topic.id === 'early-phonics__lesson-41')).toBe(false);
    expect(canonical.some((topic: any) => topic.id === 'phonics-foundations__lesson-31' && topic.label === 'Grand Revision')).toBe(true);
    expect(canonical.some((topic: any) => topic.id === 'early-phonics__lesson-40' && topic.label === 'The Lazy Sound')).toBe(true);
    expect(canonical.some((topic: any) => topic.id === 'advanced-phonics__lesson-30' && topic.label === 'The Lazy Vowel Mystery')).toBe(true);
    expect(hasCanonicalPhonicsTopics(canonical)).toBe(true);
  });

  it('rejects old 30/41/20 signatures as non-canonical', () => {
    const oldTopics = [
      ...Array.from({ length: 30 }, (_, index) => ({ id: `phonics-foundations__lesson-${String(index + 1).padStart(2, '0')}`, courseId: 'phonics-foundations', area: 'phonics' })),
      ...Array.from({ length: 41 }, (_, index) => ({ id: `early-phonics__lesson-${String(index + 1).padStart(2, '0')}`, courseId: 'early-phonics', area: 'phonics' })),
      ...Array.from({ length: 20 }, (_, index) => ({ id: `advanced-phonics__lesson-${String(index + 1).padStart(2, '0')}`, courseId: 'advanced-phonics', area: 'phonics' })),
    ];
    expect(hasCanonicalPhonicsTopics(oldTopics)).toBe(false);
  });
});
