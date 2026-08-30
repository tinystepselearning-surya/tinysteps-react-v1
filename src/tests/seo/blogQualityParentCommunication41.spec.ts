import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #41 cross-skill English learning quality refresh', () => {
  it('keeps Blog #41 as the cross-skill connector rather than replacing specialist authority owners', () => {
    const post = bySlug.get('how-phonics-grammar-and-communication-work-together');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Phonics, Grammar and Communication Work Together in a Child’s English Learning');
    expect(post?.category).toBe('English Communication');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Decode → Understand → Build → Express → Transfer');
    expect(body).toContain('The Tiny Steps cross-skill map: Decode → Understand → Build → Express → Transfer');
    expect(body).toContain('Phonics: access to written words');
    expect(body).toContain('Grammar: control of sentence meaning');
    expect(body).toContain('Communication: using language with another person');
    expect(body).toContain('Six uneven profiles parents commonly see — and what each one suggests');
    expect(body).toContain('Do children need phonics, grammar and communication every day?');
    expect(body).toContain('A practical Read → Build → Say → Transfer routine');
    expect(body).toContain('What parents should practise first: a five-question decision check');
    expect(body).toContain('This article is the **connector**, not the specialist owner of every problem');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/phonics');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('/blog/week-7-grammar-nouns-to-paragraphs');
    expect(body).not.toContain('/blog/week-12-speaking-confidence-seeds');
    expect(body).not.toContain('How to choose the right Tiny Steps starting path');
    expect(body).not.toContain('Use the strongest bottleneck to choose the first route: /phonics');
  });

  it('gives Blog #41 evidence, answer-engine FAQs and indexable cross-skill authority status', () => {
    const post = bySlug.get('how-phonics-grammar-and-communication-work-together');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(10);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /how do phonics, grammar and communication work together/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /always be taught together/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics improve speaking/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /grammar improve.*communication/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /reads well but struggles to speak/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /which English skill.*work on first/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('how-phonics-grammar-and-communication-work-together')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('how-phonics-grammar-and-communication-work-together')).toBe(true);
  });
});
