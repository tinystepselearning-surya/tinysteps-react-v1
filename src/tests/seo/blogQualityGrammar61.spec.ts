import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #61 evergreen grammar roadmap quality', () => {
  it('owns broad grammar progression without legacy Week framing', () => {
    const post = bySlug.get('grammar-nouns-to-paragraphs');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Grammar Basics for Kids: From Nouns to Paragraphs — A Parent Roadmap');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('WORDS → SENTENCE → EXPAND → CONNECT → PARAGRAPH');
    expect(body).toContain('Speaking → grammar → writing');
    expect(body).toContain('How to tell whether grammar is actually improving');
    expect(body).toContain('Evidence and sources reviewed');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/grammar-tenses');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/grammar-subject-verb');
    expect(body).toContain('/blog/grammar-speaking-bridge');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*7\b/i);
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
    expect(body).not.toContain('Done checklist + Week 8 tenses teaser');
  });

  it('ships article-specific FAQs, cited evidence and clean indexability', () => {
    const post = bySlug.get('grammar-nouns-to-paragraphs');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(8);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /basic grammar skills/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /without worksheets/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sentences to paragraphs/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-nouns-to-paragraphs')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-nouns-to-paragraphs')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-7-grammar-nouns-to-paragraphs']).toBe(
      '/blog/grammar-nouns-to-paragraphs',
    );
  });
});
