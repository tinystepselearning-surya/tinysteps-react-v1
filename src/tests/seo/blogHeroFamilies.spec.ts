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
  'listening-for-sounds': 1,
  'sound-meets-letter': 10,
  'blending-into-a-word': 5,
  'cracking-the-printed-code': 8,
  'breaking-down-longer-words': 1,
  'from-speech-to-spelling': 1,
  'reading-for-meaning': 3,
  'fluent-independent-reading': 4,
  'finding-the-reading-gap': 3,
  'learning-live-online': 3,
  'digital-practice-with-purpose': 3,
  'english-practice-at-home': 6,
  'building-better-sentences': 5,
  'planning-and-writing-ideas': 2,
  'editing-and-improving-writing': 4,
  'finding-your-speaking-voice': 3,
  'conversation-and-storytelling': 3,
  'presenting-with-confidence': 7,
  'ready-for-the-classroom': 2,
  'teacher-training-in-action': 1,
  'planning-a-school-reading-programme': 7,
};

describe('blog hero image family architecture', () => {
  it('maps all 82 public blog articles exactly once with no fallback gaps', () => {
    expect(blogPosts).toHaveLength(82);
    expect(Object.keys(BLOG_HERO_FAMILY_BY_SLUG)).toHaveLength(82);
    expect(new Set(Object.keys(BLOG_HERO_FAMILY_BY_SLUG)).size).toBe(82);

    const postSlugs = blogPosts.map((post) => post.slug).sort();
    const mappedSlugs = Object.keys(BLOG_HERO_FAMILY_BY_SLUG).sort();
    expect(mappedSlugs).toEqual(postSlugs);
    expect(blogPosts.filter((post) => !getBlogHeroFamily(post))).toEqual([]);
  });

  it('keeps the reviewed family distribution stable', () => {
    const actualCounts = Object.fromEntries(
      [...AVAILABLE_BLOG_HERO_FAMILY_ASSETS].map((family) => [family, 0]),
    ) as Record<BlogHeroFamily, number>;

    for (const post of blogPosts) {
      const family = getBlogHeroFamily(post);
      expect(family).toBeDefined();
      actualCounts[family!] += 1;
    }

    expect(actualCounts).toEqual(EXPECTED_FAMILY_COUNTS);
  });

  it('keeps critical semantic assignments explicit', () => {
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonological-awareness-vs-phonemic-awareness-vs-phonics']).toBe(
      'listening-for-sounds',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['satpin-phonics-guide']).toBe('sound-meets-letter');
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-blending-activities']).toBe('blending-into-a-word');
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-multisyllabic']).toBe('breaking-down-longer-words');
    expect(BLOG_HERO_FAMILY_BY_SLUG['how-phonics-improves-spelling']).toBe('from-speech-to-spelling');
    expect(BLOG_HERO_FAMILY_BY_SLUG['why-child-reads-words-but-does-not-understand-story']).toBe(
      'reading-for-meaning',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['how-to-improve-reading-fluency-in-children']).toBe(
      'fluent-independent-reading',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-diagnostics']).toBe('finding-the-reading-gap');
    expect(BLOG_HERO_FAMILY_BY_SLUG['online-english-classes-for-kids-india']).toBe(
      'learning-live-online',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-teacher-training-for-schools-implementation']).toBe(
      'teacher-training-in-action',
    );
    expect(BLOG_HERO_FAMILY_BY_SLUG['phonics-scope-and-sequence-for-cbse-schools']).toBe(
      'planning-a-school-reading-programme',
    );
  });

  it('normalizes legacy week source slugs to their public family', () => {
    expect(getBlogHeroFamily({
      slug: 'week-1-phonics-satpin-launch',
      hero: '/blog/hero-phonics.jpg',
    })).toBe('sound-meets-letter');
    expect(getBlogHeroFamily({
      slug: 'week-2-phonics-blending-club',
      hero: '/blog/hero-phonics.jpg',
    })).toBe('blending-into-a-word');
    expect(getBlogHeroFamily({
      slug: 'week-20-grammar-editing-camp',
      hero: '/blog/hero-grammar.jpg',
    })).toBe('editing-and-improving-writing');
  });

  it('activates all 21 reviewed WebPs and verifies every file exists', () => {
    expect(AVAILABLE_BLOG_HERO_FAMILY_ASSETS.size).toBe(21);

    for (const family of AVAILABLE_BLOG_HERO_FAMILY_ASSETS) {
      const publicPath = getBlogHeroFamilyAssetPath(family);
      const filePath = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
      expect(existsSync(filePath), family + ' asset must exist').toBe(true);
      expect(statSync(filePath).size, family + ' asset must not be empty').toBeGreaterThan(0);
    }
  });

  it('resolves family assets while preserving fallback behavior for future unreviewed posts', () => {
    const satpin = blogPosts.find((post) => post.slug === 'satpin-phonics-guide')!;
    const comprehension = blogPosts.find(
      (post) => post.slug === 'why-child-reads-words-but-does-not-understand-story',
    )!;

    expect(resolveBlogHero(satpin)).toBe('/blog/hero-families/sound-meets-letter.webp');
    expect(resolveBlogHero(comprehension)).toBe('/blog/hero-families/reading-for-meaning.webp');
    expect(resolveBlogHero({
      slug: 'future-unreviewed-post',
      hero: '/blog/existing-hero.webp',
    })).toBe('/blog/existing-hero.webp');
    expect(resolveBlogHero({
      slug: 'future-unreviewed-no-hero',
    })).toBeUndefined();
  });
});
