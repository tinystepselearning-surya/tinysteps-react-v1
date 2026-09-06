import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const slug = 'speaking-competition-prep';
const legacySlug = 'week-21-speaking-competition-prep';
const post = blogPosts.find((item) => item.slug === slug)!;
const body = post.body.map((block) => block.content).join('\n');
const allText = `${post.title}\n${post.metaDescription ?? ''}\n${post.excerpt ?? ''}\n${body}`;
const evidenceUrls = body.match(/https:\/\/[^\s)]+/g) ?? [];

describe('Blog 75 competition-prep quality gate', () => {
  it('publishes the clean canonical metadata and parent-facing discovery identity', () => {
    expect(post).toBeTruthy();
    expect(post.title).toBe('Public Speaking Competition Checklist for Kids: How to Prepare Step by Step');
    expect(post.author).toBe('Priya');
    expect(post.modifiedDate).toBe('2026-09-06');
    expect(post.readTime).toBe('16 min read');
    expect(post.audience).toBe('Parent');
    expect(post.discoveryCategory).toBe('Speaking & Communication');
    expect(post.metaDescription?.length).toBeLessThanOrEqual(160);
  });

  it('starts with event rules and locks the Tiny Steps competition-preparation sequence', () => {
    expect(body).toContain('actual competition rules');
    expect(body).toContain('organiser’s published rules always take priority');
    expect(body).toContain('RULES → MESSAGE → STRUCTURE → REHEARSE → TIME → SIMULATE → PACK → RESET');
    expect(body).toContain('Competition rule sheet: what parents should confirm');
    expect(body).toContain('judging criteria');
    expect(body).toContain('permitted notes');
    expect(body).toContain('minimum, maximum');
  });

  it('separates content, structure, delivery, timing and competition compliance', () => {
    expect(body).toContain('Content pass');
    expect(body).toContain('Structure pass');
    expect(body).toContain('Delivery pass');
    expect(body).toContain('Competition pass');
    expect(body).toContain('focused rehearsal before repeated full runs');
    expect(body).toContain('Recovery drill');
  });

  it('avoids universal stage, timing and microphone formulas', () => {
    expect(body).toContain('There is no universal rulebook');
    expect(body).toContain('Do not use a universal microphone-distance rule');
    expect(body).toContain('ask the organiser or technician');
    expect(body).toContain('If the event does not require a costume');
    expect(body).toContain('There is no universal number of preparation days');
    expect(allText).not.toContain('Nerves mean the child cares');
    expect(allText).not.toContain('2–3 fingers away');
    expect(allText).not.toContain('after 2-3 weeks');
  });

  it('teaches questions, recovery, simulation and final-day logistics', () => {
    expect(body).toContain('LISTEN → PAUSE → ANSWER → SUPPORT → STOP');
    expect(body).toContain('Practise recovery, not just perfect runs');
    expect(body).toContain('Simulate the event, not only the speech');
    expect(body).toContain('Competition-day checklist for parents and children');
    expect(body).toContain('PAUSE → ORIENT → FIRST IDEA');
  });

  it('protects the child from over-coaching and separates ranking from progress', () => {
    expect(body).toContain('Do not rewrite the whole speech in an adult voice');
    expect(body).toContain('Do not equate winning with successful preparation');
    expect(body).toContain('separate **result** from **performance evidence**');
    expect(body).toContain('What worked? What evidence do we have? What will we try next?');
  });

  it('routes adjacent speaking intents to their correct owners', () => {
    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/speaking-structure');
    expect(body).toContain('/blog/speaking-visual-aids');
    expect(body).toContain('/blog/speaking-debate-starters');
    expect(body).toContain('/blog/speaking-video-feedback');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
  });

  it('includes transparent evidence and exactly eight native FAQs', () => {
    expect(evidenceUrls.length).toBeGreaterThanOrEqual(4);
    expect(body).toContain('They do **not** establish one universal competition checklist');
    expect(post.faq).toHaveLength(8);
    expect(post.faq?.map((item) => item.question)).toContain('What if my child does not win the public speaking competition?');
  });

  it('promotes only the clean URL and keeps the old Week-21 path redirect-only', () => {
    expect(shouldNoindexBlogSlug(slug)).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
    expect(shouldNoindexBlogSlug(legacySlug)).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap(legacySlug)).toBe(false);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS[`/blog/${legacySlug}`]).toBe(`/blog/${slug}`);
    expect(blogPosts.some((item) => item.slug === legacySlug)).toBe(false);
  });
});
