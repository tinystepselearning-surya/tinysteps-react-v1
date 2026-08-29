import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #4 quality lock', () => {
  it('owns the digraph-versus-tricky-word decision without teaching whole-word guessing', () => {
    const post = bySlug.get('digraphs-and-tricky-words');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Digraphs and Tricky Words: What to Decode and What to Remember');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Digraphs are still phonics: two letters can represent one sound');
    expect(body).toContain('A digraph is not the same as a consonant blend');
    expect(body).toContain('“High-frequency”, “sight word” and “tricky word” are not the same thing');
    expect(body).toContain('Some tricky words are only temporarily tricky');
    expect(body).toContain('The Tiny Steps four-question decode-or-remember check');
    expect(body).toContain('Are all the sound-spelling correspondences already taught?');
    expect(body).toContain('Is one part regular in English but not taught yet?');
    expect(body).toContain('Is one correspondence genuinely unusual?');
    expect(body).toContain('How to handle a tricky word without encouraging guessing');
    expect(body).toContain('What parents should avoid');
    expect(body).toContain('How to know when a digraph or tricky word is becoming secure');

    expect(body).toContain('/blog/phonics-tricky-words');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toContain('Checklist when choosing a phonics class');
    expect(body).not.toContain('Progress timeline parents can expect');
    expect(body).not.toMatch(/memorise every common word as a visual shape/i);
  });

  it('adds evidence, scope boundaries and extractable digraph/tricky-word FAQs', () => {
    const post = bySlug.get('digraphs-and-tricky-words');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('editorial teaching guidance rather than a standardized research protocol');
    expect(body).toContain('it does not diagnose dyslexia');
    expect(body).toContain('High frequency does not make a regular word irregular');
    expect(body).toContain('Blog #28');
    expect(body).toContain('Pronunciation and what counts as unusual can vary slightly by accent');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /what is a digraph/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /high-frequency words tricky/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /memorise tricky words by sight/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /digraph and a blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /when to add more digraphs or tricky words/i.test(item.question))).toBe(true);
  });
});
