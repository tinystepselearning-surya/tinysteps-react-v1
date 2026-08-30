import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #40 understands-English-but-does-not-speak quality refresh', () => {
  it('keeps Blog #40 as the protected understanding-versus-independent-speaking diagnostic owner', () => {
    const post = bySlug.get('child-understands-english-but-does-not-speak');
    expect(post).toBeDefined();
    expect(post?.title).toBe('My Child Understands English but Does Not Speak in Class — Is It Confidence or Language?');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Comprehension check → Modelled response → Prompted response → Independent response');
    expect(body).toContain('Comprehension check');
    expect(body).toContain('Modelled response');
    expect(body).toContain('Prompted response');
    expect(body).toContain('Independent response');
    expect(body).toContain('Use a second axis: does speaking change by setting?');
    expect(body).toContain('Confidence, language or both? Use this parent decision map');
    expect(body).toContain('How to reduce prompts without removing support too quickly');
    expect(body).toContain('For multilingual children: do not confuse English difference with a general speaking problem');
    expect(body).toContain('When “speaks at home but not at school” deserves professional attention');
    expect(body).toContain('How to measure progress without demanding a performance');
    expect(body).toContain('multilingualism is not a communication disorder');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/speaking');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('/blog/week-12-speaking-confidence-seeds');
    expect(body).not.toContain('/blog/week-13-speaking-structure');
    expect(body).not.toContain('11. FAQ section with 5 parent questions');
    expect(body).not.toContain('Explore speaking pathway: /speaking');
    expect(body).not.toContain('Compare starting routes: /courses');
  });

  it('gives Blog #40 evidence, safety boundaries, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('child-understands-english-but-does-not-speak');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(9);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /understand English but not speak in class/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /confidence or language/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /speaks normally at home but does not speak at school/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /force my child to answer in full sentences/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /another language at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /seek extra help/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('child-understands-english-but-does-not-speak')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('child-understands-english-but-does-not-speak')).toBe(true);
  });
});
