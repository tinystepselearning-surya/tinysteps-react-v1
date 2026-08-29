import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('progressive blog quality refresh', () => {
  it('keeps Blog #1 as the practical SATPIN-at-home implementation owner', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();
    expect(post?.title).toBe('SATPIN at Home: A Parent Launch Plan for Early Blending and Reading');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids?level=1');
    expect(body).toContain('/letter-tracing-with-sounds-game');
    expect(body).toContain('seven flexible practice sessions');
    expect(body).toContain('Tiny Steps readiness checkpoints');

    expect(body).not.toMatch(/\bWeek\s+[12]\b/i);
    expect(body).not.toContain('Tin can');
    expect(body).not.toContain('Tan pan');
    expect(body).not.toContain('Nap in pan');
    expect(body).not.toMatch(/research-backed/i);
  });

  it('gives Blog #1 a real evidence layer and answer-engine FAQ', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /How long should SATPIN take/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /cannot read words/i.test(item.question))).toBe(true);
  });
});
