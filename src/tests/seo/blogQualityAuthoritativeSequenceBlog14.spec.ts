import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #14 quality lock', () => {
  it('owns the broad home phonics routine without fixed dosage or timeline promises', () => {
    const post = bySlug.get('phonics-activities-for-kids-at-home');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Activities at Home: A Parent Routine That Actually Sticks');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('target → retrieve → practise → transfer → observe → adjust');
    expect(body).toContain('Step 1 — Target: choose one skill the child is actually working on');
    expect(body).toContain('Step 2 — Retrieve: begin with something already taught');
    expect(body).toContain('Step 3 — Practise: use one low-prep activity that makes the target unavoidable');
    expect(body).toContain('Step 4 — Transfer: finish with one fresh use of the same knowledge');
    expect(body).toContain('Step 5 — Observe: record the type of help needed, not a daily percentage');
    expect(body).toContain('Step 6 — Adjust: change the level before changing the goal');
    expect(body).toContain('The Tiny Steps one-card home phonics check');
    expect(body).toContain('not a standardized intervention');
    expect(body).toContain('These are teaching observations, not diagnoses');
    expect(body).toContain('There is no research-defined universal home-phonics session length');

    expect(body).toContain('/blog/phonics-games-for-letter-sounds');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/online-phonics-games');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');

    expect(body).not.toMatch(/fixed 10-minute flow/i);
    expect(body).not.toMatch(/3-4 days/i);
    expect(body).not.toMatch(/1-2 weeks/i);
    expect(body).not.toMatch(/3-6 weeks/i);
    expect(body).not.toMatch(/6-8 weeks/i);
    expect(body).not.toMatch(/guaranteed? to read/i);
  });

  it('adds evidence, home-fit safeguards and five extractable FAQs', () => {
    const post = bySlug.get('phonics-activities-for-kids-at-home');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('set aside tasks that are too difficult');
    expect(body).toContain('Separate phonics practice from reading for pleasure');
    expect(body).toContain('The format is secondary to the cognitive work');
    expect(body).toContain('change the level or ask the teacher what prerequisite should come first');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /without worksheets/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how long should phonics practice/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /change phonics activities every day/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /activity is working/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ask a teacher for help/i.test(item.question))).toBe(true);
  });
});
