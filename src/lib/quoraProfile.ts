import { SEMANTIC_FACTS } from '../config/semanticFacts';

const quoraProfile = SEMANTIC_FACTS.organizationProfiles.find(
  (profile) => profile.platform === 'Quora',
);

if (!quoraProfile) {
  throw new Error('Quora profile missing from semantic facts registry');
}

export const QUORA_PROFILE = quoraProfile;
export const QUORA_PROFILE_URL = QUORA_PROFILE.url;
