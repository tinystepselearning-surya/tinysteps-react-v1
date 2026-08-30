import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #15 quality lock', () => {
  it('owns practical blending activities without cannibalizing the developmental path or daily routine', () => {
    const post = bySlug.get('phonics-blending-activities');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Blending Activities That Help Children Read Words Confidently');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('locate the blending break → choose the matching activity → model only what is needed → let the child retry → check a fresh word → transfer into matched text');
    expect(body).toContain('Activity 1 — Oral sound merging when the sound sequence itself is the problem');
    expect(body).toContain('Activity 2 — A sound slider for continuous left-to-right blending');
    expect(body).toContain('Activity 3 — Short decodable words with one fresh-word check');
    expect(body).toContain('Activity 4 — One-sound-change word chains to keep attention on the full sequence');
    expect(body).toContain('Activity 5 — Contrast two words that differ by one sound');
    expect(body).toContain('Activity 6 — Add taught digraphs or adjacent consonants without changing the blending principle');
    expect(body).toContain('Activity 7 — Sentence transfer after the word can be decoded accurately');
    expect(body).toContain('A simple correction routine: point back, prompt less, retry');
    expect(body).toContain('What blending progress should parents actually look for?');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-activities-for-kids-at-home');
    expect(body).toContain('/blog/phonics-blending-club');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');

    expect(body).not.toMatch(/\b\d+%\s+(?:accuracy|mastery|correct)/i);
    expect(body).not.toMatch(/master(?:y|ed).*\b\d+\s+(?:words|days|weeks)/i);
    expect(body).not.toMatch(/guaranteed?\s+(?:confidence|reading|to read)/i);
    expect(body).not.toMatch(/read fluently in \d+ (?:days|weeks|months)/i);
  });

  it('adds evidence, transfer safeguards and five extractable FAQs', () => {
    const post = bySlug.get('phonics-blending-activities');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('not a standardized blending assessment');
    expect(body).toContain('instructional observations, not diagnoses');
    expect(body).toContain('Oral-only blending is a useful scaffold, not a rule');
    expect(body).toContain('word-family recitation as proof of fresh-word decoding');
    expect(body).toContain('There is no universal research-defined number of correct words, minutes or practice days');
    expect(body).toContain('This article is educational guidance and cannot diagnose');
    expect(body).toContain('The word “confidently” in this article does not mean phonics practice guarantees a particular emotion');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /best phonics blending activity/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /two-sound words before CVC/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /word families good for blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /time my child/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /activity is working/i.test(item.question))).toBe(true);
  });
});
