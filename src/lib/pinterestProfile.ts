import { SEMANTIC_FACTS } from '../config/semanticFacts';

const pinterestProfile = SEMANTIC_FACTS.organizationProfiles.find(
  (profile) => profile.platform === 'Pinterest',
);

if (!pinterestProfile) {
  throw new Error('Pinterest profile missing from semantic facts registry');
}

export const PINTEREST_PROFILE = pinterestProfile;
export const PINTEREST_PROFILE_URL = PINTEREST_PROFILE.url;
