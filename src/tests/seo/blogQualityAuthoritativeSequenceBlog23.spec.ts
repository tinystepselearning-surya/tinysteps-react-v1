import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #23 quality lock', () => {
  it('owns the light summer phonics-practice routine without becoming a summer-slide or new-curriculum article', () => {
    const post = bySlug.get('phonics-summer-plan');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Summer Phonics Practice for Kids: A 10-Minute Daily Routine');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: use summer to keep taught phonics usable, not to race ahead');
    expect(body).toContain('Who this summer phonics plan is for—and who needs a different plan');
    expect(body).toContain('Ten minutes is a structure, not a mastery rule');
    expect(body).toContain('First choose one current phonics target');
    expect(body).toContain('The Tiny Steps five-part summer phonics loop');
    expect(body).toContain('Retrieve → Decode → Encode → Transfer → Adjust');
    expect(body).toContain('A flexible 10-minute summer phonics routine');
    expect(body).toContain('Version A — sound recall and first blending');
    expect(body).toContain('Version B — short-word decoding and digraphs');
    expect(body).toContain('Version C — later phonics patterns');
    expect(body).toContain('A weekly rhythm without a new-pattern quota');
    expect(body).toContain('Games can support the routine—but transfer is the check');
    expect(body).toContain('How to choose decodable practice text for summer');
    expect(body).toContain('The Tiny Steps summer carryover check');
    expect(body).toContain('When to stop summer phonics and just read');
    expect(body).toContain('When home summer practice is not enough');

    expect(body).toContain('/blog/prevent-summer-slide-reading');
    expect(body).toContain('/blog/phonics-activities-for-kids-at-home');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/phonics-satpin-launch');
    expect(body).toContain('/blog/phonics-long-vowels');
    expect(body).toContain('/blog/phonics-r-controlled');
    expect(body).toContain('/blog/phonics-multisyllabic');
    expect(body).toContain('/blog/online-phonics-games');
    expect(body).toContain('/blog/phonics-games-for-letter-sounds');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/\bWeek\s+1[67]\b/i);
    expect(body).not.toContain('15 minutes a day keeps skills active');
    expect(body).not.toContain('Day-by-day (exact)');
    expect(body).not.toContain('5-word sprint');
    expect(body).not.toContain('Speed read — 30-second flash');
    expect(body).not.toContain('New long vowel pattern (15 min)');
    expect(body).not.toMatch(/guaranteed? to (?:maintain|improve|read)/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
  });

  it('adds evidence boundaries, transfer checks, FAQs and indexable authority status', () => {
    const post = bySlug.get('phonics-summer-plan');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('not a research-proven minimum dose');
    expect(body).toContain('not a standardized assessment');
    expect(body).toContain('It does **not** establish one universal summer schedule');
    expect(body).toContain('Outside England, these documents are useful implementation references rather than rules.');
    expect(body).toContain('This article cannot diagnose dyslexia');
    expect(body).toContain('Rich storybooks still belong in summer.');
    expect(body).toContain('hear sound → identify printed letter → choose the correct balloon');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /10 minutes of phonics every day enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /teach new phonics sounds or rules/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /How many days a week/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /apps and games replace/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /knows letter sounds but still cannot blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /fluent reader still do phonics/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-summer-plan')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-summer-plan')).toBe(true);
    expect(shouldNoindexBlogSlug('week-16-phonics-summer-plan')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-16-phonics-summer-plan')).toBe(false);
  });
});
