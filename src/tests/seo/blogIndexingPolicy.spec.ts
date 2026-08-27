import { describe, expect, it } from 'vitest';
import {
  INDEXABLE_WEEKLY_BLOG_SLUGS,
  NOINDEX_BLOG_SLUGS,
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

describe('blog indexing policy', () => {
  it('keeps the three reviewed weekly authority pages indexable', () => {
    for (const slug of INDEXABLE_WEEKLY_BLOG_SLUGS) {
      expect(shouldNoindexBlogSlug(slug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
    }
  });

  it('noindexes other weekly-series pages and keeps them out of the sitemap', () => {
    expect(shouldNoindexBlogSlug('week-8-grammar-tenses')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-8-grammar-tenses')).toBe(false);
  });

  it('uses one policy for nonweekly overlap pages rather than sitemap-only exclusion', () => {
    const slug = 'spoken-english-classes-for-kids-confidence';
    expect(NOINDEX_BLOG_SLUGS.has(slug)).toBe(true);
    expect(shouldNoindexBlogSlug(slug)).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(false);
  });

  it('leaves ordinary evergreen articles indexable and sitemap eligible', () => {
    const slug = 'child-understands-english-but-does-not-speak';
    expect(shouldNoindexBlogSlug(slug)).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
  });
});
