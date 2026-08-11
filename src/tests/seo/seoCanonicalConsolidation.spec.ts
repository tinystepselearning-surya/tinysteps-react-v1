import path from 'path';
import { pathToFileURL } from 'url';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const repoRoot = path.resolve(__dirname, '../../..');

const EXPECTED_REDIRECTS: Record<string, string> = {
  'child-reads-words-but-does-not-understand-story':
    'why-child-reads-words-but-does-not-understand-story',
  'how-long-does-phonics-take':
    'how-long-does-it-take-child-to-learn-phonics',
  'june-school-readiness-english-revision-plan':
    'june-school-reopening-english-readiness-plan',
  'why-child-answers-only-in-one-word':
    'child-gives-one-word-answers',
};

const CBSE_AUTHORITY_SLUGS = [
  'cbse-phonics-curriculum-vs-systematic-phonics-programme',
  'does-cbse-include-phonics-ncf-foundational-literacy',
  'how-schools-can-assess-decoding-not-memorisation',
  'international-phonics-benchmarks-for-indian-schools',
  'phonics-scope-and-sequence-for-cbse-schools',
  'phonics-teacher-training-for-schools-implementation',
  'systematic-cumulative-phonics-explained-for-schools',
  'why-letter-sounds-are-not-enough-to-read',
];

describe('SEO canonical consolidation', () => {
  it('keeps the canonical redirect policy deliberately small and explicit', async () => {
    const policyPath = path.join(repoRoot, 'src/lib/blogIndexingPolicy.js');
    const policy = await import(pathToFileURL(policyPath).href);

    expect(policy.BLOG_CANONICAL_REDIRECTS).toEqual(EXPECTED_REDIRECTS);

    for (const [source, target] of Object.entries(EXPECTED_REDIRECTS)) {
      expect(policy.getBlogCanonicalRedirect(source)).toBe(target);
      expect(policy.isRedirectedBlogSlug(source)).toBe(true);
      expect(policy.shouldIncludeBlogSlugInSitemap(source)).toBe(false);
      expect(policy.shouldNoindexBlogSlug(source)).toBe(false);

      expect(policy.isRedirectedBlogSlug(target)).toBe(false);
      expect(policy.shouldIncludeBlogSlugInSitemap(target)).toBe(true);
    }
  });

  it('removes redirect sources from the public blog collection while preserving canonical targets', () => {
    const slugs = new Set(blogPosts.map((post) => post.slug));

    for (const [source, target] of Object.entries(EXPECTED_REDIRECTS)) {
      expect(slugs.has(source)).toBe(false);
      expect(slugs.has(target)).toBe(true);
    }
  });

  it('excludes redirect sources from source-backed sitemap/prerender discovery', async () => {
    const utilsPath = path.join(repoRoot, 'scripts/blog-route-utils.mjs');
    // @ts-expect-error Node SEO tooling is intentionally authored as an ESM .mjs module.
    const { extractBlogEntriesFromPostFiles } = await import(pathToFileURL(utilsPath).href);
    const entries = extractBlogEntriesFromPostFiles(path.join(repoRoot, 'src/content/blog/posts'));
    const slugs = new Set(entries.map((entry: { slug: string }) => entry.slug));

    for (const [source, target] of Object.entries(EXPECTED_REDIRECTS)) {
      expect(slugs.has(source)).toBe(false);
      expect(slugs.has(target)).toBe(true);
    }
  });

  it('protects the new CBSE/school authority cluster from accidental consolidation', async () => {
    const policyPath = path.join(repoRoot, 'src/lib/blogIndexingPolicy.js');
    const policy = await import(pathToFileURL(policyPath).href);
    const publicSlugs = new Set(blogPosts.map((post) => post.slug));

    for (const slug of CBSE_AUTHORITY_SLUGS) {
      expect(policy.getBlogCanonicalRedirect(slug)).toBeNull();
      expect(policy.shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
      expect(publicSlugs.has(slug)).toBe(true);
    }
  });
});
