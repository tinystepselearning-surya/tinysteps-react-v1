import { describe, expect, it } from 'vitest';
import {
  INDEXABLE_WEEKLY_BLOG_SLUGS,
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

  it('noindexes other weekly-series support pages and keeps them out of the sitemap', () => {
    for (const slug of ['week-4-phonics-long-vowels', 'week-5-phonics-r-controlled', 'week-8-grammar-tenses']) {
      expect(shouldNoindexBlogSlug(slug)).toBe(true);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(false);
    }
  });

  it('does not use noindex as a substitute for a permanent redirect', () => {
    const redirectedSlug = 'spoken-english-classes-for-kids-confidence';
    expect(shouldNoindexBlogSlug(redirectedSlug)).toBe(false);
  });

  it('leaves evergreen article owners indexable and sitemap eligible', () => {
    for (const slug of [
      'child-understands-english-but-does-not-speak',
      'long-vowel-sounds-for-kids',
      'r-controlled-vowels-explained',
      'how-phonics-builds-reading-confidence',
    ]) {
      expect(shouldNoindexBlogSlug(slug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
    }
  });
});
