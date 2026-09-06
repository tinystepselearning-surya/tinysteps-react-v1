import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #73 debate topics and starters quality', () => {
  it('owns beginner debate reasoning without stealing broad confidence or competition intent', () => {
    const post = bySlug.get('speaking-debate-starters');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Debate Topics and Starters for Kids and Tweens to Build Speaking Confidence');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.readTime).toBe('15 min read');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('POSITION → REASON → EXAMPLE → LISTEN → RESPOND → REFLECT');
    expect(body).toContain('Debate is more than giving an opinion');
    expect(body).toContain('an example can illustrate a reason without proving that the claim is always true');
    expect(body).toContain('listening before responding');
    expect(body).toContain('You are saying that…');
    expect(body).toContain('SUMMARISE → CHOOSE → RESPOND');
    expect(body).toContain('No fixed timer is required for learning the skill');
    expect(body).toContain('Changing your mind after hearing a better reason is allowed');
    expect(body).toContain('Position Line');
    expect(body).toContain('Switch Sides');
    expect(body).toContain('Evidence or Example?');
    expect(body).toContain('What to do when debate becomes personal or emotional');
    expect(body).toContain('How to measure progress without scoring who “won”');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/speaking-structure');
    expect(body).toContain('/blog/speaking-visual-aids');
    expect(body).toContain('/blog/speaking-video-feedback');
    expect(body).toContain('/blog/speaking-competition-prep');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*15\b/i);
    expect(body).not.toContain('Week 16');
    expect(body).not.toContain('Done checklist');
    expect(body).not.toContain('removes debate selection anxiety');
    expect(body).not.toContain('builds reasoning skills, vocabulary, and confidence');
    expect(body).not.toContain('30s think, 60s speak, 15s rebuttal');
  });

  it('ships debate FAQs, evidence and promoted clean indexability', () => {
    const post = bySlug.get('speaking-debate-starters');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);

    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /first debate topic/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sentence starters/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /argument structure/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /disagree respectfully/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /timers/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /personal example/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /argumentative or upsetting/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /improving at debate/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('speaking-debate-starters')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('speaking-debate-starters')).toBe(true);
    expect(shouldNoindexBlogSlug('week-15-speaking-debate-starters')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-15-speaking-debate-starters']).toBe(
      '/blog/speaking-debate-starters',
    );
    expect(bySlug.has('week-15-speaking-debate-starters')).toBe(false);
  });
});
