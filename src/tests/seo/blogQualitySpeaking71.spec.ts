import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #71 speech structure quality', () => {
  it('owns planned speech organisation with accurate, flexible Hook-Body-Conclusion guidance', () => {
    const post = bySlug.get('speaking-structure');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Structure a Speech for Kids: Hook, Body and Conclusion');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.readTime).toBe('15 min read');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('HOOK → PURPOSE → POINTS → CONNECT → CLOSE → REHEARSE → ADAPT');
    expect(body).toContain('After listening, I want my audience to');
    expect(body).toContain('Part 1: how to create a strong hook');
    expect(body).toContain('Part 2: build the body around two or three useful points');
    expect(body).toContain('POINT → EXAMPLE → WHY IT MATTERS');
    expect(body).toContain('Part 3: how to end a speech clearly');
    expect(body).toContain('There is no single compulsory closing formula');
    expect(body).toContain('A polite “thank you” can follow, but it is not the conclusion itself');
    expect(body).toContain('two or three points are often a practical starting structure');
    expect(body).toContain('not a universal rule');
    expect(body).toContain('full script → highlighted keywords → note card → mental outline');
    expect(body).toContain('PLAN → SAY → CHECK → ADJUST → SAY AGAIN');
    expect(body).toContain('Adapt the same structure for different speech purposes');
    expect(body).toContain('How parents can coach structure without writing the speech for the child');
    expect(body).toContain('How to know speech structure is becoming independent');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/speaking-visual-aids');
    expect(body).toContain('/blog/speaking-debate-starters');
    expect(body).toContain('/blog/speaking-video-feedback');
    expect(body).toContain('/blog/speaking-competition-prep');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*13\b/i);
    expect(body).not.toContain('Week 14');
    expect(body).not.toContain('Done checklist');
    expect(body).not.toContain('brain loves patterns');
    expect(body).not.toContain('Templates lower anxiety');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships specific FAQs, evidence and clean indexability while preserving the Week-13 redirect', () => {
    const post = bySlug.get('speaking-structure');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);

    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /simple speech structure/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many points/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /hook ideas/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /thank you/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /memorise/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /rambles/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /forgets a sentence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /independently/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('speaking-structure')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('speaking-structure')).toBe(true);
    expect(shouldNoindexBlogSlug('week-13-speaking-structure')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-13-speaking-structure']).toBe(
      '/blog/speaking-structure',
    );
    expect(bySlug.has('week-13-speaking-structure')).toBe(false);
  });
});
