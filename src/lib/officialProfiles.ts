import { SEMANTIC_FACTS } from '../config/semanticFacts';

export type OfficialProfilePlatform =
  | 'Facebook'
  | 'Instagram'
  | 'YouTube'
  | 'LinkedIn'
  | 'Pinterest'
  | 'Quora';

export type OfficialPublicProfile = {
  platform: OfficialProfilePlatform;
  url: string;
  purpose: string;
  includeInOrganizationSameAs: boolean;
};

/** Human-visible organization profiles from the Brick 1 semantic facts registry. */
export const OFFICIAL_PUBLIC_PROFILES: readonly OfficialPublicProfile[] =
  SEMANTIC_FACTS.organizationProfiles.map((profile) => ({ ...profile }));

export const OFFICIAL_PUBLIC_PROFILE_URLS = OFFICIAL_PUBLIC_PROFILES.map(
  (profile) => profile.url,
);

/** Profiles intentionally published through EducationalOrganization.sameAs. */
export const ORGANIZATION_SAME_AS_PROFILES = OFFICIAL_PUBLIC_PROFILES.filter(
  (profile) => profile.includeInOrganizationSameAs,
);

export const ORGANIZATION_SAME_AS_PROFILE_URLS = ORGANIZATION_SAME_AS_PROFILES.map(
  (profile) => profile.url,
);
