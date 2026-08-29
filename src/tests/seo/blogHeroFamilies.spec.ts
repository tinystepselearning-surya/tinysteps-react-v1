import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  AVAILABLE_BLOG_HERO_FAMILY_ASSETS,
  BLOG_HERO_FAMILY_BY_SLUG,
  getBlogHeroFamily,
  getBlogHeroFamilyAssetPath,
  resolveBlogHero,
  type BlogHeroFamily,
} from '../../content/blog/shared/heroFamilies';

const EXPECTED_FAMILY_COUNTS: Record<BlogHeroFamily, number> = {
  'satpin-letter-sounds': 2,
  'blending-early-reading': 6,
  'reading-fluency': 1,
  'parent-home-practice': 8,
  'grammar-sentence-building': 9,
  'speaking-communication': 10,
  'school-readiness-routines': 3,
  'schools-research': 6,
  'teacher-classroom-support': 2,
  'general-phonics': 18,
};

const INTENTIONAL_EXISTING_HERO_SLUGS = [
  'are-phonics-apps-enough-for-kids',
  'can-child-improve-english-in-10-days',
  'how-phonics-grammar-and-communication-work-together',
  'how-to-choose-phonics-classes',
  'online-english-classes-for-kids-india',
  'online-phonics-classes-vs-school',
  'grammar-creative-writing',
  'phonics-diagnostics',
  'phonics-comprehension',
  'why-child-reads-words-but-does-not-understand-story',
  'why-parents-choose-online-phonics',
] as const;

describe('blog hero image family architecture', () => {
  it('maps every reviewed article to its approved family or an intentional existing-hero fallback', () => {
    const actualCounts = Object.fromEntries(
      [...AVAILABLE_BLOG_HERO_FAMILY_ASSETS].map((family) => [family, 0]),
    ) as Record<BlogHeroFamily, number>;

    for (const post of blogPosts) {
      const family = getBlogHeroFamily(post);
      if (family) actualCounts[family] += 1;
    }

    expect(actualCounts).toEqual(EXPECTED_FAMILY_COUNTS);
    expect(
      blogPosts.filter((post) => !getBlogHeroFamily(post)).map((post) => post.slug).sort(),
    ).toEqual([...INTENTIONAL_EXISTING_HERO_SLUGS].sort());
  });

  it('keeps required semantic assignments explicit and stable', () => {
    expect(BLOG_HERO_FAMILY_BY_SLUG['satpin-phonics-guide']).toBe('satpin-letter-sounds');
    expect(BLOG_HERO_FAMILY_BY_SLUG['week-1-phonics-satpin-launch']).toBe('satpin-letter-sounds');
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-blending-activities']).toBe('blending-early-reading');
    expect(BLOG_HERO_FAMILY_BY_SLUG['how-kids-learn-blending']).toBe('blending-early-reading');
    expect(BLOG_HERO_FAMILY_BY_SLUG['how-to-improve-reading-fluency-in-children']).toBe(
      'reading-fluency',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['week-23-grammar-speaking-bridge']).toBe(
      'grammar-sentence-building',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-teacher-training-for-schools-implementation']).toBe(
      'teacher-classroom-support',
    );
  });

  it('resolves cleaned weekly public slugs through their preserved semantic family', () => {
    const cleanedGrammar = blogPosts.find((post) => post.slug === 'grammar-speaking-bridge')!;
    const cleanedSpeaking = blogPosts.find((post) => post.slug === 'speaking-visual-aids')!;
    const cleanedPhonics = blogPosts.find((post) => post.slug === 'phonics-satpin-launch')!;

    expect(getBlogHeroFamily(cleanedGrammar)).toBe('grammar-sentence-building');
    expect(getBlogHeroFamily(cleanedSpeaking)).toBe('speaking-communication');
    expect(getBlogHeroFamily(cleanedPhonics)).toBe('satpin-letter-sounds');
  });

  it('routes reviewed school evidence to research unless a teacher-support mapping is stronger', () => {
    const researchPost = blogPosts.find(
      (post) => post.slug === 'cbse-phonics-curriculum-vs-systematic-phonics-programme',
    )!;
    const teacherPost = blogPosts.find(
      (post) => post.slug === 'phonics-teacher-training-for-schools-implementation',
    )!;

    expect(getBlogHeroFamily(researchPost)).toBe('schools-research');
    expect(getBlogHeroFamily(teacherPost)).toBe('teacher-classroom-support');
  });

  it('activates only assets that exist and resolve to non-empty public WebP files', () => {
    expect(AVAILABLE_BLOG_HERO_FAMILY_ASSETS.size).toBe(10);

    for (const family of AVAILABLE_BLOG_HERO_FAMILY_ASSETS) {
      const publicPath = getBlogHeroFamilyAssetPath(family);
      const filePath = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
      expect(existsSync(filePath), `${family} asset must exist`).toBe(true);
      expect(statSync(filePath).size, `${family} asset must not be empty`).toBeGreaterThan(0);
    }
  });

  it('uses the family image for mapped posts and preserves article-specific fallbacks', () => {
    const mappedPost = blogPosts.find((post) => post.slug === 'satpin-phonics-guide')!;
    const fallbackPost = blogPosts.find(
      (post) => post.slug === 'why-child-reads-words-but-does-not-understand-story',
    )!;

    expect(resolveBlogHero(mappedPost)).toBe('/blog/hero-families/satpin-letter-sounds.webp');
    expect(resolveBlogHero(fallbackPost)).toBe(fallbackPost.hero);
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
});
