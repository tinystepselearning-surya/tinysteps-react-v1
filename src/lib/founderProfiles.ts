import { SEMANTIC_FACTS } from '../config/semanticFacts';

export type FounderPublicProfile = {
  platform: 'LinkedIn';
  url: string;
  purpose: string;
};

/**
 * Verified founder identity links from the Brick 1 semantic registry.
 * Person-level profiles remain separate from EducationalOrganization.sameAs.
 */
export const FOUNDER_PUBLIC_PROFILES: readonly FounderPublicProfile[] =
  SEMANTIC_FACTS.founder.publicProfiles.map((profile) => ({ ...profile }));

export const FOUNDER_PUBLIC_PROFILE_URLS = FOUNDER_PUBLIC_PROFILES.map(
  (profile) => profile.url,
);
