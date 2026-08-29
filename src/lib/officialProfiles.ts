import { organizationSchema } from './schemas';

export type OfficialProfilePlatform = 'Facebook' | 'Instagram' | 'YouTube' | 'LinkedIn';

export type OfficialPublicProfile = {
  platform: OfficialProfilePlatform;
  url: string;
  purpose: string;
};

const PROFILE_METADATA_BY_HOST = {
  'www.facebook.com': {
    platform: 'Facebook',
    purpose: 'Tiny Steps Learning updates and parent-facing learning content',
  },
  'www.instagram.com': {
    platform: 'Instagram',
    purpose: 'Tiny Steps Learning classroom and learning updates',
  },
  'www.youtube.com': {
    platform: 'YouTube',
    purpose: 'Tiny Steps Learning videos and learning guidance',
  },
  'www.linkedin.com': {
    platform: 'LinkedIn',
    purpose: 'Tiny Steps Learning company and educational updates',
  },
} as const satisfies Record<
  string,
  { platform: OfficialProfilePlatform; purpose: string }
>;

/**
 * Human-visible official profiles derived from the canonical Organization.sameAs
 * contract. The URL is defined only once in schemas.ts; this module adds display
 * metadata without creating a second source of truth.
 */
export const OFFICIAL_PUBLIC_PROFILES: readonly OfficialPublicProfile[] = organizationSchema.sameAs.map((url) => {
  const hostname = new URL(url).hostname as keyof typeof PROFILE_METADATA_BY_HOST;
  const metadata = PROFILE_METADATA_BY_HOST[hostname];

  if (!metadata) {
    throw new Error(`Missing display metadata for official Tiny Steps profile host: ${hostname}`);
  }

  return {
    ...metadata,
    url,
  };
});

export const OFFICIAL_PUBLIC_PROFILE_URLS = OFFICIAL_PUBLIC_PROFILES.map((profile) => profile.url);
