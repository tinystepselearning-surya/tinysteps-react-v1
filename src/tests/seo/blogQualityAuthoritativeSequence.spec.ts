import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative 76-blog quality sequence', () => {
  it('locks Blog #1 as the realistic parent guide to observable phonics benefits', () => {
    const post = bySlug.get('benefits-of-phonics-for-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Benefits of Phonics for Kids: What Parents Usually Notice First');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('What parents often notice first: five practical changes');
    expect(body).toContain('The Tiny Steps five-signal benefit check');
    expect(body).toContain('What phonics does not automatically fix');
    expect(body).toContain('How to check whether the benefit is real rather than memorised');
    expect(body).toContain('When progress looks uneven');
    expect(body).toContain('When to ask for more support');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-phonics-builds-reading-confidence');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/phonics-diagnostics');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('weeks 1-3 fewer random guesses');
    expect(body).not.toContain('weeks 3-6 stronger blending');
    expect(body).not.toContain('weeks 6-10 better spelling transfer');
    expect(body).not.toContain('after 8-10 weeks');
    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toMatch(/phonics support speaking confidence too\?/i);
  });

  it('gives authoritative Blog #1 genuine evidence and answer-engine FAQs', () => {
    const post = bySlug.get('benefits-of-phonics-for-kids');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /first benefit of phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /improve spelling/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /comprehension/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /confident/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decoding or memorising/i.test(item.question))).toBe(true);
  });
});
