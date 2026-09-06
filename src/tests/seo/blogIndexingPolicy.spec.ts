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
      ['phonics-blending-club', 'week-2-phonics-blending-club'],
      ['phonics-comprehension', 'week-6-phonics-comprehension'],
      ['phonics-diagnostics', 'week-22-phonics-diagnostics'],
      ['phonics-long-vowels', 'week-4-phonics-long-vowels'],
      ['phonics-multisyllabic', 'week-19-phonics-multisyllabic'],
      ['phonics-r-controlled', 'week-5-phonics-r-controlled'],
      ['phonics-summer-plan', 'week-16-phonics-summer-plan'],
      ['phonics-tricky-words', 'week-3-phonics-tricky-words'],
      ['back-to-school-english-confidence-plan', 'week-25-back-to-school-plan'],
      ['screen-smart-summer-routine-for-kids', 'week-26-screen-smart-summer-routine'],
      ['grammar-tenses', 'week-8-grammar-tenses'],
      ['grammar-conjunctions', 'week-9-grammar-conjunctions'],
      ['grammar-subject-verb', 'week-10-grammar-subject-verb'],
      ['grammar-creative-writing', 'week-11-grammar-creative-writing'],
      ['grammar-assessment', 'week-17-grammar-assessment'],
      ['grammar-editing-camp', 'week-20-grammar-editing-camp'],
      ['grammar-speaking-bridge', 'week-23-grammar-speaking-bridge'],
      ['speaking-structure', 'week-13-speaking-structure'],
      ['speaking-visual-aids', 'week-14-speaking-visual-aids'],
      ['speaking-debate-starters', 'week-15-speaking-debate-starters'],
      ['speaking-video-feedback', 'week-18-speaking-video-feedback'],
      ['speaking-competition-prep', 'week-21-speaking-competition-prep'],
      ['speaking-family-showcase', 'week-24-speaking-family-showcase'],
    ]) {
      expect(shouldNoindexBlogSlug(cleanSlug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(cleanSlug)).toBe(true);

      // Historical source stays a redirect-era identifier rather than an indexable page.
      expect(shouldNoindexBlogSlug(legacySlug)).toBe(true);
      expect(shouldIncludeBlogSlugInSitemap(legacySlug)).toBe(false);
    }
  });

  it('continues to recognize old weekly source slugs during redirect migration', () => {
    for (const slug of ['week-4-phonics-long-vowels', 'week-5-phonics-r-controlled', 'week-6-phonics-comprehension', 'week-8-grammar-tenses']) {
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
