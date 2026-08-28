import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  AVAILABLE_BLOG_HERO_FAMILY_ASSETS,
  BLOG_HERO_FAMILY_BY_SLUG,
  getBlogHeroFamily,
  getBlogHeroFamilyAssetPath,
  resolveBlogHero,
} from '../../content/blog/shared/heroFamilies';

const EXPECTED_FAMILIES = {
  'satpin-phonics-guide': 'satpin-letter-sounds',
  'phonics-for-parents-guide': 'general-phonics',
  'why-child-knows-letter-sounds-but-cannot-read-words': 'blending-early-reading',
  'child-knows-abc-but-cannot-read': 'blending-early-reading',
  'how-kids-learn-blending': 'blending-early-reading',
  'phonics-blending-activities': 'blending-early-reading',
  'how-to-improve-reading-fluency-in-children': 'reading-fluency',
  'how-to-improve-sentence-formation-in-kids': 'grammar-sentence-building',
  'child-understands-english-but-does-not-speak': 'speaking-communication',
} as const;

describe('blog hero image family architecture', () => {
  it('maps the initial high-value pages to stable visual families', () => {
    const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

    for (const [slug, family] of Object.entries(EXPECTED_FAMILIES)) {
      expect(bySlug.has(slug), `${slug} must remain an existing blog URL`).toBe(true);
      expect(BLOG_HERO_FAMILY_BY_SLUG[slug]).toBe(family);
      expect(getBlogHeroFamily(bySlug.get(slug)!)).toBe(family);
    }
  });

  it('uses existing audience metadata for school research content', () => {
    const schoolPosts = blogPosts.filter((post) => post.audience === 'Schools & Research');
    expect(schoolPosts.length).toBeGreaterThan(0);
    expect(schoolPosts.every((post) => getBlogHeroFamily(post) === 'schools-research')).toBe(true);
  });

  it('keeps current heroes and never requests planned assets before they exist', () => {
    expect(AVAILABLE_BLOG_HERO_FAMILY_ASSETS.size).toBe(0);

    const mappedPost = blogPosts.find((post) => post.slug === 'satpin-phonics-guide')!;
    expect(resolveBlogHero(mappedPost)).toBe(mappedPost.hero);
    expect(resolveBlogHero({
      slug: 'unmapped-test-post',
      hero: '/blog/existing-hero.webp',
      audience: 'Parent',
      discoveryCategory: 'Parent Guides',
    })).toBe('/blog/existing-hero.webp');
    expect(resolveBlogHero({
      slug: 'unmapped-no-hero',
      audience: 'Parent',
      discoveryCategory: 'Parent Guides',
    })).toBeUndefined();
  });

  it('exposes the predictable future WebP path contract', () => {
    expect(getBlogHeroFamilyAssetPath('blending-early-reading')).toBe(
      '/blog/hero-families/blending-early-reading.webp',
    );
  });
});
