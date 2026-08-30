import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #22 quality lock', () => {
  it('owns the practical SATPIN-at-home launch routine without turning the sequence into a calendar deadline', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();
    expect(post?.title).toBe('SATPIN at Home: A Parent Launch Plan for Early Blending and Reading');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: how should parents start SATPIN at home?');
    expect(body).toContain('Who this SATPIN plan is for');
    expect(body).toContain('Why SATPIN is a useful early sound set');
    expect(body).toContain('Letter names and letter sounds: keep the jobs separate');
    expect(body).toContain('Use seven flexible practice sessions — not a seven-day deadline');
    expect(body).toContain('Session 1 — s and a: build clean sound recall');
    expect(body).toContain('Session 7 — read, spell and review');
    expect(body).toContain('A simple 10-minute SATPIN routine');
    expect(body).toContain('SATPIN word bank: keep every example decodable');
    expect(body).toContain('Three games that practise the skill without hiding it');
    expect(body).toContain('Tiny Steps readiness checkpoints: when is the child ready to move beyond SATPIN?');
    expect(body).toContain('If the child knows the sounds but cannot blend');
    expect(body).toContain('When home practice is not enough');
    expect(body).toContain('Mistakes to avoid during SATPIN practice');

    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids?level=1');
    expect(body).toContain('/letter-tracing-with-sounds-game');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/\bWeek\s+[12]\b/i);
    expect(body).not.toContain('Tin can');
    expect(body).not.toContain('Tan pan');
    expect(body).not.toContain('Nap in pan');
    expect(body).not.toMatch(/must (?:finish|complete) SATPIN in (?:seven|7) days/i);
    expect(body).not.toMatch(/guaranteed? to read/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
  });

  it('keeps the evidence layer, readiness boundary and answer-engine FAQs intact', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('SATPIN is one practical starting sequence, not a claim that every child or every phonics programme must begin in exactly the same order.');
    expect(body).toContain('This is a practice guide, not a diagnostic test for hearing, speech or language difficulties.');
    expect(body).toContain('Tiny Steps uses readiness checkpoints rather than calendar pressure.');
    expect(body).toContain('Successful decoding of an unfamiliar example is stronger evidence than reciting a memorised list.');
    expect(body).toContain('A child does not need perfection on every word.');
    expect(body).toContain('appropriately qualified health or speech-and-language professional');
    expect(body).toContain('It does not show that every child must complete SATPIN in exactly seven days.');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /all six SATPIN sounds at once/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /start blending SATPIN words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /How long should SATPIN take/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /letter names as well as sounds/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /still cannot read words/i.test(item.question))).toBe(true);
  });
});
