import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #74 video feedback quality', () => {
  it('owns optional one-target video review without turning recording into the intervention', () => {
    const post = bySlug.get('speaking-video-feedback');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Video Feedback Helps Kids Improve Public Speaking');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.readTime).toBe('15 min read');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('RECORD → NOTICE → TARGET → RETRY → COMPARE → TRANSFER');
    expect(body).toContain('Video is optional.');
    expect(body).toContain('The educational value comes from **focused observation and an actionable next step**, not from the camera itself.');
    expect(body).toContain('Choose the speaking goal before pressing record');
    expect(body).toContain('Use observable feedback instead of labels');
    expect(body).toContain('WORKED → EVIDENCE → NEXT');
    expect(body).toContain('Why one target at a time is useful—but not a universal rule');
    expect(body).toContain('Do not turn eye contact, facial expression or body movement into rigid performance rules.');
    expect(body).toContain('If a child hates watching themselves on video');
    expect(body).toContain('practice videos do not need to be posted online');
    expect(body).toContain('Consent to being recorded should not be treated as consent to upload or share the clip.');
    expect(body).toContain('How to compare progress fairly');
    expect(body).toContain('Fresh-Topic Transfer');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/speaking-structure');
    expect(body).toContain('/blog/speaking-visual-aids');
    expect(body).toContain('/blog/speaking-debate-starters');
    expect(body).toContain('/blog/speaking-competition-prep');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*18\b/i);
    expect(body).not.toContain('Week 19');
    expect(body).not.toContain('positive feedback loop: see one small win, try it again, and the win grows');
    expect(body).not.toContain('Daily short recordings with gentle review build confidence');
    expect(body).not.toContain('If your child still avoids speaking after 2-3 weeks');
    expect(body).not.toContain('Done checklist');
  });

  it('ships focused FAQs, evidence and promoted clean indexability', () => {
    const post = bySlug.get('speaking-video-feedback');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);

    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /how does video feedback help/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how long should/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /what should parents look for/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /only one piece of feedback/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /hates watching themselves/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /eye contact/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /upload.*online/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how do I know video feedback/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('speaking-video-feedback')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('speaking-video-feedback')).toBe(true);
    expect(shouldNoindexBlogSlug('week-18-speaking-video-feedback')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-18-speaking-video-feedback']).toBe(
      '/blog/speaking-video-feedback',
    );
    expect(bySlug.has('week-18-speaking-video-feedback')).toBe(false);
  });
});
