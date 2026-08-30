import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #8 quality lock', () => {
  it('owns the phonics-class-to-reading mechanism without becoming a provider-comparison page', () => {
    const post = bySlug.get('how-phonics-classes-help-kids-read');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Decoding, blending and fluency are related—but they are not the same skill');
    expect(body).toContain('The Tiny Steps six-part class-to-reading chain');
    expect(body).toContain('1. Establish the child’s current starting point');
    expect(body).toContain('3. Blend for reading and segment for spelling');
    expect(body).toContain('4. Check a fresh word, not only a rehearsed example');
    expect(body).toContain('5. Move the same knowledge into matched connected text');
    expect(body).toContain('Why live teaching can add something a worksheet cannot');
    expect(body).toContain('Why spelling belongs inside a phonics class');
    expect(body).toContain('How phonics teaching contributes to fluency without promising fluency by itself');
    expect(body).toContain('What phonics classes do not automatically fix');
    expect(body).toContain('Five parent-visible signs that class learning is transferring');
    expect(body).toContain('Where Blog #8 stops: class mechanism is not the same as class shopping');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/how-phonics-builds-reading-confidence');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/blog/online-phonics-classes-vs-school');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');

    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toContain('Checklist when choosing a phonics class');
    expect(body).not.toContain('Book Free 35-Minute Demo');
    expect(body).not.toMatch(/phonics alone (?:builds|guarantees|ensures) comprehension/i);
    expect(body).not.toMatch(/phonics alone (?:builds|guarantees|ensures) fluency/i);
  });

  it('adds evidence, transfer boundaries and five extractable class-mechanism FAQs', () => {
    const post = bySlug.get('how-phonics-classes-help-kids-read');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('editorial teaching framework, not a standardized research protocol');
    expect(body).toContain('The Tiny Steps six-part class-to-reading chain is our editorial synthesis');
    expect(body).toContain('Phonics is an important part of learning to read, but it is not the whole of reading');
    expect(body).toContain('Every cause of reading difficulty');
    expect(body).toContain('may require additional professional assessment or support');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /how do phonics classes actually help/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between decoding, blending and fluency/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /improve reading comprehension/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /transferring home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /when should a phonics class plan be reviewed/i.test(item.question))).toBe(true);
  });
});
