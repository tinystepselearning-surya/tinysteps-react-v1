export type PhonicsReadingCoverageState = 'canonical-owner' | 'supporting-owner' | 'dataset-practice-only' | 'evidence-gated-hold';
export interface PhonicsReadingCoverageEntry {
  readonly conceptId: string;
  readonly state: PhonicsReadingCoverageState;
  readonly ownerPath: string | null;
  readonly ownerTopicId: string | null;
  readonly supportingPaths: readonly string[];
  readonly heldSlugCandidate: string | null;
  readonly rationale: string;
}
export const PHONICS_READING_COVERAGE_REVISION: string;
export const PHONICS_READING_COVERAGE_STATES: readonly PhonicsReadingCoverageState[];
export const PHONICS_READING_COVERAGE: readonly PhonicsReadingCoverageEntry[];
export function getPhonicsReadingCoverage(conceptId: string): PhonicsReadingCoverageEntry | null;
export function getPhonicsReadingCoverageByState(state: PhonicsReadingCoverageState): readonly PhonicsReadingCoverageEntry[];
