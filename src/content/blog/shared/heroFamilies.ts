import type { BlogPost } from '../types';

export type BlogHeroFamily =
  | 'satpin-letter-sounds'
  | 'blending-early-reading'
  | 'reading-fluency'
  | 'parent-home-practice'
  | 'grammar-sentence-building'
  | 'speaking-communication'
  | 'school-readiness-routines'
  | 'schools-research'
  | 'teacher-classroom-support'
  | 'general-phonics';

type HeroFamilyPost = Pick<BlogPost, 'slug' | 'hero' | 'audience' | 'discoveryCategory'>;

export const BLOG_HERO_FAMILY_BY_SLUG: Readonly<Record<string, BlogHeroFamily>> = Object.freeze({
  'satpin-phonics-guide': 'satpin-letter-sounds',
  'phonics-for-parents-guide': 'general-phonics',
  'why-child-knows-letter-sounds-but-cannot-read-words': 'blending-early-reading',
  'child-knows-abc-but-cannot-read': 'blending-early-reading',
  'how-kids-learn-blending': 'blending-early-reading',
  'phonics-blending-activities': 'blending-early-reading',
  'how-to-improve-reading-fluency-in-children': 'reading-fluency',
  'how-to-improve-sentence-formation-in-kids': 'grammar-sentence-building',
  'child-understands-english-but-does-not-speak': 'speaking-communication',
  'child-gives-one-word-answers': 'speaking-communication',
});

export const BLOG_HERO_FAMILY_ASSET_DIRECTORY = '/blog/hero-families';

// Add a family here only after its production WebP exists in public/blog/hero-families/.
// Keeping this registry explicit prevents browsers from requesting planned-but-missing assets.
export const AVAILABLE_BLOG_HERO_FAMILY_ASSETS: ReadonlySet<BlogHeroFamily> = new Set();

export function getBlogHeroFamily(post: HeroFamilyPost): BlogHeroFamily | undefined {
  const explicitFamily = BLOG_HERO_FAMILY_BY_SLUG[post.slug];
  if (explicitFamily) return explicitFamily;

  if (post.audience === 'Schools & Research' || post.discoveryCategory === 'Schools & Research') {
    return 'schools-research';
  }

  return undefined;
}

export function getBlogHeroFamilyAssetPath(family: BlogHeroFamily): string {
  return `${BLOG_HERO_FAMILY_ASSET_DIRECTORY}/${family}.webp`;
}

export function resolveBlogHero(post: HeroFamilyPost): string | undefined {
  const family = getBlogHeroFamily(post);
  if (family && AVAILABLE_BLOG_HERO_FAMILY_ASSETS.has(family)) {
    return getBlogHeroFamilyAssetPath(family);
  }

  return post.hero;
}
