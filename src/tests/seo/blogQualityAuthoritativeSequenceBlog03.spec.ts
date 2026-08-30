import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #3 quality lock', () => {
  it('owns the first CVC decoding milestone without collapsing into generic three-letter-word practice', () => {
    const post = bySlug.get('cvc-words-explained-for-parents');
    expect(post).toBeDefined();
    expect(post?.title).toBe('CVC Words Explained for Parents: The First Real Decoding Milestone');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('CVC is a word structure, not simply “any three-letter word”');
    expect(body).toContain('The Tiny Steps six-step CVC decoding ladder');
    expect(body).toContain('Step 1 — Hear the sounds in order');
    expect(body).toContain('Step 4 — Check a fresh CVC word');
    expect(body).toContain('Step 5 — Reverse the process through spelling');
    expect(body).toContain('Word families can help—but they can also hide memorisation');
    expect(body).toContain('Common CVC mistakes and what they usually tell you');
    expect(body).toContain('How do you know CVC decoding is becoming secure?');
    expect(body).toContain('When should a child move beyond CVC words?');

    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toContain('Checklist when choosing a phonics class');
    expect(body).not.toContain('Progress timeline parents can expect');
    expect(body).toContain('Do not use a universal target such as “50 CVC words”');
    expect(body).not.toMatch(
      /(?:target(?:\s+of)?|goal(?:\s+of)?|aim(?:s)?\s+for|(?:must|should|needs?\s+to)\s+(?:learn|read|master|memorise|know))\s+“?50 CVC words/i,
    );
  });

  it('adds evidence, transfer checks, boundaries and extractable CVC FAQs', () => {
    const post = bySlug.get('cvc-words-explained-for-parents');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('editorial teaching guidance, not a standardized research protocol');
    expect(body).toContain('cannot diagnose dyslexia');
    expect(body).toMatch(/fresh,? regular CVC words/i);
    expect(body).toContain('This article does not prescribe a research-defined daily CVC dose');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /what are CVC words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /why are CVC words important/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many CVC words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /word families or mixed lists/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /digraphs or blends/i.test(item.question))).toBe(true);
  });
});
