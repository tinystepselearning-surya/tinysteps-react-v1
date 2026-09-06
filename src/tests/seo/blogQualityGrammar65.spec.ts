import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #65 creative writing scaffolds quality', () => {
  it('owns creative-writing scaffolding intent with an evergreen writing-process framework', () => {
    const post = bySlug.get('grammar-creative-writing');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Creative Writing Scaffolds for Ages 8–10');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('IDEA → PLAN → DRAFT → DEVELOP → REVISE → EDIT → SHARE');
    expect(body).toContain('WHO → WHERE → WANT → PROBLEM → RESPONSE → ENDING');
    expect(body).toContain('Story Mountain: a practical scaffold for organising narrative');
    expect(body).toContain('ACTION → DETAIL → REACTION');
    expect(body).toContain('Revision and editing are different jobs');
    expect(body).toContain('How to fade the scaffold so the child becomes independent');
    expect(body).toContain('How to tell whether creative writing is improving');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/grammar-subject-verb');
    expect(body).toContain('/blog/grammar-assessment');
    expect(body).toContain('/blog/grammar-editing-camp');
    expect(body).toContain('/blog/grammar-speaking-bridge');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*11\b/i);
    expect(body).not.toContain('Week 12 teaser');
    expect(body).not.toContain('Track B');
    expect(body).not.toContain('1 adjective rule');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships creative-writing FAQs, cited evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-creative-writing');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /creative writing scaffold/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /don.t know what to write/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /story mountain/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /plan a story/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /revising and editing/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /remove a writing scaffold/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-creative-writing')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-creative-writing')).toBe(true);
    expect(shouldNoindexBlogSlug('week-11-grammar-creative-writing')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-11-grammar-creative-writing']).toBe(
      '/blog/grammar-creative-writing',
    );
    expect(bySlug.has('week-11-grammar-creative-writing')).toBe(false);
  });
});
