import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const AUTHORITATIVE_1_TO_20 = [
  'benefits-of-phonics-for-kids',
  'child-knows-abc-but-cannot-read',
  'cvc-words-explained-for-parents',
  'digraphs-and-tricky-words',
  'how-kids-learn-blending',
  'how-long-does-phonics-take',
  'how-phonics-builds-reading-confidence',
  'how-phonics-classes-help-kids-read',
  'how-phonics-improves-spelling',
  'how-to-choose-phonics-classes',
  'long-vowel-sounds-for-kids',
  'online-phonics-classes-vs-school',
  'online-phonics-games',
  'phonics-activities-for-kids-at-home',
  'phonics-blending-activities',
  'phonics-games-for-letter-sounds',
  'phonics-rules-for-beginners',
  'r-controlled-vowels-explained',
  'satpin-phonics-guide',
  'science-of-phonics-learning',
] as const;

describe('authoritative Blogs #1-#20 sitemap freshness', () => {
  it('keeps the real 2026-08-30 refresh date on all twenty articles', () => {
    const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

    for (const slug of AUTHORITATIVE_1_TO_20) {
      const post = bySlug.get(slug);
      expect(post, `${slug} should remain in the public blog registry`).toBeDefined();
      expect(post?.modifiedDate, `${slug} should expose the batch refresh date`).toBe('2026-08-30');
    }
  });

  it('makes sitemap generation prefer modifiedDate while retaining publication date for publish gating', () => {
    const repoRoot = process.cwd();
    const routeUtils = fs.readFileSync(path.join(repoRoot, 'scripts/blog-route-utils.mjs'), 'utf8');
    const generator = fs.readFileSync(path.join(repoRoot, 'scripts/generate-sitemaps.js'), 'utf8');

    expect(routeUtils).toContain('modifiedDateMatch');
    expect(routeUtils).toContain('modifiedDate: modifiedDateMatch ? modifiedDateMatch[1] : null');
    expect(generator).toContain('blogPostSlugLastmodMap');
    expect(generator).toContain('entry.modifiedDate || entry.date');
    expect(generator).toContain('const publicationDate = blogPostSlugDateMap.get(slug)');
    expect(generator).toContain('const mappedLastmod = blogPostSlugLastmodMap.get(slug)');
    expect(generator).toContain('const last = mappedLastmod');
  });
});
