import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #63 conjunctions quality', () => {
  it('owns conjunction meaning and sentence-combining intent with accurate evergreen guidance', () => {
    const post = bySlug.get('grammar-conjunctions');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Conjunctions for Kids: How to Use and, but, because and so');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('ADD → CONTRAST → REASON → RESULT');
    expect(body).toContain('TWO IDEAS → RELATIONSHIP → CONNECTOR → SAY → WRITE → CHECK');
    expect(body).toContain('Because vs so: the same situation, a different direction');
    expect(body).toContain('BECAUSE explains why. SO explains what happened as a result.');
    expect(body).toContain('Can a sentence start with because?');
    expect(body).toContain('Because I was hungry, I ate a sandwich.');
    expect(body).toContain('Do not teach “always put a comma before a conjunction.”');
    expect(body).toContain('Conjunctions in connected writing');
    expect(body).toContain('How to know whether conjunction use is secure');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/grammar-tenses');
    expect(body).toContain('/blog/grammar-subject-verb');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');

    expect(body).not.toMatch(/\bWeek\s*9\b/i);
    expect(body).not.toContain('Week 10');
    expect(body).not.toContain('baby sentences');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships topic-specific FAQs, cited evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-conjunctions');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /what is a conjunction/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between because and so/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /start with because/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /use and in every sentence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /without worksheets/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-conjunctions')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-conjunctions')).toBe(true);
    expect(shouldNoindexBlogSlug('week-9-grammar-conjunctions')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-9-grammar-conjunctions']).toBe(
      '/blog/grammar-conjunctions',
    );
    expect(bySlug.has('week-9-grammar-conjunctions')).toBe(false);
  });
});
