import { describe, expect, it } from 'vitest';
import {
  PHONICS_SOUND_ASSET_STATES,
  PHONICS_SOUND_REGISTRY,
  getPhonicsSound,
  getPhonicsSoundAudioCandidates,
} from '../../lib/phonicsSoundRegistry.js';
import { PHONICS_WORD_UTILITY_RECORDS } from '../../lib/phonicsWordUtilityRegistry.js';
import {
  PHONICS_LEARNING_REVIEW_STATES,
  getPhonicsLearningDataForSkill,
  getPhonicsPendingSoundAssets,
  getPhonicsPendingWordReviews,
  getPhonicsWordUtilitiesBySkillId,
} from '../../lib/phonicsLearningDataRegistry.js';

describe('Session A PH2 canonical phonics learning data', () => {
  it('uses explicit readiness states without manufacturing approval', () => {
    expect(PHONICS_SOUND_ASSET_STATES).toEqual(['approved', 'pending', 'not-required']);
    expect(PHONICS_LEARNING_REVIEW_STATES).toEqual(['approved', 'pending', 'not-required']);
    for (const sound of PHONICS_SOUND_REGISTRY) {
      expect(PHONICS_SOUND_ASSET_STATES).toContain(sound.assetState);
      expect(sound.assetState).not.toBe('expected-upload');
    }
    expect(getPhonicsPendingSoundAssets().length).toBeGreaterThan(0);
    expect(getPhonicsPendingWordReviews().length).toBeGreaterThan(0);
  });

  it('preserves existing fallback audio candidates for basic sounds', () => {
    expect(getPhonicsSoundAudioCandidates('s')).toContain('/games/phonics/s.mp3');
    expect(getPhonicsSoundAudioCandidates('a' as never)).toEqual([]);
    expect(getPhonicsSound('short-a')).not.toBeNull();
  });

  it('keeps every R13 word mapping explicit and reconstructable', () => {
    for (const record of PHONICS_WORD_UTILITY_RECORDS) {
      const rebuilt = record.segments.map((segment) => segment.grapheme.replace(/[^a-z]/gi, '')).join('').toLowerCase();
      expect(rebuilt).toBe(record.word.replace(/[^a-z]/g, ''));
      expect(record.segments.length).toBeGreaterThan(0);
      expect(record.humanReviewState).toBe('pending');
    }
  });

  it('indexes canonical words by PH1 skill without creating duplicate word records', () => {
    const cvcWords = getPhonicsWordUtilitiesBySkillId('cvc');
    const vowelTeamWords = getPhonicsWordUtilitiesBySkillId('vowel-teams');
    expect(cvcWords.some((record) => record.word === 'map')).toBe(true);
    expect(vowelTeamWords.some((record) => record.word === 'rain')).toBe(true);
    for (const record of [...cvcWords, ...vowelTeamWords]) {
      expect(PHONICS_WORD_UTILITY_RECORDS).toContain(record);
    }
    expect(getPhonicsLearningDataForSkill('not-a-skill')).toBeNull();
  });
});
