import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #6 quality lock', () => {
  it('owns realistic phonics duration without promising a universal calendar', () => {
    const post = bySlug.get('how-long-does-phonics-take');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Long Does Phonics Take? A Realistic Parent Guide to Progress');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('there is no honest universal number of weeks for phonics');
    expect(body).toContain('The three phonics timelines parents should separate');
    expect(body).toContain('How long does the current phonics target take?');
    expect(body).toContain('How long does the wider phonics progression take?');
    expect(body).toContain('How long until reading becomes fluent?');
    expect(body).toContain('The Tiny Steps progress-to-time compass');
    expect(body).toContain('A stage-based roadmap is more useful than a week-by-week promise');
    expect(body).toContain('A parent progress dashboard that is better than counting weeks');
    expect(body).toContain('What a good phonics provider should be able to explain about duration');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/blog/phonics-diagnostics');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/finish phonics in (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten) weeks/i);
    expect(body).not.toMatch(/read fluently in (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten) weeks/i);
    expect(body).not.toContain('after 6-8 weeks');
    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
  });

  it('adds evidence, timeline boundaries and extractable duration FAQs', () => {
    const post = bySlug.get('how-long-does-phonics-take');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('editorial guidance, not a standardized timing instrument');
    expect(body).toContain('cannot diagnose dyslexia');
    expect(body).toContain('this article does not prescribe a research-defined weekly or monthly testing schedule');
    expect(body).toContain('“finished the phonics lessons” and “reads fluently” should not be treated as identical milestones');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /how long does it usually take/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /finish phonics in one or two months/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /best sign that phonics is progressing/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /letter sounds quickly but reading words slowly/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /taking too long/i.test(item.question))).toBe(true);
  });
});
