import { describe, expect, it } from 'vitest';
import {
  INDEXABLE_WEEKLY_BLOG_SLUGS,
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

describe('blog indexing policy', () => {
  it('keeps the three reviewed roadmap authority pages indexable under old and cleaned slugs', () => {
    for (const slug of INDEXABLE_WEEKLY_BLOG_SLUGS) {
      expect(shouldNoindexBlogSlug(slug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
    }

    for (const slug of [
      'phonics-satpin-launch',
      'grammar-nouns-to-paragraphs',
      'speaking-confidence-seeds',
    ]) {
      expect(shouldNoindexBlogSlug(slug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
    }
  });

  it('promotes quality-audited roadmap articles only on their cleaned public URLs', () => {
    for (const [cleanSlug, legacySlug] of [
      ['prevent-summer-slide-reading', 'week-27-prevent-summer-slide-reading'],
      ['phonics-diagnostics', 'week-22-phonics-diagnostics'],
    ]) {
      expect(shouldNoindexBlogSlug(cleanSlug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(cleanSlug)).toBe(true);

      // Historical source stays a redirect-era identifier rather than an indexable page.
      expect(shouldNoindexBlogSlug(legacySlug)).toBe(true);
      expect(shouldIncludeBlogSlugInSitemap(legacySlug)).toBe(false);
    }
  });

  it('keeps remaining renamed roadmap support pages noindex and out of the sitemap', () => {
    for (const slug of [
      'phonics-long-vowels',
      'phonics-r-controlled',
      'grammar-tenses',
      'speaking-visual-aids',
      'screen-smart-summer-routine-for-kids',
    ]) {
      expect(shouldNoindexBlogSlug(slug)).toBe(true);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(false);
    }
  });

  it('continues to recognize old weekly source slugs during redirect migration', () => {
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
