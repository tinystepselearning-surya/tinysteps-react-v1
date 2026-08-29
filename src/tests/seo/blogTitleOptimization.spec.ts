import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { BLOG_TITLE_OPTIMIZATIONS } from '../../lib/blogTitleOptimization.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const repoRoot = process.cwd();

describe('optimized public blog titles', () => {
  it('locks the 35 approved title changes across the public registry', () => {
    expect(Object.keys(BLOG_TITLE_OPTIMIZATIONS)).toHaveLength(35);
    expect(blogPosts).toHaveLength(76);

    for (const [slug, expectedTitle] of Object.entries(BLOG_TITLE_OPTIMIZATIONS)) {
      expect(bySlug.has(slug), `${slug} must exist in the public blog registry`).toBe(true);
      expect(bySlug.get(slug)?.title).toBe(expectedTitle);
      expect(expectedTitle.trim()).toBe(expectedTitle);
      expect(expectedTitle).not.toMatch(/\bWeek\s+\d+\b/i);
    }
  });

  it('preserves the existing parent/research intent owner for phonics vs sight words', () => {
    expect(bySlug.get('science-of-phonics-learning')?.title).toBe(
      'Phonics vs Sight Words: What Helps Children Read Better',
    );
  });

  it('keeps the English Communication owner unchanged', () => {
    expect(bySlug.get('how-phonics-grammar-and-communication-work-together')?.title).toBe(
      'How Phonics, Grammar and Communication Work Together in a Child’s English Learning',
    );
  });

  it('uses the same optimized-title source for generated RSS feeds', () => {
    const rssGenerator = fs.readFileSync(path.join(repoRoot, 'scripts/generate-rss.mjs'), 'utf8');
    expect(rssGenerator).toContain("import { getOptimizedBlogTitle } from '../src/lib/blogTitleOptimization.js';");
    expect(rssGenerator).toContain('const title = getOptimizedBlogTitle(slug, publicTitle);');
  });
});
