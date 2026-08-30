import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #51 reads-words-but-does-not-understand comprehension quality refresh', () => {
  it('keeps Blog #51 focused on meaning after reasonably accurate word reading rather than decoding or fluency ownership', () => {
    const post = bySlug.get('why-child-reads-words-but-does-not-understand-story');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Why Does My Child Read Words But Not Understand Stories?');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Accurate word reading → Sentence meaning → Text connections → Inference and monitoring → Retell / transfer');
    expect(body).toContain('Stage 1 — Accurate word reading');
    expect(body).toContain('Stage 2 — Sentence meaning');
    expect(body).toContain('Stage 3 — Text connections');
    expect(body).toContain('Stage 4 — Inference and monitoring');
    expect(body).toContain('Stage 5 — Retell / transfer');
    expect(body).toContain('Seven reasons a child may read the words but miss the story');
    expect(body).toContain('A powerful parent comparison: reading the text versus listening to it');
    expect(body).toContain('Do not reduce comprehension practice to a worksheet of questions');
    expect(body).toContain('preview → read → explain → connect → prove → retell');
    expect(body).toContain('Story comprehension and informational-text comprehension need some different supports');
    expect(body).toContain('For multilingual children, separate English knowledge from comprehension potential');
    expect(body).toContain('What progress should look like');
    expect(body).toContain('There is no universal evidence-based 20-minute comprehension routine');
    expect(body).toContain('There is no single referral timeline');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/child-reads-in-class-but-forgets-at-home');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/phonics');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/parents/reading-at-home');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('20-minute home routine');
    expect(body).not.toContain('6-8 weeks of consistent practice');
    expect(body).not.toContain('This pattern is common and solvable');
    expect(body).not.toContain('/best-online-phonics-classes-for-kids-in-india');
    expect(body).not.toMatch(/(?:must|should|needs? to|has to)\s+(?:answer|retell|read)\s+\d+\s+(?:questions|sentences|pages)/i);
    expect(body).not.toMatch(/(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
  });

  it('gives Blog #51 evidence, answer-engine FAQs and indexable comprehension authority status', () => {
    const post = bySlug.get('why-child-reads-words-but-does-not-understand-story');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(16);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /read words correctly but not understand the story/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /fluency or comprehension/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /improve.*reading comprehension.*at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /questions after every sentence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /understands the story but cannot explain/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /extra help.*reads words.*does not understand stories/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('why-child-reads-words-but-does-not-understand-story')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('why-child-reads-words-but-does-not-understand-story')).toBe(true);
  });
});
