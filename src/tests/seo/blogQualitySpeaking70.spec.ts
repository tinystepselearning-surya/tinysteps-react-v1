import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #70 speaking confidence quality', () => {
  it('keeps the clean speaking-confidence owner broad, practical and non-diagnostic', () => {
    const post = bySlug.get('speaking-confidence-seeds');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Build Speaking Confidence in Kids: A 7-Day Calm Practice Plan');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.readTime).toBe('15 min read');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('SAFE → START → EXPAND → CONNECT → VOICE → AUDIENCE → TRANSFER');
    expect(body).toContain('it is not a promise that a child will become confident in one week');
    expect(body).toContain('Speaking confidence is not the same as being naturally talkative');
    expect(body).toContain('A calm 7-day speaking confidence plan');
    expect(body).toContain('Day 1 — Comfortable baseline: one complete answer');
    expect(body).toContain('Day 7 — Fresh topic, less support');
    expect(body).toContain('Use the smallest prompt that helps the child start');
    expect(body).toContain('Correct less during the speaking attempt');
    expect(body).toContain('For multilingual children: confidence and English proficiency are not the same question');
    expect(body).toContain('When silence or distress needs more than a speaking-confidence routine');
    expect(body).toContain('How to measure transfer after the seven-day starter plan');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/grammar-speaking-bridge');
    expect(body).toContain('/blog/speaking-structure');
    expect(body).toContain('/blog/speaking-video-feedback');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('/blog/spoken-english-classes-for-kids-confidence');
    expect(body).not.toMatch(/\bWeek\s*12\b/i);
    expect(body).not.toContain('Week 13');
    expect(body).not.toContain('become confident in 7 days');
  });

  it('ships specific FAQs, evidence and preserves the historical clean indexable owner', () => {
    const post = bySlug.get('speaking-confidence-seeds');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);

    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /build speaking confidence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /seven days/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /does not speak in class/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correct grammar/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /one-word answers/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /eye contact/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /more than one language/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /professional/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('speaking-confidence-seeds')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('speaking-confidence-seeds')).toBe(true);
    expect(shouldNoindexBlogSlug('week-12-speaking-confidence-seeds')).toBe(false);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-12-speaking-confidence-seeds']).toBe(
      '/blog/speaking-confidence-seeds',
    );
    expect(bySlug.has('week-12-speaking-confidence-seeds')).toBe(false);
  });
});
