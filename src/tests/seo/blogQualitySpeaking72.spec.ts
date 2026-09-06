import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #72 visual aids for public speaking quality', () => {
  it('owns visual-aid selection and use without replacing speech structure or confidence intent', () => {
    const post = bySlug.get('speaking-visual-aids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Kids Can Use Visual Aids in Public Speaking');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.readTime).toBe('15 min read');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('PURPOSE → CHOOSE → SIMPLIFY → SHOW → EXPLAIN → RECONNECT → REMOVE');
    expect(body).toContain('A cue card is slightly different');
    expect(body).toContain('Start with the message, not with the prop');
    expect(body).toContain('The “one visual at a time” principle');
    expect(body).toContain('not a universal rule that every child or every presentation must use only one prop');
    expect(body).toContain('For slides: less text creates more room for speaking');
    expect(body).toContain('NAME → NOTICE → MEANING');
    expect(body).toContain('SHOW → EXPLAIN → LOOK UP → CONTINUE');
    expect(body).toContain('Safety matters more than presentation effect');
    expect(body).toContain('When no visual aid is the better choice');
    expect(body).toContain('“no visual” is a valid design decision');
    expect(body).toContain('How to know visual-aid practice is transferring');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/speaking-structure');
    expect(body).toContain('/blog/speaking-debate-starters');
    expect(body).toContain('/blog/speaking-video-feedback');
    expect(body).toContain('/blog/speaking-competition-prep');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*14\b/i);
    expect(body).not.toContain('Week 15');
    expect(body).not.toContain('reduce the cognitive load of speaking');
    expect(body).not.toContain('gives the child a tiny focus that calms nerves');
    expect(body).not.toContain('Always start with one prop');
    expect(body).not.toContain('Done checklist');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships visual-aid FAQs, evidence and promoted clean indexability', () => {
    const post = bySlug.get('speaking-visual-aids');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(3);

    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /what are visual aids/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many visual aids/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /whole speech on presentation slides/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /cue cards/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /more than one prop/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /looking at the visual/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /automatically make a shy child more confident/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /every children’s speech need a visual aid/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('speaking-visual-aids')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('speaking-visual-aids')).toBe(true);
    expect(shouldNoindexBlogSlug('week-14-speaking-visual-aids')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-14-speaking-visual-aids']).toBe(
      '/blog/speaking-visual-aids',
    );
    expect(bySlug.has('week-14-speaking-visual-aids')).toBe(false);
  });
});
