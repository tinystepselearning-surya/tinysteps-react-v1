import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('progressive blog quality refresh', () => {
  it('keeps Blog #1 as the practical SATPIN-at-home implementation owner', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();
    expect(post?.title).toBe('SATPIN at Home: A Parent Launch Plan for Early Blending and Reading');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids?level=1');
    expect(body).toContain('/letter-tracing-with-sounds-game');
    expect(body).toContain('seven flexible practice sessions');
    expect(body).toContain('Tiny Steps readiness checkpoints');
    expect(body).toContain('Who this SATPIN plan is for');
    expect(body).toContain('not a diagnostic test');
    expect(body).toContain('When home practice is not enough');

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

  it('makes Blog #2 a stage-matched summer reading maintenance owner', () => {
    const post = bySlug.get('prevent-summer-slide-reading');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Stage A — pre-reader or very early phonics learner');
    expect(body).toContain('Stage B — developing decoder');
    expect(body).toContain('Stage C — increasingly fluent reader');
    expect(body).toContain('Tiny Steps three-signal summer check');
    expect(body).toContain('When home practice is not enough');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/parents/reading-at-home');
    expect(body).toContain('/summer-camps');

    expect(body).not.toContain('Summer slide in reading is preventable');
    expect(body).not.toContain('usually enough to maintain or improve');
    expect(body).not.toContain('Tiny Steps CTA:');
  });

  it('gives Blog #2 evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('prevent-summer-slide-reading');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(3);
    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /guaranteed/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /10 minutes/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics practice/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('prevent-summer-slide-reading')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('prevent-summer-slide-reading')).toBe(true);
    expect(shouldNoindexBlogSlug('week-27-prevent-summer-slide-reading')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-27-prevent-summer-slide-reading')).toBe(false);
  });
});
