import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #17 quality lock', () => {
  it('owns beginner phonics sequencing without imposing a universal commercial order or calendar', () => {
    const post = bySlug.get('phonics-rules-for-beginners');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Rules for Beginners: The Right Sequence and When to Move Ahead');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('systematic and cumulative');
    expect(body).toContain('not one universal commercial programme order');
    expect(body).toContain('what is already taught → can the child retrieve it → can the child use it in a fresh word → can the child spell with it → does it hold in matched text?');
    expect(body).toContain('A practical beginner progression for parents to understand');
    expect(body).toContain('Build phonemic awareness while introducing a small useful sound–spelling set');
    expect(body).toContain('Apply the taught set immediately in blending and segmenting');
    expect(body).toContain('Expand consonants and common grapheme patterns cumulatively');
    expect(body).toContain('Introduce common-exception words gradually inside the sequence');
    expect(body).toContain('Add long-vowel and other common patterns in a coherent programme order');
    expect(body).toContain('Keep extending from words into matched sentences and text');
    expect(body).toContain('The Tiny Steps five-question “move ahead or review?” check');

    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/blog/sight-words-or-phonics-first');
    expect(body).toContain('/blog/long-vowel-sounds-for-kids');
    expect(body).toContain('/blog/r-controlled-vowels-explained');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/online-phonics-classes-vs-school');

    expect(body).not.toMatch(/one rule family at a time for 3-5 days/i);
    expect(body).not.toMatch(/CVC stability in 2-4 weeks/i);
    expect(body).not.toMatch(/digraph\/blend control in 4-8 weeks/i);
    expect(body).not.toMatch(/after 6-8 weeks/i);
    expect(body).not.toMatch(/one focused rule family per week/i);
    expect(body).not.toMatch(/must (?:always )?follow.*CVC.*digraph.*long[- ]vowel/i);
    // Explicitly rejecting a percentage threshold is safe; only prescriptive cut-offs should fail this lock.
    expect(body).not.toMatch(/(?:must|should|need(?:s)? to|has to|require(?:s|d)?|reach|achieve|move ahead (?:at|after|once)|advance (?:at|after|once))[^.\n]{0,80}\b(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
    expect(body).not.toMatch(/\b(?:90|95|100)%\s+(?:accuracy|mastery|correct)[^.\n]{0,80}\b(?:required|requirement|target|cut-?off|before (?:moving|advancing)|to (?:move ahead|advance))/i);
  });

  it('adds evidence, move-ahead safeguards and five extractable FAQs', () => {
    const post = bySlug.get('phonics-rules-for-beginners');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('not a standardized phonics assessment');
    expect(body).toContain('not pass/fail thresholds');
    expect(body).toContain('There is no research-defined rule such as “two perfect sessions”, “90% accuracy” or “one rule family per week”');
    expect(body).toContain('high-frequency words as visual shapes');
    expect(body).toContain('A sequencing problem should not be used as a diagnosis');
    expect(body).toContain('The cited evidence supports systematic, explicit, incremental and cumulative phonics');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /rules should beginners learn first/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /CVC words have to come before digraphs/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ready for the next phonics pattern/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /know phonics rules but still guess/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /new phonics rule every week/i.test(item.question))).toBe(true);
  });
});
