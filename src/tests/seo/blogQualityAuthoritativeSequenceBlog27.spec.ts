import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #27 quality lock', () => {
  it('owns broad summer reading maintenance without turning ten minutes into a guaranteed dose', () => {
    const post = bySlug.get('prevent-summer-slide-reading');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Summer slide is not a diagnosis or an individual forecast.');
    expect(body).toContain('Summer reading plan vs summer phonics plan: choose the right owner');
    expect(body).toContain('/blog/phonics-summer-plan');
    expect(body).toContain('Choose the right 10-minute routine by reading stage');
    expect(body).toContain('Stage A — pre-reader or very early phonics learner');
    expect(body).toContain('Stage B — developing decoder who can read short words and sentences');
    expect(body).toContain('Stage C — increasingly fluent reader');
    expect(body).toContain('The Tiny Steps summer loop: Decode → Reread → Understand → Talk');
    expect(body).toContain('This is a Tiny Steps editorial teaching framework, not a standardized assessment protocol.');
    expect(body).toContain('A flexible weekly menu that still feels like a holiday');
    expect(body).toContain('Do not treat this as a Monday-to-Friday curriculum or a five-day mastery sequence.');
    expect(body).toContain('The clock protects a manageable routine; it does not define mastery.');

    expect(body).not.toMatch(/\bDay\s+[1-5]\s+—/i);
    expect(body).not.toMatch(/\b2 minutes\s+—|\b3 minutes\s+—|\b4 minutes\s+—|\b5 minutes\s+—/i);
    expect(body).not.toMatch(/10 minutes (?:will|can) prevent/i);
    expect(body).not.toMatch(/guarantee(?:d|s)? (?:that )?(?:summer|reading)/i);
  });

  it('locks evidence, transfer, FAQs, intent boundaries and clean-URL authority status', () => {
    const post = bySlug.get('prevent-summer-slide-reading');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('Accuracy and independence');
    expect(body).toContain('Meaning —');
    expect(body).toContain('Transfer —');
    expect(body).toContain('None of these sources proves that one universal 10-minute schedule');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/parents/reading-at-home');
    expect(body).toContain('/phonics');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /summer slide in reading guaranteed/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /10 minutes of reading a day enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /every child do phonics practice/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between a summer reading plan and a summer phonics plan/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /refuses to read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /routine is helping/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('prevent-summer-slide-reading')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('prevent-summer-slide-reading')).toBe(true);
    expect(shouldNoindexBlogSlug('week-27-prevent-summer-slide-reading')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-27-prevent-summer-slide-reading')).toBe(false);
  });
});
