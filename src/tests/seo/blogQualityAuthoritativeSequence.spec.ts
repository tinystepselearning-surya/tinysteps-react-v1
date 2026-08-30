import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative 76-blog quality sequence', () => {
  it('locks Blog #1 as the realistic parent guide to observable phonics benefits', () => {
    const post = bySlug.get('benefits-of-phonics-for-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Benefits of Phonics for Kids: What Parents Usually Notice First');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('What parents often notice first: five practical changes');
    expect(body).toContain('The Tiny Steps five-signal benefit check');
    expect(body).toContain('What phonics does not automatically fix');
    expect(body).toContain('How to check whether the benefit is real rather than memorised');
    expect(body).toContain('When progress looks uneven');
    expect(body).toContain('When to ask for more support');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-phonics-builds-reading-confidence');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/phonics-diagnostics');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('weeks 1-3 fewer random guesses');
    expect(body).not.toContain('weeks 3-6 stronger blending');
    expect(body).not.toContain('weeks 6-10 better spelling transfer');
    expect(body).not.toContain('after 8-10 weeks');
    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toMatch(/phonics support speaking confidence too\?/i);
  });

  it('gives authoritative Blog #1 genuine evidence and answer-engine FAQs', () => {
    const post = bySlug.get('benefits-of-phonics-for-kids');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /first benefit of phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /improve spelling/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /comprehension/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /confident/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decoding or memorising/i.test(item.question))).toBe(true);
  });

  it('locks Blog #2 as the ABC-to-reading bottleneck guide rather than a generic phonics article', () => {
    const post = bySlug.get('child-knows-abc-but-cannot-read');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Child Knows ABC but Cannot Read: What Parents Should Check First');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('ABC knowledge has three different levels');
    expect(body).toContain('The Tiny Steps six-step ABC-to-reading check');
    expect(body).toContain('Step 1 — Can your child recognise the printed letter?');
    expect(body).toContain('Step 3 — Can your child blend sounds orally without print?');
    expect(body).toContain('Step 5 — Can your child read a fresh word, not only a memorised one?');
    expect(body).toContain('What the first weak step usually means');
    expect(body).toContain('The important boundary with the letter-sounds problem');
    expect(body).toContain('What not to do when ABC is ahead of reading');
    expect(body).toContain('When to ask for a closer review');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/phonics-diagnostics');
    expect(body).toContain('/phonics');

    expect(body).not.toContain('run this simple routine for 2-3 weeks before judging progress');
    expect(body).not.toContain('Aim for 10 minutes a day, 5-6 days a week');
    expect(body).not.toContain('After 3 classes');
    expect(body).not.toContain('after 6-8 weeks');
    expect(body).not.toContain('Book Free 35-Minute Demo');
    expect(body).not.toMatch(/prioritize letter sounds for reading/i);
  });

  it('gives authoritative Blog #2 evidence, diagnostic boundaries and extractable FAQs', () => {
    const post = bySlug.get('child-knows-abc-but-cannot-read');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('it does not diagnose dyslexia or any other condition');
    expect(body).toContain('editorial guidance, not a standardized research test');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /know ABC but cannot read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /letter names or letter sounds/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /check first/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /knows letter sounds but still cannot read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ready to read books independently/i.test(item.question))).toBe(true);
  });
});
