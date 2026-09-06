import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #67 grammar editing quality', () => {
  it('owns find-and-fix editing intent with clear revision and proofreading boundaries', () => {
    const post = bySlug.get('grammar-editing-camp');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Grammar Editing Practice for Kids: Find and Fix Common Mistakes');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Editing, revising and proofreading are related — but they are not identical');
    expect(body).toContain('FIND → EXPLAIN → FIX → REREAD → TRANSFER');
    expect(body).toContain('Start with one editing target at a time');
    expect(body).toContain('Editing check 1 — sentence boundaries, capitals and end punctuation');
    expect(body).toContain('Editing check 2 — tense consistency');
    expect(body).toContain('Editing check 3 — subject-verb agreement');
    expect(body).toContain('Editing check 4 — conjunction meaning');
    expect(body).toContain('Editing check 5 — pronouns and clear reference');
    expect(body).toContain('Editing check 6 — word choice for clarity, not decoration');
    expect(body).toContain('Editing check 7 — fragments and run-on sentences');
    expect(body).toContain('Use an editing ladder instead of correcting everything at once');
    expect(body).toContain('Worked example: edit a short paragraph step by step');
    expect(body).toContain('How to know whether editing is becoming independent');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/grammar-assessment');
    expect(body).toContain('/blog/grammar-creative-writing');
    expect(body).toContain('/blog/grammar-tenses');
    expect(body).toContain('/blog/grammar-subject-verb');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*20\b/i);
    expect(body).not.toContain('Week 21');
    expect(body).not.toContain('Editing Camp at Home');
    expect(body).not.toContain('Reward system that isn’t money');
    expect(body).not.toContain('swap one word per sentence');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships editing-specific FAQs, cited evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-editing-camp');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /what is grammar editing practice/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between revising, editing and proofreading/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correct every mistake/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /spot grammar mistakes independently/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /fix worksheets.*same mistakes/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /replace simple words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /independent editor/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-editing-camp')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-editing-camp')).toBe(true);
    expect(shouldNoindexBlogSlug('week-20-grammar-editing-camp')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-20-grammar-editing-camp']).toBe(
      '/blog/grammar-editing-camp',
    );
    expect(bySlug.has('week-20-grammar-editing-camp')).toBe(false);
  });
});
