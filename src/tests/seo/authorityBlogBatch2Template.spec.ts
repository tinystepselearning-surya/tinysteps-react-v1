import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const BATCH_2 = [
  'grammar-tenses',
  'grammar-conjunctions',
  'long-vowel-sounds-for-kids',
  'why-child-knows-letter-sounds-but-cannot-read-words',
  'child-gives-one-word-answers',
] as const;

const EXPECTED_CATEGORIES = new Map([
  ['grammar-tenses', 'Grammar'],
  ['grammar-conjunctions', 'Grammar'],
  ['long-vowel-sounds-for-kids', 'Phonics'],
  ['why-child-knows-letter-sounds-but-cannot-read-words', 'Parent Tips'],
  ['child-gives-one-word-answers', 'Parent Tips'],
]);

describe('authority blog template batch 2', () => {
  it('curates exactly five GSC-backed articles without changing the global 83-blog rollout', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(blogPosts).toHaveLength(83);
    expect(BATCH_2).toHaveLength(5);
    expect(new Set(BATCH_2).size).toBe(5);
    expect(page).toContain('AUTHORITY_BLOG_BATCH_2_SLUGS');
    expect(page).toContain('AUTHORITY_BATCH_2_HERO_POINTS');
    expect(page).toContain('AUTHORITY_BATCH_2_TOC_PREFIXES');
    expect(page).toContain('const isAuthorityBatch2 = Boolean(slug && AUTHORITY_BLOG_BATCH_2_SLUGS.has(slug))');

    for (const slug of BATCH_2) {
      const post = blogPosts.find((candidate) => candidate.slug === slug);
      expect(post, slug).toBeTruthy();
      expect(post?.category, slug).toBe(EXPECTED_CATEGORIES.get(slug));
      expect(page).toContain("'" + slug + "'");
    }
  });

  it('keeps the original five pilot overrides intact and gives Batch 2 a separate override layer', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    for (const pilot of [
      'what-is-phonics-for-kids',
      'how-to-teach-paragraph-writing-to-kids',
      'how-to-teach-storytelling-to-kids',
      'child-understands-english-but-does-not-speak',
      'phonics-for-parents-guide',
    ]) {
      expect(page).toContain("'" + pilot + "'");
    }

    expect(page).toContain('isAuthorityPilot && pilotHeroPoints');
    expect(page).toContain('isAuthorityBatch2 && batch2HeroPoints');
    expect(page).toContain('AUTHORITY_PILOT_TOC_PREFIXES[slug]');
    expect(page).toContain('AUTHORITY_BATCH_2_TOC_PREFIXES[slug]');
  });

  it('uses three article-specific hero points and eight curated H2 prefixes for every Batch 2 article', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    const heroSection = page.slice(
      page.indexOf('const AUTHORITY_BATCH_2_HERO_POINTS'),
      page.indexOf('const AUTHORITY_PILOT_TOC_PREFIXES'),
    );
    const tocSection = page.slice(
      page.indexOf('const AUTHORITY_BATCH_2_TOC_PREFIXES'),
      page.indexOf('const SCHOOL_RESEARCH_HERO_POINTS'),
    );

    for (const slug of BATCH_2) {
      const heroStart = heroSection.indexOf("'" + slug + "': [");
      const nextHero = heroSection.indexOf("  ],", heroStart);
      const heroBlock = heroSection.slice(heroStart, nextHero);
      expect(heroStart, slug).toBeGreaterThan(-1);
      expect((heroBlock.match(/label:/g) || []).length, slug).toBe(3);

      const tocStart = tocSection.indexOf("'" + slug + "': [");
      const nextToc = tocSection.indexOf("  ],", tocStart);
      const tocBlock = tocSection.slice(tocStart, nextToc);
      expect(tocStart, slug).toBeGreaterThan(-1);
      expect((tocBlock.match(/^    '/gm) || []).length, slug).toBe(8);
    }
  });

  it('keeps the Batch 2 selection focused on existing search-visible canonical articles', () => {
    const paths = new Set(blogPosts.map((post) => '/blog/' + post.slug));
    for (const slug of BATCH_2) {
      expect(paths.has('/blog/' + slug), slug).toBe(true);
    }
  });
});
