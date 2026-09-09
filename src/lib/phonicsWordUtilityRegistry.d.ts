import type { PhonicsSoundCategory } from './phonicsSoundRegistry.js';

export interface PhonicsWordSoundSegment {
  readonly grapheme: string;
  readonly soundId: string;
}

export interface PhonicsWordUtilityRecord {
  readonly word: string;
  readonly segments: readonly PhonicsWordSoundSegment[];
  readonly soundChunkCount: number;
  readonly phonemeCount: number;
  readonly meaning: string;
  readonly exampleSentence: string;
  readonly trickyPart: string;
  readonly conceptIds: readonly string[];
  readonly relatedWords: readonly string[];
  readonly utilityState: 'starter-curated';
  readonly humanReviewState: 'pending';
  readonly note: string | null;
}

export const PHONICS_WORD_UTILITY_REVISION: string;
export const PHONICS_WORD_UTILITY_STATE: 'starter-curated';
export const PHONICS_WORD_HUMAN_REVIEW_STATE: 'pending';
export const PHONICS_WORD_UTILITY_RECORDS: readonly PhonicsWordUtilityRecord[];
export function normalizePhonicsWordQuery(value: string): string;
export function getPhonicsWordUtility(value: string): PhonicsWordUtilityRecord | null;
export function searchPhonicsWordUtilities(value: string, limit?: number): readonly PhonicsWordUtilityRecord[];
export function getPhonicsWordUtilitiesByConceptId(conceptId: string): readonly PhonicsWordUtilityRecord[];
export function getPhonicsWordSoundCategories(record: PhonicsWordUtilityRecord): readonly PhonicsSoundCategory[];
