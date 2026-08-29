export type OfficialProfilePlatform = 'Facebook' | 'Instagram' | 'YouTube' | 'LinkedIn';

export type OfficialPublicProfile = {
  platform: OfficialProfilePlatform;
  url: string;
  purpose: string;
};

/**
 * Public Tiny Steps profiles already declared by the production organization schema.
 *
 * B15 makes this list reusable by visible site UI and keeps the schema contract
 * guarded by tests so profile URLs cannot silently drift across surfaces.
 */
export const OFFICIAL_PUBLIC_PROFILES = [
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/tinystepslearning',
    purpose: 'Tiny Steps Learning updates and parent-facing learning content',
  },
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/tiny_steps_oel/',
    purpose: 'Tiny Steps Learning classroom and learning updates',
  },
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@TinyStepsLearning-1157',
    purpose: 'Tiny Steps Learning videos and learning guidance',
  },
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/company/tiny-steps-learning/',
    purpose: 'Tiny Steps Learning company and educational updates',
  },
] as const satisfies readonly OfficialPublicProfile[];

export const OFFICIAL_PUBLIC_PROFILE_URLS = OFFICIAL_PUBLIC_PROFILES.map((profile) => profile.url);
