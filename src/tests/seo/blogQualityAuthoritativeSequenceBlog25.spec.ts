import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #25 quality lock', () => {
  it('owns the repeatable home blending routine without calendar, timer or word-count mastery rules', () => {
    const post = bySlug.get('phonics-blending-club');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Blending Practice for Kids at Home: A Simple Daily Routine');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: what should daily blending practice look like at home?');
    expect(body).toContain('Who this routine is for — and who needs a different starting point');
    expect(body).toContain('What blending is — and what it is not');
    expect(body).toContain('First check the sounds before asking the child to blend');
    expect(body).toContain('The Tiny Steps five-part blending routine');
    expect(body).toContain('See → Sound → Sweep → Say → Transfer');
    expect(body).toContain('A simple daily routine without a fixed timer or word quota');
    expect(body).toContain('Worked example: from separate sounds to a fresh word');
    expect(body).toContain('What to say when blending breaks down');
    expect(body).toContain('If your child knows the sounds but still cannot blend');
    expect(body).toContain('Oral blending helps, but printed-word transfer still matters');
    expect(body).toContain('How to know whether the routine is helping');
    expect(body).toContain('When should parents make blending practice harder?');
    expect(body).toContain('When blending is no longer the main reading target');
    expect(body).toContain('When home blending practice is not enough');

    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-activities-for-kids-at-home');
    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/phonics-satpin-launch');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/\bWeek\s+[23]\b/i);
    expect(body).not.toContain('7-Day Blending Bootcamp');
    expect(body).not.toContain('10–12 minutes/day');
    expect(body).not.toContain('Quick timed wins');
    expect(body).not.toContain('Blend Race');
    expect(body).not.toContain('Speed Pop');
    expect(body).not.toContain('15-sec');
    expect(body).not.toContain('Choose five words a day');
    expect(body).not.toContain('reliably blend 6–8 CVC words');
    expect(body).not.toContain('Can blend 3 CVC words independently');
    expect(body).not.toContain('The biggest reason kids can’t blend');
    expect(body).not.toMatch(/guaranteed? to (?:blend|read|improve)/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
  });

  it('locks evidence, transfer, support boundaries, FAQs and indexable public authority status', () => {
    const post = bySlug.get('phonics-blending-club');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('Routine success is not finishing the practice list. Transfer is the stronger reading evidence.');
    expect(body).toContain('not a compulsory dose');
    expect(body).toContain('not a standardized assessment or research-validated five-step protocol');
    expect(body).toContain('do **not** establish one universal home routine, one required daily dose, one fixed word count or one deadline');
    expect(body).toContain('This routine is not a diagnostic test for dyslexia');
    expect(body).toContain('One familiar word read quickly can reflect memory.');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /How long should blending practice take each day/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /How many words should my child blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /knows letter sounds but cannot blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /continuous blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correct a wrong word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /move beyond CVC blending practice/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-blending-club')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-blending-club')).toBe(true);
    expect(shouldNoindexBlogSlug('week-2-phonics-blending-club')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-2-phonics-blending-club')).toBe(false);
  });
});
