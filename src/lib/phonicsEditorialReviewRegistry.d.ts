export type PhonicsEditorialReviewStatus = 'pending' | 'approved' | 'changes-requested';
export type PhonicsEditorialReviewerKey = 'founder-priya';

export interface PhonicsEditorialReviewRecord {
  readonly conceptId: string;
  readonly path: `/resources/phonics/${string}`;
  readonly reviewerKey: PhonicsEditorialReviewerKey;
  readonly editorialReviewStatus: PhonicsEditorialReviewStatus;
  readonly reviewedAt: string | null;
  readonly reviewedRevision: string | null;
  readonly reviewNotes: string | null;
  readonly governanceRevision: string;
}

export const PHONICS_EDITORIAL_REVIEW_REVISION: string;
export const PHONICS_EDITORIAL_REVIEW_STATUSES: readonly PhonicsEditorialReviewStatus[];
export const PHONICS_EDITORIAL_REVIEWER_KEYS: readonly PhonicsEditorialReviewerKey[];
export const PHONICS_EDITORIAL_REVIEW_RECORDS: readonly PhonicsEditorialReviewRecord[];
export function getPhonicsEditorialReviewByConceptId(conceptId: string): PhonicsEditorialReviewRecord | null;
export function getPhonicsEditorialReviewByPath(pathname: string): PhonicsEditorialReviewRecord | null;
export function getApprovedPhonicsEditorialReview(pathname: string): PhonicsEditorialReviewRecord | null;
