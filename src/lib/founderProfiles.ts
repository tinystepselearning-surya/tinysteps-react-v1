export type FounderPublicProfile = {
  platform: 'LinkedIn';
  url: string;
  purpose: string;
};

/**
 * Verified public founder identity links.
 * Keep these person-level profiles separate from EducationalOrganization.sameAs.
 */
export const FOUNDER_PUBLIC_PROFILES: readonly FounderPublicProfile[] = [
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/ravali-priya-vannala/',
    purpose: 'Vannala Ravali Priya — Founder of Tiny Steps Learning',
  },
] as const;

export const FOUNDER_PUBLIC_PROFILE_URLS = FOUNDER_PUBLIC_PROFILES.map((profile) => profile.url);
