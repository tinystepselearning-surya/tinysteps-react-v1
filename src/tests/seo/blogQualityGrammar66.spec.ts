import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #66 grammar assessment quality', () => {
  it('owns parent grammar-assessment intent without pretending a home checklist is a formal level', () => {
    const post = bySlug.get('grammar-assessment');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Grammar Assessment for Kids: A Simple Parent Checklist');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('short, non-standardised snapshot');
    expect(body).toContain('CHECK → RECORD → INTERPRET → TARGET → PRACTISE → RECHECK');
    expect(body).toContain('recognise → use with support → transfer independently');
    expect(body).toContain('Parent checklist 1 — complete sentence structure');
    expect(body).toContain('Parent checklist 3 — tense and time control');
    expect(body).toContain('Parent checklist 4 — subject-verb agreement');
    expect(body).toContain('Parent checklist 5 — conjunctions and relationships between ideas');
    expect(body).toContain('Parent checklist 6 — punctuation and proofreading');
    expect(body).toContain('Final transfer check — a short piece of connected language');
    expect(body).toContain('Independent / With a cue / Not yet');
    expect(body).toContain('Reassess with fresh examples');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/grammar-tenses');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/grammar-subject-verb');
    expect(body).toContain('/blog/grammar-creative-writing');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*17\b/i);
    expect(body).not.toContain('Week 18');
    expect(body).not.toContain('Red/Amber/Green scoring method');
    expect(body).not.toContain('breathing break');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships assessment-specific FAQs, cited evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-assessment');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /assess my child.*grammar at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /grammar level/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /Red, Amber and Green/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correctly but still make mistakes/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how often.*reassess/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /teacher/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-assessment')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-assessment')).toBe(true);
    expect(shouldNoindexBlogSlug('week-17-grammar-assessment')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-17-grammar-assessment']).toBe(
      '/blog/grammar-assessment',
    );
    expect(bySlug.has('week-17-grammar-assessment')).toBe(false);
  });
});
