import type { BlogPost } from '../types';

export type ParentAuthorityRole =
  | 'protected-authority'
  | 'parent-hub'
  | 'diagnostic-owner'
  | 'distinct-diagnostic'
  | 'stage-explainer'
  | 'practice-satellite'
  | 'fluency-pillar';

export type ParentAuthorityPillar = {
  slug: string;
  role: ParentAuthorityRole;
  primaryIntent: string;
  gsc: {
    clicks: number;
    impressions: number;
    window: '3 months';
    source: 'user-shared-gsc-2026-08-28';
  };
  changePolicy: 'protect' | 'strengthen' | 'evidence-harden';
};

/**
 * B6 uses the user's 3-month Google Search Console screenshots as a prioritisation
 * signal. These metrics are intentionally kept out of production UI; they exist here
 * as an auditable editorial/SEO contract for the authority pages B6 strengthens.
 */
export const PARENT_AUTHORITY_PILLARS: readonly ParentAuthorityPillar[] = Object.freeze([
  {
    slug: 'satpin-phonics-guide',
    role: 'protected-authority',
    primaryIntent: 'SATPIN phonics guide for parents starting early decoding',
    gsc: { clicks: 269, impressions: 15190, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'protect',
  },
  {
    slug: 'phonics-for-parents-guide',
    role: 'parent-hub',
    primaryIntent: 'Complete parent guide to phonics, decoding, home practice and programme quality',
    gsc: { clicks: 4, impressions: 934, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'strengthen',
  },
  {
    slug: 'why-child-knows-letter-sounds-but-cannot-read-words',
    role: 'diagnostic-owner',
    primaryIntent: 'Child knows letter sounds but cannot blend and decode words independently',
    gsc: { clicks: 8, impressions: 460, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'evidence-harden',
  },
  {
    slug: 'child-knows-abc-but-cannot-read',
    role: 'distinct-diagnostic',
    primaryIntent: 'Child knows alphabet names but has not yet built sound-to-print decoding',
    gsc: { clicks: 3, impressions: 134, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'strengthen',
  },
  {
    slug: 'how-kids-learn-blending',
    role: 'stage-explainer',
    primaryIntent: 'How blending develops from oral merging to printed words and sentence transfer',
    gsc: { clicks: 3, impressions: 239, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'strengthen',
  },
  {
    slug: 'phonics-blending-activities',
    role: 'practice-satellite',
    primaryIntent: 'Practical blending activities for a child who needs staged practice',
    gsc: { clicks: 0, impressions: 154, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'strengthen',
  },
  {
    slug: 'how-to-improve-reading-fluency-in-children',
    role: 'fluency-pillar',
    primaryIntent: 'Improve reading fluency through accurate decoding, guided oral reading, phrasing and meaning',
    gsc: { clicks: 0, impressions: 102, window: '3 months', source: 'user-shared-gsc-2026-08-28' },
    changePolicy: 'evidence-harden',
  },
]);

export const PARENT_AUTHORITY_SLUGS = Object.freeze(
  PARENT_AUTHORITY_PILLARS.map((pillar) => pillar.slug),
);

export function getParentAuthorityPillar(slug: string): ParentAuthorityPillar | undefined {
  return PARENT_AUTHORITY_PILLARS.find((pillar) => pillar.slug === slug);
}

export function getParentAuthorityPosts(posts: readonly BlogPost[]): BlogPost[] {
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  return PARENT_AUTHORITY_SLUGS.map((slug) => bySlug.get(slug)).filter((post): post is BlogPost => Boolean(post));
}
