import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const BATCH_3 = [
  'phonics-tricky-words',
  'grammar-editing-camp',
  'cvc-words-explained-for-parents',
  'phonics-blending-club',
  'how-children-recognise-words-automatically-after-phonics',
] as const;

const EXPECTED_CATEGORIES = new Map([
  ['phonics-tricky-words', 'Phonics'],
  ['grammar-editing-camp', 'Grammar'],
  ['cvc-words-explained-for-parents', 'Phonics'],
  ['phonics-blending-club', 'Phonics'],
  ['how-children-recognise-words-automatically-after-phonics', 'Research'],
]);

describe('authority blog template batch 3', () => {
  it('curates exactly five GSC-backed articles without changing the global 83-blog rollout', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(blogPosts).toHaveLength(83);
    expect(BATCH_3).toHaveLength(5);
    expect(new Set(BATCH_3).size).toBe(5);
    expect(page).toContain('AUTHORITY_BLOG_BATCH_3_SLUGS');
    expect(page).toContain('AUTHORITY_BATCH_3_HERO_POINTS');
    expect(page).toContain('AUTHORITY_BATCH_3_TOC_PREFIXES');
    expect(page).toContain('const isAuthorityBatch3 = Boolean(slug && AUTHORITY_BLOG_BATCH_3_SLUGS.has(slug))');

    for (const slug of BATCH_3) {
      const post = blogPosts.find((candidate) => candidate.slug === slug);
      expect(post, slug).toBeTruthy();
      expect(post?.category, slug).toBe(EXPECTED_CATEGORIES.get(slug));
      expect(page).toContain("'" + slug + "'");
    }
  });

  it('preserves the pilot and Batch 2 override layers while adding Batch 3 separately', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    for (const slug of [
      'what-is-phonics-for-kids',
      'how-to-teach-paragraph-writing-to-kids',
      'how-to-teach-storytelling-to-kids',
      'child-understands-english-but-does-not-speak',
      'phonics-for-parents-guide',
      'grammar-tenses',
      'grammar-conjunctions',
      'long-vowel-sounds-for-kids',
      'why-child-knows-letter-sounds-but-cannot-read-words',
      'child-gives-one-word-answers',
    ]) {
      expect(page).toContain("'" + slug + "'");
    }

    expect(page).toContain('isAuthorityPilot && pilotHeroPoints');
    expect(page).toContain('isAuthorityBatch2 && batch2HeroPoints');
    expect(page).toContain('isAuthorityBatch3 && batch3HeroPoints');
    expect(page).toContain('AUTHORITY_PILOT_TOC_PREFIXES[slug]');
    expect(page).toContain('AUTHORITY_BATCH_2_TOC_PREFIXES[slug]');
    expect(page).toContain('AUTHORITY_BATCH_3_TOC_PREFIXES[slug]');
  });

  it('uses three article-specific hero points and eight curated H2 prefixes for every Batch 3 article', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    const heroSection = page.slice(
      page.indexOf('const AUTHORITY_BATCH_3_HERO_POINTS'),
      page.indexOf('const AUTHORITY_PILOT_TOC_PREFIXES'),
    );
    const tocSection = page.slice(
      page.indexOf('const AUTHORITY_BATCH_3_TOC_PREFIXES'),
      page.indexOf('const SCHOOL_RESEARCH_HERO_POINTS'),
    );

    for (const slug of BATCH_3) {
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

  it('keeps Batch 3 away from the active CTR experiment registry', () => {
    const ctrConfig = read('src/config/seoRecoveryBrick10CtrExperiments.ts');
    for (const slug of BATCH_3) {
      expect(ctrConfig).not.toContain("slug: '" + slug + "'");
    }
  });

  it('keeps the Batch 3 selection on existing canonical blog articles', () => {
    const paths = new Set(blogPosts.map((post) => '/blog/' + post.slug));
    for (const slug of BATCH_3) {
      expect(paths.has('/blog/' + slug), slug).toBe(true);
    }
  });
});
