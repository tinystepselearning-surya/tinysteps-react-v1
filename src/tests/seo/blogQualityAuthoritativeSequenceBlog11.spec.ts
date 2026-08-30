import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #11 quality lock', () => {
  it('owns long-vowel pattern order and mix-up interpretation without prescribing one universal sequence', () => {
    const post = bySlug.get('long-vowel-sounds-for-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Long Vowel Sounds for Kids: Pattern Order, Practice, and Common Mix-Ups');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('teach long vowels as spelling patterns, not as one giant rule');
    expect(body).toContain('VCe or silent-e patterns');
    expect(body).toContain('Vowel teams');
    expect(body).toContain('Open-syllable long vowels');
    expect(body).toContain('There is no single evidence source that says every child must learn long-vowel patterns in one identical order');
    expect(body).toContain('systematic, explicit and cumulative');
    expect(body).toContain('The Tiny Steps long-vowel learning chain');
    expect(body).toContain('Common long-vowel mix-ups—and what they may mean');
    expect(body).toContain('Reading and spelling should be checked together');
    expect(body).toContain('There is no universal research-defined number of long-vowel words, minutes or practice days');

    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/phonics-long-vowels');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/r-controlled-vowels-explained');

    expect(body).not.toMatch(/master long vowels in \d+ (?:days|weeks|months)/i);
    expect(body).not.toMatch(/must learn silent[- ]e first/i);
    expect(body).not.toMatch(/\d+% accuracy across/i);
    expect(body).not.toMatch(/read \d+[-–]\d+ long[- ]vowel words/i);
  });

  it('keeps practice ownership separate, adds evidence and provides five extractable parent FAQs', () => {
    const post = bySlug.get('long-vowel-sounds-for-kids');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('That article owns the practical-activity intent; this guide owns pattern order, interpretation and common mix-ups');
    expect(body).toContain('editorial framework, not a standardized assessment');
    expect(body).toContain('they do not diagnose dyslexia or another learning condition');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /what are long vowel sounds/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /silent e always be taught before vowel teams/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /read a long-vowel word but spell it incorrectly/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many long-vowel patterns/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /move from long vowels to r-controlled vowels/i.test(item.question))).toBe(true);
  });
});
