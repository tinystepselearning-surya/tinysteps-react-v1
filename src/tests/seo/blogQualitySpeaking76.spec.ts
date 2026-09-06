import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  LEGACY_WEEK_BLOG_PATH_REDIRECTS,
  LEGACY_WEEK_BLOG_RENAMES,
} from '../../lib/blogWeekRenames.js';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const repoRoot = process.cwd();
const source = fs.readFileSync(
  path.join(repoRoot, 'src/content/blog/posts/public-speaking/week-24-speaking-family-showcase.ts'),
  'utf8',
);
const post = blogPosts.find((item) => item.slug === 'speaking-family-showcase');
const body = post?.body.map((block) => block.content).join('\n') || '';

const externalUrls = body.match(/https:\/\/[^\s)]+/g) || [];

describe('Blog 76 family showcase quality gate', () => {
  it('uses the canonical public title, founder author and current editorial metadata', () => {
    expect(post).toBeTruthy();
    expect(post?.title).toBe('Public Speaking Activities for Kids at Home: Host a Family Showcase');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');
    const metaDescription = post?.metaDescription ?? '';
    expect(metaDescription).toBeTruthy();
    expect(metaDescription.length).toBeLessThanOrEqual(160);
  });

  it('owns a choice-based family showcase process rather than a compulsory performance routine', () => {
    expect(body).toContain('CHOOSE → PLAN → PRACTISE → HOST → LISTEN → FEEDBACK → REFLECT → REPEAT');
    expect(body).toContain('A family showcase does not require every child to give a formal speech');
    expect(body).toContain('Participation can be adjusted without pretending every step is equivalent');
    expect(body).toContain('These are Tiny Steps teaching levels for planning practice');
    expect(body).toContain('not clinical, developmental or standardised assessment levels');
    expect(body).toContain('There is no universal two-minute-per-child rule');
  });

  it('provides varied speaking activities, audience rules and actionable feedback', () => {
    expect(body).toContain('15 public speaking activities for kids at home');
    expect(body).toContain('Family interview');
    expect(body).toContain('Two-person presentation');
    expect(body).toContain('Host or emcee role');
    expect(body).toContain('Audience rules matter as much as speaker practice');
    expect(body).toContain('NOTICE → EFFECT → NEXT');
    expect(body).toContain('never give corrective feedback');
  });

  it('keeps confidence, privacy and frequency claims appropriately bounded', () => {
    expect(body).toContain('not a confidence treatment, a compulsory performance, or a test of personality');
    expect(body).toContain('Applause, smiles and willingness to participate');
    expect(body).toContain('not enough on their own to prove speaking progress');
    expect(body).toContain('There is no evidence-based universal frequency for family showcase nights');
    expect(body).toContain('attendance equals consent to recording or sharing');
    expect(body).toContain('Avoid posting a child’s practice or performance publicly');
    expect(source).not.toContain('natural reward loop');
    expect(source).not.toContain('first Sunday of every month');
  });

  it('routes adjacent intents to the correct speaking and diagnostic owners', () => {
    for (const link of [
      '/blog/speaking-confidence-seeds',
      '/blog/speaking-structure',
      '/blog/speaking-visual-aids',
      '/blog/speaking-debate-starters',
      '/blog/speaking-video-feedback',
      '/blog/speaking-competition-prep',
      '/blog/grammar-speaking-bridge',
      '/blog/child-understands-english-but-does-not-speak',
      '/blog/child-gives-one-word-answers',
      '/speaking',
      '/curriculum',
    ]) {
      expect(body).toContain(link);
    }
  });

  it('includes a transparent evidence layer and exactly eight native FAQs', () => {
    expect(body).toContain('Evidence behind the approach');
    expect(body).toContain('Tiny Steps editorial teaching scaffolds');
    expect(new Set(externalUrls).size).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(8);
  });

  it('removes weekly editorial framing from the canonical source', () => {
    expect(source).not.toContain("slug: 'week-24-speaking-family-showcase'");
    expect(source).not.toContain('Week 24:');
    expect(source).not.toContain('Week 25');
    expect(source).not.toContain('7 days');
  });

  it('promotes only the clean URL and preserves the one-hop legacy redirect', () => {
    expect(shouldNoindexBlogSlug('speaking-family-showcase')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('speaking-family-showcase')).toBe(true);
    expect(shouldNoindexBlogSlug('week-24-speaking-family-showcase')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-24-speaking-family-showcase')).toBe(false);

    expect(LEGACY_WEEK_BLOG_RENAMES['week-24-speaking-family-showcase']).toEqual({
      slug: 'speaking-family-showcase',
      title: 'Public Speaking Activities for Kids at Home: Host a Family Showcase',
    });
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-24-speaking-family-showcase']).toBe(
      '/blog/speaking-family-showcase',
    );
    expect(blogPosts.some((item) => item.slug === 'week-24-speaking-family-showcase')).toBe(false);
  });
});
