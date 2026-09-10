import type { PhonicsSoundEntry } from './phonicsSoundRegistry.js';
import type { PhonicsWordUtilityRecord } from './phonicsWordUtilityRegistry.js';
import type { PhonicsReadingSkill } from './phonicsReadingTaxonomy.js';

export type PhonicsLearningReviewState = 'approved' | 'pending' | 'not-required';

export type PhonicsLearningDataForSkill = {
  readonly skill: PhonicsReadingSkill;
  readonly words: readonly PhonicsWordUtilityRecord[];
  readonly sounds: readonly PhonicsSoundEntry[];
};

export const PHONICS_LEARNING_DATA_REVISION: string;
export const PHONICS_LEARNING_REVIEW_STATES: readonly PhonicsLearningReviewState[];
export function getPhonicsWordUtilitiesBySkillId(skillId: string): readonly PhonicsWordUtilityRecord[];
export function getPhonicsSoundsForSkillId(skillId: string): readonly PhonicsSoundEntry[];
export function getPhonicsLearningDataForSkill(skillId: string): PhonicsLearningDataForSkill | null;
export function getPhonicsPendingSoundAssets(): readonly PhonicsSoundEntry[];
export function getPhonicsPendingWordReviews(): readonly PhonicsWordUtilityRecord[];
