import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #44 sentence formation quality refresh', () => {
  it('keeps Blog #44 as the sentence-construction owner rather than the grammar-transfer owner', () => {
    const post = bySlug.get('how-to-improve-sentence-formation-in-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Improve Sentence Formation in Kids');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Oral sentence → Core structure → Expansion → Writing transfer');
    expect(body).toContain('Stage 1 — Oral sentence check');
    expect(body).toContain('Stage 2 — Core structure check');
    expect(body).toContain('Stage 3 — Expansion check');
    expect(body).toContain('Stage 4 — Writing transfer check');
    expect(body).toContain('A practical sentence-building progression for home or class');
    expect(body).toContain('Five sentence-building activities that teach a real structure');
    expect(body).toContain('Sentence frames: useful scaffold, poor permanent destination');
    expect(body).toContain('How correction should work during sentence practice');
    expect(body).toContain('Speaking and writing sentence formation are related but not identical');
    expect(body).toContain('Longer is not automatically better');
    expect(body).toContain('For multilingual children, compare sentence ability across languages carefully');

    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/grammar-speaking-bridge');
    expect(body).toContain('/blog/how-to-engage-kids-in-english-learning-at-home');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('/blog/week-7-grammar-nouns-to-paragraphs');
    expect(body).not.toContain('/blog/week-9-grammar-conjunctions');
    expect(body).not.toContain('/blog/week-23-grammar-speaking-bridge');
    expect(body).not.toContain('Play Free: /free-games/word-meaning-flashcards');
    expect(body).not.toContain('7. FAQ section with 5 parent questions');
  });

  it('gives Blog #44 evidence, answer-engine FAQs and indexable sentence-formation authority status', () => {
    const post = bySlug.get('how-to-improve-sentence-formation-in-kids');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(10);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /improve sentence formation.*at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /know many words but cannot make sentences/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sentence-building activities/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /every question in a full sentence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /speak a sentence but cannot write it/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sentence formation or grammar/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('how-to-improve-sentence-formation-in-kids')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('how-to-improve-sentence-formation-in-kids')).toBe(true);
  });
});
