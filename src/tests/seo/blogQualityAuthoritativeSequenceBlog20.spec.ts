import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #20 quality lock', () => {
  it('owns the evidence and terminology question without collapsing high-frequency, irregular and sight words into one memorization method', () => {
    const post = bySlug.get('science-of-phonics-learning');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics vs Sight Words: What Helps Children Read Better');
    expect(post?.author).toBe('Priya');
    expect(post?.date).toBe('2025-12-22');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('phonics and “sight words” are not equal competing methods');
    expect(body).toContain('systematic phonics provides the transferable system for reading unfamiliar words');
    expect(body).toContain('A high-frequency word is simply a word that appears often');
    expect(body).toContain('An irregular or common-exception word contains a sound–spelling relationship that is unusual or not yet taught');
    expect(body).toContain('automatic recognition is the outcome, not a reason to teach every common word as a visual shape');
    expect(body).toContain('high-frequency words can be **regular or irregular**');
    expect(body).toContain('permanently irregular');
    expect(body).toContain('temporarily irregular');
    expect(body).toContain('The Tiny Steps four-route word-reading framework');
    expect(body).toContain('Route A — regular word using taught phonics');
    expect(body).toContain('Route B — high-frequency word that is regular for the child’s current knowledge');
    expect(body).toContain('Route C — partly irregular or common-exception word');
    expect(body).toContain('Route D — word containing a pattern not yet taught');
    expect(body).toContain('What automatic word recognition should look like');

    expect(body).not.toContain('Most children need balance, not extremes');
    expect(body).not.toContain('Sight words give speed');
    expect(body).not.toMatch(/(?:teach|learn|memorize|memorise)\s+(?:exactly\s+)?\d+[-–]\d+\s+(?:sight|tricky|high-frequency)/i);
    expect(body).not.toMatch(/(?:must|should|need(?:s)? to|has to|require(?:s|d)?|reach|achieve)[^.\n]{0,80}\b(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
  });

  it('protects Blogs #21 and #47, adds evidence and preserves non-diagnostic and wider-reading boundaries', () => {
    const post = bySlug.get('science-of-phonics-learning');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(6);
    expect(body).toContain('This Blog #20 is the **evidence and terminology owner**');
    expect(body).toContain('Blog #21, [Synthetic Phonics vs Traditional Reading](/blog/synthetic-phonics-vs-traditional-reading)');
    expect(body).toContain('Blog #47, [Should Children Memorize Sight Words or Learn Phonics First?](/blog/sight-words-or-phonics-first)');
    expect(body).toContain('Blog #4, [Digraphs and Tricky Words](/blog/digraphs-and-tricky-words)');
    expect(body).toContain('Blog #43, [How to Improve Reading Fluency in Children](/blog/how-to-improve-reading-fluency-in-children)');
    expect(body).toContain('phonics improves reading accuracy but does not automatically guarantee comprehension');
    expect(body).toContain('Difficulty with decoding, high-frequency words or irregular words is not by itself evidence of dyslexia');
    expect(body).toContain('The Tiny Steps four-route framework is an editorial synthesis');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /phonics better than sight words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /high-frequency words the same as sight words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /irregular words be memorized as whole shapes/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sound out every word forever/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /knows many sight-word cards but cannot read new words/i.test(item.question))).toBe(true);
  });
});
