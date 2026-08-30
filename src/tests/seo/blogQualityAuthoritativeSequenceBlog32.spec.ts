import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #32 quality lock', () => {
  it('owns phonics starting age and readiness without turning birthdays into placement rules', () => {
    const post = bySlug.get('what-age-to-start-phonics');
    expect(post).toBeDefined();
    expect(post?.title).toBe('What Is the Right Age to Start Phonics? A Parent Readiness Guide');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('age shapes the presentation; evidence shapes the starting point');
    expect(body).toContain('This article owns the readiness question');
    expect(body).toContain('The Tiny Steps five-part readiness lens');
    expect(body).toContain('1. Listen');
    expect(body).toContain('2. Notice');
    expect(body).toContain('3. Link');
    expect(body).toContain('4. Blend');
    expect(body).toContain('5. Participate');
    expect(body).toContain('Age bands are examples, not phonics milestones');
    expect(body).toContain('There is no required five-minute score, percentage or cut-off.');
    expect(body).toContain('No universal long oral-only stage is required.');
    expect(body).toContain('accuracy → independence → transfer → retention');

    expect(body).toContain('/blog/what-is-phonics-for-kids');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/phonics-diagnostics');

    expect(body).not.toMatch(/best age is (?:3|4|5)/i);
    expect(body).not.toMatch(/must start (?:at|by) age/i);
    expect(body).not.toContain('A five-minute parent readiness check');
  });

  it('locks evidence, FAQs, professional boundary and evergreen indexing', () => {
    const post = bySlug.get('what-age-to-start-phonics');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('The Tiny Steps readiness lens and age-band examples are editorial guidance.');
    expect(body).toContain('A home readiness check can guide teaching; it cannot diagnose a condition.');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /best age to start phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /3-year-old/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonological awareness before learning letters/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /6 or 7 too late/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /which phonics level/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how fast/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('what-age-to-start-phonics')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('what-age-to-start-phonics')).toBe(true);
  });
});
