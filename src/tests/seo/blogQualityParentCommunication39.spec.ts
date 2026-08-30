import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #39 class-to-home reading transfer quality refresh', () => {
  it('owns the parent intent for reading that looks stronger in class than at home', () => {
    const post = bySlug.get('child-reads-in-class-but-forgets-at-home');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Why Can My Child Read in Class but Struggle at Home? What Parents Can Do');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('target → text → prompt → fresh transfer');
    expect(body).toContain('The Tiny Steps four-variable class-to-home transfer check');
    expect(body).toContain('Variable 1 — Target');
    expect(body).toContain('Variable 2 — Text');
    expect(body).toContain('Variable 3 — Prompt');
    expect(body).toContain('Variable 4 — Fresh transfer');
    expect(body).toContain('Use a three-level transfer result instead of “can read / cannot read”');
    expect(body).toContain('A five-minute home transfer routine');
    expect(body).toContain('How to tell whether the real problem is decoding, fluency or comprehension');
    expect(body).toContain('Questions to ask the teacher instead of saying “They can do it for you, but not for me”');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/parents/reading-at-home');
    expect(body).toContain('/parents/tracking-progress');
    expect(body).toContain('/phonics');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('Use the home-reading routine: /parents/reading-at-home');
    expect(body).not.toContain('Learn how to track progress: /parents/tracking-progress');
    expect(body).not.toContain('Explore the phonics pathway: /phonics');
    expect(body).not.toContain('Book a free assessment: /book-demo');
  });

  it('has evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('child-reads-in-class-but-forgets-at-home');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(9);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /read in class but not at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /memorising the words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /same reading prompt as the teacher/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /exact school reading book or word list/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decoding or fluency/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /deeper reading review/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('child-reads-in-class-but-forgets-at-home')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('child-reads-in-class-but-forgets-at-home')).toBe(true);
  });
});
