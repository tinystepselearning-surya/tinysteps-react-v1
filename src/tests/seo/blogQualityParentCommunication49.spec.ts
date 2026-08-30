import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #49 screen-smart summer learning quality refresh', () => {
  it('keeps Blog #49 as the screen-learning balance guide without turning screen minutes into a universal educational rule', () => {
    const post = bySlug.get('screen-smart-summer-routine-for-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Screen-Smart Summer Learning Routine for Kids: Balance English Practice and Screen Time');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Purpose → Participate → Transfer → Protect → Review');
    expect(body).toContain('Step 1 — Purpose: name the English skill before opening the app, video or game');
    expect(body).toContain('Step 2 — Participate: the child should do more than watch or tap automatically');
    expect(body).toContain('Step 3 — Transfer: take one example off the screen');
    expect(body).toContain('Step 4 — Protect: check what the screen is crowding out');
    expect(body).toContain('Step 5 — Review: keep, change or remove the activity based on what you observe');
    expect(body).toContain('A screen-smart summer routine does not need one universal number of minutes');
    expect(body).toContain('Age-wise screen-smart learning guidance for 3–12 years');
    expect(body).toContain('Ages 3–5: interaction around the screen matters more than independent device practice');
    expect(body).toContain('Ages 6–8: make digital practice serve the reading and sentence goal');
    expect(body).toContain('Ages 9–12: add digital independence without giving algorithms the whole routine');
    expect(body).toContain('Four types of screen use parents should separate');
    expect(body).toContain('screen → talk → do → transfer');
    expect(body).toContain('Tiny Steps digital games: practice resources, not a substitute for teaching or proof of mastery');
    expect(body).toContain('A flexible summer learning menu instead of a fixed 10-minute formula');
    expect(body).toContain('This article provides educational routine guidance, not paediatric or mental-health advice');

    expect(body).toContain('/blog/how-to-engage-kids-in-english-learning-at-home');
    expect(body).toContain('/blog/june-school-reopening-english-readiness-plan');
    expect(body).toContain('/blog/back-to-school-english-confidence-plan');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/free-english-games-for-kids');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('The 10-minute summer routine (daily)');
    expect(body).not.toContain('A 10-minute routine works better than a long weekend reset');
    expect(body).not.toContain('Do not run 45-minute study blocks in summer');
    expect(body).not.toContain('no progress after 3-4 weeks');
    expect(body).not.toContain('one short offline task before passive screen time');
  });

  it('gives Blog #49 current media evidence, answer-engine FAQs and indexable parent-guide status', () => {
    const post = bySlug.get('screen-smart-summer-routine-for-kids');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(11);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /how much screen time.*summer/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /screen time count as English learning/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /educational apps better than videos/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /reduce screen conflict/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /after an English learning game/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /screen use is affecting daily life/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('screen-smart-summer-routine-for-kids')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('screen-smart-summer-routine-for-kids')).toBe(true);
  });
});
