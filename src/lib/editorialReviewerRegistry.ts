import {
  FOUNDER_ID,
  FOUNDER_PROFILE_PATH,
  FOUNDER_PROFILE_URL,
  PUBLIC_FACTS,
} from './schemas';
import type { PhonicsEditorialReviewerKey } from './phonicsEditorialReviewRegistry.js';

export type EditorialReviewer = {
  readonly key: PhonicsEditorialReviewerKey;
  readonly fullName: string;
  readonly displayName: string;
  readonly roleLabel: string;
  readonly profilePath: string;
  readonly profileUrl: string;
  readonly personId: string;
};

export const EDITORIAL_REVIEWERS: Readonly<Record<PhonicsEditorialReviewerKey, EditorialReviewer>> = Object.freeze({
  'founder-priya': Object.freeze({
    key: 'founder-priya',
    fullName: PUBLIC_FACTS.founder.fullName,
    displayName: PUBLIC_FACTS.founder.displayName,
    roleLabel: 'Founder & Academic Leadership',
    profilePath: FOUNDER_PROFILE_PATH,
    profileUrl: FOUNDER_PROFILE_URL,
    personId: FOUNDER_ID,
  }),
});

export function getEditorialReviewer(key: PhonicsEditorialReviewerKey): EditorialReviewer {
  return EDITORIAL_REVIEWERS[key];
}
