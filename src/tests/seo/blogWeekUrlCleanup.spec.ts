import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  LEGACY_WEEK_BLOG_PATH_REDIRECTS,
  LEGACY_WEEK_BLOG_RENAMES,
  LEGACY_WEEK_PUBLIC_SLUGS,
  LEGACY_WEEK_SOURCE_SLUGS,
} from '../../lib/blogWeekRenames.js';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const indexableRenamedSlugs = new Set([
  'phonics-satpin-launch',
  'grammar-nouns-to-paragraphs',
  'speaking-confidence-seeds',
  'prevent-summer-slide-reading',
]);

describe('weekly blog title and URL cleanup', () => {
  it('keeps the same 76 articles while exposing unique, week-free public slugs', () => {
    expect(blogPosts).toHaveLength(76);
    expect(new Set(blogPosts.map((post) => post.slug)).size).toBe(76);
    expect(LEGACY_WEEK_SOURCE_SLUGS).toHaveLength(27);
    expect(LEGACY_WEEK_PUBLIC_SLUGS).toHaveLength(27);
    expect(new Set(LEGACY_WEEK_PUBLIC_SLUGS).size).toBe(27);

    for (const sourceSlug of LEGACY_WEEK_SOURCE_SLUGS) {
      expect(bySlug.has(sourceSlug), `${sourceSlug} must no longer be a public blog slug`).toBe(false);
    }
    for (const publicSlug of LEGACY_WEEK_PUBLIC_SLUGS) {
      expect(publicSlug).not.toMatch(/^week-\d+/i);
      expect(bySlug.has(publicSlug), `${publicSlug} must exist in the public registry`).toBe(true);
    }
  });

  it('removes editorial Week N labels from every renamed public title', () => {
    for (const [sourceSlug, rename] of Object.entries(LEGACY_WEEK_BLOG_RENAMES)) {
      expect(rename.title, sourceSlug).not.toMatch(/\bWeek\s+\d+\b/i);
      expect(bySlug.get(rename.slug)?.title).toBe(rename.title);
    }
  });

  it('preserves historical authority pages and quality-promotes audited clean URLs', () => {
    for (const publicSlug of LEGACY_WEEK_PUBLIC_SLUGS) {
      const shouldBeIndexable = indexableRenamedSlugs.has(publicSlug);
      expect(shouldNoindexBlogSlug(publicSlug), publicSlug).toBe(!shouldBeIndexable);
      expect(shouldIncludeBlogSlugInSitemap(publicSlug), publicSlug).toBe(shouldBeIndexable);
    }
  });

  it('defines a one-hop permanent server redirect for every old weekly URL', () => {
    const notFoundRoute = readRepoFile('functions/src/notFoundRoute.ts');
    expect(Object.keys(LEGACY_WEEK_BLOG_PATH_REDIRECTS)).toHaveLength(27);

    for (const [sourcePath, destinationPath] of Object.entries(LEGACY_WEEK_BLOG_PATH_REDIRECTS)) {
      expect(sourcePath).toMatch(/^\/blog\/week-\d+/i);
      expect(destinationPath).not.toMatch(/^\/blog\/week-\d+/i);
      expect(notFoundRoute).toContain(`\"${sourcePath}\": \"${destinationPath}\"`);
    }
  });

  it('keeps canonical B9 authority ownership on the cleaned URLs', () => {
    const authority = readRepoFile('src/content/blog/shared/technicalAuthority.ts');
    const llms = readRepoFile('public/llms.txt');

    expect(authority).toContain("'grammar-nouns-to-paragraphs': {");
    expect(authority).toContain("'speaking-confidence-seeds': {");
    expect(authority).not.toContain("'week-7-grammar-nouns-to-paragraphs': {");
    expect(authority).not.toContain("'week-12-speaking-confidence-seeds': {");

    expect(llms).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(llms).toContain('/blog/speaking-confidence-seeds');
    expect(llms).not.toContain('/blog/week-7-grammar-nouns-to-paragraphs');
    expect(llms).not.toContain('/blog/week-12-speaking-confidence-seeds');
  });
});
