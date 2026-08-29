import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #5 quality lock', () => {
  it('owns the stage-by-stage blending pathway without fixed-calendar progression', () => {
    const post = bySlug.get('how-kids-learn-blending');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Blending is a verb—not the same thing as a consonant blend');
    expect(body).toContain('The Tiny Steps five-stage blending path');
    expect(body).toContain('Stage 1 — Oral blending: can the child merge sounds without print?');
    expect(body).toContain('Stage 2 — Print connection: can the child retrieve taught sounds and blend a simple word?');
    expect(body).toContain('Stage 3 — Continuous blending: can the child keep the sound sequence connected?');
    expect(body).toContain('Stage 4 — Fresh-word transfer: can the child blend an unfamiliar decodable word?');
    expect(body).toContain('Stage 5 — Connected-text transfer: can the child keep blending inside a sentence?');
    expect(body).toContain('How to decide when a child is ready to move to the next blending stage');
    expect(body).toContain('Common blending errors and what they usually tell you');
    expect(body).toContain('A simple parent practice structure without a fixed daily dosage');

    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('5 days oral + print CVC');
    expect(body).not.toContain('next 5 days add mixed CVC review');
    expect(body).not.toContain('step back one stage for 2 days');
    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toContain('Checklist when choosing a phonics class');
    expect(body).not.toContain('Progress timeline parents can expect');
  });

  it('adds evidence, stage-exit signals, boundaries and extractable blending FAQs', () => {
    const post = bySlug.get('how-kids-learn-blending');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('editorial teaching guidance rather than a standardized research protocol');
    expect(body).toContain('cannot diagnose dyslexia');
    expect(body).toContain('Accuracy — the child preserves the sound sequence');
    expect(body).toContain('Transfer — the child can blend a fresh word built from taught correspondences');
    expect(body).toContain('This article does not prescribe a research-defined number of minutes or days per week');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /what is blending in phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /oral blending before printed blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /know letter sounds but cannot blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ready to move to harder blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /slow blending/i.test(item.question))).toBe(true);
  });
});
